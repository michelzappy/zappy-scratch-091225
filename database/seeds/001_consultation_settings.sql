-- Consultation Settings Seed Data
-- Extracted from migration 001_consolidated_schema.sql lines 41-43

-- Insert default settings
INSERT INTO consultation_settings (consultation_fee, require_credit_card) 
VALUES (0.00, true);