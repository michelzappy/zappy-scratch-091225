import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export default defineConfig({
  schema: './src/models/index.js',
  out: '../database/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 'postgresql://telehealth_user:secure_password@localhost:5432/telehealth_db',
  },
  verbose: true,
  strict: true,
});