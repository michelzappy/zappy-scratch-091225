/**
 * @module utils/apiResponse
 * @description Utility functions for standardized API responses
 */

/**
 * Create a success response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @returns {Object} Formatted success response
 */
function successResponse(data, message = 'Success') {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create an error response object
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {Object} details - Additional error details
 * @returns {Object} Formatted error response
 */
function errorResponse(message, code = 'ERROR', details = null) {
  const response = {
    success: false,
    error: code,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (details) {
    response.details = details;
  }
  
  return response;
}

/**
 * Create a validation error response
 * @param {Array} errors - Array of validation errors
 * @returns {Object} Formatted validation error response
 */
function validationErrorResponse(errors) {
  return {
    success: false,
    error: 'VALIDATION_ERROR',
    message: 'Validation failed',
    details: {
      errors: Array.isArray(errors) ? errors : [errors]
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Create an unauthorized error response
 * @param {string} message - Custom message (optional)
 * @returns {Object} Formatted unauthorized response
 */
function unauthorizedResponse(message = 'Unauthorized access') {
  return {
    success: false,
    error: 'UNAUTHORIZED',
    message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create a forbidden error response
 * @param {string} message - Custom message (optional)
 * @returns {Object} Formatted forbidden response
 */
function forbiddenResponse(message = 'Access forbidden') {
  return {
    success: false,
    error: 'FORBIDDEN',
    message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create a not found error response
 * @param {string} resource - Resource that was not found
 * @returns {Object} Formatted not found response
 */
function notFoundResponse(resource = 'Resource') {
  return {
    success: false,
    error: 'NOT_FOUND',
    message: `${resource} not found`,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create a paginated response
 * @param {Array} data - Array of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} Formatted paginated response
 */
function paginatedResponse(data, page, limit, total) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Create a rate limit error response
 * @param {number} retryAfter - Seconds until retry
 * @returns {Object} Formatted rate limit response
 */
function rateLimitResponse(retryAfter = 60) {
  return {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Please try again later.',
    details: {
      retryAfter
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Create a service unavailable error response
 * @param {string} message - Custom message (optional)
 * @returns {Object} Formatted service unavailable response
 */
function serviceUnavailableResponse(message = 'Service temporarily unavailable') {
  return {
    success: false,
    error: 'SERVICE_UNAVAILABLE',
    message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create a conflict error response
 * @param {string} message - Conflict description
 * @returns {Object} Formatted conflict response
 */
function conflictResponse(message = 'Resource conflict') {
  return {
    success: false,
    error: 'CONFLICT',
    message,
    timestamp: new Date().toISOString()
  };
}

/**
 * HTTP Status codes enum
 */
const HttpStatus = {
  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  
  // Client errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  
  // Server errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};

module.exports = {
  successResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  paginatedResponse,
  rateLimitResponse,
  serviceUnavailableResponse,
  conflictResponse,
  HttpStatus
};
