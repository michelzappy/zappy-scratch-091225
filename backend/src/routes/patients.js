import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getDatabase } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { hipaaAuditLogger } from '../middleware/hipaaAudit.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Apply HIPAA audit logging to all patient routes
router.use(hipaaAuditLogger);

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

// Get current patient profile
router.get('/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const [patient] = await db
      .select()
      .from('patients')
      .where({ id: req.user.id })
      .limit(1);

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Remove sensitive data
    delete patient.password_hash;
    
    res.json({
      success: true,
      data: patient
    });
  })
);

// Get patient by ID
router.get('/:id',
  requireAuth,
  [
    param('id').isUUID().withMessage('Invalid patient ID')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    
    // Only allow patients to view their own data or providers/admins to view any
    if (req.user.role === 'patient' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [patient] = await db
      .select()
      .from('patients')
      .where({ id: req.params.id })
      .limit(1);

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    delete patient.password_hash;
    
    res.json({
      success: true,
      data: patient
    });
  })
);

// Get patient's active programs (prescriptions)
router.get('/me/programs',
  requireAuth,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    
    const programs = await db.raw(`
      SELECT 
        p.*,
        c.consultation_type as program_name,
        c.chief_complaint,
        i.category
      FROM prescriptions p
      JOIN consultations c ON p.consultation_id = c.id
      LEFT JOIN inventory i ON i.medication_name = p.medication_name
      WHERE p.patient_id = ?
        AND p.status = 'active'
      ORDER BY p.created_at DESC
    `, [req.user.id]);

    res.json({
      success: true,
      data: programs.rows || []
    });
  })
);

// Get patient's orders
router.get('/me/orders',
  requireAuth,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const limit = req.query.limit || 10;
    const offset = req.query.offset || 0;

    const orders = await db.raw(`
      SELECT 
        o.*,
        array_agg(
          json_build_object(
            'medication_name', oi.medication_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.patient_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [req.user.id, limit, offset]);

    res.json({
      success: true,
      data: orders.rows || []
    });
  })
);

// Get patient's health measurements
router.get('/me/measurements',
  requireAuth,
  [
    query('type').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const { type, limit = 30, start_date, end_date } = req.query;

    let query = db
      .select()
      .from('patient_measurements')
      .where({ patient_id: req.user.id })
      .orderBy('measurement_date', 'desc');

    if (start_date) {
      query = query.where('measurement_date', '>=', start_date);
    }
    if (end_date) {
      query = query.where('measurement_date', '<=', end_date);
    }
    if (limit) {
      query = query.limit(limit);
    }

    const measurements = await query;

    res.json({
      success: true,
      data: measurements
    });
  })
);

// Log health measurement
router.post('/me/measurements',
  requireAuth,
  [
    body('weight').optional().isFloat({ min: 0 }),
    body('height').optional().isFloat({ min: 0 }),
    body('blood_pressure_systolic').optional().isInt({ min: 0 }),
    body('blood_pressure_diastolic').optional().isInt({ min: 0 }),
    body('heart_rate').optional().isInt({ min: 0 }),
    body('temperature').optional().isFloat({ min: 0 }),
    body('glucose_level').optional().isFloat({ min: 0 }),
    body('measurement_date').optional().isISO8601(),
    body('notes').optional().isString()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    
    // Calculate BMI if weight and height provided
    let bmi = null;
    if (req.body.weight && req.body.height) {
      // Assuming height in cm and weight in kg
      const heightInMeters = req.body.height / 100;
      bmi = req.body.weight / (heightInMeters * heightInMeters);
    }

    const measurementData = {
      patient_id: req.user.id,
      ...req.body,
      bmi,
      measurement_date: req.body.measurement_date || new Date(),
      created_at: new Date()
    };

    const [measurement] = await db
      .insert('patient_measurements')
      .values(measurementData)
      .returning();

    res.status(201).json({
      success: true,
      data: measurement,
      message: 'Measurement logged successfully'
    });
  })
);

// Get patient's consultations
router.get('/me/consultations',
  requireAuth,
  [
    query('status').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const { status, limit = 20 } = req.query;

    let query = db
      .select([
        'consultations.*',
        'providers.first_name as provider_first_name',
        'providers.last_name as provider_last_name',
        'providers.title as provider_title'
      ])
      .from('consultations')
      .leftJoin('providers', 'consultations.provider_id', 'providers.id')
      .where({ 'consultations.patient_id': req.user.id })
      .orderBy('consultations.created_at', 'desc')
      .limit(limit);

    if (status) {
      query = query.where({ 'consultations.status': status });
    }

    const consultations = await query;

    res.json({
      success: true,
      data: consultations
    });
  })
);

// Update patient profile
router.put('/me',
  requireAuth,
  [
    body('first_name').optional().isString(),
    body('last_name').optional().isString(),
    body('phone').optional().isString(),
    body('date_of_birth').optional().isISO8601(),
    body('gender').optional().isString(),
    body('shipping_address').optional().isString(),
    body('shipping_city').optional().isString(),
    body('shipping_state').optional().isString(),
    body('shipping_zip').optional().isString(),
    body('allergies').optional().isString(),
    body('current_medications').optional().isString(),
    body('medical_conditions').optional().isString(),
    body('emergency_contact_name').optional().isString(),
    body('emergency_contact_phone').optional().isString()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    
    // Don't allow updating sensitive fields
    delete req.body.id;
    delete req.body.email;
    delete req.body.password_hash;
    delete req.body.stripe_customer_id;
    delete req.body.total_spent;
    delete req.body.total_orders;

    const [updated] = await db
      .update('patients')
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

// Get patient statistics/metrics
router.get('/me/stats',
  requireAuth,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    
    const stats = await db.raw(`
      SELECT
        (SELECT COUNT(*) FROM consultations WHERE patient_id = ? AND status = 'completed') as total_consultations,
        (SELECT COUNT(*) FROM orders WHERE patient_id = ?) as total_orders,
        (SELECT COUNT(*) FROM prescriptions WHERE patient_id = ? AND status = 'active') as active_prescriptions,
        (SELECT COUNT(*) FROM consultation_messages cm
         JOIN consultations c ON cm.consultation_id = c.id
         WHERE c.patient_id = ? AND cm.is_read = false AND cm.sender_type != 'patient') as unread_messages,
        (SELECT MAX(created_at) FROM consultations WHERE patient_id = ?) as last_consultation_date,
        (SELECT subscription_tier FROM patients WHERE id = ?) as subscription_tier,
        (SELECT subscription_active FROM patients WHERE id = ?) as subscription_active
    `, [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]);

    res.json({
      success: true,
      data: stats.rows[0] || {}
    });
  })
);

// Get patient's consultations by ID (for providers/admins)
router.get('/:id/consultations',
  requireAuth,
  [
    param('id').isUUID().withMessage('Invalid patient ID'),
    query('status').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const { status, limit = 20 } = req.query;
    
    // Only allow patients to view their own data or providers/admins to view any
    if (req.user.role === 'patient' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify patient exists
    const [patient] = await db
      .select('id')
      .from('patients')
      .where({ id: req.params.id })
      .limit(1);

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    let query = db
      .select([
        'consultations.*',
        'providers.first_name as provider_first_name',
        'providers.last_name as provider_last_name',
        'providers.title as provider_title'
      ])
      .from('consultations')
      .leftJoin('providers', 'consultations.provider_id', 'providers.id')
      .where({ 'consultations.patient_id': req.params.id })
      .orderBy('consultations.created_at', 'desc')
      .limit(limit);

    if (status) {
      query = query.where({ 'consultations.status': status });
    }

    const consultations = await query;

    res.json({
      success: true,
      data: consultations
    });
  })
);

// Update patient profile by ID (for providers/admins)
router.put('/:id',
  requireAuth,
  [
    param('id').isUUID().withMessage('Invalid patient ID'),
    body('first_name').optional().isString(),
    body('last_name').optional().isString(),
    body('phone').optional().isString(),
    body('date_of_birth').optional().isISO8601(),
    body('gender').optional().isString(),
    body('shipping_address').optional().isString(),
    body('shipping_city').optional().isString(),
    body('shipping_state').optional().isString(),
    body('shipping_zip').optional().isString(),
    body('allergies').optional().isString(),
    body('current_medications').optional().isString(),
    body('medical_conditions').optional().isString(),
    body('emergency_contact_name').optional().isString(),
    body('emergency_contact_phone').optional().isString(),
    body('insurance_provider').optional().isString(),
    body('insurance_policy_number').optional().isString()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    
    // Only allow patients to update their own data or providers/admins to update any
    if (req.user.role === 'patient' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify patient exists
    const [existingPatient] = await db
      .select()
      .from('patients')
      .where({ id: req.params.id })
      .limit(1);

    if (!existingPatient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Don't allow updating sensitive fields
    delete req.body.id;
    delete req.body.email;
    delete req.body.password_hash;
    delete req.body.stripe_customer_id;
    delete req.body.total_spent;
    delete req.body.total_orders;
    delete req.body.subscription_tier;
    delete req.body.subscription_active;
    delete req.body.created_at;

    const [updated] = await db
      .update('patients')
      .set({
        ...req.body,
        updated_at: new Date()
      })
      .where({ id: req.params.id })
      .returning();

    delete updated.password_hash;

    res.json({
      success: true,
      data: updated,
      message: 'Patient profile updated successfully'
    });
  })
);

// Register new patient
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('first_name').isString().isLength({ min: 1 }),
    body('last_name').isString().isLength({ min: 1 }),
    body('date_of_birth').isISO8601(),
    body('phone').optional().isString(),
    body('gender').optional().isString()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const { email, password, ...profileData } = req.body;

    // Check if email already exists
    const existing = await db
      .select()
      .from('patients')
      .where({ email })
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create patient
    const [patient] = await db
      .insert('patients')
      .values({
        email,
        password_hash,
        ...profileData,
        created_at: new Date()
      })
      .returning();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: patient.id, 
        email: patient.email,
        role: 'patient'
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    delete patient.password_hash;

    res.status(201).json({
      success: true,
      data: {
        user: patient,
        token
      },
      message: 'Registration successful'
    });
  })
);

// Login patient
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isString()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const { email, password } = req.body;

    // Find patient
    const [patient] = await db
      .select()
      .from('patients')
      .where({ email })
      .limit(1);

    if (!patient) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValid = await bcrypt.compare(password, patient.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await db
      .update('patients')
      .set({ last_login: new Date() })
      .where({ id: patient.id });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: patient.id, 
        email: patient.email,
        role: 'patient'
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    delete patient.password_hash;

    res.json({
      success: true,
      data: {
        user: patient,
        token
      },
      message: 'Login successful'
    });
  })
);

export default router;
