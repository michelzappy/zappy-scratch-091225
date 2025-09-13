import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase, generateUserId } from '../config/auth.js';
import { getDatabase } from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

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

// Patient intake form submission (no account required)
router.post('/intake',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('dateOfBirth').isDate().withMessage('Date of birth is required'),
    body('chiefComplaint').notEmpty().withMessage('Chief complaint is required')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const {
      email, firstName, lastName, phone, dateOfBirth,
      shippingAddress, shippingCity, shippingState, shippingZip,
      allergies, currentMedications, medicalConditions,
      chiefComplaint, symptoms, symptomDuration, severity
    } = req.body;

    const db = getDatabase();
    
    // Check if patient exists
    let patientResult = await db.query(
      'SELECT id FROM patients WHERE email = $1',
      [email]
    );
    
    let patientId;
    
    if (patientResult.rows.length === 0) {
      // Create new patient
      const insertResult = await db.query(`
        INSERT INTO patients (
          email, first_name, last_name, phone, date_of_birth,
          shipping_address, shipping_city, shipping_state, shipping_zip,
          allergies, current_medications, medical_conditions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `, [
        email, firstName, lastName, phone, dateOfBirth,
        shippingAddress, shippingCity, shippingState, shippingZip,
        allergies, currentMedications, medicalConditions
      ]);
      patientId = insertResult.rows[0].id;
    } else {
      patientId = patientResult.rows[0].id;
      
      // Update patient info
      await db.query(`
        UPDATE patients SET
          first_name = $2, last_name = $3, phone = $4,
          shipping_address = $5, shipping_city = $6, 
          shipping_state = $7, shipping_zip = $8,
          allergies = $9, current_medications = $10, 
          medical_conditions = $11,
          updated_at = NOW()
        WHERE id = $1
      `, [
        patientId, firstName, lastName, phone,
        shippingAddress, shippingCity, shippingState, shippingZip,
        allergies, currentMedications, medicalConditions
      ]);
    }
    
    // Create consultation
    const consultationResult = await db.query(`
      INSERT INTO consultations (
        patient_id, chief_complaint, symptoms, 
        symptom_duration, severity
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id, submitted_at
    `, [
      patientId, chiefComplaint, symptoms, 
      symptomDuration, severity
    ]);
    
    const consultation = consultationResult.rows[0];
    
    res.status(201).json({
      success: true,
      data: { 
        consultationId: consultation.id,
        submittedAt: consultation.submitted_at,
        message: 'Your consultation request has been received. A provider will review it within 24 hours.'
      }
    });
  })
);

// Register patient with password (for returning patients)
router.post('/register/patient',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('dateOfBirth').isDate().withMessage('Date of birth is required')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { 
      email, password, firstName, lastName, phone, dateOfBirth,
      shippingAddress, shippingCity, shippingState, shippingZip
    } = req.body;

    const db = getDatabase();
    
    // Check if patient exists
    const existingPatient = await db.query(
      'SELECT id FROM patients WHERE email = $1',
      [email]
    );
    
    if (existingPatient.rows.length > 0) {
      return res.status(409).json({
        error: 'Email already registered'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create patient
    const result = await db.query(`
      INSERT INTO patients (
        email, password_hash, first_name, last_name, 
        phone, date_of_birth, shipping_address, 
        shipping_city, shipping_state, shipping_zip
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, email, first_name, last_name
    `, [
      email, passwordHash, firstName, lastName, phone, 
      dateOfBirth, shippingAddress, shippingCity, 
      shippingState, shippingZip
    ]);
    
    const patient = result.rows[0];
    
    // Generate JWT token
    const token = jwt.sign(
      { id: patient.id, email: patient.email, role: 'patient' },
      process.env.JWT_SECRET || 'development-secret',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      data: { 
        patient: {
          id: patient.id,
          email: patient.email,
          firstName: patient.first_name,
          lastName: patient.last_name
        },
        token 
      }
    });
  })
);

// Login
router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 1 }).withMessage('Password is required')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // If Supabase is configured, use it for auth
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return res.status(400).json({
          error: 'Login failed',
          message: error.message
        });
      }

      return res.json({
        success: true,
        data: {
          user: data.user,
          session: data.session
        },
        message: 'Login successful'
      });
    }

    // Fallback for development without Supabase
    res.json({
      success: true,
      data: {
        user: { email },
        session: { token: 'dev-token' }
      },
      message: 'Login successful (dev mode)'
    });
  })
);

export default router;
