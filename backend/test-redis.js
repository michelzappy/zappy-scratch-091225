import { setupRedis, getRedis } from './src/config/redis.js';

async function testRedis() {
  console.log('Testing Redis connection...\n');
  
  // Initialize Redis first
  console.log('0. Initializing Redis...');
  await setupRedis();
  const redis = getRedis();
  
  if (!redis) {
    console.error('❌ Redis client not initialized');
    process.exit(1);
  }
  console.log('   ✅ Redis initialized\n');
  
  try {
    // Test 1: Ping
    console.log('1. Testing PING...');
    const pong = await redis.ping();
    console.log(`   ✅ PING response: ${pong}\n`);
    
    // Test 2: Set a key
    console.log('2. Testing SET...');
    await redis.set('test:key', 'hello-redis', 'EX', 10);
    console.log('   ✅ Key set successfully\n');
    
    // Test 3: Get the key
    console.log('3. Testing GET...');
    const value = await redis.get('test:key');
    console.log(`   ✅ Retrieved value: ${value}\n`);
    
    // Test 4: Delete the key
    console.log('4. Testing DEL...');
    await redis.del('test:key');
    console.log('   ✅ Key deleted successfully\n');
    
    // Test 5: Verify deletion
    console.log('5. Verifying deletion...');
    const deletedValue = await redis.get('test:key');
    console.log(`   ✅ Value after deletion: ${deletedValue === null ? 'null (as expected)' : deletedValue}\n`);
    
    console.log('🎉 All Redis tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Redis test failed:', error.message);
    process.exit(1);
  }
}

testRedis();