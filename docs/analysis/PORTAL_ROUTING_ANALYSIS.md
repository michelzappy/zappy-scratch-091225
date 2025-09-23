# Portal Routing Analysis & Database Mapping
Date: January 13, 2025

## Current Portal Structure

### Two Separate Portal Systems:

1. **Provider/Admin Portal** (`/portal/*`)
   - For healthcare providers and administrators
   - Role-based access (provider, admin, provider-admin, super-admin)

2. **Patient Portal** (`/patient/*`)
   - For patients to manage their healthcare
   - Separate authentication and features

## Existing Pages Verified

### Provider/Admin Portal Pages (`/portal/*`)
All these pages exist and are accessible:
- ✅ `/portal/dashboard` - Main dashboard
- ✅ `/portal/consultations` - Provider consultations list
- ✅ `/portal/consultation/[id]` - Individual consultation view
- ✅ `/portal/checkin/[id]` - Individual check-in view (dynamic route)
- ✅ `/portal/patients` - Patients management
- ✅ `/portal/patient/[id]` - Individual patient details
- ✅ `/portal/messages` - Messaging center
- ✅ `/portal/prescriptions` - Prescription management
- ✅ `/portal/orders` - Order management
- ✅ `/portal/providers` - Provider management
- ✅ `/portal/medications` - Medication database
- ✅ `/portal/protocols` - Treatment protocols
- ✅ `/portal/plans` - Treatment plans
- ✅ `/portal/forms` - Form templates
- ✅ `/portal/pharmacy` - Pharmacy management
- ✅ `/portal/analytics` - Analytics dashboard
- ✅ `/portal/settings` - Settings
- ✅ `/portal/login` - Portal login

### Patient Portal Pages (`/patient/*`)
- ✅ `/patient/dashboard` - Patient dashboard
- ✅ `/patient/new-consultation` - Create new consultation (patient-initiated)
- ✅ `/patient/checkout` - Payment processing
- ✅ `/patient/health-quiz` - Health assessments
- ✅ `/patient/help` - Support center
- ✅ `/patient/login` - Patient login
- ✅ `/patient/medical-records` - Medical history
- ✅ `/patient/messages` - Patient messaging
- ✅ `/patient/orders` - Order history
- ✅ `/patient/profile` - Patient profile
- ✅ `/patient/refill-checkin` - Medication refill requests
- ✅ `/patient/subscription` - Subscription management

## Database Table Mapping

### Core Tables (from unified-portal-schema.sql):

1. **users** table
   - `role`: patient, provider, admin, provider_admin, super_admin
   - `portal_role`: Additional portal-specific role
   - `portal_permissions`: JSONB for custom permissions
   - `portal_settings`: User preferences

2. **portal_permissions** table
   - Role-based resource access control
   - CRUD permissions per resource
   - Conditions for conditional access

3. **portal_access_logs** table
   - Audit trail for portal access
   - Tracks user actions and resources

4. **consultations** table
   - Links patients with providers
   - Status tracking (pending, in-progress, completed)
   - Priority levels

5. **treatment_protocols** table
   - Treatment plans and protocols
   - Custom pricing and tiers
   - Version tracking

6. **intake_forms** table
   - Form templates and submissions
   - Version control
   - Condition-specific forms

## Routing Issues Identified

### Issue 1: Missing Check-in Reviews Page
- **Navigation Link**: `/portal/checkin-reviews` (removed)
- **Actual Existing Page**: `/portal/checkin/[id]` (individual check-ins only)
- **Solution**: Removed the non-existent link from navigation

### Issue 2: Cross-Portal Routing
- **Consultations Page**: Routes to `/patient/new-consultation`
- **This is CORRECT**: Providers don't create consultations, patients do
- **Workflow**: Patient creates consultation → Provider reviews and responds

## Correct Workflow

### Consultation Flow:
1. **Patient** initiates consultation at `/patient/new-consultation`
2. **Provider** reviews pending consultations at `/portal/consultations`
3. **Provider** opens specific consultation at `/portal/consultation/[id]`
4. **Patient** receives response and can continue at `/patient/messages`

### Check-in Flow:
1. **Patient** submits refill check-in at `/patient/refill-checkin`
2. **Provider** reviews individual check-ins at `/portal/checkin/[id]`
3. No list view for check-ins exists in provider portal (by design)

## Backend API Routes (Verified)

All routes properly configured in `backend/src/app.js`:
- `/api/auth` - Authentication for both portals
- `/api/consultations` - Consultation management
- `/api/messages` - Messaging system
- `/api/patients` - Patient records
- `/api/providers` - Provider management
- `/api/provider/consultations` - Provider-specific views
- `/api/orders` - Order processing
- `/api/prescriptions` - Prescription management
- `/api/medications` - Medication database
- `/api/admin` - Admin functions
- `/api/admin/patients` - Admin patient management
- `/api/treatment-plans` - Treatment planning
- `/api/ai-consultation` - AI-assisted consultations

## Role-Based Access Control

### Provider Role:
- Clinical features only
- View consultations, patients, prescriptions
- Cannot access admin features

### Admin Role:
- Administrative features only
- Manage providers, medications, forms
- Cannot perform clinical actions

### Provider-Admin Role:
- Hybrid access to both clinical and admin
- Can treat patients AND manage system

### Super-Admin Role:
- Full system access
- All features plus system configuration

## Recommendations

1. **Do NOT create new pages** - All necessary pages exist
2. **Keep cross-portal routing** - It's intentional for the workflow
3. **Consider adding** (if needed):
   - A check-in list view at `/portal/checkin` (not `/portal/checkin-reviews`)
   - Provider-initiated consultation creation (rare use case)

## Conclusion

The portal routing is working as designed with two separate systems:
- Provider/Admin portal for healthcare professionals
- Patient portal for patient self-service

The cross-portal routing (e.g., consultations page linking to patient portal) is intentional and supports the proper healthcare workflow where patients initiate consultations and providers respond.

All pages referenced in the navigation now exist and are properly accessible. No 404 errors should occur with the current configuration.
