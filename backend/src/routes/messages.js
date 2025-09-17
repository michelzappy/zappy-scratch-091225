import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getDatabase } from '../config/database.js';
import { messages } from '../models/index.js';
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

// Send message
router.post('/',
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
      .insert(messages)
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

// Get messages for consultation
router.get('/consultation/:consultationId',
  requireAuth,
  [
    param('consultationId').isUUID().withMessage('Invalid consultation ID')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const messagesList = await db
      .select()
      .from(messages)
      .where(eq(messages.consultationId, req.params.consultationId))
      .limit(50);

    res.json({
      success: true,
      data: messagesList
    });
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
        const result = await db.query(`
          SELECT COUNT(*) as count
          FROM messages m
          JOIN consultations c ON m.consultation_id = c.id
          WHERE c.patient_id = $1 
          AND m.sender_type = 'provider'
          AND m.is_read = false
        `, [req.user.id]);
        unreadCount = parseInt(result.rows[0]?.count || 0);
      } else if (req.user.role === 'provider') {
        // For providers, count unread messages from patients in their consultations
        const result = await db.query(`
          SELECT COUNT(*) as count
          FROM messages m
          JOIN consultations c ON m.consultation_id = c.id
          WHERE c.provider_id = $1 
          AND m.sender_type = 'patient'
          AND m.is_read = false
        `, [req.user.id]);
        unreadCount = parseInt(result.rows[0]?.count || 0);
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
      
      await db.query(`
        UPDATE messages 
        SET is_read = true 
        WHERE consultation_id = $1 
        AND sender_type = $2
        AND is_read = false
      `, [req.params.consultationId, senderType]);

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
