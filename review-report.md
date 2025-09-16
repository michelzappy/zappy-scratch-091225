# Multi-agent Review Report

## Summary
Info: 3 | High: 18 | Medium: 44 | Low: 2

### Automation Commands
- **Backend**: npm run lint, npm run test
- **Frontend**: npm run lint, npm run test, npm run type-check

## Findings by Agent
### AI Consultation Specialist
- **MEDIUM** LLM JSON output is trusted without schema validation (`backend/src/services/ai-consultation.service.js`:72) [#ai #safety]
  - Wrap the parsed response in a schema validator (zod/io-ts) to reject malformed content before persisting clinical recommendations.
- **MEDIUM** Patient messaging prompt lacks compliance disclaimer (`backend/src/services/ai-consultation.service.js`:94) [#ai #compliance]
  - Add explicit instructions for medical disclaimers and clinician review when generating patient-facing messages so AI output never replaces licensed guidance.

### Automation & Quality
- **INFO** Backend automation commands discovered (`backend/package.json`) [#automation]
  - npm run lint, npm run test
- **INFO** Frontend automation commands discovered (`frontend/package.json`) [#automation]
  - npm run lint, npm run test, npm run type-check

### Backend API Reviewer
- **HIGH** Route missing authentication guard (`backend/src/routes/messages.js`) [#auth #backend]
  - The router mounted at `/api/messages` does not reference `requireAuth` or `requireRole`. Attach role-aware middleware so protected resources cannot be accessed anonymously.
- **HIGH** Route missing authentication guard (`backend/src/routes/provider-consultations.js`) [#auth #backend]
  - The router mounted at `/api/provider/consultations` does not reference `requireAuth` or `requireRole`. Attach role-aware middleware so protected resources cannot be accessed anonymously.
- **HIGH** Route missing authentication guard (`backend/src/routes/orders.js`) [#auth #backend]
  - The router mounted at `/api/orders` does not reference `requireAuth` or `requireRole`. Attach role-aware middleware so protected resources cannot be accessed anonymously.
- **HIGH** Route missing authentication guard (`backend/src/routes/files.js`) [#auth #backend]
  - The router mounted at `/api/files` does not reference `requireAuth` or `requireRole`. Attach role-aware middleware so protected resources cannot be accessed anonymously.
- **MEDIUM** Placeholder implementation in API route (`backend/src/routes/files.js`:12) [#todo #backend]
  - Replace the placeholder response with production logic for file uploads and retrieval.
- **MEDIUM** Placeholder implementation in API route (`backend/src/routes/files.js`:22) [#todo #backend]
  - Replace the placeholder response with production logic for file uploads and retrieval.
- **HIGH** Route missing authentication guard (`backend/src/routes/treatment-plans.js`) [#auth #backend]
  - The router mounted at `/api/treatment-plans` does not reference `requireAuth` or `requireRole`. Attach role-aware middleware so protected resources cannot be accessed anonymously.

### Database Integrity
- **MEDIUM** user_sessions table lacks foreign key constraint (`database/init.sql`:99) [#database #integrity]
  - Connect `user_id` to the appropriate patients/providers table with a foreign key to enforce referential integrity for session revocation.
- **LOW** Seed patient records included in init.sql (`database/init.sql`:139) [#database #seed]
  - Remove hard-coded sample patients before production to avoid leaking test identities.

### Frontend Experience
- **MEDIUM** Mock data still powering portal UI (`frontend/src/app/patient/dashboard/page.tsx`:20) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend/src/app/patient/dashboard/page.tsx`:52) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend/src/app/patient/dashboard/page.tsx`:76) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend/src/app/patient/dashboard/page.tsx`:85) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend/src/app/patient/dashboard/page.tsx`:107) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **LOW** TODO left in UI flow (`frontend/src/app/patient/health-quiz/page.tsx`:296) [#frontend #todo]
  - Resolve TODOs to finalize the patient/provider experience before release.
- **MEDIUM** Mock data still powering portal UI (`frontend/src/app/patient/messages/page.tsx`:69) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend/src/app/patient/messages/page.tsx`:98) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend/src/app/portal/checkin/[id]/page.tsx`:102) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend/src/app/portal/checkin/[id]/page.tsx`:171) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend/src/app/portal/consultation/[id]/page.tsx`:77) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend/src/app/portal/consultation/[id]/page.tsx`:111) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend/src/app/portal/consultation/[id]/page.tsx`:115) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend/src/app/portal/consultation/[id]/page.tsx`:116) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend/src/app/portal/consultation/[id]/page.tsx`:117) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend/src/app/portal/consultations/page.tsx`:47) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend/src/app/portal/consultations/page.tsx`:104) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend/src/app/portal/messages/page.tsx`:46) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend/src/app/portal/messages/page.tsx`:82) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend/src/app/portal/orders/page.tsx`:71) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend/src/app/portal/orders/page.tsx`:158) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend/src/app/portal/patients/page.tsx`:50) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend/src/app/portal/patients/page.tsx`:134) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend/src/app/portal/plans/page.tsx`:72) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend/src/app/portal/plans/page.tsx`:235) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend/src/app/portal/providers/page.tsx`:60) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend/src/app/portal/providers/page.tsx`:123) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.

### Integration Contract
- **MEDIUM** Backend endpoint missing from API client (`backend/src/routes/admin.js`:351) [#integration]
  - Expose `GET /api/admin/analytics/summary` through the Next.js api client to keep the portal in sync with the Express app.
- **MEDIUM** Backend endpoint missing from API client (`backend/src/routes/admin.js`:52) [#integration]
  - Expose `GET /api/admin/consultations/pending` through the Next.js api client to keep the portal in sync with the Express app.
- **MEDIUM** Backend endpoint missing from API client (`backend/src/routes/admin.js`:24) [#integration]
  - Expose `GET /api/admin/metrics` through the Next.js api client to keep the portal in sync with the Express app.
- **MEDIUM** Backend endpoint missing from API client (`backend/src/routes/admin.js`:225) [#integration]
  - Expose `GET /api/admin/orders/stats` through the Next.js api client to keep the portal in sync with the Express app.
- **MEDIUM** Backend endpoint missing from API client (`backend/src/routes/admin.js`:121) [#integration]
  - Expose `GET /api/admin/patients` through the Next.js api client to keep the portal in sync with the Express app.
- **MEDIUM** Backend endpoint missing from API client (`backend/src/routes/admin-patients.js`:24) [#integration]
  - Expose `GET /api/admin/patients/:id/full` through the Next.js api client to keep the portal in sync with the Express app.
- **MEDIUM** Backend endpoint missing from API client (`backend/src/routes/admin-patients.js`:506) [#integration]
  - Expose `GET /api/admin/patients/:id/statistics` through the Next.js api client to keep the portal in sync with the Express app.
- **MEDIUM** Backend endpoint missing from API client (`backend/src/routes/admin.js`:177) [#integration]
  - Expose `GET /api/admin/providers` through the Next.js api client to keep the portal in sync with the Express app.
- **MEDIUM** Backend endpoint missing from API client (`backend/src/routes/ai-consultation.js`:144) [#integration]
  - Expose `GET /api/ai-consultation/status` through the Next.js api client to keep the portal in sync with the Express app.
- **MEDIUM** Backend endpoint missing from API client (`backend/src/routes/auth.js`:634) [#integration]
  - Expose `GET /api/auth/me` through the Next.js api client to keep the portal in sync with the Express app.
- **MEDIUM** Backend endpoint missing from API client (`backend/src/routes/auth.js`:608) [#integration]
  - Expose `GET /api/auth/verify-email/:token` through the Next.js api client to keep the portal in sync with the Express app.
- **MEDIUM** Backend endpoint missing from API client (`backend/src/routes/consultations.js`:215) [#integration]
  - Expose `GET /api/consultations` through the Next.js api client to keep the portal in sync with the Express app.
- **HIGH** Frontend references undefined API route (`frontend/src/lib/api.ts`:116) [#integration]
  - The client calls `GET /api/admin/audit-logs` but no Express route exposes it. Either implement the route or update the UI.
- **HIGH** Frontend references undefined API route (`frontend/src/lib/api.ts`:115) [#integration]
  - The client calls `GET /api/admin/dashboard` but no Express route exposes it. Either implement the route or update the UI.
- **HIGH** Frontend references undefined API route (`frontend/src/lib/api.ts`:60) [#integration]
  - The client calls `GET /api/auth/profile` but no Express route exposes it. Either implement the route or update the UI.
- **HIGH** Frontend references undefined API route (`frontend/src/lib/api.ts`:70) [#integration]
  - The client calls `GET /api/consultations/patient/:patientId` but no Express route exposes it. Either implement the route or update the UI.
- **HIGH** Frontend references undefined API route (`frontend/src/lib/api.ts`:72) [#integration]
  - The client calls `GET /api/consultations/provider/queue` but no Express route exposes it. Either implement the route or update the UI.
- **HIGH** Frontend references undefined API route (`frontend/src/lib/api.ts`:108) [#integration]
  - The client calls `GET /api/files/:id/download` but no Express route exposes it. Either implement the route or update the UI.
- **HIGH** Frontend references undefined API route (`frontend/src/lib/api.ts`:86) [#integration]
  - The client calls `GET /api/messages/unread-count` but no Express route exposes it. Either implement the route or update the UI.
- **HIGH** Frontend references undefined API route (`frontend/src/lib/api.ts`:93) [#integration]
  - The client calls `GET /api/patients/:id/consultations` but no Express route exposes it. Either implement the route or update the UI.
- **HIGH** Frontend references undefined API route (`frontend/src/lib/api.ts`:98) [#integration]
  - The client calls `GET /api/providers` but no Express route exposes it. Either implement the route or update the UI.
- **HIGH** Frontend references undefined API route (`frontend/src/lib/api.ts`:99) [#integration]
  - The client calls `GET /api/providers/:id` but no Express route exposes it. Either implement the route or update the UI.
- **HIGH** Frontend references undefined API route (`frontend/src/lib/api.ts`:100) [#integration]
  - The client calls `GET /api/providers/:id/consultations` but no Express route exposes it. Either implement the route or update the UI.
- **HIGH** Frontend references undefined API route (`frontend/src/lib/api.ts`:59) [#integration]
  - The client calls `POST /api/auth/login` but no Express route exposes it. Either implement the route or update the UI.

### Repository Cartographer
- **INFO** Component map generated
  - Indexed 15 Express router modules, 7 services, 33 SQL tables, and 23 frontend API endpoints for downstream agents.

### Security & Compliance
- **HIGH** Raw webhook payload parsed without Buffer conversion (`backend/src/routes/webhooks.js`:16) [#security #webhook]
  - The handler uses `express.raw` but parses `req.body` without converting the Buffer to a string. Call `JSON.parse(req.body.toString())` to avoid runtime crashes.
- **MEDIUM** Webhook signature captured but never validated (`backend/src/routes/webhooks.js`:11) [#security #webhook]
  - The SendGrid webhook stores the `signature` header yet never verifies it. Use the official verification helper to prevent forged requests.
