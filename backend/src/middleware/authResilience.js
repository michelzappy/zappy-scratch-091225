import { supabase, supabaseClient } from '../config/auth.js';
import { AppError } from '../errors/AppError.js';
import jwt from 'jsonwebtoken';

// Authentication system health status
let authSystemHealth = {
  supabase: { status: 'unknown', lastCheck: null, consecutiveFailures: 0 },
  jwt: { status: 'healthy', lastCheck: Date.now(), consecutiveFailures: 0 },
  overall: 'unknown'
};

// Authentication method preferences and circuit breaker
const AUTH_CONFIG = {
  supabaseTimeout: parseInt(process.env.SUPABASE_AUTH_TIMEOUT || '5000'), // 5 seconds
  maxConsecutiveFailures: parseInt(process.env.AUTH_MAX_FAILURES || '3'),
  circuitBreakerTimeout: parseInt(process.env.AUTH_CIRCUIT_BREAKER_TIMEOUT || '60000'), // 1 minute
  healthCheckInterval: parseInt(process.env.AUTH_HEALTH_CHECK_INTERVAL || '30000'), // 30 seconds
  enableFallback: process.env.DISABLE_AUTH_FALLBACK !== 'true'
};

/**
 * Check Supabase authentication service health
 */
const checkSupabaseHealth = async () => {
  if (!supabase) {
    authSystemHealth.supabase.status = 'unavailable';
    return false;
  }

  try {
    // Test Supabase connectivity with a simple operation
    const startTime = Date.now();
    await Promise.race([
      supabase.auth.getSession(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), AUTH_CONFIG.supabaseTimeout)
      )
    ]);
    
    const responseTime = Date.now() - startTime;
    
    authSystemHealth.supabase = {
      status: 'healthy',
      lastCheck: Date.now(),
      consecutiveFailures: 0,
      responseTime
    };
    
    return true;
    
  } catch (error) {
    authSystemHealth.supabase.consecutiveFailures++;
    authSystemHealth.supabase.lastCheck = Date.now();
    
    if (authSystemHealth.supabase.consecutiveFailures >= AUTH_CONFIG.maxConsecutiveFailures) {
      authSystemHealth.supabase.status = 'circuit_breaker';
    } else {
      authSystemHealth.supabase.status = 'degraded';
    }
    
    console.warn('Supabase health check failed:', error.message);
    return false;
  }
};

/**
 * Check if Supabase circuit breaker should be reset
 */
const shouldResetCircuitBreaker = () => {
  const supabaseHealth = authSystemHealth.supabase;
  return supabaseHealth.status === 'circuit_breaker' && 
         (Date.now() - supabaseHealth.lastCheck) > AUTH_CONFIG.circuitBreakerTimeout;
};

/**
 * Update overall authentication system health
 */
const updateOverallHealth = () => {
  const supabaseHealthy = authSystemHealth.supabase.status === 'healthy';
  const jwtHealthy = authSystemHealth.jwt.status === 'healthy';
  
  if (supabaseHealthy && jwtHealthy) {
    authSystemHealth.overall = 'healthy';
  } else if (jwtHealthy) {
    authSystemHealth.overall = 'degraded'; // JWT fallback available
  } else {
    authSystemHealth.overall = 'critical';
  }
};

/**
 * Enhanced Supabase authentication with timeout and error handling
 */
const authenticateWithSupabase = async (token) => {
  // Check circuit breaker
  if (authSystemHealth.supabase.status === 'circuit_breaker' && !shouldResetCircuitBreaker()) {
    throw new Error('Supabase authentication circuit breaker is open');
  }
  
  if (!supabase) {
    throw new Error('Supabase client not available');
  }
  
  try {
    const startTime = Date.now();
    
    const { data: { user }, error } = await Promise.race([
      supabase.auth.getUser(token),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Supabase authentication timeout')), AUTH_CONFIG.supabaseTimeout)
      )
    ]);
    
    if (error) throw error;
    if (!user) throw new Error('No user data returned');
    
    // Update health status on success
    authSystemHealth.supabase.consecutiveFailures = 0;
    authSystemHealth.supabase.status = 'healthy';
    authSystemHealth.supabase.responseTime = Date.now() - startTime;
    
    return {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'patient',
      metadata: user.user_metadata,
      verified: user.email_confirmed_at !== null,
      created_at: user.created_at
    };
    
  } catch (error) {
    // Update failure count and status
    authSystemHealth.supabase.consecutiveFailures++;
    authSystemHealth.supabase.lastCheck = Date.now();
    
    if (authSystemHealth.supabase.consecutiveFailures >= AUTH_CONFIG.maxConsecutiveFailures) {
      authSystemHealth.supabase.status = 'circuit_breaker';
      console.warn('Supabase authentication circuit breaker activated');
    } else {
      authSystemHealth.supabase.status = 'degraded';
    }
    
    throw error;
  }
};

/**
 * Enhanced JWT authentication with validation
 */
const authenticateWithJWT = async (token) => {
  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'development-secret-key-change-in-production'
    );
    
    // Validate token structure
    if (!decoded.id || !decoded.email) {
      throw new AppError('Invalid JWT token structure', 401, 'INVALID_TOKEN_STRUCTURE');
    }
    
    // Check token expiration with grace period
    const now = Math.floor(Date.now() / 1000);
    const gracePeriod = 60; // 1 minute grace period
    
    if (decoded.exp && decoded.exp < (now - gracePeriod)) {
      throw new AppError('JWT token expired beyond grace period', 401, 'TOKEN_EXPIRED');
    }
    
    // Update JWT health status
    authSystemHealth.jwt = {
      status: 'healthy',
      lastCheck: Date.now(),
      consecutiveFailures: 0
    };
    
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || 'patient',
      metadata: decoded.metadata || {},
      verified: decoded.verified || false,
      created_at: decoded.created_at || new Date().toISOString()
    };
    
  } catch (error) {
    authSystemHealth.jwt.consecutiveFailures++;
    authSystemHealth.jwt.lastCheck = Date.now();
    
    if (error.name === 'TokenExpiredError') {
      throw new AppError('JWT token expired', 401, 'TOKEN_EXPIRED');
    }
    
    throw new AppError('Invalid JWT token', 401, 'INVALID_JWT');
  }
};

/**
 * Enhanced authentication middleware with resilience and monitoring
 */
export const enhancedAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
    }

    const token = authHeader.substring(7);
    let user = null;
    let authMethod = null;
    
    // Try Supabase authentication first (if healthy)
    if (supabase && authSystemHealth.supabase.status !== 'circuit_breaker') {
      try {
        user = await authenticateWithSupabase(token);
        authMethod = 'supabase';
      } catch (supabaseError) {
        console.warn('Supabase authentication failed, trying JWT fallback:', supabaseError.message);
        
        // Only try JWT fallback if enabled
        if (!AUTH_CONFIG.enableFallback) {
          throw supabaseError;
        }
      }
    }
    
    // Fallback to JWT authentication
    if (!user && AUTH_CONFIG.enableFallback) {
      try {
        user = await authenticateWithJWT(token);
        authMethod = 'jwt';
      } catch (jwtError) {
        console.error('Both Supabase and JWT authentication failed');
        throw jwtError;
      }
    }
    
    if (!user) {
      throw new AppError('Authentication failed', 401, 'AUTH_FAILED');
    }
    
    // Set user and authentication metadata
    req.user = user;
    req.authMethod = authMethod;
    req.authHealth = authSystemHealth.overall;
    
    // Update overall system health
    updateOverallHealth();
    
    next();
    
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
        authSystemHealth: authSystemHealth.overall
      });
    }
    
    console.error('Enhanced authentication error:', error);
    return res.status(401).json({ 
      error: 'Authentication failed',
      code: 'AUTH_FAILED',
      authSystemHealth: authSystemHealth.overall
    });
  }
};

/**
 * Authentication system health endpoint
 */
export const getAuthHealth = (req, res) => {
  const healthData = {
    ...authSystemHealth,
    timestamp: Date.now(),
    config: {
      supabaseConfigured: !!supabase,
      fallbackEnabled: AUTH_CONFIG.enableFallback,
      timeouts: {
        supabase: AUTH_CONFIG.supabaseTimeout,
        circuitBreaker: AUTH_CONFIG.circuitBreakerTimeout
      }
    }
  };
  
  const httpStatus = authSystemHealth.overall === 'healthy' ? 200 :
                    authSystemHealth.overall === 'degraded' ? 200 :
                    503; // Service Unavailable for critical
  
  res.status(httpStatus).json(healthData);
};

/**
 * Periodic health check function
 */
export const startAuthHealthMonitoring = () => {
  const performHealthCheck = async () => {
    try {
      await checkSupabaseHealth();
      updateOverallHealth();
      
      // Log health status changes
      const currentStatus = authSystemHealth.overall;
      if (performHealthCheck.lastStatus && performHealthCheck.lastStatus !== currentStatus) {
        console.log(`Authentication system health changed: ${performHealthCheck.lastStatus} -> ${currentStatus}`);
      }
      performHealthCheck.lastStatus = currentStatus;
      
    } catch (error) {
      console.error('Health check error:', error);
    }
  };
  
  // Initial health check
  performHealthCheck();
  
  // Schedule periodic checks
  const interval = setInterval(performHealthCheck, AUTH_CONFIG.healthCheckInterval);
  
  return () => clearInterval(interval);
};

/**
 * Emergency authentication bypass for healthcare emergencies
 * Only enabled with specific environment variable and emergency token
 */
export const emergencyAuthBypass = (req, res, next) => {
  const emergencyEnabled = process.env.EMERGENCY_AUTH_BYPASS === 'true';
  const emergencyToken = process.env.EMERGENCY_AUTH_TOKEN;
  
  if (!emergencyEnabled || !emergencyToken) {
    return next();
  }
  
  const providedToken = req.headers['x-emergency-auth'];
  
  if (providedToken === emergencyToken) {
    console.warn('EMERGENCY AUTHENTICATION BYPASS USED', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    req.user = {
      id: 'emergency-access',
      email: 'emergency@healthcare.system',
      role: 'admin',
      emergency: true
    };
    req.authMethod = 'emergency';
    
    return next();
  }
  
  next();
};

export default {
  enhancedAuth,
  getAuthHealth,
  startAuthHealthMonitoring,
  emergencyAuthBypass,
  getHealthStatus: () => authSystemHealth
};