import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getDatabase } from '../config/database.js';
import { consultations, messages } from '../models/index.js';
import { eq } from 'drizzle-orm';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/consultations/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Only images and documents are allowed.'));
  }
});

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

// Pharmacy API integration with feature flag
const sendToPharmacyAPI = async (prescriptionData) => {
  const ENABLE_PHARMACY_INTEGRATION = process.env.ENABLE_PHARMACY === 'true';
  
  if (!ENABLE_PHARMACY_INTEGRATION) {
    console.log('Pharmacy integration disabled - skipping API call');
    return {
      success: true,
      pharmacyOrderId: null,
      estimatedDelivery: null,
      trackingNumber: null,
      message: 'Pharmacy integration disabled'
    };
  }

  if (!process.env.PHARMACY_API_URL || !process.env.PHARMACY_API_KEY) {
    throw new Error('Pharmacy API configuration missing: PHARMACY_API_URL and PHARMACY_API_KEY required');
  }

  console.log('Sending prescription to pharmacy:', prescriptionData);
  
  try {
    const pharmacyResponse = await fetch(process.env.PHARMACY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PHARMACY_API_KEY}`
      },
      body: JSON.stringify({
        patientId: prescriptionData.patientId,
        providerId: prescriptionData.providerId,
        medications: prescriptionData.medications,
        consultationId: prescriptionData.consultationId,
        prescriptionDate: new Date().toISOString(),
        signature: prescriptionData.providerSignature
      })
    });

    if (!pharmacyResponse.ok) {
      throw new Error(`Pharmacy API error: ${pharmacyResponse.status} ${pharmacyResponse.statusText}`);
    }

    const result = await pharmacyResponse.json();
    return {
      success: true,
      pharmacyOrderId: result.orderId,
      estimatedDelivery: result.estimatedDelivery,
      trackingNumber: result.trackingNumber
    };
  } catch (error) {
    console.error('Pharmacy API error:', error);
    throw error;
  }
};

// Create new consultation with file upload support
router.post('/',
  upload.array('attachments', 5), // Allow up to 5 file attachments
  [
    body('consultationType').isString().isLength({ min: 1 }).withMessage('Consultation type is required'),
    body('chiefComplaint').isString().isLength({ min: 10 }).withMessage('Chief complaint must be at least 10 characters'),
    body('symptoms').isArray({ min: 1 }).withMessage('At least one symptom is required'),
    body('additionalInfo').optional().isString(),
    body('preferredTime').optional().isString(),
    body('intakeData').optional().isObject(), // Full intake form responses
    body('selectedPlan').optional().isObject(), // Selected treatment plan
    body('condition').optional().isString() // Condition type (weightLoss, hairLoss, etc.)
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    
    // Handle file uploads
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path
    })) : [];

    // If selectedPlan is provided, look up the plan details
    let selectedPlanId = null;
    let selectedPlanName = null;
    let selectedPlanPrice = null;
    
    if (req.body.selectedPlan) {
      const planTier = req.body.selectedPlan.tier;
      const condition = req.body.condition;
      
      if (planTier && condition) {
        try {
          const planResult = await db.query(
            `SELECT id, name, price FROM treatment_plans 
             WHERE condition = $1 AND plan_tier = $2 
             LIMIT 1`,
            [condition, planTier]
          );
          
          if (planResult.rows.length > 0) {
            const plan = planResult.rows[0];
            selectedPlanId = plan.id;
            selectedPlanName = plan.name;
            selectedPlanPrice = plan.price;
          }
        } catch (error) {
          console.error('Error fetching treatment plan:', error);
        }
      }
    }

    const consultationData = {
      patientId: req.body.patientId || req.user?.id,
      consultationType: req.body.consultationType,
      chiefComplaint: req.body.chiefComplaint,
      symptoms: req.body.symptoms,
      additionalInfo: req.body.additionalInfo,
      preferredTime: req.body.preferredTime,
      attachments: JSON.stringify(attachments),
      intakeData: req.body.intakeData ? JSON.stringify(req.body.intakeData) : null,
      selectedPlanId: selectedPlanId,
      selectedPlanName: selectedPlanName,
      selectedPlanPrice: selectedPlanPrice,
      status: 'pending',
      createdAt: new Date()
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

    // Parse attachments if they exist
    if (consultation.attachments) {
      consultation.attachments = JSON.parse(consultation.attachments);
    }

    res.json({
      success: true,
      data: consultation
    });
  })
);

// Get consultations for a specific patient
router.get('/patient/:patientId',
  requireAuth,
  [
    param('patientId').isUUID().withMessage('Valid patient ID required'),
    query('status').optional().isIn(['pending', 'assigned', 'completed', 'cancelled']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const { patientId } = req.params;
    const { status, limit = 20, offset = 0 } = req.query;

    // Check access permissions
    if (req.user.role === 'patient' && req.user.id !== patientId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let whereConditions = ['c.patient_id = $1'];
    let params = [patientId];
    let paramIndex = 2;

    if (status) {
      whereConditions.push(`c.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const result = await db.query(`
      SELECT 
        c.*, 
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        pr.first_name as provider_first_name,
        pr.last_name as provider_last_name
      FROM consultations c
      LEFT JOIN patients p ON c.patient_id = p.id
      LEFT JOIN providers pr ON c.provider_id = pr.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset]);

    // Parse JSON fields
    const consultationsList = result.rows.map(consultation => {
      if (consultation.attachments) {
        consultation.attachments = JSON.parse(consultation.attachments);
      }
      if (consultation.prescription_data) {
        consultation.prescription_data = JSON.parse(consultation.prescription_data);
      }
      return consultation;
    });

    res.json({
      success: true,
      data: consultationsList,
      total: consultationsList.length
    });
  })
);

// Get provider consultation queue
router.get('/provider/queue',
  requireAuth,
  requireRole('provider'),
  [
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const { limit = 20, offset = 0 } = req.query;

    const result = await db.query(`
      SELECT 
        c.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.date_of_birth as patient_dob,
        p.gender as patient_gender,
        EXTRACT(YEAR FROM AGE(p.date_of_birth)) as patient_age,
        EXTRACT(EPOCH FROM (NOW() - c.created_at))/60 as wait_time_minutes,
        p.subscription_status,
        CASE WHEN c.attachments IS NOT NULL AND c.attachments != '[]' THEN true ELSE false END as has_attachments
      FROM consultations c
      JOIN patients p ON c.patient_id = p.id
      WHERE c.status = 'pending'
      ORDER BY c.created_at ASC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    // Parse JSON fields
    const queueList = result.rows.map(consultation => {
      if (consultation.attachments) {
        try {
          consultation.attachments = JSON.parse(consultation.attachments);
        } catch (e) {
          consultation.attachments = [];
        }
      }
      return consultation;
    });

    res.json({
      success: true,
      data: queueList,
      total: queueList.length
    });
  })
);

// List consultations with filters
router.get('/',
  [
    query('status').optional().isIn(['pending', 'assigned', 'completed', 'cancelled']),
    query('patientId').optional().isUUID(),
    query('providerId').optional().isUUID(),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    let query = db.select().from(consultations);
    
    // Apply filters
    if (req.query.status) {
      query = query.where(eq(consultations.status, req.query.status));
    }
    if (req.query.patientId) {
      query = query.where(eq(consultations.patientId, req.query.patientId));
    }
    if (req.query.providerId) {
      query = query.where(eq(consultations.providerId, req.query.providerId));
    }

    const consultationsList = await query.limit(20);

    // Parse attachments for each consultation
    consultationsList.forEach(consultation => {
      if (consultation.attachments) {
        consultation.attachments = JSON.parse(consultation.attachments);
      }
    });

    res.json({
      success: true,
      data: consultationsList,
      total: consultationsList.length
    });
  })
);

// Accept consultation (Provider)
router.post('/:id/accept',
  requireAuth,
  requireRole('provider'),
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
        providerId: req.user.id,
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

// Approve prescription and send to pharmacy
router.post('/:id/approve-prescription',
  requireAuth,
  requireRole('provider'),
  [
    param('id').isUUID().withMessage('Invalid consultation ID'),
    body('medications').isArray({ min: 1 }).withMessage('At least one medication is required'),
    body('medications.*.name').isString().withMessage('Medication name is required'),
    body('medications.*.dosage').isString().withMessage('Dosage is required'),
    body('medications.*.frequency').isString().withMessage('Frequency is required'),
    body('medications.*.duration').isString().withMessage('Duration is required'),
    body('providerNotes').optional().isString()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    
    // Get consultation details
    const [consultation] = await db
      .select()
      .from(consultations)
      .where(eq(consultations.id, req.params.id))
      .limit(1);

    if (!consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    if (consultation.status !== 'assigned' || consultation.providerId !== req.user.id) {
      return res.status(403).json({ error: 'Cannot approve prescription for this consultation' });
    }

    // Send prescription to pharmacy API
    let pharmacyResult;
    try {
      pharmacyResult = await sendToPharmacyAPI({
        patientId: consultation.patientId,
        providerId: req.user.id,
        medications: req.body.medications,
        consultationId: consultation.id,
        providerSignature: req.user.signature || req.user.name
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to send prescription to pharmacy',
        details: error.message
      });
    }

    if (!pharmacyResult.success) {
      return res.status(500).json({
        error: 'Failed to send prescription to pharmacy',
        details: pharmacyResult.error
      });
    }

    // Update consultation with prescription details
    const prescriptionData = {
      medications: req.body.medications,
      approvedAt: new Date()
    };

    // Only include pharmacy data if integration is enabled
    if (pharmacyResult.pharmacyOrderId) {
      prescriptionData.pharmacyOrderId = pharmacyResult.pharmacyOrderId;
      prescriptionData.trackingNumber = pharmacyResult.trackingNumber;
      prescriptionData.estimatedDelivery = pharmacyResult.estimatedDelivery;
    }

    const [updated] = await db
      .update(consultations)
      .set({
        status: pharmacyResult.pharmacyOrderId ? 'prescription_sent' : 'prescription_approved',
        prescriptionData: JSON.stringify(prescriptionData),
        providerNotes: req.body.providerNotes,
        completedAt: new Date()
      })
      .where(eq(consultations.id, req.params.id))
      .returning();

    // Create order record only if pharmacy integration is enabled
    if (pharmacyResult.pharmacyOrderId) {
      await db.query(`
        INSERT INTO orders (
          consultation_id, patient_id, provider_id,
          pharmacy_order_id, tracking_number, medications,
          status, estimated_delivery, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        consultation.id,
        consultation.patientId,
        req.user.id,
        pharmacyResult.pharmacyOrderId,
        pharmacyResult.trackingNumber,
        JSON.stringify(req.body.medications),
        'processing',
        pharmacyResult.estimatedDelivery,
        new Date()
      ]);
    }

    const message = pharmacyResult.pharmacyOrderId
      ? 'Prescription approved and sent to pharmacy successfully'
      : 'Prescription approved successfully (pharmacy integration disabled)';

    res.json({
      success: true,
      data: {
        consultation: updated,
        pharmacy: pharmacyResult
      },
      message
    });
  })
);

// Complete consultation without prescription
router.post('/:id/complete',
  requireAuth,
  requireRole('provider'),
  [
    param('id').isUUID().withMessage('Invalid consultation ID'),
    body('providerNotes').isString().withMessage('Provider notes required'),
    body('followUpRequired').optional().isBoolean(),
    body('followUpDate').optional().isISO8601()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const [updated] = await db
      .update(consultations)
      .set({
        status: 'completed',
        providerNotes: req.body.providerNotes,
        followUpRequired: req.body.followUpRequired,
        followUpDate: req.body.followUpDate,
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

// Cancel consultation
router.post('/:id/cancel',
  requireAuth,
  [
    param('id').isUUID().withMessage('Invalid consultation ID'),
    body('reason').isString().withMessage('Cancellation reason is required')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const [updated] = await db
      .update(consultations)
      .set({
        status: 'cancelled',
        cancellationReason: req.body.reason,
        cancelledAt: new Date()
      })
      .where(eq(consultations.id, req.params.id))
      .returning();

    res.json({
      success: true,
      data: updated,
      message: 'Consultation cancelled successfully'
    });
  })
);

// Add message to consultation
router.post('/:id/messages',
  requireAuth,
  [
    param('id').isUUID().withMessage('Invalid consultation ID'),
    body('content').isString().isLength({ min: 1 }).withMessage('Message content is required')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    
    const messageData = {
      consultationId: req.params.id,
      senderId: req.user.id,
      senderType: req.user.role,
      content: req.body.content,
      createdAt: new Date()
    };

    const [message] = await db
      .insert(messages)
      .values(messageData)
      .returning();

    res.status(201).json({
      success: true,
      data: message,
      message: 'Message sent successfully'
    });
  })
);

// Get consultation messages
router.get('/:id/messages',
  requireAuth,
  [
    param('id').isUUID().withMessage('Invalid consultation ID')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const messagesList = await db
      .select()
      .from(messages)
      .where(eq(messages.consultationId, req.params.id))
      .orderBy(messages.createdAt);

    res.json({
      success: true,
      data: messagesList
    });
  })
);

export default router;
