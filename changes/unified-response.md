Unified response and error handling refactor

This document records files updated to adopt unwrapped API responses and normalized error objects.

Contract
- Success: Interceptor unwraps { success: true, data } and returns data directly.
- Error: Throws normalized object { success: false, error, details, status, code, url, method }.

Files changed

1) frontend/src/lib/api.ts
- Old
  - Response interceptor returned AxiosResponse
  - Errors surfaced as AxiosError with err.response
- New
  - Success handler returns response.data or payload.data when payload.success === true
  - Error handler throws normalized error with shape above
  - normalizeAxiosError now sets code = data.code || err.code
  - Exported api helper get/post/put/delete return Promise<T> with unwrapped payloads

2) frontend/src/components/MessageChat.tsx (earlier in session)
- Old
  - Used response.data from api calls
- New
  - Uses unwrapped returns directly
  - Catches errors via err.error/err.details

3) frontend/src/app/portal/messages/page.tsx (earlier in session)
- Old
  - Referenced response.data
- New
  - Uses direct unwrapped data
  - UI error uses normalized err.error

4) frontend/src/app/patient/messages/page.tsx
- Old
  - conversations/messages/send relied on response.data
- New
  - Uses unwrapped data and normalized error logging

5) frontend/src/app/portal/providers/page.tsx
- Old
  - const response = await apiClient.providers.getAll(); const providersData = response.data || []
- New
  - const providersData = await api.get<any[]>('/api/providers')
  - catch: setError(err?.error || 'Failed to load providers')

6) frontend/src/app/portal/plans/page.tsx
- Old
  - const response = await apiClient.treatmentPlans.getByCondition(cond)
  - const plansData = response.data || []
- New
  - const plansData = await api.get<any[]>(`/api/treatment-plans/condition/${selectedCondition}`)
  - catch: setError(err?.error || 'Failed to load treatment plans')

7) frontend/src/app/portal/patients/page.tsx
- Old
  - const response = await apiClient.admin.getDashboard(); const patientsData = response.data?.patients || []
- New
  - const dashboard = await apiClient.admin.getDashboard(); const patientsData = (dashboard as any)?.patients || []
  - catch: setError(err?.error || 'Failed to load patients')

8) frontend/src/app/portal/orders/page.tsx
- Old
  - const response = await apiClient.orders.getAll(...); const ordersData = response.data || []
- New
  - const ordersDataRaw = await apiClient.orders.getAll(...); const ordersData = (ordersDataRaw as any) || []
  - catch: setError(err?.error || 'Failed to load orders')

9) frontend/src/app/patient/login/page.tsx
- Old
  - err.response?.data?.code and err.response?.data?.error checks
- New
  - Use normalized err.code and err.error

10) frontend/src/app/patient/dashboard/page.tsx
- Old
  - Parallel fetches returned { data: ... } wrappers; used response.data.data
- New
  - Parallel fetches consume unwrapped returns directly; errors normalized
  - Refresh measurements via api.get<any[]>('/api/patients/me/measurements', { params: { limit: 5 } })

11) frontend/src/app/patient/refill-checkin/page.tsx
- Old
  - response.data usage for get/post
- New
  - Use api.get/api.post unwrapped results; check requires_consultation on result; normalized error logs

12) frontend/src/app/patient/consultations/[id]/page.tsx
- Old
  - Checked response.data.data
- New
  - Use unwrapped data; normalized error message

13) frontend/src/app/patient/checkout/page.tsx
- Old
  - Used response.data.success/response.data.orderId
- New
  - Use unwrapped result; if result.success === false throw; else rely on result.orderId; normalized toasts

Notes
- Several other files were previously refactored in this initiative (MessageChat and portal messages page). Future pages should access API results directly and display errors using err.error (append err.details when helpful).
