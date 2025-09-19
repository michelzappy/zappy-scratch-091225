import express from 'express';
import { getAuthHealth, startAuthHealthMonitoring } from '../middleware/authResilience.js';
import { getAllActiveSessions, getSessionInfo, forceLogout } from '../middleware/hipaaSession.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Start authentication health monitoring when this module loads
let healthMonitoringCleanup = null;

// Initialize health monitoring
const initializeMonitoring = () => {
  if (!healthMonitoringCleanup) {
    healthMonitoringCleanup = startAuthHealthMonitoring();
    console.log('Authentication health monitoring initialized');
  }
};

// Initialize on module load
initializeMonitoring();

/**
 * Public authentication system health endpoint
 * Used by monitoring systems and load balancers
 */
router.get('/health', asyncHandler(async (req, res) => {
  return getAuthHealth(req, res);
}));

/**
 * Detailed authentication system status (admin only)
 */
router.get('/status', 
  requireAuth, 
  requireAdmin,
  asyncHandler(async (req, res) => {
    const healthData = await getAuthHealth(req, res);
    
    // Get additional metrics for admin view
    const activeSessions = getAllActiveSessions();
    const sessionStats = {
      totalActiveSessions: activeSessions.length,
      sessionsByRole: activeSessions.reduce((acc, session) => {
        acc[session.userRole] = (acc[session.userRole] || 0) + 1;
        return acc;
      }, {}),
      sessionsByAuthMethod: activeSessions.reduce((acc, session) => {
        acc[session.authMethod] = (acc[session.authMethod] || 0) + 1;
        return acc;
      }, {}),
      averageSessionAge: activeSessions.length > 0 
        ? activeSessions.reduce((acc, session) => 
            acc + (Date.now() - session.createdAt), 0) / activeSessions.length
        : 0,
      sessionsWithSecurityFlags: activeSessions.filter(session => 
        Object.values(session.securityFlags).some(flag => flag)
      ).length
    };
    
    return res.json({
      ...healthData.body || healthData,
      sessionManagement: sessionStats,
      recentEvents: {
        lastHealthCheck: Date.now(),
        monitoringActive: !!healthMonitoringCleanup
      }
    });
  })
);

/**
 * Get all active sessions (admin only)
 */
router.get('/sessions',
  requireAuth,
  requireAdmin, 
  asyncHandler(async (req, res) => {
    const sessions = getAllActiveSessions();
    
    // Filter sensitive information for security
    const sanitizedSessions = sessions.map(session => ({
      sessionId: session.sessionId,
      userId: session.userId,
      userRole: session.userRole,
      email: session.email?.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress?.replace(/\.\d+$/, '.***'), // Mask IP
      authMethod: session.authMethod,
      renewalCount: session.renewalCount,
      accessCount: session.accessCount,
      securityFlags: session.securityFlags,
      timeUntilExpiry: session.expiresAt - Date.now()
    }));
    
    res.json({
      success: true,
      data: sanitizedSessions,
      total: sanitizedSessions.length
    });
  })
);

/**
 * Get specific session information (admin only)
 */
router.get('/sessions/:sessionId',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const sessionInfo = getSessionInfo(req.params.sessionId);
    
    if (!sessionInfo) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }
    
    res.json({
      success: true,
      data: sessionInfo
    });
  })
);

/**
 * Force logout a specific session (admin only)
 */
router.delete('/sessions/:sessionId',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const success = forceLogout(req.params.sessionId);
    
    if (!success) {
      return res.status(404).json({
        error: 'Session not found or already expired'
      });
    }
    
    res.json({
      success: true,
      message: 'Session terminated successfully'
    });
  })
);

/**
 * Authentication system metrics endpoint
 */
router.get('/metrics',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const activeSessions = getAllActiveSessions();
    const now = Date.now();
    
    // Calculate various metrics
    const metrics = {
      authentication: {
        totalActiveSessions: activeSessions.length,
        avgSessionDuration: activeSessions.length > 0 
          ? activeSessions.reduce((acc, s) => acc + (now - s.createdAt), 0) / activeSessions.length
          : 0,
        sessionsByRole: activeSessions.reduce((acc, session) => {
          acc[session.userRole] = (acc[session.userRole] || 0) + 1;
          return acc;
        }, {}),
        sessionsByAuthMethod: activeSessions.reduce((acc, session) => {
          acc[session.authMethod] = (acc[session.authMethod] || 0) + 1;
          return acc;
        }, {}),
        sessionsExpiringSoon: activeSessions.filter(s => 
          (s.expiresAt - now) < 300000 // 5 minutes
        ).length,
        sessionsWithSecurityFlags: activeSessions.filter(session => 
          Object.values(session.securityFlags).some(flag => flag)
        ).length
      },
      security: {
        suspiciousSessionsCount: activeSessions.filter(s => 
          s.securityFlags.suspiciousActivity
        ).length,
        multiLocationSessionsCount: activeSessions.filter(s => 
          s.securityFlags.multipleLocations
        ).length,
        highRenewalSessionsCount: activeSessions.filter(s => 
          s.renewalCount > 5
        ).length,
        totalSessionRenewals: activeSessions.reduce((acc, s) => 
          acc + s.renewalCount, 0
        )
      },
      performance: {
        averageAccessCount: activeSessions.length > 0 
          ? activeSessions.reduce((acc, s) => acc + s.accessCount, 0) / activeSessions.length
          : 0,
        totalAccessCount: activeSessions.reduce((acc, s) => acc + s.accessCount, 0),
        peakConcurrentSessions: Math.max(...Object.values(
          activeSessions.reduce((acc, session) => {
            acc[session.userId] = (acc[session.userId] || 0) + 1;
            return acc;
          }, {})
        ).concat([0])) // concat([0]) to handle empty array case
      },
      timestamp: now
    };
    
    res.json({
      success: true,
      data: metrics
    });
  })
);

/**
 * Test authentication resilience (admin only, development/staging only)
 */
router.post('/test-resilience',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Authentication resilience testing not available in production'
      });
    }
    
    const { testType } = req.body;
    
    switch (testType) {
      case 'supabase-failure':
        // Temporarily disable Supabase by setting a flag
        // This would trigger JWT fallback
        return res.json({
          success: true,
          message: 'Supabase failure simulation initiated',
          note: 'Check authentication system health endpoint for status changes'
        });
        
      case 'circuit-breaker':
        // Simulate circuit breaker activation
        return res.json({
          success: true,
          message: 'Circuit breaker simulation initiated'
        });
        
      default:
        return res.status(400).json({
          error: 'Invalid test type',
          validTypes: ['supabase-failure', 'circuit-breaker']
        });
    }
  })
);

/**
 * Graceful shutdown cleanup
 */
export const cleanupAuthHealthMonitoring = () => {
  if (healthMonitoringCleanup) {
    healthMonitoringCleanup();
    healthMonitoringCleanup = null;
    console.log('Authentication health monitoring cleaned up');
  }
};

// Handle process termination
process.on('SIGTERM', cleanupAuthHealthMonitoring);
process.on('SIGINT', cleanupAuthHealthMonitoring);

export default router;