import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { authService } from './auth';

// Extend the Axios request config to include _retry flag
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

class ApiClient {
  public client: AxiosInstance;

  constructor() {
    // Resolve base URL from Next.js environment variables
    const resolvedBaseURL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;

    this.client = axios.create({
      baseURL: resolvedBaseURL || 'http://localhost:3001',
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

    // Response interceptor to unify success payloads and normalize errors
    this.client.interceptors.response.use(
      (response) => {
        // If explicitly requesting a blob/stream, just return the raw data
        if (response.config?.responseType === 'blob') {
          return response.data;
        }

        const payload = response?.data;
        if (payload && typeof payload === 'object' && 'success' in payload) {
          // Always unwrap { success: true, data }
          // If success !== true, return payload as-is (some flows like 2FA hints)
          return (payload as any).success ? (payload as any).data : payload;
        }

        // Default: return response.data directly
        return payload;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as ExtendedAxiosRequestConfig;

        // Handle 401s once with a refresh flow
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;

          // Skip refresh loop for logout route
          if (originalRequest.url?.includes('/api/auth/logout')) {
            return Promise.reject(normalizeAxiosError(error));
          }

          const refreshed = await authService.refreshToken();
          if (refreshed) {
            originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`;
            return this.client.request(originalRequest);
          }

          // If refresh failed, clear local auth state and redirect
          if (typeof window !== 'undefined') {
            localStorage.removeItem('telehealth_access_token');
            localStorage.removeItem('telehealth_refresh_token');
            localStorage.removeItem('telehealth_user');
            window.location.href = '/';
          }
        }

        // Reject with normalized error shape
        return Promise.reject(normalizeAxiosError(error));
      }
    );
  }

  // Auth endpoints
  auth = {
    // Generic register endpoint for public registration
    register: (data: any) => this.client.post('/api/auth/register', data),
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

  // Internal helper for fallback attempts
  private async requestWithFallback<T>(
    attempts: Array<() => Promise<T>>
  ): Promise<T> {
    let lastError: unknown;
    for (const attempt of attempts) {
      try {
        return await attempt();
      } catch (err: any) {
        lastError = err;
        // Only fall back on 404/405/501 style misses; rethrow on auth or server errors
        const status = err?.status ?? err?.response?.status;
        if (status && status >= 400 && status !== 404 && status !== 405 && status !== 501) {
          throw err;
        }
      }
    }
    // Exhausted attempts
    throw lastError as any;
  }

  // Message endpoints (consultation-first with legacy fallback)
  messages = {
    // Prefer modern consultation-scoped route, fallback to legacy variant
    getByConsultation: (consultationId: string, params?: any) =>
      this.requestWithFallback([
        () => this.client.get(`/api/consultations/${consultationId}/messages`, { params }),
        () => this.client.get(`/api/messages/consultation/${consultationId}`, { params }),
      ]),

    // Send message to a consultation thread
    sendToConsultation: (consultationId: string, data: any) =>
      this.requestWithFallback([
        () => this.client.post(`/api/consultations/${consultationId}/messages`, data),
        () => this.client.post(`/api/messages/consultation/${consultationId}`, data),
      ]),

    // NEW (mark conversation as read instead):
    markConversationRead: (conversationId: string) =>
    apiClient.client.post(`/api/messages/conversations/${conversationId}/read`),

    // Generic create with consultation-first approach when consultationId available
    create: (data: any) =>
      data.consultation_id
        ? this.requestWithFallback([
            () => this.client.post(`/api/consultations/${data.consultation_id}/messages`, data),
            () => this.client.post(`/api/messages/consultation/${data.consultation_id}`, data),
          ])
        : this.requestWithFallback([
            () => this.client.post('/api/messages', data),
          ]),

    // Multipart send with consultation-first approach when consultationId available
    send: (data: FormData) => {
      const consultationId = data.get('consultation_id') || data.get('consultationId');
      return consultationId
        ? this.requestWithFallback([
            () => this.client.post(`/api/consultations/${consultationId}/messages`, data, {
              headers: { 'Content-Type': 'multipart/form-data' },
            }),
            () => this.client.post(`/api/messages/consultation/${consultationId}`, data, {
              headers: { 'Content-Type': 'multipart/form-data' },
            }),
          ])
        : this.requestWithFallback([
            () => this.client.post('/api/messages', data, {
              headers: { 'Content-Type': 'multipart/form-data' },
            }),
          ]);
    },

    // Mark consultation messages as read
    markAsRead: (consultationId: string) =>
      this.requestWithFallback([
        () => this.client.post(`/api/consultations/${consultationId}/messages/read`),
        () => this.client.post(`/api/messages/consultation/${consultationId}/read`),
      ]),

    // Compose with consultation-first approach when consultationId available
    compose: (data: any) =>
      data.consultation_id
        ? this.requestWithFallback([
            () => this.client.post(`/api/consultations/${data.consultation_id}/messages`, data),
            () => this.client.post(`/api/messages/consultation/${data.consultation_id}`, data),
          ])
        : this.client.post('/api/messages/compose', data),

    // Admin/portal endpoints - keep for non-consultation messaging
    getUnreadCount: () => this.client.get('/api/messages/unread-count'),
    getRecipients: () => this.client.get('/api/messages/recipients'),
    // ---- Conversations-first API for Inbox ----
    /** List the user's conversations (Inbox) */
    getMyConversations: () => this.client.get('/api/messages/conversations'),   

    /** List messages in a specific conversation thread */
    getConversationMessages: (conversationId: string, params?: any) =>
      this.client.get(`/api/messages/conversations/${conversationId}/messages`, { params }),    

    /** Send a message to a specific conversation */
    sendMessage: (conversationId: string, data: any) =>
      this.client.post(`/api/messages/conversations/${conversationId}/messages`, data),   

    /** @deprecated: Inbox must use conversations API; this is kept only to catch stragglers */
    getAll: (_consultationId?: string, _params?: any) => {
      if (process.env.NODE_ENV !== 'production') {
        // Make misuse loud during dev
        // eslint-disable-next-line no-console
        console.warn('api.messages.getAll() is deprecated. Use getMyConversations().');
      }
      // Return conversations to avoid 404s if something still calls it.
      return this.client.get('/api/messages/conversations');
    },    

    /** @deprecated: use getConversationMessages(conversationId) */
    getById: (_id: string) => {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('api.messages.getById(id) is deprecated. Use getConversationMessages(conversationId).');
      }
      // Throw to force call sites to migrate (safer than silently returning wrong shape)
      return Promise.reject({ success: false, error: 'Route removed. Use conversations API.' });
    },    

    /** @deprecated: use sendMessage(conversationId, data) */
    // markRead legacy signature removed to avoid duplicate key; use the unified version below
    markRead: (id: string, consultationId?: string) => 
      consultationId
        ? this.requestWithFallback([
            () => this.client.post(`/api/consultations/${consultationId}/messages/${id}/read`),
            () => this.client.post(`/api/messages/${id}/read`),
          ])
        : this.requestWithFallback([
            () => this.client.post(`/api/messages/${id}/read`),
          ]),

    // Note: conversations endpoints are defined above; avoid duplicate keys here
  };

  // Patient endpoints
  patients = {
    getAll: (params?: any) => this.client.get('/api/patients', { params }),
    create: (data: any) => this.client.post('/api/patients', data),
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
    create: (data: any) => this.client.post('/api/providers', data),
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
    generate: (data: any) => this.client.post('/api/ai-consultation/generate', data),
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

  // Pharmacies endpoints (for selection lists)
  pharmacies = {
    getAll: (params?: any) => this.client.get('/api/pharmacies', { params }),
  };

  // Check-in Reviews endpoints
  checkinReviews = {
    getAll: () => this.client.get('/api/checkin-reviews'),
    update: (id: string, data: any) => this.client.patch(`/api/checkin-reviews/${id}`, data),
  };
}

export const apiClient = new ApiClient();

// Export a simpler api object for easier use
export const api = {
  get: <T = any>(url: string, config?: any): Promise<T> => apiClient.client.get(url, config) as unknown as Promise<T>,
  post: <T = any>(url: string, data?: any, config?: any): Promise<T> => apiClient.client.post(url, data, config) as unknown as Promise<T>,
  put: <T = any>(url: string, data?: any, config?: any): Promise<T> => apiClient.client.put(url, data, config) as unknown as Promise<T>,
  delete: <T = any>(url: string, config?: any): Promise<T> => apiClient.client.delete(url, config) as unknown as Promise<T>,
  // Direct access to client for complex operations
  client: apiClient.client,
};

// Helper to normalize Axios errors into { success:false, error, details, status, code, url, method }
function normalizeAxiosError(err: AxiosError) {
  const status = err.response?.status;
  // Try to derive a meaningful message
  const data: any = err.response?.data;
  const message = (data?.error as string)
    || (data?.message as string)
    || (Array.isArray(data?.errors) ? data.errors.join(', ') : undefined)
    || err.message
    || 'Request failed';
  const details = data?.details ?? data?.errors ?? data ?? undefined;

  return {
    success: false as const,
    error: message,
    details,
    status,
    code: (data?.code as string) ?? (err as any)?.code,
    url: err.config?.url,
    method: err.config?.method,
  };
}
