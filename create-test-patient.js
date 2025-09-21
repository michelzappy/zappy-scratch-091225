#!/usr/bin/env node

/**
 * Create Test Patient Account
 * Simple script to create a patient@example.com account for testing
 */

import { connectDatabase, closeDatabase } from './backend/src/config/database.js';
import bcrypt from 'bcrypt';

async function createTestPatient() {
  console.log('🩺 Creating test patient account...');
  
  let db;
  
  try {
    // Connect to database
    db = await connectDatabase();
    console.log('✅ Database connected');
    
    // Hash password
    const passwordHash = await bcrypt.hash('password123', 12);
    
    // Check if patient already exists
    const existingPatient = await db`
      SELECT id FROM patients WHERE email = 'patient@example.com'
    `;
    
    if (existingPatient.length > 0) {
      console.log('⏭️  Test patient already exists');
      return;
    }
    
    // Create test patient
    await db`
      INSERT INTO patients (
        id, email, password_hash, first_name, last_name,
        date_of_birth, phone, gender, address, city, state, zip_code,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        status, email_verified, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        'patient@example.com',
        ${passwordHash},
        'Test',
        'Patient',
        '1990-01-01',
        '+1234567890',
        'other',
        '123 Test St',
        'Test City',
        'CA',
        '90210',
        'Emergency Contact',
        '+1234567891',
        'friend',
        'active',
        true,
        NOW(),
        NOW()
      )
    `;
    
    console.log('✅ Test patient created successfully');
    console.log('');
    console.log('🔐 TEST PATIENT CREDENTIALS:');
    console.log('   Email: patient@example.com');
    console.log('   Password: password123');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error creating test patient:', error);
    throw error;
  } finally {
    if (db) {
      await closeDatabase();
    }
  }
}

// Run the script
createTestPatient().catch(console.error);