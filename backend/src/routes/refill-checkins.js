import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getDatabase } from '../config/database.js';
import { AppError } from '../errors/AppError.js';
import crypto from 'crypto';

const router = express.Router();

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

// Get all refill checkins for a patient
router.get('/',
  requireAuth,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    query('status').optional().isIn(['pending', 'completed', 'missed'])
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const { limit = 20, offset = 0, status } = req.query;
    
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    // For patients, only show their own checkins
    if (req.user.role === 'patient') {
      whereConditions.push(`patient_id = $${paramIndex}`);
      params.push(req.user.id);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const result = await db.unsafe(`
      SELECT 
        rc.*,
        p.first_name || ' ' || p.last_name as patient_name,
        pr.medication_name,
        pr.dosage,
        pr.frequency
      FROM refill_checkins rc
      LEFT JOIN patients p ON rc.patient_id = p.id
      LEFT JOIN prescriptions pr ON rc.prescription_id = pr.id
      ${whereClause}
      ORDER BY rc.due_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset]);

    res.json({
      success: true,
      data: result,
      total: result.length
    });
  })
);

// Get specific refill checkin by ID
router.get('/:id',
  requireAuth,
  [
    param('id').isUUID().withMessage('Invalid checkin ID')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    
    const result = await db`
      SELECT 
        rc.*,
        p.first_name || ' ' || p.last_name as patient_name,
        p.email as patient_email,
        pr.medication_name,
        pr.dosage,
        pr.frequency,
        pr.instructions
      FROM refill_checkins rc
      LEFT JOIN patients p ON rc.patient_id = p.id
      LEFT JOIN prescriptions pr ON rc.prescription_id = pr.id
      WHERE rc.id = ${req.params.id}
    `;

    if (result.length === 0) {
      throw new AppError('Refill checkin not found', 404, 'CHECKIN_NOT_FOUND');
    }

    const checkin = result[0];

    // Check access permissions
    if (req.user.role === 'patient' && checkin.patient_id !== req.user.id) {
      throw new AppError('Access denied', 403, 'ACCESS_DENIED');
    }

    res.json({
      success: true,
      data: checkin
    });
  })
);

// Create a new refill checkin
router.post('/',
  requireAuth,
  requireRole(['provider', 'admin']),
  [
    body('patientId').isUUID().withMessage('Valid patient ID required'),
    body('prescriptionId').isUUID().withMessage('Valid prescription ID required'),
    body('dueDate').isISO8601().withMessage('Valid due date required'),
    body('questions').optional().isArray(),
    body('instructions').optional().isString()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    
    const result = await db`
      INSERT INTO refill_checkins (
        id, patient_id, prescription_id, due_date, questions,
        instructions, status, created_at
      ) VALUES (
        ${crypto.randomUUID()}, ${req.body.patientId}, ${req.body.prescriptionId},
        ${new Date(req.body.dueDate)}, ${req.body.questions ? JSON.stringify(req.body.questions) : null},
        ${req.body.instructions}, 'pending', ${new Date()}
      ) RETURNING *
    `;

    res.status(201).json({
      success: true,
      data: result[0],
      message: 'Refill checkin created successfully'
    });
  })
);

// Complete a refill checkin (patient submits responses)
router.post('/:id/complete',
  requireAuth,
  [
    param('id').isUUID().withMessage('Invalid checkin ID'),
    body('responses').isArray().withMessage('Responses are required'),
    body('symptoms').optional().isString(),
    body('sideEffects').optional().isString(),
    body('adherence').optional().isIn(['excellent', 'good', 'fair', 'poor'])
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    
    // Verify checkin exists and belongs to user (if patient)
    const checkinResult = await db`
      SELECT * FROM refill_checkins WHERE id = ${req.params.id}
    `;

    if (checkinResult.length === 0) {
      throw new AppError('Refill checkin not found', 404, 'CHECKIN_NOT_FOUND');
    }

    const checkin = checkinResult[0];

    if (req.user.role === 'patient' && checkin.patient_id !== req.user.id) {
      throw new AppError('Access denied', 403, 'ACCESS_DENIED');
    }

    // Update checkin with responses
    const result = await db`
      UPDATE refill_checkins 
      SET 
        responses = ${JSON.stringify(req.body.responses)},
        symptoms = ${req.body.symptoms || null},
        side_effects = ${req.body.sideEffects || null},
        adherence = ${req.body.adherence || null},
        status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
      WHERE id = ${req.params.id}
      RETURNING *
    `;

    res.json({
      success: true,
      data: result[0],
      message: 'Refill checkin completed successfully'
    });
  })
);

// Review a completed refill checkin (provider)
router.post('/:id/review',
  requireAuth,
  requireRole(['provider', 'admin']),
  [
    param('id').isUUID().withMessage('Invalid checkin ID'),
    body('reviewNotes').isString().withMessage('Review notes are required'),
    body('approved').isBoolean().withMessage('Approval status required'),
    body('newPrescription').optional().isObject()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    
    const result = await db`
      UPDATE refill_checkins 
      SET 
        review_notes = ${req.body.reviewNotes},
        approved = ${req.body.approved},
        reviewed_by = ${req.user.id},
        reviewed_at = NOW(),
        status = ${req.body.approved ? 'approved' : 'rejected'},
        updated_at = NOW()
      WHERE id = ${req.params.id}
      RETURNING *
    `;

    if (result.length === 0) {
      throw new AppError('Refill checkin not found', 404, 'CHECKIN_NOT_FOUND');
    }

    // If approved and new prescription provided, create prescription
    if (req.body.approved && req.body.newPrescription) {
      await db`
        INSERT INTO prescriptions (
          id, patient_id, provider_id, consultation_id, medication_name,
          dosage, frequency, duration, instructions, refills,
          refills_remaining, status, created_at
        ) VALUES (
          ${crypto.randomUUID()}, ${result[0].patient_id}, ${req.user.id}, ${null},
          ${req.body.newPrescription.medicationName}, ${req.body.newPrescription.dosage},
          ${req.body.newPrescription.frequency}, ${req.body.newPrescription.duration},
          ${req.body.newPrescription.instructions}, ${req.body.newPrescription.refills || 0},
          ${req.body.newPrescription.refills || 0}, 'active', ${new Date()}
        )
      `;
    }

    res.json({
      success: true,
      data: result[0],
      message: `Refill checkin ${req.body.approved ? 'approved' : 'rejected'} successfully`
    });
  })
);

// Get pending checkins for provider review
router.get('/pending/review',
  requireAuth,
  requireRole(['provider', 'admin']),
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const { limit = 20, offset = 0 } = req.query;

    const result = await db`
      SELECT 
        rc.*,
        p.first_name || ' ' || p.last_name as patient_name,
        p.email as patient_email,
        pr.medication_name,
        pr.dosage,
        pr.frequency
      FROM refill_checkins rc
      LEFT JOIN patients p ON rc.patient_id = p.id
      LEFT JOIN prescriptions pr ON rc.prescription_id = pr.id
      WHERE rc.status = 'completed'
      ORDER BY rc.completed_at ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Parse JSON fields
    const checkins = result.map(checkin => {
      if (checkin.responses) {
        try {
          checkin.responses = JSON.parse(checkin.responses);
        } catch (e) {
          checkin.responses = [];
        }
      }
      if (checkin.questions) {
        try {
          checkin.questions = JSON.parse(checkin.questions);
        } catch (e) {
          checkin.questions = [];
        }
      }
      return checkin;
    });

    res.json({
      success: true,
      data: checkins,
      total: checkins.length
    });
  })
);

export default router;