#!/usr/bin/env node

/**
 * Core System Seeds
 * Handles essential system configuration and settings
 * This file ensures core tables have required default data
 */

import { sql } from 'drizzle-orm';
import { 
  insertIfNotExists, 
  logSeedOperation, 
  tableExists,
  getRecordCount 
} from '../scripts/seed-utils.js';

/**
 * Seed consultation settings
 * Ensures default consultation configuration exists
 */
async function seedConsultationSettings(db) {
  logSeedOperation('Seeding consultation settings');
  
  const defaultSettings = {
    id: '00000000-0000-0000-0000-000000000001',
    consultation_fee: 0.00,
    require_credit_card: true,
    auto_charge_on_approval: true,
    refill_consultation_fee: 0.00,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    // Check if any settings exist first
    const count = await getRecordCount(db, 'consultation_settings');
    
    if (count === 0) {
      await db`
        INSERT INTO consultation_settings (
          id, consultation_fee, require_credit_card, auto_charge_on_approval, 
          refill_consultation_fee, created_at, updated_at
        )
        VALUES (
          ${defaultSettings.id}::uuid,
          ${defaultSettings.consultation_fee},
          ${defaultSettings.require_credit_card},
          ${defaultSettings.auto_charge_on_approval},
          ${defaultSettings.refill_consultation_fee},
          ${defaultSettings.created_at}::timestamp,
          ${defaultSettings.updated_at}::timestamp
        )
        ON CONFLICT (id) DO NOTHING
      `;
      
      logSeedOperation('✅ Default consultation settings created');
    } else {
      logSeedOperation('⏭️  Consultation settings already exist');
    }
  } catch (error) {
    console.error('❌ Error seeding consultation settings:', error);
    throw error;
  }
}

/**
 * Seed system configuration
 * Any other core system settings that need to exist
 */
async function seedSystemConfig(db) {
  logSeedOperation('Checking system configuration');
  
  try {
    // Ensure required extensions are enabled
    await db`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    await db`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;
    
    logSeedOperation('✅ System extensions verified');
  } catch (error) {
    console.error('❌ Error configuring system:', error);
    throw error;
  }
}

/**
 * Verify core tables exist
 * Safety check to ensure migrations have been run
 */
async function verifyCoreTablesExist(db) {
  logSeedOperation('Verifying core tables exist');
  
  const requiredTables = [
    'consultation_settings',
    'patients',
    'providers', 
    'admins',
    'medications',
    'pharmacies',
    'consultations',
    'prescriptions',
    'orders',
    'consultation_messages'
  ];

  for (const tableName of requiredTables) {
    const exists = await tableExists(db, tableName);
    if (!exists) {
      throw new Error(`Required table '${tableName}' does not exist. Please run migrations first.`);
    }
  }
  
  logSeedOperation('✅ All core tables verified');
}

/**
 * Main core seeding function
 */
export default async function seedCore(db) {
  logSeedOperation('Starting core system seeding');
  
  try {
    // Verify tables exist before seeding
    await verifyCoreTablesExist(db);
    
    // Seed system configuration
    await seedSystemConfig(db);
    
    // Seed consultation settings
    await seedConsultationSettings(db);
    
    logSeedOperation('✅ Core seeding completed successfully');
  } catch (error) {
    logSeedOperation('❌ Core seeding failed');
    throw error;
  }
}