/**
 * @module services/BaseService
 * @description Base service class that all services extend from
 * Provides common functionality and patterns for business logic
 */

import { NotFoundError, ValidationError, DatabaseError } from '../utils/customErrors.js';
import logger from '../utils/logger.js';

/**
 * Base service class
 * @class BaseService
 */
class BaseService {
  /**
   * Creates a base service instance
   * @param {Object} model - Database model
   * @param {string} modelName - Name of the model for logging
   */
  constructor(model, modelName = 'Resource') {
    this.model = model;
    this.modelName = modelName;
    this.logger = logger;
  }

  /**
   * Find all resources with optional filters and pagination
   * @param {Object} options - Query options
   * @param {Object} options.filter - Filter conditions
   * @param {number} options.page - Page number (1-based)
   * @param {number} options.limit - Items per page
   * @param {string} options.sort - Sort field
   * @param {string} options.order - Sort order (ASC/DESC)
   * @param {Array} options.include - Relations to include
   * @param {Array} options.attributes - Fields to select
   * @returns {Promise<Object>} Paginated results
   */
  async findAll(options = {}) {
    try {
      const {
        filter = {},
        page = 1,
        limit = 10,
        sort = 'createdAt',
        order = 'DESC',
        include = [],
        attributes = []
      } = options;

      const offset = (page - 1) * limit;

      const queryOptions = {
        where: filter,
        limit,
        offset,
        order: [[sort, order]]
      };

      if (include.length > 0) {
        queryOptions.include = include;
      }

      if (attributes.length > 0) {
        queryOptions.attributes = attributes;
      }

      const { rows: data, count: total } = await this.model.findAndCountAll(queryOptions);

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      this.logger.error(`Error finding ${this.modelName} records`, { error: error.message });
      throw new DatabaseError(`Failed to retrieve ${this.modelName} records`);
    }
  }

  /**
   * Find a single resource by ID
   * @param {string|number} id - Resource ID
   * @param {Object} options - Query options
   * @param {Array} options.include - Relations to include
   * @param {Array} options.attributes - Fields to select
   * @returns {Promise<Object>} Found resource
   * @throws {NotFoundError} If resource not found
   */
  async findById(id, options = {}) {
    try {
      const { include = [], attributes = [] } = options;

      const queryOptions = {
        where: { id }
      };

      if (include.length > 0) {
        queryOptions.include = include;
      }

      if (attributes.length > 0) {
        queryOptions.attributes = attributes;
      }

      const resource = await this.model.findOne(queryOptions);

      if (!resource) {
        throw new NotFoundError(this.modelName);
      }

      return resource;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      this.logger.error(`Error finding ${this.modelName} by ID`, { id, error: error.message });
      throw new DatabaseError(`Failed to retrieve ${this.modelName}`);
    }
  }

  /**
   * Find a single resource by criteria
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} Found resource or null
   */
  async findOne(criteria, options = {}) {
    try {
      const { include = [], attributes = [] } = options;

      const queryOptions = {
        where: criteria
      };

      if (include.length > 0) {
        queryOptions.include = include;
      }

      if (attributes.length > 0) {
        queryOptions.attributes = attributes;
      }

      return await this.model.findOne(queryOptions);
    } catch (error) {
      this.logger.error(`Error finding ${this.modelName}`, { criteria, error: error.message });
      throw new DatabaseError(`Failed to retrieve ${this.modelName}`);
    }
  }

  /**
   * Create a new resource
   * @param {Object} data - Resource data
   * @param {Object} options - Creation options
   * @param {Object} options.transaction - Database transaction
   * @returns {Promise<Object>} Created resource
   */
  async create(data, options = {}) {
    try {
      await this.validateCreate(data);
      
      const { transaction } = options;
      
      const resource = await this.model.create(data, { transaction });
      
      this.logger.info(`${this.modelName} created`, { id: resource.id });
      
      return resource;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.logger.error(`Error creating ${this.modelName}`, { data, error: error.message });
      throw new DatabaseError(`Failed to create ${this.modelName}`);
    }
  }

  /**
   * Update a resource
   * @param {string|number} id - Resource ID
   * @param {Object} data - Update data
   * @param {Object} options - Update options
   * @param {Object} options.transaction - Database transaction
   * @returns {Promise<Object>} Updated resource
   */
  async update(id, data, options = {}) {
    try {
      const resource = await this.findById(id);
      
      await this.validateUpdate(data, resource);
      
      const { transaction } = options;
      
      await resource.update(data, { transaction });
      
      this.logger.info(`${this.modelName} updated`, { id });
      
      return resource;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      this.logger.error(`Error updating ${this.modelName}`, { id, data, error: error.message });
      throw new DatabaseError(`Failed to update ${this.modelName}`);
    }
  }

  /**
   * Delete a resource
   * @param {string|number} id - Resource ID
   * @param {Object} options - Delete options
   * @param {Object} options.transaction - Database transaction
   * @param {boolean} options.soft - Soft delete flag
   * @returns {Promise<boolean>} Success status
   */
  async delete(id, options = {}) {
    try {
      const { transaction, soft = false } = options;
      
      const resource = await this.findById(id);
      
      await this.validateDelete(resource);
      
      if (soft && resource.deletedAt !== undefined) {
        // Soft delete
        await resource.update({ deletedAt: new Date() }, { transaction });
      } else {
        // Hard delete
        await resource.destroy({ transaction });
      }
      
      this.logger.info(`${this.modelName} deleted`, { id, soft });
      
      return true;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      this.logger.error(`Error deleting ${this.modelName}`, { id, error: error.message });
      throw new DatabaseError(`Failed to delete ${this.modelName}`);
    }
  }

  /**
   * Bulk create resources
   * @param {Array<Object>} dataArray - Array of resource data
   * @param {Object} options - Creation options
   * @returns {Promise<Array>} Created resources
   */
  async bulkCreate(dataArray, options = {}) {
    try {
      const { transaction } = options;
      
      // Validate all items
      for (const data of dataArray) {
        await this.validateCreate(data);
      }
      
      const resources = await this.model.bulkCreate(dataArray, { transaction });
      
      this.logger.info(`Bulk ${this.modelName} created`, { count: resources.length });
      
      return resources;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.logger.error(`Error bulk creating ${this.modelName}`, { error: error.message });
      throw new DatabaseError(`Failed to bulk create ${this.modelName}`);
    }
  }

  /**
   * Count resources
   * @param {Object} filter - Filter conditions
   * @returns {Promise<number>} Count
   */
  async count(filter = {}) {
    try {
      return await this.model.count({ where: filter });
    } catch (error) {
      this.logger.error(`Error counting ${this.modelName}`, { filter, error: error.message });
      throw new DatabaseError(`Failed to count ${this.modelName}`);
    }
  }

  /**
   * Check if a resource exists
   * @param {Object} criteria - Search criteria
   * @returns {Promise<boolean>} Exists flag
   */
  async exists(criteria) {
    try {
      const count = await this.model.count({ where: criteria });
      return count > 0;
    } catch (error) {
      this.logger.error(`Error checking ${this.modelName} existence`, { criteria, error: error.message });
      throw new DatabaseError(`Failed to check ${this.modelName} existence`);
    }
  }

  /**
   * Validate data before creation
   * Override in child classes for custom validation
   * @param {Object} data - Data to validate
   * @throws {ValidationError} If validation fails
   */
  async validateCreate(data) {
    // Override in child classes
    return true;
  }

  /**
   * Validate data before update
   * Override in child classes for custom validation
   * @param {Object} data - Update data
   * @param {Object} resource - Existing resource
   * @throws {ValidationError} If validation fails
   */
  async validateUpdate(data, resource) {
    // Override in child classes
    return true;
  }

  /**
   * Validate before deletion
   * Override in child classes for custom validation
   * @param {Object} resource - Resource to delete
   * @throws {ValidationError} If validation fails
   */
  async validateDelete(resource) {
    // Override in child classes
    return true;
  }

  /**
   * Execute a database transaction
   * @param {Function} callback - Transaction callback
   * @returns {Promise<*>} Transaction result
   */
  async transaction(callback) {
    const t = await this.model.sequelize.transaction();
    
    try {
      const result = await callback(t);
      await t.commit();
      return result;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Sanitize data for output
   * Remove sensitive fields before sending to client
   * @param {Object} data - Data to sanitize
   * @param {Array<string>} fieldsToRemove - Fields to remove
   * @returns {Object} Sanitized data
   */
  sanitize(data, fieldsToRemove = ['password', 'salt', 'resetToken']) {
    if (!data) return data;
    
    const sanitized = { ...data.dataValues || data };
    
    fieldsToRemove.forEach(field => {
      delete sanitized[field];
    });
    
    return sanitized;
  }
}

export default BaseService;
