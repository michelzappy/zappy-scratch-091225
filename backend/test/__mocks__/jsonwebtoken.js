/**
 * Mock implementation of jsonwebtoken for security testing
 * This mock allows us to test JWT secret vulnerabilities without
 * relying on the actual JWT library behavior
 */

import { jest } from '@jest/globals';

// Track all JWT operations for security analysis
const jwtOperations = [];

const mockJwt = {
  sign: jest.fn((payload, secret, options = {}) => {
    const operation = {
      type: 'sign',
      payload,
      secret,
      options,
      timestamp: Date.now()
    };
    jwtOperations.push(operation);
    
    // Generate a mock token that includes the secret for testing
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = Buffer.from(`mock-signature-${secret}`).toString('base64url');
    
    return `${header}.${payloadEncoded}.${signature}`;
  }),

  verify: jest.fn((token, secret) => {
    const operation = {
      type: 'verify',
      token,
      secret,
      timestamp: Date.now()
    };
    jwtOperations.push(operation);
    
    try {
      const [header, payload, signature] = token.split('.');
      
      if (!header || !payload || !signature) {
        throw new Error('jwt malformed');
      }
      
      // Check if signature matches the secret used
      const expectedSignature = Buffer.from(`mock-signature-${secret}`).toString('base64url');
      
      if (signature !== expectedSignature) {
        throw new Error('invalid signature');
      }
      
      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());
      
      // Check expiration
      if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      }
      
      return decodedPayload;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw error;
      }
      throw new Error('invalid token');
    }
  }),

  decode: jest.fn((token) => {
    const operation = {
      type: 'decode',
      token,
      timestamp: Date.now()
    };
    jwtOperations.push(operation);
    
    try {
      const [header, payload] = token.split('.');
      if (!payload) return null;
      
      return JSON.parse(Buffer.from(payload, 'base64url').toString());
    } catch (error) {
      return null;
    }
  }),

  // Security testing utilities
  getOperations: () => jwtOperations,
  
  clearOperations: () => {
    jwtOperations.length = 0;
  },
  
  analyzeSecretUsage: () => {
    const secretUsage = {};
    const vulnerableSecrets = [
      'development-secret-key-change-in-production',
      'your-secret-key',
      'development-secret',
      'secret'
    ];
    
    for (const operation of jwtOperations) {
      if (operation.secret) {
        if (!secretUsage[operation.secret]) {
          secretUsage[operation.secret] = 0;
        }
        secretUsage[operation.secret]++;
      }
    }
    
    return {
      secretUsage,
      vulnerableSecretsUsed: Object.keys(secretUsage).filter(secret => 
        vulnerableSecrets.includes(secret)
      ),
      totalOperations: jwtOperations.length
    };
  }
};

export default mockJwt;
export const { sign, verify, decode } = mockJwt;