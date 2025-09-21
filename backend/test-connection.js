import { connectDatabase, getDatabase } from './src/config/database.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set ✅' : 'Missing ❌');
    
    // Test database connection
    const db = await connectDatabase();
    console.log('✅ Database connected successfully!');
    
    // Test a simple query
    const result = await db.connection`SELECT 1 as test`;
    console.log('✅ Database query test successful:', result);
    
    // Close connection
    await db.connection.end();
    console.log('✅ Connection closed gracefully');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();