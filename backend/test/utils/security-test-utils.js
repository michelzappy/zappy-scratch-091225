/**
 * Comprehensive Security Testing Utilities
 * 
 * This module provides specialized utilities, mocks, and helpers for 
 * security vulnerability testing, specifically focused on JWT secret
 * hardcoding vulnerabilities and authentication bypass prevention.
 * 
 * @module SecurityTestUtils
 */

import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Security-focused test utilities for JWT vulnerabilities
 */
export class SecurityTestUtils {
  
  /**
   * Known vulnerable secrets found in the codebase audit
   */
  static VULNERABLE_SECRETS = [
    'development-secret-key-change-in-production',
    'your-secret-key',
    'development-secret',
    'secret'
  ];

  /**
   * Common weak secrets that should be rejected
   */
  static WEAK_SECRETS = [
    'password',
    'secret',
    'key',
    '123456',
    'admin',
    'test',
    'weak',
    'default'
  ];

  /**
   * Generate various JWT tokens for security testing
   * @param {Object} payload - Base payload for the token
   * @param {Object} options - Token generation options
   * @returns {Object} Object containing various token types
   */
  static generateSecurityTestTokens(payload = { id: 'test-user', email: 'test@example.com' }, options = {}) {
    const {
      includeExpired = true,
      includeInvalid = true,
      includeMalicious = true,
      includeAlgorithmAttacks = true
    } = options;

    const tokens = {};

    // Valid tokens with vulnerable secrets
    for (const secret of this.VULNERABLE_SECRETS) {
      const key = `vulnerable_${secret.replace(/[^a-zA-Z0-9]/g, '_')}`;
      tokens[key] = jwt.sign(payload, secret, { expiresIn: '1h' });
    }

    // Weak secret tokens
    for (const secret of this.WEAK_SECRETS) {
      const key = `weak_${secret}`;
      tokens[key] = jwt.sign(payload, secret, { expiresIn: '1h' });
    }

    if (includeExpired) {
      // Expired tokens
      tokens.expired_recent = jwt.sign(
        { ...payload, exp: Math.floor(Date.now() / 1000) - 300 }, // 5 minutes ago
        'development-secret-key-change-in-production'
      );
      
      tokens.expired_old = jwt.sign(
        { ...payload, exp: Math.floor(Date.now() / 1000) - 86400 }, // 1 day ago
        'development-secret-key-change-in-production'
      );
    }

    if (includeInvalid) {
      // Invalid/malformed tokens
      tokens.malformed_no_signature = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QiLCJyb2xlIjoicGF0aWVudCJ9';
      tokens.malformed_invalid_json = 'invalid.json.token';
      tokens.malformed_empty = '';
      tokens.malformed_only_dots = '...';
      tokens.malformed_base64 = 'bm90IGEgand0IHRva2Vu'; // "not a jwt token" in base64
    }

    if (includeAlgorithmAttacks) {
      // Algorithm confusion attacks
      tokens.algorithm_none = jwt.sign(payload, '', { algorithm: 'none' });
      
      // Manually craft none algorithm token
      const noneHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const nonePayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
      tokens.algorithm_none_manual = `${noneHeader}.${nonePayload}.`;
      
      // Algorithm substitution (if RSA public key is known)
      tokens.algorithm_substitution = jwt.sign(payload, 'public-key-content', { algorithm: 'HS256' });
    }

    if (includeMalicious) {
      // Privilege escalation payloads
      tokens.privilege_escalation_admin = jwt.sign(
        { ...payload, role: 'admin' },
        'development-secret-key-change-in-production'
      );
      
      tokens.privilege_escalation_provider = jwt.sign(
        { ...payload, role: 'provider' },
        'development-secret-key-change-in-production'
      );
      
      tokens.privilege_escalation_permissions = jwt.sign(
        { ...payload, permissions: ['admin', 'all'] },
        'development-secret-key-change-in-production'
      );

      // SQL injection attempts in payload
      tokens.sql_injection_payload = jwt.sign(
        { 
          ...payload, 
          id: "1'; DROP TABLE users; --",
          email: "admin@example.com'; DELETE FROM passwords; --"
        },
        'development-secret-key-change-in-production'
      );

      // XSS payloads
      tokens.xss_payload = jwt.sign(
        {
          ...payload,
          name: '<script>alert("XSS")</script>',
          email: 'user+<script>alert(1)</script>@example.com'
        },
        'development-secret-key-change-in-production'
      );
    }

    return tokens;
  }

  /**
   * Create mock request objects with various security-relevant configurations
   * @param {string} token - JWT token to include
   * @param {Object} headers - Additional headers
   * @param {Object} options - Request options
   * @returns {Object} Mock request object
   */
  static createMockRequest(token = null, headers = {}, options = {}) {
    const {
      ip = '127.0.0.1',
      userAgent = 'Jest Test Suite',
      method = 'GET',
      url = '/test',
      body = {},
      query = {},
      params = {},
      session = null
    } = options;

    const mockRequest = {
      method,
      url,
      headers: {
        'user-agent': userAgent,
        'content-type': 'application/json',
        ...headers
      },
      body,
      query,
      params,
      ip,
      connection: { remoteAddress: ip },
      session,
      
      // Express request methods
      get: jest.fn((headerName) => {
        return mockRequest.headers[headerName.toLowerCase()] || 
               mockRequest.headers[headerName];
      }),
      
      header: jest.fn((headerName) => mockRequest.get(headerName)),
      
      // Security-relevant properties
      secure: false,
      protocol: 'http',
      hostname: 'localhost',
      originalUrl: url,
      
      // Mock Express methods
      accepts: jest.fn(() => 'application/json'),
      acceptsCharsets: jest.fn(() => 'utf-8'),
      acceptsEncodings: jest.fn(() => 'gzip'),
      acceptsLanguages: jest.fn(() => 'en'),
      is: jest.fn(() => false),
      
      // Custom security testing properties
      _securityTestMetadata: {
        createdAt: new Date(),
        testType: 'security_audit',
        vulnerabilityTest: true
      }
    };

    // Add authorization header if token provided
    if (token) {
      mockRequest.headers.authorization = `Bearer ${token}`;
    }

    return mockRequest;
  }

  /**
   * Create mock response objects with security-focused assertions
   * @param {Object} options - Response options
   * @returns {Object} Mock response object with security helpers
   */
  static createMockResponse(options = {}) {
    const {
      statusCode = 200,
      headers = {}
    } = options;

    const mockResponse = {
      statusCode,
      headers: { ...headers },
      locals: {},
      
      // Response data tracking
      _data: null,
      _status: statusCode,
      _headers: { ...headers },
      _cookies: {},
      
      // Express response methods
      status: jest.fn((code) => {
        mockResponse._status = code;
        mockResponse.statusCode = code;
        return mockResponse;
      }),
      
      json: jest.fn((data) => {
        mockResponse._data = data;
        return mockResponse;
      }),
      
      send: jest.fn((data) => {
        mockResponse._data = data;
        return mockResponse;
      }),
      
      end: jest.fn((data) => {
        if (data) mockResponse._data = data;
        return mockResponse;
      }),
      
      set: jest.fn((name, value) => {
        if (typeof name === 'object') {
          Object.assign(mockResponse._headers, name);
          Object.assign(mockResponse.headers, name);
        } else {
          mockResponse._headers[name] = value;
          mockResponse.headers[name] = value;
        }
        return mockResponse;
      }),
      
      header: jest.fn((name, value) => mockResponse.set(name, value)),
      
      cookie: jest.fn((name, value, options) => {
        mockResponse._cookies[name] = { value, options };
        return mockResponse;
      }),
      
      clearCookie: jest.fn((name) => {
        delete mockResponse._cookies[name];
        return mockResponse;
      }),
      
      redirect: jest.fn((url) => {
        mockResponse._status = 302;
        mockResponse._headers.location = url;
        return mockResponse;
      }),
      
      // Security assertion helpers
      assertSecurityHeaders: () => {
        const securityHeaders = [
          'x-content-type-options',
          'x-frame-options', 
          'x-xss-protection',
          'strict-transport-security'
        ];
        
        const missingHeaders = securityHeaders.filter(
          header => !mockResponse._headers[header]
        );
        
        return {
          hasAllSecurityHeaders: missingHeaders.length === 0,
          missingHeaders,
          headers: mockResponse._headers
        };
      },
      
      assertNoSensitiveDataLeakage: () => {
        const data = mockResponse._data;
        if (!data) return { clean: true };
        
        const dataString = JSON.stringify(data);
        const sensitivePatterns = [
          /password/i,
          /secret/i,
          /token/i,
          /key/i,
          /hash/i,
          /salt/i
        ];
        
        const leaks = sensitivePatterns.filter(pattern => pattern.test(dataString));
        
        return {
          clean: leaks.length === 0,
          potentialLeaks: leaks.length,
          patterns: leaks
        };
      }
    };

    return mockResponse;
  }

  /**
   * Create mock database connection for testing
   * @param {Object} options - Database mock options
   * @returns {Object} Mock database object
   */
  static createMockDatabase(options = {}) {
    const {
      simulateFailure = false,
      failureRate = 0.1,
      responseDelay = 0
    } = options;

    const mockDb = {
      // Track all queries for analysis
      _queries: [],
      _transactions: [],
      
      // Mock postgres template literal queries
      query: jest.fn(async (text, params = []) => {
        const queryLog = {
          text,
          params,
          timestamp: new Date(),
          success: true
        };
        
        if (simulateFailure && Math.random() < failureRate) {
          queryLog.success = false;
          mockDb._queries.push(queryLog);
          throw new Error('Mock database failure');
        }
        
        if (responseDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, responseDelay));
        }
        
        // Simulate realistic responses based on query type
        if (text.toLowerCase().includes('select')) {
          const mockResult = { rows: [{ id: 1, email: 'test@example.com' }] };
          queryLog.result = mockResult;
          mockDb._queries.push(queryLog);
          return mockResult;
        }
        
        if (text.toLowerCase().includes('insert')) {
          const mockResult = { rows: [{ id: crypto.randomUUID() }] };
          queryLog.result = mockResult;
          mockDb._queries.push(queryLog);
          return mockResult;
        }
        
        if (text.toLowerCase().includes('update')) {
          const mockResult = { rowCount: 1 };
          queryLog.result = mockResult;
          mockDb._queries.push(queryLog);
          return mockResult;
        }
        
        mockDb._queries.push(queryLog);
        return { rows: [], rowCount: 0 };
      }),
      
      // Template literal interface (postgres.js style)
      unsafe: jest.fn(async (text, params = []) => {
        return mockDb.query(text, params);
      }),
      
      // Transaction support
      begin: jest.fn(async () => {
        const transactionId = crypto.randomUUID();
        mockDb._transactions.push({ id: transactionId, started: new Date() });
        return transactionId;
      }),
      
      commit: jest.fn(async (transactionId) => {
        const transaction = mockDb._transactions.find(t => t.id === transactionId);
        if (transaction) {
          transaction.committed = new Date();
        }
      }),
      
      rollback: jest.fn(async (transactionId) => {
        const transaction = mockDb._transactions.find(t => t.id === transactionId);
        if (transaction) {
          transaction.rolledBack = new Date();
        }
      }),
      
      // Connection management
      end: jest.fn(async () => {
        mockDb._connectionClosed = true;
      }),
      
      // Security analysis helpers
      analyzeQueries: () => {
        const analysis = {
          totalQueries: mockDb._queries.length,
          sqlInjectionAttempts: 0,
          unauthorizedDataAccess: 0,
          sensitiveDataQueries: 0,
          suspiciousPatterns: []
        };
        
        for (const query of mockDb._queries) {
          const queryText = query.text.toLowerCase();
          
          // Check for SQL injection patterns
          const injectionPatterns = [
            /union\s+select/i,
            /or\s+1\s*=\s*1/i,
            /drop\s+table/i,
            /delete\s+from/i,
            /insert\s+into/i,
            /update\s+.*set/i,
            /--/,
            /\/\*/
          ];
          
          if (injectionPatterns.some(pattern => pattern.test(queryText))) {
            analysis.sqlInjectionAttempts++;
            analysis.suspiciousPatterns.push({
              query: query.text,
              type: 'sql_injection',
              timestamp: query.timestamp
            });
          }
          
          // Check for sensitive data access
          const sensitivePatterns = [
            /password/i,
            /secret/i,
            /token/i,
            /credit_card/i,
            /ssn/i,
            /social_security/i
          ];
          
          if (sensitivePatterns.some(pattern => pattern.test(queryText))) {
            analysis.sensitiveDataQueries++;
          }
        }
        
        return analysis;
      }
    };
    
    return mockDb;
  }

  /**
   * Create mock Supabase client for testing
   * @param {Object} options - Supabase mock options
   * @returns {Object} Mock Supabase client
   */
  static createMockSupabase(options = {}) {
    const {
      simulateFailure = false,
      authFailureRate = 0.2,
      responseDelay = 100
    } = options;

    return {
      auth: {
        getUser: jest.fn(async (token) => {
          if (responseDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, responseDelay));
          }
          
          if (simulateFailure && Math.random() < authFailureRate) {
            return { data: { user: null }, error: new Error('Supabase auth failure') };
          }
          
          // Decode token to simulate Supabase behavior
          try {
            const decoded = jwt.decode(token);
            if (!decoded) {
              return { data: { user: null }, error: new Error('Invalid token') };
            }
            
            return {
              data: {
                user: {
                  id: decoded.id || 'mock-user-id',
                  email: decoded.email || 'mock@example.com',
                  user_metadata: {
                    role: decoded.role || 'patient'
                  },
                  email_confirmed_at: new Date().toISOString(),
                  created_at: new Date().toISOString()
                }
              },
              error: null
            };
          } catch (error) {
            return { data: { user: null }, error: new Error('Token decode failed') };
          }
        }),
        
        getSession: jest.fn(async () => {
          if (simulateFailure && Math.random() < authFailureRate) {
            return { data: { session: null }, error: new Error('Session error') };
          }
          
          return {
            data: {
              session: {
                access_token: 'mock-access-token',
                refresh_token: 'mock-refresh-token',
                expires_at: Math.floor(Date.now() / 1000) + 3600,
                user: {
                  id: 'mock-user-id',
                  email: 'mock@example.com'
                }
              }
            },
            error: null
          };
        }),
        
        signInWithPassword: jest.fn(async (credentials) => {
          const { email, password } = credentials;
          
          if (email === 'fail@example.com' || password === 'wrong') {
            return { data: { user: null }, error: new Error('Invalid credentials') };
          }
          
          return {
            data: {
              user: {
                id: crypto.randomUUID(),
                email,
                user_metadata: { role: 'patient' }
              }
            },
            error: null
          };
        }),
        
        signOut: jest.fn(async () => ({ error: null }))
      },
      
      // Mock other Supabase methods as needed
      from: jest.fn((table) => ({
        select: jest.fn(() => ({ data: [], error: null })),
        insert: jest.fn(() => ({ data: [], error: null })),
        update: jest.fn(() => ({ data: [], error: null })),
        delete: jest.fn(() => ({ data: [], error: null }))
      }))
    };
  }

  /**
   * Generate test environment configurations for different security scenarios
   * @returns {Object} Various environment configurations
   */
  static generateTestEnvironments() {
    return {
      // Secure production environment
      secureProduction: {
        NODE_ENV: 'production',
        JWT_SECRET: crypto.randomBytes(64).toString('hex'),
        JWT_REFRESH_SECRET: crypto.randomBytes(64).toString('hex'),
        SUPABASE_URL: 'https://secure-project.supabase.co',
        SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secure_payload.secure_signature',
        DISABLE_AUTH_FALLBACK: 'true',
        ENABLE_ENHANCED_AUTH: 'true'
      },
      
      // Vulnerable development environment
      vulnerableDevelopment: {
        NODE_ENV: 'development',
        // JWT_SECRET intentionally missing to trigger fallbacks
        SUPABASE_URL: 'https://lehlqkfmguphpxlqbzng.supabase.co',
        SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlaGxxa2ZtZ3VwaHB4bHFiem5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzA3NDQsImV4cCI6MjA3MzYwNjc0NH0.e30FMXlX64smj-TBijeQWIn3SHvKZyXMKDrlkCx4Ysg',
        ENABLE_DEMO_AUTH: 'true'
      },
      
      // Misconfigured production (dangerous)
      misconfiguredProduction: {
        NODE_ENV: 'production',
        JWT_SECRET: 'weak',
        JWT_REFRESH_SECRET: 'development-secret',
        DEBUG: 'true',
        DISABLE_AUTH_FALLBACK: 'false'
      },
      
      // Test environment
      testEnvironment: {
        NODE_ENV: 'test',
        JWT_SECRET: 'test-secret-for-ci-cd-only',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        SUPABASE_URL: 'https://test-project.supabase.co',
        SUPABASE_ANON_KEY: 'test.anon.key'
      }
    };
  }

  /**
   * Performance testing utilities for security operations
   */
  static async measureSecurityOperationPerformance(operation, iterations = 100) {
    const results = {
      times: [],
      errors: 0,
      totalTime: 0,
      averageTime: 0,
      minTime: Infinity,
      maxTime: 0
    };
    
    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      
      try {
        await operation();
      } catch (error) {
        results.errors++;
      }
      
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000; // Convert to milliseconds
      
      results.times.push(duration);
      results.totalTime += duration;
      results.minTime = Math.min(results.minTime, duration);
      results.maxTime = Math.max(results.maxTime, duration);
    }
    
    results.averageTime = results.totalTime / iterations;
    results.successRate = ((iterations - results.errors) / iterations) * 100;
    
    return results;
  }

  /**
   * Validate security test results and generate recommendations
   * @param {Object} testResults - Results from security tests
   * @returns {Object} Security analysis and recommendations
   */
  static analyzeSecurityTestResults(testResults) {
    const analysis = {
      vulnerabilitiesFound: [],
      securityScore: 100,
      recommendations: [],
      criticalIssues: 0,
      warningsIssues: 0
    };
    
    // Analyze JWT secret vulnerabilities
    if (testResults.jwtSecrets) {
      const hardcodedSecrets = testResults.jwtSecrets.hardcodedSecretsFound || 0;
      if (hardcodedSecrets > 0) {
        analysis.vulnerabilitiesFound.push({
          type: 'HARDCODED_JWT_SECRETS',
          severity: 'CRITICAL',
          count: hardcodedSecrets,
          description: 'Hardcoded JWT secrets found in codebase'
        });
        analysis.securityScore -= 30;
        analysis.criticalIssues++;
        analysis.recommendations.push('Replace all hardcoded JWT secrets with environment variables');
      }
    }
    
    // Analyze authentication bypass attempts
    if (testResults.authBypass) {
      const bypassAttempts = testResults.authBypass.successfulBypasses || 0;
      if (bypassAttempts > 0) {
        analysis.vulnerabilitiesFound.push({
          type: 'AUTHENTICATION_BYPASS',
          severity: 'CRITICAL',
          count: bypassAttempts,
          description: 'Authentication bypass vulnerabilities detected'
        });
        analysis.securityScore -= 40;
        analysis.criticalIssues++;
        analysis.recommendations.push('Implement proper authentication validation and token verification');
      }
    }
    
    // Analyze environment variable security
    if (testResults.envVars) {
      const insecureVars = testResults.envVars.insecureConfigurations || 0;
      if (insecureVars > 0) {
        analysis.vulnerabilitiesFound.push({
          type: 'INSECURE_ENVIRONMENT_VARIABLES',
          severity: 'HIGH',
          count: insecureVars,
          description: 'Insecure environment variable configurations'
        });
        analysis.securityScore -= 20;
        analysis.warningsIssues++;
        analysis.recommendations.push('Secure environment variable configuration and validation');
      }
    }
    
    // Analyze frontend secret exposure
    if (testResults.frontendSecrets) {
      const exposedSecrets = testResults.frontendSecrets.exposedSecretsCount || 0;
      if (exposedSecrets > 0) {
        analysis.vulnerabilitiesFound.push({
          type: 'FRONTEND_SECRET_EXPOSURE',
          severity: 'CRITICAL',
          count: exposedSecrets,
          description: 'Secrets exposed in frontend code'
        });
        analysis.securityScore -= 35;
        analysis.criticalIssues++;
        analysis.recommendations.push('Remove all hardcoded secrets from frontend code');
      }
    }
    
    // Generate overall security rating
    if (analysis.securityScore >= 90) {
      analysis.rating = 'EXCELLENT';
    } else if (analysis.securityScore >= 75) {
      analysis.rating = 'GOOD';
    } else if (analysis.securityScore >= 50) {
      analysis.rating = 'NEEDS_IMPROVEMENT';
    } else {
      analysis.rating = 'CRITICAL_ISSUES';
    }
    
    return analysis;
  }
}

/**
 * Export default for CommonJS compatibility
 */
export default SecurityTestUtils;