import express from 'express';
import { body, validationResult } from 'express-validator';
import aiService from '../services/ai-consultation.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * Generate AI content for consultation
 */
router.post('/generate',
  requireAuth,
  [
    body('type').isIn(['assessment', 'plan', 'message']).withMessage('Invalid generation type'),
    body('consultation').isObject().withMessage('Consultation data required'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, consultation, hpi, diagnosis } = req.body;
    let result;

    try {
      switch (type) {
        case 'assessment':
          result = await aiService.generateAssessment(consultation, hpi);
          res.json({
            success: true,
            diagnosis: result.diagnosis,
            assessment: result.assessment,
            differentialDiagnosis: result.differentialDiagnosis
          });
          break;

        case 'message':
          const patientName = consultation.first_name || 'Patient';
          const plan = {
            medications: req.body.medications || [],
            followUp: req.body.followUp || '6-8 weeks'
          };
          const message = await aiService.generatePatientMessage(diagnosis, plan, patientName);
          res.json({
            success: true,
            message
          });
          break;

        case 'plan':
          const recommendations = await aiService.generateMedicationRecommendations(diagnosis, consultation);
          res.json({
            success: true,
            plan: recommendations
          });
          break;

        default:
          res.status(400).json({ error: 'Invalid generation type' });
      }
    } catch (error) {
      console.error('AI generation error:', error);
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        error: 'AI generation failed',
        message: error.message || 'AI service temporarily unavailable'
      });
    }
  })
);

/**
 * Generate complete SOAP note
 */
router.post('/soap-note',
  requireAuth,
  [
    body('consultationData').isObject().withMessage('Consultation data required'),
    body('hpi').isObject().withMessage('HPI data required'),
    body('assessment').isString().withMessage('Assessment required'),
    body('plan').isObject().withMessage('Plan required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { consultationData, hpi, assessment, plan } = req.body;
    
    try {
      const soapNote = await aiService.generateSOAPNote(consultationData, hpi, assessment, plan);
      res.json({
        success: true,
        soapNote
      });
    } catch (error) {
      console.error('SOAP note generation error:', error);
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        error: 'SOAP note generation failed',
        message: error.message || 'AI service temporarily unavailable'
      });
    }
  })
);

/**
 * Get medication recommendations
 */
router.post('/medication-recommendations',
  requireAuth,
  [
    body('diagnosis').notEmpty().withMessage('Diagnosis required'),
    body('patientData').isObject().withMessage('Patient data required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { diagnosis, patientData } = req.body;
    
    try {
      const recommendations = await aiService.generateMedicationRecommendations(diagnosis, patientData);
      res.json({
        success: true,
        recommendations
      });
    } catch (error) {
      console.error('Medication recommendation error:', error);
      const statusCode = error.status || 500;
      res.status(statusCode).json({
        error: 'Recommendation generation failed',
        message: error.message || 'AI service temporarily unavailable'
      });
    }
  })
);

/**
 * Check if AI service is configured
 */
router.get('/status', requireAuth, (req, res) => {
  const isConfigured = !!process.env.OPENAI_API_KEY;
  res.json({
    success: true,
    aiEnabled: isConfigured,
    model: process.env.AI_MODEL || 'gpt-4',
    message: isConfigured
      ? 'AI service is configured and ready'
      : 'AI service not configured - API key required'
  });
});

export default router;
