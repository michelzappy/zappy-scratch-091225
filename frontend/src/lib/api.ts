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
          
          // If refresh failed, logout and redirect
          await authService.logout();
        }
        
        return Promise.reject(error);
      }
    );
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
  };

  // Patient endpoints
  patients = {
    getProfile: (id?: string) => {
      // If no ID provided or it's the current user, use /me endpoint
      return this.client.get(id && id !== 'me' ? `/api/patients/${id}` : '/api/patients/me');
    },
    updateProfile: (id: string, data: any) => {
      // Use /me endpoint for current user profile updates
      return this.client.put('/api/patients/me', data);
    },
    getConsultations: (id?: string) => {
      // Use /me/consultations for current user's consultations
      return this.client.get('/api/patients/me/consultations');
    },
    getStats: () => this.client.get('/api/patients/me/stats'),
    getPrograms: () => this.client.get('/api/patients/me/programs'),
    getOrders: (params?: any) => this.client.get('/api/patients/me/orders', { params }),
    getMeasurements: (params?: any) => this.client.get('/api/patients/me/measurements', { params }),
    logMeasurement: (data: any) => this.client.post('/api/patients/me/measurements', data),
    register: (data: any) => this.client.post('/api/patients/register', data),
    login: (data: any) => this.client.post('/api/patients/login', data),
  };

  // Provider endpoints
  providers = {
    getAll: () => this.client.get('/api/providers'),
    getById: (id: string) => this.client.get(`/api/providers/${id}`),
    getConsultations: (id: string) => this.client.get(`/api/providers/${id}/consultations`),
  };

  // Admin endpoints
  admin = {
    getDashboard: () => this.client.get('/api/admin/dashboard'),
    getAuditLogs: () => this.client.get('/api/admin/audit-logs'),
    getMetrics: () => this.client.get('/api/admin/metrics'),
    getPendingConsultations: () => this.client.get('/api/admin/consultations/pending'),
    getPatients: (params?: any) => this.client.get('/api/admin/patients', { params }),
    getProviders: () => this.client.get('/api/admin/providers'),
    getUsers: () => this.client.get('/api/admin/users'),
    getOrdersStats: () => this.client.get('/api/admin/orders/stats'),
    getAnalyticsSummary: () => this.client.get('/api/admin/analytics/summary'),
    getHealth: () => this.client.get('/api/admin/health'),
    getPatientFull: (id: string) => this.client.get(`/api/admin/patients/${id}/full`),
    getPatientStatistics: (id: string) => this.client.get(`/api/admin/patients/${id}/statistics`),
  };

  // AI Consultation endpoints
  aiConsultation = {
    getStatus: () => this.client.get('/api/ai-consultation/status'),
  };

  // File management endpoints
  files = {
    upload: (data: FormData) => this.client.post('/api/files/upload', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    download: (id: string) => this.client.get(`/api/files/${id}/download`, {
      responseType: 'blob',
    }),
    delete: (id: string) => this.client.delete(`/api/files/${id}`),
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
