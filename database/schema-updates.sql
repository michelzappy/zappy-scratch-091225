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
