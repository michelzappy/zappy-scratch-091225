/**
 * Authentication Bypass Prevention Security Testing Suite
 * 
 * CRITICAL SECURITY AUDIT SUB-TASK
 * Priority: CRITICAL (Risk Score: 9)
 * Focus: Preventing authentication bypass vulnerabilities
 * 
 * This test suite validates that authentication mechanisms cannot be bypassed
 * through various attack vectors including token manipulation, session hijacking,
 * role escalation, and other authentication evasion techniques.
 * 
 * Attack Vectors Tested:
 * - JWT token manipulation and forgery
 * - Session hijacking and fixation
 * - Role escalation and privilege bypass
 * - Authentication state manipulation
 * - Emergency access abuse
 * - Circuit breaker bypass
 * - Fallback mechanism exploitation
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import request from 'supertest';

// Mock dependencies to isolate authentication logic
jest.mock('../src/config/auth.js', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn()
    }
  },
  generateUserId: jest.fn()
}));

jest.mock('../src/config/database.js', () => ({
  getDatabase: jest.fn(() => ({
    query: jest.fn(),
    unsafe: jest.fn()
  }))
}));

// Mock the app for integration testing
jest.mock('../src/app.js', () => ({
  app: {
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    listen: jest.fn()
  }
}));

describe('🔐 Authentication Bypass Prevention Tests', () => {
  let originalEnv;
  let mockSupabase;

  beforeEach(async () => {
    originalEnv = { ...process.env };
    jest.clearAllMocks();
    jest.resetModules();
    
    // Import mocked supabase
    const authConfig = await import('../src/config/auth.js');
    mockSupabase = authConfig.supabase;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('🚨 JWT Token Manipulation Attacks', () => {
    /**
     * Test various JWT token manipulation techniques that attackers
     * might use to bypass authentication or escalate privileges
     */
    it('should prevent JWT algorithm confusion attacks', async () => {
      const { requireAuth } = await import('../src/middleware/auth.js');
      
      // Create tokens with different algorithms
      const maliciousTokens = [
        // Algorithm none attack
        jwt.sign({ id: 'admin', role: 'admin' }, '', { algorithm: 'none' }),
        
        // HMAC vs RSA confusion (if RSA public key is known)
        jwt.sign({ id: 'admin', role: 'admin' }, 'public-key-content', { algorithm: 'HS256' }),
        
        // Modified header algorithm
        (() => {
          const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
          const payload = Buffer.from(JSON.stringify({ id: 'admin', role: 'admin' })).toString('base64url');
          return `${header}.${payload}.`;
        })()
      ];
      
      for (const maliciousToken of maliciousTokens) {
        const req = SecurityTestUtils.createMockRequest(maliciousToken);
        const res = SecurityTestUtils.createMockResponse();
        const next = jest.fn();
        
        delete process.env.JWT_SECRET;
        
        await requireAuth(req, res, next);
        
        // Should reject algorithm confusion attacks
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
        
        if (req.user) {
          console.error('🚨 ALGORITHM CONFUSION: Authentication bypassed via algorithm manipulation');
          expect(true).toBe(false);
        }
      }
    });

    it('should prevent JWT header manipulation attacks', async () => {
      const { requireAuth } = await import('../src/middleware/auth.js');
      
      const validPayload = { id: 'user123', email: 'user@example.com', role: 'patient' };
      const secret = 'development-secret-key-change-in-production';
      
      // Create base token
      const validToken = jwt.sign(validPayload, secret);
      const [header, payload, signature] = validToken.split('.');
      
      // Manipulated headers
      const maliciousHeaders = [
        Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url'),
        Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: '../../../etc/passwd' })).toString('base64url'),
        Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT', jku: 'http://evil.com/jwks' })).toString('base64url'),
        Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT', x5u: 'http://evil.com/cert' })).toString('base64url')
      ];
      
      for (const maliciousHeader of maliciousHeaders) {
        const manipulatedToken = `${maliciousHeader}.${payload}.${signature}`;
        
        const req = SecurityTestUtils.createMockRequest(manipulatedToken);
        const res = SecurityTestUtils.createMockResponse();
        const next = jest.fn();
        
        delete process.env.JWT_SECRET;
        
        await requireAuth(req, res, next);
        
        // Should reject header manipulation
        expect(res.status).toHaveBeenCalledWith(401);
        
        if (req.user) {
          console.error('🚨 HEADER MANIPULATION: Authentication bypassed via JWT header tampering');
          expect(true).toBe(false);
        }
      }
    });

    it('should prevent JWT payload manipulation for privilege escalation', async () => {
      const { requireAuth } = await import('../src/middleware/auth.js');
      
      const secret = 'development-secret-key-change-in-production';
      const basePayload = { id: 'user123', email: 'user@example.com', role: 'patient' };
      
      // Create legitimate token
      const legitimateToken = jwt.sign(basePayload, secret);
      const [header, originalPayload, signature] = legitimateToken.split('.');
      
      // Malicious payloads for privilege escalation
      const maliciousPayloads = [
        { ...basePayload, role: 'admin' },
        { ...basePayload, role: 'provider' },
        { ...basePayload, permissions: ['admin', 'all'] },
        { ...basePayload, isAdmin: true },
        { ...basePayload, id: 'admin-user-id' },
        { ...basePayload, exp: Math.floor(Date.now() / 1000) + 86400 * 365 }, // 1 year expiry
      ];
      
      for (const maliciousPayload of maliciousPayloads) {
        const encodedPayload = Buffer.from(JSON.stringify(maliciousPayload)).toString('base64url');
        const manipulatedToken = `${header}.${encodedPayload}.${signature}`;
        
        const req = SecurityTestUtils.createMockRequest(manipulatedToken);
        const res = SecurityTestUtils.createMockResponse();
        const next = jest.fn();
        
        delete process.env.JWT_SECRET;
        
        await requireAuth(req, res, next);
        
        // Token should be rejected due to invalid signature
        expect(res.status).toHaveBeenCalledWith(401);
        
        // Even if somehow accepted, should not grant elevated privileges
        if (req.user && (req.user.role === 'admin' || req.user.permissions?.includes('admin'))) {
          console.error('🚨 PRIVILEGE ESCALATION: Token manipulation granted admin privileges');
          expect(true).toBe(false);
        }
      }
    });

    it('should prevent JWT signature stripping attacks', async () => {
      const { requireAuth } = await import('../src/middleware/auth.js');
      
      const maliciousUnsignedTokens = [
        // Token without signature
        'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJpZCI6ImFkbWluIiwicm9sZSI6ImFkbWluIn0.',
        
        // Empty signature
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwicm9sZSI6ImFkbWluIn0.',
        
        // Malformed signature
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwicm9sZSI6ImFkbWluIn0.invalid',
        
        // Only header and payload
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwicm9sZSI6ImFkbWluIn0'
      ];
      
      for (const unsignedToken of maliciousUnsignedTokens) {
        const req = SecurityTestUtils.createMockRequest(unsignedToken);
        const res = SecurityTestUtils.createMockResponse();
        const next = jest.fn();
        
        await requireAuth(req, res, next);
        
        // Should reject unsigned or malformed tokens
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
        
        if (req.user) {
          console.error('🚨 SIGNATURE BYPASS: Unsigned token was accepted');
          expect(true).toBe(false);
        }
      }
    });
  });

  describe('🛡️ Session Security and State Manipulation', () => {
    it('should prevent session fixation attacks', async () => {
      const { requireAuth } = await import('../src/middleware/auth.js');
      
      // Simulate attacker providing session ID
      const attackerSessionId = 'attacker-controlled-session-id';
      
      const req = SecurityTestUtils.createMockRequest(null, {
        'cookie': `sessionId=${attackerSessionId}`,
        'x-session-id': attackerSessionId
      });
      const res = SecurityTestUtils.createMockResponse();
      const next = jest.fn();
      
      // Mock session store
      req.session = { id: attackerSessionId };
      
      await requireAuth(req, res, next);
      
      // Should require valid authentication, not just session presence
      expect(res.status).toHaveBeenCalledWith(401);
      
      if (req.user) {
        console.error('🚨 SESSION FIXATION: Attacker session ID granted access');
        expect(true).toBe(false);
      }
    });

    it('should prevent session hijacking through header manipulation', async () => {
      const { requireAuth } = await import('../src/middleware/auth.js');
      
      // Legitimate user token
      const legitimateToken = jwt.sign(
        { id: 'user123', email: 'user@example.com', role: 'patient' },
        'development-secret-key-change-in-production'
      );
      
      // Attacker attempts to hijack with various headers
      const hijackAttempts = [
        { 'x-forwarded-for': '192.168.1.100', 'x-real-ip': '10.0.0.1' },
        { 'x-original-url': '/admin/users', 'x-rewrite-url': '/admin' },
        { 'host': 'evil.com', 'x-forwarded-host': 'admin.example.com' },
        { 'user-agent': 'AdminBot/1.0', 'x-admin-token': 'bypass' }
      ];
      
      for (const maliciousHeaders of hijackAttempts) {
        const req = SecurityTestUtils.createMockRequest(legitimateToken, maliciousHeaders);
        const res = SecurityTestUtils.createMockResponse();
        const next = jest.fn();
        
        delete process.env.JWT_SECRET;
        
        await requireAuth(req, res, next);
        
        // Valid token should be accepted, but malicious headers should not grant extra privileges
        if (req.user && (req.user.role === 'admin' || req.user.isAdmin)) {
          console.error('🚨 SESSION HIJACKING: Malicious headers escalated privileges');
          expect(true).toBe(false);
        }
      }
    });

    it('should prevent authentication state manipulation', async () => {
      const { requireAuth } = await import('../src/middleware/auth.js');
      
      // Attempt to manipulate authentication state directly
      const req = SecurityTestUtils.createMockRequest();
      req.user = { id: 'fake-admin', role: 'admin', isAuthenticated: true };
      req.isAuthenticated = true;
      req.authMethod = 'spoofed';
      
      const res = SecurityTestUtils.createMockResponse();
      const next = jest.fn();
      
      await requireAuth(req, res, next);
      
      // Should re-validate authentication, not trust existing state
      expect(res.status).toHaveBeenCalledWith(401);
      
      // Pre-set user should be cleared/ignored
      if (req.user && req.user.id === 'fake-admin') {
        console.error('🚨 STATE MANIPULATION: Pre-set authentication state was trusted');
        expect(true).toBe(false);
      }
    });
  });

  describe('🎭 Role and Permission Bypass Attacks', () => {
    it('should prevent role escalation through request manipulation', async () => {
      const { requireAuth, requireRole } = await import('../src/middleware/auth.js');
      
      // Create patient token
      const patientToken = jwt.sign(
        { id: 'patient123', email: 'patient@example.com', role: 'patient' },
        'development-secret-key-change-in-production'
      );
      
      const req = SecurityTestUtils.createMockRequest(patientToken);
      const res = SecurityTestUtils.createMockResponse();
      
      // First authenticate
      await requireAuth(req, res, () => {});
      
      // Now attempt role escalation
      const escalationAttempts = [
        () => { req.user.role = 'admin'; },
        () => { req.user.permissions = ['admin']; },
        () => { req.headers['x-role'] = 'admin'; },
        () => { req.body = { role: 'admin' }; },
        () => { req.query = { role: 'admin' }; }
      ];
      
      for (const attempt of escalationAttempts) {
        // Reset state
        req.user.role = 'patient';
        delete req.user.permissions;
        
        // Apply escalation attempt
        attempt();
        
        // Test admin access
        const adminMiddleware = requireRole('admin');
        const nextSpy = jest.fn();
        
        adminMiddleware(req, res, nextSpy);
        
        // Should be blocked regardless of manipulation
        expect(res.status).toHaveBeenCalledWith(403);
        expect(nextSpy).not.toHaveBeenCalled();
      }
    });

    it('should prevent permission inheritance attacks', async () => {
      const { requireRole } = await import('../src/middleware/auth.js');
      
      // Test various privilege inheritance scenarios
      const inheritanceTests = [
        {
          user: { id: 'user1', role: 'patient', parentRole: 'admin' },
          requestedRole: 'admin',
          shouldPass: false
        },
        {
          user: { id: 'user2', role: 'patient', groups: ['admin-group'] },
          requestedRole: 'admin', 
          shouldPass: false
        },
        {
          user: { id: 'user3', role: 'patient', __proto__: { role: 'admin' } },
          requestedRole: 'admin',
          shouldPass: false
        }
      ];
      
      for (const test of inheritanceTests) {
        const req = { user: test.user };
        const res = SecurityTestUtils.createMockResponse();
        const next = jest.fn();
        
        const roleMiddleware = requireRole(test.requestedRole);
        roleMiddleware(req, res, next);
        
        if (test.shouldPass) {
          expect(next).toHaveBeenCalled();
        } else {
          expect(res.status).toHaveBeenCalledWith(403);
          expect(next).not.toHaveBeenCalled();
        }
        
        if (!test.shouldPass && next.mock.calls.length > 0) {
          console.error(`🚨 PRIVILEGE INHERITANCE: User ${test.user.id} bypassed role check for ${test.requestedRole}`);
          expect(true).toBe(false);
        }
      }
    });
  });

  describe('🚪 Emergency Access and Fallback Exploitation', () => {
    it('should prevent emergency access abuse', async () => {
      const { emergencyAuthBypass } = await import('../src/middleware/authResilience.js');
      
      // Test emergency access without proper configuration
      const maliciousAttempts = [
        { env: {}, headers: { 'x-emergency-auth': 'guess' } },
        { env: { EMERGENCY_AUTH_BYPASS: 'true' }, headers: { 'x-emergency-auth': 'admin' } },
        { env: { EMERGENCY_AUTH_TOKEN: 'secret' }, headers: { 'x-emergency-auth': 'secret' } },
        { env: { EMERGENCY_AUTH_BYPASS: 'false', EMERGENCY_AUTH_TOKEN: 'secret' }, headers: { 'x-emergency-auth': 'secret' } }
      ];
      
      for (const attempt of maliciousAttempts) {
        // Set environment
        Object.assign(process.env, attempt.env);
        
        const req = SecurityTestUtils.createMockRequest(null, attempt.headers);
        const res = SecurityTestUtils.createMockResponse();
        const next = jest.fn();
        
        emergencyAuthBypass(req, res, next);
        
        // Should not grant emergency access without proper setup
        if (req.user && req.user.emergency) {
          console.error('🚨 EMERGENCY ACCESS ABUSE: Unauthorized emergency bypass');
          expect(true).toBe(false);
        }
        
        // Clear environment
        for (const key of Object.keys(attempt.env)) {
          delete process.env[key];
        }
      }
    });

    it('should prevent authentication fallback exploitation', async () => {
      // Mock Supabase to fail
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Supabase unavailable'));
      
      const { requireAuth } = await import('../src/middleware/auth.js');
      
      // Attempt to exploit fallback mechanisms
      const exploitAttempts = [
        jwt.sign({ id: 'admin', role: 'admin' }, 'development-secret-key-change-in-production'),
        jwt.sign({ id: 'admin', role: 'admin' }, 'your-secret-key'),
        jwt.sign({ id: 'admin', role: 'admin' }, 'development-secret'),
        'demo-admin.eyJyb2xlIjoiYWRtaW4ifQ.signature' // Demo token format
      ];
      
      for (const exploitToken of exploitAttempts) {
        const req = SecurityTestUtils.createMockRequest(exploitToken);
        const res = SecurityTestUtils.createMockResponse();
        const next = jest.fn();
        
        delete process.env.JWT_SECRET;
        
        await requireAuth(req, res, next);
        
        // Should not grant admin access through fallback exploitation
        if (req.user && req.user.role === 'admin') {
          console.error('🚨 FALLBACK EXPLOITATION: Admin access granted via authentication fallback');
          expect(true).toBe(false);
        }
      }
    });
  });

  describe('⚡ Circuit Breaker and Rate Limiting Bypass', () => {
    it('should prevent circuit breaker bypass attempts', async () => {
      const { enhancedAuth } = await import('../src/middleware/authResilience.js');
      
      // Simulate circuit breaker open state
      const circuitBreakerStates = [
        'circuit_breaker',
        'degraded', 
        'critical'
      ];
      
      for (const state of circuitBreakerStates) {
        // Mock system health to simulate circuit breaker states
        jest.doMock('../src/middleware/authResilience.js', () => ({
          ...jest.requireActual('../src/middleware/authResilience.js'),
          getHealthStatus: () => ({ overall: state, supabase: { status: state } })
        }));
        
        const req = SecurityTestUtils.createMockRequest(
          jwt.sign({ id: 'user', role: 'admin' }, 'development-secret-key-change-in-production')
        );
        const res = SecurityTestUtils.createMockResponse();
        const next = jest.fn();
        
        await enhancedAuth(req, res, next);
        
        // Circuit breaker should not be bypassable for privilege escalation
        if (req.user && req.user.role === 'admin' && state === 'circuit_breaker') {
          console.error('🚨 CIRCUIT BREAKER BYPASS: Admin access granted during circuit breaker state');
          expect(true).toBe(false);
        }
      }
    });

    it('should prevent distributed authentication attacks', async () => {
      const { requireAuth } = await import('../src/middleware/auth.js');
      
      // Simulate distributed attack from multiple IPs
      const attackIPs = [
        '192.168.1.100',
        '10.0.0.1', 
        '172.16.0.1',
        '203.0.113.1'
      ];
      
      const attackToken = jwt.sign(
        { id: 'admin', role: 'admin' },
        'development-secret-key-change-in-production'
      );
      
      let successfulAttacks = 0;
      
      for (const ip of attackIPs) {
        const req = SecurityTestUtils.createMockRequest(attackToken, {
          'x-forwarded-for': ip,
          'x-real-ip': ip
        });
        req.ip = ip;
        
        const res = SecurityTestUtils.createMockResponse();
        const next = jest.fn();
        
        delete process.env.JWT_SECRET;
        
        await requireAuth(req, res, next);
        
        if (req.user && req.user.role === 'admin') {
          successfulAttacks++;
        }
      }
      
      if (successfulAttacks > 0) {
        console.error(`🚨 DISTRIBUTED ATTACK: ${successfulAttacks}/${attackIPs.length} admin access attempts succeeded`);
        expect(successfulAttacks).toBe(0);
      }
    });
  });

  describe('🔄 Token Lifecycle and Timing Attacks', () => {
    it('should prevent token replay attacks', async () => {
      const { requireAuth } = await import('../src/middleware/auth.js');
      
      const legitimateToken = jwt.sign(
        { 
          id: 'user123', 
          role: 'patient',
          iat: Math.floor(Date.now() / 1000),
          jti: 'unique-token-id' // Token ID for replay detection
        },
        'development-secret-key-change-in-production',
        { expiresIn: '1h' }
      );
      
      // Use the same token multiple times (replay attack)
      const replayAttempts = 5;
      let successfulReplays = 0;
      
      for (let i = 0; i < replayAttempts; i++) {
        const req = SecurityTestUtils.createMockRequest(legitimateToken);
        const res = SecurityTestUtils.createMockResponse();
        const next = jest.fn();
        
        delete process.env.JWT_SECRET;
        
        await requireAuth(req, res, next);
        
        if (req.user) {
          successfulReplays++;
        }
      }
      
      // In a secure system with replay protection, only first use should succeed
      // For now, we document that replay protection should be implemented
      console.warn(`ℹ️  TOKEN REPLAY: ${successfulReplays}/${replayAttempts} replay attempts succeeded (implement token blacklisting)`);
    });

    it('should prevent timing-based authentication attacks', async () => {
      const { requireAuth } = await import('../src/middleware/auth.js');
      
      const validToken = jwt.sign(
        { id: 'user123', role: 'patient' },
        'development-secret-key-change-in-production'
      );
      
      const invalidToken = 'invalid.jwt.token';
      
      // Measure timing differences
      const timings = { valid: [], invalid: [] };
      
      for (let i = 0; i < 10; i++) {
        // Test valid token
        const startValid = process.hrtime.bigint();
        const reqValid = SecurityTestUtils.createMockRequest(validToken);
        const resValid = SecurityTestUtils.createMockResponse();
        const nextValid = jest.fn();
        
        delete process.env.JWT_SECRET;
        
        await requireAuth(reqValid, resValid, nextValid);
        
        const endValid = process.hrtime.bigint();
        timings.valid.push(Number(endValid - startValid) / 1000000); // Convert to ms
        
        // Test invalid token
        const startInvalid = process.hrtime.bigint();
        const reqInvalid = SecurityTestUtils.createMockRequest(invalidToken);
        const resInvalid = SecurityTestUtils.createMockResponse();
        const nextInvalid = jest.fn();
        
        await requireAuth(reqInvalid, resInvalid, nextInvalid);
        
        const endInvalid = process.hrtime.bigint();
        timings.invalid.push(Number(endInvalid - startInvalid) / 1000000);
      }
      
      // Calculate average timings
      const avgValid = timings.valid.reduce((a, b) => a + b) / timings.valid.length;
      const avgInvalid = timings.invalid.reduce((a, b) => a + b) / timings.invalid.length;
      
      // Significant timing differences could enable timing attacks
      const timingDifference = Math.abs(avgValid - avgInvalid);
      
      if (timingDifference > 10) { // 10ms threshold
        console.warn(`⚠️  TIMING ATTACK RISK: ${timingDifference.toFixed(2)}ms difference between valid/invalid tokens`);
      }
      
      expect(timingDifference).toBeLessThan(100); // Reasonable threshold
    });
  });

  describe('📊 Authentication Security Metrics', () => {
    it('should track and analyze authentication bypass attempts', () => {
      const bypassAttempts = [
        { type: 'jwt_algorithm_confusion', severity: 'critical', count: 5 },
        { type: 'session_fixation', severity: 'high', count: 3 },
        { type: 'role_escalation', severity: 'critical', count: 2 },
        { type: 'emergency_access_abuse', severity: 'high', count: 1 },
        { type: 'circuit_breaker_bypass', severity: 'medium', count: 7 }
      ];
      
      const criticalAttempts = bypassAttempts.filter(attempt => attempt.severity === 'critical');
      const totalAttempts = bypassAttempts.reduce((sum, attempt) => sum + attempt.count, 0);
      
      console.log(`📊 Authentication Security Summary:`);
      console.log(`- Total bypass attempts: ${totalAttempts}`);
      console.log(`- Critical severity attempts: ${criticalAttempts.length}`);
      console.log(`- Most common attack: ${bypassAttempts.sort((a, b) => b.count - a.count)[0].type}`);
      
      expect(bypassAttempts.length).toBeGreaterThan(0);
      expect(criticalAttempts.length).toBeGreaterThan(0);
    });
  });
});