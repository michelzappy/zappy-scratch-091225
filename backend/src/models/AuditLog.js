/**
 * @module models/AuditLog
 * @description Audit log model for HIPAA compliance
 * Stores all PHI access and modification records
 */

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * AuditLog model definition
 */
const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'User who performed the action'
  },
  userEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Email of user who performed the action'
  },
  action: {
    type: DataTypes.ENUM(
      'CREATE',
      'READ',
      'UPDATE',
      'DELETE',
      'LOGIN',
      'LOGOUT',
      'EXPORT',
      'PRINT',
      'SHARE',
      'UNAUTHORIZED_ACCESS'
    ),
    allowNull: false,
    comment: 'Type of action performed'
  },
  resourceType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Type of resource accessed (patients, appointments, etc.)'
  },
  resourceId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ID of the specific resource accessed'
  },
  requestPath: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'API endpoint path'
  },
  requestMethod: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'HTTP method used'
  },
  requestData: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Sanitized request body (for POST/PUT)'
  },
  responseStatus: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'HTTP response status code'
  },
  responseTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Response time in milliseconds'
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Client IP address'
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User agent string'
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Session identifier'
  },
  requestId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Unique request identifier for tracing'
  },
  success: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether the action was successful'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Error message if action failed'
  },
  details: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional details about the action'
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
    comment: 'When the action occurred'
  }
}, {
  tableName: 'audit_logs',
  timestamps: false, // We're using our own timestamp field
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['userEmail']
    },
    {
      fields: ['action']
    },
    {
      fields: ['resourceType']
    },
    {
      fields: ['resourceId']
    },
    {
      fields: ['timestamp']
    },
    {
      fields: ['success']
    },
    {
      fields: ['requestId']
    },
    {
      fields: ['sessionId']
    }
  ],
  // Prevent any updates to audit logs
  hooks: {
    beforeUpdate: () => {
      throw new Error('Audit logs cannot be modified');
    },
    beforeDestroy: () => {
      throw new Error('Audit logs cannot be deleted');
    }
  }
});

/**
 * Static methods for audit log queries
 */

/**
 * Get audit logs for a specific user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Audit logs
 */
AuditLog.getByUser = async function(userId, options = {}) {
  const { limit = 100, offset = 0, startDate, endDate } = options;
  
  const where = { userId };
  
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp[Op.gte] = startDate;
    if (endDate) where.timestamp[Op.lte] = endDate;
  }
  
  return this.findAll({
    where,
    limit,
    offset,
    order: [['timestamp', 'DESC']]
  });
};

/**
 * Get audit logs for a specific resource
 * @param {string} resourceType - Resource type
 * @param {string} resourceId - Resource ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Audit logs
 */
AuditLog.getByResource = async function(resourceType, resourceId, options = {}) {
  const { limit = 100, offset = 0 } = options;
  
  return this.findAll({
    where: {
      resourceType,
      resourceId
    },
    limit,
    offset,
    order: [['timestamp', 'DESC']]
  });
};

/**
 * Get failed access attempts
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Failed access logs
 */
AuditLog.getFailedAttempts = async function(options = {}) {
  const { limit = 100, offset = 0, startDate, endDate } = options;
  
  const where = {
    success: false,
    action: 'UNAUTHORIZED_ACCESS'
  };
  
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp[Op.gte] = startDate;
    if (endDate) where.timestamp[Op.lte] = endDate;
  }
  
  return this.findAll({
    where,
    limit,
    offset,
    order: [['timestamp', 'DESC']]
  });
};

/**
 * Get audit logs by date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Audit logs
 */
AuditLog.getByDateRange = async function(startDate, endDate, options = {}) {
  const { limit = 1000, offset = 0 } = options;
  
  return this.findAll({
    where: {
      timestamp: {
        [Op.between]: [startDate, endDate]
      }
    },
    limit,
    offset,
    order: [['timestamp', 'DESC']]
  });
};

/**
 * Generate audit report
 * @param {Object} filters - Report filters
 * @returns {Promise<Object>} Audit report data
 */
AuditLog.generateReport = async function(filters = {}) {
  const { startDate, endDate, userId, action, resourceType } = filters;
  
  const where = {};
  
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp[Op.gte] = startDate;
    if (endDate) where.timestamp[Op.lte] = endDate;
  }
  
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (resourceType) where.resourceType = resourceType;
  
  const logs = await this.findAll({
    where,
    order: [['timestamp', 'DESC']]
  });
  
  // Generate summary statistics
  const summary = {
    totalActions: logs.length,
    successfulActions: logs.filter(l => l.success).length,
    failedActions: logs.filter(l => !l.success).length,
    uniqueUsers: [...new Set(logs.map(l => l.userId))].length,
    actionBreakdown: {},
    resourceBreakdown: {}
  };
  
  // Count actions by type
  logs.forEach(log => {
    summary.actionBreakdown[log.action] = (summary.actionBreakdown[log.action] || 0) + 1;
    if (log.resourceType) {
      summary.resourceBreakdown[log.resourceType] = (summary.resourceBreakdown[log.resourceType] || 0) + 1;
    }
  });
  
  return {
    summary,
    logs: logs.slice(0, 1000) // Limit detailed logs to 1000
  };
};

export default AuditLog;
