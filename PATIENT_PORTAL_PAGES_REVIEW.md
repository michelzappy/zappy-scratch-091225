# Patient Portal Pages - Complete Review

**Date:** September 29, 2025  
**Status:** Design System Applied to Dashboard + Sidebar

---

## ✅ Updated Pages (New Design System)

### 1. Dashboard (`dashboard/page.tsx`)
**Status:** ✅ REDESIGNED  
**Colors:** Emerald/rose professional palette  
**Layout:** Clean, horizontal program cards, SVG icons  
**Mock Data:** Needs realistic mock data for preview

### 2. Sidebar (`PatientLayout.tsx`)
**Status:** ✅ REDESIGNED  
**Colors:** Emerald primary, rose accents  
**Navigation:** Clean, consistent hover states

---

## ⚠️ Pages Needing Review & Update

### Core Flows:

#### 3. Messages (`messages/page.tsx`)
**Priority:** HIGH  
**Needs:**
- Match emerald/rose color scheme
- Clean message interface
- Mock conversation data
- Consistent with dashboard design

#### 4. Orders (`orders/page.tsx`)
**Priority:** HIGH  
**Needs:**
- Match emerald/rose colors
- Track shipment interface
- Mock order history
- Clean table/card design

#### 5. Profile (`profile/page.tsx`)
**Priority:** MEDIUM  
**Needs:**
- Match design system
- Clean form layout
- Profile photo upload
- Settings sections

#### 6. Refill Check-in (`refill-checkin/page.tsx`)
**Priority:** HIGH  
**Needs:**
- Match colors
- Multi-step form
- Progress indicator
- Mock medication data

#### 7. New Consultation (`new-consultation/page.tsx`)
**Priority:** HIGH  
**Needs:**
- Simplified flow (per UX review)
- Match colors
- Reduce fields (20+ → 3)
- Professional icons

### Secondary Pages:

#### 8. Consultations List (`consultations/[id]/page.tsx`)
**Priority:** MEDIUM  
**Needs:**
- Match design
- Consultation history
- Status badges
- Mock consultation data

#### 9. Medical Records (`medical-records/page.tsx`)
**Priority:** LOW  
**Needs:**
- Match design
- Document list
- Upload interface

#### 10. Subscription (`subscription/page.tsx`)
**Priority:** MEDIUM  
**Needs:**
- Match design
- Plan details
- Payment info
- Billing history

#### 11. Help (`help/page.tsx`)
**Priority:** LOW  
**Needs:**
- Match design
- FAQ accordion
- Contact form

### Auth Pages (No Layout):

#### 12. Login (`login/page.tsx`)
**Status:** Separate design  
**Needs:** Should match brand colors

#### 13. Register (`register/page.tsx`)
**Status:** Separate design  
**Needs:** Should match brand colors

#### 14. Health Quiz (`health-quiz/page.tsx`)
**Status:** Has design reviews  
**Needs:** Match brand colors

---

## 🎯 Recommended Priority Order

### Phase 1: Critical User Flows
1. ✅ **Dashboard** - DONE
2. ✅ **Sidebar** - DONE
3. **Messages** - Key communication
4. **Orders** - Track medications
5. **Refill Check-in** - Core workflow

### Phase 2: Supporting Pages
6. **New Consultation** - Simplified version
7. **Profile** - Account management
8. **Subscription** - Billing

### Phase 3: Secondary
9. **Consultations History**
10. **Medical Records**
11. **Help**

---

## 📝 Mock Data Needed

### For Dashboard (CURRENT):
```javascript
{
  patient: {
    first_name: "Sarah",
    last_name: "Johnson",
    email: "sarah.j@email.com",
    date_of_birth: "1988-05-15"
  },
  programs: [
    {
      id: "prog-1",
      program_name: "Weight Loss Program",
      category: "weight_loss",
      medication_name: "Semaglutide",
      dosage: "2.4mg",
      frequency: "Once weekly",
      duration: "Ongoing",
      start_date: "2024-09-01",
      next_dose_date: "2025-10-03",
      refills_remaining: 5,
      days_until_refill: 4,
      consultation_id: "consult-1"
    },
    {
      id: "prog-2",
      program_name: "Strength Program",
      category: "strength",
      medication_name: "Testosterone Cypionate",
      dosage: "200mg/ml",
      frequency: "Twice weekly",
      duration: "Ongoing",
      start_date: "2024-08-15",
      next_dose_date: "2025-10-04",
      refills_remaining: 3,
      days_until_refill: 15,
      consultation_id: "consult-2"
    }
  ],
  orders: [
    {
      id: "order-1",
      order_number: "ORD-2025-0234",
      created_at: "2025-09-25",
      status: "shipped",
      tracking_number: "1Z999AA10123456784",
      estimated_delivery: "2025-10-03",
      total_amount: 249.00,
      items: [
        {
          medication_name: "Semaglutide 2.4mg",
          quantity: 4
        }
      ]
    }
  ],
  stats: {
    active_prescriptions: 2,
    total_orders: 8,
    total_consultations: 3,
    unread_messages: 2
  }
}
```

### For Messages:
```javascript
{
  conversations: [
    {
      id: "conv-1",
      provider: {
        name: "Dr. Emily Roberts",
        specialty: "Internal Medicine",
        avatar: "/providers/dr-roberts.jpg"
      },
      last_message: "Your lab results look great! Let's continue...",
      last_message_at: "2025-09-29T14:30:00Z",
      unread_count: 2,
      consultation_id: "consult-1"
    }
  ],
  messages: [
    {
      id: "msg-1",
      sender_type: "patient",
      content: "Hi Dr. Roberts, I've been experiencing...",
      created_at: "2025-09-29T10:00:00Z"
    },
    {
      id: "msg-2",
      sender_type: "provider",
      content: "Thank you for reaching out. Let's review...",
      created_at: "2025-09-29T14:30:00Z"
    }
  ]
}
```

### For Orders:
```javascript
{
  orders: [
    {
      id: "order-1",
      order_number: "ORD-2025-0234",
      placed_date: "2025-09-25",
      status: "shipped",
      tracking_number: "1Z999AA10123456784",
      estimated_delivery: "2025-10-03",
      shipped_date: "2025-09-26",
      carrier: "UPS",
      total: 249.00,
      items: [
        {
          name: "Semaglutide 2.4mg",
          quantity: 4,
          price: 249.00
        }
      ],
      shipping_address: {
        street: "123 Main St",
        city: "San Francisco",
        state: "CA",
        zip: "94102"
      }
    },
    {
      id: "order-2",
      order_number: "ORD-2025-0189",
      placed_date: "2025-08-28",
      status: "delivered",
      tracking_number: "1Z999AA10123456123",
      delivered_date: "2025-09-02",
      total: 249.00
    }
  ]
}
```

---

## 🎨 Design System Components Needed

### Reusable Components:
1. **StatusBadge** - Emerald/amber/rose variants
2. **Card** - Consistent white card with shadow
3. **Button** - Primary (emerald), secondary (slate), danger (rose)
4. **Table** - Clean data tables
5. **Timeline** - Order tracking, consultation history
6. **MessageBubble** - Chat interface
7. **Form** - Consistent input styles

### Color Tokens:
```css
--primary: emerald-500/600
--accent: rose-400/500
--success: emerald-500
--warning: amber-500
--error: rose-500
--neutral: slate-50/100/200
--text: slate-600/700/900
--bg: slate-50
--card: white
```

---

## 📱 Mobile Considerations

All pages need to be tested for:
- Single column layout
- Touch-friendly buttons (44px min)
- Readable text (16px min)
- Easy scrolling
- No horizontal overflow

---

## 🚀 Next Steps

### Immediate (Today):
1. Add realistic mock data to dashboard
2. Preview dashboard with mock data
3. Update Messages page design
4. Update Orders page design

### This Week:
5. Update Refill Check-in page
6. Simplify New Consultation
7. Update Profile page
8. Test all pages on mobile

### Next Week:
9. Update remaining secondary pages
10. Create reusable component library
11. User testing with real patients
12. Final polish and deployment

---

## 📊 Progress Tracker

**Updated:** 2 / 14 pages (14%)  
**Priority Pages:** 2 / 5 done (40%)  
**Design System:** Defined ✅  
**Mock Data:** Needs implementation

---

**Recommendation:** Focus on Priority Phase 1 pages first (Messages, Orders, Refill Check-in) to complete core user journeys before moving to secondary pages.
