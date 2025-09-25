# Referral Management System Architecture

## Overview

Comprehensive referral management system for the Zappy Health telehealth platform, enabling patients to refer friends and family while providing providers with tools to manage and track referral programs.

## Complexity Assessment: **MEDIUM** (4-6 weeks implementation)

### Effort Breakdown:
- **Database Design & Migration**: 1 week
- **Backend API Development**: 1-2 weeks  
- **Patient Portal Integration**: 1-2 weeks
- **Provider Portal Management**: 1-2 weeks
- **Testing & Documentation**: 1 week

---

## 1. Database Architecture

### Core Referral Tables

```sql
-- Referral programs/campaigns
CREATE TABLE referral_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    program_type VARCHAR(50) DEFAULT 'standard', -- standard, specialty, seasonal
    
    -- Rewards
    referrer_reward_type VARCHAR(50), -- credit, discount, cash, free_consultation
    referrer_reward_value DECIMAL(10,2),
    referee_reward_type VARCHAR(50), -- discount, free_consultation, credit
    referee_reward_value DECIMAL(10,2),
    
    -- Program rules
    max_referrals_per_patient INTEGER, -- null = unlimited
    reward_threshold INTEGER DEFAULT 1, -- referrals needed for reward
    expiry_days INTEGER DEFAULT 30, -- days for referee to redeem
    
    -- Status and scheduling
    status VARCHAR(50) DEFAULT 'active', -- active, paused, ended
    start_date DATE,
    end_date DATE,
    
    -- Targeting
    target_conditions TEXT[], -- specific conditions this program targets
    target_demographics JSONB, -- age ranges, locations, etc.
    
    created_by UUID REFERENCES providers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual referrals
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referral_code VARCHAR(20) UNIQUE NOT NULL, -- Generated unique code
    
    -- Parties involved
    referrer_id UUID NOT NULL REFERENCES patients(id), -- Who made the referral
    referee_email VARCHAR(255) NOT NULL, -- Who was referred
    referee_phone VARCHAR(20),
    referee_name VARCHAR(200),
    referee_patient_id UUID REFERENCES patients(id), -- Set when they register
    
    -- Program and tracking
    program_id UUID NOT NULL REFERENCES referral_programs(id),
    referral_source VARCHAR(100), -- email, sms, social, direct_link
    referral_message TEXT, -- Custom message from referrer
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending', -- pending, registered, converted, expired, declined
    
    -- Conversion tracking
    referee_registered_at TIMESTAMP WITH TIME ZONE,
    first_consultation_id UUID REFERENCES consultations(id),
    first_order_id UUID REFERENCES orders(id),
    converted_at TIMESTAMP WITH TIME ZONE, -- When they became a paying customer
    
    -- Rewards
    referrer_reward_status VARCHAR(50) DEFAULT 'pending', -- pending, earned, redeemed, expired
    referrer_reward_earned_at TIMESTAMP WITH TIME ZONE,
    referrer_reward_redeemed_at TIMESTAMP WITH TIME ZONE,
    referrer_reward_amount DECIMAL(10,2),
    
    referee_reward_status VARCHAR(50) DEFAULT 'pending',
    referee_reward_redeemed_at TIMESTAMP WITH TIME ZONE,
    referee_reward_amount DECIMAL(10,2),
    
    -- Tracking
    clicks INTEGER DEFAULT 0,
    last_clicked_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral interactions (clicks, emails sent, etc.)
CREATE TABLE referral_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
    
    interaction_type VARCHAR(50) NOT NULL, -- click, email_sent, sms_sent, registration, conversion
    ip_address INET,
    user_agent TEXT,
    source VARCHAR(100), -- social media platform, email client, etc.
    metadata JSONB, -- Additional tracking data
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral rewards/credits ledger
CREATE TABLE referral_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referral_id UUID NOT NULL REFERENCES referrals(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    
    reward_type VARCHAR(50) NOT NULL, -- credit, discount, cash, free_consultation
    reward_amount DECIMAL(10,2),
    reward_description TEXT,
    
    -- Usage tracking
    status VARCHAR(50) DEFAULT 'available', -- available, used, expired, cancelled
    used_on_order_id UUID REFERENCES orders(id),
    used_on_consultation_id UUID REFERENCES consultations(id),
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referee_email ON referrals(referee_email);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referral_programs_status ON referral_programs(status);
CREATE INDEX idx_referral_rewards_patient ON referral_rewards(patient_id, status);
```

---

## 2. Backend API Architecture

### Service Layer Structure

```
backend/src/services/
├── referral.service.js              # Core referral management
├── referral-program.service.js      # Program/campaign management
├── referral-tracking.service.js     # Analytics and tracking
└── referral-rewards.service.js      # Reward management
```

### API Endpoints

```javascript
// Patient Portal APIs
GET    /api/patients/me/referrals           # Get my referrals
POST   /api/patients/me/referrals           # Create new referral
GET    /api/patients/me/referrals/:id       # Get referral details
GET    /api/patients/me/rewards             # Get my available rewards/credits

// Public referral redemption
GET    /api/referrals/:code                 # Get referral details by code
POST   /api/referrals/:code/register        # Register using referral code
GET    /api/referrals/:code/click           # Track referral link click

// Provider Portal APIs
GET    /api/referral-programs               # List referral programs
POST   /api/referral-programs               # Create new program
GET    /api/referral-programs/:id           # Get program details
PUT    /api/referral-programs/:id           # Update program
DELETE /api/referral-programs/:id           # Delete program

GET    /api/referrals                       # List all referrals (with filters)
GET    /api/referrals/analytics             # Referral analytics dashboard
GET    /api/referrals/performance           # Performance metrics

// Admin APIs
POST   /api/referrals/:id/approve-reward    # Approve reward
POST   /api/referrals/bulk-operations       # Bulk operations
GET    /api/referrals/audit-trail           # HIPAA audit trail
```

---

## 3. Frontend Architecture - Patient Portal

### Patient Portal Navigation Integration

Add to patient layout navigation:

```javascript
// Add to patient portal navigation
{
  name: 'Refer Friends',
  href: '/patient/referrals',
  icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  description: 'Refer friends and earn rewards'
}
```

### Patient Portal Pages

```
frontend/src/app/patient/
├── referrals/
│   ├── page.tsx                    # Main referral dashboard
│   ├── new/
│   │   └── page.tsx                # Create new referral
│   ├── [id]/
│   │   └── page.tsx                # Referral tracking details
│   └── rewards/
│       └── page.tsx                # My rewards/credits
```

### Key Patient Components

```javascript
// ReferralDashboard.tsx - Main dashboard for patients
const ReferralDashboard = () => (
  <div className="space-y-6">
    {/* Referral Stats */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard title="Total Referrals" value={referralStats.total} />
      <StatCard title="Successful" value={referralStats.converted} />
      <StatCard title="Rewards Earned" value={`$${referralStats.rewardsEarned}`} />
    </div>
    
    {/* Quick Actions */}
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Refer a Friend</h3>
      <ReferralForm onSubmit={createReferral} />
    </div>
    
    {/* My Referrals */}
    <ReferralList referrals={referrals} />
    
    {/* Available Rewards */}
    <RewardsList rewards={availableRewards} />
  </div>
);

// ReferralForm.tsx - Create new referral
const ReferralForm = ({ onSubmit }) => (
  <form onSubmit={handleSubmit}>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <input placeholder="Friend's Email" type="email" required />
      <input placeholder="Friend's Phone (optional)" type="tel" />
      <input placeholder="Friend's Name" type="text" />
      <select>
        <option>How do you want to share?</option>
        <option value="email">Send Email</option>
        <option value="sms">Send SMS</option>
        <option value="link">Get Shareable Link</option>
      </select>
    </div>
    <textarea placeholder="Personal message (optional)" className="mt-4" />
    <button type="submit" className="mt-4 bg-blue-600 text-white px-6 py-2 rounded">
      Send Referral
    </button>
  </form>
);
```

---

## 4. Frontend Architecture - Provider Portal

### Provider Portal Navigation Integration

Add to UnifiedPortalLayout.tsx after line 285:

```javascript
{
  name: 'Referrals',
  href: '/portal/referrals',
  icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  badge: null,
  roles: ['admin', 'provider-admin', 'super-admin'], // Admin roles only
  section: 'admin'
}
```

### Provider Portal Pages

```
frontend/src/app/portal/
├── referrals/
│   ├── page.tsx                    # Referral management dashboard
│   ├── programs/
│   │   ├── page.tsx                # Referral programs list
│   │   ├── new/
│   │   │   └── page.tsx            # Create new program
│   │   └── [id]/
│   │       ├── page.tsx            # Program details
│   │       └── edit/
│   │           └── page.tsx        # Edit program
│   ├── analytics/
│   │   └── page.tsx                # Referral analytics
│   └── rewards/
│       └── page.tsx                # Reward management
```

### Key Provider Components

```javascript
// ReferralManagementDashboard.tsx
const ReferralManagementDashboard = () => (
  <div className="space-y-6">
    {/* Analytics Overview */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <MetricCard title="Total Referrals" value={metrics.totalReferrals} />
      <MetricCard title="Conversion Rate" value={`${metrics.conversionRate}%`} />
      <MetricCard title="Active Programs" value={metrics.activePrograms} />
      <MetricCard title="Rewards Paid" value={`$${metrics.rewardsPaid}`} />
    </div>
    
    {/* Quick Actions */}
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold">Referral Programs</h2>
      <Link href="/portal/referrals/programs/new" className="btn-primary">
        Create Program
      </Link>
    </div>
    
    {/* Recent Activity */}
    <RecentReferralActivity activities={recentActivity} />
    
    {/* Program Performance */}
    <ProgramPerformanceChart programs={programs} />
  </div>
);

// ReferralProgramForm.tsx - Create/edit referral programs
const ReferralProgramForm = ({ program = null }) => (
  <form onSubmit={handleSubmit}>
    <div className="space-y-6">
      {/* Basic Info */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Program Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input placeholder="Program Name" defaultValue={program?.name} />
          <select defaultValue={program?.program_type}>
            <option value="standard">Standard Referral</option>
            <option value="specialty">Specialty Program</option>
            <option value="seasonal">Seasonal Campaign</option>
          </select>
        </div>
        <textarea placeholder="Program Description" className="mt-4" />
      </div>
      
      {/* Rewards */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Rewards Structure</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Referrer Reward</label>
            <div className="flex space-x-2">
              <select name="referrer_reward_type">
                <option value="credit">Account Credit</option>
                <option value="discount">Discount %</option>
                <option value="free_consultation">Free Consultation</option>
              </select>
              <input type="number" placeholder="Amount" name="referrer_reward_value" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Referee Reward</label>
            <div className="flex space-x-2">
              <select name="referee_reward_type">
                <option value="discount">Discount %</option>
                <option value="free_consultation">Free Consultation</option>
                <option value="credit">Account Credit</option>
              </select>
              <input type="number" placeholder="Amount" name="referee_reward_value" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Program Rules */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Program Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input type="number" placeholder="Max referrals per patient" />
          <input type="number" placeholder="Reward threshold" />
          <input type="number" placeholder="Expiry days" />
        </div>
      </div>
      
      <button type="submit" className="btn-primary">
        {program ? 'Update Program' : 'Create Program'}
      </button>
    </div>
  </form>
);
```

---

## 5. Workflow Integration

### Registration Flow Enhancement

```javascript
// Enhanced registration to handle referral codes
const RegistrationForm = () => {
  const referralCode = useSearchParams().get('ref');
  
  return (
    <form onSubmit={handleRegistration}>
      {/* Standard registration fields */}
      
      {/* Referral code section */}
      {referralCode && (
        <div className="bg-green-50 border border-green-200 p-4 rounded">
          <h3 className="font-semibold text-green-800">
            You've been referred by a friend!
          </h3>
          <p className="text-green-600">
            Complete registration to unlock your welcome bonus.
          </p>
          <input type="hidden" name="referral_code" value={referralCode} />
        </div>
      )}
      
      <button type="submit">Register & Claim Bonus</button>
    </form>
  );
};
```

### Consultation Integration

```javascript
// Track referral conversion during first consultation
const ConsultationService = {
  async submitConsultation(consultationData) {
    const result = await api.post('/consultations', consultationData);
    
    // Check if this is a referred patient's first consultation
    if (result.patient.referral_code) {
      await this.trackReferralConversion(result.consultation.id, result.patient.referral_code);
    }
    
    return result;
  }
};
```

---

## 6. Notification & Communication System

### Email Templates

```javascript
// Referral invitation email
const ReferralInvitationEmail = ({ referrer, referee, referralCode, program }) => `
  <h2>Your friend ${referrer.firstName} thinks you'd love Zappy Health!</h2>
  
  <p>${referrer.firstName} has invited you to try our telehealth platform.</p>
  
  <div class="reward-highlight">
    <h3>Your Welcome Bonus: ${program.referee_reward_value}% off your first consultation!</h3>
  </div>
  
  <a href="${process.env.FRONTEND_URL}/register?ref=${referralCode}" class="cta-button">
    Claim Your Bonus & Get Started
  </a>
  
  <p>This offer expires in ${program.expiry_days} days.</p>
`;

// Reward earned notification
const RewardEarnedEmail = ({ patient, referral, reward }) => `
  <h2>Congratulations! Your referral reward is ready!</h2>
  
  <p>Great news! ${referral.referee_name} just completed their first consultation.</p>
  
  <div class="reward-earned">
    <h3>You've earned: $${reward.reward_amount} credit!</h3>
    <p>Available in your account now</p>
  </div>
`;
```

### SMS Integration

```javascript
// SMS referral invitation
const sendReferralSMS = async (phoneNumber, referrerName, referralCode) => {
  const message = `${referrerName} invited you to try Zappy Health! Get 20% off your first consultation: ${process.env.FRONTEND_URL}/register?ref=${referralCode}`;
  
  await smsService.send(phoneNumber, message);
};
```

---

## 7. Analytics & Reporting

### Provider Analytics Dashboard

```javascript
const ReferralAnalytics = () => (
  <div className="space-y-6">
    {/* Performance Overview */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <AnalyticsCard title="Total Referrals" value={analytics.totalReferrals} />
      <AnalyticsCard title="Conversion Rate" value={`${analytics.conversionRate}%`} />
      <AnalyticsCard title="Average Reward Cost" value={`$${analytics.avgRewardCost}`} />
      <AnalyticsCard title="Customer LTV from Referrals" value={`$${analytics.customerLTV}`} />
    </div>
    
    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ReferralTrendsChart data={analytics.trends} />
      <ConversionFunnelChart data={analytics.funnel} />
      <ProgramPerformanceChart data={analytics.programs} />
      <RewardROIChart data={analytics.roi} />
    </div>
    
    {/* Top Referrers */}
    <TopReferrersTable patients={analytics.topReferrers} />
  </div>
);
```

---

## 8. Security & Compliance

### HIPAA Compliance

- All referral tracking logged via existing `hipaaAuditLogger`
- Patient referral data considered PHI
- Referral codes generated with crypto-secure randomness
- Access controls based on existing role system

### Privacy Considerations

```javascript
const ReferralPrivacyService = {
  // Hash email addresses for privacy
  hashRefereeEmail(email) {
    return bcrypt.hashSync(email, 12);
  },
  
  // Generate secure referral codes
  generateReferralCode() {
    return crypto.randomBytes(10).toString('hex').toUpperCase();
  },
  
  // Anonymize referral data for analytics
  anonymizeReferralData(referrals) {
    return referrals.map(r => ({
      ...r,
      referee_email: this.hashRefereeEmail(r.referee_email),
      referee_phone: null,
      referee_name: 'Anonymous'
    }));
  }
};
```

---

## 9. Implementation Timeline

### **Phase 1: Foundation** (Week 1)
- Database schema creation and migration
- Core referral service APIs
- Basic referral code generation

### **Phase 2: Patient Experience** (Weeks 2-3)
- Patient portal referral pages
- Referral creation and sharing
- Registration flow integration
- Email/SMS invitation system

### **Phase 3: Provider Management** (Weeks 3-4)
- Provider portal referral management
- Program creation and management
- Analytics dashboard
- Reward approval workflows

### **Phase 4: Advanced Features** (Weeks 5-6)
- Advanced analytics and reporting
- A/B testing for referral programs
- Integration with existing consultation workflow
- Performance optimization

---

## 10. Integration Points

### Existing System Integrations

- **Authentication**: Uses existing role-based system
- **Email Service**: Leverages existing SendGrid integration
- **SMS Service**: Uses existing Twilio integration  
- **Audit Logging**: Integrates with HIPAA audit system
- **Payment System**: Connects to Stripe for reward processing
- **Analytics**: Extends existing analytics_events table

### API Integration Examples

```javascript
// Integration with existing consultation flow
app.post('/api/consultations', requireAuth, async (req, res) => {
  const consultation = await consultationService.create(req.body);
  
  // Check for referral conversion
  if (req.user.referral_source) {
    await referralService.trackConversion(req.user.id, consultation.id);
  }
  
  res.json(consultation);
});

// Integration with existing order system  
app.post('/api/orders', requireAuth, async (req, res) => {
  // Apply referral rewards/discounts
  const availableRewards = await referralService.getAvailableRewards(req.user.id);
  const order = await orderService.createWithRewards(req.body, availableRewards);
  
  res.json(order);
});
```

---

## **Final Assessment**

**Complexity: MEDIUM** (4-6 weeks with 2 developers)

**Key Benefits:**
- **Growth**: Organic patient acquisition through referrals
- **Retention**: Rewards encourage platform engagement  
- **Analytics**: Track referral program effectiveness
- **Automation**: Streamlined referral workflow

**Integration Advantages:**
- Leverages existing authentication and role system
- Uses established communication channels (email/SMS)
- Integrates with current payment processing
- Maintains HIPAA compliance standards

**Risk Level: LOW-MEDIUM**
- Well-defined requirements
- Clear integration points
- Established patterns to follow
- No critical system dependencies

This referral management system provides a comprehensive solution for both patient acquisition and retention while maintaining the security and compliance standards of the healthcare platform.