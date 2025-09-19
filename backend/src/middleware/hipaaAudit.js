import bcrypt from 'bcryptjs';
import { getDatabase } from '../config/database.js';
import { AppError } from '../errors/AppError.js';

// HIPAA-compliant audit logging middleware
// Logs patient data access without storing sensitive information

// Salt for consistent patient ID hashing
const AUDIT_SALT = process.env.HIPAA_AUDIT_SALT || '$2a$10$HIPAAAuditSaltForPatientIDs';

/**
 * Hash patient ID for HIPAA-compliant audit logging
 * Uses bcrypt for consistent, secure hashing
 */
const hashPatientId = (patientId) => {
  if (!patientId) return null;
  try {
    // Use bcrypt.hashSync with consistent salt for deterministic hashing
    return bcrypt.hashSync(patientId.toString(), AUDIT_SALT);
  } catch (error) {
    console.error('Failed to hash patient ID for audit:', error);
    return 'HASH_ERROR';
  }
};

/**
 * Extract patient ID from request
 * Handles various patient endpoint patterns
 */
const extractPatientId = (req) => {
  // Direct patient ID in params (/patients/:id)
  if (req.params.id) {
    return req.params.id;
  }
  
  // Patient accessing their own data (/patients/me)
  if (req.user && req.user.role === 'patient') {
    return req.user.id;
  }
  
  // Patient ID in request body (for updates)
  if (req.body && req.body.patient_id) {
    return req.body.patient_id;
  }
  
  return null;
};

/**
 * Sanitize query parameters for audit logging
 * Removes sensitive data while preserving audit trail
 */
const sanitizeQueryParams = (query) => {
  const sanitized = { ...query };
  
  // Remove potentially sensitive parameters
  delete sanitized.ssn;
  delete sanitized.dob;
  delete sanitized.phone;
  delete sanitized.email;
  delete sanitized.password;
  delete sanitized.token;
  
  return Object.keys(sanitized).length > 0 ? sanitized : null;
};

/**
 * Log audit entry asynchronously
 * Does not block request processing
 */
const logAuditEntry = async (auditData) => {
  try {
    const db = getDatabase();
    
    await db.raw(`
      INSERT INTO patient_access_audit (
        patient_id_hash,
        endpoint_accessed,
        http_method,
        accessed_by_user_id,
        accessed_by_role,
        access_timestamp,
        ip_address,
        user_agent,
        query_parameters
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      auditData.patient_id_hash,
      auditData.endpoint_accessed,
      auditData.http_method,
      auditData.accessed_by_user_id,
      auditData.accessed_by_role,
      auditData.access_timestamp,
      auditData.ip_address,
      auditData.user_agent,
      auditData.query_parameters ? JSON.stringify(auditData.query_parameters) : null
    ]);
    
  } catch (error) {
    // Log error but don't fail the request - patient care takes priority
    console.error('HIPAA audit logging failed:', error);
    
    // In production, this should be sent to monitoring/alerting system
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send alert to monitoring system
      console.error('CRITICAL: HIPAA audit logging failure in production');
    }
  }
};

/**
 * HIPAA Patient Data Access Audit Middleware
 * 
 * Logs all patient data access attempts with:
 * - Hashed patient identifiers (HIPAA compliant)
 * - Access timestamp and metadata
 * - User information (who accessed)
 * - Request details (what was accessed)
 * 
 * Does NOT log:
 * - Actual patient data
 * - Sensitive query parameters
 * - Response content
 */
export const hipaaAuditLogger = (req, res, next) => {
  // Skip audit logging for non-patient endpoints
  if (!req.originalUrl.includes('/patients')) {
    return next();
  }
  
  // Skip audit logging for health checks and system endpoints
  if (req.originalUrl.includes('/health') || req.originalUrl.includes('/status')) {
    return next();
  }
  
  try {
    // Extract patient ID from request
    const patientId = extractPatientId(req);
    
    if (!patientId) {
      // No patient ID found - skip audit (e.g., general patient list endpoints)
      return next();
    }
    
    // Prepare audit data
    const auditData = {
      patient_id_hash: hashPatientId(patientId),
      endpoint_accessed: req.originalUrl,
      http_method: req.method,
      accessed_by_user_id: req.user?.id || 'ANONYMOUS',
      accessed_by_role: req.user?.role || 'GUEST',
      access_timestamp: new Date(),
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent'),
      query_parameters: sanitizeQueryParams(req.query)
    };
    
    // Log audit entry asynchronously (don't await - don't block request)
    setImmediate(() => {
      logAuditEntry(auditData);
    });
    
    // Continue with request processing
    next();
    
  } catch (error) {
    // Log error but don't fail the request
    console.error('HIPAA audit middleware error:', error);
    
    // Continue with request - patient care takes priority over audit logging
    next();
  }
};

/**
 * Enhanced audit logger that also captures response status
 * Wraps response to capture status code for compliance reporting
 */
export const hipaaAuditLoggerWithResponse = (req, res, next) => {
  // Apply standard audit logging first
  hipaaAuditLogger(req, res, () => {
    // Capture response status when request completes
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log response status for audit trail
      if (req.originalUrl.includes('/patients') && extractPatientId(req)) {
        setImmediate(() => {
          logAuditEntry({
            patient_id_hash: hashPatientId(extractPatientId(req)),
            endpoint_accessed: `${req.originalUrl} [RESPONSE]`,
            http_method: req.method,
            accessed_by_user_id: req.user?.id || 'ANONYMOUS',
            accessed_by_role: req.user?.role || 'GUEST',
            access_timestamp: new Date(),
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.get('User-Agent'),
            query_parameters: { response_status: res.statusCode }
          });
        });
      }
      
      // Call original send
      return originalSend.call(this, data);
    };
    
    next();
  });
};

/**
 * HIPAA audit report generator
 * Generates audit reports for compliance purposes
 */
export const generateAuditReport = async (patientId, startDate, endDate) => {
  try {
    const db = getDatabase();
    const patientIdHash = hashPatientId(patientId);
    
    const auditEntries = await db.raw(`
      SELECT 
        endpoint_accessed,
        http_method,
        accessed_by_role,
        access_timestamp,
        query_parameters
      FROM patient_access_audit 
      WHERE patient_id_hash = ?
        AND access_timestamp BETWEEN ? AND ?
      ORDER BY access_timestamp DESC
    `, [patientIdHash, startDate, endDate]);
    
    return {
      patient_id_hash: patientIdHash,
      period: { start: startDate, end: endDate },
      total_access_events: auditEntries.rows.length,
      access_events: auditEntries.rows
    };
    
  } catch (error) {
    throw new AppError('Failed to generate audit report', 500, 'AUDIT_REPORT_FAILED');
  }
};

export default {
  hipaaAuditLogger,
  hipaaAuditLoggerWithResponse,
  generateAuditReport,
  hashPatientId
};