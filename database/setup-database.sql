-- Database Setup Script for Telehealth Platform
-- Run this as postgres superuser

-- Create user if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'telehealth_user') THEN
        CREATE USER telehealth_user WITH PASSWORD 'secure_password';
    END IF;
END $$;

-- Create database if not exists
SELECT 'CREATE DATABASE telehealth_db OWNER telehealth_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'telehealth_db')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE telehealth_db TO telehealth_user;

-- Connect to the new database and grant schema privileges
\c telehealth_db

-- Grant privileges on public schema
GRANT ALL ON SCHEMA public TO telehealth_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO telehealth_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO telehealth_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO telehealth_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO telehealth_user;

\echo 'Database and user setup completed successfully!'