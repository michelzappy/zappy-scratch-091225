import express from 'express';
import MockDataRegistry from '../services/mock-registry.service.js';

const router = express.Router();

/**
 * Mock Data Management Dashboard Routes
 * Provides endpoints for monitoring and managing mock data usage
 */

// Initialize registry on first load
MockDataRegistry.initialize();

/**
 * GET /api/mock-management/dashboard
 * Get comprehensive mock data dashboard
 */
router.get('/dashboard', (req, res) => {
  try {
    const documentation = MockDataRegistry.generateDocumentation();
    
    res.json({
      success: true,
      data: documentation,
      message: 'Mock data dashboard retrieved successfully'
    });
  } catch (error) {
    console.error('Error generating mock data dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate mock data dashboard',
      message: error.message
    });
  }
});

/**
 * GET /api/mock-management/report
 * Get detailed mock data usage report
 */
router.get('/report', (req, res) => {
  try {
    const report = MockDataRegistry.getReport();
    
    res.json({
      success: true,
      data: report,
      message: 'Mock data report retrieved successfully'
    });
  } catch (error) {
    console.error('Error generating mock data report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate mock data report',
      message: error.message
    });
  }
});

/**
 * GET /api/mock-management/health
 * Get mock data system health status
 */
router.get('/health', (req, res) => {
  try {
    const health = MockDataRegistry.getHealthStatus();
    
    res.json({
      success: true,
      data: health,
      message: 'Mock data health status retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting mock data health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get mock data health status',
      message: error.message
    });
  }
});

/**
 * GET /api/mock-management/endpoints
 * Get all registered mock endpoints
 */
router.get('/endpoints', (req, res) => {
  try {
    const report = MockDataRegistry.getReport();
    
    res.json({
      success: true,
      data: {
        endpoints: report.endpoints,
        summary: {
          total: report.endpoints.length,
          used: report.endpoints.filter(e => e.usageCount > 0).length,
          unused: report.endpoints.filter(e => e.usageCount === 0).length
        }
      },
      message: 'Mock endpoints retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting mock endpoints:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get mock endpoints',
      message: error.message
    });
  }
});

/**
 * GET /api/mock-management/fallbacks
 * Get all registered fallback mappings
 */
router.get('/fallbacks', (req, res) => {
  try {
    const report = MockDataRegistry.getReport();
    
    res.json({
      success: true,
      data: {
        fallbacks: report.fallbacks,
        summary: {
          total: report.fallbacks.length,
          used: report.fallbacks.filter(f => f.usageCount > 0).length,
          unused: report.fallbacks.filter(f => f.usageCount === 0).length
        }
      },
      message: 'Mock fallbacks retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting mock fallbacks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get mock fallbacks',
      message: error.message
    });
  }
});

/**
 * GET /api/mock-management/usage-stats
 * Get detailed usage statistics
 */
router.get('/usage-stats', (req, res) => {
  try {
    const report = MockDataRegistry.getReport();
    
    // Calculate additional statistics
    const stats = report.usageStats;
    const totalRequests = stats.reduce((sum, stat) => sum + stat.totalRequests, 0);
    const totalSuccessful = stats.reduce((sum, stat) => sum + stat.successfulRequests, 0);
    const totalFailed = stats.reduce((sum, stat) => sum + stat.failedRequests, 0);
    
    const topEndpoints = stats
      .sort((a, b) => b.totalRequests - a.totalRequests)
      .slice(0, 10);
    
    const recentActivity = stats
      .filter(stat => stat.lastUsed)
      .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        overview: {
          totalRequests,
          totalSuccessful,
          totalFailed,
          overallSuccessRate: totalRequests > 0 ? ((totalSuccessful / totalRequests) * 100).toFixed(2) + '%' : '0%'
        },
        topEndpoints,
        recentActivity,
        allStats: stats
      },
      message: 'Usage statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting usage statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get usage statistics',
      message: error.message
    });
  }
});

/**
 * GET /api/mock-management/data-sources
 * Get all registered mock data sources
 */
router.get('/data-sources', (req, res) => {
  try {
    const report = MockDataRegistry.getReport();
    
    res.json({
      success: true,
      data: {
        dataSources: report.dataSources,
        summary: {
          total: report.dataSources.length,
          static: report.dataSources.filter(ds => ds.type === 'static').length,
          dynamic: report.dataSources.filter(ds => ds.type === 'dynamic').length,
          totalRecords: report.dataSources.reduce((sum, ds) => sum + ds.count, 0)
        }
      },
      message: 'Mock data sources retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting mock data sources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get mock data sources',
      message: error.message
    });
  }
});

/**
 * POST /api/mock-management/track-usage
 * Manually track mock endpoint usage (for testing)
 */
router.post('/track-usage', (req, res) => {
  try {
    const { method, path, success = true } = req.body;
    
    if (!method || !path) {
      return res.status(400).json({
        success: false,
        error: 'Method and path are required',
        message: 'Please provide both method and path parameters'
      });
    }
    
    MockDataRegistry.trackUsage(method, path, success);
    
    res.json({
      success: true,
      message: `Usage tracked for ${method} ${path}`
    });
  } catch (error) {
    console.error('Error tracking usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track usage',
      message: error.message
    });
  }
});

/**
 * POST /api/mock-management/track-fallback
 * Manually track fallback usage (for testing)
 */
router.post('/track-fallback', (req, res) => {
  try {
    const { originalPath, mockPath, trigger } = req.body;
    
    if (!originalPath || !mockPath || !trigger) {
      return res.status(400).json({
        success: false,
        error: 'originalPath, mockPath, and trigger are required',
        message: 'Please provide all required parameters'
      });
    }
    
    MockDataRegistry.trackFallback(originalPath, mockPath, trigger);
    
    res.json({
      success: true,
      message: `Fallback tracked: ${originalPath} -> ${mockPath} (${trigger})`
    });
  } catch (error) {
    console.error('Error tracking fallback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track fallback',
      message: error.message
    });
  }
});

/**
 * GET /api/mock-management/identification
 * Get comprehensive mock data identification
 */
router.get('/identification', (req, res) => {
  try {
    const identification = MockDataRegistry.identifyAllMockData();
    
    res.json({
      success: true,
      data: identification,
      message: 'Mock data identification retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting mock data identification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get mock data identification',
      message: error.message
    });
  }
});

/**
 * POST /api/mock-management/reset-stats
 * Reset all usage statistics (for testing)
 */
router.post('/reset-stats', (req, res) => {
  try {
    // Reset usage counts and stats
    MockDataRegistry.mockUsageStats.clear();
    
    // Reset endpoint usage counts
    for (const endpoint of MockDataRegistry.mockEndpoints.values()) {
      endpoint.usageCount = 0;
      endpoint.lastUsed = null;
    }
    
    // Reset fallback usage counts
    for (const fallback of MockDataRegistry.mockFallbacks.values()) {
      fallback.usageCount = 0;
      fallback.lastUsed = null;
    }
    
    res.json({
      success: true,
      message: 'All usage statistics have been reset'
    });
  } catch (error) {
    console.error('Error resetting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset statistics',
      message: error.message
    });
  }
});

export default router;