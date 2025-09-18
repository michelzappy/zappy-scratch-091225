import express from 'express';
import { query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler.js';
import { MockDataService } from '../services/mock-data.service.js';

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

// Get admin dashboard stats (mock data)
router.get('/dashboard',
  asyncHandler(async (req, res) => {
    console.log('📊 Mock admin dashboard request');
    
    try {
      const stats = MockDataService.getDashboardStats();
      
      // Add some additional mock metrics
      const dashboardData = {
        ...stats,
        revenue_today: 1250.00,
        revenue_month: 45000.00,
        new_patients_today: 3,
        new_patients_month: 127,
        consultation_completion_rate: 94.5,
        average_consultation_time: 18.5,
        patient_satisfaction: 4.8,
        recent_activity: [
          {
            id: '1',
            type: 'consultation_completed',
            message: 'Dr. Wilson completed consultation with John Doe',
            timestamp: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
          },
          {
            id: '2',
            type: 'new_patient',
            message: 'New patient registration: Jane Smith',
            timestamp: new Date(Date.now() - 1000 * 60 * 45) // 45 minutes ago
          },
          {
            id: '3',
            type: 'order_shipped',
            message: 'Order #1001 shipped to Bob Johnson',
            timestamp: new Date(Date.now() - 1000 * 60 * 120) // 2 hours ago
          }
        ]
      };
      
      res.json({
        success: true,
        data: dashboardData,
        message: 'Using mock data - database unavailable'
      });
    } catch (error) {
      console.error('Error fetching mock admin dashboard:', error);
      res.status(500).json({
        error: 'Failed to fetch dashboard data',
        message: error.message
      });
    }
  })
);

// Get all patients (mock data)
router.get('/patients',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    query('search').optional().isString()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { limit = 20, offset = 0, search } = req.query;
    
    console.log('👥 Mock admin patients request:', { limit, offset, search });
    
    try {
      let patients = MockDataService.getPatients();
      
      // Simple search filter
      if (search) {
        const searchLower = search.toLowerCase();
        patients = patients.filter(p => 
          p.first_name.toLowerCase().includes(searchLower) ||
          p.last_name.toLowerCase().includes(searchLower) ||
          p.email.toLowerCase().includes(searchLower)
        );
      }
      
      const paginatedPatients = patients.slice(offset, offset + parseInt(limit));
      
      res.json({
        success: true,
        data: paginatedPatients,
        total: patients.length,
        message: 'Using mock data - database unavailable'
      });
    } catch (error) {
      console.error('Error fetching mock patients:', error);
      res.status(500).json({
        error: 'Failed to fetch patients',
        message: error.message
      });
    }
  })
);

// Get all providers (mock data)
router.get('/providers',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { limit = 20, offset = 0 } = req.query;
    
    console.log('👨‍⚕️ Mock admin providers request:', { limit, offset });
    
    try {
      const providers = MockDataService.getProviders();
      const paginatedProviders = providers.slice(offset, offset + parseInt(limit));
      
      res.json({
        success: true,
        data: paginatedProviders,
        total: providers.length,
        message: 'Using mock data - database unavailable'
      });
    } catch (error) {
      console.error('Error fetching mock providers:', error);
      res.status(500).json({
        error: 'Failed to fetch providers',
        message: error.message
      });
    }
  })
);

export default router;