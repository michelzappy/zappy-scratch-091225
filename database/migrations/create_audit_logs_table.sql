-- Create audit_logs table for HIPAA compliance
-- This table stores all PHI access and modification records

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    user_email VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN (
        'CREATE', 'READ', 'UPDATE', 'DELETE',
        'LOGIN', 'LOGOUT', 'EXPORT', 'PRINT',
        'SHARE', 'UNAUTHORIZED_ACCESS'
    )),
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    request_path VARCHAR(500) NOT NULL,
    request_method VARCHAR(10) NOT NULL,
    request_data TEXT,
    response_status INTEGER,
    response_time INTEGER,
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(255),
    request_id VARCHAR(255),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);
CREATE INDEX IF NOT EXISTS idx_audit_logs_request_id ON audit_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session_id ON audit_logs(session_id);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_failed_access ON audit_logs(success, action) WHERE success = false;

-- Add comment to table
COMMENT ON TABLE audit_logs IS 'HIPAA-compliant audit log for tracking all PHI access and modifications';
COMMENT ON COLUMN audit_logs.user_id IS 'ID of user who performed the action';
COMMENT ON COLUMN audit_logs.user_email IS 'Email of user who performed the action';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource accessed (patients, appointments, etc.)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the specific resource accessed';
COMMENT ON COLUMN audit_logs.request_path IS 'API endpoint path';
COMMENT ON COLUMN audit_logs.request_method IS 'HTTP method used';
COMMENT ON COLUMN audit_logs.request_data IS 'Sanitized request body (for POST/PUT)';
COMMENT ON COLUMN audit_logs.response_status IS 'HTTP response status code';
COMMENT ON COLUMN audit_logs.response_time IS 'Response time in milliseconds';
COMMENT ON COLUMN audit_logs.ip_address IS 'Client IP address';
COMMENT ON COLUMN audit_logs.user_agent IS 'User agent string';
COMMENT ON COLUMN audit_logs.session_id IS 'Session identifier';
COMMENT ON COLUMN audit_logs.request_id IS 'Unique request identifier for tracing';
COMMENT ON COLUMN audit_logs.success IS 'Whether the action was successful';
COMMENT ON COLUMN audit_logs.error_message IS 'Error message if action failed';
COMMENT ON COLUMN audit_logs.details IS 'Additional details about the action in JSON format';
COMMENT ON COLUMN audit_logs.timestamp IS 'When the action occurred';

-- Create a function to prevent updates and deletes on audit logs
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs cannot be modified or deleted for compliance reasons';
END;
$$ LANGUAGE plpgsql;

-- Create triggers to prevent updates and deletes
DROP TRIGGER IF EXISTS prevent_audit_log_update ON audit_logs;
CREATE TRIGGER prevent_audit_log_update
BEFORE UPDATE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_modification();

DROP TRIGGER IF EXISTS prevent_audit_log_delete ON audit_logs;
CREATE TRIGGER prevent_audit_log_delete
BEFORE DELETE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_modification();

-- Create a view for simplified audit log queries
CREATE OR REPLACE VIEW audit_log_summary AS
SELECT 
    DATE_TRUNC('day', timestamp) AS date,
    action,
    resource_type,
    COUNT(*) AS count,
    COUNT(DISTINCT user_id) AS unique_users,
    SUM(CASE WHEN success THEN 1 ELSE 0 END) AS successful_actions,
    SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) AS failed_actions,
    AVG(response_time) AS avg_response_time
FROM audit_logs
GROUP BY DATE_TRUNC('day', timestamp), action, resource_type;

-- Grant appropriate permissions
GRANT SELECT ON audit_logs TO app_read_role;
GRANT INSERT ON audit_logs TO app_write_role;
GRANT SELECT ON audit_log_summary TO app_read_role;
