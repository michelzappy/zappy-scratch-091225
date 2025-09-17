-- Treatment Plans Seed Data
-- Extracted from migration 003_treatment_plans.sql lines 29-124

-- Insert actual treatment plans matching the UI
-- Weight Loss Plans
INSERT INTO treatment_plans (condition, plan_tier, name, price, billing_period, protocol_key, features, medications, is_popular, sort_order) VALUES
-- Weight Loss
('weightLoss', 'basic', 'Starter Plan', 99.00, 'month', 'starter', 
 '["Semaglutide or Tirzepatide", "Monthly provider consultations", "Basic nutritional guidance", "Email support"]'::jsonb,
 '[{"sku": "MET-500-TAB", "qty": 60}, {"sku": "ORL-60-CAP", "qty": 90}]'::jsonb,
 false, 1),
 
('weightLoss', 'standard', 'Accelerated Plan', 149.00, 'month', 'glp1',
 '["Premium GLP-1 medications", "Bi-weekly check-ins", "Personalized meal plans", "Priority support", "Progress tracking app"]'::jsonb,
 '[{"sku": "SEM-025-PEN", "qty": 4}]'::jsonb,
 true, 2),
 
('weightLoss', 'premium', 'Comprehensive Plan', 249.00, 'month', 'glp1',
 '["All medications included", "Weekly 1-on-1 coaching", "Custom exercise plans", "Nutritionist consultations", "24/7 support", "Lab work monitoring"]'::jsonb,
 '[{"sku": "SEM-050-PEN", "qty": 4}]'::jsonb,
 false, 3),

-- Hair Loss
('hairLoss', 'basic', 'Essential', 22.00, 'month', 'prevention',
 '["Finasteride (generic)", "Quarterly consultations", "Basic progress tracking"]'::jsonb,
 '[{"sku": "FIN-1-TAB", "qty": 30}]'::jsonb,
 false, 1),
 
('hairLoss', 'standard', 'Advanced', 45.00, 'month', 'standard',
 '["Finasteride + Minoxidil", "Monthly consultations", "Biotin supplements", "Progress photos analysis"]'::jsonb,
 '[{"sku": "FIN-1-TAB", "qty": 30}, {"sku": "MIN-5-SOL", "qty": 1}]'::jsonb,
 true, 2),
 
('hairLoss', 'premium', 'Complete Care', 79.00, 'month', 'aggressive',
 '["All medications", "DHT blocking shampoo", "Micro-needling kit", "Weekly check-ins", "Dermatologist consultations"]'::jsonb,
 '[{"sku": "FIN-1-TAB", "qty": 30}, {"sku": "MIN-5-SOL", "qty": 2}, {"sku": "BIO-10K", "qty": 30}]'::jsonb,
 false, 3),

-- Men's Health
('mensHealth', 'basic', 'Essential ED', 2.00, 'dose', 'standard',
 '["Sildenafil (generic Viagra)", "10 doses per month", "Online consultations"]'::jsonb,
 '[{"sku": "SIL-50-TAB", "qty": 10}]'::jsonb,
 false, 1),
 
('mensHealth', 'standard', 'Performance Plus', 5.00, 'dose', 'standard',
 '["Cialis or Viagra brand", "20 doses per month", "Monthly consultations", "Discreet packaging"]'::jsonb,
 '[{"sku": "SIL-100-TAB", "qty": 20}]'::jsonb,
 true, 2),
 
('mensHealth', 'premium', 'Total Vitality', 199.00, 'month', 'combination',
 '["All ED medications", "Testosterone support", "Libido enhancers", "Weekly consultations", "Lab work included"]'::jsonb,
 '[{"sku": "SIL-100-TAB", "qty": 8}, {"sku": "TAD-5-TAB", "qty": 30}]'::jsonb,
 false, 3),

-- Women's Health
('womensHealth', 'basic', 'Essential Care', 30.00, 'month', null,
 '["Birth control prescription", "UTI treatment", "Online consultations"]'::jsonb,
 '[]'::jsonb,
 false, 1),
 
('womensHealth', 'standard', 'Wellness Plus', 59.00, 'month', null,
 '["All prescriptions covered", "Hormone balancing", "Monthly consultations", "Priority support"]'::jsonb,
 '[]'::jsonb,
 true, 2),
 
('womensHealth', 'premium', 'Complete Care', 99.00, 'month', null,
 '["All medications", "Fertility support", "PCOS management", "Weekly consultations", "Lab work monitoring"]'::jsonb,
 '[]'::jsonb,
 false, 3),

-- Longevity
('longevity', 'basic', 'Foundation', 150.00, 'month', null,
 '["NAD+ supplements", "Basic vitamin stack", "Quarterly consultations"]'::jsonb,
 '[]'::jsonb,
 false, 1),
 
('longevity', 'standard', 'Optimization', 299.00, 'month', null,
 '["Complete supplement stack", "Metformin prescription", "Monthly consultations", "Biomarker tracking"]'::jsonb,
 '[{"sku": "MET-500-TAB", "qty": 60}]'::jsonb,
 true, 2),
 
('longevity', 'premium', 'Biohacker Elite', 599.00, 'month', null,
 '["All medications & peptides", "Rapamycin protocol", "Weekly consultations", "Genetic testing", "Full lab panel quarterly"]'::jsonb,
 '[]'::jsonb,
 false, 3),

-- TRT
('trt', 'basic', 'TRT Essential', 99.00, 'month', null,
 '["Testosterone cypionate", "Monthly consultations", "Basic lab work"]'::jsonb,
 '[]'::jsonb,
 false, 1),
 
('trt', 'standard', 'Optimized TRT', 159.00, 'month', null,
 '["Testosterone + HCG", "AI if needed", "Bi-weekly consultations", "Comprehensive labs"]'::jsonb,
 '[]'::jsonb,
 true, 2),
 
('trt', 'premium', 'Performance Protocol', 299.00, 'month', null,
 '["All hormone medications", "Peptide therapy", "Weekly consultations", "Monthly lab work", "Growth hormone support"]'::jsonb,
 '[]'::jsonb,
 false, 3);