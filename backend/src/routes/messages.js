import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler.js';
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

export default router;
