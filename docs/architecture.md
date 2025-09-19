# Telehealth Platform Brownfield Architecture Document

## Introduction

This document captures the CURRENT STATE of the Telehealth Platform codebase, including technical debt, workarounds, and real-world patterns. It serves as a reference for AI agents working on production readiness enhancements.

### Document Scope

Comprehensive documentation of entire telehealth system focused on areas relevant to: **Production readiness enhancement covering security hardening, scalability improvements, operational excellence, compliance readiness, performance optimization, and deployment automation**.

### Change Log

| Date   | Version | Description                 | Author    |
| ------ | ------- | --------------------------- | --------- |
| 2025-09-19 | 1.0     | Initial brownfield analysis | BMad Master |

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System

- **Backend Entry**: [`backend/src/app.js`](backend/src/app.js:1) - Express.js server with middleware stack
- **Frontend Entry**: [`frontend/src/app/`](frontend/src/app/) - Next.js 14 app directory structure
- **Configuration**: [`backend/.env.example`](backend/.env.example:1), [`vercel.json`](vercel.json:1)
- **Core Business Logic**: [`backend/src/services/`](backend/src/services/), [`backend/src/routes/`](backend/src/routes/)
- **API Definitions**: [`backend/src/routes/`](backend/src/routes/) - RESTful endpoints for patients, providers, consultations
- **Database Models**: [`database/complete-schema.sql`](database/complete-schema.sql:1) - Comprehensive PostgreSQL schema
- **Key Algorithms**: [`backend/src/services/ai-consultation.service.js`](backend/src/services/ai-consultation.service.js:1), authentication middleware

### Enhancement Impact Areas

Files/modules that will be affected by the production readiness enhancement:
- [`backend/src/app.js`](backend/src/app.js:1) - Add production middleware, monitoring, security headers
- [`backend/src/config/`](backend/src/config/) - Production configuration management
- [`vercel.json`](vercel.json:1) - Production deployment configuration optimizations
- [`database/`](database/) - Add audit logging tables, performance indexes, backup procedures
- All route files - Add comprehensive error handling, logging, and validation
- Frontend components - Add production error boundaries, monitoring, and performance optimization

## High Level Architecture

### Technical Summary

**Current State**: Healthcare-focused monorepo in active development with sophisticated feature set. Evidence of recent merge conflict resolution and ongoing backend improvements. Architecture shows mature healthcare workflow understanding with comprehensive data models and multi-portal design.

### Actual Tech Stack (from package.json analysis)

| Category  | Technology | Version | Notes                      |
| --------- | ---------- | ------- | -------------------------- |
| Runtime   | Node.js    | >=18.0.0 | ES modules enabled (`type: "module"`) |
| Frontend Framework | Next.js | 14.0.4 | Latest app directory, React 18.2.0 |
| Backend Framework | Express | 4.18.2 | RESTful API with comprehensive middleware |
| Database  | PostgreSQL | Latest | Complex healthcare schema with UUID primary keys |
| ORM | Drizzle ORM | 0.29.1 | Type-safe database operations |
| State Management | Zustand | 4.4.7 | Lightweight React state management |
| UI Framework | Radix UI + Tailwind | Latest | Accessible components + utility-first CSS |
| Forms | React Hook Form + Zod | 7.48.2 + 3.22.4 | Type-safe form handling and validation |
| Real-time | Socket.IO | 4.7.4 (backend) + 4.8.1 (frontend) | Patient-provider communication |
| Authentication | Supabase + JWT | 2.57.4 + 9.0.2 | Hybrid auth approach |
| Payments | Stripe | 18.5.0 (backend) + 7.9.0 (frontend) | Healthcare payment processing |
| Communication | Twilio + SendGrid | 4.23.0 + 8.1.5 | SMS + Email notifications |
| AI Integration | OpenAI | 5.20.2 | Consultation assistance and analysis |
| File Storage | AWS SDK + Sharp | 2.1491.0 + 0.32.6 | Healthcare document storage + image processing |
| Caching | Redis (ioredis) | 5.3.2 | Session management and data caching |
| Security | Helmet + bcryptjs | 7.1.0 + 2.4.3 | Security headers + password hashing |
| Testing | Jest + Vitest | 29.7.0 + 1.1.0 | Backend unit tests + frontend testing |

### Repository Structure Reality Check

- **Type**: Monorepo with npm workspaces configuration
- **Package Manager**: npm with workspace support for `frontend` and `backend`
- **Notable**: Sophisticated healthcare integrations, comprehensive database schema, multi-portal architecture

## Source Tree and Module Organization

### Project Structure (Actual)

```text
telehealth-platform/
├── frontend/                    # Next.js 14 frontend application
│   ├── src/app/                 # App directory structure (Next.js 13+)
│   │   ├── patient/             # Patient portal pages
│   │   ├── provider/            # Provider portal pages  
│   │   ├── portal/              # Admin/unified portal pages
│   │   └── globals.css          # Global styles with Tailwind
│   ├── src/components/          # Reusable React components
│   ├── src/lib/                 # Frontend utilities and API clients
│   └── package.json             # Frontend dependencies (Next.js, React, TypeScript)
├── backend/                     # Node.js Express API server
│   ├── src/app.js              # Main server entry with middleware stack
│   ├── src/routes/             # RESTful API endpoints
│   ├── src/services/           # Business logic layer
│   ├── src/config/             # Configuration management
│   ├── src/middleware/         # Express middleware (auth, validation, etc.)
│   ├── scripts/                # Database seeding and utility scripts
│   └── package.json            # Backend dependencies (Express, PostgreSQL, etc.)
├── database/                   # Database schema and migrations
│   ├── complete-schema.sql     # Comprehensive PostgreSQL schema
│   ├── migrations/             # Database migration scripts
│   └── seeds/                  # Initial data seeding
├── docs/                       # Project documentation (PRD, Architecture)
├── .bmad-core/                 # BMad Method configuration and agents
├── vercel.json                 # Vercel deployment configuration
└── package.json               # Monorepo root with workspace configuration
```

### Key Modules and Their Purpose

- **Patient Management**: [`backend/src/routes/patients.js`](backend/src/routes/patients.js:1) - Comprehensive patient CRUD operations
- **Provider Management**: [`backend/src/routes/providers.js`](backend/src/routes/providers.js:1) - Provider registration and management  
- **Consultation Workflow**: [`backend/src/routes/consultations.js`](backend/src/routes/consultations.js:1) - Core healthcare workflow management
- **AI Consultation Service**: [`backend/src/services/ai-consultation.service.js`](backend/src/services/ai-consultation.service.js:1) - OpenAI integration for medical assistance
- **Authentication**: [`backend/src/middleware/auth.js`](backend/src/middleware/auth.js:1) - Hybrid Supabase/JWT authentication
- **Prescription Management**: [`backend/src/routes/prescriptions.js`](backend/src/routes/prescriptions.js:1) - Medication and prescription handling
- **Order Processing**: [`backend/src/routes/orders.js`](backend/src/routes/orders.js:1) - Healthcare product fulfillment
- **Messaging System**: [`backend/src/routes/messages.js`](backend/src/routes/messages.js:1) - Patient-provider communication

## Data Models and APIs

### Data Models

**Core Healthcare Entities** (see [`database/complete-schema.sql`](database/complete-schema.sql:1)):

- **Patients Table**: Comprehensive patient records with medical history, subscription tracking, and HIPAA-compliant data fields
- **Providers Table**: Healthcare provider profiles with licensing, specialties, and availability management  
- **Consultations Table**: Full consultation workflow with intake data, provider assessment, and status tracking
- **Prescriptions Table**: Medication management with refill tracking and controlled substance handling
- **Orders Table**: Healthcare product fulfillment with payment processing and shipping integration
- **Inventory Table**: Medication inventory management with supplier integration
- **Analytics Events**: Comprehensive event tracking for healthcare workflow optimization

### API Specifications

- **RESTful Endpoints**: Comprehensive REST API covering all healthcare entities
- **Authentication**: JWT-based with Supabase integration for user management
- **Real-time Communication**: Socket.IO for patient-provider messaging
- **External Integrations**: Stripe payments, Twilio SMS, SendGrid email, OpenAI consultations

## Technical Debt and Known Issues

### Critical Technical Debt

1. **Backend Issues Documentation**: Extensive issue tracking in multiple files:
   - [`BACKEND_ISSUES_CRITICAL_MISSING_ROUTES.md`](BACKEND_ISSUES_CRITICAL_MISSING_ROUTES.md:1) - Critical API endpoints needing implementation
   - [`BACKEND_ISSUES_MASTER_TRACKER.md`](BACKEND_ISSUES_MASTER_TRACKER.md:1) - Comprehensive issue tracking
   - [`BACKEND_ISSUES_RESOLUTION_SUMMARY.md`](BACKEND_ISSUES_RESOLUTION_SUMMARY.md:1) - Resolution progress tracking

2. **Deployment Configuration**: Current Vercel deployment shows limitations:
   - [`VERCEL_DEPLOYMENT_STATUS.md`](VERCEL_DEPLOYMENT_STATUS.md:1) - Deployment challenges documented
   - [`SCALING_GUIDE_100K_USERS.md`](SCALING_GUIDE_100K_USERS.md:1) - Scaling concerns documented

3. **Mock Data Dependencies**: Evidence of mock data cleanup efforts:
   - [`MOCK_DATA_ELIMINATION_SUMMARY.md`](MOCK_DATA_ELIMINATION_SUMMARY.md:1) - Mock data removal tracking

### Workarounds and Gotchas

- **Vercel Deployment**: Current configuration focuses only on frontend deployment via Vercel, backend likely needs separate hosting
- **Database Migrations**: Manual migration management through bash scripts, needs production automation
- **Environment Configuration**: Multiple `.env.example` files suggest complex environment management
- **Testing Coverage**: Limited testing infrastructure, Jest configured but coverage unknown

## Integration Points and External Dependencies

### External Services

| Service  | Purpose  | Integration Type | Key Files                      |
| -------- | -------- | ---------------- | ------------------------------ |
| OpenAI   | AI Consultation Assistance | REST API | [`backend/src/services/ai-consultation.service.js`](backend/src/services/ai-consultation.service.js:1) |
| Stripe   | Healthcare Payments | SDK + Webhooks | Frontend + Backend integration |
| Twilio   | SMS Notifications | REST API | Backend SMS service |
| SendGrid | Email Communications | SDK | Backend email service |
| Supabase | Authentication | SDK | Frontend + Backend auth |
| AWS S3   | Healthcare Document Storage | SDK | Backend file uploads |

### Internal Integration Points

- **Frontend-Backend Communication**: REST API + Socket.IO for real-time features
- **Database Layer**: PostgreSQL with Drizzle ORM for type-safe operations  
- **Session Management**: Redis-based caching for user sessions and application data
- **File Upload Handling**: AWS S3 integration with Sharp image processing

## Development and Deployment

### Local Development Setup

**Current Working Setup:**
1. **Root Installation**: `npm install` (installs all workspace dependencies)
2. **Development Mode**: `npm run dev` (starts both backend and frontend concurrently)
3. **Database Setup**: `npm run db:init` (runs migrations and seeds)
4. **Individual Services**: `npm run dev:backend` or `npm run dev:frontend`

**Known Development Issues:**
- Database connection configuration varies between environments
- Environment variables management across multiple services
- Frontend/backend coordination during development

### Build and Deployment Process

**Current Deployment:**
- **Frontend**: Vercel deployment via [`vercel.json`](vercel.json:1)
- **Backend**: Needs separate hosting (current Vercel config only handles frontend)
- **Database**: Separate PostgreSQL hosting required
- **Static Assets**: Handled by Vercel for frontend

**Build Process:**
- **Frontend Build**: `cd frontend && npm run build` (Next.js production build)
- **Backend**: Direct Node.js execution (`npm start`)
- **Dependencies**: Workspace-aware installation and building

## Testing Reality

### Current Test Coverage

**Backend Testing:**
- **Unit Tests**: Jest configuration present (`npm test`)
- **Coverage**: Unknown, needs assessment
- **Integration Tests**: Limited evidence of comprehensive integration testing

**Frontend Testing:**  
- **Testing Framework**: Vitest + Testing Library configured
- **Unit Tests**: `npm run test` and `npm run test:ui`
- **E2E Tests**: No evidence of end-to-end testing setup

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests  
cd frontend && npm run test
cd frontend && npm run test:ui  # Visual test runner

# Full project test suite (needs implementation)
npm run test:all
```

## Production Readiness Enhancement Impact Analysis

### Files That Will Need Modification

Based on the production readiness requirements, these files will be affected:

**Security Hardening:**
- [`backend/src/app.js`](backend/src/app.js:1) - Add security middleware, HIPAA compliance headers
- [`backend/src/middleware/auth.js`](backend/src/middleware/auth.js:1) - Enhance session management, security timeouts
- All route files - Add input validation, sanitization, audit logging

**Scalability Improvements:**
- [`backend/src/config/database.js`](backend/src/config/database.js:1) - Add connection pooling, read replicas
- [`database/complete-schema.sql`](database/complete-schema.sql:1) - Add performance indexes, audit tables
- [`vercel.json`](vercel.json:1) - Optimize for production deployment patterns

**Monitoring and Logging:**
- [`backend/src/app.js`](backend/src/app.js:1) - Add comprehensive logging middleware
- All service files - Add structured logging, metrics collection
- Frontend components - Add error boundaries, performance monitoring

### New Files/Modules Needed

**Production Infrastructure:**
- `backend/src/middleware/audit-logging.js` - HIPAA-compliant audit trail
- `backend/src/config/monitoring.js` - Application performance monitoring
- `backend/src/services/health-check.service.js` - System health monitoring
- `docs/runbooks/` - Operational procedures and incident response

**Security Enhancements:**
- `backend/src/middleware/security-headers.js` - Production security headers
- `backend/src/services/encryption.service.js` - Data encryption at rest
- `backend/src/config/secrets.js` - Secure secrets management

**Performance Optimization:**
- `backend/src/middleware/caching.js` - Advanced caching strategies
- `backend/src/config/performance.js` - Performance optimization configuration
- `database/performance-indexes.sql` - Healthcare workload optimized indexes

### Integration Considerations

**Backward Compatibility:**
- All existing patient, provider, consultation APIs must remain functional
- Database schema changes must support existing data migration
- Frontend UI patterns must maintain consistency across portals

**External Service Integration:**
- Enhanced error handling for Stripe, Twilio, OpenAI, SendGrid dependencies
- Circuit breaker patterns for external service reliability
- Comprehensive retry logic with healthcare-appropriate backoff strategies

**HIPAA Compliance:**
- Audit logging for all patient data access must integrate with existing data models
- Encryption requirements must work with existing Supabase authentication
- Data retention policies must align with existing consultation and prescription workflows

## Appendix - Useful Commands and Scripts

### Frequently Used Commands

```bash
# Development
npm install                    # Install all workspace dependencies
npm run dev                   # Start both backend and frontend
npm run dev:backend          # Backend only (Express API)
npm run dev:frontend         # Frontend only (Next.js)

# Database Management
cd backend && npm run db:migrate     # Run database migrations
cd backend && npm run db:seed        # Seed initial data
cd backend && npm run db:init        # Full database setup
cd backend && npm run db:reset       # Reset and reseed database

# Testing
cd backend && npm test               # Backend unit tests
cd frontend && npm run test          # Frontend tests with Vitest
cd frontend && npm run test:ui       # Visual test runner

# Production Builds
npm run build                 # Build both frontend and backend
cd frontend && npm run build  # Frontend production build
cd backend && npm start       # Backend production mode
```

### Debugging and Troubleshooting

- **Application Logs**: Check backend console output during development
- **Database Connection**: Verify PostgreSQL connection via environment variables
- **Frontend Issues**: Next.js dev mode provides detailed error information
- **API Testing**: Use backend routes directly for API debugging
- **Build Issues**: Check workspace dependency resolution with `npm ls`

### Healthcare-Specific Considerations

**HIPAA Compliance:**
- Patient data encryption requirements affect database and API layers
- Audit logging must capture all data access and modifications
- Session timeout and security requirements impact authentication flow

**Clinical Workflow:**
- Consultation status transitions must maintain data integrity
- Prescription management requires controlled substance handling
- Provider licensing and availability affect scheduling and assignment logic

**Performance Requirements:**
- Healthcare workflows require sub-2-second response times
- Patient safety-critical operations need priority handling
- Real-time messaging system must handle provider-patient communications reliably