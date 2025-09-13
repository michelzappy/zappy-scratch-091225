import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getDatabase } from '../config/database.js';
import { consultations, messages } from '../models/index.js';
import { eq } from 'drizzle-orm';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';

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

// Create new consultation
router.post('/',
  [
    body('consultationType').isString().isLength({ min: 1 }).withMessage('Consultation type is required'),
    body('chiefComplaint').isString().isLength({ min: 10 }).withMessage('Chief complaint must be at least 10 characters'),
    body('symptoms').isArray({ min: 1 }).withMessage('At least one symptom is required')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const consultationData = {
      patientId: req.body.patientId || req.user?.id,
      consultationType: req.body.consultationType,
      chiefComplaint: req.body.chiefComplaint,
      symptoms: req.body.symptoms,
      status: 'pending'
    };

    const [consultation] = await db
      .insert(consultations)
      .values(consultationData)
      .returning();

    res.status(201).json({
      success: true,
      data: consultation,
      message: 'Consultation created successfully'
    });
  })
);

// Get consultation by ID
router.get('/:id',
  [
    param('id').isUUID().withMessage('Invalid consultation ID')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const [consultation] = await db
      .select()
      .from(consultations)
      .where(eq(consultations.id, req.params.id))
      .limit(1);

    if (!consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    res.json({
      success: true,
      data: consultation
    });
  })
);

// List consultations
router.get('/',
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const consultationsList = await db
      .select()
      .from(consultations)
      .limit(20);

    res.json({
      success: true,
      data: consultationsList
    });
  })
);

// Accept consultation (Provider)
router.post('/:id/accept',
  [
    param('id').isUUID().withMessage('Invalid consultation ID')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const [updated] = await db
      .update(consultations)
      .set({
        status: 'assigned',
        providerId: req.body.providerId,
        assignedAt: new Date()
      })
      .where(eq(consultations.id, req.params.id))
      .returning();

    res.json({
      success: true,
      data: updated,
      message: 'Consultation accepted successfully'
    });
  })
);

// Complete consultation
router.post('/:id/complete',
  [
    param('id').isUUID().withMessage('Invalid consultation ID'),
    body('providerNotes').isString().withMessage('Provider notes required')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const [updated] = await db
      .update(consultations)
      .set({
        status: 'completed',
        providerNotes: req.body.providerNotes,
        completedAt: new Date()
      })
      .where(eq(consultations.id, req.params.id))
      .returning();

    res.json({
      success: true,
      data: updated,
      message: 'Consultation completed successfully'
    });
  })
);

export default router;
