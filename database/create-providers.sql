-- Create provider accounts for the telehealth platform
-- Password for all test providers: Provider123!
-- Hashed using bcrypt with 10 rounds

-- Insert test providers
INSERT INTO providers (id, email, password_hash, first_name, last_name, license_number, license_state, specialties, is_active) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 
     'dr.smith@clinic.com', 
     '$2a$10$YourHashedPasswordHere', -- Replace with actual bcrypt hash
     'Jane', 
     'Smith', 
     'MD123456', 
     'CA', 
     ARRAY['General Medicine', 'Dermatology', 'Anti-Aging'],
     true),
     
    ('550e8400-e29b-41d4-a716-446655440002', 
     'dr.johnson@clinic.com', 
     '$2a$10$YourHashedPasswordHere', 
     'Michael', 
     'Johnson', 
     'MD789012', 
     'CA', 
     ARRAY['General Medicine', 'Men''s Health', 'Weight Management'],
     true),
     
    ('550e8400-e29b-41d4-a716-446655440003', 
     'dr.williams@clinic.com', 
     '$2a$10$YourHashedPasswordHere', 
     'Sarah', 
     'Williams', 
     'MD345678', 
     'CA', 
     ARRAY['General Medicine', 'Women''s Health', 'Hormones'],
     true),
     
    ('550e8400-e29b-41d4-a716-446655440004', 
     'dr.brown@clinic.com', 
     '$2a$10$YourHashedPasswordHere', 
     'Robert', 
     'Brown', 
     'MD901234', 
     'NY', 
     ARRAY['General Medicine', 'Mental Health', 'Chronic Care'],
     true);

-- Create a function to generate proper bcrypt hashes (for development)
-- In production, use actual bcrypt library
DO $$
BEGIN
    -- Update with actual bcrypt hash for 'Provider123!'
    UPDATE providers 
    SET password_hash = '$2a$10$K7L1OJ0TfuMpqm6p8TJcEeQmJt7c9jDpBa7AuRvPkwFWYgE9GqhB2'
    WHERE password_hash = '$2a$10$YourHashedPasswordHere';
END $$;

-- Verify providers were created
SELECT id, email, first_name, last_name, license_state, specialties 
FROM providers;
