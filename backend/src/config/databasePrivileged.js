import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../models/index.js';
import bcrypt from 'bcrypt';

// Database privilege levels
export const PRIVILEGE_LEVELS = {
  READONLY: 'readonly',
  PATIENT_UPDATE: 'patient_update',
  MIGRATION: 'migration',
  EMERGENCY: 'emergency'
};

// Connection pools for different privilege levels
const connectionPools = new Map();
const databases = new Map();

// Track active emergency escalations
const activeEmergencyEscalations = new Map();

/**
 * Database Connection Factory with Privilege Management
 * Since we're working with a single database user in shared hosting,
 * we implement application-level privilege controls
 */
export class PrivilegedDatabaseManager {
  constructor() {
    this.initialized = false;
    this.emergencyBypassEnabled = false;
  }

  async initialize() {
    if (this.initialized) return;

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    // Create connection pools for different privilege levels
    // Note: In shared hosting, we use the same credentials but implement app-level controls
    const baseConfig = {
      idle_timeout: 30,
      connect_timeout: 10,
      ssl: process.env.NODE_ENV === 'production' ? 'require' : false
    };

    // Readonly pool - limited concurrent connections
    connectionPools.set(PRIVILEGE_LEVELS.READONLY, postgres(connectionString, {
      ...baseConfig,
      max: 5, // Limit concurrent read operations
    }));

    // Patient update pool - moderate concurrency
    connectionPools.set(PRIVILEGE_LEVELS.PATIENT_UPDATE, postgres(connectionString, {
      ...baseConfig,
      max: 10,
    }));

    // Migration pool - single connection for safety
    connectionPools.set(PRIVILEGE_LEVELS.MIGRATION, postgres(connectionString, {
      ...baseConfig,
      max: 1, // Single connection for migration safety
    }));

    // Emergency pool - higher priority
    connectionPools.set(PRIVILEGE_LEVELS.EMERGENCY, postgres(connectionString, {
      ...baseConfig,
      max: 3, // Emergency access with priority
    }));

    // Initialize Drizzle instances for each privilege level
    for (const [level, pool] of connectionPools.entries()) {
      databases.set(level, drizzle(pool, { schema }));
    }

    // Test connections
    try {
      for (const [level, pool] of connectionPools.entries()) {
        await pool`SELECT 1`;
        console.log(`Database connection established for privilege level: ${level}`);
      }
    } catch (error) {
      console.error('Failed to establish database connections:', error);
      throw error;
    }

    this.initialized = true;
  }

  /**
   * Get database instance with specified privilege level
   * @param {string} privilegeLevel - The privilege level required
   * @param {Object} context - Context information for audit logging
   * @returns {Object} Drizzle database instance
   */
  async getDatabase(privilegeLevel = PRIVILEGE_LEVELS.READONLY, context = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Validate privilege level
    if (!Object.values(PRIVILEGE_LEVELS).includes(privilegeLevel)) {
      throw new Error(`Invalid privilege level: ${privilegeLevel}`);
    }

    // Check for emergency escalation requirements
    if (privilegeLevel === PRIVILEGE_LEVELS.EMERGENCY) {
      await this._validateEmergencyAccess(context);
    }

    // Log database access for audit trail
    await this._logDatabaseAccess(privilegeLevel, context);

    // Return appropriate database instance with privilege validation wrapper
    const db = databases.get(privilegeLevel);
    return this._createPrivilegeValidatedDatabase(db, privilegeLevel, context);
  }

  /**
   * Request emergency database access
   * @param {string} reason - Reason for emergency access
   * @param {string} requestedBy - User requesting access
   * @param {string} patientId - Patient ID for emergency (optional)
   * @returns {string} Emergency escalation ID
   */
  async requestEmergencyAccess(reason, requestedBy, patientId = null) {
    const escalationId = `EMRG-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
    
    // Hash patient ID for privacy
    let patientIdentifierHash = null;
    if (patientId) {
      patientIdentifierHash = await bcrypt.hash(patientId, 10);
    }

    const escalation = {
      escalationId,
      reason,
      requestedBy,
      patientIdentifierHash,
      requestedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      status: 'approved', // Auto-approve emergency requests
      emergencyOverride: true
    };

    // Store in memory (in production, this would be in database)
    activeEmergencyEscalations.set(escalationId, escalation);

    // Log the emergency escalation
    console.log(`Emergency database access granted:`, {
      escalationId,
      reason,
      requestedBy,
      expiresAt: escalation.expiresAt
    });

    // Auto-expire the escalation
    setTimeout(() => {
      activeEmergencyEscalations.delete(escalationId);
      console.log(`Emergency access expired: ${escalationId}`);
    }, 30 * 60 * 1000);

    return escalationId;
  }

  /**
   * Validate emergency access authorization
   * @private
   */
  async _validateEmergencyAccess(context) {
    const { emergencyEscalationId } = context;
    
    if (!emergencyEscalationId) {
      throw new Error('Emergency access requires valid escalation ID');
    }

    const escalation = activeEmergencyEscalations.get(emergencyEscalationId);
    if (!escalation) {
      throw new Error('Invalid or expired emergency escalation ID');
    }

    if (escalation.expiresAt < new Date()) {
      activeEmergencyEscalations.delete(emergencyEscalationId);
      throw new Error('Emergency escalation has expired');
    }

    // Emergency access validated
    console.log(`Emergency database access validated: ${emergencyEscalationId}`);
  }

  /**
   * Log database access for audit trail
   * @private
   */
  async _logDatabaseAccess(privilegeLevel, context) {
    const logEntry = {
      privilegeLevel,
      timestamp: new Date().toISOString(),
      userId: context.userId || 'system',
      operation: context.operation || 'database_access',
      emergencyEscalationId: context.emergencyEscalationId || null,
      ipAddress: context.ipAddress || 'unknown'
    };

    // In production, this would write to audit log table
    console.log('Database access logged:', logEntry);
  }

  /**
   * Create privilege-validated database wrapper
   * @private
   */
  _createPrivilegeValidatedDatabase(db, privilegeLevel, context) {
    // Create a proxy that validates operations based on privilege level
    return new Proxy(db, {
      get: (target, prop) => {
        const originalMethod = target[prop];
        
        if (typeof originalMethod === 'function') {
          return (...args) => {
            // Validate operation based on privilege level
            this._validateOperation(prop.toString(), privilegeLevel, args);
            return originalMethod.apply(target, args);
          };
        }
        
        return originalMethod;
      }
    });
  }

  /**
   * Validate database operation based on privilege level
   * @private
   */
  _validateOperation(operation, privilegeLevel, args) {
    const dangerousOperations = ['delete', 'truncate', 'drop', 'alter'];
    
    switch (privilegeLevel) {
      case PRIVILEGE_LEVELS.READONLY:
        if (operation.includes('insert') || operation.includes('update') || operation.includes('delete')) {
          throw new Error(`Operation ${operation} not permitted with readonly privileges`);
        }
        break;
        
      case PRIVILEGE_LEVELS.PATIENT_UPDATE:
        if (dangerousOperations.some(op => operation.toLowerCase().includes(op))) {
          throw new Error(`Operation ${operation} not permitted with patient_update privileges`);
        }
        break;
        
      case PRIVILEGE_LEVELS.MIGRATION:
        // Migration level allows most operations, but logs them
        console.log(`Migration operation: ${operation}`);
        break;
        
      case PRIVILEGE_LEVELS.EMERGENCY:
        // Emergency level allows all operations but logs them heavily
        console.warn(`EMERGENCY database operation: ${operation}`);
        break;
    }
  }

  /**
   * Create database backup before migration operations
   */
  async createPreMigrationBackup(migrationId) {
    const db = await this.getDatabase(PRIVILEGE_LEVELS.MIGRATION, {
      operation: 'pre_migration_backup',
      migrationId
    });

    console.log(`Creating pre-migration backup for migration: ${migrationId}`);
    
    // In production, this would create actual database backup
    // For now, we'll create checksums for validation
    const tables = ['patients', 'consultations', 'orders', 'messages'];
    const checksums = {};

    for (const table of tables) {
      try {
        const result = await db.execute(`
          SELECT COUNT(*) as count, 
                 md5(string_agg(md5((t.*)::text), '' ORDER BY (t.*)::text)) as checksum 
          FROM ${table} t
        `);
        
        checksums[table] = {
          count: result[0]?.count || 0,
          checksum: result[0]?.checksum || 'empty'
        };
      } catch (error) {
        console.warn(`Could not create checksum for table ${table}:`, error.message);
        checksums[table] = { count: 0, checksum: 'error' };
      }
    }

    console.log(`Pre-migration checksums created:`, checksums);
    return checksums;
  }

  /**
   * Validate data integrity after migration
   */
  async validatePostMigrationIntegrity(migrationId, preChecksums) {
    const db = await this.getDatabase(PRIVILEGE_LEVELS.MIGRATION, {
      operation: 'post_migration_validation',
      migrationId
    });

    console.log(`Validating post-migration integrity for migration: ${migrationId}`);

    const postChecksums = {};
    let integrityValid = true;

    for (const [table, preChecksum] of Object.entries(preChecksums)) {
      try {
        const result = await db.execute(`
          SELECT COUNT(*) as count, 
                 md5(string_agg(md5((t.*)::text), '' ORDER BY (t.*)::text)) as checksum 
          FROM ${table} t
        `);
        
        postChecksums[table] = {
          count: result[0]?.count || 0,
          checksum: result[0]?.checksum || 'empty'
        };

        // Basic integrity check - count should not decrease unexpectedly
        if (postChecksums[table].count < preChecksum.count) {
          console.warn(`Data loss detected in table ${table}: ${preChecksum.count} -> ${postChecksums[table].count}`);
          integrityValid = false;
        }
      } catch (error) {
        console.warn(`Could not validate integrity for table ${table}:`, error.message);
        integrityValid = false;
      }
    }

    console.log(`Post-migration validation complete:`, { integrityValid, postChecksums });
    return { integrityValid, preChecksums, postChecksums };
  }

  /**
   * Close all database connections
   */
  async closeAllConnections() {
    for (const [level, pool] of connectionPools.entries()) {
      try {
        await pool.end();
        console.log(`Closed database connection for privilege level: ${level}`);
      } catch (error) {
        console.error(`Error closing connection for ${level}:`, error);
      }
    }
    
    connectionPools.clear();
    databases.clear();
    this.initialized = false;
  }
}

// Create singleton instance
export const privilegedDbManager = new PrivilegedDatabaseManager();

// Convenience functions for common operations
export async function getReadOnlyDatabase(context = {}) {
  return privilegedDbManager.getDatabase(PRIVILEGE_LEVELS.READONLY, context);
}

export async function getPatientUpdateDatabase(context = {}) {
  return privilegedDbManager.getDatabase(PRIVILEGE_LEVELS.PATIENT_UPDATE, context);
}

export async function getMigrationDatabase(context = {}) {
  return privilegedDbManager.getDatabase(PRIVILEGE_LEVELS.MIGRATION, context);
}

export async function getEmergencyDatabase(emergencyEscalationId, context = {}) {
  return privilegedDbManager.getDatabase(PRIVILEGE_LEVELS.EMERGENCY, {
    ...context,
    emergencyEscalationId
  });
}

// Emergency access function
export async function requestEmergencyDatabaseAccess(reason, requestedBy, patientId = null) {
  return privilegedDbManager.requestEmergencyAccess(reason, requestedBy, patientId);
}