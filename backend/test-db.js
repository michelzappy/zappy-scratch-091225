import dotenv from 'dotenv';
import postgres from 'postgres';

// Load environment variables from parent directory
dotenv.config({ path: '../.env' });

console.log('DATABASE_URL:', process.env.DATABASE_URL);

// Try connecting without password since we set trust authentication
const sql = postgres({
  host: 'localhost',
  port: 5432,
  database: 'telehealth_db',
  username: 'telehealth_user'
});

try {
  const result = await sql`SELECT 1 as test`;
  console.log('Connection successful:', result);
} catch (error) {
  console.log('Connection failed:', error);
} finally {
  await sql.end();
}