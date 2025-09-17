import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import AdminService from '../services/admin.service.js';
import AnalyticsService from '../services/analytics.service.js';
import AuthService from '../services/auth.service.js';

const router = express.Router();

// Services will be instantiated when needed
let adminService;
let analyticsService;
let authService;

// Initialize services on first use
const getServices = () => {
  if (!adminService) adminService = new AdminService();
  if (!analyticsService) analyticsService = new AnalyticsService();
  if (!authService) authService = new AuthService();
  return { adminService, analyticsService, authService };
};

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Admin login - delegated to auth service
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isString().notEmpty()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    try {
      const { authService } = getServices();
      const result = await authService.adminLogin(email, password);
      res.json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Login failed'
      });
    }
  })
);

// Get admin dashboard metrics
router.get('/metrics',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    try {
      const { adminService } = getServices();
      const metrics = await adminService.getDashboardMetrics();
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('Metrics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load metrics'
      });
    }
  })
);

// Get dashboard data
router.get('/dashboard',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    try {
      const { adminService } = getServices();
      const dashboardData = await adminService.getDashboardData();
      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load dashboard data'
      });
    }
  })
);

// Get pending consultations for admin review
router.get('/consultations/pending',
  requireAuth,
  requireRole('admin'),
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    try {
      const { limit = 20, offset = 0 } = req.query;
      const { adminService } = getServices();
      const consultations = await adminService.getPendingConsultations(limit, offset);
      
      res.json({
        success: true,
        data: consultations
      });
    } catch (error) {
      console.error('Pending consultations error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load pending consultations'
      });
    }
  })
);

// Assign consultation to provider
router.post('/consultations/:id/assign',
  requireAuth,
  requireRole('admin'),
  [
    param('id').isUUID(),
    body('provider_id').isUUID()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const { provider_id } = req.body;
      
      const { adminService } = getServices();
      const result = await adminService.assignConsultation(id, provider_id);
      
      res.json({
        success: true,
        data: result,
        message: 'Consultation assigned successfully'
      });
    } catch (error) {
      console.error('Consultation assignment error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to assign consultation'
      });
    }
  })
);

// Get all patients (admin)
router.get('/patients',
  requireAuth,
  requireRole('admin'),
  [
    query('search').optional().isString().trim(),
    query('subscription_tier').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    try {
      const { adminService } = getServices();
      const patients = await adminService.getPatients(req.query);
      
      res.json({
        success: true,
        data: patients
      });
    } catch (error) {
      console.error('Get patients error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load patients'
      });
    }
  })
);

// Get all providers (admin)
router.get('/providers',
  requireAuth,
  requireRole('admin'),
  [
    query('is_active').optional().isBoolean().toBoolean(),
    query('is_available').optional().isBoolean().toBoolean(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    try {
      const { adminService } = getServices();
      const providers = await adminService.getProviders(req.query);
      
      res.json({
        success: true,
        data: providers
      });
    } catch (error) {
      console.error('Get providers error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load providers'
      });
    }
  })
);

// Get order statistics
router.get('/orders/stats',
  requireAuth,
  requireRole('admin'),
  [
    query('period').optional().isIn(['today', 'week', 'month', 'year'])
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    try {
      const { period = 'month' } = req.query;
      const { adminService } = getServices();
      const stats = await adminService.getOrderStatistics(period);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Order stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load order statistics'
      });
    }
  })
);

// Analytics events tracking
router.post('/analytics/events',
  requireAuth,
  [
    body('event_type').isString().notEmpty(),
    body('event_category').optional().isString(),
    body('event_action').optional().isString(),
    body('event_label').optional().isString(),
    body('event_value').optional().isFloat(),
    body('metadata').optional().isObject()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    try {
      const eventData = {
        ...req.body,
        user_id: req.user.id,
        user_type: req.user.role
      };
      
      const { analyticsService } = getServices();
      const event = await analyticsService.trackEvent(eventData);
      
      res.status(201).json({
        success: true,
        data: event
      });
    } catch (error) {
      console.error('Analytics event error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to track event'
      });
    }
  })
);

// Get analytics summary
router.get('/analytics/summary',
  requireAuth,
  requireRole('admin'),
  [
    query('period').optional().isIn(['today', 'week', 'month', 'year'])
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    try {
      const { period = 'month' } = req.query;
      const { analyticsService } = getServices();
      const summary = await analyticsService.getAnalyticsSummary(period);
      
      res.json({
        success: true,
        data: summary,
        period
      });
    } catch (error) {
      console.error('Analytics summary error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load analytics summary'
      });
    }
  })
);

// Audit logs endpoint
router.get('/audit-logs',
  requireAuth,
  requireRole('admin'),
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    query('action').optional().isString(),
    query('userId').optional().isUUID()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    try {
      const { adminService } = getServices();
      const logs = await adminService.getAuditLogs(req.query);
      
      res.json({
        success: true,
        data: logs.data,
        pagination: logs.pagination
      });
    } catch (error) {
      console.error('Audit logs error:', error);
      res.json({
        success: true,
        data: [],
        message: 'Audit logs not available'
      });
    }
  })
);

// Admin user management
router.get('/users',
  requireAuth,
  requireRole('admin'),
  [
    query('role').optional().isIn(['admin', 'provider', 'patient']),
    query('status').optional().isIn(['active', 'inactive', 'suspended']),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    try {
      const { adminService } = getServices();
      const users = await adminService.getAllUsers(req.query);
      
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load users'
      });
    }
  })
);

// Update user status
router.patch('/users/:id/status',
  requireAuth,
  requireRole('admin'),
  [
    param('id').isUUID(),
    body('status').isIn(['active', 'inactive', 'suspended']),
    body('reason').optional().isString()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      
      const { adminService } = getServices();
      const result = await adminService.updateUserStatus(id, status, reason);
      
      res.json({
        success: true,
        data: result,
        message: 'User status updated successfully'
      });
    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update user status'
      });
    }
  })
);

// System health check
router.get('/health',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    try {
      const { adminService } = getServices();
      const health = await adminService.getSystemHealth();
      
      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      console.error('System health error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check system health'
      });
    }
  })
);

export default router;
