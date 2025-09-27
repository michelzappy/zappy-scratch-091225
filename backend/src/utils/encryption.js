/**
 * @module utils/encryption
 * @description Encryption utilities for PHI data at rest
 * HIPAA-compliant encryption using AES-256
 */

const crypto = require('crypto');
const logger = require('./logger');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16
const TAG_LENGTH = 16; // Authentication tag length
const SALT_LENGTH = 64; // Length of salt for key derivation
const ITERATIONS = 100000; // PBKDF2 iterations
const KEY_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment or generate one
 * @returns {Buffer} Encryption key
 */
const getEncryptionKey = () => {
  const masterKey = process.env.ENCRYPTION_MASTER_KEY;
  
  if (!masterKey) {
    logger.error('ENCRYPTION_MASTER_KEY not set in environment variables');
    throw new Error('Encryption key not configured');
  }
  
  return Buffer.from(masterKey, 'hex');
};

/**
 * Derive a key from password and salt using PBKDF2
 * @param {string} password - Password to derive key from
 * @param {Buffer} salt - Salt for key derivation
 * @returns {Buffer} Derived key
 */
const deriveKey = (password, salt) => {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
};

/**
 * Encrypt sensitive data
 * @param {string} text - Plain text to encrypt
 * @param {string} encryptionContext - Context for encryption (e.g., user ID, resource type)
 * @returns {Object} Encrypted data object with ciphertext, iv, tag, and salt
 */
const encrypt = (text, encryptionContext = '') => {
  try {
    if (!text) {
      return null;
    }
    
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derive key from master key and salt
    const masterKey = getEncryptionKey();
    const key = deriveKey(masterKey.toString('hex'), salt);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Add additional authenticated data (AAD) for context
    if (encryptionContext) {
      cipher.setAAD(Buffer.from(encryptionContext, 'utf8'));
    }
    
    // Encrypt the text
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ]);
    
    // Get the authentication tag
    const tag = cipher.getAuthTag();
    
    // Combine all components into a single string
    const combined = Buffer.concat([
      salt,
      iv,
      tag,
      encrypted
    ]).toString('base64');
    
    return {
      encrypted: combined,
      algorithm: ALGORITHM,
      context: encryptionContext
    };
  } catch (error) {
    logger.error('Encryption failed', { error: error.message });
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt sensitive data
 * @param {Object} encryptedData - Encrypted data object
 * @param {string} encryptedData.encrypted - Combined encrypted string
 * @param {string} encryptedData.context - Encryption context
 * @returns {string} Decrypted plain text
 */
const decrypt = (encryptedData, encryptionContext = '') => {
  try {
    if (!encryptedData || !encryptedData.encrypted) {
      return null;
    }
    
    // Parse the combined encrypted string
    const combined = Buffer.from(encryptedData.encrypted, 'base64');
    
    // Extract components
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    
    // Derive key from master key and salt
    const masterKey = getEncryptionKey();
    const key = deriveKey(masterKey.toString('hex'), salt);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Add additional authenticated data (AAD) for context
    const context = encryptionContext || encryptedData.context || '';
    if (context) {
      decipher.setAAD(Buffer.from(context, 'utf8'));
    }
    
    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    logger.error('Decryption failed', { error: error.message });
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Hash sensitive data for searching (one-way)
 * @param {string} text - Text to hash
 * @param {string} salt - Optional salt
 * @returns {string} Hashed value
 */
const hash = (text, salt = '') => {
  if (!text) {
    return null;
  }
  
  const combinedSalt = salt || process.env.HASH_SALT || 'default-salt';
  return crypto
    .createHash('sha256')
    .update(text + combinedSalt)
    .digest('hex');
};

/**
 * Generate a secure random token
 * @param {number} length - Token length in bytes
 * @returns {string} Random token as hex string
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Encrypt an object's specified fields
 * @param {Object} obj - Object to encrypt fields in
 * @param {Array<string>} fields - Fields to encrypt
 * @param {string} context - Encryption context
 * @returns {Object} Object with encrypted fields
 */
const encryptFields = (obj, fields, context = '') => {
  const encrypted = { ...obj };
  
  fields.forEach(field => {
    if (obj[field] !== undefined && obj[field] !== null) {
      const encryptedData = encrypt(String(obj[field]), context);
      encrypted[field] = encryptedData.encrypted;
      encrypted[`${field}_encrypted`] = true;
    }
  });
  
  return encrypted;
};

/**
 * Decrypt an object's specified fields
 * @param {Object} obj - Object to decrypt fields in
 * @param {Array<string>} fields - Fields to decrypt
 * @param {string} context - Encryption context
 * @returns {Object} Object with decrypted fields
 */
const decryptFields = (obj, fields, context = '') => {
  const decrypted = { ...obj };
  
  fields.forEach(field => {
    if (obj[field] && obj[`${field}_encrypted`]) {
      try {
        decrypted[field] = decrypt(
          { encrypted: obj[field], context },
          context
        );
        delete decrypted[`${field}_encrypted`];
      } catch (error) {
        logger.error(`Failed to decrypt field ${field}`, { error: error.message });
        decrypted[field] = null;
      }
    }
  });
  
  return decrypted;
};

/**
 * Validate encryption key strength
 * @returns {boolean} True if key meets requirements
 */
const validateEncryptionKey = () => {
  try {
    const key = getEncryptionKey();
    
    // Check key length (should be 32 bytes for AES-256)
    if (key.length !== KEY_LENGTH) {
      logger.error(`Encryption key length invalid: ${key.length} bytes (expected ${KEY_LENGTH})`);
      return false;
    }
    
    // Check key randomness (basic entropy check)
    const keyHex = key.toString('hex');
    const uniqueChars = new Set(keyHex).size;
    if (uniqueChars < 10) {
      logger.error('Encryption key has insufficient entropy');
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Failed to validate encryption key', { error: error.message });
    return false;
  }
};

/**
 * Rotate encryption key (re-encrypt with new key)
 * @param {string} oldKeyHex - Old encryption key in hex
 * @param {string} newKeyHex - New encryption key in hex
 * @param {Object} encryptedData - Data encrypted with old key
 * @returns {Object} Data encrypted with new key
 */
const rotateEncryptionKey = (oldKeyHex, newKeyHex, encryptedData) => {
  // Temporarily use old key to decrypt
  const originalKey = process.env.ENCRYPTION_MASTER_KEY;
  process.env.ENCRYPTION_MASTER_KEY = oldKeyHex;
  
  try {
    const decrypted = decrypt(encryptedData);
    
    // Switch to new key and re-encrypt
    process.env.ENCRYPTION_MASTER_KEY = newKeyHex;
    return encrypt(decrypted, encryptedData.context);
  } finally {
    // Restore original key
    process.env.ENCRYPTION_MASTER_KEY = originalKey;
  }
};

module.exports = {
  encrypt,
  decrypt,
  hash,
  generateSecureToken,
  encryptFields,
  decryptFields,
  validateEncryptionKey,
  rotateEncryptionKey
};
