-- Medications Seed Data
-- Extracted from migration 001_consolidated_schema.sql lines 504-513

-- Insert sample medications
INSERT INTO medications (name, generic_name, brand_name, category, available_dosages, base_price) VALUES
('Sildenafil', 'Sildenafil Citrate', 'Viagra®', 'ED', 
 '[{"strength": "20mg", "form": "tablet"}, {"strength": "50mg", "form": "tablet"}, {"strength": "100mg", "form": "tablet"}]'::jsonb, 
 30.00),
('Finasteride', 'Finasteride', 'Propecia®', 'Hair Loss', 
 '[{"strength": "1mg", "form": "tablet"}]'::jsonb, 
 25.00),
('Minoxidil', 'Minoxidil', 'Rogaine®', 'Hair Loss', 
 '[{"strength": "5%", "form": "solution"}]'::jsonb, 
 35.00);