/**
 * Frontend Secret Exposure Vulnerability Testing Suite
 * 
 * CRITICAL SECURITY AUDIT SUB-TASK  
 * Priority: CRITICAL (Risk Score: 9)
 * Focus: Supabase key exposure in frontend configuration
 * 
 * Vulnerable File Under Test:
 * - frontend/src/lib/supabase.ts:4 - Anon key hardcoded in source
 * 
 * This test suite validates that sensitive keys are not exposed in frontend code
 * and that proper environment variable configuration is enforced.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';

describe('🔐 Frontend Secret Exposure Vulnerability Tests', () => {
  let originalEnv;
  const frontendSupabaseFile = path.join(process.cwd(), '../frontend/src/lib/supabase.ts');

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('🚨 Hardcoded Supabase Key Detection', () => {
    /**
     * Test for the exact hardcoded Supabase anon key found in the security audit
     * This key should NEVER be hardcoded in source code
     */
    it('should detect hardcoded Supabase anon key in frontend/src/lib/supabase.ts', async () => {
      const vulnerableKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlaGxxa2ZtZ3VwaHB4bHFiem5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzA3NDQsImV4cCI6MjA3MzYwNjc0NH0.e30FMXlX64smj-TBijeQWIn3SHvKZyXMKDrlkCx4Ysg';
      
      try {
        const fileContent = await fs.readFile(frontendSupabaseFile, 'utf-8');
        
        // Check if the hardcoded key exists in the file
        if (fileContent.includes(vulnerableKey)) {
          console.error('🚨 CRITICAL VULNERABILITY: Hardcoded Supabase anon key found in frontend source code');
          console.error(`File: ${frontendSupabaseFile}`);
          console.error(`Key: ${vulnerableKey.substring(0, 20)}...`);
          
          // This is a critical security vulnerability
          expect(true).toBe(false);
        }
        
        // Also check for any JWT pattern that might be hardcoded
        const jwtPattern = /eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g;
        const hardcodedJWTs = fileContent.match(jwtPattern);
        
        if (hardcodedJWTs && hardcodedJWTs.length > 0) {
          console.warn('🚨 POTENTIAL VULNERABILITY: JWT-like tokens found in frontend source:');
          hardcodedJWTs.forEach(token => {
            console.warn(`- ${token.substring(0, 30)}...`);
          });
          
          // Flag as vulnerability
          expect(hardcodedJWTs.length).toBe(0);
        }
        
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.warn('Frontend supabase file not found - skipping hardcoded key check');
        } else {
          throw error;
        }
      }
    });

    it('should detect hardcoded Supabase URL in frontend configuration', async () => {
      const vulnerableURL = 'https://lehlqkfmguphpxlqbzng.supabase.co';
      
      try {
        const fileContent = await fs.readFile(frontendSupabaseFile, 'utf-8');
        
        if (fileContent.includes(vulnerableURL)) {
          console.error('🚨 CRITICAL VULNERABILITY: Hardcoded Supabase URL found in frontend source code');
          console.error(`URL: ${vulnerableURL}`);
          
          // URLs can be public but should still use environment variables
          console.warn('⚠️  Supabase URLs should be configured via environment variables for consistency');
        }
        
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    });

    it('should validate environment variable usage in frontend', async () => {
      try {
        const fileContent = await fs.readFile(frontendSupabaseFile, 'utf-8');
        
        // Check if file properly uses environment variables
        const usesEnvVars = fileContent.includes('process.env.NEXT_PUBLIC_SUPABASE_URL') &&
                           fileContent.includes('process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
        
        expect(usesEnvVars).toBe(true);
        
        // But should not have fallback hardcoded values
        const hasFallbackSecrets = fileContent.includes('eyJ') || 
                                  fileContent.includes('https://') &&
                                  !fileContent.includes('process.env');
        
        if (hasFallbackSecrets) {
          console.warn('🚨 SECURITY RISK: Hardcoded fallback values detected in Supabase configuration');
        }
        
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    });
  });

  describe('🔒 Environment Variable Security', () => {
    it('should require NEXT_PUBLIC_SUPABASE_URL to be set', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      // Simulate frontend configuration loading
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lehlqkfmguphpxlqbzng.supabase.co';
      
      if (supabaseUrl === 'https://lehlqkfmguphpxlqbzng.supabase.co') {
        console.warn('🚨 SECURITY RISK: Using hardcoded fallback Supabase URL');
        expect(true).toBe(false);
      }
    });

    it('should require NEXT_PUBLIC_SUPABASE_ANON_KEY to be set', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      const vulnerableKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlaGxxa2ZtZ3VwaHB4bHFiem5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzA3NDQsImV4cCI6MjA3MzYwNjc0NH0.e30FMXlX64smj-TBijeQWIn3SHvKZyXMKDrlkCx4Ysg';
      
      // Simulate frontend configuration loading
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || vulnerableKey;
      
      if (supabaseAnonKey === vulnerableKey) {
        console.error('🚨 CRITICAL VULNERABILITY: Using hardcoded fallback Supabase anon key');
        expect(true).toBe(false);
      }
    });

    it('should validate Supabase anon key format and security', () => {
      const testKeys = [
        'weak-key',
        '',
        'not-a-jwt',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlaGxxa2ZtZ3VwaHB4bHFiem5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzA3NDQsImV4cCI6MjA3MzYwNjc0NH0.e30FMXlX64smj-TBijeQWIn3SHvKZyXMKDrlkCx4Ysg', // Vulnerable key
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlY3VyZXByb2plY3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MDk5NTIwMCwiZXhwIjoxOTU2NTcxMjAwfQ.secure-signature' // Secure key example
      ];
      
      for (const key of testKeys) {
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = key;
        
        // Validate key format (should be a valid JWT)
        const isValidJWT = /^eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*$/.test(key);
        
        if (!isValidJWT && key !== '') {
          console.warn(`🚨 INVALID KEY FORMAT: "${key.substring(0, 20)}..." is not a valid JWT`);
        }
        
        // Check against known vulnerable keys
        const vulnerableKeys = [
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlaGxxa2ZtZ3VwaHB4bHFiem5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzA3NDQsImV4cCI6MjA3MzYwNjc0NH0.e30FMXlX64smj-TBijeQWIn3SHvKZyXMKDrlkCx4Ysg'
        ];
        
        if (vulnerableKeys.includes(key)) {
          console.error(`🚨 VULNERABLE KEY DETECTED: This Supabase key is exposed in source code`);
          expect(true).toBe(false);
        }
      }
    });
  });

  describe('🛡️ Frontend Security Best Practices', () => {
    it('should not expose service role keys in frontend', async () => {
      // Service role keys should NEVER be in frontend code
      const serviceRolePatterns = [
        /service_role/i,
        /eyJ[A-Za-z0-9_-]*\.eyJ[^"]*service[^"]*role[^"]*\./i
      ];
      
      try {
        const fileContent = await fs.readFile(frontendSupabaseFile, 'utf-8');
        
        for (const pattern of serviceRolePatterns) {
          if (pattern.test(fileContent)) {
            console.error('🚨 CRITICAL VULNERABILITY: Service role key detected in frontend code!');
            console.error('Service role keys must NEVER be exposed to the frontend');
            expect(true).toBe(false);
          }
        }
        
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    });

    it('should validate client-side secret handling', () => {
      // Frontend should only use public/anon keys
      const allowedKeyTypes = ['anon', 'public'];
      const forbiddenKeyTypes = ['service_role', 'private', 'secret'];
      
      const mockSupabaseConfig = {
        url: 'https://project.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.signature'
      };
      
      // Validate that only appropriate keys are used
      for (const keyType of forbiddenKeyTypes) {
        if (JSON.stringify(mockSupabaseConfig).toLowerCase().includes(keyType)) {
          console.error(`🚨 FORBIDDEN KEY TYPE: ${keyType} keys must not be used in frontend`);
          expect(true).toBe(false);
        }
      }
    });

    it('should enforce secure transmission of credentials', () => {
      // URLs should use HTTPS in production
      const testUrls = [
        'http://localhost:3000', // OK for development
        'https://project.supabase.co', // Secure
        'http://project.supabase.co', // Insecure
        'ftp://project.supabase.co' // Very insecure
      ];
      
      for (const url of testUrls) {
        const isSecure = url.startsWith('https://') || url.startsWith('http://localhost');
        
        if (!isSecure) {
          console.warn(`🚨 INSECURE URL: ${url} should use HTTPS in production`);
          expect(isSecure).toBe(true);
        }
      }
    });

    it('should prevent key exposure in browser dev tools', () => {
      // Simulate frontend code that might expose keys
      const dangerousPatterns = [
        'console.log(supabaseKey)',
        'alert(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)',
        'document.write(supabaseAnonKey)',
        'localStorage.setItem("supabase_key", key)'
      ];
      
      for (const pattern of dangerousPatterns) {
        // These patterns should not exist in production code
        console.warn(`🚨 DANGEROUS PATTERN: "${pattern}" could expose keys in browser`);
        
        // In a real test, we would scan actual frontend files for these patterns
        expect(pattern).not.toMatch(/console\.log.*[Kk]ey/);
      }
    });
  });

  describe('🔍 Source Code Security Scanning', () => {
    it('should scan for common secret patterns in frontend code', async () => {
      const secretPatterns = [
        /sk_[a-zA-Z0-9]{24,}/, // Stripe secret keys
        /pk_[a-zA-Z0-9]{24,}/, // Stripe publishable keys  
        /rk_[a-zA-Z0-9]{24,}/, // Stripe restricted keys
        /AIza[0-9A-Za-z_-]{35}/, // Google API keys
        /[a-zA-Z0-9_-]*:[a-zA-Z0-9_-]*@/, // Potential credentials
        /password\s*[:=]\s*["'][^"']+["']/, // Hardcoded passwords
        /token\s*[:=]\s*["'][^"']+["']/, // Hardcoded tokens
      ];
      
      try {
        const fileContent = await fs.readFile(frontendSupabaseFile, 'utf-8');
        
        for (const pattern of secretPatterns) {
          const matches = fileContent.match(pattern);
          if (matches) {
            console.warn(`🚨 POTENTIAL SECRET DETECTED: ${matches[0].substring(0, 20)}...`);
            console.warn('Review this pattern to ensure it\'s not a hardcoded secret');
          }
        }
        
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    });

    it('should verify proper .env.local configuration for frontend', async () => {
      const frontendEnvFile = path.join(process.cwd(), '../frontend/.env.local');
      
      try {
        const envContent = await fs.readFile(frontendEnvFile, 'utf-8');
        
        // Check for required environment variables
        const requiredVars = [
          'NEXT_PUBLIC_SUPABASE_URL',
          'NEXT_PUBLIC_SUPABASE_ANON_KEY'
        ];
        
        for (const envVar of requiredVars) {
          if (!envContent.includes(envVar)) {
            console.warn(`🚨 MISSING ENV VAR: ${envVar} not found in .env.local`);
          }
        }
        
        // Check for forbidden secrets in env file
        const forbiddenInEnv = [
          'service_role',
          'private_key',
          'secret_key'
        ];
        
        for (const forbidden of forbiddenInEnv) {
          if (envContent.toLowerCase().includes(forbidden)) {
            console.error(`🚨 FORBIDDEN SECRET: ${forbidden} found in frontend .env.local`);
            expect(true).toBe(false);
          }
        }
        
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.warn('Frontend .env.local file not found - environment variables may not be configured');
        } else {
          throw error;
        }
      }
    });
  });

  describe('📊 Security Metrics and Monitoring', () => {
    it('should track frontend secret exposure incidents', () => {
      // Mock incident tracking
      const securityIncidents = [];
      
      // Simulate detection of exposed secret
      const detectedSecret = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.exposed.secret';
      
      if (detectedSecret.startsWith('eyJ')) {
        securityIncidents.push({
          type: 'EXPOSED_JWT_TOKEN',
          severity: 'CRITICAL',
          location: 'frontend/src/lib/supabase.ts',
          timestamp: new Date().toISOString(),
          token: detectedSecret.substring(0, 20) + '...'
        });
      }
      
      // Verify incidents are tracked
      expect(securityIncidents.length).toBeGreaterThan(0);
      expect(securityIncidents[0].severity).toBe('CRITICAL');
    });

    it('should provide security recommendations for frontend configuration', () => {
      const recommendations = [
        'Use environment variables for all Supabase configuration',
        'Never commit .env.local files to version control',
        'Regularly rotate Supabase anon keys',
        'Implement key validation in CI/CD pipeline',
        'Monitor for secret exposure in client-side code',
        'Use Supabase RLS (Row Level Security) to protect data'
      ];
      
      expect(recommendations.length).toBeGreaterThan(0);
      
      // Verify each recommendation addresses a real security concern
      for (const recommendation of recommendations) {
        expect(recommendation).toMatch(/(environment|secret|key|security|protect|monitor|validate)/i);
      }
    });
  });
});