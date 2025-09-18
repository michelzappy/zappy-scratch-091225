import express from 'express';
import { query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler.js';
import { MockDataService } from '../services/mock-data.service.js';
import MockDataRegistry from '../services/mock-registry.service.js';

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

// Get provider consultation queue (mock data)
// Get provider consultation queue (mock data)
router.get('/provider/queue',
  [
    query('dateRange').optional().isString(),
    query('status').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { dateRange = 'today', status, limit = 20 } = req.query;
    
    console.log('📊 Mock consultation queue request:', { dateRange, status, limit });
    MockDataRegistry.trackUsage('GET', '/api/mock/consultations/provider/queue', true);
    
    try {
      const filters = { dateRange };
      if (status) filters.status = status;
      
      const consultations = MockDataService.getConsultationsWithProviderInfo(filters);
      
      res.json({
        success: true,
        data: consultations.slice(0, parseInt(limit)),
        total: consultations.length,
        message: 'Using mock data - database unavailable',
        _isMockData: true
      });
    } catch (error) {
      console.error('Error fetching mock consultation queue:', error);
      MockDataRegistry.trackUsage('GET', '/api/mock/consultations/provider/queue', false);
      res.status(500).json({
        error: 'Failed to fetch consultation queue',
        message: error.message
      });
    }
  })
);
// Get all consultations (mock data)
router.get('/',
  [
    query('status').optional().isString(),
    query('patient_id').optional().isUUID(),
    query('provider_id').optional().isUUID(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { status, patient_id, provider_id, limit = 20, offset = 0 } = req.query;
    
    console.log('📋 Mock consultations request:', { status, patient_id, provider_id, limit, offset });
    MockDataRegistry.trackUsage('GET', '/api/mock/consultations', true);
    
    try {
      const filters = {};
      if (status) filters.status = status;
      if (patient_id) filters.patient_id = patient_id;
      if (provider_id) filters.provider_id = provider_id;
      
      const consultations = MockDataService.getConsultationsWithProviderInfo(filters);
      
      res.json({
        success: true,
        data: consultations.slice(offset, offset + parseInt(limit)),
        total: consultations.length,
        message: 'Using mock data - database unavailable',
        _isMockData: true
      });
    } catch (error) {
      console.error('Error fetching mock consultations:', error);
      MockDataRegistry.trackUsage('GET', '/api/mock/consultations', false);
      res.status(500).json({
        error: 'Failed to fetch consultations',
        message: error.message
      });
    }
  })
);

// Get consultation by ID (mock data)
router.get('/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    console.log('🔍 Mock consultation by ID request:', { id });
    MockDataRegistry.trackUsage('GET', '/api/mock/consultations/:id', true);
    
    try {
      const consultation = MockDataService.getConsultationById(id);
      
      if (!consultation) {
        MockDataRegistry.trackUsage('GET', '/api/mock/consultations/:id', false);
        return res.status(404).json({
          error: 'Consultation not found',
          message: 'Using mock data - limited records available'
        });
      }
      
      // Add provider info if available
      if (consultation.provider_id) {
        const provider = MockDataService.getProviderById(consultation.provider_id);
        if (provider) {
          consultation.provider_first_name = provider.first_name;
          consultation.provider_last_name = provider.last_name;
          consultation.provider_title = 'Dr.';
        }
      }
      
      res.json({
        success: true,
        data: consultation,
        message: 'Using mock data - database unavailable',
        _isMockData: true
      });
    } catch (error) {
      console.error('Error fetching mock consultation:', error);
      MockDataRegistry.trackUsage('GET', '/api/mock/consultations/:id', false);
      res.status(500).json({
        error: 'Failed to fetch consultation',
        message: error.message
      });
    }
  })
);

export default router;