import { getRedis } from '../config/redis.js';

/**
 * Enhanced Query Service with caching, performance monitoring, and standardized patterns
 */
class QueryService {
  constructor(db, redis = null) {
    this.db = db;
    this.redis = redis;
    this.queryCache = new Map();
    this.queryMetrics = new Map();
    this.allowedTables = [
      'patients', 'providers', 'consultations', 'prescriptions', 
      'medications', 'pharmacies', 'orders', 'messages', 'admins'
    ];
  }

  /**
   * Execute query with performance monitoring and error handling
   */
  async execute(queryName, queryFn, options = {}) {
    const { useCache = false, cacheTTL = 300, retryCount = 0 } = options;
    const startTime = performance.now();

    try {
      let result;
      
      if (useCache && this.redis) {
        const cacheKey = `query:${queryName}:${this.getCacheKey(queryFn)}`;
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          const duration = performance.now() - startTime;
          this.recordMetric(queryName, duration, true);
          return JSON.parse(cached);
        }
      }

      result = await queryFn();

      if (useCache && this.redis && result) {
        const cacheKey = `query:${queryName}:${this.getCacheKey(queryFn)}`;
        await this.redis.setex(cacheKey, cacheTTL, JSON.stringify(result));
      }

      const duration = performance.now() - startTime;
      this.recordMetric(queryName, duration, false);

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(queryName, duration, false, error);

      if (this.isRetryableError(error) && retryCount < 3) {
        console.log(`Retrying query ${queryName} (attempt ${retryCount + 1})`);
        await this.delay(Math.pow(2, retryCount) * 1000);
        return this.execute(queryName, queryFn, { ...options, retryCount: retryCount + 1 });
      }

      throw error;
    }
  }

  /**
   * Find record by ID with caching
   */
  async findById(table, id, fields = '*', useCache = true) {
    this.validateTable(table);
    
    return this.execute(`findById:${table}`, async () => {
      const result = await this.db`
        SELECT ${this.db(fields)} FROM ${this.db(table)} 
        WHERE id = ${id} LIMIT 1
      `;
      return result[0] || null;
    }, { useCache, cacheTTL: 300 });
  }

  /**
   * Find multiple records with filtering and pagination
   */
  async findMany(table, conditions = {}, options = {}) {
    this.validateTable(table);
    
    const { 
      limit = 100, 
      offset = 0, 
      orderBy = 'created_at DESC',
      fields = '*',
      useCache = false 
    } = options;

    return this.execute(`findMany:${table}`, async () => {
      let query = this.db`SELECT ${this.db(fields)} FROM ${this.db(table)}`;
      
      if (Object.keys(conditions).length > 0) {
        const whereClauses = [];
        for (const [key, value] of Object.entries(conditions)) {
          if (value !== null && value !== undefined) {
            whereClauses.push(this.db`${this.db(key)} = ${value}`);
          }
        }
        
        if (whereClauses.length > 0) {
          query = this.db`${query} WHERE ${this.db.join(whereClauses, ' AND ')}`;
        }
      }
      
      if (orderBy) {
        query = this.db`${query} ORDER BY ${this.db(orderBy)}`;
      }
      
      query = this.db`${query} LIMIT ${limit} OFFSET ${offset}`;
      
      return await query;
    }, { useCache });
  }

  /**
   * Safe count query with table validation
   */
  async count(table, conditions = {}) {
    this.validateTable(table);
    
    return this.execute(`count:${table}`, async () => {
      let query = this.db`SELECT COUNT(*) as count FROM ${this.db(table)}`;
      
      if (Object.keys(conditions).length > 0) {
        const whereClauses = [];
        for (const [key, value] of Object.entries(conditions)) {
          if (value !== null && value !== undefined) {
            whereClauses.push(this.db`${this.db(key)} = ${value}`);
          }
        }
        
        if (whereClauses.length > 0) {
          query = this.db`${query} WHERE ${this.db.join(whereClauses, ' AND ')}`;
        }
      }
      
      const result = await query;
      return parseInt(result[0].count);
    });
  }

  /**
   * Insert record with validation
   */
  async insert(table, data) {
    this.validateTable(table);
    
    return this.execute(`insert:${table}`, async () => {
      const fields = Object.keys(data);
      const values = Object.values(data);
      
      const result = await this.db`
        INSERT INTO ${this.db(table)} (${this.db(fields)})
        VALUES (${this.db(values)})
        RETURNING *
      `;
      
      return result[0];
    });
  }

  /**
   * Update record by ID
   */
  async updateById(table, id, data) {
    this.validateTable(table);
    
    return this.execute(`updateById:${table}`, async () => {
      const fields = Object.keys(data);
      const values = Object.values(data);
      
      const result = await this.db`
        UPDATE ${this.db(table)}
        SET ${this.db(fields)} = ${this.db(values)}
        WHERE id = ${id}
        RETURNING *
      `;
      
      return result[0] || null;
    });
  }

  /**
   * Delete record by ID
   */
  async deleteById(table, id) {
    this.validateTable(table);
    
    return this.execute(`deleteById:${table}`, async () => {
      const result = await this.db`
        DELETE FROM ${this.db(table)}
        WHERE id = ${id}
        RETURNING *
      `;
      
      return result[0] || null;
    });
  }

  /**
   * Check if table exists
   */
  async tableExists(tableName) {
    return this.execute(`tableExists:${tableName}`, async () => {
      const result = await this.db`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        ) as exists
      `;
      return result[0]?.exists || false;
    });
  }

  /**
   * Get query performance metrics
   */
  getMetrics() {
    const metrics = {};
    for (const [queryName, data] of this.queryMetrics.entries()) {
      metrics[queryName] = {
        totalQueries: data.count,
        averageTime: Math.round(data.totalTime / data.count),
        minTime: data.minTime,
        maxTime: data.maxTime,
        errorCount: data.errorCount,
        cacheHits: data.cacheHits
      };
    }
    return metrics;
  }

  /**
   * Clear query cache
   */
  async clearCache(pattern = null) {
    if (!this.redis) return;
    
    if (pattern) {
      const keys = await this.redis.keys(`query:${pattern}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } else {
      const keys = await this.redis.keys('query:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
  }

  // Private methods
  validateTable(table) {
    if (!this.allowedTables.includes(table)) {
      throw new Error(`Table '${table}' is not allowed. Allowed tables: ${this.allowedTables.join(', ')}`);
    }
  }

  getCacheKey(queryFn) {
    // Simple hash of function string representation
    return Buffer.from(queryFn.toString()).toString('base64').slice(0, 16);
  }

  recordMetric(queryName, duration, fromCache = false, error = null) {
    if (!this.queryMetrics.has(queryName)) {
      this.queryMetrics.set(queryName, {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        errorCount: 0,
        cacheHits: 0
      });
    }

    const metric = this.queryMetrics.get(queryName);
    metric.count++;
    metric.totalTime += duration;
    metric.minTime = Math.min(metric.minTime, duration);
    metric.maxTime = Math.max(metric.maxTime, duration);
    
    if (fromCache) {
      metric.cacheHits++;
    }
    
    if (error) {
      metric.errorCount++;
    }
  }

  isRetryableError(error) {
    const retryableCodes = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED'];
    return retryableCodes.includes(error.code) || error.message.includes('timeout');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create singleton instance
let queryService = null;

export async function getQueryService() {
  if (!queryService) {
    const { getDatabase } = await import('../config/database.js');
    const redis = getRedis();
    queryService = new QueryService(getDatabase(), redis);
  }
  return queryService;
}

export default QueryService;
