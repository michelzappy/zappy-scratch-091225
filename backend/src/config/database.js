import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import postgres from 'postgres';
import logger from '../utils/logger.js';

// Load environment variables
dotenv.config();

// Database connection configuration
const config = {
  development: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  },
  test: {
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'password',
    database: process.env.DATABASE_NAME || 'healthcare_test',
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    dialect: 'postgres',
    logging: false
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

let sequelize;
if (dbConfig.use_env_variable) {
  sequelize = new Sequelize(process.env[dbConfig.use_env_variable], dbConfig);
} else {
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    dbConfig
  );
}

// Test connection
sequelize.authenticate()
  .then(() => {
    logger.info('Database connection has been established successfully.');
  })
  .catch((err) => {
    logger.error('Unable to connect to the database:', err);
  });

// Export getDatabase function for compatibility (returns Sequelize)
const getDatabase = () => sequelize;

// Create postgres.js connection for routes that use tagged template syntax
let postgresConnection = null;

function getPostgresConnection() {
  if (!postgresConnection) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    postgresConnection = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 30,
      ssl: { rejectUnauthorized: false }
    });
    
    logger.info('Postgres.js connection established');
  }
  
  return postgresConnection;
}

async function closePostgresConnection() {
  if (postgresConnection) {
    await postgresConnection.end({ timeout: 5 });
    postgresConnection = null;
    logger.info('Postgres.js connection closed');
  }
}

export default sequelize;
export { getDatabase, getPostgresConnection, closePostgresConnection };
