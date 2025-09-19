import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../models/index.js';

let db;
let connection;

export async function connectDatabase() {
  try {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    // Create PostgreSQL connection
    connection = postgres(connectionString, {
      max: 20,
      idle_timeout: 30,
      connect_timeout: 10,
      ssl: process.env.NODE_ENV === 'production' ? 'require' : false
    });

    // Initialize Drizzle ORM
    const drizzleDb = drizzle(connection, { schema });

    // Create database wrapper that supports both Drizzle ORM and raw SQL
    db = {
      // Drizzle ORM methods
      ...drizzleDb,
      
      // Raw SQL query method for backwards compatibility
      query: async (sql, params = []) => {
        const result = await connection.unsafe(sql, params);
        return { rows: result };
      },
      
      // Raw SQL method for complex queries
      raw: async (sql, params = []) => {
        const result = await connection.unsafe(sql, params);
        return { rows: result };
      },
      
      // Direct access to connection for advanced use cases
      connection: connection
    };

    // Test connection
    await connection`SELECT 1`;

    return db;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDatabase() first.');
  }
  return db;
}

export function getRawConnection() {
  if (!connection) {
    throw new Error('Database not initialized. Call connectDatabase() first.');
  }
  return connection;
}

export async function closeDatabase() {
  if (connection) {
    await connection.end();
  }
}
