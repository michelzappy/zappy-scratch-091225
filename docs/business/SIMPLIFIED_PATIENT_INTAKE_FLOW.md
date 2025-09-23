# Simplified Patient Intake & Consultation Flow

## Overview
This document outlines a streamlined telehealth platform focused on patient intake, consultation management, and subscription-based services without complex third-party integrations.

---

## 1. PATIENT INTAKE FLOW

### Website Registration & Intake Form

#### Step 1: Landing Page
```
Patient arrives → Views services/pricing → Clicks "Start Consultation"
                            ↓
                   Subscription options presented
                            ↓
              Choose plan or one-time consultation
```

#### Step 2: Registration Form
```javascript
// Required Patient Information
{
  // Account Details
  email: string,
  password: string,
  phone: string,
  
  // Personal Information
  firstName: string,
  lastName: string,
  dateOfBirth: date,
  gender: enum('male', 'female', 'other'),
  
  // Contact Information
  address: {
    street: string,
    city: string,
    state: string,
    zipCode: string
  },
  
  // Medical History (Intake)
  chiefComplaint: string,
  symptoms: string[],
  currentMedications: text,
  allergies: text,
  medicalHistory: text,
  emergencyContact: {
    name: string,
    phone: string,
    relationship: string
  }
}
```

#### Step 3: Subscription Selection
```
Basic Plan ($29/mo)          Premium Plan ($79/mo)         Pay-Per-Visit ($49)
• 2 consultations            • 5 consultations             • Single consultation
• 48hr response              • 24hr response               • 48hr response
• Email/chat support         • Priority support            • Basic support
        ↓                            ↓                             ↓
                         Payment Processing (Stripe)
                                     ↓
                          Account Creation & Confirmation
```

#### Step 4: Database Storage
```sql
-- Enhanced Patient Table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Account Info
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    
    -- Personal Info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20),
    
    -- Address
    street_address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    
    -- Medical Info
    blood_type VARCHAR(10),
    allergies TEXT,
    current_medications TEXT,
    medical_history TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    
    -- Subscription Info
    subscription_plan VARCHAR(50), -- 'basic', 'premium', 'pay_per_visit'
    subscription_status VARCHAR(20) DEFAULT 'active',
    subscription_start_date DATE,
    subscription_end_date DATE,
    consultations_used INTEGER DEFAULT 0,
    consultations_limit INTEGER,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    account_status VARCHAR(20) DEFAULT 'active'
);
```

---

## 2. CONSULTATION REQUEST FLOW

### From Patient Portal

#### Step 1: Patient Dashboard
```
Login → Dashboard → "New Consultation" Button
           ↓
    Check subscription credits
           ↓
    Has credits?  →  No → Prompt for payment
           ↓ Yes
    Consultation form
```

#### Step 2: Consultation Form (Multi-step)
```javascript
// Step 1: Type & Urgency
{
  consultationType: enum([
    'general_medicine',
    'dermatology',
    'mental_health',
    'womens_health',
    'mens_health',
    'pediatrics'
  ]),
  urgency: enum(['routine', 'urgent', 'follow_up']),
  preferredProvider: uuid (optional)
}

// Step 2: Symptoms
{
  primarySymptom: string,
  symptomsList: string[],
  symptomDuration: string,
  painLevel: integer(0-10),
  symptomFrequency: string,
  triggerFactors: string
}

// Step 3: Medical Context
{
  relevantMedicalHistory: text,
  currentMedications: text,
  recentTests: text,
  previousTreatments: text,
  lifestyle: {
    smoking: boolean,
    alcohol: enum(['none', 'occasional', 'regular']),
    exercise: enum(['none', 'light', 'moderate', 'intense'])
  }
}

// Step 4: Attachments & Notes
{
  photos: file[],  // Stored locally or S3
  documents: file[],
  additionalNotes: text
}
```

#### Step 3: Database Storage
```sql
-- Enhanced Consultation Table
CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id),
    provider_id UUID REFERENCES providers(id),
    
    -- Consultation Details
    consultation_type VARCHAR(50),
    urgency VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending', -- pending, assigned, in_progress, completed
    
    -- Medical Information
    chief_complaint TEXT NOT NULL,
    symptoms JSONB,
    symptom_duration VARCHAR(50),
    pain_level INTEGER,
    medical_context JSONB,
    
    -- Assignment & Timing
    submitted_at TIMESTAMP DEFAULT NOW(),
    assigned_at TIMESTAMP,
    first_response_at TIMESTAMP,
    completed_at TIMESTAMP,
    response_time_hours INTEGER, -- for SLA tracking
    
    -- Billing
    payment_status VARCHAR(20), -- 'subscription', 'paid', 'pending'
    payment_amount DECIMAL(10,2),
    
    -- Quality Metrics
    patient_satisfaction INTEGER, -- 1-5 rating
    provider_notes TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_scheduled DATE
);
```

---

## 3. PROVIDER PORTAL FLOW

### Provider Dashboard

#### Queue Management
```
Provider Login → Dashboard → View Queue
                    ↓
         Sorted by: Urgency → Wait time → Type
                    ↓
            Click "Accept Consultation"
                    ↓
            Full patient history loads
```

#### Patient History View
```javascript
// Provider sees:
{
  patientInfo: {
    name: string,
    age: calculated,
    gender: string,
    allergies: string[],
    medications: string[],
    conditions: string[]
  },
  
  currentConsultation: {
    complaint: string,
    symptoms: object,
    duration: string,
    attachments: file[]
  },
  
  history: {
    previousConsultations: array,
    prescriptions: array,
    notes: array,
    labResults: array // future feature
  }
}
```

#### Provider Response Flow
```
Review Patient Info → Write Assessment → Create Treatment Plan
         ↓                   ↓                    ↓
   View attachments    Document findings    Prescribe/Recommend
         ↓                   ↓                    ↓
                    Submit Response
                           ↓
                 Patient gets notification
```

---

## 4. COMMUNICATION FLOW

### Asynchronous Messaging

#### Message Types
```javascript
const messageTypes = {
  PROVIDER_RESPONSE: 'Initial provider assessment',
  PATIENT_QUESTION: 'Follow-up question from patient',
  PROVIDER_CLARIFICATION: 'Provider asking for more info',
  TREATMENT_PLAN: 'Detailed treatment instructions',
  PRESCRIPTION: 'Medication prescribed',
  LAB_ORDER: 'Lab tests recommended',
  FOLLOW_UP: 'Schedule follow-up consultation',
  CONSULTATION_COMPLETE: 'Case closed'
};
```

#### Database Structure
```sql
-- Message Thread
CREATE TABLE consultation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID REFERENCES consultations(id),
    sender_id UUID NOT NULL,
    sender_type VARCHAR(20), -- 'patient' or 'provider'
    message_type VARCHAR(50),
    content TEXT,
    attachments JSONB,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Prescriptions (Simple, no pharmacy integration)
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID REFERENCES consultations(id),
    provider_id UUID REFERENCES providers(id),
    patient_id UUID REFERENCES patients(id),
    
    medication_name VARCHAR(255),
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration VARCHAR(100),
    instructions TEXT,
    refills INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 5. SUBSCRIPTION & BILLING FLOW

### Subscription Management

#### Payment Processing (Stripe)
```javascript
// Subscription Creation
async function createSubscription(patient, plan) {
  // Create Stripe customer
  const customer = await stripe.customers.create({
    email: patient.email,
    name: `${patient.firstName} ${patient.lastName}`,
    metadata: { patient_id: patient.id }
  });
  
  // Create subscription
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: PLAN_PRICES[plan] }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent']
  });
  
  // Update database
  await updatePatientSubscription(patient.id, {
    stripe_customer_id: customer.id,
    stripe_subscription_id: subscription.id,
    subscription_plan: plan,
    subscription_status: 'active',
    consultations_limit: PLAN_LIMITS[plan]
  });
}

// Usage Tracking
async function trackConsultationUsage(patientId) {
  const patient = await getPatient(patientId);
  
  if (patient.subscription_plan === 'pay_per_visit') {
    // Charge per consultation
    await chargeOneTimePayment(patient, CONSULTATION_FEE);
  } else {
    // Deduct from monthly allowance
    if (patient.consultations_used >= patient.consultations_limit) {
      throw new Error('Monthly consultation limit reached');
    }
    await incrementConsultationCount(patientId);
  }
}
```

#### Billing Tables
```sql
-- Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id),
    type VARCHAR(50), -- 'subscription', 'consultation', 'product'
    amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20), -- 'pending', 'completed', 'failed', 'refunded'
    stripe_payment_intent_id VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id),
    invoice_number VARCHAR(50) UNIQUE,
    amount DECIMAL(10,2),
    tax_amount DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    status VARCHAR(20),
    due_date DATE,
    paid_date DATE,
    stripe_invoice_id VARCHAR(255),
    line_items JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 6. ADMIN PORTAL FEATURES

### Dashboard Metrics
```javascript
const adminMetrics = {
  // Real-time stats
  activeConsultations: count,
  pendingConsultations: count,
  avgResponseTime: hours,
  
  // Daily metrics
  newPatients: count,
  consultationsCompleted: count,
  revenue: amount,
  
  // Subscription metrics
  activeSubscriptions: {
    basic: count,
    premium: count,
    total: count
  },
  
  // Provider metrics
  providerUtilization: percentage,
  avgConsultationsPerProvider: count,
  patientSatisfaction: rating
};
```

### Admin Functions
```
1. Provider Management
   - Add/remove providers
   - Set availability
   - View performance metrics
   - Manage specializations

2. Patient Management
   - View all patients
   - Access consultation history
   - Manage subscriptions
   - Handle refunds

3. Consultation Oversight
   - Monitor active consultations
   - Reassign if needed
   - View SLA compliance
   - Export reports

4. Financial Management
   - Revenue reports
   - Subscription analytics
   - Payment history
   - Tax reports
```

---

## 7. KEY FEATURES TO IMPLEMENT

### Phase 1: Core Platform (Month 1)
- [x] Patient registration with intake form
- [x] Basic consultation request flow
- [ ] Provider portal with queue
- [ ] Messaging system
- [ ] Stripe payment integration
- [ ] Basic subscription management

### Phase 2: Enhanced Features (Month 2)
- [ ] File upload for photos/documents
- [ ] Provider scheduling/availability
- [ ] Email notifications
- [ ] Patient consultation history
- [ ] Provider performance tracking
- [ ] Basic reporting

### Phase 3: Optimization (Month 3)
- [ ] Automated triage based on symptoms
- [ ] Smart provider matching
- [ ] Follow-up reminders
- [ ] Patient satisfaction surveys
- [ ] Advanced analytics dashboard
- [ ] Mobile-responsive design

---

## 8. SIMPLIFIED TECH STACK

### Backend
- **Node.js + Express** - API server
- **PostgreSQL** - Primary database
- **Redis** - Session management & caching
- **Socket.io** - Real-time messaging
- **Stripe** - Payment processing
- **SendGrid** - Email notifications
- **AWS S3** - File storage (optional, can use local)

### Frontend
- **Next.js** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Query** - Data fetching
- **Zustand** - State management

### Infrastructure
- **Docker** - Containerization
- **Nginx** - Reverse proxy
- **Let's Encrypt** - SSL certificates
- **GitHub Actions** - CI/CD

---

## 9. SECURITY & COMPLIANCE (Simplified)

### Basic HIPAA Compliance
1. **Encryption**
   - HTTPS for all traffic
   - Database encryption at rest
   - Encrypted file storage

2. **Access Control**
   - Role-based permissions
   - Session management
   - Password requirements
   - 2FA for providers

3. **Audit Logging**
   - Track all PHI access
   - User action logs
   - System access logs

4. **Data Retention**
   - 7-year retention policy
   - Secure deletion procedures
   - Backup management

---

## 10. REVENUE MODEL (SIMPLIFIED)

### Primary Revenue Streams

#### Subscription Plans
- **Basic**: $29/month (2 consultations)
- **Premium**: $79/month (5 consultations)
- **Family**: $149/month (10 consultations, 5 members)

#### Additional Services
- **Extra Consultation**: $39 each
- **Urgent Response**: +$20 (2-hour guarantee)
- **Provider Choice**: +$15
- **Follow-up Consultation**: $25

### Projected Revenue (100 Active Patients)
```
30 Basic    × $29  = $870/month
50 Premium  × $79  = $3,950/month
20 Family   × $149 = $2,980/month
-----------------------------------
Monthly Recurring  = $7,800
Annual Projection  = $93,600

Plus ~20% from additional services
Total Annual      = ~$112,000
```

---

## CONCLUSION

This simplified flow focuses on the core telehealth functionality:
1. **Patient intake through website form**
2. **Data storage in PostgreSQL database**
3. **Provider portal for consultation management**
4. **Subscription-based revenue model**
5. **Basic messaging between patients and providers**

No complex integrations required for:
- ❌ Insurance processing
- ❌ Video calls (text/async only)
- ❌ Pharmacy connections
- ❌ Lab integrations
- ❌ Product marketplace

This approach allows for a faster MVP launch with the option to add advanced features later based on user feedback and business growth.
