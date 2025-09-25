import dotenv from 'dotenv';
import postgres from 'postgres';

// Load environment variables from current directory
dotenv.config({ path: '../.env' });

console.log('DATABASE_URL:', process.env.DATABASE_URL);

// Use DATABASE_URL from environment variables
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const sql = postgres(connectionString);

try {
  const result = await sql`SELECT 1 as test`;
  console.log('Connection successful:', result);
} catch (error) {
  console.log('Connection failed:', error);
} finally {
  await sql.end();
}