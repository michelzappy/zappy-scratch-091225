import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError.js';

// Role hierarchy for healthcare platform
export const ROLES = {
  ADMIN: 'admin',
  PROVIDER: 'provider', 
  PATIENT: 'patient',
  GUEST: 'guest'
};

// Role permissions mapping
const ROLE_HIERARCHY = {
  admin: ['admin', 'provider', 'patient', 'guest'],
  provider: ['provider', 'patient', 'guest'],
  patient: ['patient', 'guest'],
  guest: ['guest']
};

// Enhanced JWT verification with better error handling
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
    }

    const token = authHeader.substring(7);
    
    // JWT verification
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
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development-secret-key-change-in-production');
        
        if (decoded.id && decoded.email) {
          req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role || ROLES.PATIENT,
            metadata: decoded.metadata || {},
            verified: decoded.verified || false,
            created_at: decoded.created_at || new Date().toISOString()
          };
          req.authMethod = 'jwt';
        }
      } catch (jwtError) {
        // Invalid token, continue without auth
        console.debug('Optional auth JWT verification failed:', jwtError.message);
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

// Verify webhook signatures (Stripe, GitHub, Shopify, etc.)
export const verifyWebhookSignature = (source = 'stripe') => {
  return (req, res, next) => {
    try {
      let secret;
      let signature;
      
      switch (source) {
        case 'stripe':
          signature = req.headers['stripe-signature'];
          secret = process.env.STRIPE_WEBHOOK_SECRET;
          break;
        case 'github':
          signature = req.headers['x-hub-signature-256'];
          secret = process.env.GITHUB_WEBHOOK_SECRET;
          break;
        case 'shopify':
          signature = req.headers['x-shopify-hmac-sha256'];
          secret = process.env.SHOPIFY_WEBHOOK_SECRET;
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
