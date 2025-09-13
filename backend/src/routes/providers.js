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

// Get current provider profile
router.get('/me',
  requireAuth,
  requireRole('provider'),
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const [provider] = await db
      .select()
      .from('providers')
      .where({ id: req.user.id })
      .limit(1);

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    delete provider.password_hash;
    
    res.json({
      success: true,
      data: provider
    });
  })
);

// Get provider statistics
router.get('/me/stats',
  requireAuth,
  requireRole('provider'),
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    
    const stats = await db.raw(`
      SELECT 
        (SELECT COUNT(*) FROM consultations WHERE provider_id = ?) as total_consultations,
        (SELECT COUNT(*) FROM consultations WHERE provider_id = ? AND status = 'pending') as pending_consultations,
        (SELECT COUNT(*) FROM consultations WHERE provider_id = ? AND DATE(created_at) = CURRENT_DATE) as today_consultations,
        (SELECT COUNT(*) FROM consultations WHERE provider_id = ? AND status = 'completed' AND DATE(created_at) = CURRENT_DATE) as today_completed,
        (SELECT AVG(EXTRACT(EPOCH FROM (completed_at - assigned_at))/60) 
         FROM consultations 
         WHERE provider_id = ? AND completed_at IS NOT NULL) as avg_response_time_minutes,
        (SELECT COUNT(*) FROM consultation_messages cm 
         JOIN consultations c ON cm.consultation_id = c.id 
         WHERE c.provider_id = ? AND cm.is_read = false AND cm.sender_type = 'patient') as unread_messages,
        (SELECT rating FROM providers WHERE id = ?) as rating,
        (SELECT total_reviews FROM providers WHERE id = ?) as total_reviews
    `, [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]);

    res.json({
      success: true,
      data: stats.rows[0] || {}
    });
  })
);

// Get provider's consultations
router.get('/consultations',
  requireAuth,
  requireRole('provider'),
  [
    query('status').optional().isIn(['pending', 'assigned', 'completed', 'cancelled']),
    query('urgency').optional().isIn(['regular', 'urgent', 'emergency']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const { status, urgency, limit = 20, offset = 0 } = req.query;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    // Base query to get all pending consultations OR provider's assigned consultations
    if (status === 'pending') {
      whereConditions.push(`(c.status = 'pending' OR (c.provider_id = $${paramIndex} AND c.status != 'pending'))`);
      params.push(req.user.id);
      paramIndex++;
    } else {
      whereConditions.push(`c.provider_id = $${paramIndex}`);
      params.push(req.user.id);
      paramIndex++;
      
      if (status) {
        whereConditions.push(`c.status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }
    }

    if (urgency) {
      whereConditions.push(`c.urgency = $${paramIndex}`);
      params.push(urgency);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const consultations = await db.raw(`
      SELECT 
        c.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.date_of_birth as patient_dob,
        p.gender as patient_gender,
        EXTRACT(YEAR FROM AGE(p.date_of_birth)) as patient_age,
        CASE 
          WHEN c.status = 'pending' THEN 
            EXTRACT(EPOCH FROM (NOW() - c.submitted_at))/60
          ELSE NULL
        END as wait_time_minutes,
        pr.price as potential_value,
        p.subscription_tier
      FROM consultations c
      JOIN patients p ON c.patient_id = p.id
      LEFT JOIN prescriptions pr ON pr.consultation_id = c.id
      ${whereClause}
      ORDER BY 
        CASE WHEN c.urgency = 'emergency' THEN 0
             WHEN c.urgency = 'urgent' THEN 1
             ELSE 2 END,
        c.submitted_at ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset]);

    res.json({
      success: true,
      data: consultations.rows || []
    });
  })
);

// Get pending consultations queue (available to all providers)
router.get('/queue',
  requireAuth,
  requireRole('provider'),
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    
    const queue = await db.raw(`
      SELECT 
        c.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.date_of_birth as patient_dob,
        p.gender as patient_gender,
        EXTRACT(YEAR FROM AGE(p.date_of_birth)) as patient_age,
        EXTRACT(EPOCH FROM (NOW() - c.submitted_at))/60 as wait_time_minutes,
        p.subscription_tier,
        CASE p.subscription_tier
          WHEN 'premium' THEN 299
          WHEN 'essential' THEN 89
          ELSE 59
        END as estimated_value,
        CASE WHEN c.photos_urls IS NOT NULL AND array_length(c.photos_urls, 1) > 0 THEN true ELSE false END as has_photos,
        ROW_NUMBER() OVER (ORDER BY 
          CASE WHEN c.urgency = 'emergency' THEN 0
               WHEN c.urgency = 'urgent' THEN 1
               ELSE 2 END,
          c.submitted_at ASC
        ) as queue_position
      FROM consultations c
      JOIN patients p ON c.patient_id = p.id
      WHERE c.status = 'pending'
      ORDER BY queue_position
      LIMIT 20
    `);

    res.json({
      success: true,
      data: queue.rows || [],
      total_pending: queue.rows ? queue.rows.length : 0
    });
  })
);

// Get provider's patients
router.get('/patients',
  requireAuth,
  requireRole('provider'),
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const { limit = 50, offset = 0 } = req.query;

    const patients = await db.raw(`
      SELECT DISTINCT ON (p.id)
        p.id,
        p.first_name,
        p.last_name,
        p.email,
        p.phone,
        p.date_of_birth,
        p.gender,
        p.subscription_tier,
        COUNT(c.id) as total_consultations,
        MAX(c.created_at) as last_consultation_date
      FROM patients p
      JOIN consultations c ON c.patient_id = p.id
      WHERE c.provider_id = ?
      GROUP BY p.id
      ORDER BY p.id, last_consultation_date DESC
      LIMIT ? OFFSET ?
    `, [req.user.id, limit, offset]);

    res.json({
      success: true,
      data: patients.rows || []
    });
  })
);

// Accept/claim a consultation
router.post('/consultations/:id/accept',
  requireAuth,
  requireRole('provider'),
  [
    param('id').isUUID()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    
    // Check if consultation exists and is pending
    const [consultation] = await db
      .select()
      .from('consultations')
      .where({ id: req.params.id, status: 'pending' })
      .limit(1);

    if (!consultation) {
      return res.status(404).json({ error: 'Consultation not found or already assigned' });
    }

    // Assign to provider
    const [updated] = await db
      .update('consultations')
      .set({
        provider_id: req.user.id,
        status: 'assigned',
        assigned_at: new Date(),
        updated_at: new Date()
      })
      .where({ id: req.params.id })
      .returning();

    // Update provider's daily consultation count
    await db.raw(`
      UPDATE providers 
      SET current_daily_consultations = current_daily_consultations + 1
      WHERE id = ?
    `, [req.user.id]);

    res.json({
      success: true,
      data: updated,
      message: 'Consultation accepted successfully'
    });
  })
);

// Complete consultation with treatment plan
router.post('/consultations/:id/complete',
  requireAuth,
  requireRole('provider'),
  [
    param('id').isUUID(),
    body('diagnosis').isString().notEmpty(),
    body('treatment_plan').isString().notEmpty(),
    body('prescriptions').optional().isArray(),
    body('follow_up_required').optional().isBoolean(),
    body('follow_up_date').optional().isISO8601(),
    body('internal_notes').optional().isString()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    
    // Verify provider owns this consultation
    const [consultation] = await db
      .select()
      .from('consultations')
      .where({ 
        id: req.params.id, 
        provider_id: req.user.id,
        status: 'assigned'
      })
      .limit(1);

    if (!consultation) {
      return res.status(403).json({ error: 'Consultation not found or access denied' });
    }

    // Update consultation
    const [updated] = await db
      .update('consultations')
      .set({
        diagnosis: req.body.diagnosis,
        treatment_plan: req.body.treatment_plan,
        internal_notes: req.body.internal_notes,
        follow_up_required: req.body.follow_up_required,
        follow_up_date: req.body.follow_up_date,
        status: 'completed',
        completed_at: new Date(),
        plan_sent_at: new Date(),
        updated_at: new Date()
      })
      .where({ id: req.params.id })
      .returning();

    // Create prescriptions if provided
    if (req.body.prescriptions && req.body.prescriptions.length > 0) {
      const prescriptionData = req.body.prescriptions.map(rx => ({
        consultation_id: consultation.id,
        provider_id: req.user.id,
        patient_id: consultation.patient_id,
        medication_name: rx.medication_name,
        generic_name: rx.generic_name,
        dosage: rx.dosage,
        quantity: rx.quantity,
        frequency: rx.frequency,
        duration: rx.duration,
        instructions: rx.instructions,
        refills: rx.refills || 0,
        refills_remaining: rx.refills || 0,
        price: rx.price,
        subscription_price: rx.subscription_price,
        status: 'active',
        created_at: new Date()
      }));

      await db.insert('prescriptions').values(prescriptionData);

      // Mark medication offered
      await db
        .update('consultations')
        .set({ medication_offered: true })
        .where({ id: req.params.id });
    }

    // Update provider statistics
    await db.raw(`
      UPDATE providers 
      SET total_consultations = total_consultations + 1
      WHERE id = ?
    `, [req.user.id]);

    res.json({
      success: true,
      data: updated,
      message: 'Consultation completed successfully'
    });
  })
);

// Get messages for provider's consultations
router.get('/messages',
  requireAuth,
  requireRole('provider'),
  [
    query('unread_only').optional().isBoolean()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const { unread_only = false } = req.query;

    let whereClause = unread_only ? "AND cm.is_read = false AND cm.sender_type = 'patient'" : "";

    const messages = await db.raw(`
      SELECT 
        cm.*,
        c.id as consultation_id,
        c.chief_complaint,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name
      FROM consultation_messages cm
      JOIN consultations c ON cm.consultation_id = c.id
      JOIN patients p ON c.patient_id = p.id
      WHERE c.provider_id = ? ${whereClause}
      ORDER BY cm.created_at DESC
      LIMIT 50
    `, [req.user.id]);

    res.json({
      success: true,
      data: messages.rows || []
    });
  })
);

// Update provider profile
router.put('/me',
  requireAuth,
  requireRole('provider'),
  [
    body('first_name').optional().isString(),
    body('last_name').optional().isString(),
    body('phone').optional().isString(),
    body('bio').optional().isString(),
    body('years_experience').optional().isInt(),
    body('education').optional().isString(),
    body('is_available').optional().isBoolean()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    
    // Don't allow updating sensitive fields
    delete req.body.id;
    delete req.body.email;
    delete req.body.password_hash;
    delete req.body.license_number;
    delete req.body.npi_number;

    const [updated] = await db
      .update('providers')
      .set({
        ...req.body,
        updated_at: new Date()
      })
      .where({ id: req.user.id })
      .returning();

    delete updated.password_hash;

    res.json({
      success: true,
      data: updated,
      message: 'Profile updated successfully'
    });
  })
);

// Provider login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isString()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const { email, password } = req.body;

    // Find provider
    const [provider] = await db
      .select()
      .from('providers')
      .where({ email })
      .limit(1);

    if (!provider) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValid = await bcrypt.compare(password, provider.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if active
    if (!provider.is_active) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Update last login
    await db
      .update('providers')
      .set({ 
        last_login: new Date(),
        current_daily_consultations: 0 // Reset daily count
      })
      .where({ id: provider.id });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: provider.id, 
        email: provider.email,
        role: 'provider'
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '12h' }
    );

    delete provider.password_hash;

    res.json({
      success: true,
      data: {
        user: provider,
        token
      },
      message: 'Login successful'
    });
  })
);

// Get provider availability
router.get('/availability',
  requireAuth,
  requireRole('provider'),
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    
    const [provider] = await db
      .select([
        'is_available',
        'max_daily_consultations',
        'current_daily_consultations'
      ])
      .from('providers')
      .where({ id: req.user.id })
      .limit(1);

    const available_slots = provider.max_daily_consultations - provider.current_daily_consultations;
    const is_available = provider.is_available && available_slots > 0;

    res.json({
      success: true,
      data: {
        is_available,
        available_slots,
        max_daily_consultations: provider.max_daily_consultations,
        current_daily_consultations: provider.current_daily_consultations
      }
    });
  })
);

// Toggle provider availability
router.post('/availability/toggle',
  requireAuth,
  requireRole('provider'),
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    
    const [current] = await db
      .select(['is_available'])
      .from('providers')
      .where({ id: req.user.id })
      .limit(1);

    const [updated] = await db
      .update('providers')
      .set({ 
        is_available: !current.is_available,
        updated_at: new Date()
      })
      .where({ id: req.user.id })
      .returning(['is_available']);

    res.json({
      success: true,
      data: { is_available: updated.is_available },
      message: `Availability ${updated.is_available ? 'enabled' : 'disabled'}`
    });
  })
);

export default router;
