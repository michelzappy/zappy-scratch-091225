-- Communication Logs Migration
-- Adds tables for email and SMS logging, queues, and opt-outs

-- ============================================
-- EMAIL TABLES
-- ============================================

-- Email logs table
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient VARCHAR(255) NOT NULL,
    template VARCHAR(100),
    data JSONB,
    message_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed, bounced, opened, clicked
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_email_logs_recipient (recipient),
    INDEX idx_email_logs_status (status),
    INDEX idx_email_logs_sent_at (sent_at DESC)
);

-- Email queue table for scheduled emails
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient VARCHAR(255) NOT NULL,
    template VARCHAR(100) NOT NULL,
    data JSONB,
    send_at TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed, cancelled
    sent_at TIMESTAMP,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_email_queue_status (status),
    INDEX idx_email_queue_send_at (send_at)
);

-- ============================================
-- SMS TABLES
-- ============================================

-- SMS logs table
CREATE TABLE IF NOT EXISTS sms_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient VARCHAR(50) NOT NULL,
    template VARCHAR(100),
    content TEXT NOT NULL,
    message_sid VARCHAR(255), -- Twilio message SID
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, delivered, failed, undelivered
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_sms_logs_recipient (recipient),
    INDEX idx_sms_logs_status (status),
    INDEX idx_sms_logs_sent_at (sent_at DESC)
);

-- SMS queue table for scheduled messages
CREATE TABLE IF NOT EXISTS sms_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient VARCHAR(50) NOT NULL,
    template VARCHAR(100) NOT NULL,
    data JSONB,
    send_at TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, sent, failed, cancelled
    sent_at TIMESTAMP,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_sms_queue_status (status),
    INDEX idx_sms_queue_send_at (send_at)
);

-- SMS opt-outs table (for compliance)
CREATE TABLE IF NOT EXISTS sms_opt_outs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(50) UNIQUE NOT NULL,
    opted_out BOOLEAN DEFAULT false,
    opted_out_at TIMESTAMP,
    opted_in_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_sms_opt_outs_phone (phone_number),
    INDEX idx_sms_opt_outs_status (opted_out)
);

-- ============================================
-- NOTIFICATION PREFERENCES
-- ============================================

-- User notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Email preferences
    email_enabled BOOLEAN DEFAULT true,
    email_marketing BOOLEAN DEFAULT true,
    email_reminders BOOLEAN DEFAULT true,
    email_updates BOOLEAN DEFAULT true,
    
    -- SMS preferences
    sms_enabled BOOLEAN DEFAULT true,
    sms_marketing BOOLEAN DEFAULT false,
    sms_reminders BOOLEAN DEFAULT true,
    sms_updates BOOLEAN DEFAULT true,
    
    -- Push notification preferences (for future mobile app)
    push_enabled BOOLEAN DEFAULT false,
    push_marketing BOOLEAN DEFAULT false,
    push_reminders BOOLEAN DEFAULT false,
    push_updates BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    UNIQUE INDEX idx_notification_prefs_patient (patient_id)
);

-- ============================================
-- WEBHOOK LOGS (for Twilio/SendGrid callbacks)
-- ============================================

CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service VARCHAR(50) NOT NULL, -- twilio, sendgrid, stripe
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_webhook_logs_service (service),
    INDEX idx_webhook_logs_processed (processed),
    INDEX idx_webhook_logs_created (created_at DESC)
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update timestamp trigger for opt-outs
CREATE TRIGGER update_sms_opt_outs_updated_at 
    BEFORE UPDATE ON sms_opt_outs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update timestamp trigger for notification preferences
CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean old logs (run as scheduled job)
CREATE OR REPLACE FUNCTION clean_old_communication_logs()
RETURNS void AS $$
BEGIN
    -- Delete email logs older than 90 days
    DELETE FROM email_logs 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days'
    AND status IN ('sent', 'failed', 'bounced');
    
    -- Delete SMS logs older than 90 days
    DELETE FROM sms_logs 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days'
    AND status IN ('sent', 'delivered', 'failed');
    
    -- Delete processed webhook logs older than 30 days
    DELETE FROM webhook_logs 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
    AND processed = true;
    
    -- Delete failed queue items older than 7 days
    DELETE FROM email_queue 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '7 days'
    AND status = 'failed'
    AND retry_count > 3;
    
    DELETE FROM sms_queue 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '7 days'
    AND status = 'failed'
    AND retry_count > 3;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Composite indexes for common queries
CREATE INDEX idx_email_logs_recipient_date ON email_logs(recipient, sent_at DESC);
CREATE INDEX idx_sms_logs_recipient_date ON sms_logs(recipient, sent_at DESC);
CREATE INDEX idx_email_queue_pending ON email_queue(status, send_at) WHERE status = 'pending';
CREATE INDEX idx_sms_queue_scheduled ON sms_queue(status, send_at) WHERE status = 'scheduled';

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE email_logs IS 'Audit trail of all emails sent through the platform';
COMMENT ON TABLE sms_logs IS 'Audit trail of all SMS messages sent through Twilio';
COMMENT ON TABLE email_queue IS 'Queue for scheduled/delayed email sending';
COMMENT ON TABLE sms_queue IS 'Queue for scheduled/delayed SMS sending';
COMMENT ON TABLE sms_opt_outs IS 'SMS opt-out management for TCPA compliance';
COMMENT ON TABLE notification_preferences IS 'User communication preferences';
COMMENT ON TABLE webhook_logs IS 'Incoming webhook events from external services';

COMMENT ON FUNCTION clean_old_communication_logs() IS 'Cleanup function to remove old logs - run daily via cron';
