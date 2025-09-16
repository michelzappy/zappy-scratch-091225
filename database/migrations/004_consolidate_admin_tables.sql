-- Migration to consolidate admin tables
-- Standardizing on 'admins' table name

-- Step 1: Check if admin_users exists and migrate data to admins
DO $$ 
BEGIN
    -- Only run if admin_users exists but admins doesn't have the data
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admin_users') THEN
        -- Insert any admin_users not already in admins
        INSERT INTO admins (id, email, password_hash, first_name, last_name, permissions, two_factor_enabled, two_factor_secret, status, created_at, updated_at, last_login)
        SELECT id, email, password_hash, first_name, last_name, permissions, two_factor_enabled, two_factor_secret, 
               CASE WHEN is_active THEN 'active' ELSE 'inactive' END as status,
               created_at, updated_at, last_login
        FROM admin_users
        WHERE NOT EXISTS (SELECT 1 FROM admins WHERE admins.email = admin_users.email);
        
        -- Drop the old table
        DROP TABLE IF EXISTS admin_users CASCADE;
    END IF;
END $$;

-- Step 2: Ensure admins table has all required columns
ALTER TABLE admins ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE admins ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- Step 3: Update any foreign key references
-- Update support_tickets table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'support_tickets') THEN
        -- Drop old constraint if exists
        ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_assigned_to_fkey;
        
        -- Add new constraint
        ALTER TABLE support_tickets 
        ADD CONSTRAINT support_tickets_assigned_to_fkey 
        FOREIGN KEY (assigned_to) REFERENCES admins(id);
    END IF;
END $$;

-- Step 4: Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_status ON admins(status);
