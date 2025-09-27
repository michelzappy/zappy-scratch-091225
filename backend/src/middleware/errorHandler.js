/**
 * @module middleware/errorHandler
 * @description Centralized error handling middleware for the application
 */

import logger from '../utils/logger.js';
import { errorResponse, HttpStatus } from '../utils/apiResponse.js';

/**
 * Custom application error class
 * @class AppError
 * @extends Error
 */
class AppError extends Error {
  /**
   * Creates an application error
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Error code
   * @param {Object} details - Additional error details
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async error wrapper for route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
const asyncErrorWrapper = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Handle validation errors (e.g., from Joi or express-validator)
 * @param {Error} err - Validation error
 * @returns {Object} Formatted error response
 */
const handleValidationError = (err) => {
  const errors = [];
  
  // Handle Joi validation errors
  if (err.details && Array.isArray(err.details)) {
    err.details.forEach(detail => {
      errors.push({
        field: detail.path.join('.'),
        message: detail.message
      });
    });
  }
  
  // Handle express-validator errors
  if (err.errors && Array.isArray(err.errors)) {
    err.errors.forEach(error => {
      errors.push({
        field: error.param || error.field,
        message: error.msg || error.message
      });
    });
  }
  
  return {
    message: 'Validation failed',
    code: 'VALIDATION_ERROR',
    statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    details: { errors }
  };
};

/**
 * Handle database errors
 * @param {Error} err - Database error
 * @returns {Object} Formatted error response
 */
const handleDatabaseError = (err) => {
  // Handle duplicate key errors
  if (err.code === '23505' || err.code === 'ER_DUP_ENTRY') {
    return {
      message: 'Duplicate entry found',
      code: 'DUPLICATE_ENTRY',
      statusCode: HttpStatus.CONFLICT
    };
  }
  
  // Handle foreign key constraint errors
  if (err.code === '23503' || err.code === 'ER_NO_REFERENCED_ROW_2') {
    return {
      message: 'Referenced resource not found',
      code: 'REFERENCE_ERROR',
      statusCode: HttpStatus.BAD_REQUEST
    };
  }
  
  // Handle connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    return {
      message: 'Database connection error',
      code: 'DATABASE_CONNECTION_ERROR',
      statusCode: HttpStatus.SERVICE_UNAVAILABLE
    };
  }
  
  // Default database error
  return {
    message: 'Database operation failed',
    code: 'DATABASE_ERROR',
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR
  };
};

/**
 * Handle JWT authentication errors
 * @param {Error} err - JWT error
 * @returns {Object} Formatted error response
 */
const handleJWTError = (err) => {
  if (err.name === 'JsonWebTokenError') {
    return {
      message: 'Invalid token',
      code: 'INVALID_TOKEN',
      statusCode: HttpStatus.UNAUTHORIZED
    };
  }
  
  if (err.name === 'TokenExpiredError') {
    return {
      message: 'Token expired',
      code: 'TOKEN_EXPIRED',
      statusCode: HttpStatus.UNAUTHORIZED
    };
  }
  
  return {
    message: 'Authentication failed',
    code: 'AUTH_ERROR',
    statusCode: HttpStatus.UNAUTHORIZED
  };
};

/**
 * Main error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // Log error details
  if (process.env.NODE_ENV !== 'test') {
    logger.error('Error occurred', {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id
    });
  }
  
  // Handle specific error types
  if (err instanceof AppError) {
    error.statusCode = err.statusCode;
    error.code = err.code;
    error.details = err.details;
  } else if (err.name === 'ValidationError' || err.isJoi) {
    const validationError = handleValidationError(err);
    Object.assign(error, validationError);
  } else if (err.name && err.name.includes('Sequelize')) {
    const dbError = handleDatabaseError(err);
    Object.assign(error, dbError);
  } else if (err.name && err.name.includes('JsonWebToken')) {
    const jwtError = handleJWTError(err);
    Object.assign(error, jwtError);
  } else if (err.name === 'CastError') {
    error.message = 'Invalid ID format';
    error.code = 'INVALID_ID';
    error.statusCode = HttpStatus.BAD_REQUEST;
  } else if (err.name === 'MulterError') {
    error.message = err.message || 'File upload error';
    error.code = 'FILE_UPLOAD_ERROR';
    error.statusCode = HttpStatus.BAD_REQUEST;
  }
  
  // Set default values
  error.statusCode = error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
  error.code = error.code || 'INTERNAL_ERROR';
  
  // In production, don't leak error details for 500 errors
  if (process.env.NODE_ENV === 'production' && error.statusCode === HttpStatus.INTERNAL_SERVER_ERROR) {
    error.message = 'An unexpected error occurred';
    delete error.stack;
    delete error.details;
  }
  
  // Send error response
  res.status(error.statusCode).json(
    errorResponse(
      error.message,
      error.code,
      error.details || (process.env.NODE_ENV === 'development' ? { stack: err.stack } : null)
    )
  );
};

/**
 * Handle 404 Not Found errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Route ${req.originalUrl} not found`,
    HttpStatus.NOT_FOUND,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', {
    error: err.message,
    stack: err.stack
  });
  process.exit(1);
});

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', {
    error: err.message,
    stack: err.stack
  });
  // Give time to log the error before shutting down
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Create an alias for compatibility
const asyncHandler = asyncErrorWrapper;

export {
  AppError,
  asyncErrorWrapper,
  asyncHandler,  // Alias for compatibility
  errorHandler,
  notFoundHandler
};
