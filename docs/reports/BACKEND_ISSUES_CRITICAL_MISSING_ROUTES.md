# CRITICAL: Missing Backend API Routes

## Overview
The frontend is calling 12 HIGH priority API routes that don't exist in the backend, causing application failures.

## Status: 🔴 CRITICAL - Application Breaking

---

## Group 1: Authentication Routes
**Priority**: URGENT - Core login functionality broken

### Issues:
- **POST /api/auth/login** - Frontend calls this but route doesn't exist
  - Location: `frontend/src/lib/api.ts:59`
  - Impact: Users cannot log in
  - Backend file: `backend/src/routes/auth.js` (needs implementation)

- **GET /api/auth/profile** - Frontend calls this but route doesn't exist
  - Location: `frontend/src/lib/api.ts:60`
  - Impact: User profile data unavailable
  - Backend file: `backend/src/routes/auth.js` (needs implementation)

### Implementation Plan:
1. Add POST `/api/auth/login` endpoint in `backend/src/routes/auth.js`
2. Add GET `/api/auth/profile` endpoint in `backend/src/routes/auth.js`
3. Update frontend API client to match backend routes
4. Test authentication flow end-to-end

---

## Group 2: Admin Dashboard Routes
**Priority**: HIGH - Admin portal non-functional

### Issues:
- **GET /api/admin/dashboard** - Frontend calls this but route doesn't exist
  - Location: `frontend/src/lib/api.ts:115`
  - Impact: Admin dashboard empty/broken
  - Backend file: `backend/src/routes/admin.js` (needs implementation)

- **GET /api/admin/audit-logs** - Frontend calls this but route doesn't exist
  - Location: `frontend/src/lib/api.ts:116`
  - Impact: Audit logging unavailable
  - Backend file: `backend/src/routes/admin.js` (needs implementation)

### Implementation Plan:
1. Add GET `/api/admin/dashboard` endpoint with metrics aggregation
2. Add GET `/api/admin/audit-logs` endpoint with filtering/pagination
3. Connect to existing admin service layer
4. Test admin portal functionality

---

## Group 3: Consultation Management Routes
**Priority**: HIGH - Core medical functionality broken

### Issues:
- **GET /api/consultations/patient/:patientId** - Frontend calls this but route doesn't exist
  - Location: `frontend/src/lib/api.ts:70`
  - Impact: Patient consultation history unavailable
  - Backend file: `backend/src/routes/consultations.js` (needs implementation)

- **GET /api/consultations/provider/queue** - Frontend calls this but route doesn't exist
  - Location: `frontend/src/lib/api.ts:72`
  - Impact: Provider queue management broken
  - Backend file: `backend/src/routes/consultations.js` (needs implementation)

### Implementation Plan:
1. Add patient-specific consultation endpoint
2. Add provider queue management endpoint
3. Implement proper filtering and sorting
4. Test consultation workflows

---

## Group 4: Patient Management Routes
**Priority**: HIGH - Patient data access broken

### Issues:
- **GET /api/patients/:id/consultations** - Frontend calls this but route doesn't exist
  - Location: `frontend/src/lib/api.ts:93`
  - Impact: Patient consultation history unavailable
  - Backend file: `backend/src/routes/patients.js` (needs implementation)

### Implementation Plan:
1. Add patient consultation history endpoint
2. Include related prescriptions and orders
3. Implement proper authorization checks
4. Test patient data access

---

## Group 5: Provider Management Routes
**Priority**: HIGH - Provider functionality broken

### Issues:
- **GET /api/providers** - Frontend calls this but route doesn't exist
  - Location: `frontend/src/lib/api.ts:98`
  - Impact: Provider listing unavailable
  - Backend file: `backend/src/routes/providers.js` (needs implementation)

- **GET /api/providers/:id** - Frontend calls this but route doesn't exist
  - Location: `frontend/src/lib/api.ts:99`
  - Impact: Provider details unavailable
  - Backend file: `backend/src/routes/providers.js` (needs implementation)

- **GET /api/providers/:id/consultations** - Frontend calls this but route doesn't exist
  - Location: `frontend/src/lib/api.ts:100`
  - Impact: Provider consultation history unavailable
  - Backend file: `backend/src/routes/providers.js` (needs implementation)

### Implementation Plan:
1. Add provider listing endpoint with filtering
2. Add provider details endpoint
3. Add provider consultation history endpoint
4. Test provider management workflows

---

## Group 6: File Management Routes
**Priority**: HIGH - File operations broken

### Issues:
- **GET /api/files/:id/download** - Frontend calls this but route doesn't exist
  - Location: `frontend/src/lib/api.ts:108`
  - Impact: File downloads broken
  - Backend file: `backend/src/routes/files.js` (needs implementation)

### Implementation Plan:
1. Add file download endpoint with security checks
2. Implement proper file streaming
3. Add access control and audit logging
4. Test file operations

---

## Group 7: Messaging Routes
**Priority**: HIGH - Communication features broken

### Issues:
- **GET /api/messages/unread-count** - Frontend calls this but route doesn't exist
  - Location: `frontend/src/lib/api.ts:86`
  - Impact: Unread message indicators broken
  - Backend file: `backend/src/routes/messages.js` (needs implementation)

### Implementation Plan:
1. Add unread message count endpoint
2. Implement real-time updates via WebSocket
3. Add proper user authorization
4. Test messaging functionality

---

## Next Steps

### Immediate Actions (This Week):
1. **Authentication Routes** - Fix login functionality first
2. **Admin Dashboard Routes** - Enable admin portal
3. **Consultation Routes** - Core medical functionality

### Short Term (Next Week):
4. **Patient/Provider Routes** - Complete data access
5. **File/Messaging Routes** - Support features

### Testing Strategy:
- Unit tests for each new endpoint
- Integration tests for complete workflows
- Frontend-backend integration testing
- Load testing for critical paths

---

## Dependencies
- Database schema must be finalized
- Authentication middleware must be working
- Service layer implementations needed
- Frontend API client may need updates

## Estimated Effort
- **Total**: ~40-60 hours
- **Per Group**: 6-10 hours each
- **Critical Path**: Authentication → Admin → Consultations