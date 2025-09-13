import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'your-service-key'
);

// Middleware to verify JWT token
export const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      // Fallback to local JWT verification for development
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development-secret');
        req.user = decoded;
      } catch (jwtError) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    } else {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'patient'
      };
    }
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Middleware to require specific role
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
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

// Generate JWT token for local development
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role || 'patient'
    },
    process.env.JWT_SECRET || 'development-secret',
    { expiresIn: '7d' }
  );
};

// Verify Supabase webhook signature
export const verifyWebhookSignature = (req, res, next) => {
  const signature = req.headers['webhook-signature'];
  const secret = process.env.SUPABASE_WEBHOOK_SECRET;
  
  if (!signature || !secret) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }
  
  // TODO: Implement signature verification
  next();
};
