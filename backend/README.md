# Telehealth Backend API

A HIPAA-compliant telehealth platform backend built with Node.js, Express, PostgreSQL, and Redis.

## Quick Start

You'll need Node.js 18+, Docker, and Docker Compose.

```bash
# Install dependencies
npm install

# Start database services
docker-compose up -d

# Seed database with initial data
npm run db:seed

# Start development server
npm run dev
```

The server runs on `http://localhost:3001`

## Project Structure

```
backend/
├── src/
│   ├── config/              # Database, Redis, auth config
│   ├── routes/              # API endpoints
│   ├── services/            # Business logic
│   ├── middleware/          # Auth, HIPAA, rate limiting
│   ├── models/              # Database models
│   ├── errors/              # Error handling
│   └── sockets/             # Real-time messaging
├── seeds/                   # Database seeding
├── test/                   # Test suite
└── scripts/                # Utilities
```

## Development Scripts

```bash
# Development
npm run dev                # Start with nodemon
npm start                  # Production mode

# Testing
npm test                   # Run all tests
npm run test:security      # Security tests
npm run test:coverage      # Coverage report

# Database
npm run db:seed            # Seed database
npm run db:reset           # Reset and reseed
npm run db:fresh           # Fresh setup

# Code Quality
npm run lint               # ESLint
npm run format             # Prettier
```

## Refactored Architecture

### Database Connection Management

The backend uses a `DatabaseManager` class for connection handling:

```javascript
import { dbManager, getDatabase } from './src/config/database.js';

// Get database instance
const db = getDatabase();

// Check connection status
if (dbManager.isConnected()) {
  console.log('Database connected');
}

// Health check
const health = await dbManager.healthCheck();
```

Features:
- Connection pooling with retry logic
- Automatic reconnection on failures
- Health monitoring and metrics
- Graceful shutdown handling

### Query Service

Use the standardized `QueryService` for database operations:

```javascript
import { getQueryService } from './src/services/query.service.js';

const queryService = await getQueryService();

// Find records
const patient = await queryService.findById('patients', patientId);
const patients = await queryService.findMany('patients', { status: 'active' });

// Count records
const count = await queryService.count('patients', { status: 'active' });

// Insert/Update/Delete
const newPatient = await queryService.insert('patients', patientData);
const updated = await queryService.update('patients', { id: patientId }, updateData);
```

Features:
- Performance monitoring and metrics
- Redis caching support
- Table validation and security
- Standardized error handling

### Performance Monitoring

Monitor query performance:

```javascript
// Get performance metrics
const metrics = queryService.getMetrics();

// Clear cache
await queryService.clearCache();
```

API Endpoints:
- `GET /api/query-metrics/metrics` - View performance metrics
- `POST /api/query-metrics/clear-cache` - Clear query cache

## API Endpoints

### Health & Monitoring
- `GET /health` - Basic health check
- `GET /api/health/comprehensive` - Detailed system health
- `GET /api/query-metrics/metrics` - Query performance metrics
- `GET /api/auth-system/health` - Authentication system health

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Core Resources
- `GET /api/patients` - List patients
- `GET /api/providers` - List providers
- `GET /api/consultations` - List consultations
- `GET /api/messages` - List messages

## Security Features

### HIPAA Compliance
- Audit logging for all patient data access
- Session timeout management
- Encryption at rest and in transit
- Role-based access control
- Patient data anonymization

### Authentication & Authorization
```javascript
import { requireAuth, ROLES } from './src/middleware/auth.js';

// Protect routes
router.get('/patients', requireAuth([ROLES.PROVIDER, ROLES.ADMIN]), getPatients);

// Check user roles
if (req.user.role === ROLES.ADMIN) {
  // Admin-only logic
}
```

### Rate Limiting
- Per-user rate limiting
- IP-based rate limiting
- Endpoint-specific limits
- Configurable thresholds

## Testing

### Running Tests

```bash
npm test                   # All tests
npm run test:security      # Security tests
npm run test:coverage      # Coverage report
npm run test:watch         # Watch mode
```

### Test Structure
```
test/
├── api-integration.test.js     # API endpoint tests
├── auth-authorization.test.js  # Authentication tests
├── database-integration.test.js # Database tests
├── security/                   # Security test suite
└── utils/                      # Test utilities
```

### Writing Tests

```javascript
import { getQueryService } from '../src/services/query.service.js';

describe('Query Service', () => {
  let queryService;
  
  beforeAll(async () => {
    queryService = await getQueryService();
  });
  
  test('should find patient by ID', async () => {
    const patient = await queryService.findById('patients', 'test-id');
    expect(patient).toBeDefined();
  });
});
```

## Configuration

### Environment Variables

Key environment variables:

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://telehealth_user:secure_password_2025@localhost:5433/telehealth_db
JWT_SECRET=dev-jwt-secret-key-change-in-production-32-chars-min
REDIS_URL=redis://localhost:6379
HIPAA_AUDIT_SALT=$2a$10$pGMncsrqp6Z5R0Micd59FO
SESSION_SECRET=dev-session-secret-change-in-production
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Database Configuration

The database connection is managed through the `DatabaseManager`:

```javascript
const options = {
  max: 20,                    // Max connections
  idle_timeout: 30,           // Idle timeout (seconds)
  connect_timeout: 10,         // Connection timeout (seconds)
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false
};
```

## Production Deployment

### Health Checks

```bash
curl http://localhost:3001/health
curl http://localhost:3001/api/health/comprehensive
curl http://localhost:3001/api/query-metrics/metrics
```

### Performance Monitoring

```javascript
const health = await dbManager.healthCheck();
const metrics = queryService.getMetrics();
console.log('Database response time:', health.responseTime);
```

### Security Considerations

1. Never commit secrets to version control
2. Use connection pooling and prepared statements
3. Implement proper JWT validation and refresh tokens
4. Configure appropriate rate limits
5. Monitor all patient data access

## Troubleshooting

**Database Connection Failed:**
```bash
docker ps
cd backend && node test-db.js
```

**Port Already in Use:**
```bash
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**Redis Connection Issues:**
```bash
docker exec -it telehealth_redis redis-cli ping
```

## API Documentation

### Error Handling

Standardized error responses:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-09-24T11:30:00.000Z"
}
```

### Response Format

Successful responses:
```json
{
  "success": true,
  "data": { /* response data */ },
  "timestamp": "2025-09-24T11:30:00.000Z"
}
```

## Contributing

1. Follow existing code structure and patterns
2. Write tests for new features
3. Update documentation for API changes
4. Run security tests before submitting PRs
5. Ensure HIPAA compliance for patient data handling

## License

MIT
