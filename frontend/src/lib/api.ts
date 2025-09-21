import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { authService } from './auth';

// Extend the Axios request config to include _retry flag
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

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
        const originalRequest = error.config as ExtendedAxiosRequestConfig;
        
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          // Mark this request as retried to prevent infinite loops
          originalRequest._retry = true;
          
          // Don't try to refresh if this is already a logout request
          if (originalRequest.url?.includes('/auth/logout')) {
            return Promise.reject(error);
          }
          
          // Try to refresh token
          const refreshed = await authService.refreshToken();
          
          if (refreshed) {
            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`;
            return this.client.request(originalRequest);
          }
          
          // If refresh failed, clear auth locally to prevent logout API loop
          // Don't call authService.logout() as it makes API calls that trigger this interceptor
          if (typeof window !== 'undefined') {
            localStorage.removeItem('telehealth_access_token');
            localStorage.removeItem('telehealth_refresh_token');
            localStorage.removeItem('telehealth_user');
            // Redirect to home page
            window.location.href = '/';
          }
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
    // Dashboard endpoints - keeping backward compatibility
    getMe: () => this.client.get('/api/patients/me'),
    getMyPrograms: () => this.client.get('/api/patients/me/programs'),
    getMyOrders: (params?: any) => this.client.get('/api/patients/me/orders', { params }),
    getMyStats: () => this.client.get('/api/patients/me/stats'),
    // Modern endpoint names
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
