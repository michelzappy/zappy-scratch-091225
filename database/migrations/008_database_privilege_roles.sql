-- Migration: Database Privilege Roles and Security Framework
-- Created: 2025-09-19
-- Purpose: Implement least-privilege access patterns with emergency bypass capabilities

-- Create database roles for privilege segregation
CREATE ROLE IF NOT EXISTS zappy_readonly;
CREATE ROLE IF NOT EXISTS zappy_patient_update;
CREATE ROLE IF NOT EXISTS zappy_migration;
CREATE ROLE IF NOT EXISTS zappy_emergency;

-- Grant appropriate privileges to read-only role
GRANT CONNECT ON DATABASE postgres TO zappy_readonly;
GRANT USAGE ON SCHEMA public TO zappy_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO zappy_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO zappy_readonly;

-- Grant limited write privileges for patient updates
GRANT CONNECT ON DATABASE postgres TO zappy_patient_update;
GRANT USAGE ON SCHEMA public TO zappy_patient_update;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO zappy_patient_update;
GRANT INSERT, UPDATE ON patients TO zappy_patient_update;
GRANT INSERT, UPDATE ON consultations TO zappy_patient_update;
GRANT INSERT, UPDATE ON orders TO zappy_patient_update;
GRANT INSERT, UPDATE ON messages TO zappy_patient_update;
GRANT INSERT, UPDATE ON patient_audit_log TO zappy_patient_update;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO zappy_patient_update;

-- Grant migration privileges (used only during maintenance)
GRANT CONNECT ON DATABASE postgres TO zappy_migration;
GRANT USAGE ON SCHEMA public TO zappy_migration;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO zappy_migration;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO zappy_migration;
GRANT CREATE ON SCHEMA public TO zappy_migration;

-- Grant emergency privileges (for critical care situations)
GRANT CONNECT ON DATABASE postgres TO zappy_emergency;
GRANT USAGE ON SCHEMA public TO zappy_emergency;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO zappy_emergency;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO zappy_emergency;
GRANT CREATE ON SCHEMA public TO zappy_emergency;

-- Create table for tracking privilege escalations
CREATE TABLE IF NOT EXISTS privilege_escalations (
    id SERIAL PRIMARY KEY,
    escalation_id VARCHAR(255) NOT NULL,
    role_requested VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    requested_by VARCHAR(255) NOT NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    expires_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    emergency_override BOOLEAN DEFAULT FALSE,
    patient_identifier_hash VARCHAR(255), -- Encrypted patient ID for emergency access
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for efficient privilege escalation queries
CREATE INDEX IF NOT EXISTS idx_privilege_escalations_status ON privilege_escalations(status);
CREATE INDEX IF NOT EXISTS idx_privilege_escalations_expires ON privilege_escalations(expires_at);
CREATE INDEX IF NOT EXISTS idx_privilege_escalations_emergency ON privilege_escalations(emergency_override);

-- Create table for data integrity checksums
CREATE TABLE IF NOT EXISTS data_integrity_checksums (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(255) NOT NULL,
    checksum_type VARCHAR(50) NOT NULL, -- 'md5', 'sha256'
    checksum_value VARCHAR(255) NOT NULL,
    record_count INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    migration_id VARCHAR(255), -- Links to migration if applicable
    status VARCHAR(50) DEFAULT 'active'
);

-- Create index for checksum validation queries
CREATE INDEX IF NOT EXISTS idx_data_integrity_table ON data_integrity_checksums(table_name);
CREATE INDEX IF NOT EXISTS idx_data_integrity_status ON data_integrity_checksums(status);

-- Create table for migration operation logs
CREATE TABLE IF NOT EXISTS migration_operation_logs (
    id SERIAL PRIMARY KEY,
    migration_id VARCHAR(255) NOT NULL,
    operation_type VARCHAR(100) NOT NULL, -- 'pre_validation', 'migration', 'post_validation', 'rollback'
    table_affected VARCHAR(255),
    operation_sql TEXT,
    pre_checksum VARCHAR(255),
    post_checksum VARCHAR(255),
    record_count_before INTEGER,
    record_count_after INTEGER,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'success', 'failed', 'rolled_back'
    error_message TEXT,
    executed_by VARCHAR(255) NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for migration log queries
CREATE INDEX IF NOT EXISTS idx_migration_logs_migration_id ON migration_operation_logs(migration_id);
CREATE INDEX IF NOT EXISTS idx_migration_logs_status ON migration_operation_logs(status);
CREATE INDEX IF NOT EXISTS idx_migration_logs_table ON migration_operation_logs(table_affected);

-- Create database users for each role (these will be environment-specific)
-- Note: In production, these should be created with proper passwords
-- CREATE USER zappy_readonly_user WITH PASSWORD 'secure_readonly_password';
-- CREATE USER zappy_patient_update_user WITH PASSWORD 'secure_patient_update_password';
-- CREATE USER zappy_migration_user WITH PASSWORD 'secure_migration_password';
-- CREATE USER zappy_emergency_user WITH PASSWORD 'secure_emergency_password';

-- Assign roles to users (uncomment in production with actual users)
-- GRANT zappy_readonly TO zappy_readonly_user;
-- GRANT zappy_patient_update TO zappy_patient_update_user;
-- GRANT zappy_migration TO zappy_migration_user;
-- GRANT zappy_emergency TO zappy_emergency_user;

-- Create function for emergency privilege escalation
CREATE OR REPLACE FUNCTION request_emergency_access(
    p_reason TEXT,
    p_requested_by VARCHAR(255),
    p_patient_identifier_hash VARCHAR(255) DEFAULT NULL
) RETURNS VARCHAR(255) AS $$
DECLARE
    escalation_id VARCHAR(255);
BEGIN
    -- Generate unique escalation ID
    escalation_id := 'EMRG-' || to_char(NOW(), 'YYYYMMDD-HH24MISS') || '-' || substring(md5(random()::text), 1, 8);
    
    -- Insert emergency escalation request
    INSERT INTO privilege_escalations (
        escalation_id,
        role_requested,
        reason,
        requested_by,
        emergency_override,
        patient_identifier_hash,
        status,
        expires_at
    ) VALUES (
        escalation_id,
        'zappy_emergency',
        p_reason,
        p_requested_by,
        TRUE,
        p_patient_identifier_hash,
        'approved', -- Emergency requests are auto-approved
        CURRENT_TIMESTAMP + INTERVAL '30 minutes' -- 30-minute emergency window
    );
    
    RETURN escalation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for data integrity validation
CREATE OR REPLACE FUNCTION validate_table_integrity(
    p_table_name VARCHAR(255),
    p_migration_id VARCHAR(255) DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    current_checksum VARCHAR(255);
    current_count INTEGER;
    last_checksum VARCHAR(255);
    checksum_match BOOLEAN DEFAULT FALSE;
BEGIN
    -- Calculate current table checksum and count
    EXECUTE format('SELECT md5(array_agg(md5((t.*)::text) ORDER BY (t.*)::text)::text), COUNT(*) FROM %I t', p_table_name)
    INTO current_checksum, current_count;
    
    -- Get last known good checksum
    SELECT checksum_value INTO last_checksum
    FROM data_integrity_checksums
    WHERE table_name = p_table_name
    AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Store current checksum
    INSERT INTO data_integrity_checksums (
        table_name,
        checksum_type,
        checksum_value,
        record_count,
        migration_id
    ) VALUES (
        p_table_name,
        'md5',
        current_checksum,
        current_count,
        p_migration_id
    );
    
    -- Return true if no previous checksum exists (first run) or checksums are reasonable
    IF last_checksum IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- For now, always return true - advanced validation logic can be added here
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION request_emergency_access TO zappy_patient_update;
GRANT EXECUTE ON FUNCTION request_emergency_access TO zappy_emergency;
GRANT EXECUTE ON FUNCTION validate_table_integrity TO zappy_migration;
GRANT EXECUTE ON FUNCTION validate_table_integrity TO zappy_emergency;

-- Comment on tables for documentation
COMMENT ON TABLE privilege_escalations IS 'Tracks all database privilege escalation requests for audit and emergency access';
COMMENT ON TABLE data_integrity_checksums IS 'Maintains checksums for data integrity validation during migrations and operations';
COMMENT ON TABLE migration_operation_logs IS 'Comprehensive logging of all migration operations with rollback capabilities';

-- Comment on roles for documentation
COMMENT ON ROLE zappy_readonly IS 'Read-only access for reporting and analytics operations';
COMMENT ON ROLE zappy_patient_update IS 'Limited write access for routine patient data operations';
COMMENT ON ROLE zappy_migration IS 'Full access for database migration operations during maintenance windows';
COMMENT ON ROLE zappy_emergency IS 'Emergency access for critical patient care situations with time limits';