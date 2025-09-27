/**
 * @module utils/customErrors
 * @description Custom error classes for the application
 */

const { HttpStatus } = require('./apiResponse');

/**
 * Base application error class
 * @class BaseError
 * @extends Error
 */
class BaseError extends Error {
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error
 * @class ValidationError
 * @extends BaseError
 */
class ValidationError extends BaseError {
  constructor(message = 'Validation failed', details = null) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', details);
  }
}

/**
 * Authentication error
 * @class AuthenticationError
 * @extends BaseError
 */
class AuthenticationError extends BaseError {
  constructor(message = 'Authentication failed') {
    super(message, HttpStatus.UNAUTHORIZED, 'AUTH_ERROR');
  }
}

/**
 * Authorization error
 * @class AuthorizationError
 * @extends BaseError
 */
class AuthorizationError extends BaseError {
  constructor(message = 'Access denied') {
    super(message, HttpStatus.FORBIDDEN, 'ACCESS_DENIED');
  }
}

/**
 * Not found error
 * @class NotFoundError
 * @extends BaseError
 */
class NotFoundError extends BaseError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, HttpStatus.NOT_FOUND, 'NOT_FOUND');
  }
}

/**
 * Conflict error
 * @class ConflictError
 * @extends BaseError
 */
class ConflictError extends BaseError {
  constructor(message = 'Resource conflict') {
    super(message, HttpStatus.CONFLICT, 'CONFLICT');
  }
}

/**
 * Bad request error
 * @class BadRequestError
 * @extends BaseError
 */
class BadRequestError extends BaseError {
  constructor(message = 'Bad request', details = null) {
    super(message, HttpStatus.BAD_REQUEST, 'BAD_REQUEST', details);
  }
}

/**
 * Internal server error
 * @class InternalServerError
 * @extends BaseError
 */
class InternalServerError extends BaseError {
  constructor(message = 'Internal server error', details = null) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR', details);
  }
}

/**
 * Service unavailable error
 * @class ServiceUnavailableError
 * @extends BaseError
 */
class ServiceUnavailableError extends BaseError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, HttpStatus.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE');
  }
}

/**
 * Rate limit error
 * @class RateLimitError
 * @extends BaseError
 */
class RateLimitError extends BaseError {
  constructor(retryAfter = 60) {
    super(
      'Too many requests. Please try again later.',
      HttpStatus.TOO_MANY_REQUESTS,
      'RATE_LIMIT_EXCEEDED',
      { retryAfter }
    );
  }
}

/**
 * Database error
 * @class DatabaseError
 * @extends BaseError
 */
class DatabaseError extends BaseError {
  constructor(message = 'Database operation failed', details = null) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, 'DATABASE_ERROR', details);
  }
}

/**
 * Token expired error
 * @class TokenExpiredError
 * @extends BaseError
 */
class TokenExpiredError extends BaseError {
  constructor() {
    super('Token has expired', HttpStatus.UNAUTHORIZED, 'TOKEN_EXPIRED');
  }
}

/**
 * Invalid token error
 * @class InvalidTokenError
 * @extends BaseError
 */
class InvalidTokenError extends BaseError {
  constructor() {
    super('Invalid token', HttpStatus.UNAUTHORIZED, 'INVALID_TOKEN');
  }
}

/**
 * HIPAA compliance error
 * @class HIPAAComplianceError
 * @extends BaseError
 */
class HIPAAComplianceError extends BaseError {
  constructor(message = 'HIPAA compliance violation', details = null) {
    super(message, HttpStatus.FORBIDDEN, 'HIPAA_VIOLATION', details);
  }
}

/**
 * File upload error
 * @class FileUploadError
 * @extends BaseError
 */
class FileUploadError extends BaseError {
  constructor(message = 'File upload failed', details = null) {
    super(message, HttpStatus.BAD_REQUEST, 'FILE_UPLOAD_ERROR', details);
  }
}

/**
 * Email error
 * @class EmailError
 * @extends BaseError
 */
class EmailError extends BaseError {
  constructor(message = 'Email operation failed', details = null) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, 'EMAIL_ERROR', details);
  }
}

/**
 * Payment error
 * @class PaymentError
 * @extends BaseError
 */
class PaymentError extends BaseError {
  constructor(message = 'Payment processing failed', details = null) {
    super(message, HttpStatus.PAYMENT_REQUIRED || 402, 'PAYMENT_ERROR', details);
  }
}

/**
 * Integration error
 * @class IntegrationError
 * @extends BaseError
 */
class IntegrationError extends BaseError {
  constructor(service, message = 'External service error', details = null) {
    super(
      `${service}: ${message}`,
      HttpStatus.BAD_GATEWAY,
      'INTEGRATION_ERROR',
      { service, ...details }
    );
  }
}

module.exports = {
  BaseError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BadRequestError,
  InternalServerError,
  ServiceUnavailableError,
  RateLimitError,
  DatabaseError,
  TokenExpiredError,
  InvalidTokenError,
  HIPAAComplianceError,
  FileUploadError,
  EmailError,
  PaymentError,
  IntegrationError
};
