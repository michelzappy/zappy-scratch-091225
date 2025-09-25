#!/usr/bin/env node

/**
 * Seed Utilities Framework
 * Provides helper functions for idempotent database seeding
 */
import bcrypt from 'bcryptjs';

/**
 * Check if a record exists by a unique field
 * @param {Object} db - Drizzle database instance
 * @param {string} tableName - Name of the table
 * @param {string} field - Field name to check
 * @param {any} value - Value to check for
 * @returns {Promise<boolean>} - True if record exists
 */
export async function recordExists(db, tableName, field, value) {
  try {
    const result = await db`
      SELECT EXISTS (
        SELECT 1 FROM ${db(tableName)} 
        WHERE ${db(field)} = ${value}
      ) as exists
    `;
    return result[0]?.exists || false;
  } catch (error) {
    console.error(`Error checking if record exists in ${tableName}:`, error);
    return false;
  }
}

/**
 * Upsert a single record (insert or update if exists)
 * @param {Object} db - Drizzle database instance
 * @param {string} tableName - Name of the table
 * @param {Object} data - Data to insert/update
 * @param {string} conflictField - Field to check for conflicts (usually unique field)
 * @param {Array} updateFields - Fields to update on conflict (optional)
 * @returns {Promise<Object>} - Result of the operation
 */
export async function upsertRecord(db, tableName, data, conflictField, updateFields = []) {
  try {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    let query = `
      INSERT INTO ${tableName} (${fields.join(', ')})
      VALUES (${placeholders})
      ON CONFLICT (${conflictField}) DO
    `;
    
    if (updateFields.length > 0) {
      const updateClause = updateFields.map(field => `${field} = EXCLUDED.${field}`).join(', ');
      query += ` UPDATE SET ${updateClause}`;
    } else {
      query += ' NOTHING';
    }
    
    query += ' RETURNING *';
    
    const result = await db.raw(query, values);
    return result[0];
  } catch (error) {
    console.error(`Error upserting record in ${tableName}:`, error);
    throw error;
  }
}

/**
 * Insert record only if it doesn't exist
 * @param {Object} db - Drizzle database instance
 * @param {string} tableName - Name of the table
 * @param {Object} data - Data to insert
 * @param {string} checkField - Field to check for existence
 * @param {any} checkValue - Value to check for
 * @returns {Promise<Object|null>} - Inserted record or null if exists
 */
export async function insertIfNotExists(db, tableName, data, checkField, checkValue) {
  try {
    const exists = await recordExists(db, tableName, checkField, checkValue);
    
    if (exists) {
      console.log(`⏭️  Record already exists in ${tableName} where ${checkField} = ${checkValue}`);
      return null;
    }
    
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${tableName} (${fields.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await db.raw(query, values);
    console.log(`✅ Inserted new record in ${tableName}`);
    return result[0];
  } catch (error) {
    console.error(`Error inserting record in ${tableName}:`, error);
    throw error;
  }
}

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Generate a secure random password
 * @param {number} length - Password length (default: 16)
 * @returns {string} - Generated password
 */
export function generateSecurePassword(length = 16) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

/**
 * Get environment variable with fallback
 * @param {string} key - Environment variable key
 * @param {any} fallback - Fallback value
 * @returns {any} - Environment variable value or fallback
 */
export function getEnvVar(key, fallback = null) {
  return process.env[key] || fallback;
}

/**
 * Log seed operation with consistent formatting
 * @param {string} operation - Operation being performed
 * @param {string} details - Additional details
 */
export function logSeedOperation(operation, details = '') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🌱 ${operation}${details ? ': ' + details : ''}`);
}

/**
 * Validate required environment variables
 * @param {Array<string>} requiredVars - Array of required environment variable names
 * @throws {Error} - If any required variables are missing
 */
export function validateEnvironment(requiredVars = []) {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Execute multiple seed operations in a transaction
 * @param {Object} db - Drizzle database instance
 * @param {Array<Function>} operations - Array of async functions to execute
 * @returns {Promise<Array>} - Results of all operations
 */
export async function executeInTransaction(db, operations) {
  try {
    return await db.transaction(async (tx) => {
      const results = [];
      for (const operation of operations) {
        const result = await operation(tx);
        results.push(result);
      }
      return results;
    });
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
}

/**
 * Check if table exists
 * @param {Object} db - Drizzle database instance
 * @param {string} tableName - Name of the table to check
 * @returns {Promise<boolean>} - True if table exists
 */
export async function tableExists(db, tableName) {
  try {
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      ) as exists
    `;
    const result = await db.unsafe(query);
    return result[0]?.exists || false;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

/**
 * Get record count from table
 * @param {Object} db - Drizzle database instance
 * @param {string} tableName - Name of the table
 * @returns {Promise<number>} - Number of records in table
 */
export async function getRecordCount(db, tableName) {
  try {
    const query = `SELECT COUNT(*) as count FROM ${tableName}`;
    const result = await db.unsafe(query);
    return parseInt(result[0]?.count || 0);
  } catch (error) {
    console.error(`Error getting record count from ${tableName}:`, error);
    return 0;
  }
}

export default {
  recordExists,
  upsertRecord,
  insertIfNotExists,
  hashPassword,
  generateSecurePassword,
  getEnvVar,
  logSeedOperation,
  validateEnvironment,
  executeInTransaction,
  tableExists,
  getRecordCount
};