# Telehealth Platform

A comprehensive telehealth system for async consultations between patients and healthcare providers.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- PostgreSQL (optional if using Docker)
- Redis (optional if using Docker)

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
cp .env.example .env

# Edit .env with your configuration
# For local development, the defaults should work with Docker
```

3. **Start Database and Redis with Docker**

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify containers are running
docker ps

# Database will be available at localhost:5432
# Redis will be available at localhost:6379
# Adminer (database UI) at http://localhost:8080
```

4. **Initialize Database**

The database will be automatically initialized with the schema when Docker starts.
If you need to reset it:

```bash
# Connect to database and run init script
docker exec -i telehealth_postgres psql -U telehealth_user -d telehealth_db < database/init.sql
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

```bash
# Access PostgreSQL CLI
docker exec -it telehealth_postgres psql -U telehealth_user -d telehealth_db

# Access Adminer UI
open http://localhost:8080
# Server: postgres
# Username: telehealth_user
# Password: secure_password
# Database: telehealth_db
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

Create a `.env` file based on `.env.example`:

```env
# Required
DATABASE_URL=postgresql://telehealth_user:secure_password@localhost:5432/telehealth_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-here

# Optional (for production)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
```

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
# Reset Docker containers
docker-compose down
docker-compose up -d --build

# View logs
docker-compose logs -f
```

### Database Connection Issues

```bash
# Test database connection
docker exec telehealth_postgres pg_isready

# Reset database
docker-compose down -v
docker-compose up -d
```

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
