/**
 * Assign Admin Role to User
 * 
 * This script updates a user's role in the neon_auth.users_sync table to 'admin'
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30,
  ssl: { rejectUnauthorized: false }
});

async function assignAdminRole() {
  try {
    console.log('🔍 Fetching recent users...\n');
    
    // Get the most recent user (likely the one that just signed in)
    const users = await sql`
      SELECT id, email, created_at 
      FROM neon_auth.users_sync 
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    
    console.log('Recent users:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${user.created_at}\n`);
    });
    
    if (users.length === 0) {
      console.log('❌ No users found in the database');
      process.exit(1);
    }
    
    // Get the most recent user
    const targetUser = users[0];
    
    console.log(`\n🎯 Assigning admin role to: ${targetUser.email}`);
    
    // Update the user's metadata to include admin role
    // Stack Auth stores custom data in the raw_json->clientMetadata field
    const result = await sql`
      UPDATE neon_auth.users_sync
      SET raw_json = jsonb_set(
        raw_json,
        '{clientMetadata}',
        jsonb_build_object('role', 'admin'),
        true
      )
      WHERE id = ${targetUser.id}
      RETURNING id, email, raw_json->'clientMetadata' as client_metadata
    `;
    
    if (result.length > 0) {
      console.log('\n✅ Admin role assigned successfully!');
      console.log(`   User: ${result[0].email}`);
      console.log(`   Role: admin`);
      console.log(`   Metadata:`, result[0].client_metadata);
      console.log('\n📋 User now has full admin access to:');
      console.log('   • Patient Portal (/patient/*)');
      console.log('   • Provider Portal (/portal/*)');
      console.log('   • Admin Portal (/admin/*)');
      console.log('\n🔄 Please sign out and sign in again for changes to take effect.');
    } else {
      console.log('❌ Failed to update user role');
    }
    
  } catch (error) {
    console.error('❌ Error assigning admin role:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

assignAdminRole();