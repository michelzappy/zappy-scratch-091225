# Service Layer Architecture Explanation

## What is a Service Layer?

A **Service Layer** is a design pattern that separates business logic from route handlers (controllers). It creates a middle layer between your API routes and your database/external services.

## Current Problem in Your Code

Right now, your backend routes mix everything together:
- Database queries
- Business logic
- Validation
- External API calls
- Response formatting

This makes files large, hard to test, and difficult to maintain.

## Example from Your Current Code

### ❌ Current Approach (No Service Layer)
Looking at your `backend/src/routes/admin.js`:

```javascript
// Everything is mixed in the route handler
router.get('/metrics', async (req, res) => {
  try {
    // Direct database query in route
    const totalPatients = await db.query('SELECT COUNT(*) FROM patients');
    
    // Business logic in route
    const activeConsultations = await db.query(`
      SELECT COUNT(*) FROM consultations 
      WHERE status = 'active' 
      AND created_at > NOW() - INTERVAL '30 days'
    `);
    
    // Data formatting in route
    const metrics = {
      patients: totalPatients.rows[0].count,
      consultations: activeConsultations.rows[0].count,
      // ... more logic
    };
    
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### ✅ With Service Layer Architecture

The same code would be split into layers:

#### 1. Route Handler (`routes/admin.js`)
```javascript
// Route only handles HTTP concerns
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await adminService.getDashboardMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### 2. Service Layer (`services/admin.service.js`)
```javascript
// Service handles business logic
class AdminService {
  async getDashboardMetrics() {
    const [patients, consultations, revenue] = await Promise.all([
      this.getTotalPatients(),
      this.getActiveConsultations(),
      this.getMonthlyRevenue()
    ]);
    
    // Business logic for calculating metrics
    return {
      patients,
      consultations,
      revenue,
      growthRate: this.calculateGrowthRate(patients, consultations)
    };
  }
  
  async getTotalPatients() {
    return await patientRepository.count();
  }
  
  async getActiveConsultations() {
    return await consultationRepository.countActive(30);
  }
  
  calculateGrowthRate(patients, consultations) {
    // Complex business logic here
    return (consultations / patients) * 100;
  }
}
```

#### 3. Repository Layer (`repositories/patient.repository.js`)
```javascript
// Repository handles database queries
class PatientRepository {
  async count() {
    const result = await db.query('SELECT COUNT(*) FROM patients');
    return result.rows[0].count;
  }
  
  async findById(id) {
    const result = await db.query('SELECT * FROM patients WHERE id = $1', [id]);
    return result.rows[0];
  }
  
  async findActive() {
    const result = await db.query('SELECT * FROM patients WHERE status = $1', ['active']);
    return result.rows;
  }
}
```

## Benefits of Service Layer Architecture

### 1. **Separation of Concerns**
- Routes handle HTTP (request/response)
- Services handle business logic
- Repositories handle database access

### 2. **Reusability**
```javascript
// Service methods can be used in multiple routes
router.get('/dashboard', async (req, res) => {
  const metrics = await adminService.getDashboardMetrics();
  // ...
});

router.get('/reports', async (req, res) => {
  const metrics = await adminService.getDashboardMetrics();
  // ...
});
```

### 3. **Easier Testing**
```javascript
// You can test business logic without HTTP layer
describe('AdminService', () => {
  it('should calculate growth rate correctly', () => {
    const service = new AdminService();
    const rate = service.calculateGrowthRate(100, 25);
    expect(rate).toBe(25);
  });
});
```

### 4. **Maintainability**
- Smaller, focused files
- Clear responsibility boundaries
- Easy to find and fix bugs

### 5. **Flexibility**
- Easy to swap database (just change repository)
- Easy to add caching (add it in service layer)
- Easy to change business rules (modify service)

## Real Example for Your Consultation Flow

### Current Problem in `routes/consultations.js`:
```javascript
router.post('/submit', async (req, res) => {
  // 200+ lines of mixed code:
  // - Validation
  // - File handling
  // - Database queries
  // - Pharmacy API calls
  // - Email sending
  // All in one route handler!
});
```

### With Service Layer:
```javascript
// routes/consultations.js
router.post('/submit', 
  validateConsultation,  // Validation middleware
  async (req, res) => {
    try {
      const consultation = await consultationService.submit(req.body, req.files);
      res.json(consultation);
    } catch (error) {
      next(error);
    }
  }
);

// services/consultation.service.js
class ConsultationService {
  async submit(data, files) {
    // Orchestrate the business flow
    const patient = await patientService.findOrCreate(data.patient);
    const uploadedFiles = await fileService.uploadMultiple(files);
    const consultation = await consultationRepository.create({
      ...data,
      patientId: patient.id,
      files: uploadedFiles
    });
    
    if (data.needsPharmacy) {
      await pharmacyService.submitPrescription(consultation);
    }
    
    await emailService.notifyProvider(consultation);
    
    return consultation;
  }
}
```

## Implementation Steps for Your Project

### Step 1: Create Service Directory Structure
```
backend/src/
  services/
    admin.service.js
    auth.service.js
    consultation.service.js
    patient.service.js
    provider.service.js
    pharmacy.service.js
    file.service.js
  repositories/
    patient.repository.js
    consultation.repository.js
    provider.repository.js
```

### Step 2: Move Business Logic
1. Identify business logic in routes
2. Extract to service methods
3. Keep routes thin (only HTTP handling)

### Step 3: Move Database Queries
1. Extract SQL queries to repositories
2. Services call repositories, not database directly

### Step 4: Update Routes
1. Import services
2. Replace inline logic with service calls
3. Handle only HTTP concerns in routes

## Example Service File Template

```javascript
// services/patient.service.js
class PatientService {
  constructor() {
    this.patientRepo = new PatientRepository();
    this.emailService = new EmailService();
  }
  
  async createPatient(data) {
    // Business validation
    if (!this.isValidAge(data.dateOfBirth)) {
      throw new Error('Patient must be 18 or older');
    }
    
    // Create patient
    const patient = await this.patientRepo.create(data);
    
    // Send welcome email
    await this.emailService.sendWelcome(patient.email);
    
    return patient;
  }
  
  isValidAge(dateOfBirth) {
    // Business rule: must be 18+
    const age = calculateAge(dateOfBirth);
    return age >= 18;
  }
}

module.exports = new PatientService();
```

## Summary

Service Layer Architecture is about organizing your code into layers:
- **Routes**: Handle HTTP requests/responses
- **Services**: Handle business logic and orchestration
- **Repositories**: Handle database access
- **Utils/Helpers**: Handle common utilities

This makes your code:
- More organized
- Easier to test
- Easier to maintain
- More reusable
- More scalable
