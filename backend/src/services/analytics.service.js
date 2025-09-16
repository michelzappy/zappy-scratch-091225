/**
 * Analytics Service for Conversion Funnel Tracking
 * Tracks user journey from landing to conversion
 */

import { getDatabase } from '../config/database.js';

class AnalyticsService {
  constructor() {
    this.db = getDatabase();
  }

  /**
   * Track funnel events
   */
  async trackEvent({
    userId,
    sessionId,
    eventType,
    eventCategory,
    eventData = {},
    pageUrl,
    referrer
  }) {
    try {
      const eventRecord = {
        user_id: userId,
        session_id: sessionId,
        event_type: eventType,
        event_category: eventCategory,
        event_data: JSON.stringify(eventData),
        page_url: pageUrl,
        referrer: referrer,
        created_at: new Date()
      };

      await this.db.query(`
        INSERT INTO analytics_events 
        (user_id, session_id, event_type, event_category, event_data, page_url, referrer, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        eventRecord.user_id,
        eventRecord.session_id,
        eventRecord.event_type,
        eventRecord.event_category,
        eventRecord.event_data,
        eventRecord.page_url,
        eventRecord.referrer,
        eventRecord.created_at
      ]);

      return { success: true };
    } catch (error) {
      console.error('Analytics tracking error:', error);
      // Don't throw - analytics should never break the app
      return { success: false, error: error.message };
    }
  }

  /**
   * Track form field interactions (for time tracking)
   */
  async trackFormField({
    userId,
    sessionId,
    formName,
    fieldName,
    action, // focus, blur, change
    timeSpent
  }) {
    return this.trackEvent({
      userId,
      sessionId,
      eventType: 'form_interaction',
      eventCategory: formName,
      eventData: {
        field: fieldName,
        action: action,
        timeSpent: timeSpent
      }
    });
  }

  /**
   * Track conversion funnel steps
   */
  async trackFunnelStep({
    userId,
    sessionId,
    funnelName,
    stepName,
    stepNumber,
    metadata = {}
  }) {
    return this.trackEvent({
      userId,
      sessionId,
      eventType: 'funnel_step',
      eventCategory: funnelName,
      eventData: {
        step: stepName,
        stepNumber: stepNumber,
        ...metadata
      }
    });
  }

  /**
   * Get funnel conversion metrics
   */
  async getFunnelMetrics(funnelName, dateRange = '30 days') {
    const result = await this.db.query(`
      WITH funnel_data AS (
        SELECT 
          session_id,
          event_data->>'step' as step_name,
          (event_data->>'stepNumber')::int as step_number,
          created_at
        FROM analytics_events
        WHERE event_type = 'funnel_step'
          AND event_category = $1
          AND created_at >= NOW() - INTERVAL '${dateRange}'
      ),
      step_counts AS (
        SELECT 
          step_name,
          step_number,
          COUNT(DISTINCT session_id) as users,
          AVG(EXTRACT(EPOCH FROM (
            LEAD(created_at) OVER (PARTITION BY session_id ORDER BY step_number) - created_at
          ))/60) as avg_time_to_next_step
        FROM funnel_data
        GROUP BY step_name, step_number
      )
      SELECT 
        step_name,
        step_number,
        users,
        avg_time_to_next_step,
        ROUND(users * 100.0 / FIRST_VALUE(users) OVER (ORDER BY step_number), 2) as percentage,
        LAG(users) OVER (ORDER BY step_number) - users as drop_off
      FROM step_counts
      ORDER BY step_number
    `, [funnelName]);

    return result.rows;
  }

  /**
   * Get form completion metrics
   */
  async getFormMetrics(formName, dateRange = '30 days') {
    const result = await this.db.query(`
      WITH form_sessions AS (
        SELECT 
          session_id,
          MIN(created_at) as started_at,
          MAX(created_at) as ended_at,
          COUNT(DISTINCT event_data->>'field') as fields_interacted,
          SUM((event_data->>'timeSpent')::int) as total_time_spent
        FROM analytics_events
        WHERE event_type = 'form_interaction'
          AND event_category = $1
          AND created_at >= NOW() - INTERVAL '${dateRange}'
        GROUP BY session_id
      ),
      completion_data AS (
        SELECT 
          fs.session_id,
          fs.fields_interacted,
          fs.total_time_spent,
          EXTRACT(EPOCH FROM (fs.ended_at - fs.started_at))/60 as form_duration_minutes,
          CASE 
            WHEN ae.event_type = 'form_submission' THEN true 
            ELSE false 
          END as completed
        FROM form_sessions fs
        LEFT JOIN analytics_events ae 
          ON fs.session_id = ae.session_id 
          AND ae.event_type = 'form_submission'
          AND ae.event_category = $1
      )
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN completed THEN 1 END) as completed_sessions,
        ROUND(COUNT(CASE WHEN completed THEN 1 END) * 100.0 / COUNT(*), 2) as completion_rate,
        ROUND(AVG(fields_interacted), 2) as avg_fields_interacted,
        ROUND(AVG(total_time_spent/60), 2) as avg_time_spent_minutes,
        ROUND(AVG(form_duration_minutes), 2) as avg_form_duration,
        ROUND(AVG(CASE WHEN completed THEN form_duration_minutes END), 2) as avg_completion_time
      FROM completion_data
    `, [formName]);

    return result.rows[0] || {};
  }

  /**
   * Get conversion rate between any two events
   */
  async getConversionRate(startEvent, endEvent, dateRange = '30 days') {
    const result = await this.db.query(`
      WITH start_sessions AS (
        SELECT DISTINCT session_id
        FROM analytics_events
        WHERE event_type = $1
          AND created_at >= NOW() - INTERVAL '${dateRange}'
      ),
      end_sessions AS (
        SELECT DISTINCT session_id
        FROM analytics_events
        WHERE event_type = $2
          AND created_at >= NOW() - INTERVAL '${dateRange}'
      )
      SELECT 
        (SELECT COUNT(*) FROM start_sessions) as started,
        (SELECT COUNT(*) FROM end_sessions) as completed,
        ROUND(
          (SELECT COUNT(*) FROM end_sessions) * 100.0 / 
          NULLIF((SELECT COUNT(*) FROM start_sessions), 0), 
          2
        ) as conversion_rate
    `, [startEvent, endEvent]);

    return result.rows[0] || { started: 0, completed: 0, conversion_rate: 0 };
  }

  /**
   * Get detailed session path analysis
   */
  async getSessionPaths(sessionId) {
    const result = await this.db.query(`
      SELECT 
        event_type,
        event_category,
        event_data,
        page_url,
        created_at,
        EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (ORDER BY created_at)))/60 as minutes_since_last_event
      FROM analytics_events
      WHERE session_id = $1
      ORDER BY created_at
    `, [sessionId]);

    return result.rows;
  }

  /**
   * Common funnel tracking methods for telehealth
   */
  
  // Track consultation funnel
  async trackConsultationFunnel(userId, sessionId, step) {
    const steps = {
      'landing': 1,
      'condition_selected': 2,
      'quiz_started': 3,
      'quiz_completed': 4,
      'plan_selected': 5,
      'checkout_started': 6,
      'payment_completed': 7,
      'consultation_submitted': 8
    };

    return this.trackFunnelStep({
      userId,
      sessionId,
      funnelName: 'consultation',
      stepName: step,
      stepNumber: steps[step] || 0
    });
  }

  // Track prescription funnel
  async trackPrescriptionFunnel(userId, sessionId, step) {
    const steps = {
      'consultation_reviewed': 1,
      'prescription_approved': 2,
      'pharmacy_notified': 3,
      'order_confirmed': 4,
      'order_shipped': 5,
      'order_delivered': 6
    };

    return this.trackFunnelStep({
      userId,
      sessionId,
      funnelName: 'prescription',
      stepName: step,
      stepNumber: steps[step] || 0
    });
  }

  // Track refill funnel
  async trackRefillFunnel(userId, sessionId, step) {
    const steps = {
      'refill_reminder_sent': 1,
      'refill_initiated': 2,
      'checkin_started': 3,
      'checkin_completed': 4,
      'refill_approved': 5,
      'refill_processed': 6
    };

    return this.trackFunnelStep({
      userId,
      sessionId,
      funnelName: 'refill',
      stepName: step,
      stepNumber: steps[step] || 0
    });
  }

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(dateRange = '30 days') {
    const [consultationFunnel, formMetrics, conversionRates] = await Promise.all([
      this.getFunnelMetrics('consultation', dateRange),
      this.getFormMetrics('health_quiz', dateRange),
      Promise.all([
        this.getConversionRate('landing_page_view', 'consultation_submitted', dateRange),
        this.getConversionRate('quiz_started', 'quiz_completed', dateRange),
        this.getConversionRate('plan_viewed', 'plan_selected', dateRange)
      ])
    ]);

    return {
      funnels: {
        consultation: consultationFunnel
      },
      forms: {
        health_quiz: formMetrics
      },
      conversions: {
        overall: conversionRates[0],
        quiz: conversionRates[1],
        plan: conversionRates[2]
      }
    };
  }
}

export default new AnalyticsService();
