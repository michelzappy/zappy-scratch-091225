import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

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

console.log('🔍 Applying database schema to Neon...\n');

async function applySchema() {
  let sql;
  
  try {
    // Create connection with SSL
    sql = postgres(connectionString, {
      ssl: 'require',
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    console.log('✅ Connected to Neon database');

    // Read the Neon-compatible init.sql file
    const schemaPath = join(__dirname, '..', 'database', 'init-neon.sql');
    const schemaSQL = readFileSync(schemaPath, 'utf8');

    console.log('📄 Schema file loaded successfully');
    console.log('📊 Applying schema...\n');

    // Execute the schema
    await sql.unsafe(schemaSQL);

    console.log('✅ Schema applied successfully!\n');

    // Verify tables were created
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `;

    console.log(`✅ Created ${tables.length} tables:`);
    tables.forEach(t => console.log(`   - ${t.tablename}`));

    // Verify extensions
    const extensions = await sql`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname IN ('uuid-ossp', 'pg_trgm')
      ORDER BY extname
    `;

    console.log(`\n✅ Enabled ${extensions.length} extensions:`);
    extensions.forEach(e => console.log(`   - ${e.extname} (v${e.extversion})`));

    console.log('\n🎉 Database schema setup complete!');
    console.log('✅ Neon database is ready for use');

  } catch (error) {
    console.error('\n❌ Schema application failed:');
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    if (sql) {
      await sql.end();
      console.log('\n🔌 Connection closed');
    }
  }
}

applySchema();