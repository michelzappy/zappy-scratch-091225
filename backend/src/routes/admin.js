import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getDatabase } from '../config/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
    const db = getDatabase();
    
    const metrics = await db.raw(`
      SELECT 
        (SELECT COUNT(*) FROM patients WHERE is_active = true) as active_patients,
        (SELECT COUNT(*) FROM consultations WHERE status = 'pending') as open_consultations,
        (SELECT COUNT(*) FROM prescriptions WHERE status = 'active') as active_prescriptions,
        (SELECT COUNT(*) FROM orders WHERE payment_status = 'pending') as pending_payments,
        (SELECT COUNT(*) FROM orders WHERE fulfillment_status = 'pending') as pending_fulfillment,
        (SELECT COUNT(*) FROM providers WHERE is_available = true) as available_providers,
        (SELECT SUM(total_amount) FROM orders WHERE DATE(created_at) = CURRENT_DATE) as today_revenue,
        (SELECT COUNT(*) FROM consultations WHERE DATE(created_at) = CURRENT_DATE) as today_consultations,
        (SELECT COUNT(*) FROM patients WHERE DATE(created_at) = CURRENT_DATE) as today_new_patients
    `);

    res.json({
      success: true,
      data: metrics.rows[0] || {}
    });
  })
);


// Get pending consultations for admin review
router.get('/consultations/pending',
  requireAuth,
  requireRole('admin'),
  [
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const { limit = 20 } = req.query;

    const consultations = await db.raw(`
      SELECT 
        c.*,
        p.first_name || ' ' || p.last_name as patient_name,
        p.subscription_tier,
        EXTRACT(EPOCH FROM (NOW() - c.submitted_at))/60 as wait_time_minutes,
        CASE 
          WHEN c.provider_id IS NOT NULL THEN pr.first_name || ' ' || pr.last_name
          ELSE 'Unassigned'
        END as provider_name,
        pr.id as provider_id
      FROM consultations c
      JOIN patients p ON c.patient_id = p.id
      LEFT JOIN providers pr ON c.provider_id = pr.id
      WHERE c.status IN ('pending', 'assigned')
      ORDER BY c.submitted_at ASC
      LIMIT ?
    `, [limit]);

    res.json({
      success: true,
      data: consultations.rows || []
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
    const db = getDatabase();
    
    const [updated] = await db
      .update('consultations')
      .set({
        provider_id: req.body.provider_id,
        status: 'assigned',
        assigned_at: new Date(),
        updated_at: new Date()
      })
      .where({ id: req.params.id })
      .returning();

    res.json({
      success: true,
      data: updated,
      message: 'Consultation assigned successfully'
    });
  })
);

// Get all patients (admin)
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
    const db = getDatabase();
    const { search, subscription_tier, limit = 50, offset = 0 } = req.query;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(p.first_name ILIKE $${paramIndex} OR p.last_name ILIKE $${paramIndex} OR p.email ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (subscription_tier) {
      whereConditions.push(`p.subscription_tier = $${paramIndex}`);
      params.push(subscription_tier);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const patients = await db.raw(`
      SELECT 
        p.*,
        COUNT(DISTINCT c.id) as total_consultations,
        COUNT(DISTINCT o.id) as total_orders,
        SUM(o.total_amount) as total_spent,
        MAX(c.created_at) as last_consultation_date
      FROM patients p
      LEFT JOIN consultations c ON c.patient_id = p.id
      LEFT JOIN orders o ON o.patient_id = p.id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset]);

    res.json({
      success: true,
      data: patients.rows || []
    });
  })
);

// Get all providers (admin)
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
    const db = getDatabase();
    const { is_active, is_available, limit = 50 } = req.query;

    let whereConditions = [];
    if (is_active !== undefined) {
      whereConditions.push(`is_active = ${is_active}`);
    }
    if (is_available !== undefined) {
      whereConditions.push(`is_available = ${is_available}`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const providers = await db.raw(`
      SELECT 
        p.*,
        COUNT(c.id) as total_consultations_today,
        AVG(EXTRACT(EPOCH FROM (c.completed_at - c.assigned_at))/60) as avg_response_time
      FROM providers p
      LEFT JOIN consultations c ON c.provider_id = p.id AND DATE(c.created_at) = CURRENT_DATE
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ?
    `, [limit]);

    // Remove password hashes
    providers.rows?.forEach(p => delete p.password_hash);

    res.json({
      success: true,
      data: providers.rows || []
    });
  })
);


// Get order statistics
router.get('/orders/stats',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    
    const stats = await db.raw(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as paid_orders,
        COUNT(CASE WHEN fulfillment_status = 'pending' THEN 1 END) as pending_fulfillment,
        COUNT(CASE WHEN fulfillment_status = 'shipped' THEN 1 END) as shipped_orders,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_order_value,
        COUNT(CASE WHEN is_subscription = true THEN 1 END) as subscription_orders
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);

    res.json({
      success: true,
      data: stats.rows[0] || {}
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
    const db = getDatabase();
    const { email, password } = req.body;

    // Find admin user
    const [admin] = await db
      .select()
      .from('admins')
      .where({ email })
      .limit(1);

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if active
    if (!admin.is_active) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Update last login
    await db
      .update('admins')
      .set({ last_login: new Date() })
      .where({ id: admin.id });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin.id, 
        email: admin.email,
        role: 'admin',
        permissions: admin.permissions
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );

    delete admin.password_hash;

    res.json({
      success: true,
      data: {
        user: admin,
        token
      },
      message: 'Login successful'
    });
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
    const db = getDatabase();
    
    const eventData = {
      ...req.body,
      user_id: req.user.id,
      user_type: req.user.role,
      created_at: new Date()
    };

    const [event] = await db
      .insert('analytics_events')
      .values(eventData)
      .returning();

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
    const db = getDatabase();
    const { period = 'month' } = req.query;

    let dateFilter = '';
    switch(period) {
      case 'today':
        dateFilter = "DATE(created_at) = CURRENT_DATE";
        break;
      case 'week':
        dateFilter = "created_at >= NOW() - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "created_at >= NOW() - INTERVAL '30 days'";
        break;
      case 'year':
        dateFilter = "created_at >= NOW() - INTERVAL '1 year'";
        break;
    }

    const summary = await db.raw(`
      SELECT 
        COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN user_id END) as unique_visitors,
        COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as page_views,
        COUNT(CASE WHEN event_type = 'consultation_started' THEN 1 END) as consultations_started,
        COUNT(CASE WHEN event_type = 'consultation_completed' THEN 1 END) as consultations_completed,
        COUNT(CASE WHEN event_type = 'order_placed' THEN 1 END) as orders_placed,
        SUM(CASE WHEN event_type = 'order_placed' THEN event_value ELSE 0 END) as total_revenue
      FROM analytics_events
      WHERE ${dateFilter}
    `);

    res.json({
      success: true,
      data: summary.rows[0] || {},
      period
    });
  })
);

export default router;
