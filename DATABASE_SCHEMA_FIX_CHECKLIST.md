# Database Schema and System Data Requirements Fix Checklist

This checklist outlines the critical fixes required to resolve mismatches between the database schema and the system's data requirements in the telehealth platform.

---

## 1. Consolidate Database Schema

- [ ] Choose `database/complete-schema.sql` as the single source of truth for the database schema.
- [ ] Remove or archive conflicting schema files (`unified-portal-schema.sql`, `direct-model-schema.sql`).
- [ ] Ensure all database migrations and seed scripts align with the consolidated schema.

## 2. Update Backend ORM Models

- [ ] Update Drizzle ORM models in `backend/src/models/index.js` to fully match the consolidated database schema.
- [ ] Add all missing fields to models, including:
  - Medical data fields (e.g., allergies, medical_conditions, current_medications).
  - Shipping address fields.
  - Subscription and payment tracking fields.
  - Insurance information fields.
- [ ] Verify all relations and foreign keys are correctly defined.

## 3. Fix Authentication Architecture

- [ ] Replace the current unified `users` table approach in the auth service with separate tables for patients, providers, and admins as per the consolidated schema.
- [ ] Update `backend/src/services/auth.service.js` and related auth routes to query the correct tables and fields.
- [ ] Ensure JWT token payloads include accurate role and permission information.
- [ ] Align frontend authentication expectations with backend implementation.

## 4. Standardize Field Naming Conventions

- [ ] Decide on a consistent naming convention (snake_case recommended for database, camelCase for frontend).
- [ ] Implement a mapping layer or use ORM features to translate between database and application naming conventions.
- [ ] Update all API routes to accept and return data using the standardized naming.
- [ ] Update frontend types and interfaces to match the standardized naming.

## 5. Align API Routes with Database Schema

- [ ] Review all API routes to ensure they use the correct field names and data structures matching the consolidated schema.
- [ ] Add missing fields in API request validation and response formatting.
- [ ] Ensure sensitive fields (e.g., password_hash) are never exposed in API responses.
- [ ] Implement comprehensive input validation for all new fields.

## 6. Complete Frontend Types and Data Structures

- [ ] Update frontend TypeScript types to include all fields present in the consolidated schema.
- [ ] Ensure all data passed between frontend and backend conforms to these types.
- [ ] Add missing types for subscription, insurance, and medical data.

## 7. Review and Update Service Layer Implementations

- [ ] Verify all service layer modules handle the full data model correctly.
- [ ] Update business logic to use new fields and relations.
- [ ] Ensure data transformations respect the standardized naming conventions.
- [ ] Add error handling for any new data validation requirements.

## 8. Testing and Validation

- [ ] Create or update unit and integration tests to cover the full data model.
- [ ] Validate data integrity across all layers (database, backend, frontend).
- [ ] Perform end-to-end testing of critical workflows (patient registration, consultation, prescription, payment).
- [ ] Conduct security and compliance testing focusing on sensitive data handling.

---

## Notes

- This checklist addresses the critical mismatches identified in the current system.
- Resolving these issues is essential for production readiness, data integrity, and regulatory compliance.
- Coordination between backend, frontend, and database teams is required to implement these fixes effectively.

---

*Document generated on 2025-09-20 by Project Research Assistant.*