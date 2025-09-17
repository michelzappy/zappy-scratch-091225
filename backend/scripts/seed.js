#!/usr/bin/env node

/**
 * Database Seed Runner
 * Executes all seed files in the correct order
 * Usage: node backend/scripts/seed.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/telehealth_db',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Seed files in execution order
const SEED_FILES = [
  '001_consultation_settings.sql',
  '002_medications.sql',
  '003_pharmacies.sql',
  '004_treatment_plans.sql'
];

const SEEDS_DIR = path.join(__dirname, '../../database/seeds');

/**
 * Execute a single SQL file
 */
async function executeSeedFile(filename) {
  const filePath = path.join(SEEDS_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Seed file not found: ${filePath}`);
  }

  const sql = fs.readFileSync(filePath, 'utf8');
  
  console.log(`📄 Executing seed file: ${filename}`);
  
  try {
    await pool.query(sql);
    console.log(`✅ Successfully executed: ${filename}`);
  } catch (error) {
    console.error(`❌ Error executing ${filename}:`, error.message);
    throw error;
  }
}

/**
 * Check if tables exist before seeding
 */
async function checkTablesExist() {
  const requiredTables = [
    'consultation_settings',
    'medications', 
    'pharmacies',
    'treatment_plans'
  ];

  console.log('🔍 Checking if required tables exist...');
  
  for (const table of requiredTables) {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `, [table]);
    
    if (!result.rows[0].exists) {
      throw new Error(`Required table '${table}' does not exist. Please run migrations first.`);
    }
  }
  
  console.log('✅ All required tables exist');
}

/**
 * Clear existing seed data (optional)
 */
async function clearExistingData() {
  console.log('🧹 Clearing existing seed data...');
  
  try {
    // Clear in reverse dependency order
    await pool.query('DELETE FROM treatment_plans;');
    await pool.query('DELETE FROM pharmacies;');
    await pool.query('DELETE FROM medications;');
    await pool.query('DELETE FROM consultation_settings;');
    
    console.log('✅ Existing seed data cleared');
  } catch (error) {
    console.warn('⚠️  Warning: Could not clear existing data:', error.message);
  }
}

/**
 * Main seed execution function
 */
async function runSeeds() {
  const startTime = Date.now();
  
  console.log('🌱 Starting database seeding...');
  console.log(`📍 Seeds directory: ${SEEDS_DIR}`);
  console.log(`🔗 Database: ${process.env.DATABASE_URL || 'postgresql://localhost:5432/telehealth_db'}`);
  console.log('');

  try {
    // Test database connection
    console.log('🔌 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    console.log('');

    // Check if tables exist
    await checkTablesExist();
    console.log('');

    // Clear existing data if --clear flag is provided
    if (process.argv.includes('--clear')) {
      await clearExistingData();
      console.log('');
    }

    // Execute seed files in order
    console.log('🚀 Executing seed files...');
    for (const filename of SEED_FILES) {
      await executeSeedFile(filename);
    }

    const duration = Date.now() - startTime;
    console.log('');
    console.log(`🎉 Database seeding completed successfully in ${duration}ms`);
    console.log('');
    
    // Show summary
    console.log('📊 Seeding Summary:');
    console.log(`   • Consultation Settings: Default configuration`);
    console.log(`   • Medications: 3 sample medications (Sildenafil, Finasteride, Minoxidil)`);
    console.log(`   • Pharmacies: 1 partner pharmacy`);
    console.log(`   • Treatment Plans: 18 plans across 6 conditions`);
    
  } catch (error) {
    console.error('');
    console.error('💥 Seeding failed:', error.message);
    console.error('');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

/**
 * Show usage information
 */
function showUsage() {
  console.log('');
  console.log('🌱 Database Seed Runner');
  console.log('');
  console.log('Usage:');
  console.log('  node backend/scripts/seed.js           # Run all seeds');
  console.log('  node backend/scripts/seed.js --clear   # Clear existing data first');
  console.log('  node backend/scripts/seed.js --help    # Show this help');
  console.log('');
  console.log('Environment Variables:');
  console.log('  DATABASE_URL    # PostgreSQL connection string');
  console.log('                  # Default: postgresql://localhost:5432/telehealth_db');
  console.log('');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showUsage();
  process.exit(0);
}

// Run the seeder
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeeds().catch(console.error);
}

export { runSeeds, executeSeedFile };