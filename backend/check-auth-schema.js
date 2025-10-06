/**
 * Check Neon Auth Schema
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

async function checkSchema() {
  try {
    console.log('🔍 Checking neon_auth.users_sync schema...\n');
    
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'neon_auth' 
      AND table_name = 'users_sync'
      ORDER BY ordinal_position
    `;
    
    console.log('Table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
    });
    
    console.log('\n🔍 Sample user record...\n');
    const user = await sql`
      SELECT * FROM neon_auth.users_sync 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    if (user.length > 0) {
      console.log('User record fields:');
      Object.keys(user[0]).forEach(key => {
        console.log(`  - ${key}: ${user[0][key]}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

checkSchema();