// Upload utilities for file size validation and retry logic

import { toast } from 'react-hot-toast';

// Configuration constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
export const MAX_RETRIES = 3;
export const INITIAL_RETRY_DELAY = 1000; // 1 second

export interface UploadError extends Error {
  status?: number;
}

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
}

/**
 * Validates file size before upload
 */
export function validateFileSize(file: File): boolean {
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
    toast.error(`File size (${sizeMB}MB) exceeds maximum allowed size of ${maxSizeMB}MB.`);
    return false;
  }
  return true;
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Sleep utility for retry delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculates exponential backoff delay
 */
export function calculateRetryDelay(attempt: number, baseDelay: number = INITIAL_RETRY_DELAY): number {
  return baseDelay * Math.pow(2, attempt - 1);
}

/**
 * Executes upload with retry logic and exponential backoff
 */
export async function uploadWithRetry<T>(
  uploadFunction: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = MAX_RETRIES, initialDelay = INITIAL_RETRY_DELAY } = options;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadFunction();
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries;
      
      // Handle 429 (rate limit) and 5xx (server errors)
      if (error.status === 429) {
        if (isLastAttempt) {
          toast.error('Too many uploads — please wait before retrying.');
          throw error;
        }
        
        const delay = calculateRetryDelay(attempt, initialDelay);
        toast.error(`Too many uploads. Retrying in ${Math.ceil(delay / 1000)} seconds...`);
        await sleep(delay);
        continue;
      }
      
      if (error.status >= 500 && error.status < 600) {
        if (isLastAttempt) {
          toast.error('Upload failed, please try again later.');
          throw error;
        }
        
        const delay = calculateRetryDelay(attempt, initialDelay);
        console.log(`Server error (${error.status}). Retrying upload in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        await sleep(delay);
        continue;
      }
      
      // For other errors, don't retry
      throw error;
    }
  }
  
  throw new Error('Upload failed after all retry attempts');
}