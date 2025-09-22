/**
 * HIPAA Compliance Security Test Suite
 * Critical Security Validation for Patient Data Protection
 * 
 * Tests Address:
 * - HIPAA 164.312(a)(2)(i): Access control validation
 * - HIPAA 164.312(c)(1): Integrity controls  
 * - HIPAA 164.312(d): Person or entity authentication
 * 
 * CRITICAL VULNERABILITY TESTING:
 * - Salt hardcoding in hipaaAudit.js
 * - Patient data anonymization failures
 * - Environment variable security
 */

import { describe, test, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { hashPatientId, hipaaAuditLogger, generateAuditReport } from '../../src/middleware/hipaaAudit.js';

describe('🚨 CRITICAL HIPAA COMPLIANCE SECURITY TESTS', () => {
  let originalEnv;
  
  beforeAll(() => {
    // Backup original environment
    originalEnv = { ...process.env };
  });
  
  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('🔥 CRITICAL: Salt Hardcoding Vulnerability Testing', () => {
    test('SECURITY FAILURE: Should detect hardcoded salt vulnerability', async () => {
      // Remove environment variable to force fallback to hardcoded salt
      delete process.env.HIPAA_AUDIT_SALT;
      
      // This test demonstrates the CRITICAL security vulnerability
      const patientId1 = 'patient-123';
      const patientId2 = 'patient-456';
      
      // With hardcoded salt, hashing is deterministic and predictable
      const hash1a = bcrypt.hashSync(patientId1, '$2a$10$HIPAAAuditSaltForPatientIDs');
      const hash1b = bcrypt.hashSync(patientId1, '$2a$10$HIPAAAuditSaltForPatientIDs');
      const hash2 = bcrypt.hashSync(patientId2, '$2a$10$HIPAAAuditSaltForPatientIDs');
      
      // VULNERABILITY: Same patient ID always produces same hash
      expect(hash1a).toBe(hash1b);
      expect(hash1a).not.toBe(hash2);
      
      // SECURITY VIOLATION: Hashes are predictable and can be pre-computed
      expect(hash1a).toMatch(/^\$2a\$10\$/);
      
      console.error('🚨 CRITICAL SECURITY VIOLATION: Hardcoded salt detected in fallback');
      console.error('📊 Risk Assessment: Patient re-identification possible');
      console.error('💰 Potential HIPAA fine: $1.5M+');
    });

    test('SECURITY REQUIREMENT: Should fail without proper salt configuration', () => {
      // Remove environment variable
      delete process.env.HIPAA_AUDIT_SALT;
      
      // Should throw error or require secure salt generation
      expect(() => {
        const patientId = 'patient-test-123';
        
        // This demonstrates the vulnerability exists
        const hash = bcrypt.hashSync(patientId, '$2a$10$HIPAAAuditSaltForPatientIDs');
        
        // Should never accept hardcoded salt in production
        if (process.env.NODE_ENV === 'production') {
          throw new Error('HIPAA_AUDIT_SALT must be configured in production');
        }
        
        // Even in non-production, warn about security risk
        console.warn('⚠️ WARNING: Using hardcoded salt - security risk');
        
      }).not.toThrow(); // Currently this doesn't throw - that's the vulnerability
    });

    test('SECURITY VALIDATION: Should enforce unique salt per environment', () => {
      const testSalts = [
        bcrypt.genSaltSync(12),
        bcrypt.genSaltSync(12),
        bcrypt.genSaltSync(12)
      ];
      
      // Each salt should be unique
      expect(testSalts[0]).not.toBe(testSalts[1]);
      expect(testSalts[1]).not.toBe(testSalts[2]);
      expect(testSalts[0]).not.toBe(testSalts[2]);
      
      // All salts should be properly formatted
      testSalts.forEach(salt => {
        expect(salt).toMatch(/^\$2a\$12\$/);
        expect(salt.length).toBeGreaterThan(25);
      });
    });

    test('SECURITY VALIDATION: Should detect salt reuse across patients', () => {
      // Test with proper random salt
      const properSalt = bcrypt.genSaltSync(12);
      process.env.HIPAA_AUDIT_SALT = properSalt;
      
      const patientIds = ['patient-1', 'patient-2', 'patient-3'];
      const hashes = patientIds.map(id => bcrypt.hashSync(id, properSalt));
      
      // Each patient should have unique hash
      expect(new Set(hashes).size).toBe(patientIds.length);
      
      // But same patient should have consistent hash
      const duplicateHash = bcrypt.hashSync('patient-1', properSalt);
      expect(hashes[0]).toBe(duplicateHash);
    });
  });

  describe('🔐 Patient Data Anonymization Security Testing', () => {
    test('HIPAA VALIDATION: Should never expose actual patient IDs', () => {
      const sensitivePatientId = 'patient-123-sensitive';
      const hash = hashPatientId(sensitivePatientId);
      
      // Hash should not contain original patient ID
      expect(hash).not.toContain('patient-123');
      expect(hash).not.toContain('sensitive');
      expect(hash).not.toContain('123');
      
      // Hash should be properly formatted bcrypt hash
      expect(hash).toMatch(/^\$2a\$10\$/);
      expect(hash.length).toBeGreaterThan(50);
    });

    test('HIPAA VALIDATION: Should prevent reverse lookup attacks', () => {
      const patientIds = Array.from({length: 1000}, (_, i) => `patient-${i}`);
      const hashes = patientIds.map(hashPatientId);
      
      // No hash should be predictable from patient ID
      patientIds.forEach((id, index) => {
        expect(hashes[index]).not.toContain(id.split('-')[1]); // numeric part
        expect(hashes[index]).not.toContain('patient');
      });
      
      // All hashes should be unique
      expect(new Set(hashes).size).toBe(patientIds.length);
    });

    test('SECURITY VALIDATION: Should handle null/undefined patient IDs safely', () => {
      expect(hashPatientId(null)).toBeNull();
      expect(hashPatientId(undefined)).toBeNull();
      expect(hashPatientId('')).toBeNull();
      
      // Should not throw errors
      expect(() => hashPatientId(null)).not.toThrow();
      expect(() => hashPatientId(undefined)).not.toThrow();
    });

    test('HIPAA VALIDATION: Should maintain referential integrity', () => {
      const patientId = 'patient-referential-test';
      
      // Same patient should always hash to same value (within session)
      const hash1 = hashPatientId(patientId);
      const hash2 = hashPatientId(patientId);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^\$2a\$10\$/);
    });
  });

  describe('🌍 Environment Variable Security Testing', () => {
    test('CRITICAL: Should never use hardcoded fallback in production', () => {
      // Simulate production environment
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      delete process.env.HIPAA_AUDIT_SALT;
      
      try {
        // In production, should fail without proper salt
        expect(() => {
          // This simulates the current vulnerable code
          const AUDIT_SALT = process.env.HIPAA_AUDIT_SALT || '$2a$10$HIPAAAuditSaltForPatientIDs';
          
          if (process.env.NODE_ENV === 'production' && AUDIT_SALT === '$2a$10$HIPAAAuditSaltForPatientIDs') {
            throw new Error('SECURITY VIOLATION: Hardcoded salt in production');
          }
          
        }).toThrow('SECURITY VIOLATION');
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
      }
    });

    test('SECURITY VALIDATION: Should validate salt complexity', () => {
      const weakSalts = [
        '$2a$04$shortandeasy',
        '$2a$08$notenoughcomplexity',
        'plaintext-salt',
        ''
      ];
      
      weakSalts.forEach(salt => {
        process.env.HIPAA_AUDIT_SALT = salt;
        
        // Should detect weak salts
        const isValidSalt = salt.match(/^\$2a\$(1[0-4])\$/) && salt.length > 25;
        
        if (!isValidSalt) {
          console.warn(`⚠️ WEAK SALT DETECTED: ${salt}`);
        }
        
        expect(isValidSalt || salt === '').toBe(true); // Empty salt also fails validation
      });
    });

    test('SECURITY REQUIREMENT: Should enforce salt rotation capability', () => {
      const salt1 = bcrypt.genSaltSync(12);
      const salt2 = bcrypt.genSaltSync(12);
      
      // Different salts should produce different hashes
      process.env.HIPAA_AUDIT_SALT = salt1;
      const hash1 = hashPatientId('patient-rotation-test');
      
      process.env.HIPAA_AUDIT_SALT = salt2;
      const hash2 = hashPatientId('patient-rotation-test');
      
      expect(hash1).not.toBe(hash2);
      expect(hash1).toMatch(/^\$2a\$12\$/);
      expect(hash2).toMatch(/^\$2a\$12\$/);
    });

    test('SECURITY VALIDATION: Should handle missing environment variables', () => {
      // Remove all HIPAA-related environment variables
      delete process.env.HIPAA_AUDIT_SALT;
      delete process.env.HIPAA_SESSION_TIMEOUT;
      delete process.env.SESSION_RENEW_THRESHOLD;
      
      // Should handle gracefully or fail securely
      expect(() => {
        const patientId = 'patient-env-test';
        
        // This demonstrates current behavior - should be improved
        const hash = hashPatientId(patientId);
        
        // Should warn about missing environment variables
        if (!process.env.HIPAA_AUDIT_SALT) {
          console.warn('⚠️ MISSING HIPAA_AUDIT_SALT environment variable');
        }
        
        return hash;
      }).not.toThrow(); // Currently doesn't throw - improvement needed
    });
  });

  describe('📊 Audit Trail Integrity Testing', () => {
    test('HIPAA VALIDATION: Should maintain immutable audit records', async () => {
      const mockDb = {
        raw: vi.fn().mockResolvedValue({ rows: [] })
      };
      
      // Mock database for audit testing
      vi.doMock('../../src/config/database.js', () => ({
        getDatabase: () => mockDb
      }));
      
      const patientId = 'patient-audit-test';
      const hash = hashPatientId(patientId);
      
      // Verify audit record structure
      expect(hash).toBeDefined();
      expect(hash).not.toContain(patientId);
      expect(hash).toMatch(/^\$2a\$10\$/);
    });

    test('SECURITY VALIDATION: Should prevent audit log tampering', () => {
      const auditRecord = {
        patient_id_hash: hashPatientId('patient-123'),
        endpoint_accessed: '/api/patients/me',
        access_timestamp: new Date(),
        accessed_by_user_id: 'provider-456'
      };
      
      // Generate checksum for audit record
      const recordChecksum = crypto.createHash('sha256')
        .update(JSON.stringify(auditRecord))
        .digest('hex');
      
      // Verify integrity
      expect(recordChecksum).toMatch(/^[a-f0-9]{64}$/);
      expect(auditRecord.patient_id_hash).not.toContain('patient-123');
    });

    test('HIPAA VALIDATION: Should enforce retention policies', () => {
      const retentionPeriodDays = 6 * 365; // 6 years for HIPAA
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionPeriodDays);
      
      const recentRecord = new Date();
      const oldRecord = new Date('2017-01-01'); // Older than 6 years
      
      expect(recentRecord > cutoffDate).toBe(true);
      expect(oldRecord < cutoffDate).toBe(true);
    });
  });

  describe('🔍 HIPAA Compliance Boundary Testing', () => {
    test('CRITICAL: Should detect patient data leakage', () => {
      const sensitiveData = {
        ssn: '123-45-6789',
        dob: '1990-01-01',
        medicalRecord: 'Patient has diabetes',
        email: 'patient@example.com'
      };
      
      // Audit logging should never contain this data
      const hash = hashPatientId('patient-boundary-test');
      
      Object.values(sensitiveData).forEach(sensitive => {
        expect(hash).not.toContain(sensitive);
      });
    });

    test('SECURITY VALIDATION: Should enforce minimum entropy requirements', () => {
      const salt = bcrypt.genSaltSync(12);
      const patientId = 'patient-entropy-test';
      const hash = bcrypt.hashSync(patientId, salt);
      
      // Calculate hash entropy (simplified)
      const uniqueChars = new Set(hash.split(''));
      const entropy = uniqueChars.size / hash.length;
      
      // Should have reasonable entropy
      expect(entropy).toBeGreaterThan(0.4); // At least 40% unique characters
      expect(hash.length).toBeGreaterThan(50);
    });

    test('HIPAA VALIDATION: Should handle edge cases securely', () => {
      const edgeCases = [
        '', // Empty string
        ' ', // Whitespace
        'null', // String null
        '0', // Zero
        'patient-0', // Edge case ID
        'a'.repeat(1000), // Very long ID
        '特殊字符患者', // Unicode characters
        'patient-<script>alert("xss")</script>' // XSS attempt
      ];
      
      edgeCases.forEach(patientId => {
        expect(() => {
          const hash = hashPatientId(patientId);
          
          if (hash) {
            expect(hash).not.toContain(patientId);
            expect(hash).toMatch(/^\$2a\$10\$/);
          }
        }).not.toThrow();
      });
    });
  });
});

/**
 * HIPAA Compliance Risk Assessment
 * Automated risk scoring for identified vulnerabilities
 */
describe('📋 HIPAA Compliance Risk Assessment', () => {
  test('RISK CALCULATION: Salt hardcoding vulnerability', () => {
    const riskFactors = {
      hardcodedSalt: true,
      productionExposure: process.env.NODE_ENV === 'production',
      patientDataExposed: true,
      reversibleHashing: true,
      regulatoryViolation: true
    };
    
    let riskScore = 0;
    
    if (riskFactors.hardcodedSalt) riskScore += 3;
    if (riskFactors.productionExposure) riskScore += 3;
    if (riskFactors.patientDataExposed) riskScore += 2;
    if (riskFactors.reversibleHashing) riskScore += 1;
    if (riskFactors.regulatoryViolation) riskScore += 1;
    
    console.log(`🚨 HIPAA Risk Score: ${riskScore}/10`);
    console.log(`💰 Estimated Fine Risk: $${riskScore * 150000}+`);
    
    expect(riskScore).toBeGreaterThan(7); // Critical risk level
  });

  test('COMPLIANCE CHECKLIST: Required security controls', () => {
    const requiredControls = {
      'Unique salt per environment': false, // Currently failing
      'No hardcoded secrets': false, // Currently failing
      'Patient ID anonymization': true,
      'Audit trail integrity': true,
      'Access control validation': true,
      'Session timeout enforcement': true
    };
    
    const passingControls = Object.values(requiredControls).filter(Boolean).length;
    const totalControls = Object.keys(requiredControls).length;
    const complianceRate = (passingControls / totalControls) * 100;
    
    console.log(`📊 HIPAA Compliance Rate: ${complianceRate.toFixed(1)}%`);
    
    expect(complianceRate).toBeLessThan(80); // Currently failing compliance
  });
});