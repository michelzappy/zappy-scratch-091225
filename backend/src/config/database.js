import postgres from 'postgres';

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

    // Test connection
    await connection`SELECT 1`;
    console.log('✅ Database connected successfully');

    return connection;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

export function getDatabase() {
  if (!connection) {
    throw new Error('Database not initialized. Call connectDatabase() first.');
  }
  return connection;
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
