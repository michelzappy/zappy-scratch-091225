#!/usr/bin/env node

/**
 * Test Seed System
 * Validates the seed system without requiring a database connection
 */

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testSeedModules() {
  console.log('🧪 Testing seed system modules...');
  console.log('');

  try {
    // Test seed utilities
    console.log('📦 Testing seed utilities...');
    const seedUtils = await import('./seed-utils.js');
    console.log('✅ Seed utilities loaded successfully');
    
    // Test utility functions
    const testPassword = seedUtils.generateSecurePassword(12);
    console.log(`   Generated test password: ${testPassword.substring(0, 4)}****`);
    
    const envVar = seedUtils.getEnvVar('NODE_ENV', 'test');
    console.log(`   Environment test: NODE_ENV = ${envVar}`);
    
    console.log('');

    // Test core seed module
    console.log('🔧 Testing core seed module...');
    const coreModule = await import('../seeds/00_core.js');
    console.log('✅ Core seed module loaded successfully');
    console.log('');

    // Test admin seed module
    console.log('👤 Testing admin seed module...');
    const adminModule = await import('../seeds/10_admin.js');
    console.log('✅ Admin seed module loaded successfully');
    console.log('');

    // Test reference seed module
    console.log('📚 Testing reference seed module...');
    const referenceModule = await import('../seeds/20_reference.js');
    console.log('✅ Reference seed module loaded successfully');
    console.log('');

    // Test main seed script
    console.log('🌱 Testing main seed script...');
    const mainSeed = await import('./seed.js');
    console.log('✅ Main seed script loaded successfully');
    console.log('');

    console.log('🎉 All seed modules loaded successfully!');
    console.log('');
    console.log('📋 Seed System Summary:');
    console.log('   • Utilities: Password hashing, environment handling, database helpers');
    console.log('   • Core Seeds: System settings and configuration');
    console.log('   • Admin Seeds: Admin users and optional provider stubs');
    console.log('   • Reference Seeds: Medications, pharmacies, treatment plans');
    console.log('   • Main Script: Orchestrates all seeding operations');
    console.log('');
    console.log('✨ System is ready for database seeding!');

  } catch (error) {
    console.error('❌ Seed system test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testSeedModules().catch(console.error);
}

export { testSeedModules };