# Telehealth Platform

A telehealth system for async consultations between patients and healthcare providers.

## Getting Started

You'll need Node.js 18+, Docker, and Docker Compose installed.

### Installation

Install dependencies for both backend and frontend:

```bash
npm run setup:all
```

Or install them separately:
```bash
npm run setup:backend
npm run setup:frontend
```

### Environment

The backend environment is already configured in `backend/.env`. The database runs on port 5433 (not the default 5432) and Redis on 6379.

### Running the Application

Start the database services:
```bash
docker-compose up -d
```

Seed the database with initial data:
```bash
cd backend
npm run db:seed
```

Start the backend server:
```bash
npm run dev:backend
```

Or start both backend and frontend together:
```bash
npm run dev
```

The backend will be available at `http://localhost:3001` with a health check at `/health`.

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/       # Auth, HIPAA, rate limiting
│   │   ├── services/         # Business logic
│   │   ├── config/          # Database and Redis config
│   │   ├── models/          # Database models
│   │   ├── errors/          # Custom error handling
│   │   └── sockets/         # Real-time messaging
│   ├── seeds/              # Database seeding
│   ├── test/               # Test suite
│   └── scripts/            # Utility scripts
├── database/
│   ├── migrations/         # Database migrations
│   ├── seeds/             # SQL seed files
│   └── docker-compose.yml  # Database services
├── frontend/              # Next.js frontend
├── docs/                  # Documentation
└── docker-compose.yml     # Main Docker config
```

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
- `POST /api/auth/refresh` - Refresh token

### Core Resources
- `GET /api/patients` - List patients
- `GET /api/providers` - List providers
- `GET /api/consultations` - List consultations
- `GET /api/messages` - List messages
- `GET /api/admin/patients` - Admin patient management

## Development

### Available Scripts

Root level scripts:
```bash
npm run setup:all          # Install all dependencies
npm run dev                # Start both backend and frontend
npm run dev:backend        # Start backend only
npm run dev:frontend       # Start frontend only
```

Backend scripts (run from `backend/` directory):
```bash
npm run dev                # Start with nodemon
npm test                   # Run all tests
npm run test:security      # Run security tests
npm run db:seed            # Seed database
npm run db:reset           # Reset and reseed database
npm run lint               # Run ESLint
```

### Database Access

Connect to PostgreSQL:
```bash
docker exec -it telehealth_postgres psql -U telehealth_user -d telehealth_db
```

Or use Adminer at `http://localhost:8080`:
- Server: postgres
- Username: telehealth_user  
- Password: secure_password_2025
- Database: telehealth_db
- Port: 5433

### Testing Endpoints

```bash
# Health checks
curl http://localhost:3001/health
curl http://localhost:3001/api/health/comprehensive

# Query metrics
curl http://localhost:3001/api/query-metrics/metrics

# Test database connection
cd backend && node test-db.js
```

## Current Status

The backend is functional with core features implemented:

**Completed:**
- Database integration with PostgreSQL
- JWT authentication and role-based access
- HIPAA-compliant session management
- Health monitoring and query performance metrics
- Comprehensive test suite and security testing

**In Progress:**
- Frontend development (Next.js)
- Real-time messaging features
- Provider dashboard

**Next Steps:**
- Complete frontend patient portal
- Add API documentation
- Set up monitoring and CI/CD

## Environment Variables

The backend environment is pre-configured in `backend/.env`. Key settings:

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://telehealth_user:secure_password_2025@localhost:5433/telehealth_db
JWT_SECRET=dev-jwt-secret-key-change-in-production-32-chars-min
REDIS_URL=redis://localhost:6379
```

## Troubleshooting

**Port already in use:**
```bash
# Find process using port 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**Docker issues:**
```bash
docker-compose down
docker-compose up -d --build
docker ps  # Check container status
```

**Database connection:**
```bash
cd backend && node test-db.js
curl http://localhost:3001/api/health/comprehensive
```

**Common fixes:**
- Use `npm run setup:all` instead of `npm install`
- Ensure Docker is running and check port 5433 (not 5432)
- Verify DATABASE_URL format in backend/.env

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
