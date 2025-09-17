-- Pharmacies Seed Data
-- Extracted from migration 001_consolidated_schema.sql lines 516-519

-- Insert sample pharmacy
INSERT INTO pharmacies (name, api_endpoint, email, states_serviced, active, preferred) VALUES
('TeleHealth Pharmacy Partners', 'https://api.pharmacy-partner.com/v1', 'fulfillment@pharmacy-partner.com',
 ARRAY['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'], 
 true, true);