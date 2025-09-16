-- Database Schema Updates for New Features
-- This file contains updates to support:
-- 1. Subscription plan selection from patient intake
-- 2. Multiple protocol selections by providers
-- 3. Treatment protocol management

-- Add subscription plan fields to patients table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50), -- monthly, quarterly, annual
ADD COLUMN IF NOT EXISTS subscription_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS subscription_billing_frequency VARCHAR(50); -- monthly, quarterly, annual

-- Add fields to track intake form completion
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS intake_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS intake_completed_at TIMESTAMP WITH TIME ZONE;

-- Update consultations table to support multiple protocols
ALTER TABLE consultations
ADD COLUMN IF NOT EXISTS selected_protocols TEXT[], -- array of protocol keys
ADD COLUMN IF NOT EXISTS protocol_medications JSONB; -- combined medications from protocols

-- Create treatment protocols table for admin management
CREATE TABLE IF NOT EXISTS treatment_protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    condition VARCHAR(100) NOT NULL, -- acne, ed, hairLoss, weightLoss, etc.
    protocol_key VARCHAR(100) NOT NULL, -- mild, moderate, severe, etc.
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration VARCHAR(100),
    follow_up VARCHAR(100),
    total_cost DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(condition, protocol_key)
);

-- Create protocol medications junction table
CREATE TABLE IF NOT EXISTS protocol_medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    protocol_id UUID NOT NULL REFERENCES treatment_protocols(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    medication_name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2),
    quantity INTEGER DEFAULT 1,
    instructions TEXT,
    refills INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update prescriptions table to link to protocols
ALTER TABLE prescriptions
ADD COLUMN IF NOT EXISTS protocol_id UUID REFERENCES treatment_protocols(id),
ADD COLUMN IF NOT EXISTS sku VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_protocol_based BOOLEAN DEFAULT false;

-- Update orders table for subscription management
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50), -- monthly, quarterly, annual
ADD COLUMN IF NOT EXISTS subscription_cycle_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS subscription_parent_order_id UUID REFERENCES orders(id);

-- Create subscription management table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    condition VARCHAR(100) NOT NULL,
    plan_type VARCHAR(50) NOT NULL, -- monthly, quarterly, annual
    status VARCHAR(50) DEFAULT 'active', -- active, paused, cancelled, expired
    
    -- Pricing
    base_price DECIMAL(10,2),
    discount_percentage INTEGER DEFAULT 0,
    final_price DECIMAL(10,2),
    
    -- Billing
    billing_frequency VARCHAR(50), -- monthly, quarterly, annual
    next_billing_date DATE,
    last_billing_date DATE,
    billing_cycles_completed INTEGER DEFAULT 0,
    
    -- Medications
    protocols TEXT[], -- array of protocol keys
    medications JSONB, -- detailed medication list
    
    -- Stripe
    stripe_subscription_id VARCHAR(255),
    stripe_price_id VARCHAR(255),
    
    -- Dates
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paused_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default treatment protocols based on our frontend data
INSERT INTO treatment_protocols (condition, protocol_key, name, description, duration, follow_up, total_cost) VALUES
-- Acne protocols
('acne', 'mild', 'Mild Acne Protocol', 'For occasional breakouts and blackheads', '8-12 weeks', '6 weeks', 84),
('acne', 'moderate', 'Moderate Acne Protocol', 'For persistent inflammatory acne', '12-16 weeks', '4 weeks', 149),
('acne', 'severe', 'Severe Acne Protocol', 'For cystic or nodular acne', '16-24 weeks', '4 weeks', 178),
('acne', 'hormonal', 'Hormonal Acne Protocol', 'For adult female hormonal acne', 'Ongoing', '8 weeks', 139),

-- ED protocols
('ed', 'trial', 'ED Trial Pack', 'Try different medications to find what works', '1 month trial', '4 weeks', 120),
('ed', 'standard', 'ED Standard Supply', 'Most popular option for regular use', 'Monthly refills', '3 months', 180),
('ed', 'daily', 'Daily ED Treatment', 'Daily medication for spontaneity', 'Monthly refills', '3 months', 750),
('ed', 'combination', 'ED Combination Therapy', 'For treatment-resistant cases', 'Monthly refills', '6 weeks', 870),

-- Hair Loss protocols
('hairLoss', 'prevention', 'Hair Loss Prevention', 'Early intervention for thinning hair', 'Ongoing', '6 months', 25),
('hairLoss', 'standard', 'Hair Loss Standard', 'Comprehensive hair regrowth protocol', 'Ongoing', '3 months', 54),
('hairLoss', 'aggressive', 'Hair Loss Aggressive', 'Maximum strength protocol', 'Ongoing', '3 months', 120),
('hairLoss', 'postpartum', 'Postpartum Hair Loss', 'Safe for breastfeeding mothers', '6 months', '2 months', 52),

-- Weight Loss protocols
('weightLoss', 'starter', 'Weight Loss Starter', 'Begin with lifestyle modification support', '3 months', '4 weeks', 80),
('weightLoss', 'standard', 'Weight Loss Standard', 'Appetite suppressant therapy', '3 months max', '2 weeks', 89),
('weightLoss', 'glp1', 'GLP-1 Weight Loss', 'Latest injectable weight loss medication', 'Ongoing', 'Monthly', 299),
('weightLoss', 'combination', 'Weight Loss Combination', 'Multi-modal approach for significant weight loss', '3-6 months', '2 weeks', 169),
('weightLoss', 'maintenance', 'Weight Maintenance', 'Long-term weight management', 'Ongoing', '3 months', 95);

-- Create indexes for new fields
CREATE INDEX idx_patients_subscription_plan ON patients(subscription_plan);
CREATE INDEX idx_patients_intake_completed ON patients(intake_completed);
CREATE INDEX idx_consultations_protocols ON consultations USING GIN(selected_protocols);
CREATE INDEX idx_protocols_condition ON treatment_protocols(condition);
CREATE INDEX idx_protocol_medications_protocol ON protocol_medications(protocol_id);
CREATE INDEX idx_subscriptions_patient ON subscriptions(patient_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date);

-- Update the inventory table to include more protocol medications if needed
INSERT INTO inventory (sku, medication_name, generic_name, strength, form, quantity_on_hand, cost_per_unit, retail_price, subscription_price, category) VALUES
-- Additional acne medications
('BPO-25-GEL', 'Benzoyl Peroxide Gel', 'Benzoyl Peroxide', '2.5%', 'gel', 200, 3.00, 25.00, 20.00, 'Dermatology'),
('BPO-5-GEL', 'Benzoyl Peroxide Gel', 'Benzoyl Peroxide', '5%', 'gel', 200, 3.50, 29.00, 24.00, 'Dermatology'),
('CLN-1-SOL', 'Clindamycin Solution', 'Clindamycin', '1%', 'solution', 150, 4.00, 35.00, 30.00, 'Dermatology'),
('SPR-100-TAB', 'Spironolactone', 'Spironolactone', '100mg', 'tablet', 300, 0.60, 35.00, 30.00, 'Hormonal'),
('AZA-15-CR', 'Azelaic Acid Cream', 'Azelaic Acid', '15%', 'cream', 100, 5.00, 45.00, 40.00, 'Dermatology'),

-- Additional ED medications
('TAD-5-TAB', 'Tadalafil', 'Tadalafil', '5mg', 'tablet', 400, 3.00, 25.00, 20.00, 'Mens Health'),
('TAD-10-TAB', 'Tadalafil', 'Tadalafil', '10mg', 'tablet', 400, 4.00, 15.00, 12.00, 'Mens Health'),

-- Additional hair loss medications
('MIN-5-FOA', 'Minoxidil Foam', 'Minoxidil', '5%', 'foam', 150, 6.00, 35.00, 30.00, 'Hair Loss'),
('KET-2-SH', 'Ketoconazole Shampoo', 'Ketoconazole', '2%', 'shampoo', 100, 4.00, 35.00, 30.00, 'Hair Loss'),
('BIO-10K', 'Biotin', 'Biotin', '10000mcg', 'tablet', 500, 0.20, 15.00, 12.00, 'Supplements'),

-- Additional weight loss medications
('PHE-375-TAB', 'Phentermine', 'Phentermine', '37.5mg', 'tablet', 200, 2.00, 89.00, 79.00, 'Weight Loss'),
('ORL-60-CAP', 'Orlistat', 'Orlistat', '60mg', 'capsule', 300, 1.00, 45.00, 40.00, 'Weight Loss'),
('TOP-25-TAB', 'Topiramate', 'Topiramate', '25mg', 'tablet', 400, 0.80, 45.00, 40.00, 'Weight Loss'),
('NAL-50-TAB', 'Naltrexone', 'Naltrexone', '50mg', 'tablet', 200, 1.50, 55.00, 50.00, 'Weight Loss'),

-- Additional medications for other conditions
('MET-1000-TAB', 'Metformin', 'Metformin', '1000mg', 'tablet', 600, 0.40, 40.00, 35.00, 'Diabetes'),
('HYD-25-TAB', 'Hydroxyzine', 'Hydroxyzine', '25mg', 'tablet', 400, 0.50, 35.00, 30.00, 'Anxiety'),
('PRO-20-TAB', 'Propranolol', 'Propranolol', '20mg', 'tablet', 500, 0.30, 25.00, 20.00, 'Anxiety'),
('PRO-40-TAB', 'Propranolol', 'Propranolol', '40mg', 'tablet', 500, 0.40, 30.00, 25.00, 'Anxiety'),
('SER-50-TAB', 'Sertraline', 'Sertraline', '50mg', 'tablet', 400, 0.60, 45.00, 40.00, 'Depression'),
('SER-100-TAB', 'Sertraline', 'Sertraline', '100mg', 'tablet', 400, 0.80, 50.00, 45.00, 'Depression'),
('ESC-10-TAB', 'Escitalopram', 'Escitalopram', '10mg', 'tablet', 400, 0.70, 40.00, 35.00, 'Depression'),
('BUP-150-TAB', 'Bupropion XL', 'Bupropion', '150mg', 'tablet', 300, 0.90, 55.00, 50.00, 'Depression')
ON CONFLICT (sku) DO NOTHING;

-- Grant permissions if needed (adjust based on your database users)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
