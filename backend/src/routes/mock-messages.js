import express from 'express';
import { body, query, validationResult } from 'express-validator';
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

// Get messages for a patient or provider
router.get('/',
  [
    query('patient_id').optional().isUUID(),
    query('provider_id').optional().isUUID(),
    query('consultation_id').optional().isUUID(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { patient_id, provider_id, consultation_id, limit = 20, offset = 0 } = req.query;
    
    console.log('💬 Mock messages request:', { patient_id, provider_id, consultation_id, limit, offset });
    
    try {
      let messages = MockDataService.getMessages();
      
      // Filter messages based on query parameters
      if (patient_id) {
        messages = messages.filter(m => m.patient_id === patient_id);
      }
      if (provider_id) {
        messages = messages.filter(m => m.provider_id === provider_id);
      }
      if (consultation_id) {
        messages = messages.filter(m => m.consultation_id === consultation_id);
      }
      
      // Sort by timestamp (newest first)
      messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      const paginatedMessages = messages.slice(offset, offset + parseInt(limit));
      
      res.json({
        success: true,
        data: paginatedMessages,
        total: messages.length,
        message: 'Using mock data - database unavailable'
      });
    } catch (error) {
      console.error('Error fetching mock messages:', error);
      res.status(500).json({
        error: 'Failed to fetch messages',
        message: error.message
      });
    }
  })
);

// Send a new message
router.post('/',
  [
    body('patient_id').optional().isUUID(),
    body('provider_id').optional().isUUID(),
    body('consultation_id').optional().isUUID(),
    body('content').isString().isLength({ min: 1, max: 1000 }),
    body('sender_type').isIn(['patient', 'provider', 'system'])
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { patient_id, provider_id, consultation_id, content, sender_type } = req.body;
    
    console.log('📤 Mock send message request:', { patient_id, provider_id, consultation_id, sender_type });
    
    try {
      // Create a new mock message
      const newMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        patient_id: patient_id || null,
        provider_id: provider_id || null,
        consultation_id: consultation_id || null,
        content,
        sender_type,
        sender_id: sender_type === 'patient' ? patient_id : provider_id,
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // In a real app, this would be saved to the database
      // For now, we'll just return the created message
      
      res.status(201).json({
        success: true,
        data: newMessage,
        message: 'Message sent successfully (mock data)'
      });
    } catch (error) {
      console.error('Error sending mock message:', error);
      res.status(500).json({
        error: 'Failed to send message',
        message: error.message
      });
    }
  })
);

// Mark message as read
router.patch('/:messageId/read',
  asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    
    console.log('✅ Mock mark message as read:', messageId);
    
    try {
      // In a real app, this would update the database
      // For now, we'll just return success
      
      res.json({
        success: true,
        message: 'Message marked as read (mock data)'
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      res.status(500).json({
        error: 'Failed to mark message as read',
        message: error.message
      });
    }
  })
);

// Get unread message count
router.get('/unread-count',
  [
    query('patient_id').optional().isUUID(),
    query('provider_id').optional().isUUID()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { patient_id, provider_id } = req.query;
    
    console.log('🔢 Mock unread messages count:', { patient_id, provider_id });
    
    try {
      let messages = MockDataService.getMessages();
      
      // Filter messages based on user
      if (patient_id) {
        messages = messages.filter(m => m.patient_id === patient_id && !m.is_read);
      }
      if (provider_id) {
        messages = messages.filter(m => m.provider_id === provider_id && !m.is_read);
      }
      
      const unreadCount = messages.length;
      
      res.json({
        success: true,
        data: { unread_count: unreadCount },
        message: 'Using mock data - database unavailable'
      });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({
        error: 'Failed to fetch unread count',
        message: error.message
      });
    }
  })
);

export default router;