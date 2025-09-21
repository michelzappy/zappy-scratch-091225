import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { getDatabase, connectDatabase } from './src/config/database.js';

const testAuth = async () => {
  console.log('=== AUTH DEBUG TEST ===');
  
  // Initialize database connection
  await connectDatabase();
  const db = getDatabase();
  const email = 'dev@admin.com';
  const password = 'dev123456';
  
  try {
    // Get the user from database
    const result = await db.query(`
      SELECT email, password_hash, first_name, last_name, status
      FROM admins 
      WHERE email = $1
    `, [email]);
    
    if (result.rows.length === 0) {
      console.log('❌ User not found in database');
      return;
    }
    
    const user = result.rows[0];
    console.log('✅ User found:', {
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      status: user.status,
      hasPassword: !!user.password_hash,
      passwordHashPrefix: user.password_hash?.substring(0, 10) + '...'
    });
    
    // Test password comparison
    console.log('\n=== PASSWORD VERIFICATION ===');
    console.log('Input password:', password);
    console.log('Stored hash prefix:', user.password_hash.substring(0, 10) + '...');
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    console.log('Password comparison result:', isValid ? '✅ VALID' : '❌ INVALID');
    
    // Test with our generated hash
    const testHash = '$2a$10$KlZ4rME9j26bkwIt6DwwK.s0InkZtBJul4ZIyW8LmaM6Oeh7LvgRO';
    const testResult = await bcrypt.compare(password, testHash);
    console.log('Test hash comparison result:', testResult ? '✅ VALID' : '❌ INVALID');
    
    // Test if the stored hash matches our expected hash
    console.log('Hash matches expected:', user.password_hash === testHash ? '✅ YES' : '❌ NO');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
};

testAuth();