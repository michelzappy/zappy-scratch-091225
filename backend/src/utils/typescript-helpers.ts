/**
 * TypeScript migration helpers
 * Utilities to support gradual migration from JavaScript to TypeScript
 */

/**
 * Type guard to check if value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard to check if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard to check if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard to check if value is an object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if value is an array
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Safe JSON parse with type checking
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Assert that a value is not null or undefined
 * Throws an error if assertion fails
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message || 'Value is null or undefined');
  }
}

/**
 * Cast unknown value to specific type with validation
 * Use with caution - prefer proper type guards
 */
export function cast<T>(value: unknown): T {
  return value as T;
}

/**
 * Create a typed wrapper for Express middleware
 * Helps with gradual migration of middleware to TypeScript
 */
export function typedMiddleware<
  Req = any,
  Res = any,
  Next = any
>(
  middleware: (req: Req, res: Res, next: Next) => void | Promise<void>
) {
  return middleware;
}

/**
 * Create a typed wrapper for Express route handlers
 * Helps with gradual migration of routes to TypeScript
 */
export function typedRoute<
  Req = any,
  Res = any,
  Next = any
>(
  handler: (req: Req, res: Res, next?: Next) => void | Promise<void>
) {
  return handler;
}

/**
 * Utility to handle async route errors
 * Wraps async functions to catch errors and pass them to Express error handler
 */
export function asyncHandler<
  Req = any,
  Res = any,
  Next = any
>(
  fn: (req: Req, res: Res, next: Next) => Promise<void>
) {
  return (req: Req, res: Res, next: Next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      if (typeof next === 'function') {
        (next as any)(err);
      } else {
        throw err;
      }
    });
  };
}

/**
 * Type-safe environment variable getter
 */
export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value || defaultValue!;
}

/**
 * Type-safe enum value checker
 */
export function isEnumValue<T extends Record<string, string | number>>(
  enumObj: T,
  value: unknown
): value is T[keyof T] {
  return Object.values(enumObj).includes(value as T[keyof T]);
}

/**
 * Create a typed error class for custom errors
 */
export class TypedError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'TypedError';
    Error.captureStackTrace(this, this.constructor);
  }
}
