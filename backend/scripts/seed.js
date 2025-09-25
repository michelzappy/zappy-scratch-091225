#!/usr/bin/env node

/**
 * Database Seed Runner
 * Executes all seed files in the correct order with idempotent operations
 * Usage: node backend/scripts/seed.js
 */

import { connectDatabase, closeDatabase } from '../src/config/database.js';
import seedCore from '../seeds/00_core.js';
import seedAdmin from '../seeds/10_admin.js';
import seedReference from '../seeds/20_reference.js';

/**
 * Main seed execution function
 */
async function runSeeds() {
  const startTime = Date.now();
  
  console.log('🌱 Starting idempotent database seeding...');
  console.log(`🔗 Database: ${process.env.DATABASE_URL || 'Not configured'}`);
  console.log('');

  let db;
  
  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    db = await connectDatabase();
    console.log('✅ Database connection successful');
    console.log('');

    // Execute seed modules in order
    console.log('🚀 Executing seed modules...');
    
    // Core system settings
    await seedCore(db);
    console.log('');
    
    // Admin users and provider stubs
    await seedAdmin(db);
    console.log('');
    
    // Reference data (medications, pharmacies, treatment plans)
    await seedReference(db);
    console.log('');

    const duration = Date.now() - startTime;
    console.log(`🎉 Database seeding completed successfully in ${duration}ms`);
    console.log('');
    
    // Show summary
    console.log('📊 Seeding Summary:');
    console.log(`   • Core Settings: System configuration and consultation settings`);
    console.log(`   • Admin Users: Primary admin and optional additional users`);
    console.log(`   • Medications: Essential telehealth medications catalog`);
    console.log(`   • Pharmacies: Partner pharmacies for fulfillment`);
    console.log(`   • Treatment Plans: Basic plans for core conditions (if table exists)`);
    console.log('');
    console.log('✨ All operations are idempotent - safe to re-run anytime!');
    
  } catch (error) {
    console.error('');
    console.error('💥 Seeding failed:', error.message);
    console.error('Stack trace:', error.stack);
    console.error('');
    process.exit(1);
  } finally {
    if (db) {
      await closeDatabase();
    }
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
runSeeds().catch(console.error);

export { runSeeds };