/**
 * Admin Routes - Refactored with Service Layer
 * Handles HTTP requests and delegates business logic to service layer
 */

import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import adminService from '../services/admin.service.js';

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Get admin dashboard metrics
router.get('/metrics',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const metrics = await adminService.getDashboardMetrics();
    res.json({
      success: true,
      data: metrics
    });
  })
);

// Get support tickets
router.get('/support/tickets',
  requireAuth,
  requireRole('admin'),
  [
    query('status').optional().isString(),
    query('priority').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const tickets = await adminService.getSupportTickets(req.query);
    res.json({
      success: true,
      data: tickets
    });
  })
);

// Create support ticket
router.post('/support/tickets',
  requireAuth,
  [
    body('category').isString().notEmpty(),
    body('subject').isString().notEmpty(),
    body('description').isString().notEmpty(),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('requester_id').optional().isUUID(),
    body('requester_type').optional().isIn(['patient', 'provider', 'admin']),
    body('related_consultation_id').optional().isUUID(),
    body('related_order_id').optional().isUUID()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const ticket = await adminService.createSupportTicket(req.body);
    res.status(201).json({
      success: true,
      data: ticket,
      message: 'Support ticket created successfully'
    });
  })
);

// Update support ticket
router.put('/support/tickets/:id',
  requireAuth,
  requireRole('admin'),
  [
    param('id').isUUID(),
    body('status').optional().isIn(['open', 'in_progress', 'resolved', 'closed']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('assigned_to').optional().isUUID(),
    body('resolution').optional().isString()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const updated = await adminService.updateSupportTicket(req.params.id, req.body);
    res.json({
      success: true,
      data: updated,
      message: 'Ticket updated successfully'
    });
  })
);

// Get problem categories analytics
router.get('/analytics/problem-categories',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const categories = await adminService.getProblemCategoriesAnalytics();
    res.json({
      success: true,
      data: categories
    });
  })
);

// Get pending consultations
router.get('/consultations/pending',
  requireAuth,
  requireRole('admin'),
  [
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const consultations = await adminService.getPendingConsultations(req.query.limit);
    res.json({
      success: true,
      data: consultations
    });
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
    const updated = await adminService.assignConsultationToProvider(
      req.params.id,
      req.body.provider_id
    );
    res.json({
      success: true,
      data: updated,
      message: 'Consultation assigned successfully'
    });
  })
);

// Get all patients
router.get('/patients',
  requireAuth,
  requireRole('admin'),
  [
    query('search').optional().isString(),
    query('subscription_tier').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const patients = await adminService.getPatients(req.query);
    res.json({
      success: true,
      data: patients
    });
  })
);

// Get all providers
router.get('/providers',
  requireAuth,
  requireRole('admin'),
  [
    query('is_active').optional().isBoolean(),
    query('is_available').optional().isBoolean(),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const providers = await adminService.getProviders(req.query);
    res.json({
      success: true,
      data: providers
    });
  })
);

// Get inventory
router.get('/inventory',
  requireAuth,
  requireRole('admin'),
  [
    query('category').optional().isString(),
    query('low_stock').optional().isBoolean()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const inventory = await adminService.getInventory(req.query);
    res.json({
      success: true,
      data: inventory
    });
  })
);

// Update inventory
router.put('/inventory/:id',
  requireAuth,
  requireRole('admin'),
  [
    param('id').isUUID(),
    body('quantity_on_hand').optional().isInt({ min: 0 }),
    body('reorder_point').optional().isInt({ min: 0 }),
    body('retail_price').optional().isFloat({ min: 0 }),
    body('subscription_price').optional().isFloat({ min: 0 })
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const updated = await adminService.updateInventory(req.params.id, req.body);
    res.json({
      success: true,
      data: updated,
      message: 'Inventory updated successfully'
    });
  })
);

// Get order statistics
router.get('/orders/stats',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const stats = await adminService.getOrderStatistics();
    res.json({
      success: true,
      data: stats
    });
  })
);

// Admin login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isString()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    try {
      const result = await adminService.login(req.body.email, req.body.password);
      res.json({
        success: true,
        data: result,
        message: 'Login successful'
      });
    } catch (error) {
      if (error.message === 'Invalid credentials') {
        res.status(401).json({ error: 'Invalid credentials' });
      } else if (error.message === 'Account is inactive') {
        res.status(403).json({ error: 'Account is inactive' });
      } else {
        throw error;
      }
    }
  })
);

// Track analytics event
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
    const event = await adminService.trackAnalyticsEvent(
      req.body,
      req.user.id,
      req.user.role
    );
    res.status(201).json({
      success: true,
      data: event
    });
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
    const summary = await adminService.getAnalyticsSummary(req.query.period);
    res.json({
      success: true,
      ...summary
    });
  })
);

export default router;
