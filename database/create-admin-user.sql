-- Create New Database Admin User for Telehealth Platform
-- Run this as existing postgres superuser to create a dedicated admin

-- Create dedicated admin user for this project
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'telehealth_admin') THEN
        CREATE USER telehealth_admin WITH PASSWORD 'admin_secure_password' CREATEDB CREATEROLE;
        RAISE NOTICE 'Created telehealth_admin user';
    ELSE
        RAISE NOTICE 'telehealth_admin user already exists';
    END IF;
END $$;

-- Grant necessary privileges to the admin user
ALTER USER telehealth_admin WITH SUPERUSER;

-- Display created user info
\echo 'New Database Admin Created:'
\echo 'Username: telehealth_admin'
\echo 'Password: admin_secure_password'
\echo 'Privileges: SUPERUSER, CREATEDB, CREATEROLE'
\echo ''
\echo 'You can now use this admin for all database operations:'
\echo 'psql -U telehealth_admin -d postgres'