# SEC-001 HIPAA Patient Data Access Audit Logging - Brownfield Addition

## Story Title

HIPAA Patient Data Access Audit Logging - Brownfield Addition

## User Story

As a **Healthcare System Administrator**,
I want **all patient data access attempts to be securely logged with encrypted identifiers**,
So that **we maintain HIPAA compliance audit trails without exposing sensitive patient information**.

## Story Context

**Existing System Integration:**

- Integrates with: Existing patient routes in [`backend/src/routes/patients.js`](backend/src/routes/patients.js:1)
- Technology: Express.js middleware + PostgreSQL audit table + bcryptjs for identifier hashing  
- Follows pattern: Existing middleware pattern used in [`backend/src/middleware/auth.js`](backend/src/middleware/auth.js:1)
- Touch points: All patient data endpoints (/me, /:id, /me/programs, /me/orders, /me/measurements, /me/consultations)

## Acceptance Criteria

**Functional Requirements:**

1. **Audit Logging Middleware**: Create middleware that logs all patient data access attempts with encrypted patient identifiers (hash of patient.id)
2. **Secure Data Handling**: Audit logs contain NO actual patient data - only hashed identifiers, endpoint accessed, timestamp, and user role
3. **Database Integration**: New `patient_access_audit` table captures audit events with proper indexing for HIPAA compliance queries

**Integration Requirements:**

4. Existing patient data endpoints in [`backend/src/routes/patients.js`](backend/src/routes/patients.js:1) continue to work unchanged
5. New audit middleware follows existing middleware pattern from [`backend/src/middleware/auth.js`](backend/src/middleware/auth.js:1) 
6. Integration with current PostgreSQL database maintains existing patient table structure

**Quality Requirements:**

7. Change is covered by unit tests for audit middleware and database audit table creation
8. Documentation updated in architecture document for audit logging implementation
9. No regression in existing patient data access functionality verified through endpoint testing

## Technical Notes

- **Integration Approach**: Express middleware applied to existing patient routes using `router.use()` pattern
- **Existing Pattern Reference**: Follow middleware architecture from [`backend/src/middleware/auth.js`](backend/src/middleware/auth.js:1) with async error handling
- **Key Constraints**: 
  - HIPAA compliance requires NO patient data in audit logs
  - Must use bcryptjs for consistent patient ID hashing 
  - Audit table must support HIPAA retention policies (configurable via environment)

## Definition of Done

- [ ] `backend/src/middleware/hipaa-audit.js` created with secure audit logging middleware
- [ ] `database/migrations/add-patient-audit-table.sql` created with HIPAA-compliant audit table schema
- [ ] Patient routes updated to use audit middleware without breaking existing functionality  
- [ ] Unit tests verify audit logging works and no sensitive data is logged
- [ ] Existing patient endpoint functionality regression tested (all GET/POST/PUT operations)
- [ ] Architecture documentation updated with audit logging implementation details

## Risk and Compatibility Check

**Minimal Risk Assessment:**

- **Primary Risk**: Audit logging middleware could impact patient endpoint performance or expose patient data if incorrectly implemented
- **Mitigation**: Use async audit logging with database connection pooling; hash all patient identifiers before logging; comprehensive unit testing
- **Rollback**: Remove middleware from patient routes and drop audit table if any issues detected

**Compatibility Verification:**

- [x] No breaking changes to existing patient APIs - audit middleware is transparent to existing functionality
- [x] Database changes are additive only - new audit table does not modify existing patient table structure  
- [x] Middleware follows existing Express.js middleware patterns used throughout the application
- [x] Performance impact is negligible - async audit logging with minimal overhead

## Implementation Notes

**Immediate Security Focus:**
- Addresses SEC-001 critical risk by implementing foundation for HIPAA-compliant audit logging
- Creates secure audit trail for patient data access without exposing sensitive information
- Establishes pattern for extending audit logging to other healthcare data endpoints

**Database Schema:**
```sql
CREATE TABLE patient_access_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id_hash VARCHAR(64) NOT NULL, -- bcrypt hash of patient.id  
  endpoint_accessed VARCHAR(255) NOT NULL,
  http_method VARCHAR(10) NOT NULL,
  accessed_by_user_id UUID NOT NULL,
  accessed_by_role VARCHAR(50) NOT NULL,
  access_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_patient_access_audit_hash ON patient_access_audit(patient_id_hash);
CREATE INDEX idx_patient_access_audit_timestamp ON patient_access_audit(access_timestamp);
```

**Middleware Implementation Approach:**
- Intercept all patient route requests
- Hash patient identifiers using bcryptjs with consistent salt
- Log access attempt to audit table asynchronously
- Continue with normal request processing
- Handle audit logging errors gracefully without impacting patient care

This story directly addresses the most critical HIPAA compliance risk while maintaining full backward compatibility with existing patient management functionality.