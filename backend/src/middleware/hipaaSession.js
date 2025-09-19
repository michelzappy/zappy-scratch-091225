import { AppError } from '../errors/AppError.js';
import crypto from 'crypto';

// HIPAA-compliant session configuration
const SESSION_CONFIG = {
  timeout: parseInt(process.env.HIPAA_SESSION_TIMEOUT || '1800000'), // 30 minutes in milliseconds
  renewThreshold: parseInt(process.env.SESSION_RENEW_THRESHOLD || '300000'), // 5 minutes before expiry
  warningThreshold: parseInt(process.env.SESSION_WARNING_THRESHOLD || '120000'), // 2 minutes warning
  maxSessions: parseInt(process.env.MAX_CONCURRENT_SESSIONS || '3'),
  secureStorage: true,
  httpOnly: true,
  sameSite: 'strict'
};

// In-memory session store (in production, use Redis or database)
const sessionStore = new Map();
const userSessions = new Map(); // Track sessions per user

/**
 * Generate secure session ID
 */
const generateSessionId = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Create HIPAA-compliant session data
 */
const createSessionData = (user, req) => {
  const now = Date.now();
  
  return {
    sessionId: generateSessionId(),
    userId: user.id,
    userRole: user.role,
    email: user.email,
    createdAt: now,
    lastActivity: now,
    expiresAt: now + SESSION_CONFIG.timeout,
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('User-Agent'),
    authMethod: req.authMethod || 'unknown',
    renewalCount: 0,
    securityFlags: {
      requiresRenewal: false,
      suspiciousActivity: false,
      multipleLocations: false
    },
    metadata: {
      loginTime: now,
      lastRenewal: null,
      accessCount: 1
    }
  };
};

/**
 * Validate session and check HIPAA compliance
 */
const validateSession = (sessionData, req) => {
  const now = Date.now();
  
  // Check if session exists
  if (!sessionData) {
    throw new AppError('Session not found', 401, 'SESSION_NOT_FOUND');
  }
  
  // Check if session has expired
  if (now > sessionData.expiresAt) {
    throw new AppError('Session expired', 401, 'SESSION_EXPIRED');
  }
  
  // Check for session inactivity (HIPAA requirement)
  const inactivityPeriod = now - sessionData.lastActivity;
  if (inactivityPeriod > SESSION_CONFIG.timeout) {
    throw new AppError('Session expired due to inactivity', 401, 'SESSION_INACTIVE');
  }
  
  // Security validations
  const currentIP = req.ip || req.connection?.remoteAddress;
  const currentUserAgent = req.get('User-Agent');
  
  // Check for IP address changes (potential session hijacking)
  if (sessionData.ipAddress !== currentIP) {
    sessionData.securityFlags.multipleLocations = true;
    console.warn('Session IP address changed', {
      sessionId: sessionData.sessionId,
      userId: sessionData.userId,
      originalIP: sessionData.ipAddress,
      currentIP: currentIP
    });
  }
  
  // Check for user agent changes (potential session hijacking)
  if (sessionData.userAgent !== currentUserAgent) {
    sessionData.securityFlags.suspiciousActivity = true;
    console.warn('Session user agent changed', {
      sessionId: sessionData.sessionId,
      userId: sessionData.userId,
      originalUserAgent: sessionData.userAgent,
      currentUserAgent: currentUserAgent
    });
  }
  
  return true;
};

/**
 * Update session activity and handle renewal
 */
const updateSessionActivity = (sessionData, req) => {
  const now = Date.now();
  
  sessionData.lastActivity = now;
  sessionData.metadata.accessCount++;
  
  // Check if session needs renewal (approaching expiry)
  const timeUntilExpiry = sessionData.expiresAt - now;
  if (timeUntilExpiry < SESSION_CONFIG.renewThreshold) {
    sessionData.securityFlags.requiresRenewal = true;
    sessionData.expiresAt = now + SESSION_CONFIG.timeout;
    sessionData.renewalCount++;
    sessionData.metadata.lastRenewal = now;
    
    console.log('Session renewed', {
      sessionId: sessionData.sessionId,
      userId: sessionData.userId,
      renewalCount: sessionData.renewalCount
    });
  }
  
  return sessionData;
};

/**
 * Manage concurrent sessions per user (HIPAA security requirement)
 */
const manageConcurrentSessions = (userId, newSessionId) => {
  let userSessionList = userSessions.get(userId) || [];
  
  // Add new session
  userSessionList.push({
    sessionId: newSessionId,
    createdAt: Date.now()
  });
  
  // Remove expired sessions
  userSessionList = userSessionList.filter(session => {
    const sessionData = sessionStore.get(session.sessionId);
    return sessionData && Date.now() < sessionData.expiresAt;
  });
  
  // Enforce maximum concurrent sessions
  if (userSessionList.length > SESSION_CONFIG.maxSessions) {
    // Remove oldest sessions
    const sessionsToRemove = userSessionList
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(0, userSessionList.length - SESSION_CONFIG.maxSessions);
    
    sessionsToRemove.forEach(session => {
      sessionStore.delete(session.sessionId);
      console.log('Session terminated due to concurrent session limit', {
        sessionId: session.sessionId,
        userId: userId
      });
    });
    
    userSessionList = userSessionList.slice(-SESSION_CONFIG.maxSessions);
  }
  
  userSessions.set(userId, userSessionList);
};

/**
 * Clean up expired sessions (called periodically)
 */
const cleanupExpiredSessions = () => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [sessionId, sessionData] of sessionStore.entries()) {
    if (now > sessionData.expiresAt) {
      sessionStore.delete(sessionId);
      cleanedCount++;
      
      // Also remove from user sessions
      const userSessionList = userSessions.get(sessionData.userId) || [];
      const updatedList = userSessionList.filter(s => s.sessionId !== sessionId);
      
      if (updatedList.length === 0) {
        userSessions.delete(sessionData.userId);
      } else {
        userSessions.set(sessionData.userId, updatedList);
      }
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} expired sessions`);
  }
};

/**
 * HIPAA Session Management Middleware
 */
export const hipaaSessionManager = (req, res, next) => {
  try {
    // Skip session management for health checks and public endpoints
    if (req.path.includes('/health') || req.path.includes('/auth/login')) {
      return next();
    }
    
    // Only process authenticated requests
    if (!req.user) {
      return next();
    }
    
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
    
    if (sessionId) {
      // Validate existing session
      const sessionData = sessionStore.get(sessionId);
      
      try {
        validateSession(sessionData, req);
        updateSessionActivity(sessionData, req);
        
        // Add session information to request
        req.session = sessionData;
        req.sessionWarning = (sessionData.expiresAt - Date.now()) < SESSION_CONFIG.warningThreshold;
        
        // Update session in store
        sessionStore.set(sessionId, sessionData);
        
      } catch (sessionError) {
        // Session validation failed - clean up and require re-authentication
        if (sessionData) {
          sessionStore.delete(sessionId);
        }
        
        // Clear session cookie
        res.clearCookie('sessionId');
        
        return res.status(401).json({
          error: sessionError.message,
          code: sessionError.code,
          requiresReauth: true
        });
      }
    } else {
      // Create new session for authenticated user
      const newSessionData = createSessionData(req.user, req);
      const newSessionId = newSessionData.sessionId;
      
      // Store session
      sessionStore.set(newSessionId, newSessionData);
      
      // Manage concurrent sessions
      manageConcurrentSessions(req.user.id, newSessionId);
      
      // Set session cookie
      res.cookie('sessionId', newSessionId, {
        httpOnly: SESSION_CONFIG.httpOnly,
        secure: process.env.NODE_ENV === 'production',
        sameSite: SESSION_CONFIG.sameSite,
        maxAge: SESSION_CONFIG.timeout
      });
      
      // Add session to request
      req.session = newSessionData;
      req.sessionWarning = false;
    }
    
    next();
    
  } catch (error) {
    console.error('HIPAA session management error:', error);
    return res.status(500).json({
      error: 'Session management failed',
      code: 'SESSION_ERROR'
    });
  }
};

/**
 * Session timeout warning middleware
 */
export const sessionTimeoutWarning = (req, res, next) => {
  if (req.session && req.sessionWarning) {
    res.set('X-Session-Warning', 'true');
    res.set('X-Session-Expires-In', Math.floor((req.session.expiresAt - Date.now()) / 1000));
  }
  next();
};

/**
 * Force session logout
 */
export const forceLogout = (sessionId) => {
  const sessionData = sessionStore.get(sessionId);
  
  if (sessionData) {
    sessionStore.delete(sessionId);
    
    // Remove from user sessions
    const userSessionList = userSessions.get(sessionData.userId) || [];
    const updatedList = userSessionList.filter(s => s.sessionId !== sessionId);
    
    if (updatedList.length === 0) {
      userSessions.delete(sessionData.userId);
    } else {
      userSessions.set(sessionData.userId, updatedList);
    }
    
    console.log('Session force logged out', {
      sessionId: sessionId,
      userId: sessionData.userId
    });
    
    return true;
  }
  
  return false;
};

/**
 * Get session information for monitoring
 */
export const getSessionInfo = (sessionId) => {
  const sessionData = sessionStore.get(sessionId);
  
  if (!sessionData) {
    return null;
  }
  
  return {
    sessionId: sessionData.sessionId,
    userId: sessionData.userId,
    userRole: sessionData.userRole,
    createdAt: sessionData.createdAt,
    lastActivity: sessionData.lastActivity,
    expiresAt: sessionData.expiresAt,
    renewalCount: sessionData.renewalCount,
    securityFlags: sessionData.securityFlags,
    timeUntilExpiry: sessionData.expiresAt - Date.now(),
    isActive: Date.now() < sessionData.expiresAt
  };
};

/**
 * Get all active sessions (admin endpoint)
 */
export const getAllActiveSessions = () => {
  const activeSessions = [];
  const now = Date.now();
  
  for (const [sessionId, sessionData] of sessionStore.entries()) {
    if (now < sessionData.expiresAt) {
      activeSessions.push({
        sessionId: sessionData.sessionId,
        userId: sessionData.userId,
        userRole: sessionData.userRole,
        email: sessionData.email,
        createdAt: sessionData.createdAt,
        lastActivity: sessionData.lastActivity,
        expiresAt: sessionData.expiresAt,
        ipAddress: sessionData.ipAddress,
        authMethod: sessionData.authMethod,
        renewalCount: sessionData.renewalCount,
        accessCount: sessionData.metadata.accessCount,
        securityFlags: sessionData.securityFlags
      });
    }
  }
  
  return activeSessions;
};

/**
 * Start periodic session cleanup
 */
export const startSessionCleanup = () => {
  const cleanupInterval = setInterval(
    cleanupExpiredSessions, 
    parseInt(process.env.SESSION_CLEANUP_INTERVAL || '300000') // 5 minutes
  );
  
  console.log('HIPAA session cleanup started');
  
  return () => clearInterval(cleanupInterval);
};

export default {
  hipaaSessionManager,
  sessionTimeoutWarning,
  forceLogout,
  getSessionInfo,
  getAllActiveSessions,
  startSessionCleanup,
  config: SESSION_CONFIG
};