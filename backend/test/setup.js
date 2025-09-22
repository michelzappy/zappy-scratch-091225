/**
 * Jest Test Setup for Security Testing
 * Configures environment and mocks for JWT secret vulnerability testing
 */

import { jest } from '@jest/globals';

// Mock console methods to capture security-related logs
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn()
};

// Store original environment variables
const originalEnv = process.env;

// Setup test environment variables
beforeEach(() => {
  // Reset environment to clean state for each test
  jest.resetModules();
  process.env = { ...originalEnv };
  
  // Clear console mocks
  jest.clearAllMocks();
});

afterEach(() => {
  // Restore original environment
  process.env = originalEnv;
});

// Security test utilities
global.SecurityTestUtils = {
  /**
   * Generate test JWT tokens with various secret configurations
   */
  generateTestTokens: (payload = { id: 'test-user', email: 'test@example.com' }) => {
    const jwt = require('jsonwebtoken');
    
    return {
      withHardcodedSecret: jwt.sign(payload, 'development-secret-key-change-in-production'),
      withYourSecretKey: jwt.sign(payload, 'your-secret-key'),
      withDevelopmentSecret: jwt.sign(payload, 'development-secret'),
      withSecureSecret: jwt.sign(payload, 'a-very-secure-randomly-generated-secret-key-for-production-use-only'),
      withEmptySecret: jwt.sign(payload, ''),
      malformed: 'invalid.jwt.token'
    };
  },

  /**
   * Mock dangerous environment states
   */
  mockEnvironmentStates: {
    production: () => {
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_SECRET;
    },
    developmentWithoutSecret: () => {
      process.env.NODE_ENV = 'development';
      delete process.env.JWT_SECRET;
    },
    productionWithWeakSecret: () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'weak';
    },
    secureProduction: () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'a-very-secure-randomly-generated-secret-key-for-production-use-only';
    }
  },

  /**
   * Hardcoded secrets found in the codebase
   */
  knownVulnerableSecrets: [
    'development-secret-key-change-in-production',
    'your-secret-key', 
    'development-secret',
    'secret' // Generic fallback
  ],

  /**
   * Create mock request objects for testing
   */
  createMockRequest: (token = null, headers = {}) => ({
    headers: {
      authorization: token ? `Bearer ${token}` : undefined,
      ...headers
    },
    ip: '127.0.0.1',
    get: jest.fn((header) => headers[header] || 'test-user-agent')
  }),

  /**
   * Create mock response objects for testing
   */
  createMockResponse: () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      headers: {}
    };
    res.set = jest.fn((key, value) => {
      res.headers[key] = value;
      return res;
    });
    return res;
  }
};

// Global test timeout for security tests
jest.setTimeout(30000);

export default {};