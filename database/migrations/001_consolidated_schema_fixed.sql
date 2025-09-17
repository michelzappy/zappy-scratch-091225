-- DTC Telehealth Platform - Consolidated Database Schema
-- Version: 1.0.0
-- Date: December 2024
-- Model: Free Consultation with Card-on-File (like Hims/Ro)

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS prescription_items CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS consultations CASCADE;
DROP TABLE IF EXISTS provider_availability CASCADE;
DROP TABLE IF EXISTS providers CASCADE;
DROP TABLE IF EXISTS patient_documents CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS medications CASCADE;
DROP TABLE IF EXISTS pharmacies CASCADE;
DROP TABLE IF EXISTS consultation_settings CASCADE;

-- ============================================
-- CORE TABLES
-- ============================================

-- Consultation Settings (pricing configuration)
CREATE TABLE consultation_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_fee DECIMAL(10,2) DEFAULT 0.00, -- Can be $0 for free consultation
    require_credit_card BOOLEAN DEFAULT true,    -- Card-on-file requirement
    auto_charge_on_approval BOOLEAN DEFAULT true,
    refill_consultation_fee DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patients table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE NOT NULL,
    
    -- Address info
    shipping_address TEXT,
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(2),
    shipping_zip VARCHAR(10),
    
    -- Medical info
    allergies TEXT[],
    current_medications TEXT[],
    medical_conditions TEXT[],
    
    -- Payment info (Card-on-file)
    stripe_customer_id VARCHAR(255),
    default_payment_method_id VARCHAR(255),
    has_valid_payment_method BOOLEAN DEFAULT false,
    
    -- Account status
    email_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    subscription_status VARCHAR(50) DEFAULT 'none', -- none, active, cancelled, paused
    subscription_id VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Providers table
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    
    -- Professional info
    license_number VARCHAR(100) NOT NULL,
    npi_number VARCHAR(20) UNIQUE,
    dea_number VARCHAR(20),
    specialties TEXT[],
    states_licensed TEXT[] NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, active, inactive, suspended
    email_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    
    -- Availability
    available_for_consultations BOOLEAN DEFAULT true,
    consultation_capacity INT DEFAULT 20, -- Max consultations per day
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Admins table
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    
    -- Role & permissions
    role VARCHAR(50) DEFAULT 'admin', -- admin, super_admin, support
    permissions JSONB DEFAULT '{}',
    
    -- Security
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, suspended
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- ============================================
-- MEDICATIONS & PHARMACY
-- ============================================

-- Medications catalog
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    brand_name VARCHAR(255),
    category VARCHAR(100), -- ED, Hair Loss, Weight Loss, etc.
    
    -- Dosage options
    available_dosages JSONB, -- [{strength: "20mg", form: "tablet"}]
    
    -- Pricing
    base_price DECIMAL(10,2),
    subscription_discount DECIMAL(3,2) DEFAULT 0.15, -- 15% off for subscriptions
    
    -- Regulatory
    requires_prescription BOOLEAN DEFAULT true,
    controlled_substance BOOLEAN DEFAULT false,
    dea_schedule VARCHAR(10),
    
    -- Status
    active BOOLEAN DEFAULT true,
    stock_quantity INT DEFAULT 1000,
    
    -- Metadata
    description TEXT,
    side_effects TEXT[],
    contraindications TEXT[],
    image_url VARCHAR(500),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pharmacies (for fulfillment)
CREATE TABLE pharmacies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    api_endpoint VARCHAR(500),
    api_key_encrypted TEXT, -- Encrypted API credentials
    
    -- Contact info
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(255),
    
    -- Capabilities
    supported_medications TEXT[],
    states_serviced TEXT[],
    
    -- Status
    active BOOLEAN DEFAULT true,
    preferred BOOLEAN DEFAULT false, -- Preferred pharmacy partner
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CONSULTATIONS & PRESCRIPTIONS
-- ============================================

-- Consultations table
CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
    
    -- Consultation details
    chief_complaint TEXT NOT NULL,
    symptoms TEXT[],
    symptom_duration VARCHAR(100),
    severity VARCHAR(50), -- mild, moderate, severe
    
    -- Medical assessment
    provider_notes TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    
    -- Status workflow
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_review, approved, denied, completed
    reviewed_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Payment
    consultation_fee DECIMAL(10,2) DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, charged, failed, refunded
    payment_intent_id VARCHAR(255), -- Stripe payment intent
    charged_at TIMESTAMP,
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prescriptions table
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
    
    -- Prescription details
    rx_number VARCHAR(100) UNIQUE,
    status VARCHAR(50) DEFAULT 'active', -- active, filled, cancelled, expired
    
    -- Validity
    issued_date DATE DEFAULT CURRENT_DATE,
    expires_date DATE DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
    refills_authorized INT DEFAULT 0,
    refills_remaining INT DEFAULT 0,
    
    -- Pharmacy fulfillment
    pharmacy_id UUID REFERENCES pharmacies(id),
    pharmacy_order_id VARCHAR(255), -- External pharmacy order ID
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prescription items (medications in prescription)
CREATE TABLE prescription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medication_id UUID NOT NULL REFERENCES medications(id),
    
    -- Dosage info
    dosage VARCHAR(100) NOT NULL, -- "20mg"
    quantity INT NOT NULL,
    frequency VARCHAR(100), -- "Once daily"
    duration VARCHAR(100), -- "30 days"
    instructions TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ORDERS & PAYMENTS
-- ============================================

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    consultation_id UUID REFERENCES consultations(id),
    prescription_id UUID REFERENCES prescriptions(id),
    
    -- Order details
    order_number VARCHAR(100) UNIQUE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
    
    -- Subscription info
    is_subscription BOOLEAN DEFAULT false,
    subscription_id VARCHAR(255), -- Stripe subscription ID
    subscription_interval VARCHAR(50), -- monthly, quarterly
    
    -- Pricing
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    shipping_amount DECIMAL(10,2) DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Payment
    payment_method_id VARCHAR(255),
    payment_intent_id VARCHAR(255),
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, refunded
    paid_at TIMESTAMP,
    
    -- Shipping
    shipping_address TEXT,
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(2),
    shipping_zip VARCHAR(10),
    tracking_number VARCHAR(255),
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    
    -- Pharmacy fulfillment
    pharmacy_id UUID REFERENCES pharmacies(id),
    pharmacy_order_id VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    medication_id UUID NOT NULL REFERENCES medications(id),
    
    -- Item details
    medication_name VARCHAR(255),
    dosage VARCHAR(100),
    quantity INT NOT NULL,
    
    -- Pricing
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- COMMUNICATION
-- ============================================

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_type VARCHAR(50) NOT NULL, -- patient, provider, system
    
    -- Message content
    content TEXT NOT NULL,
    attachment_url VARCHAR(500),
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patient documents (medical records, IDs, etc.)
CREATE TABLE patient_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    consultation_id UUID REFERENCES consultations(id),
    
    -- Document info
    document_type VARCHAR(100), -- id, insurance_card, medical_record, lab_result
    file_name VARCHAR(255),
    file_url VARCHAR(500),
    file_size INT,
    mime_type VARCHAR(100),
    
    -- Verification
    verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES providers(id),
    verified_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CREATE INDEXES
-- ============================================

-- Patients indexes
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_stripe ON patients(stripe_customer_id);

-- Providers indexes
CREATE INDEX idx_providers_email ON providers(email);
CREATE INDEX idx_providers_status ON providers(status);
CREATE INDEX idx_providers_availability ON providers(available_for_consultations);

-- Admins indexes
CREATE INDEX idx_admins_email ON admins(email);

-- Medications indexes
CREATE INDEX idx_medications_category ON medications(category);
CREATE INDEX idx_medications_active ON medications(active);

-- Pharmacies indexes
CREATE INDEX idx_pharmacies_active ON pharmacies(active);

-- Consultations indexes
CREATE INDEX idx_consultations_patient ON consultations(patient_id);
CREATE INDEX idx_consultations_provider ON consultations(provider_id);
CREATE INDEX idx_consultations_status ON consultations(status);
CREATE INDEX idx_consultations_created ON consultations(created_at DESC);

-- Prescriptions indexes
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_prescriptions_expires ON prescriptions(expires_date);

-- Prescription items indexes
CREATE INDEX idx_prescription_items_prescription ON prescription_items(prescription_id);

-- Orders indexes
CREATE INDEX idx_orders_patient ON orders(patient_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Order items indexes
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Messages indexes
CREATE INDEX idx_messages_consultation ON messages(consultation_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- Documents indexes
CREATE INDEX idx_documents_patient ON patient_documents(patient_id);
CREATE INDEX idx_documents_type ON patient_documents(document_type);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to all tables with updated_at
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate RX number function
CREATE OR REPLACE FUNCTION generate_rx_number()
RETURNS VARCHAR AS $$
DECLARE
    rx_num VARCHAR;
BEGIN
    rx_num := 'RX' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || 
              LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN rx_num;
END;
$$ LANGUAGE plpgsql;

-- Generate order number function
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR AS $$
DECLARE
    order_num VARCHAR;
BEGIN
    order_num := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || 
                 LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE consultation_settings IS 'Global settings for consultation pricing and requirements';
COMMENT ON COLUMN consultation_settings.consultation_fee IS 'Fee for initial consultation (can be $0 for free)';
COMMENT ON COLUMN consultation_settings.require_credit_card IS 'Whether to require card on file for free consultations';

COMMENT ON TABLE patients IS 'Patient users of the telehealth platform';
COMMENT ON COLUMN patients.stripe_customer_id IS 'Stripe customer ID for card-on-file payments';
COMMENT ON COLUMN patients.has_valid_payment_method IS 'Whether patient has valid card on file';

COMMENT ON TABLE consultations IS 'Medical consultations between patients and providers';
COMMENT ON COLUMN consultations.payment_status IS 'Payment status - charges occur after approval if consultation fee > 0';

COMMENT ON TABLE prescriptions IS 'Medical prescriptions issued by providers';
COMMENT ON TABLE orders IS 'Medication orders for fulfillment';
COMMENT ON TABLE pharmacies IS 'Partner pharmacies for medication fulfillment';