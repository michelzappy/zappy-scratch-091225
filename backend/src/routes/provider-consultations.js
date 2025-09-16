import express from 'express';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get consultation queue
router.get('/queue', requireAuth, requireRole(['provider', 'admin']), asyncHandler(async (req, res) => {
  const { status = 'pending', limit = 20 } = req.query;
  const db = getDatabase();
  
  const result = await db.query(`
    SELECT 
      c.id,
      c.chief_complaint,
      c.symptoms,
      c.symptom_duration,
      c.severity,
      c.submitted_at,
      c.status,
      p.first_name,
      p.last_name,
      p.date_of_birth,
      p.allergies,
      p.current_medications
    FROM consultations c
    JOIN patients p ON c.patient_id = p.id
    WHERE c.status = $1
    ORDER BY 
      CASE WHEN c.severity >= 8 THEN 0 ELSE 1 END,
      c.submitted_at ASC
    LIMIT $2
  `, [status, limit]);
  
  res.json({
    success: true,
    data: result.rows
  });
}));

// Get single consultation details
router.get('/:id', requireAuth, requireRole(['provider', 'admin']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  const consultationResult = await db.query(`
    SELECT 
      c.*,
      p.first_name,
      p.last_name,
      p.email,
      p.phone,
      p.date_of_birth,
      p.allergies,
      p.current_medications,
      p.medical_conditions,
      p.shipping_address,
      p.shipping_city,
      p.shipping_state,
      p.shipping_zip
    FROM consultations c
    JOIN patients p ON c.patient_id = p.id
    WHERE c.id = $1
  `, [id]);
  
  if (consultationResult.rows.length === 0) {
    return res.status(404).json({ error: 'Consultation not found' });
  }
  
  // Get previous consultations
  const consultation = consultationResult.rows[0];
  const historyResult = await db.query(`
    SELECT id, chief_complaint, diagnosis, treatment_plan, created_at
    FROM consultations
    WHERE patient_id = $1 AND id != $2
    ORDER BY created_at DESC
    LIMIT 5
  `, [consultation.patient_id, id]);
  
  res.json({
    success: true,
    data: {
      consultation,
      history: historyResult.rows
    }
  });
}));

// Accept consultation for review
router.post('/:id/accept', requireAuth, requireRole(['provider']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const providerId = req.user.id;
  const db = getDatabase();
  
  const result = await db.query(`
    UPDATE consultations
    SET 
      provider_id = $1,
      status = 'in_review',
      reviewed_at = NOW()
    WHERE id = $2 AND status = 'pending'
    RETURNING id
  `, [providerId, id]);
  
  if (result.rows.length === 0) {
    return res.status(400).json({ error: 'Consultation not available' });
  }
  
  res.json({
    success: true,
    message: 'Consultation accepted for review'
  });
}));

// Submit treatment plan
router.post('/:id/treatment-plan',
  requireAuth,
  requireRole(['provider']),
  [
    body('diagnosis').notEmpty().withMessage('Diagnosis is required'),
    body('treatmentPlan').notEmpty().withMessage('Treatment plan is required')
  ],
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const providerId = req.user.id;
    const { 
      diagnosis, 
      treatmentPlan, 
      internalNotes,
      prescriptions = []
    } = req.body;
    
    const db = getDatabase();
    
    // Start transaction
    await db.query('BEGIN');
    
    try {
      // Update consultation
      const consultationResult = await db.query(`
        UPDATE consultations
        SET 
          diagnosis = $1,
          treatment_plan = $2,
          internal_notes = $3,
          status = 'plan_sent',
          plan_sent_at = NOW(),
          medication_offered = $4
        WHERE id = $5 AND provider_id = $6
        RETURNING patient_id
      `, [
        diagnosis, 
        treatmentPlan, 
        internalNotes,
        prescriptions.length > 0,
        id, 
        providerId
      ]);
      
      if (consultationResult.rows.length === 0) {
        throw new Error('Consultation not found or not assigned to provider');
      }
      
      const patientId = consultationResult.rows[0].patient_id;
      
      // Add prescriptions if any
      for (const rx of prescriptions) {
        // Look up medication pricing from medications table
        const medicationResult = await db.query(`
          SELECT id, base_price
          FROM medications
          WHERE name = $1 OR generic_name = $1
          LIMIT 1
        `, [rx.medicationName]);
        
        const basePrice = medicationResult.rows.length > 0 
          ? medicationResult.rows[0].base_price 
          : rx.price || 0;
        
        await db.query(`
          INSERT INTO prescriptions (
            consultation_id, provider_id, patient_id,
            medication_name, generic_name, dosage,
            quantity, frequency, duration, instructions,
            price, subscription_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          id, providerId, patientId,
          rx.medicationName, rx.genericName, rx.dosage,
          rx.quantity, rx.frequency, rx.duration, rx.instructions,
          basePrice, basePrice * 0.85 // 15% discount for subscription
        ]);
      }
      
      // Create message for patient
      await db.query(`
        INSERT INTO consultation_messages (
          consultation_id, sender_id, sender_type,
          message_type, content
        ) VALUES ($1, $2, 'provider', 'treatment_plan', $3)
      `, [id, providerId, treatmentPlan]);
      
      // Get patient email for notification
      const patientResult = await db.query(
        'SELECT email, first_name FROM patients WHERE id = $1',
        [patientId]
      );
      
      await db.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Treatment plan sent to patient',
        data: {
          patientEmail: patientResult.rows[0].email,
          patientName: patientResult.rows[0].first_name
        }
      });
      
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  })
);

// Get provider stats
router.get('/stats/overview', requireAuth, requireRole(['provider', 'admin']), asyncHandler(async (req, res) => {
  const providerId = req.user.id;
  const db = getDatabase();
  
  const stats = await db.query(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
      COUNT(*) FILTER (WHERE status = 'in_review' AND provider_id = $1) as in_review_count,
      COUNT(*) FILTER (WHERE status = 'plan_sent' AND provider_id = $1 AND DATE(plan_sent_at) = CURRENT_DATE) as completed_today,
      COUNT(*) FILTER (WHERE medication_ordered = true AND provider_id = $1) as conversions
    FROM consultations
  `, [providerId]);
  
  res.json({
    success: true,
    data: stats.rows[0]
  });
}));

export default router;
