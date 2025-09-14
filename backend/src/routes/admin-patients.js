import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getDatabase } from '../config/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import subscriptionService from '../services/subscription.service.js';
import emailService from '../services/email.service.js';

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

// Get full patient details with all related data
router.get('/:id/full',
  requireAuth,
  requireRole(['admin', 'provider']),
  [param('id').isUUID()],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const { id } = req.params;

    // Get patient basic info
    const patientResult = await db.query(`
      SELECT 
        p.*,
        COUNT(DISTINCT c.id) as total_consultations,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(c.created_at) as last_visit
      FROM patients p
      LEFT JOIN consultations c ON c.patient_id = p.id
      LEFT JOIN orders o ON o.patient_id = p.id AND o.payment_status = 'completed'
      WHERE p.id = $1
      GROUP BY p.id
    `, [id]);

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patient = patientResult.rows[0];
    delete patient.password_hash;

    // Get active subscription
    const subscriptionResult = await db.query(`
      SELECT 
        ps.*,
        p.name as plan_name,
        p.price,
        p.features
      FROM patient_subscriptions ps
      LEFT JOIN (
        SELECT DISTINCT ON (plan_id) plan_id, name, price, features::text
        FROM treatment_plans
      ) p ON ps.plan_id = p.plan_id
      WHERE ps.patient_id = $1 
        AND ps.status IN ('active', 'paused')
      ORDER BY ps.created_at DESC
      LIMIT 1
    `, [id]);

    // Get active treatment plans
    const plansResult = await db.query(`
      SELECT 
        tp.*,
        c.id as consultation_id,
        c.created_at as started_at,
        pr.id as assigned_to_id,
        pr.first_name || ' ' || pr.last_name as assigned_to
      FROM treatment_plans tp
      JOIN consultations c ON c.selected_plan_id = tp.id
      LEFT JOIN providers pr ON c.provider_id = pr.id
      WHERE c.patient_id = $1 
        AND c.status IN ('active', 'in_progress', 'completed')
      ORDER BY c.created_at DESC
    `, [id]);

    // Get current medications/prescriptions
    const medicationsResult = await db.query(`
      SELECT 
        p.*,
        c.consultation_type,
        pr.first_name || ' ' || pr.last_name as prescriber
      FROM prescriptions p
      JOIN consultations c ON p.consultation_id = c.id
      LEFT JOIN providers pr ON c.provider_id = pr.id
      WHERE p.patient_id = $1
      ORDER BY p.created_at DESC
    `, [id]);

    // Get consultation history
    const consultationsResult = await db.query(`
      SELECT 
        c.*,
        pr.first_name || ' ' || pr.last_name as provider_name,
        pr.title as provider_title,
        COUNT(cm.id) as message_count
      FROM consultations c
      LEFT JOIN providers pr ON c.provider_id = pr.id
      LEFT JOIN consultation_messages cm ON cm.consultation_id = c.id
      WHERE c.patient_id = $1
      GROUP BY c.id, pr.id
      ORDER BY c.created_at DESC
      LIMIT 20
    `, [id]);

    // Get clinical notes
    const notesResult = await db.query(`
      SELECT 
        cn.*,
        pr.first_name || ' ' || pr.last_name as provider_name,
        pr.title as provider_title
      FROM clinical_notes cn
      LEFT JOIN providers pr ON cn.provider_id = pr.id
      WHERE cn.patient_id = $1
      ORDER BY cn.created_at DESC
      LIMIT 10
    `, [id]);

    // Get billing history
    const billingResult = await db.query(`
      SELECT 
        o.id,
        o.order_number,
        o.total_amount,
        o.payment_status,
        o.payment_method,
        o.created_at,
        array_agg(
          json_build_object(
            'medication_name', oi.medication_name,
            'quantity', oi.quantity,
            'price', oi.unit_price
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.patient_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `, [id]);

    res.json({
      success: true,
      data: {
        patient,
        subscription: subscriptionResult.rows[0] || null,
        activePlans: plansResult.rows,
        medications: medicationsResult.rows.filter(m => m.status === 'active'),
        consultationHistory: consultationsResult.rows,
        clinicalNotes: notesResult.rows,
        billingHistory: billingResult.rows
      }
    });
  })
);

// Update patient subscription
router.put('/:id/subscription',
  requireAuth,
  requireRole('admin'),
  [
    param('id').isUUID(),
    body('action').isIn(['change_plan', 'pause', 'resume', 'cancel']),
    body('plan_id').optional().isString(),
    body('reason').optional().isString(),
    body('resume_date').optional().isISO8601(),
    body('immediate').optional().isBoolean()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { action, plan_id, reason, resume_date, immediate } = req.body;

    let result;
    
    // Get current subscription
    const subscription = await subscriptionService.getSubscription(id);
    
    if (!subscription && action !== 'change_plan') {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    switch (action) {
      case 'change_plan':
        if (!plan_id) {
          return res.status(400).json({ error: 'plan_id required for plan change' });
        }
        if (subscription) {
          result = await subscriptionService.updateSubscription(subscription.id, plan_id);
        } else {
          // Create new subscription
          result = await subscriptionService.createSubscription(id, plan_id, null);
        }
        break;
        
      case 'pause':
        if (!resume_date) {
          return res.status(400).json({ error: 'resume_date required for pause' });
        }
        result = await subscriptionService.pauseSubscription(subscription.id, resume_date);
        break;
        
      case 'cancel':
        result = await subscriptionService.cancelSubscription(
          subscription.id, 
          reason || 'Admin cancellation',
          immediate || false
        );
        break;
        
      case 'resume':
        // Resume paused subscription
        const db = getDatabase();
        await db.query(`
          UPDATE patient_subscriptions 
          SET status = 'active', paused_at = NULL, resume_date = NULL
          WHERE id = $1
        `, [subscription.id]);
        result = { success: true };
        break;
    }

    // Log admin action
    const db = getDatabase();
    await db.query(`
      INSERT INTO admin_actions (
        admin_id, action_type, target_type, target_id, 
        action_details, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      req.user.id,
      `subscription_${action}`,
      'patient',
      id,
      JSON.stringify({ action, plan_id, reason, resume_date, immediate })
    ]);

    res.json({
      success: true,
      message: `Subscription ${action} completed successfully`,
      data: result
    });
  })
);

// Apply billing adjustment
router.post('/:id/billing/adjustment',
  requireAuth,
  requireRole('admin'),
  [
    param('id').isUUID(),
    body('type').isIn(['credit', 'refund', 'discount']),
    body('amount').isFloat({ min: 0 }),
    body('reason').isString().notEmpty(),
    body('order_id').optional().isUUID()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const { id } = req.params;
    const { type, amount, reason, order_id } = req.body;

    // Create billing adjustment record
    const adjustmentResult = await db.query(`
      INSERT INTO billing_adjustments (
        patient_id, type, amount, reason, order_id, 
        created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `, [id, type, amount, reason, order_id, req.user.id]);

    // Update patient balance if credit
    if (type === 'credit') {
      await db.query(`
        UPDATE patients 
        SET account_credit = COALESCE(account_credit, 0) + $1
        WHERE id = $2
      `, [amount, id]);
    }

    // Process refund if applicable
    if (type === 'refund' && order_id) {
      await db.query(`
        UPDATE orders 
        SET refund_amount = COALESCE(refund_amount, 0) + $1,
            refund_status = 'partial',
            refund_reason = $2
        WHERE id = $3
      `, [amount, reason, order_id]);
    }

    // Log admin action
    await db.query(`
      INSERT INTO admin_actions (
        admin_id, action_type, target_type, target_id, 
        action_details, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      req.user.id,
      `billing_${type}`,
      'patient',
      id,
      JSON.stringify({ type, amount, reason, order_id })
    ]);

    res.json({
      success: true,
      message: `Billing ${type} applied successfully`,
      data: adjustmentResult.rows[0]
    });
  })
);

// Override treatment plan
router.put('/:id/treatment-plan/:planId',
  requireAuth,
  requireRole(['admin', 'provider']),
  [
    param('id').isUUID(),
    param('planId').isUUID(),
    body('modifications').optional().isObject(),
    body('reason').isString().notEmpty()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const { id: patientId, planId } = req.params;
    const { modifications, reason } = req.body;

    // Create treatment plan override
    const overrideResult = await db.query(`
      INSERT INTO treatment_plan_overrides (
        patient_id, plan_id, provider_id, modifications, 
        reason, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `, [patientId, planId, req.user.id, modifications || {}, reason]);

    // Update active consultation if exists
    await db.query(`
      UPDATE consultations 
      SET treatment_override_id = $1,
          updated_at = NOW()
      WHERE patient_id = $2 
        AND selected_plan_id = $3
        AND status IN ('active', 'in_progress')
    `, [overrideResult.rows[0].id, patientId, planId]);

    res.json({
      success: true,
      message: 'Treatment plan override applied',
      data: overrideResult.rows[0]
    });
  })
);

// Add clinical note
router.post('/:id/notes',
  requireAuth,
  requireRole(['admin', 'provider']),
  [
    param('id').isUUID(),
    body('type').isIn(['soap', 'progress', 'admin', 'internal']),
    body('subjective').optional().isString(),
    body('objective').optional().isString(),
    body('assessment').optional().isString(),
    body('plan').optional().isString(),
    body('content').optional().isString(),
    body('consultation_id').optional().isUUID()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const { id } = req.params;
    const noteData = req.body;

    // Create clinical note
    const noteResult = await db.query(`
      INSERT INTO clinical_notes (
        patient_id, provider_id, consultation_id, type,
        subjective, objective, assessment, plan, content,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *
    `, [
      id,
      req.user.id,
      noteData.consultation_id || null,
      noteData.type,
      noteData.subjective || null,
      noteData.objective || null,
      noteData.assessment || null,
      noteData.plan || null,
      noteData.content || null
    ]);

    res.json({
      success: true,
      message: 'Clinical note added successfully',
      data: noteResult.rows[0]
    });
  })
);

// Update clinical note
router.put('/:id/notes/:noteId',
  requireAuth,
  requireRole(['admin', 'provider']),
  [
    param('id').isUUID(),
    param('noteId').isUUID(),
    body('subjective').optional().isString(),
    body('objective').optional().isString(),
    body('assessment').optional().isString(),
    body('plan').optional().isString(),
    body('content').optional().isString()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const { noteId } = req.params;
    
    // Check if note is locked
    const noteCheck = await db.query(
      'SELECT is_locked FROM clinical_notes WHERE id = $1',
      [noteId]
    );
    
    if (noteCheck.rows[0]?.is_locked) {
      return res.status(403).json({ error: 'Note is locked and cannot be edited' });
    }

    // Update note
    const updates = Object.entries(req.body)
      .filter(([key]) => ['subjective', 'objective', 'assessment', 'plan', 'content'].includes(key))
      .map(([key, value], index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = Object.entries(req.body)
      .filter(([key]) => ['subjective', 'objective', 'assessment', 'plan', 'content'].includes(key))
      .map(([, value]) => value);

    const noteResult = await db.query(`
      UPDATE clinical_notes 
      SET ${updates}, 
          updated_at = NOW(),
          updated_by = $${values.length + 2}
      WHERE id = $1
      RETURNING *
    `, [noteId, ...values, req.user.id]);

    res.json({
      success: true,
      message: 'Clinical note updated successfully',
      data: noteResult.rows[0]
    });
  })
);

// Add patient flag
router.post('/:id/flags',
  requireAuth,
  requireRole('admin'),
  [
    param('id').isUUID(),
    body('type').isIn(['high_risk', 'vip', 'collections', 'fraud_risk', 'compliance']),
    body('reason').isString().notEmpty(),
    body('expires_at').optional().isISO8601()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const { id } = req.params;
    const { type, reason, expires_at } = req.body;

    const flagResult = await db.query(`
      INSERT INTO patient_flags (
        patient_id, flag_type, reason, expires_at, 
        created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `, [id, type, reason, expires_at || null, req.user.id]);

    res.json({
      success: true,
      message: 'Patient flag added successfully',
      data: flagResult.rows[0]
    });
  })
);

// Get patient statistics
router.get('/:id/statistics',
  requireAuth,
  requireRole(['admin', 'provider']),
  [param('id').isUUID()],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const { id } = req.params;

    const stats = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM consultations WHERE patient_id = $1) as total_consultations,
        (SELECT COUNT(*) FROM consultations WHERE patient_id = $1 AND status = 'completed') as completed_consultations,
        (SELECT COUNT(*) FROM prescriptions WHERE patient_id = $1 AND status = 'active') as active_prescriptions,
        (SELECT COUNT(*) FROM orders WHERE patient_id = $1) as total_orders,
        (SELECT SUM(total_amount) FROM orders WHERE patient_id = $1 AND payment_status = 'completed') as lifetime_value,
        (SELECT AVG(total_amount) FROM orders WHERE patient_id = $1 AND payment_status = 'completed') as avg_order_value,
        (SELECT COUNT(*) FROM consultation_messages cm 
         JOIN consultations c ON cm.consultation_id = c.id 
         WHERE c.patient_id = $1) as total_messages,
        (SELECT MAX(created_at) FROM consultations WHERE patient_id = $1) as last_consultation,
        (SELECT subscription_active FROM patients WHERE id = $1) as has_subscription
    `, [id]);

    res.json({
      success: true,
      data: stats.rows[0]
    });
  })
);

export default router;
