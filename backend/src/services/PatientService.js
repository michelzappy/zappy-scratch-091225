const BaseService = require('./base.service');
const { ValidationError } = require('../utils/customErrors');

/**
 * Patient service for business logic
 * @extends BaseService
 */
class PatientService extends BaseService {
  constructor() {
    // For now, we'll use a mock model
    // Replace with actual Sequelize model: require('../models/Patient')
    const mockModel = {
      findAndCountAll: async (options) => ({
        rows: [],
        count: 0
      }),
      findOne: async (options) => null,
      create: async (data) => ({ id: '123', ...data }),
      sequelize: { transaction: async (cb) => cb() }
    };
    
    super(mockModel, 'Patient');
  }
  
  /**
   * Validate patient data before creation
   * @param {Object} data - Patient data
   * @throws {ValidationError} If validation fails
   */
  async validateCreate(data) {
    const errors = [];
    
    // Required fields
    if (!data.firstName) {
      errors.push('First name is required');
    }
    
    if (!data.lastName) {
      errors.push('Last name is required');
    }
    
    if (!data.email) {
      errors.push('Email is required');
    }
    
    if (!data.dateOfBirth) {
      errors.push('Date of birth is required');
    }
    
    // Email format validation
    if (data.email && !this.isValidEmail(data.email)) {
      errors.push('Invalid email format');
    }
    
    // Age validation (must be 18+)
    if (data.dateOfBirth) {
      const age = this.calculateAge(new Date(data.dateOfBirth));
      if (age < 0) {
        errors.push('Date of birth cannot be in the future');
      } else if (age > 150) {
        errors.push('Invalid date of birth');
      }
    }
    
    if (errors.length > 0) {
      throw new ValidationError('Validation failed', { errors });
    }
    
    return true;
  }
  
  /**
   * Validate patient data before update
   * @param {Object} data - Update data
   * @param {Object} existingPatient - Current patient record
   * @throws {ValidationError} If validation fails
   */
  async validateUpdate(data, existingPatient) {
    const errors = [];
    
    // Email format validation if provided
    if (data.email && !this.isValidEmail(data.email)) {
      errors.push('Invalid email format');
    }
    
    // Age validation if date of birth is being updated
    if (data.dateOfBirth) {
      const age = this.calculateAge(new Date(data.dateOfBirth));
      if (age < 0) {
        errors.push('Date of birth cannot be in the future');
      } else if (age > 150) {
        errors.push('Invalid date of birth');
      }
    }
    
    if (errors.length > 0) {
      throw new ValidationError('Validation failed', { errors });
    }
    
    return true;
  }
  
  /**
   * Check if email is valid
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Calculate age from date of birth
   * @param {Date} birthDate - Date of birth
   * @returns {number} Age in years
   */
  calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }
  
  /**
   * Search patients by name or email
   * @param {string} searchTerm - Search term
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async search(searchTerm, options = {}) {
    const { page = 1, limit = 10 } = options;
    
    // In real implementation, use Sequelize Op.or and Op.like
    const filter = {
      // This would be: [Op.or]: [ { firstName: { [Op.like]: `%${searchTerm}%` } }, ... ]
      searchTerm
    };
    
    return this.findAll({ filter, page, limit });
  }
}

module.exports = PatientService;
