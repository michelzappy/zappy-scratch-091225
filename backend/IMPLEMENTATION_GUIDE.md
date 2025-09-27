# Implementation Guide - Next Steps

## 1. Install Dependencies (Immediate)

Add these to your `backend/package.json`:

```json
{
  "dependencies": {
    "uuid": "^9.0.0",
    "sequelize": "^6.32.1",
    "pg": "^8.11.3",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "express-validator": "^7.0.1",
    "joi": "^17.11.0",
    "winston": "^3.11.0",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "typescript": "^5.3.2",
    "@types/node": "^20.10.0",
    "@types/express": "^4.17.21",
    "@types/sequelize": "^4.28.18",
    "jsdoc": "^4.0.2",
    "ts-node": "^10.9.1",
    "nodemon": "^3.0.2",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcryptjs": "^2.4.6",
    "@types/multer": "^1.4.11"
  },
  "scripts": {
    "dev": "nodemon --exec ts-node src/app.js",
    "build": "tsc",
    "docs": "jsdoc -c jsdoc.json",
    "start": "node src/app.js",
    "typecheck": "tsc --noEmit"
  }
}
```

Run: `npm install`

## 2. Environment Variables (.env)

Add these to your `.env` file:

```env
# Encryption (Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_MASTER_KEY=YOUR_64_CHAR_HEX_KEY_HERE
HASH_SALT=YOUR_RANDOM_SALT_HERE

# Security
JWT_SECRET=YOUR_JWT_SECRET_HERE
SESSION_SECRET=YOUR_SESSION_SECRET_HERE

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/yourdb
```

## 3. Integrate Middleware into Express App

Update your `backend/src/app.js`:

```javascript
const express = require('express');
const app = express();

// Import new middleware
const responseWrapper = require('./middleware/responseWrapper');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { auditLogger } = require('./middleware/auditLogger');
const { encryptRequest, decryptResponse, initializeEncryption } = require('./middleware/dataEncryption');
const { requireAuth, filterResponseData } = require('./middleware/accessControl');

// Initialize encryption
initializeEncryption();

// Global middleware (order matters!)
app.use(express.json());
app.use(responseWrapper); // Standardize responses
app.use(auditLogger); // Audit PHI access
app.use(encryptRequest); // Encrypt incoming PHI
app.use(decryptResponse); // Decrypt outgoing PHI
app.use(filterResponseData()); // Filter based on roles

// Example protected routes
app.use('/api/patients', 
  requireAuth(['admin', 'provider', 'staff']),
  require('./routes/patients')
);

app.use('/api/appointments',
  requireAuth(),  // Any authenticated user
  require('./routes/appointments')
);

// Error handling (must be last!)
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
```

## 4. Create Logger Configuration

Create `backend/src/utils/logger.js`:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'healthcare-backend' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.File({ filename: 'audit.log', level: 'info' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

## 5. Create Helper Utilities

Create `backend/src/utils/helpers.js`:

```javascript
/**
 * Get client IP address from request
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null);
}

module.exports = {
  getClientIp
};
```

## 6. Run Database Migration

```bash
# Connect to your database and run:
psql -U your_user -d your_database -f database/migrations/create_audit_logs_table.sql
```

## 7. Update Existing Routes

Example of updating a route to use new patterns:

```javascript
// backend/src/routes/patients.js
const router = require('express').Router();
const PatientService = require('../services/PatientService');
const { requirePermission } = require('../middleware/accessControl');
const { asyncErrorWrapper } = require('../middleware/errorHandler');

// Create patient service extending BaseService
const patientService = new PatientService();

// GET all patients
router.get('/',
  requirePermission('patients', 'read'),
  asyncErrorWrapper(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const result = await patientService.findAll({ page, limit });
    res.paginate(result.data, page, limit, result.pagination.total);
  })
);

// GET single patient
router.get('/:id',
  requirePermission('patients', 'read'),
  asyncErrorWrapper(async (req, res) => {
    const patient = await patientService.findById(req.params.id);
    res.success(patient);
  })
);

module.exports = router;
```

## 8. Create First Service

Create `backend/src/services/PatientService.js`:

```javascript
const BaseService = require('./base.service');
const Patient = require('../models/Patient'); // Your existing model

class PatientService extends BaseService {
  constructor() {
    super(Patient, 'Patient');
  }
  
  async validateCreate(data) {
    // Add custom validation
    if (!data.email) {
      throw new ValidationError('Email is required');
    }
    return true;
  }
}

module.exports = PatientService;
```

## 9. Test the Integration

```bash
# Start the server
npm run dev

# Test an endpoint
curl -X GET http://localhost:5000/api/patients \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 10. Generate Documentation

```bash
npm run docs
# Open backend/docs/api/index.html in browser
```

## Next Development Priorities

1. **Authentication System**
   - Implement JWT authentication using the error classes
   - Add login/logout endpoints with audit logging

2. **Gradual TypeScript Migration**
   - Start converting route files one by one
   - Use the typescript-helpers for smooth transition

3. **Add More Services**
   - Create services for appointments, records, prescriptions
   - All extending BaseService for consistency

4. **Enhanced Security**
   - Implement rate limiting
   - Add CORS configuration
   - Set up helmet.js for security headers

5. **Testing**
   - Add unit tests for services
   - Integration tests for middleware
   - HIPAA compliance validation tests

## Monitoring & Maintenance

1. **Check Audit Logs**
   ```sql
   SELECT * FROM audit_logs 
   WHERE timestamp > NOW() - INTERVAL '1 day'
   ORDER BY timestamp DESC;
   ```

2. **Monitor Encryption**
   - Regularly rotate encryption keys
   - Check for failed decryption attempts in logs

3. **Performance**
   - Monitor response times in audit logs
   - Optimize database queries in services

## Troubleshooting

### Common Issues:

1. **Encryption Key Error**
   - Ensure ENCRYPTION_MASTER_KEY is 64 characters hex
   - Generate new key if needed

2. **TypeScript Errors**
   - Run `npm run typecheck` to identify issues
   - Use `// @ts-ignore` temporarily during migration

3. **Audit Log Failures**
   - Check database connection
   - Ensure audit_logs table exists
   - Verify user permissions on table

4. **Middleware Order Issues**
   - responseWrapper must come before route handlers
   - errorHandler must be last
   - auditLogger should be early in chain

## Support Resources

- [Express Middleware Guide](https://expressjs.com/en/guide/using-middleware.html)
- [TypeScript Migration Guide](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html)
- [HIPAA Compliance Checklist](https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html)
- [JSDoc Documentation](https://jsdoc.app/)

---

Remember: This is a gradual implementation. Start with critical paths (authentication, patient data) and expand coverage over time.
