-- Migration: Patient Access Audit Table for HIPAA Compliance
-- Description: Creates audit trail for patient data access without storing sensitive data
-- Author: BMad Master - SEC-001 HIPAA Audit Logging Implementation
-- Date: 2025-09-19

-- Create the patient access audit table
CREATE TABLE IF NOT EXISTS patient_access_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Patient identifier (hashed for HIPAA compliance)
    patient_id_hash VARCHAR(64) NOT NULL,
    
    -- Access details
    endpoint_accessed VARCHAR(255) NOT NULL,
    http_method VARCHAR(10) NOT NULL,
    
    -- User who accessed the data
    accessed_by_user_id UUID NOT NULL,
    accessed_by_role VARCHAR(50) NOT NULL,
    
    -- Access timestamp and metadata
    access_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    
    -- Request metadata
    query_parameters JSONB,
    response_status INTEGER,
    
    -- Standard timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient HIPAA compliance queries
CREATE INDEX idx_patient_access_audit_hash ON patient_access_audit(patient_id_hash);
CREATE INDEX idx_patient_access_audit_timestamp ON patient_access_audit(access_timestamp);
CREATE INDEX idx_patient_access_audit_user ON patient_access_audit(accessed_by_user_id);
CREATE INDEX idx_patient_access_audit_endpoint ON patient_access_audit(endpoint_accessed);

-- Create composite index for common audit queries
CREATE INDEX idx_patient_access_audit_hash_timestamp ON patient_access_audit(patient_id_hash, access_timestamp);

-- Add comment for HIPAA compliance documentation
COMMENT ON TABLE patient_access_audit IS 'HIPAA-compliant audit trail for patient data access. Contains only hashed patient identifiers, no actual patient data.';
COMMENT ON COLUMN patient_access_audit.patient_id_hash IS 'bcrypt hash of patient.id for HIPAA compliance - allows audit trail without storing sensitive identifiers';
COMMENT ON COLUMN patient_access_audit.endpoint_accessed IS 'API endpoint that was accessed (e.g., /api/patients/me, /api/patients/:id)';
COMMENT ON COLUMN patient_access_audit.query_parameters IS 'Non-sensitive query parameters for audit purposes (sanitized)';

-- Create function to clean old audit logs (HIPAA retention compliance)
CREATE OR REPLACE FUNCTION cleanup_patient_audit_logs()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    retention_days INTEGER := COALESCE(
        (SELECT value::INTEGER FROM system_settings WHERE key = 'audit_retention_days'), 
        2555  -- Default: 7 years for HIPAA compliance
    );
BEGIN
    DELETE FROM patient_access_audit 
    WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
    
    RAISE NOTICE 'Cleaned up audit logs older than % days', retention_days;
END;
$$;

-- Create system settings table if it doesn't exist (for audit retention configuration)
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default audit retention setting
INSERT INTO system_settings (key, value, description) 
VALUES (
    'audit_retention_days', 
    '2555', 
    'HIPAA audit log retention period in days (default: 7 years)'
)
ON CONFLICT (key) DO NOTHING;

-- Grant appropriate permissions
-- Note: In production, create specific roles for audit access
GRANT SELECT ON patient_access_audit TO PUBLIC;  -- Allow reading audit logs
GRANT INSERT ON patient_access_audit TO PUBLIC;  -- Allow audit logging

-- Completed: SEC-001 Patient Access Audit Table Migration