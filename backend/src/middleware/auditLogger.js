/**
 * @module middleware/auditLogger
 * @description HIPAA-compliant audit logging middleware
 * Tracks all PHI access and modifications for compliance
 */

import AuditLog from '../models/AuditLog.js';
import logger from '../utils/logger.js';
import { getClientIp } from '../utils/helpers.js';

/**
 * PHI-related endpoints that require audit logging
 */
const PHI_ENDPOINTS = [
  '/api/patients',
  '/api/appointments',
  '/api/records',
  '/api/prescriptions',
  '/api/providers',
  '/api/admin/users'
];

/**
 * Actions that should be audited
 */
const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  EXPORT: 'EXPORT',
  PRINT: 'PRINT',
  SHARE: 'SHARE',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS'
};

/**
 * Check if endpoint handles PHI data
 * @param {string} path - Request path
 * @returns {boolean} True if endpoint handles PHI
 */
const isPHIEndpoint = (path) => {
  return PHI_ENDPOINTS.some(endpoint => path.startsWith(endpoint));
};

/**
 * Determine action type from HTTP method
 * @param {string} method - HTTP method
 * @returns {string} Action type
 */
const getActionFromMethod = (method) => {
  const methodMap = {
    'GET': AUDIT_ACTIONS.READ,
    'POST': AUDIT_ACTIONS.CREATE,
    'PUT': AUDIT_ACTIONS.UPDATE,
    'PATCH': AUDIT_ACTIONS.UPDATE,
    'DELETE': AUDIT_ACTIONS.DELETE
  };
  return methodMap[method.toUpperCase()] || 'UNKNOWN';
};

/**
 * Extract resource information from request
 * @param {Object} req - Express request object
 * @returns {Object} Resource information
 */
const extractResourceInfo = (req) => {
  const pathParts = req.path.split('/').filter(Boolean);
  
  let resourceType = null;
  let resourceId = null;
  
  // Extract resource type and ID from path
  if (pathParts.length >= 2) {
    resourceType = pathParts[1]; // e.g., 'patients', 'appointments'
    
    // Check if there's an ID in the path
    if (pathParts.length >= 3 && !isNaN(pathParts[2])) {
      resourceId = pathParts[2];
    } else if (req.params.id) {
      resourceId = req.params.id;
    }
  }
  
  // Also check request body for resource ID in create/update operations
  if (!resourceId && req.body && req.body.id) {
    resourceId = req.body.id;
  }
  
  return { resourceType, resourceId };
};

/**
 * Create audit log entry
 * @param {Object} logData - Audit log data
 * @returns {Promise<void>}
 */
const createAuditLog = async (logData) => {
  try {
    await AuditLog.create(logData);
  } catch (error) {
    // Log error but don't fail the request
    logger.error('Failed to create audit log', { error: error.message, logData });
  }
};

/**
 * Main audit logging middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const auditLogger = async (req, res, next) => {
  // Skip if not a PHI endpoint
  if (!isPHIEndpoint(req.path)) {
    return next();
  }
  
  const startTime = Date.now();
  const { resourceType, resourceId } = extractResourceInfo(req);
  
  // Prepare audit log data
  const auditData = {
    userId: req.user?.id || null,
    userEmail: req.user?.email || 'anonymous',
    action: getActionFromMethod(req.method),
    resourceType,
    resourceId,
    requestPath: req.path,
    requestMethod: req.method,
    ipAddress: getClientIp(req),
    userAgent: req.get('user-agent'),
    timestamp: new Date(),
    sessionId: req.session?.id || req.headers['x-session-id'],
    requestId: req.requestId
  };
  
  // Store original end function
  const originalEnd = res.end;
  
  // Override res.end to capture response status
  res.end = function(...args) {
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Update audit data with response information
    auditData.responseStatus = res.statusCode;
    auditData.responseTime = responseTime;
    auditData.success = res.statusCode < 400;
    
    // Add additional details based on status
    if (res.statusCode >= 400) {
      auditData.errorMessage = res.statusMessage;
      
      // Log unauthorized access attempts
      if (res.statusCode === 401 || res.statusCode === 403) {
        auditData.action = AUDIT_ACTIONS.UNAUTHORIZED_ACCESS;
      }
    }
    
    // Add request details for POST/PUT operations (excluding sensitive data)
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const sanitizedBody = { ...req.body };
      // Remove sensitive fields
      delete sanitizedBody.password;
      delete sanitizedBody.ssn;
      delete sanitizedBody.creditCard;
      
      auditData.requestData = JSON.stringify(sanitizedBody);
    }
    
    // Create audit log asynchronously
    createAuditLog(auditData);
    
    // Call original end function
    originalEnd.apply(res, args);
  };
  
  next();
};

/**
 * Audit specific actions (can be called directly from routes)
 * @param {string} action - Action to audit
 * @param {Object} details - Additional details
 * @returns {Function} Express middleware
 */
const auditAction = (action, details = {}) => {
  return async (req, res, next) => {
    const auditData = {
      userId: req.user?.id || null,
      userEmail: req.user?.email || 'anonymous',
      action,
      resourceType: details.resourceType || 'custom',
      resourceId: details.resourceId || req.params.id,
      requestPath: req.path,
      requestMethod: req.method,
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
      timestamp: new Date(),
      sessionId: req.session?.id || req.headers['x-session-id'],
      requestId: req.requestId,
      success: true,
      details: JSON.stringify(details)
    };
    
    await createAuditLog(auditData);
    next();
  };
};

/**
 * Audit login attempts
 * @param {Object} req - Express request object
 * @param {string} email - User email
 * @param {boolean} success - Login success status
 * @param {string} reason - Failure reason if applicable
 */
const auditLogin = async (req, email, success, reason = null) => {
  const auditData = {
    userId: null,
    userEmail: email,
    action: AUDIT_ACTIONS.LOGIN,
    resourceType: 'authentication',
    resourceId: null,
    requestPath: req.path,
    requestMethod: req.method,
    ipAddress: getClientIp(req),
    userAgent: req.get('user-agent'),
    timestamp: new Date(),
    sessionId: req.session?.id || req.headers['x-session-id'],
    requestId: req.requestId,
    success,
    errorMessage: reason
  };
  
  await createAuditLog(auditData);
};

/**
 * Audit logout
 * @param {Object} req - Express request object
 */
const auditLogout = async (req) => {
  const auditData = {
    userId: req.user?.id || null,
    userEmail: req.user?.email || 'unknown',
    action: AUDIT_ACTIONS.LOGOUT,
    resourceType: 'authentication',
    resourceId: null,
    requestPath: req.path,
    requestMethod: req.method,
    ipAddress: getClientIp(req),
    userAgent: req.get('user-agent'),
    timestamp: new Date(),
    sessionId: req.session?.id || req.headers['x-session-id'],
    requestId: req.requestId,
    success: true
  };
  
  await createAuditLog(auditData);
};

/**
 * Audit data export operations
 * @param {Object} req - Express request object
 * @param {string} exportType - Type of export
 * @param {Object} filters - Export filters applied
 */
const auditExport = async (req, exportType, filters = {}) => {
  const auditData = {
    userId: req.user?.id || null,
    userEmail: req.user?.email || 'unknown',
    action: AUDIT_ACTIONS.EXPORT,
    resourceType: exportType,
    resourceId: null,
    requestPath: req.path,
    requestMethod: req.method,
    ipAddress: getClientIp(req),
    userAgent: req.get('user-agent'),
    timestamp: new Date(),
    sessionId: req.session?.id || req.headers['x-session-id'],
    requestId: req.requestId,
    success: true,
    details: JSON.stringify({ exportType, filters })
  };
  
  await createAuditLog(auditData);
};

export {
  auditLogger,
  auditAction,
  auditLogin,
  auditLogout,
  auditExport,
  AUDIT_ACTIONS
};
