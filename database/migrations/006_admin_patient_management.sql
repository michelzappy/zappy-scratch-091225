-- Migration: Admin Patient Management Tables
-- Created: 2025-01-13
-- Purpose: Support enhanced admin patient management features

-- Admin Actions Audit Trail
CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL, -- 'patient', 'subscription', 'order', etc.
    target_id UUID NOT NULL,
    action_details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);

-- Billing Adjustments
CREATE TABLE IF NOT EXISTS billing_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'refund', 'discount')),
    amount DECIMAL(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    order_id UUID,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE CASCADE
);

-- Treatment Plan Overrides
CREATE TABLE IF NOT EXISTS treatment_plan_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    plan_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    modifications JSONB DEFAULT '{}',
    reason TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES treatment_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

-- Clinical Notes
CREATE TABLE IF NOT EXISTS clinical_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    consultation_id UUID,
    type VARCHAR(20) NOT NULL CHECK (type IN ('soap', 'progress', 'admin', 'internal')),
    subjective TEXT,
    objective TEXT,
    assessment TEXT,
    plan TEXT,
    content TEXT, -- For non-SOAP notes
    is_locked BOOLEAN DEFAULT false,
    locked_at TIMESTAMP WITH TIME ZONE,
    locked_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE SET NULL,
    FOREIGN KEY (locked_by) REFERENCES providers(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES providers(id) ON DELETE SET NULL
);

-- Patient Flags
CREATE TABLE IF NOT EXISTS patient_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    flag_type VARCHAR(50) NOT NULL CHECK (flag_type IN ('high_risk', 'vip', 'collections', 'fraud_risk', 'compliance')),
    reason TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    removed_at TIMESTAMP WITH TIME ZONE,
    removed_by UUID,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE CASCADE,
    FOREIGN KEY (removed_by) REFERENCES admins(id) ON DELETE SET NULL
);

-- Patient Subscriptions (if not exists)
CREATE TABLE IF NOT EXISTS patient_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    plan_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    cancel_reason TEXT,
    cancel_at_period_end BOOLEAN DEFAULT false,
    paused_at TIMESTAMP WITH TIME ZONE,
    resume_date TIMESTAMP WITH TIME ZONE,
    stripe_customer_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Subscription Events
CREATE TABLE IF NOT EXISTS subscription_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    plan_id VARCHAR(100),
    stripe_subscription_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Subscription Payments
CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_invoice_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255),
    patient_id UUID,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL
);

-- Add account_credit column to patients if not exists
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS account_credit DECIMAL(10, 2) DEFAULT 0.00;

-- Add refund columns to orders if not exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS refund_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS refund_reason TEXT;

-- Add treatment override column to consultations if not exists
ALTER TABLE consultations
ADD COLUMN IF NOT EXISTS treatment_override_id UUID,
ADD CONSTRAINT fk_treatment_override 
    FOREIGN KEY (treatment_override_id) 
    REFERENCES treatment_plan_overrides(id) 
    ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON admin_actions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at);

CREATE INDEX IF NOT EXISTS idx_billing_adjustments_patient_id ON billing_adjustments(patient_id);
CREATE INDEX IF NOT EXISTS idx_billing_adjustments_order_id ON billing_adjustments(order_id);

CREATE INDEX IF NOT EXISTS idx_treatment_overrides_patient_id ON treatment_plan_overrides(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_overrides_plan_id ON treatment_plan_overrides(plan_id);

CREATE INDEX IF NOT EXISTS idx_clinical_notes_patient_id ON clinical_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_provider_id ON clinical_notes(provider_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_consultation_id ON clinical_notes(consultation_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_created_at ON clinical_notes(created_at);

CREATE INDEX IF NOT EXISTS idx_patient_flags_patient_id ON patient_flags(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_flags_active ON patient_flags(patient_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_patient_subscriptions_patient_id ON patient_subscriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_subscriptions_stripe_id ON patient_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_patient_subscriptions_status ON patient_subscriptions(status);

-- Grant permissions
GRANT ALL ON admin_actions TO zappy_admin;
GRANT ALL ON billing_adjustments TO zappy_admin;
GRANT ALL ON treatment_plan_overrides TO zappy_admin;
GRANT ALL ON clinical_notes TO zappy_admin;
GRANT ALL ON patient_flags TO zappy_admin;
GRANT ALL ON patient_subscriptions TO zappy_admin;
GRANT ALL ON subscription_events TO zappy_admin;
GRANT ALL ON subscription_payments TO zappy_admin;

-- Comments for documentation
COMMENT ON TABLE admin_actions IS 'Audit trail for all admin actions on patient records';
COMMENT ON TABLE billing_adjustments IS 'Track credits, refunds, and discounts applied to patient accounts';
COMMENT ON TABLE treatment_plan_overrides IS 'Provider/admin overrides to standard treatment plans';
COMMENT ON TABLE clinical_notes IS 'Clinical documentation including SOAP notes and progress notes';
COMMENT ON TABLE patient_flags IS 'Risk flags and special status indicators for patients';
COMMENT ON TABLE patient_subscriptions IS 'Patient subscription details synced with Stripe';
