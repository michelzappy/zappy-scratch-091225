# Environment Variables Documentation

This document outlines all environment variables used in the Zappy Health telehealth platform for Docker deployment.

## Required Variables (Core Functionality)

### Database Configuration
```bash
DATABASE_URL=postgresql://telehealth_user:secure_password@localhost:5432/telehealth_db
```
- **Status**: ✅ Configured
- **Required**: Yes
- **Description**: PostgreSQL database connection string

### Redis Configuration
```bash
REDIS_URL=redis://localhost:6379
```
- **Status**: ✅ Configured
- **Required**: Yes (for sessions and caching)
- **Description**: Redis connection string for session storage

### Server Configuration
```bash
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```
- **Status**: ✅ Configured
- **Required**: Yes
- **Description**: Basic server configuration

### Security
```bash
JWT_SECRET=your-super-secret-jwt-key-change-this
SESSION_SECRET=your-session-secret-change-this
```
- **Status**: ⚠️ Using default values (should be changed for production)
- **Required**: Yes
- **Description**: Secrets for JWT tokens and session encryption

## Optional Variables (Enhanced Features)

### Authentication (Supabase)
```bash
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```
- **Status**: ❌ Not configured (using fallback local auth)
- **Required**: No (has fallback)
- **Description**: Supabase authentication service

### AI Consultation (OpenAI)
```bash
OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=1000
```
- **Status**: ❌ Not configured (using mock responses)
- **Required**: No (has fallback)
- **Description**: OpenAI integration for AI-powered consultations

### File Storage (AWS S3)
```bash
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-s3-bucket-name
AWS_REGION=us-east-1
```
- **Status**: ❌ Not configured (using local storage)
- **Required**: No (has fallback)
- **Description**: AWS S3 for file uploads and storage

### Email Service (SendGrid)
```bash
SENDGRID_API_KEY=SG.your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Telehealth Platform
SENDGRID_REPLY_TO=support@yourdomain.com
```
- **Status**: ❌ Not configured
- **Required**: No (has SMTP fallback)
- **Description**: SendGrid email service

### Email Service (SMTP Fallback)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```
- **Status**: ❌ Not configured
- **Required**: No
- **Description**: SMTP email service fallback

### SMS Service (Twilio)
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
- **Status**: ❌ Not configured
- **Required**: No
- **Description**: Twilio SMS service for notifications

### Payment Processing (Stripe)
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```
- **Status**: ❌ Not configured (using dummy key)
- **Required**: No (for payment features)
- **Description**: Stripe payment processing

### Application URLs
```bash
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
```
- **Status**: ✅ Configured
- **Required**: Yes
- **Description**: Application URLs for CORS and redirects

### Rate Limiting
```bash
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```
- **Status**: ✅ Configured
- **Required**: Yes
- **Description**: API rate limiting configuration

### File Upload
```bash
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```
- **Status**: ✅ Configured
- **Required**: Yes
- **Description**: File upload configuration

## Docker Deployment Status

### ✅ Ready for Docker
The application is configured with all required environment variables for basic Docker deployment:
- Database connection works with PostgreSQL container
- Redis connection works with Redis container
- Server starts successfully
- Core API functionality is available

### ⚠️ Production Considerations
1. **Change default secrets**: Update JWT_SECRET and SESSION_SECRET
2. **Configure external services**: Set up Supabase, OpenAI, AWS, etc. as needed
3. **SSL/TLS**: Configure HTTPS for production
4. **Environment-specific values**: Update URLs for production environment

### 🔧 Optional Enhancements
To enable additional features, configure the optional services:
- **AI Consultations**: Add OpenAI API key
- **Cloud Storage**: Configure AWS S3
- **Email Notifications**: Set up SendGrid or SMTP
- **SMS Notifications**: Configure Twilio
- **Payment Processing**: Set up Stripe
- **Enhanced Auth**: Configure Supabase

## Testing the Setup

1. **Start Docker containers**:
   ```bash
   docker-compose up -d
   ```

2. **Check container health**:
   ```bash
   docker ps
   ```

3. **Test API health**:
   ```bash
   curl http://localhost:3001/health
   ```

4. **Verify database connection**:
   ```bash
   docker exec -it telehealth_postgres psql -U telehealth_user -d telehealth_db -c "\dt"
   ```

The application will run with core functionality even without optional services configured, using fallback implementations where available.