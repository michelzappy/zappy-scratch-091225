# Environment Variables Documentation

This document outlines all environment variables used in the Zappy Health telehealth platform.

## 🚨 CRITICAL SECURITY NOTICE

**WARNING**: The current codebase contains **HARDCODED SECRETS** that create critical security vulnerabilities. These must be addressed before any production deployment.

## Critical Security Issues

### ❌ HARDCODED JWT SECRETS (CRITICAL)
```bash
# CURRENT VULNERABLE CODE LOCATIONS:
# backend/src/middleware/auth.js:108
# backend/src/middleware/authResilience.js:154
# These files contain: 'development-secret-key-change-in-production'
```
- **Status**: ❌ **CRITICAL VULNERABILITY**
- **Risk**: Authentication bypass possible with known secrets
- **Action**: Replace ALL hardcoded secrets with environment variables

### ❌ HARDCODED HIPAA AUDIT SALT (CRITICAL)
```bash
# CURRENT VULNERABLE CODE:
# Hardcoded salt: '$2a$10$HIPAAAuditSaltForPatientIDs'
```
- **Status**: ❌ **HIPAA COMPLIANCE VIOLATION**
- **Risk**: Patient re-identification possible - $1.5M+ fine risk
- **Action**: Implement secure salt rotation system

### ❌ FRONTEND SECRET EXPOSURE (HIGH)
```bash
# CURRENT VULNERABLE CODE:
# frontend/src/lib/supabase.ts contains hardcoded Supabase keys
```
- **Status**: ❌ **SECRETS EXPOSED IN SOURCE CODE**
- **Risk**: Database credentials exposed to clients
- **Action**: Move all secrets to environment variables

## Required Variables (MUST BE CONFIGURED)

### Database Configuration
```bash
DATABASE_URL=postgresql://telehealth_user:secure_password@localhost:5432/telehealth_db
```
- **Status**: ✅ Configurable
- **Required**: YES
- **Description**: PostgreSQL database connection string

### Redis Configuration
```bash
REDIS_URL=redis://localhost:6379
```
- **Status**: ✅ Configurable
- **Required**: YES (for sessions and caching)
- **Description**: Redis connection string for session storage

### Security (CRITICAL - CURRENTLY VULNERABLE)
```bash
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-change-this
SESSION_SECRET=your-session-secret-change-this
HIPAA_AUDIT_SALT=your-secure-hipaa-salt-change-this
```
- **Status**: ❌ **HARDCODED IN SOURCE CODE**
- **Required**: YES - CRITICAL FOR SECURITY
- **Description**: Secrets for JWT tokens, session encryption, and HIPAA compliance
- **Action**: Generate secure random values and configure properly

### Server Configuration
```bash
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```
- **Status**: ⚠️ Configurable but needs production values
- **Required**: YES
- **Description**: Basic server configuration

## Optional Variables (Enhanced Features)

### Authentication (Supabase)
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```
- **Status**: ❌ **HARDCODED IN FRONTEND SOURCE**
- **Required**: Optional (has fallback)
- **Security Risk**: Keys exposed in client-side code
- **Action**: Use environment variables only

### AI Consultation (OpenAI)
```bash
OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=1000
```
- **Status**: ⚠️ Not configured (using mock responses)
- **Required**: Optional (has fallback)
- **Description**: OpenAI integration for AI-powered consultations

### File Storage (AWS S3)
```bash
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-s3-bucket-name
AWS_REGION=us-east-1
```
- **Status**: ⚠️ Not configured (using local storage)
- **Required**: Optional (has fallback)
- **Description**: AWS S3 for file uploads and storage

### Email Service (SendGrid)
```bash
SENDGRID_API_KEY=SG.your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Telehealth Platform
SENDGRID_REPLY_TO=support@yourdomain.com
```
- **Status**: ⚠️ Not configured
- **Required**: Optional (has SMTP fallback)
- **Description**: SendGrid email service

### SMS Service (Twilio)
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
- **Status**: ⚠️ Not configured
- **Required**: Optional
- **Description**: Twilio SMS service for notifications

### Payment Processing (Stripe)
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```
- **Status**: ⚠️ Not configured (using test key)
- **Required**: Optional (for payment features)
- **Description**: Stripe payment processing

## 🚨 IMMEDIATE SECURITY ACTIONS REQUIRED

### Before ANY Production Deployment:

1. **Replace Hardcoded JWT Secrets**
   - Generate secure random JWT_SECRET (minimum 64 characters)
   - Generate secure JWT_REFRESH_SECRET
   - Remove all hardcoded fallbacks from code

2. **Fix HIPAA Compliance Violation**
   - Generate secure HIPAA_AUDIT_SALT
   - Implement salt rotation mechanism
   - Remove hardcoded salt from source code

3. **Secure Frontend Configuration**
   - Move all Supabase keys to environment variables
   - Remove hardcoded keys from frontend source code
   - Use NEXT_PUBLIC_ prefix for client-safe variables only

4. **Environment Validation**
   - Add startup validation to ensure all required secrets are present
   - Implement secret strength validation
   - Add production environment checks

5. **Clean Debug Code**
   - Remove all 300+ console.log statements
   - Remove test/debug code from production builds
   - Implement proper logging system

## Production Security Checklist

- [ ] All hardcoded secrets removed from source code
- [ ] JWT_SECRET generated with secure random values (64+ chars)
- [ ] HIPAA_AUDIT_SALT implemented with rotation
- [ ] Frontend secrets moved to environment variables
- [ ] Environment validation implemented
- [ ] Debug code removed from production
- [ ] Security headers configured
- [ ] HTTPS enforced
- [ ] Secrets management system implemented

## Risk Assessment

**Current Risk Level**: ❌ **CRITICAL - NOT PRODUCTION READY**

- Authentication bypass risk: HIGH
- HIPAA violation risk: HIGH (potential $1.5M+ fines)
- Patient data breach risk: HIGH
- Regulatory compliance: FAILED

**Estimated Remediation Time**: 25-36 hours of development work

---

**⚠️ WARNING: DO NOT DEPLOY TO PRODUCTION** until all security issues are resolved and validated through comprehensive security testing.