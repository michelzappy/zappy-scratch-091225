import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import bcrypt from 'bcrypt';
import {
  PrivilegedDatabaseManager,
  PRIVILEGE_LEVELS,
  privilegedDbManager,
  getReadOnlyDatabase,
  getPatientUpdateDatabase,
  getMigrationDatabase,
  getEmergencyDatabase,
  requestEmergencyDatabaseAccess
} from '../../src/config/databasePrivileged.js';

// Mock postgres and drizzle
vi.mock('postgres', () => {
  const mockConnection = vi.fn(() => ({
    end: vi.fn().mockResolvedValue(undefined),
    execute: vi.fn().mockResolvedValue([{ count: 10, checksum: 'mock_checksum' }])
  }));
  mockConnection.mockImplementation.tagged = vi.fn().mockResolvedValue([{ '?column?': 1 }]);
  return { default: mockConnection };
});

vi.mock('drizzle-orm/postgres-js', () => ({
  drizzle: vi.fn(() => ({
    execute: vi.fn().mockResolvedValue([{ count: 10, checksum: 'mock_checksum' }]),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([])
  }))
}));

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_patient_id'),
    compare: vi.fn().mockResolvedValue(true)
  }
}));

describe('PrivilegedDatabaseManager', () => {
  let manager;
  
  beforeAll(() => {
    // Set required environment variables
    process.env.DATABASE_URL = 'postgresql://telehealth_user:secure_password@localhost:5432/telehealth_db';
  });

  beforeEach(async () => {
    manager = new PrivilegedDatabaseManager();
    await manager.initialize();
  });

  afterEach(async () => {
    if (manager) {
      await manager.closeAllConnections();
    }
  });

  afterAll(() => {
    delete process.env.DATABASE_URL;
  });

  describe('initialization', () => {
    it('should initialize with all privilege levels', async () => {
      expect(manager.initialized).toBe(true);
    });

    it('should throw error without DATABASE_URL', async () => {
      delete process.env.DATABASE_URL;
      const newManager = new PrivilegedDatabaseManager();
      
      await expect(newManager.initialize()).rejects.toThrow('DATABASE_URL environment variable is required');
    });
  });

  describe('database access by privilege level', () => {
    it('should provide readonly database access', async () => {
      const db = await manager.getDatabase(PRIVILEGE_LEVELS.READONLY, {
        userId: 'test_user',
        operation: 'patient_lookup'
      });

      expect(db).toBeDefined();
    });

    it('should provide patient update database access', async () => {
      const db = await manager.getDatabase(PRIVILEGE_LEVELS.PATIENT_UPDATE, {
        userId: 'provider_123',
        operation: 'patient_update'
      });

      expect(db).toBeDefined();
    });

    it('should provide migration database access', async () => {
      const db = await manager.getDatabase(PRIVILEGE_LEVELS.MIGRATION, {
        userId: 'migration_system',
        operation: 'schema_migration'
      });

      expect(db).toBeDefined();
    });

    it('should throw error for invalid privilege level', async () => {
      await expect(
        manager.getDatabase('invalid_privilege', {})
      ).rejects.toThrow('Invalid privilege level: invalid_privilege');
    });
  });

  describe('emergency access', () => {
    it('should request emergency access successfully', async () => {
      const escalationId = await manager.requestEmergencyAccess(
        'Critical patient care situation',
        'dr_smith',
        'patient_123'
      );

      expect(escalationId).toMatch(/^EMRG-/);
      expect(bcrypt.hash).toHaveBeenCalledWith('patient_123', 10);
    });

    it('should provide emergency database access with valid escalation', async () => {
      const escalationId = await manager.requestEmergencyAccess(
        'Emergency procedure required',
        'dr_jones',
        'patient_456'
      );

      const db = await manager.getDatabase(PRIVILEGE_LEVELS.EMERGENCY, {
        emergencyEscalationId: escalationId,
        userId: 'dr_jones'
      });

      expect(db).toBeDefined();
    });

    it('should reject emergency access without escalation ID', async () => {
      await expect(
        manager.getDatabase(PRIVILEGE_LEVELS.EMERGENCY, {
          userId: 'dr_unauthorized'
        })
      ).rejects.toThrow('Emergency access requires valid escalation ID');
    });

    it('should reject emergency access with invalid escalation ID', async () => {
      await expect(
        manager.getDatabase(PRIVILEGE_LEVELS.EMERGENCY, {
          emergencyEscalationId: 'invalid_id',
          userId: 'dr_unauthorized'
        })
      ).rejects.toThrow('Invalid or expired emergency escalation ID');
    });

    it('should auto-expire emergency escalations', async () => {
      // Mock Date.now to control time
      const originalDateNow = Date.now;
      const mockNow = 1000000000;
      Date.now = vi.fn(() => mockNow);

      const escalationId = await manager.requestEmergencyAccess(
        'Time-limited emergency',
        'dr_time',
        'patient_time'
      );

      // Fast-forward time by more than 30 minutes
      Date.now = vi.fn(() => mockNow + (31 * 60 * 1000));

      await expect(
        manager.getDatabase(PRIVILEGE_LEVELS.EMERGENCY, {
          emergencyEscalationId: escalationId,
          userId: 'dr_time'
        })
      ).rejects.toThrow('Emergency escalation has expired');

      // Restore original Date.now
      Date.now = originalDateNow;
    }, 10000);
  });

  describe('privilege validation', () => {
    it('should block write operations for readonly privilege', async () => {
      const db = await manager.getDatabase(PRIVILEGE_LEVELS.READONLY);
      
      // The proxy should validate operations
      expect(() => {
        db.insert({ table: 'patients' });
      }).toThrow(/not permitted with readonly privileges/);
    });

    it('should allow read operations for readonly privilege', async () => {
      const db = await manager.getDatabase(PRIVILEGE_LEVELS.READONLY);
      
      // Select operations should be allowed
      expect(() => {
        db.select();
      }).not.toThrow();
    });

    it('should block dangerous operations for patient_update privilege', async () => {
      const db = await manager.getDatabase(PRIVILEGE_LEVELS.PATIENT_UPDATE);
      
      expect(() => {
        db.delete({ table: 'patients' });
      }).toThrow(/not permitted with patient_update privileges/);
    });

    it('should log migration operations', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const db = await manager.getDatabase(PRIVILEGE_LEVELS.MIGRATION);
      
      // Migration operations should be logged
      db.migrate();
      expect(consoleSpy).toHaveBeenCalledWith('Migration operation: migrate');
      
      consoleSpy.mockRestore();
    });

    it('should log emergency operations with warning', async () => {
      const escalationId = await manager.requestEmergencyAccess(
        'Critical emergency',
        'dr_emergency'
      );
      
      const consoleWarnSpy = vi.spyOn(console, 'warn');
      const db = await manager.getDatabase(PRIVILEGE_LEVELS.EMERGENCY, {
        emergencyEscalationId: escalationId
      });
      
      db.update({ table: 'patients' });
      expect(consoleWarnSpy).toHaveBeenCalledWith('EMERGENCY database operation: update');
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('migration safety', () => {
    it('should create pre-migration backup', async () => {
      const migrationId = 'test_migration_001';
      const checksums = await manager.createPreMigrationBackup(migrationId);
      
      expect(checksums).toBeDefined();
      expect(checksums.patients).toBeDefined();
      expect(checksums.consultations).toBeDefined();
      expect(checksums.orders).toBeDefined();
      expect(checksums.messages).toBeDefined();
      
      // Each checksum should have count and checksum properties
      expect(checksums.patients).toHaveProperty('count');
      expect(checksums.patients).toHaveProperty('checksum');
    });

    it('should validate post-migration integrity', async () => {
      const migrationId = 'test_migration_002';
      const preChecksums = {
        patients: { count: 10, checksum: 'abc123' },
        consultations: { count: 5, checksum: 'def456' }
      };
      
      const result = await manager.validatePostMigrationIntegrity(migrationId, preChecksums);
      
      expect(result).toHaveProperty('integrityValid');
      expect(result).toHaveProperty('preChecksums');
      expect(result).toHaveProperty('postChecksums');
      expect(result.integrityValid).toBe(true);
    });

    it('should detect data loss during migration', async () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      const migrationId = 'test_migration_003';
      
      // Mock database to return fewer records than before
      const mockDb = {
        execute: vi.fn().mockResolvedValue([{ count: 5, checksum: 'new_checksum' }])
      };
      
      // Override the database mock for this test
      vi.mocked(require('drizzle-orm/postgres-js').drizzle).mockReturnValue(mockDb);
      
      const preChecksums = {
        patients: { count: 10, checksum: 'original_checksum' }
      };
      
      const result = await manager.validatePostMigrationIntegrity(migrationId, preChecksums);
      
      expect(result.integrityValid).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Data loss detected in table patients: 10 -> 5')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('audit logging', () => {
    it('should log database access attempts', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      await manager.getDatabase(PRIVILEGE_LEVELS.READONLY, {
        userId: 'test_user',
        operation: 'patient_lookup',
        ipAddress: '192.168.1.100'
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Database access logged:',
        expect.objectContaining({
          privilegeLevel: PRIVILEGE_LEVELS.READONLY,
          userId: 'test_user',
          operation: 'patient_lookup',
          ipAddress: '192.168.1.100'
        })
      );
      
      consoleSpy.mockRestore();
    });

    it('should log emergency access validation', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      const escalationId = await manager.requestEmergencyAccess(
        'Emergency logging test',
        'dr_logger'
      );
      
      await manager.getDatabase(PRIVILEGE_LEVELS.EMERGENCY, {
        emergencyEscalationId: escalationId
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        `Emergency database access validated: ${escalationId}`
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('connection management', () => {
    it('should close all connections cleanly', async () => {
      await expect(manager.closeAllConnections()).resolves.not.toThrow();
      expect(manager.initialized).toBe(false);
    });

    it('should handle connection errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error');
      
      // Mock connection.end to throw error
      const mockError = new Error('Connection close error');
      vi.mocked(require('postgres').default).mockReturnValue({
        end: vi.fn().mockRejectedValue(mockError)
      });
      
      await manager.closeAllConnections();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error closing connection'),
        mockError
      );
      
      consoleSpy.mockRestore();
    });
  });
});

describe('Convenience Functions', () => {
  beforeAll(() => {
    process.env.DATABASE_URL = 'postgresql://telehealth_user:secure_password@localhost:5432/telehealth_db';
  });

  afterAll(() => {
    delete process.env.DATABASE_URL;
  });

  afterEach(async () => {
    await privilegedDbManager.closeAllConnections();
  });

  it('should provide readonly database through convenience function', async () => {
    const db = await getReadOnlyDatabase({ userId: 'test_user' });
    expect(db).toBeDefined();
  });

  it('should provide patient update database through convenience function', async () => {
    const db = await getPatientUpdateDatabase({ userId: 'provider_user' });
    expect(db).toBeDefined();
  });

  it('should provide migration database through convenience function', async () => {
    const db = await getMigrationDatabase({ userId: 'migration_user' });
    expect(db).toBeDefined();
  });

  it('should provide emergency database through convenience function', async () => {
    const escalationId = await requestEmergencyDatabaseAccess(
      'Convenience function test',
      'dr_convenience'
    );
    
    const db = await getEmergencyDatabase(escalationId, { userId: 'dr_convenience' });
    expect(db).toBeDefined();
  });

  it('should request emergency access through convenience function', async () => {
    const escalationId = await requestEmergencyDatabaseAccess(
      'Emergency access test',
      'dr_test',
      'patient_test'
    );
    
    expect(escalationId).toMatch(/^EMRG-/);
  });
});

describe('Integration with HIPAA Compliance', () => {
  beforeAll(() => {
    process.env.DATABASE_URL = 'postgresql://telehealth_user:secure_password@localhost:5432/telehealth_db';
  });

  afterAll(() => {
    delete process.env.DATABASE_URL;
  });

  afterEach(async () => {
    await privilegedDbManager.closeAllConnections();
  });

  it('should hash patient identifiers for emergency access', async () => {
    const escalationId = await requestEmergencyDatabaseAccess(
      'HIPAA compliance test',
      'dr_hipaa',
      'patient_hipaa_123'
    );
    
    expect(bcrypt.hash).toHaveBeenCalledWith('patient_hipaa_123', 10);
    expect(escalationId).toMatch(/^EMRG-/);
  });

  it('should maintain audit trail for all database operations', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    
    const db = await getReadOnlyDatabase({
      userId: 'hipaa_user',
      operation: 'hipaa_compliant_lookup',
      ipAddress: '10.0.0.1'
    });
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Database access logged:',
      expect.objectContaining({
        userId: 'hipaa_user',
        operation: 'hipaa_compliant_lookup',
        ipAddress: '10.0.0.1'
      })
    );
    
    consoleSpy.mockRestore();
  });

  it('should enforce 30-minute timeout on emergency access', async () => {
    const originalDateNow = Date.now;
    const mockStartTime = 1000000000;
    Date.now = vi.fn(() => mockStartTime);
    
    const escalationId = await requestEmergencyDatabaseAccess(
      'HIPAA timeout test',
      'dr_timeout'
    );
    
    // Access should work within 30 minutes
    await expect(
      getEmergencyDatabase(escalationId, { userId: 'dr_timeout' })
    ).resolves.toBeDefined();
    
    // Fast-forward past 30 minutes
    Date.now = vi.fn(() => mockStartTime + (31 * 60 * 1000));
    
    // Access should be denied after timeout
    await expect(
      getEmergencyDatabase(escalationId, { userId: 'dr_timeout' })
    ).rejects.toThrow('Emergency escalation has expired');
    
    // Restore original Date.now
    Date.now = originalDateNow;
  });
});