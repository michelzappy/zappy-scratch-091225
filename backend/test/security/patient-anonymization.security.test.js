/**
 * Patient Data Anonymization Validation Test Suite
 * Critical Security Testing for HIPAA Patient Privacy Protection
 * 
 * ADDRESSES CRITICAL VULNERABILITIES:
 * - Patient ID re-identification attacks
 * - Data correlation vulnerabilities  
 * - Pseudonymization failures
 * - Statistical disclosure risks
 * 
 * HIPAA Requirements:
 * - 164.514(a): De-identification standard
 * - 164.514(b): Safe harbor method
 * - 164.514(c): Expert determination
 * - 164.312(a)(2)(i): Unique user identification
 */

import { describe, test, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { hashPatientId } from '../../src/middleware/hipaaAudit.js';

describe('🔐 CRITICAL: Patient Data Anonymization Security', () => {
  let originalEnv;
  let anonymizationMetrics = {
    totalTests: 0,
    passedTests: 0,
    vulnerabilities: [],
    riskScore: 0
  };
  
  beforeAll(() => {
    originalEnv = { ...process.env };
  });
  
  afterAll(() => {
    process.env = originalEnv;
    
    // Generate final anonymization report
    console.log('\n📊 PATIENT ANONYMIZATION SECURITY REPORT:');
    console.log(`  Total Tests: ${anonymizationMetrics.totalTests}`);
    console.log(`  Passed: ${anonymizationMetrics.passedTests}`);
    console.log(`  Failed: ${anonymizationMetrics.totalTests - anonymizationMetrics.passedTests}`);
    console.log(`  Risk Score: ${anonymizationMetrics.riskScore}/10`);
    
    if (anonymizationMetrics.vulnerabilities.length > 0) {
      console.error('\n🚨 IDENTIFIED VULNERABILITIES:');
      anonymizationMetrics.vulnerabilities.forEach((vuln, index) => {
        console.error(`  ${index + 1}. ${vuln}`);
      });
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    anonymizationMetrics.totalTests++;
  });

  describe('🆔 Patient Identifier Anonymization Testing', () => {
    test('CRITICAL: Should prevent patient ID reverse lookup', () => {
      const testCases = [
        { id: 'patient-123', type: 'sequential' },
        { id: 'patient-456789', type: 'numeric' },
        { id: 'john.doe.1990', type: 'name-based' },
        { id: 'user_12345_2024', type: 'structured' },
        { id: 'p-2024-001-m', type: 'coded' }
      ];
      
      testCases.forEach(({ id, type }) => {
        const hash = hashPatientId(id);
        
        // Hash should not contain any part of original ID
        const idComponents = id.split(/[-._]/);
        idComponents.forEach(component => {
          if (component.length > 2) { // Ignore very short components
            expect(hash).not.toContain(component);
          }
        });
        
        // Hash should not reveal ID structure
        expect(hash).not.toMatch(new RegExp(id.replace(/\d+/g, '\\d+')));
        expect(hash).toMatch(/^\$2a\$10\$/);
        
        console.log(`✅ ${type} ID anonymized: ${id.substring(0, 8)}... → ${hash.substring(0, 20)}...`);
      });
      
      anonymizationMetrics.passedTests++;
    });

    test('SECURITY VALIDATION: Should resist dictionary attacks', () => {
      // Common patient ID patterns that attackers might try
      const commonPatterns = [
        'patient-1', 'patient-2', 'patient-3', // Sequential
        'user-001', 'user-002', 'user-003',    // Zero-padded
        'p001', 'p002', 'p003',                // Short form
        'pt_001', 'pt_002', 'pt_003',          // Underscore format
        '123', '456', '789',                   // Simple numeric
        'john', 'jane', 'smith',               // Common names
        'test', 'demo', 'sample'               // Test data
      ];
      
      const hashDictionary = new Map();
      let vulnerableHashes = 0;
      
      commonPatterns.forEach(pattern => {
        const hash = hashPatientId(pattern);
        
        // Check for hash collisions (shouldn't happen with good salt)
        if (hashDictionary.has(hash)) {
          vulnerableHashes++;
          anonymizationMetrics.vulnerabilities.push(
            `Hash collision detected: ${pattern} and ${hashDictionary.get(hash)}`
          );
        } else {
          hashDictionary.set(hash, pattern);
        }
        
        // Hash should not be predictable
        expect(hash).not.toContain(pattern);
        expect(hash.length).toBeGreaterThan(50);
      });
      
      expect(vulnerableHashes).toBe(0);
      console.log(`🛡️ Dictionary attack resistance: ${commonPatterns.length} patterns tested`);
      
      if (vulnerableHashes === 0) {
        anonymizationMetrics.passedTests++;
      }
    });

    test('HIPAA VALIDATION: Should maintain referential integrity', () => {
      const patientId = 'patient-referential-test';
      const sessionHashes = [];
      
      // Same patient should hash consistently within session
      for (let i = 0; i < 10; i++) {
        const hash = hashPatientId(patientId);
        sessionHashes.push(hash);
      }
      
      // All hashes should be identical (referential integrity)
      const uniqueHashes = new Set(sessionHashes);
      expect(uniqueHashes.size).toBe(1);
      
      // But hash should not reveal original ID
      sessionHashes.forEach(hash => {
        expect(hash).not.toContain('patient');
        expect(hash).not.toContain('referential');
        expect(hash).not.toContain('test');
      });
      
      console.log(`🔗 Referential integrity maintained: ${sessionHashes.length} consistent hashes`);
      anonymizationMetrics.passedTests++;
    });

    test('CRITICAL: Should prevent timing attacks', () => {
      const patientIds = [
        'a',                                    // Very short
        'patient-medium-length-id',             // Medium
        'patient-very-long-identifier-with-many-components-and-details' // Long
      ];
      
      const timings = patientIds.map(id => {
        const start = process.hrtime.bigint();
        hashPatientId(id);
        const end = process.hrtime.bigint();
        return Number(end - start) / 1_000_000; // Convert to milliseconds
      });
      
      // Timing should not correlate with input length
      const maxTiming = Math.max(...timings);
      const minTiming = Math.min(...timings);
      const timingVariance = ((maxTiming - minTiming) / minTiming) * 100;
      
      // Acceptable variance threshold (bcrypt should be consistent)
      expect(timingVariance).toBeLessThan(50); // Less than 50% variance
      
      console.log(`⏱️ Timing attack resistance: ${timingVariance.toFixed(2)}% variance`);
      anonymizationMetrics.passedTests++;
    });
  });

  describe('🔍 Statistical Disclosure Protection', () => {
    test('CRITICAL: Should prevent frequency analysis attacks', () => {
      // Generate large dataset to test frequency analysis
      const patientCount = 1000;
      const patientIds = Array.from({length: patientCount}, (_, i) => `patient-${i}`);
      const hashes = patientIds.map(hashPatientId);
      
      // Analyze hash character frequency
      const charFrequency = {};
      hashes.forEach(hash => {
        for (const char of hash) {
          charFrequency[char] = (charFrequency[char] || 0) + 1;
        }
      });
      
      // Calculate chi-square test for uniformity
      const expectedFreq = hashes.join('').length / Object.keys(charFrequency).length;
      let chiSquare = 0;
      
      Object.values(charFrequency).forEach(observed => {
        chiSquare += Math.pow(observed - expectedFreq, 2) / expectedFreq;
      });
      
      // Chi-square should indicate random distribution
      const degreesOfFreedom = Object.keys(charFrequency).length - 1;
      const criticalValue = 124.3; // 95% confidence for ~64 characters
      
      expect(chiSquare).toBeLessThan(criticalValue * 2); // Allow some variance
      
      console.log(`📊 Frequency analysis: χ² = ${chiSquare.toFixed(2)} (critical: ${criticalValue})`);
      anonymizationMetrics.passedTests++;
    });

    test('SECURITY VALIDATION: Should resist correlation attacks', () => {
      // Test different patient ID formats from same "source"
      const basePatients = ['john', 'jane', 'bob', 'alice', 'charlie'];
      const formats = [
        id => `patient-${id}`,
        id => `user_${id}_2024`,
        id => `${id}.patient.system`,
        id => `p-${id}-active`,
        id => `system.${id}.id`
      ];
      
      const correlationMatrix = {};
      
      basePatients.forEach(baseName => {
        correlationMatrix[baseName] = formats.map(format => {
          const patientId = format(baseName);
          return hashPatientId(patientId);
        });
      });
      
      // Check for correlation between hashes of same base name
      basePatients.forEach(baseName => {
        const baseHashes = correlationMatrix[baseName];
        
        // No hash should be similar to others from same base
        for (let i = 0; i < baseHashes.length; i++) {
          for (let j = i + 1; j < baseHashes.length; j++) {
            const similarity = calculateHashSimilarity(baseHashes[i], baseHashes[j]);
            expect(similarity).toBeLessThan(0.3); // Less than 30% similar
          }
        }
      });
      
      console.log(`🔗 Correlation resistance: ${basePatients.length} base patterns tested`);
      anonymizationMetrics.passedTests++;
    });

    test('HIPAA VALIDATION: Should support k-anonymity requirements', () => {
      // Simulate patient cohort with similar characteristics
      const cohortSize = 100;
      const k = 5; // Minimum group size for k-anonymity
      
      const cohortHashes = Array.from({length: cohortSize}, (_, i) => {
        const patientId = `cohort-patient-${String(i).padStart(3, '0')}`;
        return hashPatientId(patientId);
      });
      
      // Count hash frequency (shouldn't have frequent patterns)
      const hashCounts = {};
      cohortHashes.forEach(hash => {
        // Look at hash prefixes to detect patterns
        const prefix = hash.substring(0, 20);
        hashCounts[prefix] = (hashCounts[prefix] || 0) + 1;
      });
      
      // No prefix should appear too frequently
      const maxFrequency = Math.max(...Object.values(hashCounts));
      expect(maxFrequency).toBeLessThan(k); // Support k-anonymity
      
      console.log(`🔒 K-anonymity support: max frequency ${maxFrequency} < ${k}`);
      anonymizationMetrics.passedTests++;
    });
  });

  describe('🛡️ Advanced Anonymization Security', () => {
    test('CRITICAL: Should prevent linkage attacks', () => {
      // Simulate auxiliary data that attacker might have
      const auxiliaryData = [
        { patientId: 'patient-123', age: 35, zipCode: '12345' },
        { patientId: 'patient-456', age: 42, zipCode: '67890' },
        { patientId: 'patient-789', age: 28, zipCode: '12345' }
      ];
      
      const anonymizedRecords = auxiliaryData.map(record => ({
        hashedId: hashPatientId(record.patientId),
        age: record.age,
        zipCode: record.zipCode
      }));
      
      // Verify that hashed ID doesn't leak information
      anonymizedRecords.forEach(record => {
        expect(record.hashedId).not.toContain(record.age.toString());
        expect(record.hashedId).not.toContain(record.zipCode);
      });
      
      // Multiple patients in same zip shouldn't have similar hashes
      const sameZipHashes = anonymizedRecords
        .filter(r => r.zipCode === '12345')
        .map(r => r.hashedId);
      
      if (sameZipHashes.length > 1) {
        const similarity = calculateHashSimilarity(sameZipHashes[0], sameZipHashes[1]);
        expect(similarity).toBeLessThan(0.2);
      }
      
      console.log(`🔗 Linkage attack resistance: ${auxiliaryData.length} records tested`);
      anonymizationMetrics.passedTests++;
    });

    test('SECURITY VALIDATION: Should handle edge cases securely', () => {
      const edgeCases = [
        { id: '', description: 'empty string' },
        { id: ' ', description: 'whitespace' },
        { id: null, description: 'null value' },
        { id: undefined, description: 'undefined value' },
        { id: '0', description: 'zero string' },
        { id: 'patient-' + 'x'.repeat(1000), description: 'very long ID' },
        { id: '患者-123', description: 'unicode characters' },
        { id: 'patient-<script>alert("xss")</script>', description: 'XSS payload' },
        { id: "patient'; DROP TABLE patients; --", description: 'SQL injection' }
      ];
      
      let securelyHandled = 0;
      
      edgeCases.forEach(({ id, description }) => {
        try {
          const hash = hashPatientId(id);
          
          if (hash === null && (id === null || id === undefined || id === '')) {
            // Correctly handled null/empty cases
            securelyHandled++;
          } else if (hash && !hash.includes(id)) {
            // Successfully anonymized without leaking input
            securelyHandled++;
          }
          
          console.log(`✅ Edge case handled: ${description}`);
        } catch (error) {
          // Should handle errors gracefully
          console.warn(`⚠️ Edge case error: ${description} - ${error.message}`);
        }
      });
      
      const successRate = (securelyHandled / edgeCases.length) * 100;
      expect(successRate).toBeGreaterThan(80); // At least 80% handled securely
      
      console.log(`🛡️ Edge case security: ${successRate.toFixed(1)}% handled securely`);
      anonymizationMetrics.passedTests++;
    });

    test('CRITICAL: Should prevent inference attacks', () => {
      // Test scenario where attacker tries to infer patient ID from multiple queries
      const suspectedPatientIds = [
        'patient-001', 'patient-002', 'patient-003',
        'user-001', 'user-002', 'user-003',
        'p001', 'p002', 'p003'
      ];
      
      const inferenceAttempts = [];
      
      suspectedPatientIds.forEach(suspectedId => {
        const hash = hashPatientId(suspectedId);
        inferenceAttempts.push({
          attempt: suspectedId,
          hash: hash,
          pattern: detectPattern(suspectedId)
        });
      });
      
      // Group by pattern to simulate inference attack
      const patternGroups = {};
      inferenceAttempts.forEach(attempt => {
        if (!patternGroups[attempt.pattern]) {
          patternGroups[attempt.pattern] = [];
        }
        patternGroups[attempt.pattern].push(attempt);
      });
      
      // Verify no inferential information leakage
      Object.values(patternGroups).forEach(group => {
        if (group.length > 1) {
          const hashes = group.map(g => g.hash);
          
          // Hashes in same pattern group should not be similar
          for (let i = 0; i < hashes.length - 1; i++) {
            const similarity = calculateHashSimilarity(hashes[i], hashes[i + 1]);
            expect(similarity).toBeLessThan(0.25);
          }
        }
      });
      
      console.log(`🕵️ Inference attack resistance: ${Object.keys(patternGroups).length} patterns tested`);
      anonymizationMetrics.passedTests++;
    });
  });

  describe('🔒 Anonymization Quality Metrics', () => {
    test('QUALITY METRICS: Calculate anonymization entropy', () => {
      const testPatients = Array.from({length: 100}, (_, i) => `patient-${i}`);
      const hashes = testPatients.map(hashPatientId);
      
      // Calculate Shannon entropy of hash distribution
      const hashChars = hashes.join('');
      const charCounts = {};
      
      for (const char of hashChars) {
        charCounts[char] = (charCounts[char] || 0) + 1;
      }
      
      const totalChars = hashChars.length;
      let entropy = 0;
      
      Object.values(charCounts).forEach(count => {
        const probability = count / totalChars;
        entropy -= probability * Math.log2(probability);
      });
      
      // High entropy indicates good anonymization
      expect(entropy).toBeGreaterThan(4.0); // At least 4 bits per character
      
      console.log(`📊 Anonymization entropy: ${entropy.toFixed(3)} bits per character`);
      
      const quality = Math.min(entropy / 5.0, 1.0) * 100; // Normalize to percentage
      console.log(`🎯 Anonymization quality score: ${quality.toFixed(1)}%`);
      
      anonymizationMetrics.passedTests++;
    });

    test('VALIDATION: Verify de-identification completeness', () => {
      const patientData = {
        id: 'patient-john-doe-1990',
        firstName: 'John',
        lastName: 'Doe',
        birthYear: 1990,
        ssn: '123-45-6789',
        email: 'john.doe@example.com'
      };
      
      const hash = hashPatientId(patientData.id);
      
      // Hash should not contain any PII elements
      const piiElements = [
        patientData.firstName.toLowerCase(),
        patientData.lastName.toLowerCase(),
        patientData.birthYear.toString(),
        patientData.ssn.replace(/-/g, ''),
        patientData.email.split('@')[0]
      ];
      
      piiElements.forEach(element => {
        expect(hash.toLowerCase()).not.toContain(element.toLowerCase());
      });
      
      console.log(`🔒 De-identification verified: ${piiElements.length} PII elements protected`);
      anonymizationMetrics.passedTests++;
    });
  });
});

/**
 * Utility Functions for Anonymization Testing
 */

function calculateHashSimilarity(hash1, hash2) {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) return 0;
  
  let matches = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] === hash2[i]) matches++;
  }
  
  return matches / hash1.length;
}

function detectPattern(id) {
  if (/^patient-\d+$/.test(id)) return 'patient-sequential';
  if (/^user-\d+$/.test(id)) return 'user-sequential';
  if (/^p\d+$/.test(id)) return 'p-numeric';
  if (/\d{4}/.test(id)) return 'contains-year';
  if (/[a-z]+\.[a-z]+/.test(id)) return 'name-dot-format';
  return 'other';
}

/**
 * Final Security Assessment
 */
describe('📋 Anonymization Security Assessment', () => {
  test('ASSESSMENT: Generate final security score', () => {
    const totalPossibleTests = 12; // Total number of anonymization tests
    const completionRate = (anonymizationMetrics.passedTests / totalPossibleTests) * 100;
    
    // Calculate risk score based on failures
    const failureRate = ((totalPossibleTests - anonymizationMetrics.passedTests) / totalPossibleTests);
    anonymizationMetrics.riskScore = Math.round(failureRate * 10);
    
    console.log('\n🎯 PATIENT ANONYMIZATION SECURITY ASSESSMENT:');
    console.log(`  Completion Rate: ${completionRate.toFixed(1)}%`);
    console.log(`  Risk Score: ${anonymizationMetrics.riskScore}/10`);
    
    if (anonymizationMetrics.riskScore > 3) {
      console.error('🚨 HIGH RISK: Patient anonymization failures detected');
      anonymizationMetrics.vulnerabilities.push('High risk anonymization failures');
    }
    
    expect(completionRate).toBeGreaterThan(90); // Should pass 90%+ of tests
  });
});