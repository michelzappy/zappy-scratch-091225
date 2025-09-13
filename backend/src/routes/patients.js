import express from 'express';
import { param, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getDatabase } from '../config/database.js';
import { patients, consultations } from '../models/index.js';
import { eq } from 'drizzle-orm';

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

// Get patient profile
router.get('/:id',
  [
    param('id').isUUID().withMessage('Invalid patient ID')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.id, req.params.id))
      .limit(1);

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({
      success: true,
      data: patient
    });
  })
);

// Get patient's consultations
router.get('/:id/consultations',
  [
    param('id').isUUID().withMessage('Invalid patient ID')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const consultationsList = await db
      .select()
      .from(consultations)
      .where(eq(consultations.patientId, req.params.id))
      .limit(20);

    res.json({
      success: true,
      data: consultationsList
    });
  })
);

// Update patient profile
router.put('/:id',
  [
    param('id').isUUID().withMessage('Invalid patient ID')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const [updated] = await db
      .update(patients)
      .set({
        ...req.body,
        updatedAt: new Date()
      })
      .where(eq(patients.id, req.params.id))
      .returning();

    res.json({
      success: true,
      data: updated,
      message: 'Patient profile updated successfully'
    });
  })
);

export default router;
