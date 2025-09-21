-- Fix password hash for dev accounts
UPDATE admins SET password_hash = '$2a$10$KlZ4rME9j26bkwIt6DwwK.s0InkZtBJul4ZIyW8LmaM6Oeh7LvgRO' WHERE email = 'dev@admin.com';
UPDATE patients SET password_hash = '$2a$10$KlZ4rME9j26bkwIt6DwwK.s0InkZtBJul4ZIyW8LmaM6Oeh7LvgRO' WHERE email = 'dev@patient.com';
UPDATE providers SET password_hash = '$2a$10$KlZ4rME9j26bkwIt6DwwK.s0InkZtBJul4ZIyW8LmaM6Oeh7LvgRO' WHERE email = 'dev@provider.com';

-- Verify the hashes are set correctly
SELECT 'Admin' as account_type, email, substring(password_hash, 1, 10) as hash_prefix FROM admins WHERE email = 'dev@admin.com';
SELECT 'Patient' as account_type, email, substring(password_hash, 1, 10) as hash_prefix FROM patients WHERE email = 'dev@patient.com';
SELECT 'Provider' as account_type, email, substring(password_hash, 1, 10) as hash_prefix FROM providers WHERE email = 'dev@provider.com';