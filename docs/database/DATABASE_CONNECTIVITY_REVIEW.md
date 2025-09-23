# Database Connectivity & Schema Review

## Executive Summary
After reviewing the database schema and backend routes, I've identified several critical mismatches between the database tables and the backend code that will cause runtime errors.

## 🚨 Critical Issues: Missing Tables

### 1. **support_tickets** Table
- **Referenced in:** `backend/src/routes/admin.js`
- **Status:** ❌ NOT EXISTS in schema
- **Impact:** Admin dashboard metrics will fail
- **Fix Required:** Create support_tickets table

### 2. **inventory** Table  
- **Referenced in:** Multiple routes (orders.js, provider-consultations.js)
- **Status:** ❌ NOT EXISTS (only `medications` table exists)
- **Impact:** Order creation and medication lookup will fail
- **Fix Required:** Either create inventory table or update routes to use medications

### 3. **consultation_messages** Table
- **Referenced in:** `backend/src/routes/providers.js`, `patients.js`
- **Status:** ❌ NOT EXISTS (only `messages` table exists)
- **Impact:** Message counts and unread messages will fail
- **Fix Required:** Update routes to use `messages` table

### 4. **analytics_events** Table
- **Referenced in:** `backend/src/routes/admin.js`
- **Status:** ❌ NOT EXISTS in schema
- **Impact:** Analytics tracking will fail
- **Fix Required:** Create analytics_events table

## ⚠️ Column Mismatches

### patients Table
| Referenced Column | Actual Column | Location |
|-------------------|---------------|----------|
| `is_active` | Does not exist | admin.js |
| `subscription_tier` | `subscription_status` | multiple files |
| `subscription_active` | Does not exist | patients.js |
| `gender` | Does not exist | providers.js |

### providers Table
| Referenced Column | Actual Column | Location |
|-------------------|---------------|----------|
| `is_available` | `available_for_consultations` | admin.js |
| `rating` | Does not exist | providers.js |
| `total_reviews` | Does not exist | providers.js |

### consultations Table
| Referenced Column | Actual Column | Location |
|-------------------|---------------|----------|
| `submitted_at` | `created_at` | multiple files |
| `assigned_at` | Does not exist | admin.js, providers.js |
| `urgency` | Does not exist | admin.js |

### orders Table
| Referenced Column | Actual Column | Location |
|-------------------|---------------|----------|
| `fulfillment_status` | Does not exist | admin.js |

## ✅ Properly Connected Tables

These tables are correctly referenced and connected:
- ✅ patients → consultations (via patient_id)
- ✅ providers → consultations (via provider_id)
- ✅ consultations → prescriptions (via consultation_id)
- ✅ consultations → orders (via consultation_id)
- ✅ prescriptions → prescription_items (via prescription_id)
- ✅ orders → order_items (via order_id)
- ✅ consultations → messages (via consultation_id)
- ✅ patients → patient_documents (via patient_id)
- ✅ treatment_plans → consultations (via selected_plan_id)

## 🔧 Required Schema Additions

### 1. Create support_tickets Table
```sql
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID,
    requester_type VARCHAR(50), -- patient, provider, admin
    requester_email VARCHAR(255),
    category VARCHAR(100),
    subject VARCHAR(255),
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    status VARCHAR(50) DEFAULT 'open', -- open, in_progress, resolved, closed
    assigned_to UUID REFERENCES admins(id),
    assigned_at TIMESTAMP,
    resolved_at TIMESTAMP,
    resolution TEXT,
    related_consultation_id UUID REFERENCES consultations(id),
    related_order_id UUID REFERENCES orders(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Create inventory Table
```sql
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medication_id UUID REFERENCES medications(id),
    medication_name VARCHAR(255),
    sku VARCHAR(100) UNIQUE,
    category VARCHAR(100),
    quantity_on_hand INTEGER DEFAULT 0,
    quantity_reserved INTEGER DEFAULT 0,
    reorder_point INTEGER DEFAULT 100,
    retail_price DECIMAL(10,2),
    subscription_price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Create analytics_events Table
```sql
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_type VARCHAR(50),
    event_type VARCHAR(100),
    event_category VARCHAR(100),
    event_action VARCHAR(100),
    event_label VARCHAR(255),
    event_value DECIMAL(10,2),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Add Missing Columns
```sql
-- Add to patients table
ALTER TABLE patients 
ADD COLUMN is_active BOOLEAN DEFAULT true,
ADD COLUMN subscription_tier VARCHAR(50),
ADD COLUMN gender VARCHAR(20);

-- Add to providers table  
ALTER TABLE providers
ADD COLUMN is_available BOOLEAN DEFAULT true,
ADD COLUMN rating DECIMAL(3,2),
ADD COLUMN total_reviews INTEGER DEFAULT 0;

-- Add to consultations table
ALTER TABLE consultations
ADD COLUMN submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN assigned_at TIMESTAMP,
ADD COLUMN urgency VARCHAR(20);

-- Add to orders table
ALTER TABLE orders
ADD COLUMN fulfillment_status VARCHAR(50) DEFAULT 'pending';
```

## 📋 Action Plan

### Immediate (Critical):
1. **Create missing tables migration** (`005_missing_tables.sql`)
   - support_tickets
   - inventory
   - analytics_events

2. **Update column references** (`006_column_fixes.sql`)
   - Add missing columns
   - Create aliases or views for mismatched names

3. **Fix route queries**
   - Update `consultation_messages` → `messages`
   - Update column names to match schema

### Short-term:
1. **Data integrity checks**
   - Add foreign key constraints where missing
   - Add check constraints for enums
   - Add indexes for performance

2. **Create database views**
   - Create view for consultation_messages → messages
   - Create materialized views for analytics

### Long-term:
1. **Schema documentation**
   - Document all table relationships
   - Create ER diagram
   - Document business rules

## Summary

The database schema has significant gaps that will cause application failures:
- 4 missing tables referenced in code
- 15+ column mismatches
- Missing foreign key relationships

These issues must be fixed before the application can run properly. The good news is that the core relationships (patients → consultations → prescriptions → orders) are properly structured.
