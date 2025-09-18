// Mock Data Registry and Management System
import { MockDataService } from './mock-data.service.js';

/**
 * Comprehensive Mock Data Registry
 * Tracks all mock data usage, endpoints, and fallback mechanisms
 */
export class MockDataRegistry {
  static mockEndpoints = new Map();
  static mockFallbacks = new Map();
  static mockUsageStats = new Map();
  static mockDataSources = new Map();

  /**
   * Initialize the mock registry with all known mock endpoints
   */
  static initialize() {
    console.log('🔧 Initializing Mock Data Registry...');
    
    // Register all mock endpoints
    this.registerMockEndpoints();
    
    // Register fallback mappings
    this.registerFallbackMappings();
    
    // Register data sources
    this.registerDataSources();
    
    console.log('✅ Mock Data Registry initialized');
    console.log(`📊 Registered ${this.mockEndpoints.size} mock endpoints`);
    console.log(`🔄 Registered ${this.mockFallbacks.size} fallback mappings`);
    console.log(`💾 Registered ${this.mockDataSources.size} data sources`);
  }

  /**
   * Register all mock API endpoints
   */
  static registerMockEndpoints() {
    const endpoints = [
      // Consultation endpoints
      {
        path: '/api/mock/consultations/provider/queue',
        method: 'GET',
        description: 'Provider consultation queue with filtering',
        dataSource: 'MockDataService.getConsultationsWithProviderInfo',
        parameters: ['dateRange', 'status', 'limit'],
        responseStructure: {
          success: 'boolean',
          data: 'array',
          total: 'number',
          message: 'string'
        },
        fallbackFor: '/api/consultations/provider/queue'
      },
      {
        path: '/api/mock/consultations',
        method: 'GET',
        description: 'All consultations with filtering',
        dataSource: 'MockDataService.getConsultationsWithProviderInfo',
        parameters: ['status', 'patient_id', 'provider_id', 'limit', 'offset'],
        responseStructure: {
          success: 'boolean',
          data: 'array',
          total: 'number',
          message: 'string'
        },
        fallbackFor: '/api/consultations'
      },
      {
        path: '/api/mock/consultations/:id',
        method: 'GET',
        description: 'Single consultation by ID',
        dataSource: 'MockDataService.getConsultationById',
        parameters: ['id'],
        responseStructure: {
          success: 'boolean',
          data: 'object',
          message: 'string'
        },
        fallbackFor: '/api/consultations/:id'
      },

      // Admin endpoints
      {
        path: '/api/mock/admin/dashboard',
        method: 'GET',
        description: 'Admin dashboard statistics',
        dataSource: 'MockDataService.getDashboardStats',
        parameters: [],
        responseStructure: {
          success: 'boolean',
          data: 'object',
          message: 'string'
        },
        fallbackFor: '/api/admin/dashboard'
      },
      {
        path: '/api/mock/admin/patients',
        method: 'GET',
        description: 'All patients for admin management',
        dataSource: 'MockDataService.getPatients',
        parameters: ['limit', 'offset', 'search'],
        responseStructure: {
          success: 'boolean',
          data: 'array',
          total: 'number',
          message: 'string'
        },
        fallbackFor: '/api/admin/patients'
      },
      {
        path: '/api/mock/admin/providers',
        method: 'GET',
        description: 'All providers for admin management',
        dataSource: 'MockDataService.getProviders',
        parameters: ['limit', 'offset'],
        responseStructure: {
          success: 'boolean',
          data: 'array',
          total: 'number',
          message: 'string'
        },
        fallbackFor: '/api/admin/providers'
      },

      // Message endpoints
      {
        path: '/api/mock/messages',
        method: 'GET',
        description: 'Messages with filtering',
        dataSource: 'MockDataService.getMessages',
        parameters: ['patient_id', 'provider_id', 'consultation_id', 'limit', 'offset'],
        responseStructure: {
          success: 'boolean',
          data: 'array',
          total: 'number',
          message: 'string'
        },
        fallbackFor: '/api/messages'
      },
      {
        path: '/api/mock/messages',
        method: 'POST',
        description: 'Send new message',
        dataSource: 'Generated',
        parameters: ['patient_id', 'provider_id', 'consultation_id', 'content', 'sender_type'],
        responseStructure: {
          success: 'boolean',
          data: 'object',
          message: 'string'
        },
        fallbackFor: '/api/messages'
      },
      {
        path: '/api/mock/messages/:messageId/read',
        method: 'PATCH',
        description: 'Mark message as read',
        dataSource: 'Generated',
        parameters: ['messageId'],
        responseStructure: {
          success: 'boolean',
          message: 'string'
        },
        fallbackFor: '/api/messages/:messageId/read'
      },
      {
        path: '/api/mock/messages/unread-count',
        method: 'GET',
        description: 'Get unread message count',
        dataSource: 'MockDataService.getUnreadMessagesCount',
        parameters: ['patient_id', 'provider_id'],
        responseStructure: {
          success: 'boolean',
          data: 'object',
          message: 'string'
        },
        fallbackFor: '/api/messages/unread-count'
      },

      // Order endpoints
      {
        path: '/api/mock/orders',
        method: 'GET',
        description: 'Orders with filtering',
        dataSource: 'MockDataService.getOrders',
        parameters: ['patient_id', 'provider_id', 'status', 'limit', 'offset'],
        responseStructure: {
          success: 'boolean',
          data: 'array',
          total: 'number',
          message: 'string'
        },
        fallbackFor: '/api/orders'
      },
      {
        path: '/api/mock/orders/:orderId',
        method: 'GET',
        description: 'Single order by ID',
        dataSource: 'MockDataService.getOrderById',
        parameters: ['orderId'],
        responseStructure: {
          success: 'boolean',
          data: 'object',
          message: 'string'
        },
        fallbackFor: '/api/orders/:orderId'
      },
      {
        path: '/api/mock/orders',
        method: 'POST',
        description: 'Create new order',
        dataSource: 'Generated',
        parameters: ['patient_id', 'provider_id', 'consultation_id', 'items', 'shipping_address'],
        responseStructure: {
          success: 'boolean',
          data: 'object',
          message: 'string'
        },
        fallbackFor: '/api/orders'
      },
      {
        path: '/api/mock/orders/:orderId/status',
        method: 'PATCH',
        description: 'Update order status',
        dataSource: 'Generated',
        parameters: ['orderId', 'status', 'tracking_number'],
        responseStructure: {
          success: 'boolean',
          data: 'object',
          message: 'string'
        },
        fallbackFor: '/api/orders/:orderId/status'
      },
      {
        path: '/api/mock/orders/:orderId',
        method: 'DELETE',
        description: 'Cancel order',
        dataSource: 'Generated',
        parameters: ['orderId'],
        responseStructure: {
          success: 'boolean',
          message: 'string'
        },
        fallbackFor: '/api/orders/:orderId'
      }
    ];

    endpoints.forEach(endpoint => {
      const key = `${endpoint.method}:${endpoint.path}`;
      this.mockEndpoints.set(key, {
        ...endpoint,
        registeredAt: new Date(),
        usageCount: 0,
        lastUsed: null
      });
    });
  }

  /**
   * Register fallback mappings from regular endpoints to mock endpoints
   */
  static registerFallbackMappings() {
    const fallbacks = [
      {
        original: '/api/consultations/provider/queue',
        mock: '/api/mock/consultations/provider/queue',
        trigger: ['401', '404', '500', '503'],
        description: 'Provider consultation queue fallback'
      },
      {
        original: '/api/consultations',
        mock: '/api/mock/consultations',
        trigger: ['401', '404', '500', '503'],
        description: 'Consultations list fallback'
      },
      {
        original: '/api/admin/dashboard',
        mock: '/api/mock/admin/dashboard',
        trigger: ['401', '404', '500', '503'],
        description: 'Admin dashboard fallback'
      },
      {
        original: '/api/admin/patients',
        mock: '/api/mock/admin/patients',
        trigger: ['401', '404', '500', '503'],
        description: 'Admin patients list fallback'
      },
      {
        original: '/api/messages',
        mock: '/api/mock/messages',
        trigger: ['401', '404', '500', '503'],
        description: 'Messages fallback'
      },
      {
        original: '/api/orders',
        mock: '/api/mock/orders',
        trigger: ['401', '404', '500', '503'],
        description: 'Orders fallback'
      }
    ];

    fallbacks.forEach(fallback => {
      this.mockFallbacks.set(fallback.original, {
        ...fallback,
        registeredAt: new Date(),
        usageCount: 0,
        lastUsed: null
      });
    });
  }

  /**
   * Register mock data sources
   */
  static registerDataSources() {
    const sources = [
      {
        name: 'mockPatients',
        type: 'static',
        count: 3,
        description: 'Static patient records for testing',
        fields: ['id', 'first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender'],
        lastUpdated: new Date()
      },
      {
        name: 'mockProviders',
        type: 'static',
        count: 2,
        description: 'Static provider records for testing',
        fields: ['id', 'first_name', 'last_name', 'email', 'license_number', 'specialties', 'states_licensed'],
        lastUpdated: new Date()
      },
      {
        name: 'mockConsultations',
        type: 'dynamic',
        count: 5,
        description: 'Dynamic consultation records with current timestamps',
        fields: ['id', 'patient_id', 'provider_id', 'chief_complaint', 'symptoms', 'status', 'priority'],
        lastUpdated: new Date()
      },
      {
        name: 'mockMessages',
        type: 'static',
        count: 2,
        description: 'Static message records for testing',
        fields: ['id', 'consultation_id', 'sender_id', 'sender_type', 'content', 'is_read'],
        lastUpdated: new Date()
      },
      {
        name: 'mockOrders',
        type: 'static',
        count: 1,
        description: 'Static order records for testing',
        fields: ['id', 'patient_id', 'consultation_id', 'status', 'total_amount', 'shipping_address'],
        lastUpdated: new Date()
      }
    ];

    sources.forEach(source => {
      this.mockDataSources.set(source.name, {
        ...source,
        registeredAt: new Date()
      });
    });
  }

  /**
   * Track usage of a mock endpoint
   */
  static trackUsage(method, path, success = true) {
    const key = `${method}:${path}`;
    const endpoint = this.mockEndpoints.get(key);
    
    if (endpoint) {
      endpoint.usageCount++;
      endpoint.lastUsed = new Date();
      endpoint.lastSuccess = success;
    }

    // Track in usage stats
    const statsKey = `${method}:${path}`;
    if (!this.mockUsageStats.has(statsKey)) {
      this.mockUsageStats.set(statsKey, {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        firstUsed: new Date(),
        lastUsed: new Date()
      });
    }

    const stats = this.mockUsageStats.get(statsKey);
    stats.totalRequests++;
    if (success) {
      stats.successfulRequests++;
    } else {
      stats.failedRequests++;
    }
    stats.lastUsed = new Date();
  }

  /**
   * Track fallback usage
   */
  static trackFallback(originalPath, mockPath, trigger) {
    const fallback = this.mockFallbacks.get(originalPath);
    
    if (fallback) {
      fallback.usageCount++;
      fallback.lastUsed = new Date();
      fallback.lastTrigger = trigger;
    }

    console.log(`🔄 Fallback triggered: ${originalPath} -> ${mockPath} (${trigger})`);
  }

  /**
   * Get comprehensive mock data report
   */
  static getReport() {
    return {
      summary: {
        totalEndpoints: this.mockEndpoints.size,
        totalFallbacks: this.mockFallbacks.size,
        totalDataSources: this.mockDataSources.size,
        totalUsage: Array.from(this.mockUsageStats.values()).reduce((sum, stats) => sum + stats.totalRequests, 0),
        generatedAt: new Date()
      },
      endpoints: Array.from(this.mockEndpoints.entries()).map(([key, endpoint]) => ({
        key,
        ...endpoint
      })),
      fallbacks: Array.from(this.mockFallbacks.entries()).map(([key, fallback]) => ({
        originalPath: key,
        ...fallback
      })),
      dataSources: Array.from(this.mockDataSources.entries()).map(([key, source]) => ({
        name: key,
        ...source
      })),
      usageStats: Array.from(this.mockUsageStats.entries()).map(([key, stats]) => ({
        endpoint: key,
        ...stats,
        successRate: stats.totalRequests > 0 ? (stats.successfulRequests / stats.totalRequests * 100).toFixed(2) + '%' : '0%'
      }))
    };
  }

  /**
   * Get mock data health status
   */
  static getHealthStatus() {
    const totalRequests = Array.from(this.mockUsageStats.values()).reduce((sum, stats) => sum + stats.totalRequests, 0);
    const successfulRequests = Array.from(this.mockUsageStats.values()).reduce((sum, stats) => sum + stats.successfulRequests, 0);
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests * 100) : 100;

    return {
      status: successRate >= 95 ? 'healthy' : successRate >= 80 ? 'warning' : 'critical',
      successRate: successRate.toFixed(2) + '%',
      totalRequests,
      successfulRequests,
      failedRequests: totalRequests - successfulRequests,
      activeEndpoints: Array.from(this.mockEndpoints.values()).filter(e => e.usageCount > 0).length,
      activeFallbacks: Array.from(this.mockFallbacks.values()).filter(f => f.usageCount > 0).length,
      lastActivity: Math.max(
        ...Array.from(this.mockUsageStats.values()).map(s => s.lastUsed?.getTime() || 0)
      )
    };
  }

  /**
   * Identify all mock data in the system
   */
  static identifyAllMockData() {
    const identification = {
      backend: {
        services: [
          {
            file: 'backend/src/services/mock-data.service.js',
            type: 'Mock Data Service',
            description: 'Central service providing mock data for patients, providers, consultations, messages, and orders',
            exports: ['MockDataService'],
            methods: [
              'getPatients', 'getPatientById', 'getPatientByEmail',
              'getProviders', 'getProviderById', 'getAvailableProviders',
              'getConsultations', 'getConsultationById', 'getConsultationsWithProviderInfo',
              'getMessages', 'getUnreadMessagesCount',
              'getOrders', 'getOrderById',
              'getDashboardStats', 'getPatientStats', 'getProviderQueue'
            ]
          },
          {
            file: 'backend/src/services/mock-registry.service.js',
            type: 'Mock Registry Service',
            description: 'Registry and management system for tracking all mock data usage',
            exports: ['MockDataRegistry'],
            methods: ['initialize', 'trackUsage', 'trackFallback', 'getReport', 'getHealthStatus']
          }
        ],
        routes: [
          {
            file: 'backend/src/routes/mock-consultations.js',
            type: 'Mock API Routes',
            description: 'Mock consultation endpoints',
            endpoints: [
              'GET /api/mock/consultations/provider/queue',
              'GET /api/mock/consultations',
              'GET /api/mock/consultations/:id'
            ]
          },
          {
            file: 'backend/src/routes/mock-admin.js',
            type: 'Mock API Routes',
            description: 'Mock admin endpoints',
            endpoints: [
              'GET /api/mock/admin/dashboard',
              'GET /api/mock/admin/patients',
              'GET /api/mock/admin/providers'
            ]
          },
          {
            file: 'backend/src/routes/mock-messages.js',
            type: 'Mock API Routes',
            description: 'Mock messaging endpoints',
            endpoints: [
              'GET /api/mock/messages',
              'POST /api/mock/messages',
              'PATCH /api/mock/messages/:messageId/read',
              'GET /api/mock/messages/unread-count'
            ]
          },
          {
            file: 'backend/src/routes/mock-orders.js',
            type: 'Mock API Routes',
            description: 'Mock order management endpoints',
            endpoints: [
              'GET /api/mock/orders',
              'GET /api/mock/orders/:orderId',
              'POST /api/mock/orders',
              'PATCH /api/mock/orders/:orderId/status',
              'DELETE /api/mock/orders/:orderId'
            ]
          }
        ],
        integration: {
          file: 'backend/src/app.js',
          description: 'Mock routes integrated into main Express application',
          mountPoints: [
            '/api/mock/consultations',
            '/api/mock/admin',
            '/api/mock/messages',
            '/api/mock/orders'
          ]
        }
      },
      frontend: {
        apiClient: {
          file: 'frontend/src/lib/api.ts',
          type: 'API Client with Mock Fallback',
          description: 'Axios-based API client with automatic fallback to mock endpoints',
          features: [
            'Automatic fallback on 401/404/500/503 errors',
            'Mock endpoint mapping',
            'Mock data flagging (_isMockData)',
            'Console logging of fallback usage'
          ],
          fallbackMappings: {
            '/api/consultations/provider/queue': '/api/mock/consultations/provider/queue',
            '/api/consultations': '/api/mock/consultations',
            '/api/admin/dashboard': '/api/mock/admin/dashboard',
            '/api/admin/patients': '/api/mock/admin/patients',
            '/api/messages': '/api/mock/messages',
            '/api/orders': '/api/mock/orders'
          }
        },
        pages: {
          description: 'Frontend pages that may use mock data through API fallback',
          files: [
            'frontend/src/app/portal/consultations/page.tsx',
            'frontend/src/app/portal/dashboard/page.tsx',
            'frontend/src/app/portal/messages/page.tsx',
            'frontend/src/app/portal/orders/page.tsx',
            'frontend/src/app/portal/patients/page.tsx'
          ]
        }
      },
      dataStructures: {
        patients: {
          count: 3,
          fields: ['id', 'first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender'],
          sampleData: 'John Doe, Jane Smith, Bob Johnson'
        },
        providers: {
          count: 2,
          fields: ['id', 'first_name', 'last_name', 'email', 'license_number', 'specialties'],
          sampleData: 'Dr. Sarah Wilson, Dr. Michael Brown'
        },
        consultations: {
          count: 5,
          fields: ['id', 'patient_id', 'provider_id', 'chief_complaint', 'status', 'priority'],
          sampleData: 'Routine checkup, Weight management, Chest pain evaluation, Follow-up, Medication review'
        },
        messages: {
          count: 2,
          fields: ['id', 'consultation_id', 'sender_id', 'sender_type', 'content', 'is_read'],
          sampleData: 'Thank you messages, symptom reports'
        },
        orders: {
          count: 1,
          fields: ['id', 'patient_id', 'consultation_id', 'status', 'total_amount'],
          sampleData: 'Delivered order for $89.99'
        }
      }
    };

    return identification;
  }

  /**
   * Generate mock data documentation
   */
  static generateDocumentation() {
    const identification = this.identifyAllMockData();
    const report = this.getReport();
    const health = this.getHealthStatus();

    return {
      title: 'Mock Data System Documentation',
      generatedAt: new Date(),
      overview: {
        description: 'Comprehensive mock data system providing fallback functionality when database is unavailable',
        components: {
          backend: `${identification.backend.services.length} services, ${identification.backend.routes.length} route files`,
          frontend: '1 API client with automatic fallback',
          endpoints: `${report.summary.totalEndpoints} mock endpoints`,
          fallbacks: `${report.summary.totalFallbacks} fallback mappings`
        }
      },
      health,
      identification,
      report,
      recommendations: [
        'Monitor mock data usage through the registry service',
        'Update mock data timestamps regularly for realistic testing',
        'Add more diverse mock data for comprehensive testing',
        'Consider implementing mock data persistence for consistency',
        'Add mock data validation to ensure data integrity'
      ]
    };
  }
}

export default MockDataRegistry;