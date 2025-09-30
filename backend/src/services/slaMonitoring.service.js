/**
 * SLA Monitoring Service
 * Tracks response times and flags SLA violations for consultations
 * Ensures timely patient care and provider accountability
 */

import { getDatabase } from '../config/database.js';

/**
 * SLA thresholds by urgency level (in minutes)
 */
export const SLA_THRESHOLDS = {
  urgent: 30,       // 30 minutes for urgent consultations
  high: 120,        // 2 hours for high priority
  medium: 480,      // 8 hours for medium priority
  routine: 1440     // 24 hours for routine consultations
};

/**
 * Check SLA compliance for a consultation
 * @param {string} consultationId - Consultation UUID
 * @returns {Object} - { compliant: boolean, responseTime: number, threshold: number }
 */
export const checkSLACompliance = async (consultationId) => {
  const db = getDatabase();
  
  try {
    const [consultation] = await db`
      SELECT 
        id,
        status,
        urgency,
        submitted_at,
        assigned_at,
        reviewed_at,
        completed_at,
        response_time_minutes
      FROM consultations
      WHERE id = ${consultationId}
      LIMIT 1
    `;

    if (!consultation) {
      throw new Error(`Consultation ${consultationId} not found`);
    }

    const now = new Date();
    const submittedAt = new Date(consultation.submitted_at);
    const responseTime = Math.floor((now - submittedAt) / 60000); // minutes

    // Determine which timestamp to use based on status
    let actualResponseTime = responseTime;
    if (consultation.assigned_at) {
      const assignedAt = new Date(consultation.assigned_at);
      actualResponseTime = Math.floor((assignedAt - submittedAt) / 60000);
    }

    const urgency = consultation.urgency || 'medium';
    const threshold = SLA_THRESHOLDS[urgency] || SLA_THRESHOLDS.medium;
    const compliant = actualResponseTime <= threshold;

    // Update response time in consultation
    await db`
      UPDATE consultations
      SET response_time_minutes = ${actualResponseTime}
      WHERE id = ${consultationId}
    `;

    if (!compliant && !consultation.sla_violation_at) {
      await flagSLAViolation(consultationId, actualResponseTime, threshold, urgency);
    }

    return {
      compliant,
      responseTime: actualResponseTime,
      threshold,
      urgency,
      violationMinutes: Math.max(0, actualResponseTime - threshold),
      status: consultation.status
    };
  } catch (error) {
    console.error(`Error checking SLA compliance for ${consultationId}:`, error);
    throw error;
  }
};

/**
 * Flag an SLA violation
 * @param {string} consultationId - Consultation UUID
 * @param {number} actualResponseTime - Actual response time in minutes
 * @param {number} threshold - SLA threshold in minutes
 * @param {string} urgency - Urgency level
 */
export const flagSLAViolation = async (consultationId, actualResponseTime, threshold, urgency) => {
  const db = getDatabase();
  
  try {
    // Get consultation details for notification
    const [consultation] = await db`
      SELECT provider_id, patient_id
      FROM consultations
      WHERE id = ${consultationId}
      LIMIT 1
    `;

    // Mark consultation with SLA violation
    await db`
      UPDATE consultations
      SET sla_violation_at = NOW()
      WHERE id = ${consultationId}
    `;

    // Create SLA violation record
    const violationMinutes = actualResponseTime - threshold;
    await db`
      INSERT INTO sla_violations (
        consultation_id,
        urgency_level,
        sla_threshold_minutes,
        actual_response_time_minutes,
        violation_minutes,
        created_at
      ) VALUES (
        ${consultationId},
        ${urgency},
        ${threshold},
        ${actualResponseTime},
        ${violationMinutes},
        NOW()
      )
    `;

    console.log(`🚨 SLA violation flagged for consultation ${consultationId}: ${violationMinutes} minutes over threshold`);

    // Notify supervisor (if provider assigned)
    if (consultation.provider_id) {
      await notifySupervisor(consultation.provider_id, consultationId, violationMinutes);
    }

    return { success: true, violationMinutes };
  } catch (error) {
    console.error(`Error flagging SLA violation for ${consultationId}:`, error);
    throw error;
  }
};

/**
 * Notify supervisor of SLA violation
 * @param {string} providerId - Provider UUID
 * @param {string} consultationId - Consultation UUID
 * @param {number} violationMinutes - Minutes over threshold
 */
export const notifySupervisor = async (providerId, consultationId, violationMinutes) => {
  // In production, this would send email/SMS to supervisor
  // For now, just log the notification
  console.log(`📧 Supervisor notification: Consultation ${consultationId} has SLA violation of ${violationMinutes} minutes`);
  
  // TODO: Integrate with email service
  // await emailService.send({
  //   to: supervisor.email,
  //   subject: 'SLA Violation Alert',
  //   body: `Consultation ${consultationId} has exceeded SLA by ${violationMinutes} minutes`
  // });
  
  return { success: true };
};

/**
 * Track response time for consultation status change
 * @param {string} consultationId - Consultation UUID
 * @param {string} newStatus - New consultation status
 */
export const trackResponseTime = async (consultationId, newStatus) => {
  const db = getDatabase();
  
  try {
    const [consultation] = await db`
      SELECT 
        id,
        status,
        urgency,
        submitted_at,
        assigned_at,
        response_time_minutes
      FROM consultations
      WHERE id = ${consultationId}
      LIMIT 1
    `;

    if (!consultation) {
      return;
    }

    const now = new Date();
    const submittedAt = new Date(consultation.submitted_at);
    const responseTime = Math.floor((now - submittedAt) / 60000);

    // Update response time
    await db`
      UPDATE consultations
      SET response_time_minutes = ${responseTime}
      WHERE id = ${consultationId}
    `;

    // Check SLA compliance
    const slaResult = await checkSLACompliance(consultationId);
    
    if (!slaResult.compliant) {
      console.log(`⚠️ SLA violation detected for consultation ${consultationId}`);
    }

    return slaResult;
  } catch (error) {
    console.error(`Error tracking response time for ${consultationId}:`, error);
    // Don't throw - tracking failure shouldn't block workflow
    return null;
  }
};

/**
 * Get SLA compliance metrics
 * @param {Object} filters - { startDate, endDate, urgency, providerId }
 * @returns {Object} - Compliance metrics
 */
export const getSLAMetrics = async (filters = {}) => {
  const db = getDatabase();
  
  try {
    const { startDate, endDate, urgency, providerId } = filters;
    
    let whereConditions = ['submitted_at IS NOT NULL'];
    let params = [];

    if (startDate) {
      whereConditions.push(`submitted_at >= $${params.length + 1}`);
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push(`submitted_at <= $${params.length + 1}`);
      params.push(endDate);
    }

    if (urgency) {
      whereConditions.push(`urgency = $${params.length + 1}`);
      params.push(urgency);
    }

    if (providerId) {
      whereConditions.push(`provider_id = $${params.length + 1}`);
      params.push(providerId);
    }

    const whereClause = whereConditions.join(' AND ');

    const result = await db.unsafe(`
      SELECT 
        COUNT(*) as total_consultations,
        COUNT(CASE WHEN sla_violation_at IS NULL THEN 1 END) as compliant,
        COUNT(CASE WHEN sla_violation_at IS NOT NULL THEN 1 END) as violations,
        AVG(response_time_minutes) as avg_response_time,
        MAX(response_time_minutes) as max_response_time,
        MIN(response_time_minutes) as min_response_time,
        urgency
      FROM consultations
      WHERE ${whereClause}
      GROUP BY urgency
    `, params);

    // Calculate overall metrics
    const totalConsultations = result.reduce((sum, row) => sum + parseInt(row.total_consultations), 0);
    const totalCompliant = result.reduce((sum, row) => sum + parseInt(row.compliant), 0);
    const totalViolations = result.reduce((sum, row) => sum + parseInt(row.violations), 0);
    
    const complianceRate = totalConsultations > 0 
      ? ((totalCompliant / totalConsultations) * 100).toFixed(2)
      : 0;

    return {
      overall: {
        totalConsultations,
        compliant: totalCompliant,
        violations: totalViolations,
        complianceRate: parseFloat(complianceRate)
      },
      byUrgency: result.map(row => ({
        urgency: row.urgency,
        totalConsultations: parseInt(row.total_consultations),
        compliant: parseInt(row.compliant),
        violations: parseInt(row.violations),
        complianceRate: row.total_consultations > 0 
          ? ((row.compliant / row.total_consultations) * 100).toFixed(2)
          : 0,
        avgResponseTime: parseFloat(row.avg_response_time || 0).toFixed(2),
        maxResponseTime: parseInt(row.max_response_time || 0),
        minResponseTime: parseInt(row.min_response_time || 0)
      }))
    };
  } catch (error) {
    console.error('Error getting SLA metrics:', error);
    throw error;
  }
};

/**
 * Resolve an SLA violation
 * @param {string} violationId - Violation UUID
 * @param {string} resolutionNotes - Notes about resolution
 * @returns {Object} - Success status
 */
export const resolveSLAViolation = async (violationId, resolutionNotes) => {
  const db = getDatabase();
  
  try {
    await db`
      UPDATE sla_violations
      SET 
        resolved_at = NOW(),
        resolution_notes = ${resolutionNotes}
      WHERE id = ${violationId}
    `;

    console.log(`✅ SLA violation ${violationId} resolved`);
    return { success: true };
  } catch (error) {
    console.error(`Error resolving SLA violation ${violationId}:`, error);
    throw error;
  }
};

/**
 * Get unresolved SLA violations
 * @param {number} limit - Maximum number of violations to return
 * @returns {Array} - Array of unresolved violations
 */
export const getUnresolvedViolations = async (limit = 50) => {
  const db = getDatabase();
  
  try {
    const violations = await db`
      SELECT 
        v.*,
        c.chief_complaint,
        c.status as consultation_status,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        pr.first_name as provider_first_name,
        pr.last_name as provider_last_name
      FROM sla_violations v
      JOIN consultations c ON v.consultation_id = c.id
      JOIN patients p ON c.patient_id = p.id
      LEFT JOIN providers pr ON c.provider_id = pr.id
      WHERE v.resolved_at IS NULL
      ORDER BY v.created_at DESC
      LIMIT ${limit}
    `;

    return violations;
  } catch (error) {
    console.error('Error getting unresolved SLA violations:', error);
    throw error;
  }
};

export default {
  SLA_THRESHOLDS,
  checkSLACompliance,
  flagSLAViolation,
  notifySupervisor,
  trackResponseTime,
  getSLAMetrics,
  resolveSLAViolation,
  getUnresolvedViolations
};
