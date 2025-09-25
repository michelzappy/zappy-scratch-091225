import express from 'express';
import { getQueryService } from '../services/query.service.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * Get query performance metrics (public for testing)
 * GET /api/query-metrics/metrics
 */
router.get('/metrics', 
  async (req, res) => {
    try {
      const queryService = await getQueryService();
      const metrics = queryService.getMetrics();
      
      res.json({
        success: true,
        data: {
          metrics,
          timestamp: new Date().toISOString(),
          totalQueries: Object.values(metrics).reduce((sum, m) => sum + m.totalQueries, 0)
        }
      });
    } catch (error) {
      console.error('Error getting query metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve query metrics'
      });
    }
  }
);

/**
 * Clear query cache
 * POST /api/query-metrics/clear-cache
 */
router.post('/clear-cache',
  requireAuth,
  async (req, res) => {
    try {
      const queryService = await getQueryService();
      const { pattern } = req.body;
      
      await queryService.clearCache(pattern);
      
      res.json({
        success: true,
        message: pattern ? `Cache cleared for pattern: ${pattern}` : 'All query cache cleared'
      });
    } catch (error) {
      console.error('Error clearing query cache:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear query cache'
      });
    }
  }
);

export default router;
