/**
 * @module config/roles
 * @description Role configuration for HIPAA-compliant access control
 * Defines roles, their hierarchy, and default permissions
 */

/**
 * Role definitions with hierarchy and metadata
 */
const ROLES = {
  admin: {
    name: 'Administrator',
    description: 'Full system access with administrative privileges',
    level: 100,
    isProvider: false,
    canManageUsers: true,
    canViewAuditLogs: true,
    canExportData: true,
    canAccessAllPatients: true,
    requiresMFA: true
  },
  
  provider: {
    name: 'Healthcare Provider',
    description: 'Licensed healthcare provider with patient care access',
    level: 50,
    isProvider: true,
    canManageUsers: false,
    canViewAuditLogs: false,
    canExportData: true,
    canAccessAllPatients: false,
    requiresMFA: true,
    requiresLicense: true
  },
  
  staff: {
    name: 'Medical Staff',
    description: 'Support staff with limited patient access',
    level: 30,
    isProvider: false,
    canManageUsers: false,
    canViewAuditLogs: false,
    canExportData: false,
    canAccessAllPatients: false,
    requiresMFA: false
  },
  
  patient: {
    name: 'Patient',
    description: 'Patient with access to own medical information',
    level: 10,
    isProvider: false,
    canManageUsers: false,
    canViewAuditLogs: false,
    canExportData: true,
    canAccessAllPatients: false,
    requiresMFA: false,
    isRestrictedToSelf: true
  }
};

/**
 * Role transition rules
 * Defines allowed role changes
 */
const ROLE_TRANSITIONS = {
  admin: {
    canChangeTo: ['admin', 'provider', 'staff', 'patient'],
    canBeChangedBy: ['admin']
  },
  provider: {
    canChangeTo: ['staff', 'patient'],
    canBeChangedBy: ['admin']
  },
  staff: {
    canChangeTo: ['patient'],
    canBeChangedBy: ['admin', 'provider']
  },
  patient: {
    canChangeTo: [],
    canBeChangedBy: ['admin']
  }
};

/**
 * Feature flags per role
 * Controls access to specific features
 */
const FEATURE_FLAGS = {
  admin: {
    videoConsultation: true,
    prescriptionManagement: true,
    labResults: true,
    billing: true,
    analytics: true,
    bulkOperations: true,
    apiAccess: true,
    webhooks: true,
    integrations: true,
    auditReports: true
  },
  
  provider: {
    videoConsultation: true,
    prescriptionManagement: true,
    labResults: true,
    billing: false,
    analytics: true,
    bulkOperations: false,
    apiAccess: true,
    webhooks: false,
    integrations: true,
    auditReports: false
  },
  
  staff: {
    videoConsultation: true,
    prescriptionManagement: false,
    labResults: true,
    billing: true,
    analytics: false,
    bulkOperations: false,
    apiAccess: false,
    webhooks: false,
    integrations: false,
    auditReports: false
  },
  
  patient: {
    videoConsultation: true,
    prescriptionManagement: false,
    labResults: true,
    billing: true,
    analytics: false,
    bulkOperations: false,
    apiAccess: false,
    webhooks: false,
    integrations: false,
    auditReports: false
  }
};

/**
 * Data access scopes per role
 * Defines what data each role can access
 */
const DATA_SCOPES = {
  admin: {
    patients: 'all',
    appointments: 'all',
    records: 'all',
    prescriptions: 'all',
    billing: 'all',
    audit: 'all'
  },
  
  provider: {
    patients: 'assigned',
    appointments: 'own',
    records: 'patient-assigned',
    prescriptions: 'own',
    billing: 'none',
    audit: 'own-actions'
  },
  
  staff: {
    patients: 'scheduled',
    appointments: 'department',
    records: 'read-only',
    prescriptions: 'read-only',
    billing: 'create-view',
    audit: 'none'
  },
  
  patient: {
    patients: 'self',
    appointments: 'self',
    records: 'self',
    prescriptions: 'self',
    billing: 'self',
    audit: 'none'
  }
};

/**
 * Time-based access restrictions
 * Defines when roles can access the system
 */
const ACCESS_SCHEDULES = {
  admin: {
    allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    allowedHours: { start: 0, end: 24 },
    timezone: 'UTC'
  },
  
  provider: {
    allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    allowedHours: { start: 0, end: 24 },
    timezone: 'local'
  },
  
  staff: {
    allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    allowedHours: { start: 6, end: 22 },
    timezone: 'local'
  },
  
  patient: {
    allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    allowedHours: { start: 0, end: 24 },
    timezone: 'local'
  }
};

/**
 * Check if a role can perform an action
 * @param {string} role - Role name
 * @param {string} action - Action to check
 * @returns {boolean} True if allowed
 */
function canPerformAction(role, action) {
  const roleConfig = ROLES[role];
  if (!roleConfig) return false;
  
  switch (action) {
    case 'manage_users':
      return roleConfig.canManageUsers;
    case 'view_audit':
      return roleConfig.canViewAuditLogs;
    case 'export_data':
      return roleConfig.canExportData;
    case 'access_all_patients':
      return roleConfig.canAccessAllPatients;
    default:
      return false;
  }
}

/**
 * Check if a role transition is allowed
 * @param {string} fromRole - Current role
 * @param {string} toRole - Target role
 * @param {string} changerRole - Role of user making the change
 * @returns {boolean} True if transition allowed
 */
function canTransitionRole(fromRole, toRole, changerRole) {
  const transition = ROLE_TRANSITIONS[fromRole];
  if (!transition) return false;
  
  return transition.canChangeTo.includes(toRole) &&
         transition.canBeChangedBy.includes(changerRole);
}

/**
 * Get role hierarchy level
 * @param {string} role - Role name
 * @returns {number} Hierarchy level
 */
function getRoleLevel(role) {
  const roleConfig = ROLES[role];
  return roleConfig ? roleConfig.level : 0;
}

/**
 * Check if role has higher privileges
 * @param {string} role1 - First role
 * @param {string} role2 - Second role
 * @returns {boolean} True if role1 has higher privileges
 */
function hasHigherPrivileges(role1, role2) {
  return getRoleLevel(role1) > getRoleLevel(role2);
}

/**
 * Get feature flags for a role
 * @param {string} role - Role name
 * @returns {Object} Feature flags
 */
function getFeatureFlags(role) {
  return FEATURE_FLAGS[role] || {};
}

/**
 * Check if role has access to feature
 * @param {string} role - Role name
 * @param {string} feature - Feature name
 * @returns {boolean} True if feature enabled
 */
function hasFeatureAccess(role, feature) {
  const flags = getFeatureFlags(role);
  return flags[feature] === true;
}

/**
 * Get data access scope for role
 * @param {string} role - Role name
 * @param {string} dataType - Type of data
 * @returns {string} Access scope
 */
function getDataScope(role, dataType) {
  const scopes = DATA_SCOPES[role];
  return scopes ? scopes[dataType] : 'none';
}

/**
 * Check if access is allowed based on schedule
 * @param {string} role - Role name
 * @param {Date} timestamp - Access timestamp
 * @returns {boolean} True if access allowed
 */
function isAccessAllowedBySchedule(role, timestamp = new Date()) {
  const schedule = ACCESS_SCHEDULES[role];
  if (!schedule) return false;
  
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = days[timestamp.getDay()];
  
  if (!schedule.allowedDays.includes(dayName)) {
    return false;
  }
  
  const hour = timestamp.getHours();
  if (hour < schedule.allowedHours.start || hour >= schedule.allowedHours.end) {
    return false;
  }
  
  return true;
}

/**
 * Get all roles
 * @returns {Array} List of role names
 */
function getAllRoles() {
  return Object.keys(ROLES);
}

/**
 * Get role configuration
 * @param {string} role - Role name
 * @returns {Object} Role configuration
 */
function getRoleConfig(role) {
  return ROLES[role] || null;
}

module.exports = {
  ROLES,
  ROLE_TRANSITIONS,
  FEATURE_FLAGS,
  DATA_SCOPES,
  ACCESS_SCHEDULES,
  canPerformAction,
  canTransitionRole,
  getRoleLevel,
  hasHigherPrivileges,
  getFeatureFlags,
  hasFeatureAccess,
  getDataScope,
  isAccessAllowedBySchedule,
  getAllRoles,
  getRoleConfig
};
