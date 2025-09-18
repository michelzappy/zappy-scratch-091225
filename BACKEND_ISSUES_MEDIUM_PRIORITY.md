# MEDIUM Priority Backend Issues

## Overview
These are medium priority backend issues that need attention but don't break core functionality.

## Status: 🟡 MEDIUM - Functionality gaps and improvements needed

---

## Group 1: File Management Implementation
**Priority**: MEDIUM - File operations need production logic

### Issues:
- **Placeholder implementation in API route** (`backend/src/routes/files.js:14`)
  - Current: Returns placeholder response
  - Needed: Production file upload logic with S3/storage integration
  - Impact: File uploads don't work properly

- **Placeholder implementation in API route** (`backend/src/routes/files.js:25`)
  - Current: Returns placeholder response  
  - Needed: Production file retrieval logic
  - Impact: File downloads/retrieval broken

### Implementation Plan:
1. **File Upload Endpoint**:
   ```javascript
   // POST /api/files/upload
   - Implement multipart file handling
   - Add file type validation
   - Add virus scanning
   - Integrate with S3 or local storage
   - Generate secure file URLs
   - Add metadata tracking
   ```

2. **File Retrieval Endpoint**:
   ```javascript
   // GET /api/files/:id
   - Implement secure file serving
   - Add access control checks
   - Support range requests for large files
   - Add download tracking/audit logs
   ```

3. **Security Considerations**:
   - File type whitelist/blacklist
   - Size limits per file type
   - User quota management
   - Secure file naming to prevent path traversal

### Estimated Effort: 12-16 hours

---

## Group 2: Database Integrity Issues
**Priority**: MEDIUM - Data consistency and referential integrity

### Issues:
- **user_sessions table lacks foreign key constraint** (`database/init.sql:99`)
  - Current: `user_id` field has no foreign key
  - Needed: Connect to patients/providers table
  - Impact: Orphaned sessions, no referential integrity

- **Seed patient records in production schema** (`database/init.sql:139`)
  - Current: Hard-coded test patients in init.sql
  - Needed: Remove test data from production schema
  - Impact: Test data leakage to production

### Implementation Plan:
1. **Fix Foreign Key Constraints**:
   ```sql
   -- Add foreign key to user_sessions
   ALTER TABLE user_sessions 
   ADD CONSTRAINT fk_user_sessions_user_id 
   FOREIGN KEY (user_id) REFERENCES patients(id) ON DELETE CASCADE;
   
   -- Or create a unified users table if needed
   ```

2. **Clean Production Schema**:
   ```sql
   -- Remove test data from init.sql
   -- Move to separate seed files for development only
   -- Ensure production schema is clean
   ```

3. **Database Migration**:
   - Create migration script for foreign key addition
   - Test with existing data
   - Plan for zero-downtime deployment

### Estimated Effort: 6-8 hours

---

## Group 3: Security & Webhook Validation
**Priority**: MEDIUM - Security improvements needed

### Issues:
- **Webhook signature validation missing** (`backend/src/routes/webhooks.js:11`)
  - Current: Captures signature header but never validates
  - Needed: Implement SendGrid signature verification
  - Impact: Vulnerable to forged webhook requests

### Implementation Plan:
1. **SendGrid Webhook Security**:
   ```javascript
   // Add signature verification
   const crypto = require('crypto');
   
   const verifyWebhookSignature = (payload, signature, timestamp) => {
     const expectedSignature = crypto
       .createHmac('sha256', process.env.SENDGRID_WEBHOOK_SECRET)
       .update(timestamp + payload)
       .digest('base64');
     
     return crypto.timingSafeEqual(
       Buffer.from(signature, 'base64'),
       Buffer.from(expectedSignature, 'base64')
     );
   };
   ```

2. **Security Enhancements**:
   - Add timestamp validation to prevent replay attacks
   - Implement rate limiting for webhook endpoints
   - Add comprehensive logging for security events
   - Set up monitoring for failed verification attempts

### Estimated Effort: 4-6 hours

---

## Group 4: API Integration Gaps
**Priority**: MEDIUM - Frontend-backend synchronization

### Issues:
These backend endpoints exist but are not exposed through the Next.js API client:

#### Admin Endpoints:
- `GET /api/admin/analytics/summary` (`backend/src/routes/admin.js:351`)
- `GET /api/admin/consultations/pending` (`backend/src/routes/admin.js:52`)
- `GET /api/admin/metrics` (`backend/src/routes/admin.js:24`)
- `GET /api/admin/orders/stats` (`backend/src/routes/admin.js:225`)
- `GET /api/admin/patients` (`backend/src/routes/admin.js:121`)
- `GET /api/admin/providers` (`backend/src/routes/admin.js:177`)

#### Patient Management:
- `GET /api/admin/patients/:id/full` (`backend/src/routes/admin-patients.js:24`)
- `GET /api/admin/patients/:id/statistics` (`backend/src/routes/admin-patients.js:506`)

#### Auth & Consultation:
- `GET /api/auth/me` (`backend/src/routes/auth.js:634`)
- `GET /api/auth/verify-email/:token` (`backend/src/routes/auth.js:608`)
- `GET /api/consultations` (`backend/src/routes/consultations.js:215`)
- `GET /api/ai-consultation/status` (`backend/src/routes/ai-consultation.js:144`)

### Implementation Plan:
1. **Update Frontend API Client** (`frontend/src/lib/api.ts`):
   ```typescript
   // Add missing endpoint definitions
   export const adminApi = {
     getAnalyticsSummary: () => apiClient.get('/api/admin/analytics/summary'),
     getPendingConsultations: () => apiClient.get('/api/admin/consultations/pending'),
     getMetrics: () => apiClient.get('/api/admin/metrics'),
     // ... add all missing endpoints
   };
   ```

2. **Type Definitions**:
   - Add TypeScript interfaces for all response types
   - Update existing types to match backend responses
   - Add proper error handling types

3. **Testing**:
   - Test each endpoint integration
   - Verify data flow from backend to frontend
   - Add integration tests

### Estimated Effort: 8-12 hours

---

## Group 5: AI Consultation Compliance
**Priority**: MEDIUM - Medical compliance and safety

### Issues:
- **Patient messaging prompt lacks compliance disclaimer** (`backend/src/services/ai-consultation.service.js:94`)
  - Current: AI-generated messages may lack proper medical disclaimers
  - Needed: Explicit medical disclaimer instructions in prompts
  - Impact: Regulatory compliance risk

### Implementation Plan:
1. **Enhanced AI Prompts**:
   ```javascript
   // Update patient message generation prompt
   const prompt = `
   Create a patient message with MANDATORY requirements:
   1. Include medical disclaimer
   2. Specify AI-assisted nature
   3. Require clinician review
   4. Add contact instructions for concerns
   
   REQUIRED DISCLAIMER: "This message contains AI-assisted recommendations 
   that must be reviewed and approved by a licensed healthcare provider 
   before implementation. This is not a substitute for professional medical advice."
   `;
   ```

2. **Compliance Validation**:
   - Add automated checks for required disclaimers
   - Implement message template validation
   - Add audit logging for AI-generated content
   - Create compliance reporting

### Estimated Effort: 4-6 hours

---

## Summary

### Total Estimated Effort: 34-48 hours

### Priority Order:
1. **File Management** (12-16h) - Core functionality
2. **API Integration** (8-12h) - Frontend connectivity  
3. **Database Integrity** (6-8h) - Data consistency
4. **Security & Webhooks** (4-6h) - Security hardening
5. **AI Compliance** (4-6h) - Regulatory compliance

### Dependencies:
- Database migration strategy
- S3/storage configuration
- SendGrid webhook secrets
- Frontend API client updates
- Testing infrastructure

### Success Criteria:
- All file operations work in production
- Database referential integrity maintained
- Webhook security implemented
- Frontend-backend API sync complete
- AI compliance disclaimers enforced