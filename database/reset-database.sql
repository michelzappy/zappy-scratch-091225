-- Database Reset and Setup Script for Telehealth Platform
-- Run this as postgres superuser to reset existing database with fresh credentials

-- Disconnect all active connections to the database
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity 
WHERE datname = 'telehealth_db' AND pid <> pg_backend_pid();

-- Drop existing database if exists
DROP DATABASE IF EXISTS telehealth_db;

-- Drop existing user if exists
DROP USER IF EXISTS telehealth_user;

-- Create fresh user with credentials from .env file
CREATE USER telehealth_user WITH PASSWORD 'secure_password';

-- Create fresh database
CREATE DATABASE telehealth_db OWNER telehealth_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE telehealth_db TO telehealth_user;

-- Connect to the new database
\c telehealth_db

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant privileges on public schema
GRANT ALL ON SCHEMA public TO telehealth_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO telehealth_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO telehealth_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO telehealth_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO telehealth_user;

\echo 'Database reset completed successfully!'
\echo 'User: telehealth_user'
\echo 'Database: telehealth_db'
\echo 'Ready for schema migrations!'