import { config } from 'dotenv';
config();

import pg from 'pg';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
const { Pool } = pg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

async function createSuperAdmin() {
  try {
    const email = 'admin@zap.com';
    const password = 'password123!';
    
    console.log('🚀 Creating Super Admin User...');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('');

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();
    const signedUpAt = Date.now();
    
    console.log('📝 Checking if user exists...');
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id, email FROM neon_auth.users_sync WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('👤 User already exists, updating admin role and password...');
      
      // Update existing user
      const result = await pool.query(`
        UPDATE neon_auth.users_sync
        SET raw_json = jsonb_set(
          jsonb_set(
            COALESCE(raw_json, '{}'::jsonb),
            '{clientMetadata,role}',
            '"admin"'::jsonb
          ),
          '{serverMetadata,passwordHash}',
          $1::jsonb
        )
        WHERE email = $2
        RETURNING id, email, name
      `, [JSON.stringify(hashedPassword), email]);
      
      console.log('✅ User updated in database');
      console.log('User ID:', result.rows[0].id);
      console.log('Email:', result.rows[0].email);
      console.log('Name:', result.rows[0].name);
      
    } else {
      console.log('➕ Creating new user...');
      
      // Build the raw_json object
      const rawJson = {
        id: userId,
        primaryEmail: email,
        displayName: 'Super Admin',
        profileImageUrl: null,
        signedUpAt: signedUpAt,
        hasPassword: true,
        authMethod: 'credential',
        clientMetadata: {
          role: 'admin'
        },
        serverMetadata: {
          passwordHash: hashedPassword
        }
      };
      
      // Insert new user - only raw_json, all other columns are generated
      const result = await pool.query(`
        INSERT INTO neon_auth.users_sync (raw_json)
        VALUES ($1::jsonb)
        RETURNING id, email, name
      `, [JSON.stringify(rawJson)]);
      
      console.log('✅ User created in database');
      console.log('User ID:', result.rows[0].id);
      console.log('Email:', result.rows[0].email);
      console.log('Name:', result.rows[0].name);
    }
    
    console.log('');

    // Verify admin role
    const verifyResult = await pool.query(
      `SELECT 
        id, 
        email,
        name,
        raw_json->'clientMetadata'->>'role' as role,
        raw_json->'serverMetadata'->>'passwordHash' as has_password
       FROM neon_auth.users_sync 
       WHERE email = $1`,
      [email]
    );

    if (verifyResult.rows.length > 0) {
      const user = verifyResult.rows[0];
      console.log('✅ Admin role verified:', user.role);
      console.log('✅ Password hash stored:', user.has_password ? 'Yes' : 'No');
    }

    console.log('');
    console.log('🎉 Super Admin Created Successfully!');
    console.log('');
    console.log('Login Credentials:');
    console.log('  Email:', email);
    console.log('  Password:', password);
    console.log('');
    console.log('Login URL: http://localhost:3000/handler/sign-in');
    console.log('');
    console.log('Note: Stack Auth will recognize this user on next authentication attempt.');

  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
    console.error('\nStack trace:', error);
  } finally {
    await pool.end();
  }
}

createSuperAdmin();