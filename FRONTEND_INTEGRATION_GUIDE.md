# Frontend Integration Guide - MVP Wellness Backend

**Goal:** Connect your existing frontend pages to the new MVP wellness backend endpoints.

---

## 🎯 Overview

Your frontend is **90% ready**! You have:
- ✅ Patient check-in page (`/patient/refill-checkin`)
- ✅ Provider review page (`/portal/checkin-reviews`)
- ✅ Beautiful UI and UX

**What needs updating:** Just the API endpoints and data structure.

---

## 📋 Integration Summary

| Frontend Page | Current Endpoint | New MVP Endpoint | Status |
|--------------|------------------|------------------|---------|
| Refill Check-in | `/api/refill-checkins` | `/api/checkins` | 🔄 Update |
| Provider Queue | `/api/checkin-reviews` | `/api/provider/queue` | 🔄 Update |
| Provider Review | `/api/checkin-reviews/:id` | `/api/checkins/:id/review` | 🔄 Update |
| Progress Chart | N/A | `/api/progress/:consultationId` | ➕ Add New |

---

## 🔧 Step 1: Update Patient Check-in Page

**File:** `frontend/src/app/patient/refill-checkin/page.tsx`

### Current Code (Line ~63):
```typescript
const response = await api.post('/refill-checkins', checkInData);
```

### Change To:
```typescript
// MVP wellness endpoint
const response = await api.post('/checkins', {
  consultationId: prescriptionId, // or get from program enrollment
  metricValue: responses.current_weight || responses.effectiveness,
  notes: responses.provider_questions || ''
});
```

### Data Mapping:
```typescript
// OLD structure:
{
  prescription_id: 'uuid',
  responses: {...},
  side_effects: [...],
  has_red_flags: boolean,
  red_flags: [...],
  weight_log: number,
  photos_urls: [...]
}

// NEW MVP structure (simpler):
{
  consultationId: 'uuid',
  metricValue: 198,  // weight OR energy 1-10
  notes: 'Feeling great!'
}
```

### Full Updated Function:
```typescript
const submitCheckIn = async () => {
  setLoading(true);
  try {
    // Determine metric value based on program type
    let metricValue;
    if (prescription?.category === 'weight-loss') {
      metricValue = responses.current_weight;
    } else {
      // For strength/longevity, use effectiveness as energy level
      metricValue = responses.effectiveness;
    }

    // Simplified check-in data for MVP
    const checkInData = {
      consultationId: prescriptionId,
      metricValue: parseFloat(metricValue),
      notes: [
        responses.taking_as_prescribed && `Compliance: ${responses.taking_as_prescribed}`,
        responses.health_changes && `Health changes: ${responses.health_changes}`,
        responses.provider_questions && `Questions: ${responses.provider_questions}`,
        sideEffects.length > 0 && `Side effects: ${sideEffects.map(se => `${se.effect} (${se.severity}/10)`).join(', ')}`
      ].filter(Boolean).join('\n\n')
    };

    const response = await api.post('/checkins', checkInData);

    if (response.data.success) {
      router.push('/patient/dashboard?checkin=complete');
    }
  } catch (error) {
    console.error('Error submitting check-in:', error);
  } finally {
    setLoading(false);
  }
};
```

---

## 🔧 Step 2: Update Provider Queue Page

**File:** `frontend/src/app/portal/checkin-reviews/page.tsx`

### Current Code (Line ~40):
```typescript
const response = await fetch('/api/checkin-reviews', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

### Change To:
```typescript
const response = await fetch('/api/provider/queue', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

### Data Mapping:
```typescript
// OLD structure:
{
  id: '1',
  patientName: 'John Smith',
  checkinDate: '2024-12-09',
  status: 'pending',
  type: 'routine',
  symptoms: ['Headache'],
  priority: 'medium',
  assignedProvider: 'Dr. Sarah'
}

// NEW MVP structure:
{
  checkin_id: '1',
  date: '2024-12-09',
  metric_value: 198,
  notes: 'Feeling good',
  program_type: 'weight_loss',
  patient_id: 'uuid',
  first_name: 'John',
  last_name: 'Smith',
  email: 'john@example.com',
  consultation_id: 'uuid',
  baseline_metric: {weight: 200},
  goal_metric: {weight: 170},
  previous_metric: 200  // for comparison
}
```

### Full Updated Function:
```typescript
const loadCheckinReviews = async () => {
  try {
    const response = await fetch('/api/provider/queue', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      // Transform to match existing UI expectations
      const transformed = data.data.queue.map((item: any) => ({
        id: item.checkin_id,
        patientName: `${item.first_name} ${item.last_name}`,
        checkinDate: item.date,
        status: 'pending', // all items in queue are pending
        type: item.program_type, // 'weight_loss', 'strength', 'longevity'
        symptoms: [], // not used in MVP
        priority: determinePriority(item), // custom logic
        assignedProvider: 'Current User', // since it's filtered by provider
        metricValue: item.metric_value,
        previousMetric: item.previous_metric,
        notes: item.notes,
        consultationId: item.consultation_id
      }));
      
      setCheckinReviews(transformed);
    }
  } catch (err) {
    setError('Failed to load checkin reviews. Please try again.');
  } finally {
    setLoading(false);
  }
};

// Helper function to determine priority
const determinePriority = (item: any) => {
  // Weight loss: big change = high priority
  if (item.program_type === 'weight_loss') {
    const change = item.previous_metric - item.metric_value;
    if (Math.abs(change) > 5) return 'high'; // Lost/gained >5 lbs
    if (Math.abs(change) > 2) return 'medium';
    return 'low';
  }
  
  // Energy: low energy = higher priority
  if (item.program_type === 'strength' || item.program_type === 'longevity') {
    if (item.metric_value <= 3) return 'high'; // Very low energy
    if (item.metric_value <= 6) return 'medium';
    return 'low';
  }
  
  return 'medium';
};
```

---

## 🔧 Step 3: Update Provider Review Action

**File:** `frontend/src/app/portal/checkin-reviews/page.tsx`

### Current Code (Line ~107):
```typescript
const response = await fetch(`/api/checkin-reviews/${reviewId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({ status: newStatus })
});
```

### Change To:
```typescript
const response = await fetch(`/api/checkins/${reviewId}/review`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({
    response: 'Great progress! Keep it up.', // Provider message
    action: 'continue' // 'continue', 'adjust_dose', 'request_info'
  })
});
```

### Full Updated Function with Dialog:
```typescript
const [reviewDialog, setReviewDialog] = useState<{show: boolean, reviewId: string | null}>({
  show: false,
  reviewId: null
});
const [reviewMessage, setReviewMessage] = useState('');
const [reviewAction, setReviewAction] = useState('continue');

const handleReviewUpdate = async (reviewId: string) => {
  try {
    const response = await fetch(`/api/checkins/${reviewId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        response: reviewMessage || 'Reviewed and approved',
        action: reviewAction
      })
    });

    if (response.ok) {
      // Remove from queue since it's now reviewed
      setCheckinReviews(prev => prev.filter(r => r.id !== reviewId));
      setReviewDialog({ show: false, reviewId: null });
