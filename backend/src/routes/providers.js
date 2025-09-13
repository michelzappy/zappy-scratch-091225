import express from 'express';
import { param } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getDatabase } from '../config/database.js';
import { providers, consultations } from '../models/index.js';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Get all providers
router.get('/',
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const providersList = await db
      .select()
      .from(providers)
      .where(eq(providers.isActive, true))
      .limit(50);

    res.json({
      success: true,
      data: providersList
    });
  })
);

// Get provider profile
router.get('/:id',
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const [provider] = await db
      .select()
      .from(providers)
      .where(eq(providers.id, req.params.id))
      .limit(1);

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    res.json({
      success: true,
      data: provider
    });
  })
);

// Get provider's consultations
router.get('/:id/consultations',
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const consultationsList = await db
      .select()
      .from(consultations)
      .where(eq(consultations.providerId, req.params.id))
      .limit(20);

    res.json({
      success: true,
      data: consultationsList
    });
  })
);

export default router;
