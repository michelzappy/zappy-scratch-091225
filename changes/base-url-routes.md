# Base URL and Routes Changes

This document lists all changes made to align API routes with the centralized client, migrate to /api/auth, prefer consultation-scoped messages, and use environment-based base URLs.

Note: Line numbers are approximate and based on the pre-change files referenced in the audit document.

## frontend/src/lib/api.ts

- Lines: constructor baseURL
  - Old: `baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'`
  - New: `baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:3001'`

- Lines: interceptor 401 logout guard
  - Old: `originalRequest.url?.includes('/auth/logout')`
  - New: `originalRequest.url?.includes('/api/auth/logout')`

- Lines: Auth endpoints
  - Old: no generic register method
  - New: `register: (data) => this.client.post('/api/auth/register', data)`

- Lines: Messages endpoints (multiple)
  - Old: legacy-only endpoints under `/api/messages` and `/api/messages/consultation/:id`
  - New: consultation-first methods with fallback:
    - `getByConsultation` prefers `/api/consultations/:id/messages`, falls back to legacy
    - `sendToConsultation` prefers `/api/consultations/:id/messages`, falls back to legacy `/api/messages/send` and `/api/messages`
    - Added `getRecipients()`

- Lines: Added helpers used by pages
  - New: `patients.getAll()`, `patients.create()`, `providers.create()`, `pharmacies.getAll()`, `aiConsultation.generate()`, `checkinReviews.getAll()/update()`

## frontend/src/components/MessageChat.tsx

- Lines ~100 (fetch messages)
  - Old: `fetch(`/api/messages/consultation/${consultationId}`, ...)`
  - New: `apiClient.messages.getByConsultation(consultationId)`

- Lines ~138, ~229 (send message)
  - Old: `fetch('/api/messages/send', { method: 'POST', body: { consultation_id, ... } })`
  - New: `apiClient.messages.sendToConsultation(consultationId, { content, sender_type, ... })`

- Line ~217 (file upload)
  - Old: `fetch('/api/files/upload', { method: 'POST', body: formData })`
  - New: `apiClient.files.upload(formData)` then `apiClient.messages.sendToConsultation(consultationId, { attachments: [...] })`

## frontend/src/app/portal/patients/new/page.tsx

- Lines ~69 (create patient)
  - Old: `fetch('/api/patients', { method: 'POST', ... })`
  - New: `apiClient.patients.create(formData)`

## frontend/src/app/portal/providers/new/page.tsx

- Lines ~98 (create provider)
  - Old: `fetch('/api/providers', { method: 'POST', ... })`
  - New: `apiClient.providers.create(formData)`

## frontend/src/app/portal/orders/new/page.tsx

- Lines ~52 (load patients)
  - Old: `fetch('/api/patients')`
  - New: `apiClient.patients.getAll()`

- Lines ~74 (load pharmacies)
  - Old: `fetch('/api/pharmacies')`
  - New: `apiClient.pharmacies.getAll()`

- Lines ~100 (create order)
  - Old: `fetch('/api/orders', { method: 'POST', ... })`
  - New: `apiClient.orders.create(formData)`

## frontend/src/app/portal/consultation/[id]/page.tsx

- Lines ~128 (AI consultation)
  - Old: `fetch('/api/ai-consultation/generate', { method: 'POST', ... })`
  - New: `apiClient.aiConsultation.generate({ ... })`

## frontend/src/app/portal/checkin-reviews/page.tsx

- Lines ~41 (fetch reviews)
  - Old: `fetch('/api/checkin-reviews')`
  - New: `apiClient.checkinReviews.getAll()`

- Lines ~115 (update review)
  - Old: `fetch(`/api/checkin-reviews/${reviewId}`, { method: 'PATCH', ... })`
  - New: `apiClient.checkinReviews.update(reviewId, { status })`

## frontend/src/app/portal/messages/compose/page.tsx

- Lines ~74 (get recipients)
  - Old: `fetch('/api/messages/recipients')`
  - New: `apiClient.messages.getRecipients()`

- Lines ~120 (send composed message)
  - Old: `fetch('/api/messages', { method: 'POST', ... })`
  - New: `apiClient.messages.create(messageData)`

## frontend/src/app/patient/register/page.tsx

- Lines ~39 (patient registration)
  - Old: `fetch('/api/auth/register', { method: 'POST', ... })`
  - New: `apiClient.auth.register({ ... })`

## Not changed but noted

- Pharmacy partner URLs in `frontend/src/app/portal/pharmacy/page.tsx` are mock/external and remain as-is; consider moving to configuration if they become real API calls.

---

Environment base URL guidance applied to centralized client:
- Next.js: set `NEXT_PUBLIC_API_BASE_URL`
- Vite: set `VITE_API_BASE_URL`
- Legacy fallback: `NEXT_PUBLIC_API_URL` still supported
