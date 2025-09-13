import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getDatabase } from '../config/database.js';
import { consultations, patients, providers, apiLogs } from '../models/index.js';

const router = express.Router();

// Get dashboard stats
router.get('/dashboard',
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    
    // Get counts - simplified version
    const stats = {
      totalPatients: 0,
      totalProviders: 0,
      totalConsultations: 0,
      pendingConsultations: 0
    };

    res.json({
      success: true,
      data: stats,
      message: 'Dashboard stats - full implementation needed'
    });
  })
);

// Get audit logs
router.get('/audit-logs',
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const logs = await db
      .select()
      .from(apiLogs)
      .limit(100);

    res.json({
      success: true,
      data: logs
    });
  })
);

export default router;
