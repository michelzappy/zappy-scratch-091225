/**
 * HIPAA Audit Logging Middleware
 * Provides comprehensive audit logging for all PHI access
 * Required for HIPAA compliance and forensic analysis
 */

import { getDatabase } from '../config/database.js';

/**
 * PHI field patterns to identify sensitive data
 */
const PHI_FIELDS = [
  'ssn', 'social_security', 
  'dob', 'date_of_birth', 'birth_date',
  'phone', 'telephone', 'mobile',
  'email', 'email_address',
  'address', 'street', 'city', 'state', 'zip', 'postal',
  'medical_record', 'mrn',
  'insurance', 'policy_number',
  'diagnosis', 'condition', 'symptoms',
  'medications', 'prescriptions',
  'allergies', 'medical_history'
];

/**
 * Extract patient ID from request
 * @param {Object} req - Express request object
 * @returns {string|null} - Patient ID if found
 */
const extractPatientId = (req) => {
  // Check URL parameters
  if (req.params.patientId) return req.params.patientId;
  if (req.params.id && req.path.includes('/patient')) return req.params.id;
  
  // Check query parameters
  if (req.query.patientId) return req.query.patientId;
  
  // Check request body
  if (req.body && req.body.patientId) return req.body.patientId;
  if (req.body && req.body.patient_id) return req.body.patient_id;
  
  return null;
};

/**
 * Identify resource type from endpoint
 * @param {string} path - Request path
 * @returns {string} - Resource type
 */
const identifyResourceType = (path) => {
  if (path.includes('/consultation')) return 'consultation';
  if (path.includes('/patient')) return 'patient';
  if (path.includes('/prescription')) return 'prescription';
  if (path.includes('/order')) return 'order';
  if (path.includes('/provider')) return 'provider';
  if (path.includes('/message')) return 'message';
  return 'unknown';
};

/**
 * Identify PHI fields in data object
 * @param {Object} data - Data object to scan
 * @returns {Array} - Array of PHI field names found
 */
const identifyPHIFields = (data) => {
  if (!data || typeof data !== 'object') return [];
  
  const foundFields = [];
  const dataString = JSON.stringify(data).toLowerCase();
  
  for (const field of PHI_FIELDS) {
    if (dataString.includes(field)) {
      foundFields.push(field);
    }
  }
  
  return [...new Set(foundFields)]; // Remove duplicates
};

/**
 * Main HIPAA audit logging middleware
 * Logs all requests that access PHI
 */
export const hipaaAuditLog = async (req, res, next) => {
  const startTime = Date.now();
  
  // Skip audit logging for non-PHI endpoints
  const skipPaths = ['/health', '/metrics', '/favicon.ico', '/static'];
  if (skipPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  // Capture original response methods
  const originalSend = res.send;
  const originalJson = res.json;
  let responseData = null;

  // Override send method
  res.send = function(data) {
    responseData = data;
    return originalSend.call(this, data);
  };

  // Override json method
  res.json = function(data) {
    responseData = data;
    return originalJson.call(this, data);
  };

  // Wait for response to complete
  res.on('finish', async () => {
    const endTime = Date.now();
    
    try {
      const db = getDatabase();
      
      // Determine if PHI was accessed
      const resourceType = identifyResourceType(req.path);
      const dataAccessed = res.statusCode >= 200 && res.statusCode < 300;
      const patientId = extractPatientId(req);
      
      // Identify PHI fields in response
      let phiFields = [];
      if (responseData && dataAccessed) {
        try {
          const parsedResponse = typeof responseData === 'string' 
            ? JSON.parse(responseData) 
            : responseData;
          phiFields = identifyPHIFields(parsedResponse);
        } catch (e) {
          // If parsing fails, assume PHI might be present
          phiFields = ['response_data'];
        }
      }

      // Only log if PHI was potentially accessed
      const isPHIAccess = 
        patientId !== null || 
        ['consultation', 'patient', 'prescription', 'order'].includes(resourceType) ||
        phiFields.length > 0;

      if (isPHIAccess) {
        await db`
          INSERT INTO hipaa_audit_logs (
            user_id,
            user_role,
            action,
            resource_type,
            resource_id,
            patient_id,
            endpoint,
            method,
            status_code,
            ip_address,
            user_agent,
            session_id,
            access_justification,
            emergency_access,
            data_accessed,
            phi_fields_accessed,
            response_time_ms,
            success,
            error_message,
            created_at
          ) VALUES (
            ${req.user?.id || null},
            ${req.user?.role || 'anonymous'},
            ${req.method},
            ${resourceType},
            ${req.params.id || null},
            ${patientId},
            ${req.path},
            ${req.method},
            ${res.statusCode},
            ${req.ip || req.connection.remoteAddress},
            ${req.headers['user-agent'] || null},
            ${req.sessionID || null},
            ${req.headers['x-access-justification'] || null},
            ${req.headers['x-emergency-access'] === 'true'},
            ${dataAccessed},
            ${phiFields},
            ${endTime - startTime},
            ${res.statusCode < 400},
            ${res.statusCode >= 400 ? `HTTP ${res.statusCode}` : null},
            NOW()
          )
        `;

        // Log to console for immediate visibility
        console.log(`🔒 HIPAA Audit: ${req.user?.role || 'anonymous'} ${req.method} ${req.path} - ${res.statusCode} (${endTime - startTime}ms)`);
      }
    } catch (error) {
      console.error('❌ HIPAA audit logging failed:', error);
      // Don't throw - audit failure shouldn't break the application
    }
  });

  next();
};

/**
 * Require access justification for sensitive operations
 * @param {string} requiredReason - Type of justification required
 */
export const requireAccessJustification = (requiredReason = 'any') => {
  return (req, res, next) => {
    const justification = req.headers['x-access-justification'];
    
    if (!justification || justification.trim().length === 0) {
      return res.status(403).json({
        error: 'Access justification required',
        code: 'JUSTIFICATION_REQUIRED',
        message: 'You must provide a justification for accessing this patient data'
      });
    }

    // In production, validate justification meets minimum requirements
    if (justification.length < 10) {
      return res.status(403).json({
        error: 'Invalid access justification',
        code: 'INVALID_JUSTIFICATION',
        message: 'Justification must be at least 10 characters'
      });
    }

    next();
  };
};

/**
 * Log break-the-glass emergency access
 */
export const logEmergencyAccess = async (req, res, next) => {
  if (req.headers['x-emergency-access'] === 'true') {
    console.warn(`🚨 EMERGENCY ACCESS: ${req.user?.role} ${req.user?.id} accessing ${req.path}`);
    
    // In production, send immediate alert to security team
    // await securityService.alertEmergencyAccess({
    //   userId: req.user?.id,
    //   path: req.path,
    //   timestamp: new Date()
    // });
  }
  next();
};

/**
 * Get audit logs for a specific patient
 * @param {string} patientId - Patient UUID
 * @param {Object} options - Query options
 * @returns {Array} - Array of audit logs
 */
export const getPatientAuditLogs = async (patientId, options = {}) => {
  const db = getDatabase();
  const { limit = 100, offset = 0, startDate, endDate } = options;
  
  try {
    let whereConditions = ['patient_id = $1'];
    let params = [patientId];
    let paramIndex = 2;

    if (startDate) {
      whereConditions.push(`created_at >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`created_at <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const logs = await db.unsafe(`
      SELECT 
        id,
        user_id,
        user_role,
        action,
        resource_type,
        resource_id,
        endpoint,
        status_code,
        emergency_access,
        access_justification,
        phi_fields_accessed,
        created_at
      FROM hipaa_audit_logs
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset]);

    return logs;
  } catch (error) {
    console.error(`Error fetching audit logs for patient ${patientId}:`, error);
    throw error;
  }
};

/**
 * Get suspicious access patterns
 * Identifies potential security concerns
 * @returns {Array} - Array of suspicious activities
 */
export const getSuspiciousAccessPatterns = async () => {
  const db = getDatabase();
  
  try {
    // Look for multiple failed attempts
    const suspiciousActivity = await db`
      SELECT 
        user_id,
        user_role,
        COUNT(*) as failed_attempts,
        MAX(created_at) as last_attempt,
        array_agg(DISTINCT endpoint) as attempted_endpoints
      FROM hipaa_audit_logs
      WHERE 
        success = false 
        AND created_at > NOW() - INTERVAL '1 hour'
      GROUP BY user_id, user_role
      HAVING COUNT(*) > 5
      ORDER BY failed_attempts DESC
      LIMIT 50
    `;

    // Look for emergency access patterns
    const emergencyAccess = await db`
      SELECT 
        user_id,
        user_role,
        COUNT(*) as emergency_count,
        array_agg(DISTINCT patient_id) as accessed_patients,
        MAX(created_at) as last_emergency_access
      FROM hipaa_audit_logs
      WHERE 
        emergency_access = true
        AND created_at > NOW() - INTERVAL '24 hours'
      GROUP BY user_id, user_role
      ORDER BY emergency_count DESC
      LIMIT 50
    `;

    // Look for unusual access volumes
    const highVolumeAccess = await db`
      SELECT 
        user_id,
        user_role,
        COUNT(DISTINCT patient_id) as unique_patients_accessed,
        COUNT(*) as total_accesses,
        MAX(created_at) as last_access
      FROM hipaa_audit_logs
      WHERE 
        patient_id IS NOT NULL
        AND created_at > NOW() - INTERVAL '1 hour'
      GROUP BY user_id, user_role
      HAVING COUNT(DISTINCT patient_id) > 20
      ORDER BY unique_patients_accessed DESC
      LIMIT 50
    `;

    return {
      multipleFailedAttempts: suspiciousActivity,
      emergencyAccessPatterns: emergencyAccess,
      highVolumeAccess: highVolumeAccess
    };
  } catch (error) {
    console.error('Error detecting suspicious access patterns:', error);
    throw error;
  }
};

/**
 * Export audit logs for compliance reporting
 * @param {Object} filters - Export filters
 * @returns {Array} - Array of audit logs
 */
export const exportAuditLogs = async (filters = {}) => {
  const db = getDatabase();
  const { startDate, endDate, userId, patientId, resourceType } = filters;
  
  try {
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (startDate) {
      whereConditions.push(`created_at >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`created_at <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    if (userId) {
      whereConditions.push(`user_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }

    if (patientId) {
      whereConditions.push(`patient_id = $${paramIndex}`);
      params.push(patientId);
      paramIndex++;
    }

    if (resourceType) {
      whereConditions.push(`resource_type = $${paramIndex}`);
      params.push(resourceType);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const logs = await db.unsafe(`
      SELECT *
      FROM hipaa_audit_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 10000
    `, params);

    // Log the export itself
    await db`
      INSERT INTO hipaa_audit_logs (
        user_id,
        user_role,
        action,
        resource_type,
        endpoint,
        method,
        status_code,
        success,
        created_at
      ) VALUES (
        ${filters.exportedBy || null},
        'admin',
        'EXPORT',
        'audit_logs',
        '/api/audit/export',
        'POST',
        200,
        true,
        NOW()
      )
    `;

    return logs;
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    throw error;
  }
};

export default {
  hipaaAuditLog,
  requireAccessJustification,
  logEmergencyAccess,
  getPatientAuditLogs,
  getSuspiciousAccessPatterns,
  exportAuditLogs
};
