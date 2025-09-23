# Multi-agent Review Report

## Summary
Info: 3 | Medium: 40 | Low: 1 | High: 2

### Automation Commands
- **Backend**: npm run lint, npm run test
- **Frontend**: npm run lint, npm run test, npm run type-check

## Findings by Agent
### AI Consultation Specialist
- **MEDIUM** LLM JSON output is trusted without schema validation (`backend\src\services\ai-consultation.service.js`:118) [#ai #safety]
  - Wrap the parsed response in a schema validator (zod/io-ts) to reject malformed content before persisting clinical recommendations.

### Automation & Quality
- **INFO** Backend automation commands discovered (`backend\package.json`) [#automation]
  - npm run lint, npm run test
- **INFO** Frontend automation commands discovered (`frontend\package.json`) [#automation]
  - npm run lint, npm run test, npm run type-check

### Database Integrity
- **MEDIUM** user_sessions table lacks foreign key constraint (`database\init.sql`:99) [#database #integrity]
  - Connect `user_id` to the appropriate patients/providers table with a foreign key to enforce referential integrity for session revocation.

### Frontend Experience
- **MEDIUM** Mock data still powering portal UI (`frontend\src\app\patient\dashboard\page.tsx`:20) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend\src\app\patient\dashboard\page.tsx`:52) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend\src\app\patient\dashboard\page.tsx`:76) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend\src\app\patient\dashboard\page.tsx`:85) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend\src\app\patient\dashboard\page.tsx`:107) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **LOW** TODO left in UI flow (`frontend\src\app\patient\health-quiz\page.tsx`:296) [#frontend #todo]
  - Resolve TODOs to finalize the patient/provider experience before release.
- **MEDIUM** Mock data still powering portal UI (`frontend\src\app\patient\messages\page.tsx`:69) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend\src\app\patient\messages\page.tsx`:98) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend\src\app\portal\checkin\[id]\page.tsx`:102) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend\src\app\portal\checkin\[id]\page.tsx`:171) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend\src\app\portal\consultation\[id]\page.tsx`:77) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend\src\app\portal\consultation\[id]\page.tsx`:111) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend\src\app\portal\consultation\[id]\page.tsx`:115) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend\src\app\portal\consultation\[id]\page.tsx`:116) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend\src\app\portal\consultation\[id]\page.tsx`:117) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend\src\app\portal\consultations\page.tsx`:47) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend\src\app\portal\consultations\page.tsx`:104) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend\src\app\portal\messages\page.tsx`:46) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend\src\app\portal\messages\page.tsx`:82) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend\src\app\portal\orders\page.tsx`:71) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend\src\app\portal\orders\page.tsx`:158) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend\src\app\portal\patients\page.tsx`:50) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend\src\app\portal\patients\page.tsx`:134) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend\src\app\portal\plans\page.tsx`:72) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend\src\app\portal\plans\page.tsx`:235) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend\src\app\portal\providers\page.tsx`:60) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.
- **MEDIUM** Mock data still powering portal UI (`frontend\src\app\portal\providers\page.tsx`:123) [#frontend #mock]
  - Replace mock collections with API calls wired through `apiClient` to surface real patient data.

### Integration Contract
- **MEDIUM** Backend endpoint missing from API client (`backend\src\routes\files.js`:220) [#integration]
  - Expose `DELETE /api/files/:id` through the Next.js api client to keep the portal in sync with the Express app.
- **MEDIUM** Backend endpoint missing from API client (`backend\src\routes\admin.js`:291) [#integration]
  - Expose `GET /api/admin/analytics/summary` through the Next.js api client to keep the portal in sync with the Express app.
- **MEDIUM** Backend endpoint missing from API client (`backend\src\routes\admin.js`:105) [#integration]
  - Expose `GET /api/admin/consultations/pending` through the Next.js api client to keep the portal in sync with the Express app.
- **MEDIUM** Backend endpoint missing from API client (`backend\src\routes\admin.js`:415) [#integration]
  - Expose `GET /api/admin/health` through the Next.js api client to keep the portal in sync with the Express app.
- **MEDIUM** Backend endpoint missing from API client (`backend\src\routes\admin.js`:61) [#integration]
  - Expose `GET /api/admin/metrics` through the Next.js api client to keep the portal in sync with the Express app.
- **MEDIUM** Backend endpoint missing from API client (`backend\src\routes\admin.js`:226) [#integration]
  - Expose `GET /api/admin/orders/stats` through the Next.js api client to keep the portal in sync with the Express app.
- **MEDIUM** Backend endpoint missing from API client (`backend\src\routes\admin.js`:166) [#integration]
  - Expose `GET /api/admin/patients` through the Next.js api client to keep the portal in sync with the Express app.
- **MEDIUM** Backend endpoint missing from API client (`backend\src\routes\admin-patients.js`:24) [#integration]
  - Expose `GET /api/admin/patients/:id/full` through the Next.js api client to keep the portal in sync with the Express app.
- **MEDIUM** Backend endpoint missing from API client (`backend\src\routes\admin-patients.js`:506) [#integration]
  - Expose `GET /api/admin/patients/:id/statistics` through the Next.js api client to keep the portal in sync with the Express app.
- **MEDIUM** Backend endpoint missing from API client (`backend\src\routes\admin.js`:196) [#integration]
  - Expose `GET /api/admin/providers` through the Next.js api client to keep the portal in sync with the Express app.
- **MEDIUM** Backend endpoint missing from API client (`backend\src\routes\admin.js`:352) [#integration]
  - Expose `GET /api/admin/users` through the Next.js api client to keep the portal in sync with the Express app.
- **MEDIUM** Backend endpoint missing from API client (`backend\src\routes\ai-consultation.js`:147) [#integration]
  - Expose `GET /api/ai-consultation/status` through the Next.js api client to keep the portal in sync with the Express app.
- **HIGH** Frontend references undefined API route (`frontend\src\lib\api.ts`:93) [#integration]
  - The client calls `GET /api/patients/:id/consultations` but no Express route exposes it. Either implement the route or update the UI.
- **HIGH** Frontend references undefined API route (`frontend\src\lib\api.ts`:92) [#integration]
  - The client calls `PUT /api/patients/:id` but no Express route exposes it. Either implement the route or update the UI.

### Repository Cartographer
- **INFO** Component map generated
  - Indexed 15 Express router modules, 7 services, 33 SQL tables, and 23 frontend API endpoints for downstream agents.
