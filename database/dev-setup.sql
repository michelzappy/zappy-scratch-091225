-- Development Admin Account Setup
-- This creates a dev admin account for testing authentication integration

-- Insert dev admin account
INSERT INTO admins (
  id,
  email, 
  password_hash,
  first_name,
  last_name,
  role,
  permissions,
  status,
  two_factor_enabled,
  created_at,
  updated_at
) VALUES (
  uuid_generate_v4(),
  'dev@admin.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: 'dev123456'
  'Dev',
  'Admin',
  'super_admin',
  '{"all": true, "patients": true, "providers": true, "orders": true, "consultations": true, "admin": true}',
  'active',
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  status = EXCLUDED.status,
  updated_at = CURRENT_TIMESTAMP;

-- Also create a dev patient account for testing
INSERT INTO patients (
  id,
  email,
  password_hash, 
  first_name,
  last_name,
  phone,
  date_of_birth,
  shipping_address,
  shipping_city,
  shipping_state,
  shipping_zip,
  email_verified,
  created_at,
  updated_at
) VALUES (
  uuid_generate_v4(),
  'dev@patient.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: 'dev123456'
  'Dev',
  'Patient',
  '555-0123',
  '1990-01-01',
  '123 Dev Street',
  'Dev City',
  'CA',
  '90210',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email_verified = EXCLUDED.email_verified,
  updated_at = CURRENT_TIMESTAMP;

-- Create a dev provider account
INSERT INTO providers (
  id,
  email,
  password_hash,
  first_name,
  last_name,
  phone,
  license_number,
  npi_number,
  specialties,
  states_licensed,
  status,
  email_verified,
  available_for_consultations,
  created_at,
  updated_at
) VALUES (
  uuid_generate_v4(),
  'dev@provider.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: 'dev123456'
  'Dr. Dev',
  'Provider',
  '555-0124',
  'MD12345',
  '1234567890',
  '{"General Practice", "Telemedicine"}',
  '{"CA", "NY", "TX"}',
  'active',
  true,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  status = EXCLUDED.status,
  email_verified = EXCLUDED.email_verified,
  updated_at = CURRENT_TIMESTAMP;

-- Display the created accounts
SELECT 'Created Dev Accounts:' as message;
SELECT 'Admin Account' as type, email, first_name, last_name, role, status FROM admins WHERE email = 'dev@admin.com';
SELECT 'Patient Account' as type, email, first_name, last_name, 'patient' as role, 'active' as status FROM patients WHERE email = 'dev@patient.com';  
SELECT 'Provider Account' as type, email, first_name, last_name, 'provider' as role, status FROM providers WHERE email = 'dev@provider.com';