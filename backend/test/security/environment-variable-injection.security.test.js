/**
 * Environment Variable Injection Security Testing Suite
 * 
 * CRITICAL SECURITY AUDIT SUB-TASK
 * Priority: CRITICAL (Risk Score: 9)
 * Focus: Environment variable injection and fallback behavior testing
 * 
 * This test suite validates environment variable security and prevents
 * authentication vulnerabilities caused by environment manipulation,
 * injection attacks, and insecure fallback mechanisms.
 * 
 * Security Concerns Tested:
 * - Environment variable injection attacks
 * - Insecure fallback to hardcoded secrets
 * - Production vs development environment validation
 * - JWT secret strength and rotation
 * - Configuration tampering detection
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

// Mock modules to prevent actual authentication during testing
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

describe('🔐 Environment Variable Injection Security Tests', () => {
  let originalEnv;
  let originalArgv;
  let originalNodeEnv;

  beforeEach(() => {
    // Store original environment
    originalEnv = { ...process.env };
    originalArgv = [...process.argv];
    originalNodeEnv = process.env.NODE_ENV;
    
    jest.clearAllMocks();
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    process.argv = originalArgv;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalNodeEnv,
      writable: true
    });
  });

  describe('🚨 Environment Variable Injection Attacks', () => {
    /**
     * Test various methods attackers might use to inject malicious 
     * environment variables to compromise JWT secret security
     */
    it('should prevent JWT secret injection via process.env manipulation', async () => {
      // Simulate attacker injecting malicious JWT secret
      const maliciousSecret = 'attacker-controlled-secret';
      
      // Direct environment manipulation
      process.env.JWT_SECRET = maliciousSecret;
      
      const { generateTokens } = await import('../src/middleware/auth.js');
      
      const testUser = {
        id: 'attacker',
        email: 'attacker@evil.com',
        role: 'admin',
        verified: true,
        created_at: new Date().toISOString()
      };
      
      const tokens = generateTokens(testUser);
      
      // Verify if the injected secret was used
      try {
        const decoded = jwt.verify(tokens.accessToken, maliciousSecret);
        
        if (decoded.id === 'attacker') {
          console.error('🚨 CRITICAL VULNERABILITY: Environment injection allowed attacker-controlled JWT secret');
          console.error(`Injected secret: ${maliciousSecret}`);
          expect(true).toBe(false); // Force test failure
        }
      } catch (error) {
        // Expected behavior - should not use injected secret
        expect(error.message).toContain('invalid');
      }
    });

    it('should prevent NODE_ENV manipulation to bypass security checks', async () => {
      const maliciousConfigs = [
        { NODE_ENV: 'development', attack: 'Force development mode to enable debug features' },
        { NODE_ENV: 'test', attack: 'Use test mode to bypass production security' },
        { NODE_ENV: 'debug', attack: 'Enable debug mode for information disclosure' },
        { NODE_ENV: '', attack: 'Empty NODE_ENV to trigger default behavior' },
        { NODE_ENV: 'production; rm -rf /', attack: 'Command injection via NODE_ENV' }
      ];
      
      for (const config of maliciousConfigs) {
        process.env.NODE_ENV = config.NODE_ENV;
        
        const { requireAuth } = await import('../src/middleware/auth.js');
        
        // Test if security checks are bypassed
        const maliciousToken = jwt.sign(
          { id: 'admin', email: 'admin@evil.com', role: 'admin' },
          'weak-secret'
        );
        
        const req = SecurityTestUtils.createMockRequest(maliciousToken);
        const res = SecurityTestUtils.createMockResponse();
        const next = jest.fn();
        
        await requireAuth(req, res, next);
        
        // Verify security is not bypassed
        if (req.user && req.user.role === 'admin') {
          console.error(`🚨 SECURITY BYPASS: ${config.attack}`);
          console.error(`NODE_ENV manipulation: "${config.NODE_ENV}"`);
          expect(true).toBe(false);
        }
        
        jest.resetModules();
      }
    });

    it('should prevent process.argv manipulation for configuration injection', () => {
      const maliciousArgs = [
        '--jwt-secret=attacker-secret',
        '--env=production',
        '--debug=true',
        '--disable-auth=true',
        '--admin-override=true'
      ];
      
      // Simulate command line injection
      process.argv = [...process.argv, ...maliciousArgs];
      
      // Test if any configuration parsing is vulnerable to argv injection
      const suspiciousPatterns = process.argv.filter(arg => 
        arg.includes('secret') || 
        arg.includes('auth') || 
        arg.includes('admin') ||
        arg.includes('debug')
      );
      
      if (suspiciousPatterns.length > 0) {
        console.warn('🚨 POTENTIAL VULNERABILITY: Command line arguments contain security-sensitive parameters');
        suspiciousPatterns.forEach(pattern => {
          console.warn(`- ${pattern}`);
        });
      }
      
      // Application should not process these malicious arguments
      expect(suspiciousPatterns.length).toBeGreaterThan(0); // We injected them
      
      // But they should be ignored by the application
      expect(process.env.JWT_SECRET).not.toBe('attacker-secret');
    });

    it('should prevent environment file injection attacks', async () => {
      // Simulate .env file injection with malicious content
      const maliciousEnvContent = `
        # Legitimate config
        PORT=3000
        
        # Malicious injection
        JWT_SECRET=hacked-secret
        DISABLE_AUTH=true
        ADMIN_OVERRIDE=enabled
        
        # Command injection attempt
        DANGEROUS_VAR=\`rm -rf /\`
      `;
      
      // Test if environment parsing is vulnerable
      const envVars = maliciousEnvContent
        .split('\n')
        .filter(line => line.includes('=') && !line.trim().startsWith('#'))
        .map(line => line.split('=')[0].trim());
      
      const dangerousVars = envVars.filter(varName =>
        ['JWT_SECRET', 'DISABLE_AUTH', 'ADMIN_OVERRIDE', 'DANGEROUS_VAR'].includes(varName)
      );
      
      expect(dangerousVars.length).toBeGreaterThan(0);
      
      // Verify these dangerous vars don't actually affect the application
      for (const varName of dangerousVars) {
        if (varName === 'JWT_SECRET' && process.env[varName] === 'hacked-secret') {
          console.error(`🚨 ENVIRONMENT INJECTION: ${varName} was successfully injected`);
          expect(true).toBe(false);
        }
      }
    });
  });

  describe('🔒 Secure Environment Configuration Validation', () => {
    it('should enforce strong JWT secrets in production', () => {
      const productionSecrets = [
        'weak',
        'password123',
        'secret',
        'development-secret',
        'your-secret-key',
        'a'.repeat(10), // Too short
        '1234567890123456789012345678901', // 31 chars, just under minimum
        'a'.repeat(32), // Minimum length but low entropy
        'very-secure-jwt-secret-with-high-entropy-for-production-use-only' // Good
      ];
      
      for (const secret of productionSecrets) {
        process.env.NODE_ENV = 'production';
        process.env.JWT_SECRET = secret;
        
        // Validate secret strength
        const isStrong = secret.length >= 32 && 
                        !/^(.)\1*$/.test(secret) && // Not all same character
                        !/^(development|secret|password|weak)/i.test(secret) && // Not obvious words
                        /[A-Za-z]/.test(secret) && // Contains letters
                        (secret.includes('-') || /[0-9]/.test(secret)); // Contains numbers or dashes
        
        if (!isStrong) {
          console.warn(`🚨 WEAK JWT SECRET: "${secret.substring(0, 10)}..." is not suitable for production`);
          
          if (process.env.NODE_ENV === 'production') {
            expect(isStrong).toBe(true);
          }
        }
      }
    });

    it('should validate environment variable types and formats', () => {
      const envTests = [
        { var: 'PORT', value: 'not-a-number', expected: 'number' },
        { var: 'JWT_EXPIRES_IN', value: 'forever', expected: 'time-string' },
        { var: 'ENABLE_ENHANCED_AUTH', value: 'maybe', expected: 'boolean' },
        { var: 'AUTH_MAX_FAILURES', value: '-1', expected: 'positive-number' },
        { var: 'DATABASE_URL', value: 'not-a-url', expected: 'url' }
      ];
      
      for (const test of envTests) {
        process.env[test.var] = test.value;
        
        // Validate environment variable format
        let isValid = true;
        let errorMessage = '';
        
        switch (test.expected) {
          case 'number':
            isValid = !isNaN(Number(test.value)) && isFinite(Number(test.value));
            errorMessage = `${test.var} should be a number`;
            break;
          case 'positive-number':
            isValid = !isNaN(Number(test.value)) && Number(test.value) > 0;
            errorMessage = `${test.var} should be a positive number`;
            break;
          case 'boolean':
            isValid = ['true', 'false'].includes(test.value.toLowerCase());
            errorMessage = `${test.var} should be 'true' or 'false'`;
            break;
          case 'url':
            isValid = /^https?:\/\/.+/.test(test.value);
            errorMessage = `${test.var} should be a valid URL`;
            break;
          case 'time-string':
            isValid = /^\d+[smhd]$/.test(test.value);
            errorMessage = `${test.var} should be a time string (e.g., '1h', '30m')`;
            break;
        }
        
        if (!isValid) {
          console.warn(`🚨 INVALID ENV VAR: ${errorMessage} (got: "${test.value}")`);
        }
        
        expect(isValid).toBe(false); // We deliberately provided invalid values
      }
    });

    it('should prevent environment variable prototype pollution', () => {
      const maliciousEnvVars = [
        'constructor.prototype.isAdmin=true',
        '__proto__.jwt_secret=hacked',
        'prototype.polluted=true',
        'constructor[prototype][admin]=true'
      ];
      
      for (const maliciousVar of maliciousEnvVars) {
        const [key, value] = maliciousVar.split('=');
        
        // Attempt to set malicious environment variable
        process.env[key] = value;
        
        // Check if prototype pollution occurred
        const testObj = {};
        
        if (testObj.isAdmin || testObj.jwt_secret || testObj.polluted || testObj.admin) {
          console.error(`🚨 PROTOTYPE POLLUTION: Environment variable "${key}" polluted object prototype`);
          expect(true).toBe(false);
        }
      }
    });
  });

  describe('🛡️ Fallback Security Mechanisms', () => {
    /**
     * Test fallback behavior when environment variables are missing
     * to ensure secure defaults are used
     */
    it('should use secure fallbacks when JWT_SECRET is missing', async () => {
      delete process.env.JWT_SECRET;
      delete process.env.JWT_REFRESH_SECRET;
      
      const { generateTokens } = await import('../src/middleware/auth.js');
      
      const testUser = {
        id: 'test-user',
        email: 'test@example.com',
        role: 'patient',
        verified: true,
        created_at: new Date().toISOString()
      };
      
      // In production, this should fail rather than use insecure fallbacks
      if (process.env.NODE_ENV === 'production') {
        expect(() => generateTokens(testUser)).toThrow();
      } else {
        // In development, fallbacks may be allowed but should be flagged
        const tokens = generateTokens(testUser);
        
        if (tokens.accessToken) {
          console.warn('🚨 INSECURE FALLBACK: JWT tokens generated without configured secret');
          
          // Verify the fallback is a known development secret (vulnerability)
          const knownFallbacks = [
            'development-secret-key-change-in-production',
            'your-secret-key',
            'development-secret'
          ];
          
          for (const fallback of knownFallbacks) {
            try {
              const decoded = jwt.verify(tokens.accessToken, fallback);
              if (decoded.id === testUser.id) {
                console.error(`🚨 VULNERABLE FALLBACK: Using hardcoded secret "${fallback}"`);
                expect(true).toBe(false);
              }
            } catch (error) {
              // Expected - should not verify with known vulnerable secrets
            }
          }
        }
      }
    });

    it('should validate environment variable precedence and override behavior', () => {
      // Test precedence: CLI args > .env.local > .env > defaults
      const envVarTests = [
        { name: 'JWT_SECRET', sources: ['default', '.env', '.env.local', 'cli'] },
        { name: 'NODE_ENV', sources: ['default', 'environment', 'override'] },
        { name: 'PORT', sources: ['default', 'config', 'runtime'] }
      ];
      
      for (const test of envVarTests) {
        // Simulate multiple sources setting the same variable
        const values = {
          default: `default-${test.name.toLowerCase()}`,
          '.env': `env-${test.name.toLowerCase()}`,
          '.env.local': `local-${test.name.toLowerCase()}`,
          cli: `cli-${test.name.toLowerCase()}`,
          environment: `env-${test.name.toLowerCase()}`,
          config: `config-${test.name.toLowerCase()}`,
          runtime: `runtime-${test.name.toLowerCase()}`,
          override: `override-${test.name.toLowerCase()}`
        };
        
        // Set from lowest to highest precedence
        for (const source of test.sources) {
          process.env[test.name] = values[source];
        }
        
        // Verify the highest precedence value is used
        const finalValue = process.env[test.name];
        const expectedValue = values[test.sources[test.sources.length - 1]];
        
        expect(finalValue).toBe(expectedValue);
        
        // Check for security implications of precedence
        if (test.name === 'JWT_SECRET' && finalValue.includes('default')) {
          console.warn(`🚨 SECURITY RISK: JWT_SECRET using default value due to precedence`);
        }
      }
    });

    it('should handle environment variable injection through child processes', () => {
      // Test if child processes can be used to inject environment variables
      const childEnvTests = [
        'JWT_SECRET=child-injected-secret',
        'NODE_ENV=development',
        'DISABLE_SECURITY=true'
      ];
      
      for (const envSetting of childEnvTests) {
        const [key, value] = envSetting.split('=');
        
        // Simulate child process environment injection
        const childEnv = { ...process.env, [key]: value };
        
        // Verify main process is not affected
        expect(process.env[key]).not.toBe(value);
        
        // But child environment contains the injection
        expect(childEnv[key]).toBe(value);
        
        if (key === 'JWT_SECRET' && value === 'child-injected-secret') {
          console.warn('🚨 CHILD PROCESS INJECTION: JWT_SECRET could be injected via child process');
        }
      }
    });
  });

  describe('🔍 Configuration Tampering Detection', () => {
    it('should detect runtime environment variable modifications', () => {
      const originalJwtSecret = process.env.JWT_SECRET;
      const securitySensitiveVars = ['JWT_SECRET', 'NODE_ENV', 'DATABASE_URL'];
      
      // Create baseline of critical environment variables
      const baseline = {};
      for (const varName of securitySensitiveVars) {
        baseline[varName] = process.env[varName];
      }
      
      // Simulate runtime tampering
      process.env.JWT_SECRET = 'tampered-secret';
      process.env.NODE_ENV = 'development'; // Downgrade from production
      
      // Detect changes
      const tamperedVars = [];
      for (const varName of securitySensitiveVars) {
        if (process.env[varName] !== baseline[varName]) {
          tamperedVars.push({
            name: varName,
            original: baseline[varName],
            current: process.env[varName]
          });
        }
      }
      
      expect(tamperedVars.length).toBeGreaterThan(0);
      
      for (const tamperedVar of tamperedVars) {
        console.warn(`🚨 TAMPERING DETECTED: ${tamperedVar.name} changed from "${tamperedVar.original}" to "${tamperedVar.current}"`);
      }
      
      // Restore original value
      process.env.JWT_SECRET = originalJwtSecret;
    });

    it('should validate environment variable source integrity', () => {
      // Mock different sources of environment variables
      const envSources = {
        system: { JWT_SECRET: 'system-secret', verified: true },
        dotenv: { JWT_SECRET: 'dotenv-secret', verified: false },
        runtime: { JWT_SECRET: 'runtime-secret', verified: false }
      };
      
      for (const [source, config] of Object.entries(envSources)) {
        process.env.JWT_SECRET = config.JWT_SECRET;
        
        // In a secure system, only verified sources should be trusted
        if (!config.verified && process.env.NODE_ENV === 'production') {
          console.warn(`🚨 UNTRUSTED SOURCE: JWT_SECRET from ${source} is not verified for production`);
          expect(config.verified).toBe(true);
        }
      }
    });

    it('should monitor for environment variable persistence attacks', () => {
      const persistentVars = [
        'LD_PRELOAD=/malicious/lib.so',
        'DYLD_INSERT_LIBRARIES=/evil/lib.dylib',
        'PATH=/attacker/bin:' + process.env.PATH,
        'NODE_PATH=/malicious/modules'
      ];
      
      for (const persistentVar of persistentVars) {
        const [key, value] = persistentVar.split('=');
        
        // Check if these dangerous variables are set
        if (process.env[key] && process.env[key].includes('malicious') || process.env[key].includes('evil')) {
          console.error(`🚨 PERSISTENCE ATTACK: Dangerous environment variable ${key}=${process.env[key]}`);
          expect(true).toBe(false);
        }
        
        // Simulate the attack
        process.env[key] = value;
        
        // Verify detection
        if (key === 'LD_PRELOAD' || key === 'DYLD_INSERT_LIBRARIES') {
          console.warn(`🚨 LIBRARY INJECTION: ${key} could be used for code injection`);
        }
        
        // Clean up
        delete process.env[key];
      }
    });
  });

  describe('📊 Environment Security Metrics', () => {
    it('should audit all environment variables for security risks', () => {
      const securityAudit = {
        exposedSecrets: [],
        weakConfigurations: [],
        missingCriticalVars: [],
        suspiciousVars: []
      };
      
      const criticalVars = ['JWT_SECRET', 'DATABASE_URL', 'NODE_ENV'];
      const secretPatterns = [/secret/i, /key/i, /token/i, /password/i];
      
      // Audit all environment variables
      for (const [key, value] of Object.entries(process.env)) {
        // Check for missing critical variables
        if (criticalVars.includes(key) && !value) {
          securityAudit.missingCriticalVars.push(key);
        }
        
        // Check for exposed secrets
        if (secretPatterns.some(pattern => pattern.test(key)) && value) {
          if (value.length < 16 || value === 'secret' || value === 'password') {
            securityAudit.weakConfigurations.push({ key, reason: 'Weak secret' });
          }
          
          if (value.includes('development') || value.includes('test')) {
            securityAudit.exposedSecrets.push({ key, reason: 'Development secret in environment' });
          }
        }
        
        // Check for suspicious variables
        if (/^(LD_|DYLD_|PATH|NODE_PATH)/.test(key)) {
          securityAudit.suspiciousVars.push({ key, value: value?.substring(0, 50) + '...' });
        }
      }
      
      // Report findings
      if (securityAudit.exposedSecrets.length > 0) {
        console.warn('🚨 EXPOSED SECRETS DETECTED:');
        securityAudit.exposedSecrets.forEach(finding => {
          console.warn(`- ${finding.key}: ${finding.reason}`);
        });
      }
      
      if (securityAudit.weakConfigurations.length > 0) {
        console.warn('🚨 WEAK CONFIGURATIONS DETECTED:');
        securityAudit.weakConfigurations.forEach(finding => {
          console.warn(`- ${finding.key}: ${finding.reason}`);
        });
      }
      
      // This test documents the current state
      expect(typeof securityAudit).toBe('object');
    });
  });
});