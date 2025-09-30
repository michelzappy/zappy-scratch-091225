-- Phase 1: Critical Safety & Compliance Database Schema Updates
-- Adds essential fields and tables for clinical workflow, safety, and HIPAA compliance

-- Add new columns to consultations table for Phase 1
ALTER TABLE consultations 
  ADD COLUMN IF NOT EXISTS clinical_risk_level VARCHAR(20) DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS triage_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS red_flag_indicators TEXT[],
  ADD COLUMN IF NOT EXISTS requires_synchronous_visit BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES providers(id),
  ADD COLUMN IF NOT EXISTS supervisor_approval_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS clinical_decision_rationale TEXT,
  ADD COLUMN IF NOT EXISTS differential_diagnosis JSONB,
  ADD COLUMN IF NOT EXISTS consent_recorded_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS patient_language_preference VARCHAR(10) DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS sla_violation_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS response_time_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS escalation_reason TEXT,
  ADD COLUMN IF NOT EXISTS safety_checks_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS drug_interaction_checked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS allergy_checked BOOLEAN DEFAULT false;

-- Create consultation state history table for workflow audit trail
CREATE TABLE IF NOT EXISTS consultation_state_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    from_state VARCHAR(50),
    to_state VARCHAR(50) NOT NULL,
    changed_by UUID NOT NULL,
    changed_by_role VARCHAR(20) NOT NULL,
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clinical decision support logs table
CREATE TABLE IF NOT EXISTS clinical_decision_support_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES providers(id),
    decision_type VARCHAR(100) NOT NULL, -- 'medication', 'diagnosis', 'referral', 'follow_up'
    ai_recommendation JSONB,
    provider_decision JSONB,
    deviation_reason TEXT,
    patient_safety_checked BOOLEAN DEFAULT false,
    drug_interaction_checked BOOLEAN DEFAULT false,
    allergy_checked BOOLEAN DEFAULT false,
    safety_check_results JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create consultation quality metrics table
CREATE TABLE IF NOT EXISTS consultation_quality_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    time_to_first_response_minutes INTEGER,
    time_to_completion_minutes INTEGER,
    provider_satisfaction_score INTEGER CHECK (provider_satisfaction_score >= 1 AND provider_satisfaction_score <= 5),
    patient_satisfaction_score INTEGER CHECK (patient_satisfaction_score >= 1 AND patient_satisfaction_score <= 5),
    clinical_completeness_score INTEGER CHECK (clinical_completeness_score >= 0 AND clinical_completeness_score <= 100),
    peer_review_score INTEGER CHECK (peer_review_score >= 0 AND peer_review_score <= 100),
    documentation_quality_score INTEGER CHECK (documentation_quality_score >= 0 AND documentation_quality_score <= 100),
    sla_compliance BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create HIPAA audit log table for comprehensive access tracking
CREATE TABLE IF NOT EXISTS hipaa_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_role VARCHAR(50),
    action VARCHAR(50) NOT NULL, -- 'READ', 'WRITE', 'UPDATE', 'DELETE', 'EXPORT', 'PRINT'
    resource_type VARCHAR(100) NOT NULL, -- 'consultation', 'patient', 'prescription', etc.
    resource_id UUID,
    patient_id UUID REFERENCES patients(id), -- Track which patient's data was accessed
    endpoint VARCHAR(255),
    method VARCHAR(10), -- HTTP method
    status_code INTEGER,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    access_justification TEXT,
    emergency_access BOOLEAN DEFAULT false,
    data_accessed BOOLEAN DEFAULT false,
    phi_fields_accessed TEXT[], -- List of PHI fields accessed
    response_time_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create SLA violations tracking table
CREATE TABLE IF NOT EXISTS sla_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    urgency_level VARCHAR(20) NOT NULL,
    sla_threshold_minutes INTEGER NOT NULL,
    actual_response_time_minutes INTEGER NOT NULL,
    violation_minutes INTEGER NOT NULL,
    notified_at TIMESTAMP WITH TIME ZONE,
    supervisor_id UUID REFERENCES providers(id),
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_consultations_clinical_risk ON consultations(clinical_risk_level);
CREATE INDEX IF NOT EXISTS idx_consultations_triage_score ON consultations(triage_score DESC) WHERE triage_score > 0;
CREATE INDEX IF NOT EXISTS idx_consultations_sla_violation ON consultations(sla_violation_at) WHERE sla_violation_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consultations_safety_checks ON consultations(safety_checks_completed);
CREATE INDEX IF NOT EXISTS idx_state_history_consultation ON consultation_state_history(consultation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_state_history_changed_by ON consultation_state_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_clinical_decision_logs_consultation ON clinical_decision_support_logs(consultation_id);
CREATE INDEX IF NOT EXISTS idx_clinical_decision_logs_provider ON clinical_decision_support_logs(provider_id);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_consultation ON consultation_quality_metrics(consultation_id);
CREATE INDEX IF NOT EXISTS idx_hipaa_audit_user ON hipaa_audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hipaa_audit_patient ON hipaa_audit_logs(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hipaa_audit_resource ON hipaa_audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_hipaa_audit_emergency ON hipaa_audit_logs(emergency_access) WHERE emergency_access = true;
CREATE INDEX IF NOT EXISTS idx_hipaa_audit_timestamp ON hipaa_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sla_violations_consultation ON sla_violations(consultation_id);
CREATE INDEX IF NOT EXISTS idx_sla_violations_unresolved ON sla_violations(resolved_at) WHERE resolved_at IS NULL;

-- Update trigger for quality metrics
CREATE OR REPLACE FUNCTION update_quality_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quality_metrics_timestamp
    BEFORE UPDATE ON consultation_quality_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_quality_metrics_updated_at();

-- Function to automatically log state transitions
CREATE OR REPLACE FUNCTION log_consultation_state_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO consultation_state_history (
            consultation_id,
            from_state,
            to_state,
            changed_by,
            changed_by_role,
            metadata,
            created_at
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            COALESCE(NEW.provider_id, NEW.patient_id),
            CASE 
                WHEN NEW.provider_id IS NOT NULL THEN 'provider'
                WHEN NEW.patient_id IS NOT NULL THEN 'patient'
                ELSE 'system'
            END,
            jsonb_build_object(
                'clinical_risk_level', NEW.clinical_risk_level,
                'triage_score', NEW.triage_score,
                'requires_synchronous_visit', NEW.requires_synchronous_visit
            ),
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER consultation_state_change_trigger
    AFTER UPDATE ON consultations
    FOR EACH ROW
    EXECUTE FUNCTION log_consultation_state_change();

-- Add comments for documentation
COMMENT ON TABLE consultation_state_history IS 'Audit trail of all consultation workflow state transitions';
COMMENT ON TABLE clinical_decision_support_logs IS 'Logs provider clinical decisions and AI recommendations for quality review';
COMMENT ON TABLE consultation_quality_metrics IS 'Tracks quality metrics and SLA compliance for consultations';
COMMENT ON TABLE hipaa_audit_logs IS 'Comprehensive HIPAA-compliant audit log of all PHI access';
COMMENT ON TABLE sla_violations IS 'Tracks SLA violations for monitoring and improvement';

COMMENT ON COLUMN consultations.clinical_risk_level IS 'Automated triage risk level: low, moderate, high, critical';
COMMENT ON COLUMN consultations.triage_score IS 'Numerical triage score for prioritization (0-100)';
COMMENT ON COLUMN consultations.red_flag_indicators IS 'Array of clinical red flags requiring attention';
COMMENT ON COLUMN consultations.requires_synchronous_visit IS 'Flag indicating need for immediate synchronous care';
COMMENT ON COLUMN consultations.safety_checks_completed IS 'Indicates all medication safety checks passed';
COMMENT ON COLUMN consultations.drug_interaction_checked IS 'Drug interaction checking completed';
COMMENT ON COLUMN consultations.allergy_checked IS 'Allergy cross-checking completed';

-- Grant appropriate permissions (adjust based on your role structure)
-- GRANT SELECT, INSERT ON consultation_state_history TO backend_role;
-- GRANT SELECT, INSERT ON clinical_decision_support_logs TO backend_role;
-- GRANT SELECT, INSERT, UPDATE ON consultation_quality_metrics TO backend_role;
-- GRANT SELECT, INSERT ON hipaa_audit_logs TO backend_role;
-- GRANT SELECT, INSERT, UPDATE ON sla_violations TO backend_role;

-- Migration complete
SELECT 'Phase 1: Critical Safety & Compliance migration completed successfully' AS status;
