/**
 * Central type definitions for the healthcare platform
 * This file serves as the main export point for all TypeScript types
 */

// Re-export all model types
export * from './models';

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncResponse<T> = Promise<T>;

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

// Request types
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions?: string[];
  };
  session?: {
    id: string;
    token: string;
  };
}

// Audit types for HIPAA compliance
export interface AuditEntry {
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  details?: Record<string, any>;
}

// PHI (Protected Health Information) marker interface
export interface PHIData {
  _isPHI: true;
  encryptionLevel?: 'standard' | 'enhanced';
}
