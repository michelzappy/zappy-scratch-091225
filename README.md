# Telehealth Platform

A comprehensive telehealth system for async consultations between patients and healthcare providers.

## ☁️ Database: Neon (Serverless PostgreSQL)

This application now uses **Neon Database** - a serverless PostgreSQL platform with automatic scaling, built-in backups, and high availability. See [`NEON_MIGRATION_COMPLETE.md`](NEON_MIGRATION_COMPLETE.md) for migration details.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose (for Redis only)
- Neon Database account (free tier available at https://neon.tech)

### Setup Instructions

1. **Clone and Install Dependencies**

```bash
# Install backend dependencies
cd backend
npm install
cd ..
```

2. **Environment Setup**

```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit backend/.env and add your Neon database connection string
# DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

3. **Start Redis with Docker**

```bash
# Start Redis only (PostgreSQL is now on Neon)
docker-compose up -d

# Verify Redis is running
docker ps
# Redis will be available at localhost:6379
```

4. **Initialize Database Schema**

Apply the database schema to your Neon database:

```bash
# Test Neon connection first
node backend/test-neon-connection.js

# Apply schema to Neon
node backend/apply-schema-to-neon.js
```

5. **Start the Backend Server**

```bash
cd backend
npm run dev

# Server will start on http://localhost:3001
# Health check: http://localhost:3001/health
```

## 📁 Project Structure

```
.
├── backend/
│   ├── routes/          # API route definitions
│   ├── middleware/       # Express middleware
│   ├── services/         # Business logic
│   ├── utils/           # Utility functions
│   ├── config/          # Configuration files
│   └── server.js        # Main server file
├── database/
│   ├── migrations/      # Database migrations
│   └── init.sql        # Initial schema
├── frontend/           # Frontend application (to be built)
└── docker-compose.yml  # Docker configuration
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Consultations
- `GET /api/consultations` - List consultations
- `GET /api/consultations/:id` - Get consultation details
- `POST /api/consultations` - Create new consultation
- `PUT /api/consultations/:id` - Update consultation
- `POST /api/consultations/:id/assign` - Assign provider
- `POST /api/consultations/:id/complete` - Complete consultation
- `DELETE /api/consultations/:id` - Cancel consultation

### Messages
- `GET /api/messages/consultation/:id` - Get consultation messages
- `POST /api/messages` - Send message
- `PUT /api/messages/:id/read` - Mark as read
- `POST /api/messages/mark-all-read` - Mark all as read
- `GET /api/messages/unread-count` - Get unread count

### Providers
- `GET /api/providers` - List providers
- `GET /api/providers/:id` - Get provider profile
- `PUT /api/providers/:id` - Update profile
- `GET /api/providers/:id/consultations` - Get provider's consultations
- `POST /api/providers/:id/availability` - Update availability
- `GET /api/providers/:id/stats` - Get statistics

### Patients
- `GET /api/patients/:id` - Get patient profile
- `PUT /api/patients/:id` - Update profile
- `GET /api/patients/:id/consultations` - Get patient's consultations
- `GET /api/patients/:id/treatment-plans` - Get treatment plans
- `POST /api/patients/:id/insurance` - Update insurance
- `GET /api/patients/:id/documents` - Get documents

## 🔧 Development

### Running Tests

```bash
cd backend
npm test
```
### Database Management

**Neon Console:** https://console.neon.tech

```bash
# Test database connection
node backend/test-neon-connection.js

# Apply/reset schema
node backend/apply-schema-to-neon.js

# Access database via psql (if you have psql installed)
# Use the connection string from your Neon dashboard
psql "postgresql://[user]:[password]@[host]/[database]?sslmode=require"
```

**Neon Features:**
- Web-based SQL Editor in Neon Console
- Automatic backups and point-in-time recovery
- Query performance insights
- Connection pooling included
- Automatic scaling
```

### Logs

Backend logs are stored in:
- `logs/error.log` - Error logs
- `logs/combined.log` - All logs

### WebSocket Events

The server supports real-time messaging via Socket.io:

- `join_consultation` - Join consultation room
- `leave_consultation` - Leave consultation room
- `send_message` - Send message to consultation
- `new_message` - Receive new message
- `typing` - Send typing indicator
- `user_typing` - Receive typing indicator

## 🏗️ Next Steps

### Immediate TODOs

1. **Database Integration**
   - Set up Prisma ORM
   - Implement database queries
   - Add migrations

2. **Authentication**
   - Integrate Supabase Auth
   - Implement JWT middleware
   - Add role-based access control

3. **File Storage**
   - Set up local file storage
   - Add S3 integration (optional)
   - Implement file upload endpoints

4. **Frontend Development**
   - Create React/Next.js application
   - Build patient portal
   - Build provider dashboard

5. **Real-time Features**
   - Implement Socket.io messaging
   - Add notification system
   - Create presence indicators

### Production Considerations

- [ ] Add comprehensive error handling
- [ ] Implement request validation
- [ ] Set up monitoring (Sentry, etc.)
- [ ] Add API documentation (Swagger)
- [ ] Implement caching strategies
- [ ] Add security headers
- [ ] Set up CI/CD pipeline
- [ ] Add comprehensive testing
- [ ] Implement backup strategies
- [ ] Add rate limiting per user

## 📝 Environment Variables

Create a `backend/.env` file based on `backend/.env.example`:

```env
# Required - Neon Database
DATABASE_URL=postgresql://[user]:[password]@[host].neon.tech/[database]?sslmode=require

# Required - Redis (for sessions and caching)
REDIS_URL=redis://localhost:6379

# Required - Security
JWT_SECRET=your-secret-key-change-in-production-32-chars-min
SESSION_SECRET=your-session-secret-change-in-production
HIPAA_AUDIT_SALT=$2a$10$[your-bcrypt-salt]

# Optional (for production)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
```

**Getting Your Neon Connection String:**
1. Go to https://console.neon.tech
2. Select your project
3. Click "Connection Details"
4. Copy the connection string
5. Paste into `backend/.env` as `DATABASE_URL`

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### Docker Issues

```bash
# Reset Redis container
docker-compose down
docker-compose up -d

# View Redis logs
docker-compose logs -f redis
```

### Database Connection Issues

```bash
# Test Neon database connection
node backend/test-neon-connection.js

# Common issues:
# 1. Check DATABASE_URL format includes ?sslmode=require
# 2. Verify Neon project is active in console
# 3. Check network/firewall settings
# 4. Regenerate password in Neon Console if needed
```

### Migration from Local PostgreSQL

If you previously used local PostgreSQL, see the complete migration guide:
[`NEON_MIGRATION_COMPLETE.md`](NEON_MIGRATION_COMPLETE.md)

## 📄 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

Built with ❤️ for better healthcare accessibility


## 🤖 Multi-agent Review Automation

Run the built-in Python toolkit to generate an architecture-aware review report:

```bash
python -m multi_agent_review.cli --root $(pwd) --output review-report.md
```

The orchestrator walks the backend, frontend, and database workspaces, runs specialist agents, and writes a Markdown summary to `review-report.md`.
