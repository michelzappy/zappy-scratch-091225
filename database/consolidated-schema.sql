-- Consolidated Telehealth Platform Schema
-- Single file containing all tables, constraints, and indexes
-- Matches the Drizzle ORM models in backend/src/models/index.js

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables for clean setup
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS patient_measurements CASCADE;
DROP TABLE IF EXISTS consultation_messages CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS consultations CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS providers CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS medications CASCADE;
DROP TABLE IF EXISTS pharmacies CASCADE;
DROP TABLE IF EXISTS consultation_settings CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- Create ENUMs to match models
CREATE TYPE consultation_status AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'reviewed');
CREATE TYPE urgency AS ENUM ('regular', 'urgent', 'emergency');
CREATE TYPE prescription_status AS ENUM ('active', 'expired', 'cancelled', 'on_hold');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE fulfillment_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'returned');
CREATE TYPE sender_type AS ENUM ('patient', 'provider', 'admin');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Consultation Settings (pricing configuration)
CREATE TABLE consultation_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_fee DECIMAL(10,2) DEFAULT 0.00,
    require_credit_card BOOLEAN DEFAULT true,
    auto_charge_on_approval BOOLEAN DEFAULT true,
    refill_consultation_fee DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Patients table with all required fields
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20),
    
    -- Shipping address
    shipping_address TEXT,
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(2),
    shipping_zip VARCHAR(10),
    
    -- Medical info
    blood_type VARCHAR(10),
    allergies TEXT[],
    current_medications TEXT[],
    medical_conditions TEXT[],
    
    -- Payment info (Card-on-file)
    total_spent DECIMAL(10,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    stripe_customer_id VARCHAR(255),
    default_payment_method_id VARCHAR(255),
    has_valid_payment_method BOOLEAN DEFAULT false,
    
    -- Account status
    email_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    subscription_status VARCHAR(50) DEFAULT 'none', -- none, active, cancelled, paused
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_id VARCHAR(255),
    subscription_active BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP
);

-- Enhanced Providers table
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    title VARCHAR(20), -- Dr., NP, PA, etc.
    phone VARCHAR(20),
    license_number VARCHAR(100),
    license_state VARCHAR(2),
    npi_number VARCHAR(20),
    specialties TEXT[],
    
    -- Statistics
    total_consultations INTEGER DEFAULT 0,
    average_response_time_minutes INTEGER,
    rating DECIMAL(3,2),
    total_reviews INTEGER DEFAULT 0,
    
    -- Availability
    is_active BOOLEAN DEFAULT true,
    is_available BOOLEAN DEFAULT true,
    max_daily_consultations INTEGER DEFAULT 50,
    current_daily_consultations INTEGER DEFAULT 0,
    
    -- Profile
    profile_image_url TEXT,
    bio TEXT,
    years_experience INTEGER,
    education TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Admin users table
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin', -- admin, super_admin, support
    permissions JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Legacy admins table (for backward compatibility)
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
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
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Consultations table with intake data
CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id),
    
    -- Intake data
    consultation_type VARCHAR(100) NOT NULL,
    chief_complaint TEXT NOT NULL,
    symptoms TEXT[],
    symptom_duration VARCHAR(100),
    severity INTEGER CHECK (severity >= 1 AND severity <= 10),
    urgency urgency DEFAULT 'regular',
    photos_urls TEXT[],
    attachments JSONB,
    
    -- Complete intake form data (from health quiz)
    intake_data JSONB,
    
    -- Provider assessment
    diagnosis TEXT,
    treatment_plan TEXT,
    internal_notes TEXT,
    provider_notes TEXT,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending',
    queue_position INTEGER,
    estimated_wait_minutes INTEGER,
    
    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    plan_sent_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Conversion tracking
    medication_offered BOOLEAN DEFAULT false,
    medication_ordered BOOLEAN DEFAULT false,
    order_id UUID,
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    
    -- Pricing
    consultation_fee DECIMAL(10,2) DEFAULT 0,
    is_paid BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prescriptions table
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES providers(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    
    -- Medication details
    medication_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    dosage VARCHAR(100),
    quantity INTEGER,
    frequency VARCHAR(100),
    duration VARCHAR(100),
    instructions TEXT,
    refills INTEGER DEFAULT 0,
    refills_remaining INTEGER DEFAULT 0,
    
    -- Dates
    next_refill_date DATE,
    expiration_date DATE,
    last_filled_date DATE,
    
    -- Status
    status prescription_status DEFAULT 'active',
    is_controlled_substance BOOLEAN DEFAULT false,
    
    -- Pricing
    price DECIMAL(10,2),
    subscription_price DECIMAL(10,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory management
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    medication_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    strength VARCHAR(50),
    form VARCHAR(50),
    
    -- Stock levels
    quantity_on_hand INTEGER DEFAULT 0,
    quantity_reserved INTEGER DEFAULT 0,
    reorder_point INTEGER DEFAULT 10,
    reorder_quantity INTEGER DEFAULT 100,
    
    -- Pricing
    cost_per_unit DECIMAL(10,2),
    retail_price DECIMAL(10,2),
    subscription_price DECIMAL(10,2),
    
    -- Supplier info
    supplier_name VARCHAR(200),
    supplier_sku VARCHAR(100),
    lead_time_days INTEGER DEFAULT 7,
    
    -- Categories
    category VARCHAR(100),
    subcategory VARCHAR(100),
    tags TEXT[],
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE DEFAULT 'ORD-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    patient_id UUID NOT NULL REFERENCES patients(id),
    consultation_id UUID REFERENCES consultations(id),
    prescription_id UUID REFERENCES prescriptions(id),
    
    -- Totals
    subtotal DECIMAL(10,2),
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2),
    
    -- Payment
    payment_status payment_status DEFAULT 'pending',
    payment_method VARCHAR(50),
    stripe_payment_intent_id VARCHAR(255),
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Shipping
    shipping_address TEXT,
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(2),
    shipping_zip VARCHAR(10),
    shipping_method VARCHAR(50),
    
    -- Fulfillment
    fulfillment_status fulfillment_status DEFAULT 'pending',
    pharmacy_order_id VARCHAR(100),
    tracking_number VARCHAR(100),
    carrier VARCHAR(50),
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Subscription
    is_subscription BOOLEAN DEFAULT false,
    subscription_frequency VARCHAR(50),
    next_refill_date DATE,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order line items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES inventory(id),
    prescription_id UUID REFERENCES prescriptions(id),
    
    medication_name VARCHAR(255),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages between patient and provider
CREATE TABLE consultation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_type VARCHAR(20) NOT NULL,
    recipient_id UUID,
    
    message_type VARCHAR(50),
    content TEXT NOT NULL,
    attachments JSONB,
    
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    is_urgent BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patient health measurements tracking
CREATE TABLE patient_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Vital signs
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    bmi DECIMAL(4,2),
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    heart_rate INTEGER,
    temperature DECIMAL(4,1),
    oxygen_saturation INTEGER,
    
    -- Lab values
    glucose_level DECIMAL(5,2),
    cholesterol_total INTEGER,
    cholesterol_ldl INTEGER,
    cholesterol_hdl INTEGER,
    triglycerides INTEGER,
    
    measurement_date DATE NOT NULL,
    measurement_time TIME,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support tickets system
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(50) UNIQUE DEFAULT 'TKT-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    
    -- Requester
    requester_id UUID,
    requester_type VARCHAR(20), -- patient, provider, admin
    requester_email VARCHAR(255),
    
    -- Ticket details
    category VARCHAR(100),
    subject VARCHAR(255),
    description TEXT,
    priority ticket_priority DEFAULT 'medium',
    status ticket_status DEFAULT 'open',
    
    -- Assignment
    assigned_to UUID REFERENCES admin_users(id),
    assigned_at TIMESTAMP WITH TIME ZONE,
    
    -- Resolution
    resolution TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_time_hours INTEGER,
    satisfaction_rating INTEGER,
    
    -- Related entities
    related_consultation_id UUID REFERENCES consultations(id),
    related_order_id UUID REFERENCES orders(id),
    
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics events for tracking and reporting
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(100),
    event_action VARCHAR(100),
    event_label VARCHAR(255),
    event_value DECIMAL(10,2),
    
    -- User info
    user_id UUID,
    user_type VARCHAR(20),
    session_id VARCHAR(100),
    
    -- Context
    page_url TEXT,
    referrer_url TEXT,
    user_agent TEXT,
    ip_address INET,
    
    -- Additional data
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create all necessary indexes
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_subscription_tier ON patients(subscription_tier);
CREATE INDEX idx_patients_is_active ON patients(is_active);

CREATE INDEX idx_providers_email ON providers(email);
CREATE INDEX idx_providers_is_active ON providers(is_active);
CREATE INDEX idx_providers_is_available ON providers(is_available);

CREATE INDEX idx_consultations_patient_id ON consultations(patient_id);
CREATE INDEX idx_consultations_provider_id ON consultations(provider_id);
CREATE INDEX idx_consultations_status ON consultations(status);
CREATE INDEX idx_consultations_submitted_at ON consultations(submitted_at DESC);
CREATE INDEX idx_consultations_urgency ON consultations(urgency);

CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_consultation_id ON prescriptions(consultation_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);

CREATE INDEX idx_inventory_sku ON inventory(sku);
CREATE INDEX idx_inventory_medication_name ON inventory(medication_name);
CREATE INDEX idx_inventory_category ON inventory(category);
CREATE INDEX idx_inventory_is_active ON inventory(is_active);

CREATE INDEX idx_orders_patient_id ON orders(patient_id);
CREATE INDEX idx_orders_consultation_id ON orders(consultation_id);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_fulfillment_status ON orders(fulfillment_status);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_inventory_id ON order_items(inventory_id);

CREATE INDEX idx_messages_consultation_id ON consultation_messages(consultation_id);
CREATE INDEX idx_messages_is_read ON consultation_messages(is_read);
CREATE INDEX idx_messages_created_at ON consultation_messages(created_at DESC);

CREATE INDEX idx_measurements_patient_id ON patient_measurements(patient_id);
CREATE INDEX idx_measurements_date ON patient_measurements(measurement_date DESC);

CREATE INDEX idx_tickets_status ON support_tickets(status);
CREATE INDEX idx_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_tickets_assigned_to ON support_tickets(assigned_to);

CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at DESC);

-- Create update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update timestamp triggers
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pharmacies_updated_at BEFORE UPDATE ON pharmacies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultation_settings_updated_at BEFORE UPDATE ON consultation_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some basic consultation settings
INSERT INTO consultation_settings (consultation_fee, require_credit_card, auto_charge_on_approval, refill_consultation_fee) 
VALUES (0.00, false, false, 0.00);

-- Insert some basic medications for testing
INSERT INTO medications (name, generic_name, category, base_price, active, stock_quantity) VALUES
('Acetaminophen', 'Acetaminophen', 'Pain Relief', 5.99, true, 1000),
('Ibuprofen', 'Ibuprofen', 'Pain Relief', 7.99, true, 1000),
('Lisinopril', 'Lisinopril', 'Blood Pressure', 12.99, true, 500),
('Metformin', 'Metformin', 'Diabetes', 8.99, true, 800),
('Sertraline', 'Sertraline', 'Mental Health', 15.99, true, 600);

-- Insert some basic inventory items
INSERT INTO inventory (sku, medication_name, generic_name, strength, form, quantity_on_hand, retail_price, subscription_price, category) VALUES
('ACE-500-TAB', 'Acetaminophen', 'Acetaminophen', '500mg', 'tablet', 1000, 5.99, 4.99, 'Pain Relief'),
('IBU-200-TAB', 'Ibuprofen', 'Ibuprofen', '200mg', 'tablet', 1000, 7.99, 6.99, 'Pain Relief'),
('LIS-10-TAB', 'Lisinopril', 'Lisinopril', '10mg', 'tablet', 500, 12.99, 10.99, 'Blood Pressure'),
('MET-500-TAB', 'Metformin', 'Metformin', '500mg', 'tablet', 800, 8.99, 7.99, 'Diabetes'),
('SER-50-TAB', 'Sertraline', 'Sertraline', '50mg', 'tablet', 600, 15.99, 13.99, 'Mental Health');

\echo 'Consolidated schema applied successfully!';
\echo 'All tables created with proper constraints and indexes.';
\echo 'Basic test data inserted for medications and inventory.';
