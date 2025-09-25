#!/usr/bin/env node

/**
 * Admin User Seeds
 * Creates initial admin user for system access
 * Supports both Supabase auth and local auth fallback
 */

import { sql } from 'drizzle-orm';
import { 
  hashPassword,
  generateSecurePassword,
  getEnvVar,
  logSeedOperation,
  recordExists 
} from '../scripts/seed-utils.js';

/**
 * Create initial admin user
 * Uses environment variables for configuration
 */
async function seedAdminUser(db) {
  logSeedOperation('Seeding admin user');
  
  // Get admin configuration from environment
  const adminEmail = getEnvVar('SEED_ADMIN_EMAIL', 'admin@example.com');
  const adminPassword = getEnvVar('SEED_ADMIN_PASSWORD', generateSecurePassword(16));
  const adminFirstName = getEnvVar('SEED_ADMIN_FIRST_NAME', 'System');
  const adminLastName = getEnvVar('SEED_ADMIN_LAST_NAME', 'Administrator');
  const adminRole = getEnvVar('SEED_ADMIN_ROLE', 'admin');

  try {
    // Check if admin already exists
    const exists = await recordExists(db, 'admins', 'email', adminEmail);
    
    if (exists) {
      logSeedOperation(`⏭️  Admin user already exists: ${adminEmail}`);
      return null;
    }

    // Hash password for local auth
    const passwordHash = await hashPassword(adminPassword);
    
    // Create admin user
    const adminData = {
      id: sql`gen_random_uuid()`,
      email: adminEmail,
      password_hash: passwordHash,
      first_name: adminFirstName,
      last_name: adminLastName,
      role: adminRole,
      permissions: JSON.stringify({
        patients: ['read', 'write', 'delete'],
        providers: ['read', 'write', 'delete'],
        consultations: ['read', 'write', 'delete'],
        medications: ['read', 'write', 'delete'],
        pharmacies: ['read', 'write', 'delete'],
        orders: ['read', 'write', 'delete'],
        analytics: ['read'],
        system: ['read', 'write']
      }),
      two_factor_enabled: false,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db`
      INSERT INTO admins (
        id, email, password_hash, first_name, last_name, role, 
        permissions, two_factor_enabled, status, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        ${adminEmail},
        ${passwordHash},
        ${adminFirstName},
        ${adminLastName},
        ${adminRole},
        ${JSON.stringify(adminData.permissions)}::jsonb,
        ${adminData.two_factor_enabled},
        ${adminData.status},
        ${adminData.created_at}::timestamp,
        ${adminData.updated_at}::timestamp
      )
    `;

    logSeedOperation(`✅ Admin user created: ${adminEmail}`);
    
    // Log credentials if password was generated
    if (!getEnvVar('SEED_ADMIN_PASSWORD')) {
      console.log('');
      console.log('🔐 GENERATED ADMIN CREDENTIALS:');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      console.log('   ⚠️  SAVE THESE CREDENTIALS - Password will not be shown again!');
      console.log('');
    }

    return { email: adminEmail, role: adminRole };
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    throw error;
  }
}

/**
 * Create additional admin users if specified
 * Useful for multi-admin setups
 */
async function seedAdditionalAdmins(db) {
  logSeedOperation('Checking for additional admin users');
  
  // Support for multiple admins via environment variables
  const additionalAdmins = getEnvVar('SEED_ADDITIONAL_ADMINS', '');
  
  if (!additionalAdmins) {
    logSeedOperation('⏭️  No additional admins specified');
    return [];
  }

  try {
    // Parse additional admins (format: "email1:role1,email2:role2")
    const adminList = additionalAdmins.split(',').map(admin => {
      const [email, role = 'admin'] = admin.trim().split(':');
      return { email, role };
    });

    const createdAdmins = [];

    for (const { email, role } of adminList) {
      const exists = await recordExists(db, 'admins', 'email', email);
      
      if (exists) {
        logSeedOperation(`⏭️  Additional admin already exists: ${email}`);
        continue;
      }

      const password = generateSecurePassword(16);
      const passwordHash = await hashPassword(password);
      
      await db`
        INSERT INTO admins (
          id, email, password_hash, first_name, last_name, role, 
          permissions, two_factor_enabled, status, created_at, updated_at
        )
        VALUES (
          gen_random_uuid(),
          ${email},
          ${passwordHash},
          'Additional',
          'Admin',
          ${role},
          '{}'::jsonb,
          false,
          'active',
          NOW(),
          NOW()
        )
      `;

      createdAdmins.push({ email, password, role });
      logSeedOperation(`✅ Additional admin created: ${email}`);
    }

    // Log credentials for additional admins
    if (createdAdmins.length > 0) {
      console.log('');
      console.log('🔐 ADDITIONAL ADMIN CREDENTIALS:');
      createdAdmins.forEach(({ email, password, role }) => {
        console.log(`   ${email} (${role}): ${password}`);
      });
      console.log('   ⚠️  SAVE THESE CREDENTIALS - Passwords will not be shown again!');
      console.log('');
    }

    return createdAdmins;
  } catch (error) {
    console.error('❌ Error seeding additional admins:', error);
    throw error;
  }
}

/**
 * Create a provider stub for system testing
 * Optional provider account for system boot testing
 */
async function seedProviderStub(db) {
  const createProviderStub = getEnvVar('SEED_CREATE_PROVIDER_STUB', 'false') === 'true';
  
  if (!createProviderStub) {
    logSeedOperation('⏭️  Provider stub creation disabled');
    return null;
  }

  logSeedOperation('Creating provider stub');
  
  const providerEmail = getEnvVar('SEED_PROVIDER_EMAIL', 'provider@example.com');
  
  try {
    const exists = await recordExists(db, 'providers', 'email', providerEmail);
    
    if (exists) {
      logSeedOperation(`⏭️  Provider stub already exists: ${providerEmail}`);
      return null;
    }

    const password = generateSecurePassword(16);
    const passwordHash = await hashPassword(password);

    await db`
      INSERT INTO providers (
        id, email, password_hash, first_name, last_name, 
        license_number, npi_number, specialties, states_licensed,
        status, email_verified, available_for_consultations,
        consultation_capacity, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        ${providerEmail},
        ${passwordHash},
        'Test',
        'Provider',
        'TEST-LICENSE-001',
        '1234567890',
        ARRAY['General Practice', 'Telemedicine'],
        ARRAY['CA', 'NY', 'TX'],
        'active',
        true,
        true,
        20,
        NOW(),
        NOW()
      )
    `;

    logSeedOperation(`✅ Provider stub created: ${providerEmail}`);
    
    console.log('');
    console.log('🩺 PROVIDER STUB CREDENTIALS:');
    console.log(`   Email: ${providerEmail}`);
    console.log(`   Password: ${password}`);
    console.log('   License: TEST-LICENSE-001');
    console.log('   ⚠️  This is a test account - do not use in production!');
    console.log('');

    return { email: providerEmail, password };
  } catch (error) {
    console.error('❌ Error creating provider stub:', error);
    throw error;
  }
}

/**
 * Main admin seeding function
 */
export default async function seedAdmin(db) {
  logSeedOperation('Starting admin seeding');
  
  try {
    // Create primary admin user
    const primaryAdmin = await seedAdminUser(db);
    
    // Create additional admins if specified
    const additionalAdmins = await seedAdditionalAdmins(db);
    
    // Create provider stub if requested
    const providerStub = await seedProviderStub(db);
    
    logSeedOperation('✅ Admin seeding completed successfully');
    
    return {
      primaryAdmin,
      additionalAdmins,
      providerStub
    };
  } catch (error) {
    logSeedOperation('❌ Admin seeding failed');
    throw error;
  }
}