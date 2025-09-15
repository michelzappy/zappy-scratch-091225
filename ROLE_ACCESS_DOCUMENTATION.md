# Portal Role-Based Access Control Documentation

## User Roles and Access Levels

### 1. **Provider** (Clinical Only)
Healthcare providers who treat patients directly.

**Access:**
- ✅ Dashboard - Clinical metrics and patient overview
- ✅ Consultations - View and manage patient consultations
- ✅ Patients - Full clinical access to patient records
- ✅ Messages - Patient communication
- ❌ Orders - No access
- ❌ Providers - No access  
- ❌ Medications Database - No access
- ❌ Protocols - No access
- ❌ Plans - No access
- ❌ Forms - No access
- ❌ Pharmacy - No access
- ❌ Analytics - No access
- ❌ Settings - No access

**Use Case:** Doctors, nurse practitioners, physicians who need to focus on patient care without administrative distractions.

---

### 2. **Admin** (Administrative Only)
Administrative staff who manage operations but don't provide clinical care.

**Access:**
- ✅ Dashboard - Administrative metrics
- ❌ Consultations - No clinical access
- ✅ Patients - Limited view (demographics, billing, no clinical data)
- ✅ Messages - Administrative communication
- ✅ Orders - Manage patient orders
- ✅ Providers - Manage provider accounts
- ✅ Medications - Manage medication database
- ✅ Protocols - Manage treatment protocols
- ✅ Plans - Manage subscription plans
- ✅ Forms - Manage form templates
- ✅ Pharmacy - Pharmacy management
- ✅ Analytics - Business analytics
- ✅ Settings - System settings

**Use Case:** Office managers, billing staff, administrative assistants who handle operations.

---

### 3. **Provider-Admin** (Hybrid Role)
Users who need both clinical and administrative access.

**Access:**
- ✅ Dashboard - Combined clinical + admin metrics
- ✅ Consultations - Full clinical access
- ✅ Patients - Full access (clinical + administrative)
- ✅ Messages - All communication
- ✅ Orders - Manage orders
- ✅ Providers - Manage providers
- ✅ Medications - Manage database
- ✅ Protocols - Manage protocols
- ✅ Plans - Manage plans
- ✅ Forms - Manage forms
- ✅ Pharmacy - Pharmacy management
- ✅ Analytics - Full analytics
- ✅ Settings - System settings

**Use Case:** Practice owners, medical directors, lead physicians who both treat patients and manage the practice.

---

### 4. **Super-Admin** (System Administrator)
Complete system access for technical administration.

**Access:**
- ✅ Everything Provider-Admin has
- ✅ System Configuration - Additional system-level settings
- ✅ Database Management
- ✅ User Role Management
- ✅ Security Settings
- ✅ Integration Management

**Use Case:** IT administrators, system managers, technical support staff.

---

## Navigation Organization

### Clinical Section
Appears for: Provider, Provider-Admin, Super-Admin
- Dashboard
- Consultations
- Patients
- Messages

### Administrative Section  
Appears for: Admin, Provider-Admin, Super-Admin
- Dashboard
- Patients (limited view for Admin)
- Messages
- Orders
- Providers
- Medications
- Protocols
- Plans
- Forms
- Pharmacy
- Analytics
- Settings

### Section Headers
- **Provider**: No section headers (only clinical items)
- **Admin**: No section headers (only admin items)
- **Provider-Admin**: Shows "Clinical" and "Administration" section headers
- **Super-Admin**: Shows "Clinical" and "Administration" section headers

---

## Dashboard Differences by Role

### Provider Dashboard
- Pending consultations
- Today's appointments
- Patient issues requiring attention
- Recent clinical activity
- Clinical metrics

### Admin Dashboard
- Revenue metrics
- New patient registrations
- Pending orders
- Provider schedules
- Business analytics

### Provider-Admin Dashboard
- Combined view with both clinical and business metrics
- Toggle between clinical and admin views
- Comprehensive overview

### Super-Admin Dashboard
- All Provider-Admin features
- System health metrics
- User activity logs
- Integration status
- Security alerts

---

## Data Access Restrictions

### Patient Data
- **Provider**: Full clinical access
- **Admin**: Demographics, insurance, billing only
- **Provider-Admin**: Full access
- **Super-Admin**: Full access

### Clinical Notes
- **Provider**: Read/Write
- **Admin**: No access
- **Provider-Admin**: Read/Write
- **Super-Admin**: Read only

### Billing Information
- **Provider**: View only
- **Admin**: Full access
- **Provider-Admin**: Full access
- **Super-Admin**: Full access

### System Configuration
- **Provider**: No access
- **Admin**: Limited settings
- **Provider-Admin**: Advanced settings
- **Super-Admin**: Full system configuration
