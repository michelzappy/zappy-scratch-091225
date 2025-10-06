import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: join(__dirname, '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

console.log('🔍 Testing Neon Database Connection...');
console.log('📝 Connection string format:', connectionString.replace(/:[^:@]+@/, ':****@'));

async function testConnection() {
  let sql;
  
  try {
    // Create connection with SSL
    sql = postgres(connectionString, {
      ssl: 'require',
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    console.log('\n✅ Connection pool created successfully');

    // Test 1: Simple query
    console.log('\n📊 Test 1: Running simple SELECT query...');
    const result1 = await sql`SELECT NOW() as current_time, version() as pg_version`;
    console.log('✅ Query successful!');
    console.log('   Time:', result1[0].current_time);
    console.log('   PostgreSQL:', result1[0].pg_version);

    // Test 2: Check if we can access tables
    console.log('\n📊 Test 2: Checking database tables...');
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `;
    console.log(`✅ Found ${tables.length} tables in public schema:`);
    tables.forEach(t => console.log(`   - ${t.tablename}`));

    // Test 3: Check extensions
    console.log('\n📊 Test 3: Checking PostgreSQL extensions...');
    const extensions = await sql`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname IN ('uuid-ossp', 'pgcrypto')
      ORDER BY extname
    `;
    console.log(`✅ Found ${extensions.length} required extensions:`);
    extensions.forEach(e => console.log(`   - ${e.extname} (v${e.extversion})`));

    console.log('\n🎉 All connection tests passed!');
    console.log('✅ Neon database is ready to use');

  } catch (error) {
    console.error('\n❌ Connection test failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('certificate')) {
      console.error('\n💡 SSL Certificate issue detected.');
      console.error('   This might be a temporary Neon issue or network problem.');
    } else if (error.message.includes('timeout')) {
      console.error('\n💡 Connection timeout detected.');
      console.error('   Check your internet connection and Neon database status.');
    } else if (error.message.includes('authentication')) {
      console.error('\n💡 Authentication failed.');
      console.error('   Verify your DATABASE_URL credentials are correct.');
    }
    
    process.exit(1);
  } finally {
    if (sql) {
      await sql.end();
      console.log('\n🔌 Connection closed');
    }
  }
}

testConnection();