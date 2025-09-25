// src/config/index.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve current directory for loading .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (only once globally)
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Helper to enforce required env vars
function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`❌ Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  // Server
  port: Number(process.env.PORT) || 3001,

  // Database
  databaseUrl: required('DATABASE_URL'),

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // Stripe
  stripeSecretKey: required('STRIPE_SECRET_KEY'),

  // Authentication
  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },

  // Security Flags
  security: {
    enhancedAuth: process.env.ENABLE_ENHANCED_AUTH !== 'false',
    hipaaSessions: process.env.ENABLE_HIPAA_SESSIONS !== 'false',
  },

  // CORS
  cors: {
    origins: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : ['http://localhost:3000'],
  },
};
