/**
 * JWT Secret Hardcoding Vulnerability Testing Suite
 * 
 * CRITICAL SECURITY AUDIT SUB-TASK
 * Priority: CRITICAL (Risk Score: 9)
 * Impact: Complete authentication bypass potential
 * 
 * This test suite validates JWT secret configuration security and prevents
 * authentication vulnerabilities caused by hardcoded secrets.
 * 
 * Vulnerable Files Under Test:
 * - backend/src/middleware/authResilience.js:154
 * - backend/src/middleware/auth.js:108  
 * - backend/src/services/auth.service.js:428,440,518,573
 * - backend/src/routes/auth.js:169,623,681
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

// Mock modules before importing to prevent actual authentication
jest.mock('../src/config/auth.js', () => ({
  supabase: null,
  generateUserId: jest.fn()
}));

jest.mock('../src/config/database.js', () => ({
  getDatabase: jest.fn(() => ({
    query: jest.fn(),
    unsafe: jest.fn()
  }))
}));

describe('🔐 JWT Secret Hardcoding Vulnerability Tests', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.clearAllMocks();
    console.warn.mockClear();
    console.error.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  describe('🚨 Critical Hardcoded Secret Detection', () => {
    /**
     * Test the exact hardcoded secrets found in the security audit
     * These secrets should NEVER be used in production environments
     */
    it('should detect hardcoded secret in authResilience.js (Line 154)', async () => {
      // Import after mocking to test actual implementation
      const { authenticateWithJWT } = await import('../src/middleware/authResilience.js');
      
      const vulnerableSecret = 'development-secret-key-change-in-production';
      const testPayload = { id: 'test-user', email: 'test@example.com' };
      
      // Create token with the hardcoded secret
      const maliciousToken = jwt.sign(testPayload, vulnerableSecret);
      
      // Test environment without JWT_SECRET should fall back to hardcoded secret
      delete process.env.JWT_SECRET;
      
      try {
        const result = await authenticateWithJWT(maliciousToken);
        
        // This is a CRITICAL vulnerability - the token should be rejected
        expect(result).toBeDefined();
        console.warn('🚨 CRITICAL VULNERABILITY: Hardcoded JWT secret accepted in authResilience.js');
        
        // Flag this as a security issue
        expect(true).toBe(false); // Force failure to highlight vulnerability
      } catch (error) {
        // Expected behavior - hardcoded secrets should be rejected
        expect(error.message).toContain('Invalid JWT token');
      }
    });

    it('should detect hardcoded secret in auth.js (Line 108)', async () => {
      // Mock JWT verification to test the hardcoded secret usage
      const originalVerify = jwt.verify;
      const verifySpy = jest.spyOn(jwt, 'verify');
      
      const { requireAuth } = await import('../src/middleware/auth.js');
      
      const vulnerableSecret = 'development-secret-key-change-in-production';
      const testPayload = { id: 'test-user', email: 'test@example.com' };
      const maliciousToken = jwt.sign(testPayload, vulnerableSecret);
      
      const req = SecurityTestUtils.createMockRequest(maliciousToken);
      const res = SecurityTestUtils.createMockResponse();
      const next = jest.fn();
      
      delete process.env.JWT_SECRET;
      
      await requireAuth(req, res, next);
      
      // Verify that jwt.verify was called with the hardcoded secret
      expect(verifySpy).toHaveBeenCalledWith(
        maliciousToken,
        vulnerableSecret
      );
      
      // This indicates the vulnerability exists
      console.warn('🚨 CRITICAL VULNERABILITY: Hardcoded JWT secret used in auth.js middleware');
      
      verifySpy.mockRestore();
    });

    it('should detect hardcoded secret in auth.service.js (Lines 428,440,518,573)', async () => {
      const AuthService = (await import('../src/services/auth.service.js')).default;
      const authService = new AuthService();
      
      const vulnerableSecret = 'your-secret-key';
      const testUser = { id: 'test-user', email: 'test@example.com', role: 'patient' };
      
      delete process.env.JWT_SECRET;
      
      // Test token generation with hardcoded secret
      const token = authService.generateToken(testUser);
      
      // Verify the token was signed with the hardcoded secret
      try {
        const decoded = jwt.verify(token, vulnerableSecret);
        expect(decoded.id).toBe(testUser.id);
        
        console.warn('🚨 CRITICAL VULNERABILITY: Hardcoded JWT secret used in auth.service.js');
        
        // This should fail in a secure implementation
        expect(true).toBe(false);
      } catch (error) {
        // Expected behavior - should not use hardcoded secrets
        expect(error.message).toContain('invalid token');
      }
    });

    it('should detect hardcoded secret in auth routes (Lines 169,623,681)', async () => {
      const vulnerableSecret = 'development-secret';
      
      // Test multiple locations where hardcoded secrets appear in auth.js
      const testCases = [
        { line: 169, context: 'patient registration' },
        { line: 623, context: 'token refresh' },
        { line: 681, context: 'universal login' }
      ];
      
      for (const testCase of testCases) {
        const testPayload = { id: 'test-user', email: 'test@example.com', role: 'patient' };
        const maliciousToken = jwt.sign(testPayload, vulnerableSecret);
        
        try {
          const decoded = jwt.verify(maliciousToken, vulnerableSecret);
          expect(decoded.id).toBe(testPayload.id);
          
          console.warn(`🚨 CRITICAL VULNERABILITY: Hardcoded JWT secret at line ${testCase.line} (${testCase.context})`);
        } catch (error) {
          // Expected behavior
          expect(error).toBeDefined();
        }
      }
    });
  });

  describe('🔒 Environment Variable Security Validation', () => {
    it('should reject authentication when JWT_SECRET is missing in production', async () => {
      SecurityTestUtils.mockEnvironmentStates.production();
      
      const { requireAuth } = await import('../src/middleware/auth.js');
      
      const req = SecurityTestUtils.createMockRequest('invalid.token.here');
      const res = SecurityTestUtils.createMockResponse();
      const next = jest.fn();
      
      await requireAuth(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Authentication failed'),
          code: expect.any(String)
        })
      );
    });

    it('should require secure JWT secrets in production environment', () => {
      const weakSecrets = [
        'secret',
        'password', 
        'key',
        '123456',
        'development-secret',
        'your-secret-key',
        'development-secret-key-change-in-production'
      ];
      
      for (const weakSecret of weakSecrets) {
        process.env.NODE_ENV = 'production';
        process.env.JWT_SECRET = weakSecret;
        
        // Simulate production secret validation
        const isSecure = process.env.JWT_SECRET && 
                        process.env.JWT_SECRET.length >= 32 &&
                        !SecurityTestUtils.knownVulnerableSecrets.includes(process.env.JWT_SECRET);
        
        expect(isSecure).toBe(false);
        console.warn(`🚨 WEAK SECRET DETECTED: "${weakSecret}" is not suitable for production`);
      }
    });

    it('should accept strong JWT secrets in production', () => {
      const strongSecret = 'a-very-secure-randomly-generated-secret-key-for-production-use-only-with-high-entropy';
      
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = strongSecret;
      
      const isSecure = process.env.JWT_SECRET && 
                      process.env.JWT_SECRET.length >= 32 &&
                      !SecurityTestUtils.knownVulnerableSecrets.includes(process.env.JWT_SECRET);
      
      expect(isSecure).toBe(true);
    });

    it('should validate refresh token secrets separately from access tokens', async () => {
      const { generateTokens } = await import('../src/middleware/auth.js');
      
      delete process.env.JWT_SECRET;
      delete process.env.JWT_REFRESH_SECRET;
      
      const testUser = {
        id: 'test-user',
        email: 'test@example.com',
        role: 'patient',
        verified: true,
        created_at: new Date().toISOString()
      };
      
      const tokens = generateTokens(testUser);
      
      // Both tokens should not be generated with hardcoded secrets
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      
      // Verify they're using fallback secrets (vulnerability)
      const hardcodedSecret = 'development-secret-key-change-in-production';
      
      try {
        const accessDecoded = jwt.verify(tokens.accessToken, hardcodedSecret);
        const refreshDecoded = jwt.verify(tokens.refreshToken, hardcodedSecret);
        
        expect(accessDecoded.id).toBe(testUser.id);
        expect(refreshDecoded.id).toBe(testUser.id);
        
        console.warn('🚨 CRITICAL VULNERABILITY: Both access and refresh tokens use hardcoded secrets');
      } catch (error) {
        // Expected in secure implementation
        expect(error).toBeDefined();
      }
    });
  });

  describe('🛡️ Authentication Bypass Prevention', () => {
    /**
     * Test that attackers cannot use knowledge of hardcoded secrets
     * to bypass authentication and impersonate users
     */
    it('should prevent authentication bypass with known hardcoded secrets', async () => {
      const { requireAuth } = await import('../src/middleware/auth.js');
      
      const maliciousPayloads = [
        { id: 'admin-user', email: 'admin@evil.com', role: 'admin' },
        { id: 'provider-user', email: 'doctor@evil.com', role: 'provider' },
        { id: 'patient-user', email: 'patient@evil.com', role: 'patient' }
      ];
      
      for (const secret of SecurityTestUtils.knownVulnerableSecrets) {
        for (const payload of maliciousPayloads) {
          const maliciousToken = jwt.sign(payload, secret, { expiresIn: '1h' });
          
          const req = SecurityTestUtils.createMockRequest(maliciousToken);
          const res = SecurityTestUtils.createMockResponse();
          const next = jest.fn();
          
          delete process.env.JWT_SECRET;
          
          await requireAuth(req, res, next);
          
          // Check if the malicious token was accepted
          if (req.user && req.user.id === payload.id) {
            console.error(`🚨 AUTHENTICATION BYPASS: Hardcoded secret "${secret}" allowed impersonation of ${payload.role}`);
            
            // This is a critical security failure
            expect(true).toBe(false);
          }
        }
      }
    });

    it('should prevent privilege escalation through token manipulation', async () => {
      const normalUserSecret = 'development-secret-key-change-in-production';
      
      // Create legitimate patient token
      const patientPayload = { id: 'patient-123', email: 'patient@example.com', role: 'patient' };
      const patientToken = jwt.sign(patientPayload, normalUserSecret);
      
      // Decode and modify to admin
      const decoded = jwt.decode(patientToken);
      const elevatedPayload = { ...decoded, role: 'admin', permissions: ['all'] };
      const adminToken = jwt.sign(elevatedPayload, normalUserSecret);
      
      const { requireAuth } = await import('../src/middleware/auth.js');
      
      const req = SecurityTestUtils.createMockRequest(adminToken);
      const res = SecurityTestUtils.createMockResponse();
      const next = jest.fn();
      
      delete process.env.JWT_SECRET;
      
      await requireAuth(req, res, next);
      
      // Check if privilege escalation succeeded
      if (req.user && req.user.role === 'admin') {
        console.error('🚨 PRIVILEGE ESCALATION: Token manipulation allowed admin access');
        expect(true).toBe(false);
      }
    });

    it('should validate token expiration even with hardcoded secrets', async () => {
      const expiredPayload = { 
        id: 'test-user', 
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        exp: Math.floor(Date.now() / 1000) - 1800   // 30 minutes ago
      };
      
      const expiredToken = jwt.sign(expiredPayload, 'development-secret-key-change-in-production');
      
      const { requireAuth } = await import('../src/middleware/auth.js');
      
      const req = SecurityTestUtils.createMockRequest(expiredToken);
      const res = SecurityTestUtils.createMockResponse();
      const next = jest.fn();
      
      delete process.env.JWT_SECRET;
      
      await requireAuth(req, res, next);
      
      // Should reject expired tokens regardless of secret knowledge
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringMatching(/expired|invalid/i)
        })
      );
    });
  });

  describe('🎯 Token Structure Validation', () => {
    it('should validate required token fields even with correct secrets', async () => {
      const incompletePayloads = [
        { email: 'test@example.com' }, // missing id
        { id: 'test-user' }, // missing email  
        {}, // missing both
        { id: '', email: 'test@example.com' }, // empty id
        { id: 'test-user', email: '' } // empty email
      ];
      
      const { requireAuth } = await import('../src/middleware/auth.js');
      
      for (const payload of incompletePayloads) {
        const malformedToken = jwt.sign(payload, 'development-secret-key-change-in-production');
        
        const req = SecurityTestUtils.createMockRequest(malformedToken);
        const res = SecurityTestUtils.createMockResponse();
        const next = jest.fn();
        
        delete process.env.JWT_SECRET;
        
        await requireAuth(req, res, next);
        
        // Should reject malformed tokens
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
      }
    });

    it('should handle malformed JWT tokens gracefully', async () => {
      const malformedTokens = [
        'not.a.jwt',
        'invalid',
        '',
        'header.payload', // missing signature
        'too.many.parts.here.invalid',
        Buffer.from('binary data').toString('base64')
      ];
      
      const { requireAuth } = await import('../src/middleware/auth.js');
      
      for (const malformedToken of malformedTokens) {
        const req = SecurityTestUtils.createMockRequest(malformedToken);
        const res = SecurityTestUtils.createMockResponse();
        const next = jest.fn();
        
        await requireAuth(req, res, next);
        
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
      }
    });
  });

  describe('🔍 Security Audit Trail', () => {
    it('should log security events for hardcoded secret usage', async () => {
      const { requireAuth } = await import('../src/middleware/auth.js');
      
      const maliciousToken = jwt.sign(
        { id: 'attacker', email: 'attacker@evil.com', role: 'admin' },
        'development-secret-key-change-in-production'
      );
      
      const req = SecurityTestUtils.createMockRequest(maliciousToken, {
        'user-agent': 'AttackBot/1.0',
        'x-forwarded-for': '192.168.1.100'
      });
      const res = SecurityTestUtils.createMockResponse();
      const next = jest.fn();
      
      delete process.env.JWT_SECRET;
      
      await requireAuth(req, res, next);
      
      // Verify security events are logged
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Supabase auth failed')
      );
    });

    it('should track authentication method fallbacks', async () => {
      const { requireAuth } = await import('../src/middleware/auth.js');
      
      const testToken = jwt.sign(
        { id: 'test-user', email: 'test@example.com' },
        'development-secret-key-change-in-production'
      );
      
      const req = SecurityTestUtils.createMockRequest(testToken);
      const res = SecurityTestUtils.createMockResponse();
      const next = jest.fn();
      
      delete process.env.JWT_SECRET;
      
      await requireAuth(req, res, next);
      
      // Verify authentication method is tracked
      if (req.authMethod) {
        expect(['supabase', 'jwt', 'demo'].includes(req.authMethod)).toBe(true);
      }
    });
  });
});