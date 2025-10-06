import { AppError } from '../errors/AppError.js';
import jwt from 'jsonwebtoken';

// Authentication system health status
let authSystemHealth = {
  jwt: { status: 'healthy', lastCheck: Date.now(), consecutiveFailures: 0 },
  overall: 'healthy'
};

// Authentication method preferences
const AUTH_CONFIG = {
  enableFallback: process.env.DISABLE_AUTH_FALLBACK !== 'true'
};

/**
 * Update overall authentication system health
 */
const updateOverallHealth = () => {
  authSystemHealth.overall = authSystemHealth.jwt.status === 'healthy' ? 'healthy' : 'critical';
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
    
    // JWT authentication
    try {
      user = await authenticateWithJWT(token);
      authMethod = 'jwt';
    } catch (jwtError) {
      console.error('JWT authentication failed');
      throw jwtError;
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
      fallbackEnabled: AUTH_CONFIG.enableFallback
    }
  };
  
  const httpStatus = authSystemHealth.overall === 'healthy' ? 200 : 503;
  
  res.status(httpStatus).json(healthData);
};

/**
 * Periodic health check function
 */
export const startAuthHealthMonitoring = () => {
  const performHealthCheck = async () => {
    try {
      // JWT health is always checked during authentication
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
  
  // Schedule periodic checks (less frequent since JWT doesn't need external checks)
  const interval = setInterval(performHealthCheck, 300000); // 5 minutes
  
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