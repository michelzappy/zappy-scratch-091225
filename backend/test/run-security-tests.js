/**
 * Security Test Runner
 * 
 * Comprehensive test runner for JWT secret hardcoding vulnerability tests
 * This script executes all security tests and provides detailed reporting
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Security test suite configuration
 */
const SECURITY_TEST_SUITES = [
  'test/security/jwt-secret-hardcoding.security.test.js',
  'test/security/frontend-secret-exposure.security.test.js', 
  'test/security/environment-variable-injection.security.test.js',
  'test/security/authentication-bypass-prevention.security.test.js'
];

/**
 * Test execution configuration
 */
const TEST_CONFIG = {
  timeout: 30000,
  verbose: true,
  coverage: true,
  detectOpenHandles: true,
  forceExit: true
};

/**
 * Main test runner
 */
async function runSecurityTests() {
  console.log('🔐 Starting JWT Secret Hardcoding Vulnerability Test Suite');
  console.log('=' .repeat(80));
  
  const results = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    skippedTests: 0,
    securityIssuesFound: [],
    coverage: {},
    executionTime: 0
  };
  
  const startTime = Date.now();
  
  try {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-for-security-testing';
    
    console.log('📋 Test Environment Configuration:');
    console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`- Test Timeout: ${TEST_CONFIG.timeout}ms`);
    console.log(`- Coverage Enabled: ${TEST_CONFIG.coverage}`);
    console.log('');
    
    // Run each test suite
    for (const testSuite of SECURITY_TEST_SUITES) {
      console.log(`🧪 Running ${testSuite}...`);
      
      try {
        const jestCommand = [
          'npx jest',
          `"${testSuite}"`,
          '--verbose',
          '--no-cache',
          '--detectOpenHandles',
          '--forceExit',
          `--testTimeout=${TEST_CONFIG.timeout}`,
          TEST_CONFIG.coverage ? '--coverage' : '',
          '--coverageDirectory=coverage/security',
          '--coverageReporters=text,lcov,json-summary'
        ].filter(Boolean).join(' ');
        
        console.log(`Executing: ${jestCommand}`);
        
        const output = execSync(jestCommand, {
          cwd: process.cwd(),
          encoding: 'utf8',
          env: { ...process.env },
          stdio: 'pipe'
        });
        
        console.log('✅ Test suite passed');
        console.log(output);
        
        // Parse test results from output
        const testResults = parseJestOutput(output);
        results.totalTests += testResults.total;
        results.passedTests += testResults.passed;
        results.failedTests += testResults.failed;
        results.skippedTests += testResults.skipped;
        
      } catch (error) {
        console.log('❌ Test suite failed');
        console.log(error.stdout || error.message);
        
        // Parse failed test results
        const testResults = parseJestOutput(error.stdout || '');
        results.totalTests += testResults.total;
        results.passedTests += testResults.passed;
        results.failedTests += testResults.failed;
        results.skippedTests += testResults.skipped;
        
        // Extract security issues from error output
        const securityIssues = extractSecurityIssues(error.stdout || error.message);
        results.securityIssuesFound.push(...securityIssues);
      }
      
      console.log('');
    }
    
    // Read coverage data if available
    try {
      const coveragePath = path.join(process.cwd(), 'coverage/security/coverage-summary.json');
      if (fs.existsSync(coveragePath)) {
        results.coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      }
    } catch (error) {
      console.warn('⚠️  Could not read coverage data:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
  
  results.executionTime = Date.now() - startTime;
  
  // Generate comprehensive report
  generateSecurityReport(results);
  
  return results;
}

/**
 * Parse Jest output to extract test results
 */
function parseJestOutput(output) {
  const results = { total: 0, passed: 0, failed: 0, skipped: 0 };
  
  // Look for Jest summary patterns
  const summaryMatch = output.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/);
  if (summaryMatch) {
    results.failed = parseInt(summaryMatch[1]);
    results.passed = parseInt(summaryMatch[2]);
    results.total = parseInt(summaryMatch[3]);
  }
  
  // Look for other patterns
  const passedMatch = output.match(/(\d+)\s+passed/);
  const failedMatch = output.match(/(\d+)\s+failed/);
  const totalMatch = output.match(/(\d+)\s+total/);
  
  if (passedMatch) results.passed = parseInt(passedMatch[1]);
  if (failedMatch) results.failed = parseInt(failedMatch[1]);
  if (totalMatch) results.total = parseInt(totalMatch[1]);
  
  return results;
}

/**
 * Extract security issues from test output
 */
function extractSecurityIssues(output) {
  const issues = [];
  
  // Look for security warning patterns
  const securityPatterns = [
    /🚨 CRITICAL VULNERABILITY: (.+)/g,
    /🚨 SECURITY RISK: (.+)/g,
    /🚨 AUTHENTICATION BYPASS: (.+)/g,
    /🚨 PRIVILEGE ESCALATION: (.+)/g,
    /🚨 ENVIRONMENT INJECTION: (.+)/g
  ];
  
  for (const pattern of securityPatterns) {
    let match;
    while ((match = pattern.exec(output)) !== null) {
      issues.push({
        type: 'SECURITY_VULNERABILITY',
        severity: 'CRITICAL',
        message: match[1],
        source: 'test_output'
      });
    }
  }
  
  return issues;
}

/**
 * Generate comprehensive security test report
 */
function generateSecurityReport(results) {
  console.log('📊 SECURITY TEST REPORT');
  console.log('=' .repeat(80));
  
  // Test execution summary
  console.log('📈 Test Execution Summary:');
  console.log(`- Total Tests: ${results.totalTests}`);
  console.log(`- Passed: ${results.passedTests} ✅`);
  console.log(`- Failed: ${results.failedTests} ❌`);
  console.log(`- Skipped: ${results.skippedTests} ⏭️`);
  console.log(`- Execution Time: ${(results.executionTime / 1000).toFixed(2)}s`);
  console.log('');
  
  // Security issues summary
  console.log('🚨 Security Issues Found:');
  if (results.securityIssuesFound.length > 0) {
    console.log(`- Total Issues: ${results.securityIssuesFound.length}`);
    
    const groupedIssues = results.securityIssuesFound.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {});
    
    for (const [type, count] of Object.entries(groupedIssues)) {
      console.log(`- ${type}: ${count}`);
    }
    
    console.log('\n🔍 Detailed Issues:');
    results.securityIssuesFound.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.severity}] ${issue.message}`);
    });
  } else {
    console.log('✅ No security issues detected in test output');
  }
  console.log('');
  
  // Coverage summary
  if (results.coverage && results.coverage.total) {
    console.log('📊 Code Coverage Summary:');
    const { statements, branches, functions, lines } = results.coverage.total;
    console.log(`- Statements: ${statements.pct}% (${statements.covered}/${statements.total})`);
    console.log(`- Branches: ${branches.pct}% (${branches.covered}/${branches.total})`);
    console.log(`- Functions: ${functions.pct}% (${functions.covered}/${functions.total})`);
    console.log(`- Lines: ${lines.pct}% (${lines.covered}/${lines.total})`);
  }
  console.log('');
  
  // Security recommendations
  console.log('💡 Security Recommendations:');
  console.log('1. ✅ Replace all hardcoded JWT secrets with environment variables');
  console.log('2. ✅ Implement proper environment variable validation');
  console.log('3. ✅ Add JWT secret strength requirements for production');
  console.log('4. ✅ Remove hardcoded Supabase keys from frontend code');
  console.log('5. ✅ Implement authentication bypass prevention measures');
  console.log('6. ✅ Add security headers and proper error handling');
  console.log('7. ✅ Implement token blacklisting for replay attack prevention');
  console.log('8. ✅ Add comprehensive security monitoring and alerting');
  console.log('');
  
  // Final assessment
  const successRate = results.totalTests > 0 ? (results.passedTests / results.totalTests) * 100 : 0;
  const hasSecurityIssues = results.securityIssuesFound.length > 0;
  
  console.log('🏆 FINAL ASSESSMENT:');
  if (successRate >= 90 && !hasSecurityIssues) {
    console.log('✅ EXCELLENT: Security tests passed with no critical issues');
  } else if (successRate >= 75 && results.securityIssuesFound.length <= 2) {
    console.log('⚠️  GOOD: Most security tests passed, minor issues found');
  } else if (successRate >= 50) {
    console.log('🚨 NEEDS IMPROVEMENT: Significant security issues detected');
  } else {
    console.log('❌ CRITICAL: Major security vulnerabilities found - immediate action required');
  }
  
  console.log(`Success Rate: ${successRate.toFixed(1)}%`);
  console.log(`Security Issues: ${results.securityIssuesFound.length}`);
  console.log('=' .repeat(80));
}

// Run tests if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSecurityTests()
    .then(results => {
      const exitCode = results.failedTests > 0 || results.securityIssuesFound.length > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('Fatal error running security tests:', error);
      process.exit(1);
    });
}

export { runSecurityTests };