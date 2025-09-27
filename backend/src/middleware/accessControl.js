/**
 * @module middleware/accessControl
 * @description Role-based access control middleware for PHI protection
 * Implements HIPAA-compliant access restrictions
 */

import { AuthorizationError, ForbiddenError } from '../utils/customErrors.js';
import logger from '../utils/logger.js';
import { auditAction } from './auditLogger.js';

/**
 * Permission definitions for each role
 */
const PERMISSIONS = {
  admin: {
    patients: ['create', 'read', 'update', 'delete', 'export'],
    appointments: ['create', 'read', 'update', 'delete', 'export'],
    records: ['create', 'read', 'update', 'delete', 'export'],
    prescriptions: ['create', 'read', 'update', 'delete', 'export'],
    users: ['create', 'read', 'update', 'delete', 'export'],
    audit: ['read', 'export'],
    analytics: ['read', 'export'],
    settings: ['read', 'update']
  },
  
  provider: {
    patients: ['read', 'update'],
    appointments: ['create', 'read', 'update'],
    records: ['create', 'read', 'update'],
    prescriptions: ['create', 'read', 'update'],
    users: ['read:self', 'update:self'],
    audit: ['read:self'],
    analytics: ['read:limited']
  },
  
  staff: {
    patients: ['read', 'update:limited'],
    appointments: ['create', 'read', 'update'],
    records: ['read'],
    prescriptions: ['read'],
    users: ['read:self', 'update:self'],
    audit: []
  },
  
  patient: {
    patients: ['read:self', 'update:self'],
    appointments: ['create:self', 'read:self', 'update:self'],
    records: ['read:self'],
    prescriptions: ['read:self'],
    users: ['read:self', 'update:self'],
    audit: []
  }
};

/**
 * Check if user has permission for an action on a resource
 * @param {string} role - User role
 * @param {string} resource - Resource type
 * @param {string} action - Action to perform
 * @param {Object} context - Additional context for permission check
 * @returns {boolean} True if permission granted
 */
const hasPermission = (role, resource, action, context = {}) => {
  const rolePermissions = PERMISSIONS[role];
  
  if (!rolePermissions) {
    logger.warn(`Unknown role: ${role}`);
    return false;
  }
  
  const resourcePermissions = rolePermissions[resource];
  
  if (!resourcePermissions) {
    return false;
  }
  
  // Check for exact permission
  if (resourcePermissions.includes(action)) {
    return true;
  }
  
  // Check for self-restricted permission
  if (resourcePermissions.includes(`${action}:self`)) {
    return context.isSelf === true;
  }
  
  // Check for limited permission
  if (resourcePermissions.includes(`${action}:limited`)) {
    return context.isLimited === true;
  }
  
  return false;
};

/**
 * Middleware to check user authorization
 * @param {string|Array} requiredRoles - Required roles (optional)
 * @param {Object} options - Additional options
 * @returns {Function} Express middleware
 */
const requireAuth = (requiredRoles = null, options = {}) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      logger.warn('Unauthorized access attempt', {
        path: req.path,
        ip: req.ip
      });
      return next(new AuthorizationError('Authentication required'));
    }
    
    // Check role requirements
    if (requiredRoles) {
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      
      if (!roles.includes(req.user.role)) {
        logger.warn('Insufficient privileges', {
          userId: req.user.id,
          userRole: req.user.role,
          requiredRoles: roles,
          path: req.path
        });
        return next(new ForbiddenError('Insufficient privileges'));
      }
    }
    
    // Additional permission checks based on options
    if (options.checkOwnership) {
      // Will be checked in the route handler
      req.requireOwnership = true;
    }
    
    if (options.checkProvider) {
      // Will be checked in the route handler
      req.requireProvider = true;
    }
    
    next();
  };
};

/**
 * Middleware to check resource-specific permissions
 * @param {string} resource - Resource type
 * @param {string} action - Action being performed
 * @returns {Function} Express middleware
 */
const requirePermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthorizationError('Authentication required'));
    }
    
    // Determine context for permission check
    const context = {
      isSelf: false,
      isLimited: false
    };
    
    // Check if accessing own resource
    if (req.params.id === req.user.id || req.params.userId === req.user.id) {
      context.isSelf = true;
    }
    
    // Check if limited access (e.g., only certain fields)
    if (req.query.fields || req.body.limitedUpdate) {
      context.isLimited = true;
    }
    
    // Check permission
    if (!hasPermission(req.user.role, resource, action, context)) {
      logger.warn('Permission denied', {
        userId: req.user.id,
        userRole: req.user.role,
        resource,
        action,
        context,
        path: req.path
      });
      
      // Audit the unauthorized attempt
      auditAction('UNAUTHORIZED_ACCESS', {
        resource,
        action,
        reason: 'Permission denied'
      })(req, res, () => {});
      
      return next(new ForbiddenError('Permission denied'));
    }
    
    // Store permission context for use in route handlers
    req.permissionContext = {
      resource,
      action,
      ...context
    };
    
    next();
  };
};

/**
 * Middleware to check if user owns the resource
 * @param {Function} getResourceOwnerId - Function to get owner ID from request
 * @returns {Function} Express middleware
 */
const requireOwnership = (getResourceOwnerId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(new AuthorizationError('Authentication required'));
    }
    
    try {
      const ownerId = await getResourceOwnerId(req);
      
      if (ownerId !== req.user.id && req.user.role !== 'admin') {
        logger.warn('Ownership check failed', {
          userId: req.user.id,
          ownerId,
          resource: req.params.id,
          path: req.path
        });
        
        return next(new ForbiddenError('You do not have access to this resource'));
      }
      
      req.resourceOwnerId = ownerId;
      next();
    } catch (error) {
      logger.error('Error checking ownership', {
        error: error.message,
        userId: req.user.id,
        path: req.path
      });
      next(error);
    }
  };
};

/**
 * Middleware to check if provider has access to patient
 * @param {Function} getPatientId - Function to get patient ID from request
 * @returns {Function} Express middleware
 */
const requireProviderAccess = (getPatientId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(new AuthorizationError('Authentication required'));
    }
    
    // Admins always have access
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Only providers and staff can use this middleware
    if (!['provider', 'staff'].includes(req.user.role)) {
      return next(new ForbiddenError('Provider or staff access required'));
    }
    
    try {
      const patientId = await getPatientId(req);
      
      // Check if provider has an appointment or treatment relationship with patient
      // This would typically query the database
      const hasAccess = await checkProviderPatientRelationship(
        req.user.id,
        patientId
      );
      
      if (!hasAccess) {
        logger.warn('Provider access denied', {
          providerId: req.user.id,
          patientId,
          path: req.path
        });
        
        return next(new ForbiddenError('No treatment relationship with this patient'));
      }
      
      req.patientId = patientId;
      next();
    } catch (error) {
      logger.error('Error checking provider access', {
        error: error.message,
        userId: req.user.id,
        path: req.path
      });
      next(error);
    }
  };
};

/**
 * Check if provider has relationship with patient
 * @param {string} providerId - Provider ID
 * @param {string} patientId - Patient ID
 * @returns {Promise<boolean>} True if relationship exists
 */
async function checkProviderPatientRelationship(providerId, patientId) {
  // This would typically query the database
  // For now, return true as placeholder
  // In production, check appointments, treatment plans, etc.
  return true;
}

/**
 * Middleware to filter response data based on user permissions
 * @returns {Function} Express middleware
 */
const filterResponseData = () => {
  return (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
      // Skip filtering for admin users
      if (req.user && req.user.role === 'admin') {
        return originalJson.call(this, data);
      }
      
      // Apply role-based filtering
      if (data && req.permissionContext) {
        data = applyDataFiltering(data, req.user.role, req.permissionContext);
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Apply data filtering based on role and context
 * @param {*} data - Response data
 * @param {string} role - User role
 * @param {Object} context - Permission context
 * @returns {*} Filtered data
 */
function applyDataFiltering(data, role, context) {
  // Define sensitive fields per role
  const sensitiveFields = {
    patient: ['internalNotes', 'providerComments', 'billing'],
    staff: ['internalNotes'],
    provider: []
  };
  
  const fieldsToRemove = sensitiveFields[role] || [];
  
  if (fieldsToRemove.length === 0) {
    return data;
  }
  
  // Remove sensitive fields from response
  const filterObject = (obj) => {
    const filtered = { ...obj };
    fieldsToRemove.forEach(field => {
      delete filtered[field];
    });
    return filtered;
  };
  
  if (Array.isArray(data)) {
    return data.map(filterObject);
  } else if (data && typeof data === 'object') {
    if (data.data) {
      if (Array.isArray(data.data)) {
        data.data = data.data.map(filterObject);
      } else if (typeof data.data === 'object') {
        data.data = filterObject(data.data);
      }
    } else {
      data = filterObject(data);
    }
  }
  
  return data;
}

/**
 * Get available permissions for a role
 * @param {string} role - User role
 * @returns {Object} Available permissions
 */
const getRolePermissions = (role) => {
  return PERMISSIONS[role] || {};
};

/**
 * Check if role exists
 * @param {string} role - Role name
 * @returns {boolean} True if role exists
 */
const isValidRole = (role) => {
  return Object.keys(PERMISSIONS).includes(role);
};

export {
  requireAuth,
  requirePermission,
  requireOwnership,
  requireProviderAccess,
  filterResponseData,
  hasPermission,
  getRolePermissions,
  isValidRole,
  PERMISSIONS
};
