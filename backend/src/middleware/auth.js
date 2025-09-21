import jwt from 'jsonwebtoken';
import { supabase } from '../config/auth.js';
import { AppError } from '../errors/AppError.js';
import { enhancedAuth, emergencyAuthBypass } from './authResilience.js';
import { hipaaSessionManager, sessionTimeoutWarning } from './hipaaSession.js';

// Role hierarchy for healthcare platform
export const ROLES = {
  ADMIN: 'admin',
  PROVIDER: 'provider',
  PATIENT: 'patient',
  GUEST: 'guest'
};

// Feature flags for enhanced authentication
const ENHANCED_AUTH_ENABLED = process.env.ENABLE_ENHANCED_AUTH !== 'false';
const HIPAA_SESSION_ENABLED = process.env.ENABLE_HIPAA_SESSIONS !== 'false';

// Role permissions mapping
const ROLE_HIERARCHY = {
  admin: ['admin', 'provider', 'patient', 'guest'],
  provider: ['provider', 'patient', 'guest'],
  patient: ['patient', 'guest'],
  guest: ['guest']
};

// Demo token validation for development
const validateDemoToken = (token) => {
  try {
    // Demo tokens have format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode the payload (second part) using Node.js Buffer
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
    
    // Check if it's a demo token and validate structure
    if (payload.id && payload.email && payload.id.startsWith('demo-')) {
      return payload;
    }
    
    return null;
  } catch (error) {
    console.warn('Demo token validation failed:', error.message);
    return null;
  }
};

// Enhanced JWT verification with better error handling
export const requireAuth = async (req, res, next) => {
  // Use enhanced authentication if enabled
  if (ENHANCED_AUTH_ENABLED) {
    return enhancedAuthFlow(req, res, next);
  }
  
  // Original authentication flow (backward compatibility)
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
    }

    const token = authHeader.substring(7);
    
    // Check for demo token first (development mode)
    if (process.env.NODE_ENV === 'development' || process.env.ENABLE_DEMO_AUTH === 'true') {
      const demoPayload = validateDemoToken(token);
      if (demoPayload) {
        req.user = {
          id: demoPayload.id,
          email: demoPayload.email,
          role: demoPayload.role || ROLES.PATIENT,
          metadata: demoPayload.metadata || {},
          verified: demoPayload.verified || false,
          created_at: demoPayload.created_at || new Date().toISOString()
        };
        req.authMethod = 'demo';
        console.log(`Demo authentication successful for ${demoPayload.role}: ${demoPayload.email}`);
        return next();
      }
    }
    
    // Try Supabase authentication first
    if (supabase) {
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (!error && user) {
          req.user = {
            id: user.id,
            email: user.email,
            role: user.user_metadata?.role || ROLES.PATIENT,
            metadata: user.user_metadata,
            verified: user.email_confirmed_at !== null,
            created_at: user.created_at
          };
          req.authMethod = 'supabase';
          return next();
        }
      } catch (supabaseError) {
        console.warn('Supabase auth failed, trying JWT:', supabaseError.message);
      }
    }

    // Fallback to JWT verification (for development or custom auth)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development-secret-key-change-in-production');
      
      // Validate token structure
      if (!decoded.id || !decoded.email) {
        throw new AppError('Invalid token structure', 401, 'INVALID_TOKEN');
      }
      
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role || ROLES.PATIENT,
        metadata: decoded.metadata || {},
        verified: decoded.verified || false,
        created_at: decoded.created_at || new Date().toISOString()
      };
      req.authMethod = 'jwt';
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        throw new AppError('Token expired', 401, 'TOKEN_EXPIRED');
      }
      console.error('Both Supabase and JWT authentication failed');
      throw new AppError('Invalid authentication token', 401, 'INVALID_TOKEN');
    }
    
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code
      });
    }
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      error: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

/**
 * Enhanced authentication flow with resilience and HIPAA session management
 */
const enhancedAuthFlow = async (req, res, next) => {
  // Chain: Emergency Bypass -> Enhanced Auth -> HIPAA Session -> Session Warning
  emergencyAuthBypass(req, res, () => {
    enhancedAuth(req, res, () => {
      if (HIPAA_SESSION_ENABLED) {
        hipaaSessionManager(req, res, () => {
          sessionTimeoutWarning(req, res, next);
        });
      } else {
        next();
      }
    });
  });
};

// Enhanced role-based access control
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const userRole = req.user.role || ROLES.GUEST;
    const userPermissions = ROLE_HIERARCHY[userRole] || [];
    
    // Check if user's role hierarchy includes any allowed role
    const hasPermission = allowedRoles.some(role => 
      userPermissions.includes(role)
    );
    
    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        required: allowedRoles,
        current: userRole
      });
    }
    
    next();
  };
};

// Provider-specific middleware
export const requireProvider = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }
  
  if (req.user.role !== ROLES.PROVIDER && req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ 
      error: 'Provider access required',
      code: 'PROVIDER_ONLY'
    });
  }
  
  // Check if provider is licensed and active
  if (req.user.metadata?.providerStatus !== 'active' && req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ 
      error: 'Provider account not active',
      code: 'PROVIDER_INACTIVE'
    });
  }
  
  next();
};

// Admin-only middleware
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ 
      error: 'Admin access required',
      code: 'ADMIN_ONLY'
    });
  }
  next();
};

// Middleware for optional auth (sets user if token exists but doesn't require it)
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.user_metadata?.role || 'patient'
        };
      }
    }
    
    next();
  } catch (error) {
    // Continue without auth
    next();
  }
};

// Enhanced token generation with refresh tokens
export const generateTokens = (user) => {
  const accessToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role || ROLES.PATIENT,
      metadata: user.metadata || {},
      verified: user.verified || false,
      created_at: user.created_at
    },
    process.env.JWT_SECRET || 'development-secret-key-change-in-production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
  
  const refreshToken = jwt.sign(
    {
      id: user.id,
      tokenVersion: user.tokenVersion || 0
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'development-secret-key-change-in-production',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
  
  return {
    accessToken,
    refreshToken,
    expiresIn: 3600, // 1 hour in seconds
    tokenType: 'Bearer'
  };
};

// Verify refresh token
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'development-secret-key-change-in-production'
    );
  } catch (error) {
    throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }
};

// Verify webhook signatures (Stripe, Supabase, etc.)
export const verifyWebhookSignature = (source = 'supabase') => {
  return (req, res, next) => {
    try {
      let secret;
      let signature;
      
      switch (source) {
        case 'supabase':
          signature = req.headers['webhook-signature'];
          secret = process.env.SUPABASE_WEBHOOK_SECRET;
          break;
        case 'stripe':
          signature = req.headers['stripe-signature'];
          secret = process.env.STRIPE_WEBHOOK_SECRET;
          break;
        default:
          throw new AppError('Unknown webhook source', 400, 'INVALID_WEBHOOK_SOURCE');
      }
      
      if (!signature || !secret) {
        throw new AppError('Missing webhook signature or secret', 401, 'INVALID_WEBHOOK');
      }
      
      // Add webhook verification logic here based on source
      // For now, just validate presence
      req.webhookSource = source;
      next();
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          error: error.message,
          code: error.code
        });
      }
      return res.status(401).json({ 
        error: 'Invalid webhook signature',
        code: 'WEBHOOK_VERIFICATION_FAILED'
      });
    }
  };
};

// HIPAA-compliant session validation
export const validateSession = async (req, res, next) => {
  try {
    // Check session timeout (30 minutes of inactivity for HIPAA)
    if (req.user && req.session) {
      const lastActivity = req.session.lastActivity || Date.now();
      const timeout = parseInt(process.env.SESSION_TIMEOUT || '1800000'); // 30 minutes
      
      if (Date.now() - lastActivity > timeout) {
        req.session.destroy();
        throw new AppError('Session expired due to inactivity', 401, 'SESSION_EXPIRED');
      }
      
      req.session.lastActivity = Date.now();
    }
    
    next();
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code
      });
    }
    next(error);
  }
};
