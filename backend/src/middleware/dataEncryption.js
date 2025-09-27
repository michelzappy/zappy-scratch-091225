/**
 * @module middleware/dataEncryption
 * @description Middleware for automatic PHI encryption/decryption
 * Handles encryption of sensitive data in requests and responses
 */

const { encryptFields, decryptFields } = require('../utils/encryption');
const logger = require('../utils/logger');

/**
 * PHI fields that should be encrypted at rest
 */
const PHI_FIELDS = {
  // Patient data
  patients: [
    'ssn',
    'dateOfBirth',
    'medicalRecordNumber',
    'insurance.policyNumber',
    'insurance.groupNumber',
    'emergencyContact.phone',
    'emergencyContact.email'
  ],
  
  // Medical records
  records: [
    'content',
    'diagnosis',
    'treatment',
    'medications',
    'allergies',
    'notes'
  ],
  
  // Prescriptions
  prescriptions: [
    'instructions',
    'notes'
  ],
  
  // User personal data
  users: [
    'phoneNumber',
    'address',
    'emergencyContact'
  ]
};

/**
 * Determine resource type from request path
 * @param {string} path - Request path
 * @returns {string|null} Resource type
 */
const getResourceType = (path) => {
  const pathParts = path.split('/').filter(Boolean);
  if (pathParts.length >= 2) {
    return pathParts[1]; // e.g., 'patients', 'records'
  }
  return null;
};

/**
 * Deep encrypt nested fields in an object
 * @param {Object} obj - Object to encrypt
 * @param {Array<string>} fieldPaths - Field paths to encrypt (supports dot notation)
 * @param {string} context - Encryption context
 * @returns {Object} Object with encrypted fields
 */
const deepEncryptFields = (obj, fieldPaths, context) => {
  const result = { ...obj };
  
  fieldPaths.forEach(path => {
    const parts = path.split('.');
    let current = result;
    
    // Navigate to parent of target field
    for (let i = 0; i < parts.length - 1; i++) {
      if (current[parts[i]] === undefined) {
        return; // Field doesn't exist, skip
      }
      current = current[parts[i]];
    }
    
    // Encrypt the final field
    const fieldName = parts[parts.length - 1];
    if (current[fieldName] !== undefined && current[fieldName] !== null) {
      const { encrypt } = require('../utils/encryption');
      const encryptedData = encrypt(String(current[fieldName]), context);
      current[fieldName] = encryptedData.encrypted;
      current[`${fieldName}_encrypted`] = true;
    }
  });
  
  return result;
};

/**
 * Deep decrypt nested fields in an object
 * @param {Object} obj - Object to decrypt
 * @param {Array<string>} fieldPaths - Field paths to decrypt (supports dot notation)
 * @param {string} context - Decryption context
 * @returns {Object} Object with decrypted fields
 */
const deepDecryptFields = (obj, fieldPaths, context) => {
  const result = { ...obj };
  
  fieldPaths.forEach(path => {
    const parts = path.split('.');
    let current = result;
    
    // Navigate to parent of target field
    for (let i = 0; i < parts.length - 1; i++) {
      if (current[parts[i]] === undefined) {
        return; // Field doesn't exist, skip
      }
      current = current[parts[i]];
    }
    
    // Decrypt the final field
    const fieldName = parts[parts.length - 1];
    if (current[fieldName] && current[`${fieldName}_encrypted`]) {
      try {
        const { decrypt } = require('../utils/encryption');
        current[fieldName] = decrypt(
          { encrypted: current[fieldName], context },
          context
        );
        delete current[`${fieldName}_encrypted`];
      } catch (error) {
        logger.error(`Failed to decrypt field ${path}`, { error: error.message });
        current[fieldName] = null;
      }
    }
  });
  
  return result;
};

/**
 * Middleware to encrypt PHI data in request bodies
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const encryptRequest = async (req, res, next) => {
  // Only process POST, PUT, PATCH requests with bodies
  if (!['POST', 'PUT', 'PATCH'].includes(req.method) || !req.body) {
    return next();
  }
  
  try {
    const resourceType = getResourceType(req.path);
    const phiFields = PHI_FIELDS[resourceType];
    
    if (!phiFields || phiFields.length === 0) {
      return next();
    }
    
    // Use user ID as encryption context
    const context = req.user?.id || 'system';
    
    // Encrypt fields in request body
    req.body = deepEncryptFields(req.body, phiFields, context);
    
    // Mark that encryption was applied
    req.encryptionApplied = true;
    
    next();
  } catch (error) {
    logger.error('Failed to encrypt request data', {
      error: error.message,
      path: req.path,
      method: req.method
    });
    next(error);
  }
};

/**
 * Middleware to decrypt PHI data in responses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const decryptResponse = (req, res, next) => {
  // Store original json method
  const originalJson = res.json;
  
  res.json = function(data) {
    try {
      const resourceType = getResourceType(req.path);
      const phiFields = PHI_FIELDS[resourceType];
      
      if (!phiFields || phiFields.length === 0) {
        return originalJson.call(this, data);
      }
      
      // Use user ID as decryption context
      const context = req.user?.id || 'system';
      
      // Decrypt fields based on response structure
      if (data && typeof data === 'object') {
        if (Array.isArray(data)) {
          // Array of resources
          data = data.map(item => deepDecryptFields(item, phiFields, context));
        } else if (data.data) {
          // Wrapped response with data field
          if (Array.isArray(data.data)) {
            data.data = data.data.map(item => deepDecryptFields(item, phiFields, context));
          } else if (typeof data.data === 'object') {
            data.data = deepDecryptFields(data.data, phiFields, context);
          }
        } else {
          // Single resource
          data = deepDecryptFields(data, phiFields, context);
        }
      }
      
      return originalJson.call(this, data);
    } catch (error) {
      logger.error('Failed to decrypt response data', {
        error: error.message,
        path: req.path,
        method: req.method
      });
      return originalJson.call(this, data);
    }
  };
  
  next();
};

/**
 * Middleware to handle file encryption for uploads
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const encryptFile = async (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }
  
  try {
    const { encrypt } = require('../utils/encryption');
    const context = `file:${req.user?.id || 'system'}`;
    
    // Handle single file
    if (req.file) {
      const encryptedData = encrypt(req.file.buffer.toString('base64'), context);
      req.file.encryptedData = encryptedData.encrypted;
      req.file.isEncrypted = true;
      // Clear original buffer for security
      req.file.buffer = null;
    }
    
    // Handle multiple files
    if (req.files) {
      const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      
      files.forEach(file => {
        const encryptedData = encrypt(file.buffer.toString('base64'), context);
        file.encryptedData = encryptedData.encrypted;
        file.isEncrypted = true;
        // Clear original buffer for security
        file.buffer = null;
      });
    }
    
    next();
  } catch (error) {
    logger.error('Failed to encrypt file', {
      error: error.message,
      path: req.path
    });
    next(error);
  }
};

/**
 * Utility to decrypt file data
 * @param {string} encryptedData - Encrypted file data
 * @param {string} userId - User ID for context
 * @returns {Buffer} Decrypted file buffer
 */
const decryptFile = (encryptedData, userId) => {
  const { decrypt } = require('../utils/encryption');
  const context = `file:${userId || 'system'}`;
  
  const decryptedBase64 = decrypt(
    { encrypted: encryptedData, context },
    context
  );
  
  return Buffer.from(decryptedBase64, 'base64');
};

/**
 * Check if encryption is properly configured
 * @returns {boolean} True if encryption is ready
 */
const isEncryptionEnabled = () => {
  return process.env.ENCRYPTION_MASTER_KEY && 
         process.env.ENCRYPTION_MASTER_KEY.length === 64; // 32 bytes in hex
};

/**
 * Initialize encryption middleware
 * Validates encryption configuration
 */
const initializeEncryption = () => {
  if (!isEncryptionEnabled()) {
    logger.warn('PHI encryption is not properly configured. Please set ENCRYPTION_MASTER_KEY.');
    
    // Generate a key for development if needed
    if (process.env.NODE_ENV === 'development') {
      const crypto = require('crypto');
      const key = crypto.randomBytes(32).toString('hex');
      logger.info(`Development encryption key generated: ${key}`);
      logger.info('Add this to your .env file: ENCRYPTION_MASTER_KEY=' + key);
    }
    
    return false;
  }
  
  const { validateEncryptionKey } = require('../utils/encryption');
  if (!validateEncryptionKey()) {
    logger.error('Encryption key validation failed');
    return false;
  }
  
  logger.info('PHI encryption middleware initialized successfully');
  return true;
};

module.exports = {
  encryptRequest,
  decryptResponse,
  encryptFile,
  decryptFile,
  isEncryptionEnabled,
  initializeEncryption,
  PHI_FIELDS
};
