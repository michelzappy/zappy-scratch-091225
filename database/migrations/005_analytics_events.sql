-- Analytics Events Table for Conversion Funnel Tracking
-- Tracks user journey, form interactions, and conversions

CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    session_id VARCHAR(255),
    
    -- Event details
    event_type VARCHAR(100) NOT NULL, -- page_view, form_interaction, funnel_step, conversion, etc.
    event_category VARCHAR(100), -- consultation, prescription, refill, health_quiz, etc.
    event_data JSONB, -- Flexible data storage for event-specific details
    
    -- Page/Form tracking
    page_url VARCHAR(500),
    referrer VARCHAR(500),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_analytics_user (user_id),
    INDEX idx_analytics_session (session_id),
    INDEX idx_analytics_type (event_type),
    INDEX idx_analytics_category (event_category),
    INDEX idx_analytics_created (created_at DESC)
);

-- Session tracking table (for aggregating user sessions)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID,
    
    -- Session details
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    duration_seconds INTEGER,
    
    -- Device/Browser info
    user_agent TEXT,
    ip_address INET,
    device_type VARCHAR(50), -- mobile, tablet, desktop
    browser VARCHAR(50),
    
    -- Attribution
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_content VARCHAR(100),
    utm_term VARCHAR(100),
    
    -- Outcomes
    converted BOOLEAN DEFAULT false,
    conversion_type VARCHAR(100), -- consultation_submitted, prescription_ordered, etc.
    conversion_value DECIMAL(10,2),
    
    -- Indexes
    INDEX idx_sessions_user (user_id),
    INDEX idx_sessions_started (started_at DESC),
    INDEX idx_sessions_converted (converted)
);

-- Form field tracking (detailed time spent on each field)
CREATE TABLE IF NOT EXISTS form_field_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) NOT NULL,
    form_name VARCHAR(100) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    
    -- Interaction metrics
    focus_count INTEGER DEFAULT 0,
    blur_count INTEGER DEFAULT 0,
    change_count INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    
    -- Field completion
    was_completed BOOLEAN DEFAULT false,
    error_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_form_fields_session (session_id),
    INDEX idx_form_fields_form (form_name),
    UNIQUE INDEX idx_form_field_unique (session_id, form_name, field_name)
);

-- Funnel steps definition (for reporting)
CREATE TABLE IF NOT EXISTS funnel_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funnel_name VARCHAR(100) NOT NULL,
    step_number INTEGER NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    step_description TEXT,
    
    -- Expected metrics
    expected_completion_rate DECIMAL(5,2), -- percentage
    expected_time_minutes INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    UNIQUE INDEX idx_funnel_step (funnel_name, step_number)
);

-- Insert default funnel definitions
INSERT INTO funnel_definitions (funnel_name, step_number, step_name, step_description, expected_completion_rate, expected_time_minutes) VALUES
-- Consultation Funnel
('consultation', 1, 'landing', 'User lands on homepage', 100.00, 1),
('consultation', 2, 'condition_selected', 'User selects a health condition', 70.00, 2),
('consultation', 3, 'quiz_started', 'User starts health questionnaire', 50.00, 1),
('consultation', 4, 'quiz_completed', 'User completes health questionnaire', 35.00, 10),
('consultation', 5, 'plan_selected', 'User selects treatment plan', 25.00, 3),
('consultation', 6, 'checkout_started', 'User enters payment info', 20.00, 2),
('consultation', 7, 'payment_completed', 'Payment processed successfully', 15.00, 1),
('consultation', 8, 'consultation_submitted', 'Consultation submitted for review', 15.00, 1),

-- Prescription Funnel
('prescription', 1, 'consultation_reviewed', 'Provider reviews consultation', 100.00, 5),
('prescription', 2, 'prescription_approved', 'Provider approves prescription', 90.00, 3),
('prescription', 3, 'pharmacy_notified', 'Pharmacy receives prescription', 90.00, 1),
('prescription', 4, 'order_confirmed', 'Order confirmed by pharmacy', 85.00, 2),
('prescription', 5, 'order_shipped', 'Medication shipped', 85.00, 1),
('prescription', 6, 'order_delivered', 'Medication delivered', 80.00, 1),

-- Refill Funnel
('refill', 1, 'refill_reminder_sent', 'Refill reminder sent to patient', 100.00, 0),
('refill', 2, 'refill_initiated', 'Patient clicks refill link', 30.00, 1),
('refill', 3, 'checkin_started', 'Patient starts check-in form', 25.00, 1),
('refill', 4, 'checkin_completed', 'Check-in form completed', 20.00, 5),
('refill', 5, 'refill_approved', 'Refill approved by provider', 18.00, 2),
('refill', 6, 'refill_processed', 'Refill sent to pharmacy', 18.00, 1);

-- Analytics Views for reporting

-- Funnel conversion view
CREATE OR REPLACE VIEW funnel_conversion_rates AS
WITH funnel_data AS (
    SELECT 
        event_category as funnel_name,
        event_data->>'step' as step_name,
        (event_data->>'stepNumber')::int as step_number,
        session_id,
        created_at
    FROM analytics_events
    WHERE event_type = 'funnel_step'
),
step_counts AS (
    SELECT 
        funnel_name,
        step_name,
        step_number,
        COUNT(DISTINCT session_id) as unique_sessions,
        COUNT(*) as total_events
    FROM funnel_data
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY funnel_name, step_name, step_number
)
SELECT 
    sc.funnel_name,
    sc.step_number,
    sc.step_name,
    fd.step_description,
    sc.unique_sessions,
    sc.total_events,
    ROUND(sc.unique_sessions * 100.0 / 
          FIRST_VALUE(sc.unique_sessions) OVER (
              PARTITION BY sc.funnel_name 
              ORDER BY sc.step_number
          ), 2) as conversion_rate,
    fd.expected_completion_rate,
    ROUND(sc.unique_sessions * 100.0 / 
          LAG(sc.unique_sessions) OVER (
              PARTITION BY sc.funnel_name 
              ORDER BY sc.step_number
          ), 2) as step_conversion_rate
FROM step_counts sc
LEFT JOIN funnel_definitions fd 
    ON sc.funnel_name = fd.funnel_name 
    AND sc.step_number = fd.step_number
ORDER BY sc.funnel_name, sc.step_number;

-- Form completion rates view
CREATE OR REPLACE VIEW form_completion_rates AS
SELECT 
    form_name,
    COUNT(DISTINCT session_id) as total_sessions,
    COUNT(DISTINCT CASE WHEN was_completed THEN session_id END) as completed_sessions,
    ROUND(COUNT(DISTINCT CASE WHEN was_completed THEN session_id END) * 100.0 / 
          COUNT(DISTINCT session_id), 2) as completion_rate,
    ROUND(AVG(time_spent_seconds/60.0), 2) as avg_time_minutes,
    ROUND(AVG(error_count), 2) as avg_errors_per_session
FROM form_field_analytics
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY form_name;

-- Session conversion summary
CREATE OR REPLACE VIEW session_conversion_summary AS
SELECT 
    DATE(started_at) as date,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN converted THEN 1 END) as converted_sessions,
    ROUND(COUNT(CASE WHEN converted THEN 1 END) * 100.0 / COUNT(*), 2) as conversion_rate,
    ROUND(AVG(duration_seconds/60.0), 2) as avg_session_minutes,
    SUM(conversion_value) as total_revenue
FROM user_sessions
WHERE started_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(started_at)
ORDER BY date DESC;

-- Functions for analytics

-- Function to calculate time between funnel steps
CREATE OR REPLACE FUNCTION calculate_funnel_velocity(
    p_session_id VARCHAR,
    p_funnel_name VARCHAR
) RETURNS TABLE (
    step_number INT,
    step_name VARCHAR,
    time_to_next_step_minutes NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (event_data->>'stepNumber')::int as step_number,
        event_data->>'step' as step_name,
        ROUND(EXTRACT(EPOCH FROM (
            LEAD(created_at) OVER (ORDER BY (event_data->>'stepNumber')::int) - created_at
        ))/60, 2) as time_to_next_step_minutes
    FROM analytics_events
    WHERE session_id = p_session_id
        AND event_type = 'funnel_step'
        AND event_category = p_funnel_name
    ORDER BY step_number;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updating timestamps
CREATE TRIGGER update_form_field_analytics_updated_at 
    BEFORE UPDATE ON form_field_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE analytics_events IS 'Core analytics event tracking for conversion funnel analysis';
COMMENT ON TABLE user_sessions IS 'Aggregated user session data with attribution and conversion tracking';
COMMENT ON TABLE form_field_analytics IS 'Detailed form field interaction tracking for optimization';
COMMENT ON TABLE funnel_definitions IS 'Expected funnel steps and conversion rates for comparison';
COMMENT ON VIEW funnel_conversion_rates IS 'Real-time funnel conversion metrics';
COMMENT ON VIEW form_completion_rates IS 'Form completion and interaction metrics';
COMMENT ON VIEW session_conversion_summary IS 'Daily session and conversion summary';
