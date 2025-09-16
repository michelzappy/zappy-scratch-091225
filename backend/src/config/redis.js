import Redis from 'ioredis';

let redis;

export async function setupRedis() {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redis = new Redis(redisUrl, {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: 0,  // Disable retries
      enableOfflineQueue: false,  // Don't queue commands when offline
      lazyConnect: true,
      retryStrategy: () => null  // Disable retry strategy completely
    });

    redis.on('connect', () => {
      console.log('Redis connected');
    });

    redis.on('error', (error) => {
      // Suppress repeated error messages
      if (error.message && !error.message.includes('ECONNREFUSED')) {
        console.error('Redis connection error:', error);
      }
    });

    // Test connection
    await redis.ping();

    return redis;
  } catch (error) {
    console.log('Redis not available - running without caching/sessions');
    // Don't throw error - Redis is optional for basic functionality
    redis = null;
    return null;
  }
}

export function getRedis() {
  return redis;
}
