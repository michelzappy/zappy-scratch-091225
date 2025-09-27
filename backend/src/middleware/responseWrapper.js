/**
 * @module middleware/responseWrapper
 * @description Standardized API response wrapper middleware
 * Ensures consistent response format across all API endpoints
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Wraps API responses in a standardized format
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function responseWrapper(req, res, next) {
  // Store the original json method
  const originalJson = res.json;
  
  // Generate request ID if not present
  req.requestId = req.requestId || req.headers['x-request-id'] || uuidv4();
  
  /**
   * Override res.json to wrap the response
   * @param {*} data - Response data
   * @returns {Object} Express response
   */
  res.json = function(data) {
    // If response already has standard format, don't double-wrap
    if (data && typeof data === 'object' && 'success' in data && 'timestamp' in data) {
      return originalJson.call(this, data);
    }
    
    // Determine if this is an error response
    const isError = res.statusCode >= 400;
    
    // Build standard response
    const response = {
      success: !isError,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    };
    
    if (isError) {
      // Error response format
      if (typeof data === 'string') {
        response.error = 'ERROR';
        response.message = data;
      } else if (data && typeof data === 'object') {
        response.error = data.code || data.error || 'ERROR';
        response.message = data.message || 'An error occurred';
        if (data.details) {
          response.details = data.details;
        }
        // Only include stack in development
        if (process.env.NODE_ENV === 'development' && data.stack) {
          response.stack = data.stack;
        }
      }
    } else {
      // Success response format
      if (data !== undefined && data !== null) {
        // Check if data contains message
        if (data && typeof data === 'object' && data.message) {
          response.message = data.message;
          // Remove message from data to avoid duplication
          const { message, ...restData } = data;
          response.data = Object.keys(restData).length > 0 ? restData : undefined;
        } else {
          response.data = data;
        }
      }
    }
    
    return originalJson.call(this, response);
  };
  
  /**
   * Helper method to send success response
   * @param {*} data - Response data
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code (default: 200)
   * @returns {Object} Express response
   */
  res.success = function(data, message, statusCode = 200) {
    res.status(statusCode);
    const response = data || {};
    if (message) {
      response.message = message;
    }
    return res.json(response);
  };
  
  /**
   * Helper method to send error response
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default: 400)
   * @param {string} code - Error code
   * @param {Object} details - Additional error details
   * @returns {Object} Express response
   */
  res.error = function(message, statusCode = 400, code = 'ERROR', details = null) {
    res.status(statusCode);
    const errorResponse = {
      code,
      message
    };
    if (details) {
      errorResponse.details = details;
    }
    return res.json(errorResponse);
  };
  
  /**
   * Helper method to send paginated response
   * @param {Array} data - Array of items
   * @param {number} page - Current page number
   * @param {number} limit - Items per page
   * @param {number} total - Total number of items
   * @returns {Object} Express response
   */
  res.paginate = function(data, page, limit, total) {
    const totalPages = Math.ceil(total / limit);
    return res.success({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  };
  
  // Add request ID to response headers
  res.setHeader('X-Request-Id', req.requestId);
  
  next();
}

module.exports = responseWrapper;
