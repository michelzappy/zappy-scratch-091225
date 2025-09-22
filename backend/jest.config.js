/**
 * Jest Configuration for Security Testing
 * Focused on JWT Secret Hardcoding Vulnerability Testing
 */
export default {
  // Use ES modules
  preset: 'jest-esm',
  
  // Test environment
  testEnvironment: 'node',
  
  // File extensions to process
  extensionsToTreatAsEsm: ['.js'],
  
  // Transform configuration for ES modules
  transform: {},
  
  // Test file patterns
  testMatch: [
    '**/test/**/*.test.js',
    '**/test/**/*.security.test.js',
    '**/__tests__/**/*.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/config/database.js' // Exclude database config from coverage
  ],
  
  // Coverage thresholds for security-critical files
  coverageThreshold: {
    'src/middleware/auth.js': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90
    },
    'src/middleware/authResilience.js': {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85
    },
    'src/services/auth.service.js': {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    }
  },
  
  // Test timeout
  testTimeout: 30000,
  
  // Verbose output for security tests
  verbose: true,
  
  // Fail tests if open handles remain
  detectOpenHandles: true,
  forceExit: true,
  
  // Environment variables for testing
  testEnvironment: 'node',
  
  // Module name mapping for imports
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};