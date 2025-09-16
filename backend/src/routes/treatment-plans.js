import express from 'express';
import { getDatabase } from '../config/database.js';

const router = express.Router();

/**
 * GET /api/treatment-plans/:condition
 * Get available treatment plans for a specific condition
 */
router.get('/:condition', async (req, res, next) => {
  try {
    const { condition } = req.params;
    const db = getDatabase();

    const result = await db.query(
      `SELECT 
        id,
        condition,
        plan_tier,
        name,
        price,
        billing_period,
        protocol_key,
        features,
        is_popular,
        sort_order
      FROM treatment_plans
      WHERE condition = $1
      ORDER BY sort_order ASC`,
      [condition]
    );

    res.json({
      success: true,
      plans: result.rows
    });
  } catch (error) {
    console.error('Error fetching treatment plans:', error);
    next(error);
  }
});

/**
 * GET /api/treatment-plans/plan/:planId
 * Get details for a specific treatment plan
 */
router.get('/plan/:planId', async (req, res, next) => {
  try {
    const { planId } = req.params;
    const db = getDatabase();

    // Get plan details
    const planResult = await db.query(
      `SELECT * FROM treatment_plans WHERE id = $1`,
      [planId]
    );

    if (planResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Treatment plan not found'
      });
    }

    const plan = planResult.rows[0];

    // Get medications for this plan
    const medicationsResult = await db.query(
      `SELECT * FROM get_plan_medications($1)`,
      [planId]
    );

    res.json({
      success: true,
      plan: {
        ...plan,
        medications: medicationsResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching treatment plan details:', error);
    next(error);
  }
});

/**
 * GET /api/treatment-plans
 * Get all available treatment plans (admin view)
 */
router.get('/', async (req, res, next) => {
  try {
    const db = getDatabase();

    const result = await db.query(
      `SELECT 
        tp.*,
        COUNT(c.id) as consultation_count
      FROM treatment_plans tp
      LEFT JOIN consultations c ON c.selected_plan_id = tp.id
      GROUP BY tp.id
      ORDER BY tp.condition, tp.sort_order`
    );

    res.json({
      success: true,
      plans: result.rows
    });
  } catch (error) {
    console.error('Error fetching all treatment plans:', error);
    next(error);
  }
});

export default router;
