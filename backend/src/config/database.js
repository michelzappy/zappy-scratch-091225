import postgres from 'postgres';

/**
 * Enhanced Database Manager with proper connection pooling and lifecycle management
 */
class DatabaseManager {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.connectionString = null;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  async connect() {
    if (this.isConnected && this.pool) {
      return this.pool;
    }

    try {
      this.connectionString = process.env.DATABASE_URL;
      
      if (!this.connectionString) {
        throw new Error('DATABASE_URL environment variable is required');
      }

      // Create PostgreSQL connection pool with enhanced configuration
      this.pool = postgres(this.connectionString, {
        max: 20,
        idle_timeout: 30,
        connect_timeout: 10,
        ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
        onnotice: () => {}, 
        transform: {
          undefined: null 
        },
        prepare: false, 
        debug: process.env.NODE_ENV === 'development' ? false : false
      });

      await this.testConnection();
      
      this.isConnected = true;
      this.retryCount = 0;
      console.log('✅ Database connected successfully');
      
      return this.pool;
    } catch (error) {
      console.error('Database connection failed:', error);
      
      if (this.isRetryableError(error) && this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`Retrying database connection (attempt ${this.retryCount}/${this.maxRetries})...`);
        await this.delay(Math.pow(2, this.retryCount) * 1000); 
        return this.connect();
      }
      
      throw error;
    }
  }

  async testConnection() {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }
    
    const startTime = performance.now();
    await this.pool`SELECT 1 as test, NOW() as current_time`;
    const duration = performance.now() - startTime;
    
    if (duration > 1000) {
      console.warn(`⚠️  Database connection slow: ${Math.round(duration)}ms`);
    }
  }

  isRetryableError(error) {
    const retryableCodes = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND'];
    return retryableCodes.includes(error.code) || error.message.includes('timeout');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getDatabase() {
    if (!this.isConnected || !this.pool) {
      throw new Error('Database not available. Please check your DATABASE_URL configuration and restart the server.');
    }
    return this.pool;
  }

  isConnected() {
    return this.isConnected && !!this.pool;
  }

  async close() {
    if (this.pool) {
      try {
        await this.pool.end();
        console.log('✅ Database connection closed');
      } catch (error) {
        console.error('Error closing database connection:', error);
      } finally {
        this.pool = null;
        this.isConnected = false;
      }
    }
  }

  async healthCheck() {
    try {
      if (!this.isConnected || !this.pool) {
        return { healthy: false, error: 'Not connected' };
      }

      const startTime = performance.now();
      const result = await this.pool`SELECT NOW() as current_time, version() as db_version`;
      const duration = performance.now() - startTime;

      return {
        healthy: true,
        responseTime: Math.round(duration),
        databaseTime: result[0].current_time,
        version: result[0].db_version
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const dbManager = new DatabaseManager();

// Legacy exports for backward compatibility
export async function connectDatabase() {
  return await dbManager.connect();
}

export function getDatabase() {
  return dbManager.getDatabase();
}

export function isDatabaseConnected() {
  return dbManager.isConnected();
}

export function getRawConnection() {
  return dbManager.getDatabase();
}

export async function closeDatabase() {
  return await dbManager.close();
}

// New enhanced exports
export { dbManager };
export default dbManager;