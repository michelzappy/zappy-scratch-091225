import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getDatabase } from '../config/database.js';
import { consultationMessages } from '../models/index.js';
import { eq } from 'drizzle-orm';
import { deprecationWarning } from '../middleware/deprecation.js';

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

// DEPRECATED: Use POST /api/consultations/:id/messages instead
// Send message
router.post('/',
  deprecationWarning('/api/messages', 'POST /api/consultations/:id/messages'),
  requireAuth,
  [
    body('consultationId').isUUID().withMessage('Invalid consultation ID'),
    body('content').optional().isString().withMessage('Content must be a string')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const messageData = {
      consultationId: req.body.consultationId,
      senderId: req.user?.id || req.body.senderId,
      senderType: req.body.senderType || 'patient',
      content: req.body.content,
      messageType: 'text'
    };

    const [message] = await db
      .insert(consultationMessages)
      .values(messageData)
      .returning();

    // Emit socket event for real-time messaging
    const io = req.app.get('io');
    if (io) {
      io.to(`consultation_${req.body.consultationId}`).emit('new_message', {
        messageId: message.id,
        consultationId: req.body.consultationId,
        content: req.body.content,
        timestamp: message.createdAt
      });
    }

    res.status(201).json({
      success: true,
      data: message,
      message: 'Message sent successfully'
    });
  })
);

// DEPRECATED: Use GET /api/consultations/:id/messages instead
// Get messages for consultation
router.get('/consultation/:consultationId',
  deprecationWarning('/api/messages/consultation/:consultationId', 'GET /api/consultations/:id/messages'),
  requireAuth,
  [
    param('consultationId').isUUID().withMessage('Invalid consultation ID')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const messagesList = await db
      .select()
      .from(consultationMessages)
      .where(eq(consultationMessages.consultationId, req.params.consultationId))
      .limit(50);

    res.json({
      success: true,
      data: messagesList
    });
  })
);

// Get conversations list for user
router.get('/conversations',
  requireAuth,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    
    try {
      let conversationsList = [];
      
      if (req.user.role === 'patient') {
        // For patients, get conversations from their consultations
        const result = await db`
          SELECT
            c.id as consultation_id,
            c.chief_complaint as subject,
            c.status,
            c.created_at,
            c.updated_at,
            p.first_name || ' ' || p.last_name as provider_name,
            (SELECT content FROM consultation_messages cm
             WHERE cm.consultation_id = c.id
             ORDER BY cm.created_at DESC LIMIT 1) as last_message,
            (SELECT created_at FROM consultation_messages cm
             WHERE cm.consultation_id = c.id
             ORDER BY cm.created_at DESC LIMIT 1) as last_message_date,
            (SELECT COUNT(*) FROM consultation_messages cm
             WHERE cm.consultation_id = c.id
             AND cm.sender_type = 'provider'
             AND cm.is_read = false) as unread_count
          FROM consultations c
          LEFT JOIN providers p ON c.provider_id = p.id
          WHERE c.patient_id = ${req.user.id}
          ORDER BY COALESCE(
            (SELECT created_at FROM consultation_messages cm
             WHERE cm.consultation_id = c.id
             ORDER BY cm.created_at DESC LIMIT 1),
            c.updated_at
          ) DESC
        `;
        conversationsList = result;
      } else if (req.user.role === 'provider') {
        // For providers, get conversations from assigned consultations
        const result = await db`
          SELECT
            c.id as consultation_id,
            c.chief_complaint as subject,
            c.status,
            c.created_at,
            c.updated_at,
            pt.first_name || ' ' || pt.last_name as patient_name,
            (SELECT content FROM consultation_messages cm
             WHERE cm.consultation_id = c.id
             ORDER BY cm.created_at DESC LIMIT 1) as last_message,
            (SELECT created_at FROM consultation_messages cm
             WHERE cm.consultation_id = c.id
             ORDER BY cm.created_at DESC LIMIT 1) as last_message_date,
            (SELECT COUNT(*) FROM consultation_messages cm
             WHERE cm.consultation_id = c.id
             AND cm.sender_type = 'patient'
             AND cm.is_read = false) as unread_count
          FROM consultations c
          LEFT JOIN patients pt ON c.patient_id = pt.id
          WHERE c.provider_id = ${req.user.id}
          ORDER BY COALESCE(
            (SELECT created_at FROM consultation_messages cm
             WHERE cm.consultation_id = c.id
             ORDER BY cm.created_at DESC LIMIT 1),
            c.updated_at
          ) DESC
        `;
        conversationsList = result;
      }

      res.json({
        success: true,
        data: conversationsList
      });
    } catch (error) {
      console.error('Error getting conversations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get conversations'
      });
    }
  })
);

// Get unread message count for user
router.get('/unread-count',
  requireAuth,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    
    let unreadCount = 0;
    
    try {
      // Get unread count based on user role
      if (req.user.role === 'patient') {
        // For patients, count unread messages from providers in their consultations
        const result = await db`
          SELECT COUNT(*) as count
          FROM consultation_messages m
          JOIN consultations c ON m.consultation_id = c.id
          WHERE c.patient_id = ${req.user.id}
          AND m.sender_type = 'provider'
          AND m.is_read = false
        `;
        unreadCount = parseInt(result[0]?.count || 0);
      } else if (req.user.role === 'provider') {
        // For providers, count unread messages from patients in their consultations
        const result = await db`
          SELECT COUNT(*) as count
          FROM consultation_messages m
          JOIN consultations c ON m.consultation_id = c.id
          WHERE c.provider_id = ${req.user.id}
          AND m.sender_type = 'patient'
          AND m.is_read = false
        `;
        unreadCount = parseInt(result[0]?.count || 0);
      }
    } catch (error) {
      console.error('Error getting unread count:', error);
      // Return 0 if there's an error
      unreadCount = 0;
    }

    res.json({
      success: true,
      data: {
        unreadCount: unreadCount
      }
    });
  })
);

// Mark consultation messages as read
router.post('/consultation/:consultationId/read',
  requireAuth,
  [
    param('consultationId').isUUID().withMessage('Invalid consultation ID')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    
    try {
      // Mark messages as read based on user role
      let senderType = req.user.role === 'patient' ? 'provider' : 'patient';
      
      await db`
        UPDATE consultation_messages
        SET is_read = true
        WHERE consultation_id = ${req.params.consultationId}
        AND sender_type = ${senderType}
        AND is_read = false
      `;

      res.json({
        success: true,
        message: 'Messages marked as read'
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark messages as read'
      });
    }
  })
);

export default router;
