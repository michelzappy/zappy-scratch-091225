# API Documentation

## Overview

This documentation provides comprehensive API reference for the healthcare platform backend services.

## Table of Contents

1. [Authentication Services](#authentication-services)
2. [Patient Services](#patient-services)
3. [Provider Services](#provider-services)
4. [Appointment Services](#appointment-services)
5. [Medical Records Services](#medical-records-services)
6. [Prescription Services](#prescription-services)
7. [Admin Services](#admin-services)

## Getting Started

### Authentication

All API endpoints require authentication unless specified otherwise. Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Base URL

```
Production: https://api.yourdomain.com
Development: http://localhost:5000
```

### Response Format

All API responses follow a standard format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "requestId": "unique-request-id"
}
```

### Error Responses

Error responses include additional information:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": { ... },
  "timestamp": "2025-01-01T00:00:00.000Z",
  "requestId": "unique-request-id"
}
```

## Authentication Services

### POST /api/auth/login
Authenticate user and receive JWT token.

### POST /api/auth/logout
Invalidate current session.

### POST /api/auth/refresh
Refresh authentication token.

### POST /api/auth/forgot-password
Initiate password reset process.

### POST /api/auth/reset-password
Complete password reset with token.

## Patient Services

### GET /api/patients
Get list of patients (admin/provider only).

### GET /api/patients/:id
Get patient details.

### PUT /api/patients/:id
Update patient information.

### GET /api/patients/:id/appointments
Get patient's appointments.

### GET /api/patients/:id/records
Get patient's medical records.

### GET /api/patients/:id/prescriptions
Get patient's prescriptions.

## Provider Services

### GET /api/providers
Get list of providers.

### GET /api/providers/:id
Get provider details.

### GET /api/providers/:id/availability
Get provider's availability schedule.

### PUT /api/providers/:id/availability
Update provider's availability.

### GET /api/providers/:id/appointments
Get provider's appointments.

## Appointment Services

### GET /api/appointments
Get appointments list.

### POST /api/appointments
Create new appointment.

### GET /api/appointments/:id
Get appointment details.

### PUT /api/appointments/:id
Update appointment.

### DELETE /api/appointments/:id
Cancel appointment.

### POST /api/appointments/:id/start
Start appointment session.

### POST /api/appointments/:id/end
End appointment session.

## Medical Records Services

### GET /api/records
Get medical records (filtered by permissions).

### POST /api/records
Create new medical record.

### GET /api/records/:id
Get specific medical record.

### PUT /api/records/:id
Update medical record.

### POST /api/records/:id/attachments
Upload attachment to medical record.

## Prescription Services

### GET /api/prescriptions
Get prescriptions list.

### POST /api/prescriptions
Create new prescription.

### GET /api/prescriptions/:id
Get prescription details.

### PUT /api/prescriptions/:id
Update prescription.

### POST /api/prescriptions/:id/fill
Mark prescription as filled.

### POST /api/prescriptions/:id/cancel
Cancel prescription.

## Admin Services

### GET /api/admin/users
Get all users (admin only).

### POST /api/admin/users
Create new user (admin only).

### PUT /api/admin/users/:id
Update user (admin only).

### DELETE /api/admin/users/:id
Delete user (admin only).

### GET /api/admin/audit-logs
Get audit logs (admin only).

### GET /api/admin/analytics
Get system analytics (admin only).

## Rate Limiting

API endpoints are rate limited:
- Authentication endpoints: 5 requests per minute
- General endpoints: 100 requests per minute
- File uploads: 10 requests per minute

## HIPAA Compliance

All endpoints handling PHI (Protected Health Information) are:
- Encrypted in transit (TLS 1.2+)
- Logged for audit purposes
- Subject to role-based access control
- Encrypted at rest in the database

## Support

For API support, please contact:
- Email: api-support@yourdomain.com
- Documentation: https://docs.yourdomain.com
- Status: https://status.yourdomain.com
