-- Apply Telehealth Platform Schema
-- Run this after database reset to create all tables
-- Source: database/migrations/001_consolidated_schema_fixed.sql

-- Enable extensions (should already be enabled from reset)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
    subscription_status VARCHAR(50) DEFAULT 'none',
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
    status VARCHAR(50) DEFAULT 'pending',
    email_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    
    -- Availability
    available_for_consultations BOOLEAN DEFAULT true,
    consultation_capacity INT DEFAULT 20,
    
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
    role VARCHAR(50) DEFAULT 'admin',
    permissions JSONB DEFAULT '{}',
    
    -- Security
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Medications catalog
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    brand_name VARCHAR(255),
    category VARCHAR(100),
    
    -- Dosage options
    available_dosages JSONB,
    
    -- Pricing
    base_price DECIMAL(10,2),
    subscription_discount DECIMAL(3,2) DEFAULT 0.15,
    
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

-- Pharmacies
CREATE TABLE pharmacies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    api_endpoint VARCHAR(500),
    api_key_encrypted TEXT,
    
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
    preferred BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Consultations table
CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
    
    -- Consultation details
    chief_complaint TEXT NOT NULL,
    symptoms TEXT[],
    symptom_duration VARCHAR(100),
    severity VARCHAR(50),
    
    -- Medical assessment
    provider_notes TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    
    -- Status workflow
    status VARCHAR(50) DEFAULT 'pending',
    reviewed_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Payment
    consultation_fee DECIMAL(10,2) DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_intent_id VARCHAR(255),
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
    status VARCHAR(50) DEFAULT 'active',
    
    -- Validity
    issued_date DATE DEFAULT CURRENT_DATE,
    expires_date DATE DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
    refills_authorized INT DEFAULT 0,
    refills_remaining INT DEFAULT 0,
    
    -- Pharmacy fulfillment
    pharmacy_id UUID REFERENCES pharmacies(id),
    pharmacy_order_id VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prescription items
CREATE TABLE prescription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medication_id UUID NOT NULL REFERENCES medications(id),
    
    -- Dosage info
    dosage VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    frequency VARCHAR(100),
    duration VARCHAR(100),
    instructions TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    consultation_id UUID REFERENCES consultations(id),
    prescription_id UUID REFERENCES prescriptions(id),
    
    -- Order details
    order_number VARCHAR(100) UNIQUE,
    status VARCHAR(50) DEFAULT 'pending',
    
    -- Subscription info
    is_subscription BOOLEAN DEFAULT false,
    subscription_id VARCHAR(255),
    subscription_interval VARCHAR(50),
    
    -- Pricing
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    shipping_amount DECIMAL(10,2) DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Payment
    payment_method_id VARCHAR(255),
    payment_intent_id VARCHAR(255),
    payment_status VARCHAR(50) DEFAULT 'pending',
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

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_type VARCHAR(50) NOT NULL,
    
    -- Message content
    content TEXT NOT NULL,
    attachment_url VARCHAR(500),
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patient documents
CREATE TABLE patient_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    consultation_id UUID REFERENCES consultations(id),
    
    -- Document info
    document_type VARCHAR(100),
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

-- Create indexes
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_providers_email ON providers(email);
CREATE INDEX idx_consultations_patient ON consultations(patient_id);
CREATE INDEX idx_consultations_status ON consultations(status);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_orders_patient ON orders(patient_id);
CREATE INDEX idx_messages_consultation ON messages(consultation_id);

-- Create update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

\echo 'Schema applied successfully!';