import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL);

async function verifyAdminRole() {
  try {
    console.log('🔍 Checking admin role for user...\n');
    
    const result = await sql`
      SELECT 
        id,
        email,
        name,
        raw_json->'clientMetadata' as client_metadata,
        raw_json->'clientMetadata'->>'role' as role
      FROM neon_auth.users_sync 
      WHERE email = 'wimpievanloggenberg@gmail.com'
    `;
    
    if (result.length > 0) {
      const user = result[0];
      console.log('✅ User found:');
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role || 'NOT SET'}`);
      console.log(`   Client Metadata:`, JSON.stringify(user.client_metadata, null, 2));
      
      if (user.role === 'admin') {
        console.log('\n✅ Admin role is correctly set in database!');
        console.log('\n📋 Next steps:');
        console.log('1. Sign out completely from Stack Auth');
        console.log('2. Clear browser cache/cookies for localhost:3000');
        console.log('3. Sign in again');
        console.log('4. Visit http://localhost:3000/portal/dashboard');
      } else {
        console.log('\n❌ Role is not set to admin!');
      }
    } else {
      console.log('❌ User not found');
    }
    
    await sql.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyAdminRole();