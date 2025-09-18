import axios, { AxiosInstance, AxiosError } from 'axios';
import { authService } from './auth';

class ApiClient {
  public client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        // Get access token from our auth service
        const accessToken = authService.getAccessToken();
        
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Try to refresh token
          const refreshed = await authService.refreshToken();
          
          if (refreshed && error.config) {
            // Retry the original request with new token
            error.config.headers.Authorization = `Bearer ${refreshed.accessToken}`;
            return this.client.request(error.config);
          }
          
          // If refresh failed, try mock endpoints as fallback
          const mockResponse = await this.tryMockFallback(error.config, error);
          if (mockResponse) {
            return mockResponse;
          }
          
          // If no mock fallback available, logout and redirect
          await authService.logout();
        }
        
        // For other errors (404, 500, etc.), try mock fallback
        if (error.response?.status && [404, 500, 503].includes(error.response.status)) {
          const mockResponse = await this.tryMockFallback(error.config, error);
          if (mockResponse) {
            return mockResponse;
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Mock fallback method
  private async tryMockFallback(config: any, originalError?: AxiosError): Promise<any> {
    if (!config || !config.url) return null;

    try {
      // Map regular API endpoints to mock endpoints
      const mockMappings: { [key: string]: string } = {
        '/api/consultations/provider/queue': '/api/mock/consultations/provider/queue',
        '/api/consultations': '/api/mock/consultations',
        '/api/admin/dashboard': '/api/mock/admin/dashboard',
        '/api/admin/patients': '/api/mock/admin/patients',
        '/api/messages': '/api/mock/messages',
        '/api/orders': '/api/mock/orders',
      };

      // Check if we have a mock mapping for this endpoint
      let mockUrl = null;
      for (const [originalPath, mockPath] of Object.entries(mockMappings)) {
        if (config.url.includes(originalPath)) {
          mockUrl = mockPath;
          break;
        }
      }

      if (!mockUrl) return null;

      console.log(`🔄 Falling back to mock endpoint: ${mockUrl} (original: ${config.url})`);

      // Track fallback usage
      try {
        await this.client.post('/api/mock-management/track-fallback', {
          originalPath: config.url,
          mockPath: mockUrl,
          trigger: originalError?.response?.status?.toString() || 'unknown'
        });
      } catch (trackError: any) {
        // Silently fail tracking - don't break the fallback
        console.warn('Failed to track fallback usage:', trackError?.message || 'Unknown error');
      }

      // Make request to mock endpoint without authentication
      const mockConfig = {
        ...config,
        url: mockUrl,
        headers: {
          ...config.headers,
          Authorization: undefined, // Remove auth header for mock endpoints
        },
      };

      const response = await this.client.request(mockConfig);
      
      // Add a flag to indicate this is mock data
      if (response.data && typeof response.data === 'object') {
        response.data._isMockData = true;
      }

      return response;
    } catch (mockError) {
      console.warn('Mock fallback also failed:', mockError);
      return null;
    }
  }

  // Auth endpoints
  auth = {
    registerPatient: (data: any) => this.client.post('/api/auth/register/patient', data),
    login: (data: any) => this.client.post('/api/auth/login', data),
    getProfile: () => this.client.get('/api/auth/profile'),
  };

  // Consultation endpoints
  consultations = {
    create: (data: FormData) => this.client.post('/api/consultations', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    getById: (id: string) => this.client.get(`/api/consultations/${id}`),
    getPatientConsultations: (patientId: string, params?: any) => 
      this.client.get(`/api/consultations/patient/${patientId}`, { params }),
    getProviderQueue: (params?: any) => 
      this.client.get('/api/consultations/provider/queue', { params }),
    accept: (id: string) => this.client.post(`/api/consultations/${id}/accept`),
    complete: (id: string, data: any) => this.client.post(`/api/consultations/${id}/complete`, data),
  };

  // Message endpoints
  messages = {
    send: (data: FormData) => this.client.post('/api/messages', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    getByConsultation: (consultationId: string, params?: any) =>
      this.client.get(`/api/messages/consultation/${consultationId}`, { params }),
    markAsRead: (consultationId: string) =>
      this.client.post(`/api/messages/consultation/${consultationId}/read`),
    getUnreadCount: () => this.client.get('/api/messages/unread-count'),
    // Patient message endpoints
    getMyConversations: () => this.client.get('/api/messages/conversations'),
    getConversationMessages: (conversationId: string) =>
      this.client.get(`/api/messages/conversations/${conversationId}/messages`),
    sendMessage: (conversationId: string, data: any) =>
      this.client.post(`/api/messages/conversations/${conversationId}/messages`, data),
    // Portal message endpoints
    getAll: (params?: any) => this.client.get('/api/messages', { params }),
    getById: (id: string) => this.client.get(`/api/messages/${id}`),
    markRead: (id: string) => this.client.post(`/api/messages/${id}/read`),
    compose: (data: any) => this.client.post('/api/messages/compose', data),
  };

  // Patient endpoints
  patients = {
    getProfile: (id: string) => this.client.get(`/api/patients/${id}`),
    updateProfile: (id: string, data: any) => this.client.put(`/api/patients/${id}`, data),
    getConsultations: (id: string) => this.client.get(`/api/patients/${id}/consultations`),
    // Dashboard endpoints
    getMe: () => this.client.get('/api/patients/me'),
    getMyPrograms: () => this.client.get('/api/patients/me/programs'),
    getMyOrders: (params?: any) => this.client.get('/api/patients/me/orders', { params }),
    getMeasurements: (params?: any) => this.client.get('/api/patients/me/measurements', { params }),
    getMyStats: () => this.client.get('/api/patients/me/stats'),
    logMeasurement: (data: any) => this.client.post('/api/patients/me/measurements', data),
  };

  // Provider endpoints
  providers = {
    getAll: () => this.client.get('/api/providers'),
    getById: (id: string) => this.client.get(`/api/providers/${id}`),
    getConsultations: (id: string) => this.client.get(`/api/providers/${id}/consultations`),
  };

  // File endpoints
  files = {
    upload: (data: FormData) => this.client.post('/api/files/upload', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    download: (id: string) => this.client.get(`/api/files/${id}/download`, {
      responseType: 'blob',
    }),
  };

  // Admin endpoints
  admin = {
    getDashboard: () => this.client.get('/api/admin/dashboard'),
    getAuditLogs: () => this.client.get('/api/admin/audit-logs'),
  };

  // Check-in endpoints
  checkins = {
    getAll: () => this.client.get('/api/checkins'),
    getById: (id: string) => this.client.get(`/api/checkins/${id}`),
    getByPatient: (patientId: string) => this.client.get(`/api/checkins/patient/${patientId}`),
    getPending: () => this.client.get('/api/checkins/pending'),
    create: (data: any) => this.client.post('/api/checkins', data),
    update: (id: string, data: any) => this.client.put(`/api/checkins/${id}`, data),
    complete: (id: string, data: any) => this.client.post(`/api/checkins/${id}/complete`, data),
    requestMoreInfo: (id: string, message: string) => this.client.post(`/api/checkins/${id}/request-info`, { message }),
  };

  // Order endpoints
  orders = {
    getAll: (params?: any) => this.client.get('/api/orders', { params }),
    getById: (id: string) => this.client.get(`/api/orders/${id}`),
    create: (data: any) => this.client.post('/api/orders', data),
    update: (id: string, data: any) => this.client.put(`/api/orders/${id}`, data),
    updateStatus: (id: string, status: string) => this.client.patch(`/api/orders/${id}/status`, { status }),
    cancel: (id: string) => this.client.post(`/api/orders/${id}/cancel`),
    getByPatient: (patientId: string) => this.client.get(`/api/orders/patient/${patientId}`),
  };

  // Treatment plan endpoints
  treatmentPlans = {
    getAll: (params?: any) => this.client.get('/api/treatment-plans', { params }),
    getById: (id: string) => this.client.get(`/api/treatment-plans/${id}`),
    getByCondition: (condition: string) => this.client.get(`/api/treatment-plans/condition/${condition}`),
    create: (data: any) => this.client.post('/api/treatment-plans', data),
    update: (id: string, data: any) => this.client.put(`/api/treatment-plans/${id}`, data),
    delete: (id: string) => this.client.delete(`/api/treatment-plans/${id}`),
  };
}

export const apiClient = new ApiClient();

// Export a simpler api object for easier use
export const api = {
  get: (url: string, config?: any) => apiClient.client.get(url, config),
  post: (url: string, data?: any, config?: any) => apiClient.client.post(url, data, config),
  put: (url: string, data?: any, config?: any) => apiClient.client.put(url, data, config),
  delete: (url: string, config?: any) => apiClient.client.delete(url, config),
  // Direct access to client for complex operations
  client: apiClient.client,
};
