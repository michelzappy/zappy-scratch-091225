import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { hipaaAuditLogger, generateAuditReport, hashPatientId } from '../../src/middleware/hipaaAudit.js';

// Mock dependencies
vi.mock('../../src/config/database.js', () => ({
  getDatabase: vi.fn()
}));
vi.mock('bcryptjs', () => ({
  default: {
    hashSync: vi.fn()
  }
}));

describe('HIPAA Audit Logging Middleware', () => {
  let app;
  let mockDb;
  
  beforeEach(async () => {
    app = express();
    app.use(express.json());
    
    // Mock database
    mockDb = {
      raw: vi.fn().mockResolvedValue({ rows: [] })
    };
    
    // Mock getDatabase
    const { getDatabase } = await import('../../src/config/database.js');
    vi.mocked(getDatabase).mockReturnValue(mockDb);
    
    // Mock bcrypt
    const bcrypt = await import('bcryptjs');
    vi.mocked(bcrypt.default.hashSync).mockReturnValue('hashed_patient_id');
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('hipaaAuditLogger middleware', () => {
    test('should log patient data access for /patients/me endpoint', async () => {
      app.use(hipaaAuditLogger);
      app.get('/patients/me', (req, res) => {
        req.user = { id: 'patient-123', role: 'patient' };
        res.json({ success: true });
      });
      
      const response = await request(app)
        .get('/patients/me')
        .expect(200);
      
      // Wait for async audit logging
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockDb.raw).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO patient_access_audit'),
        expect.arrayContaining([
          'hashed_patient_id',
          '/patients/me',
          'GET',
          'patient-123',
          'patient'
        ])
      );
    });
    
    test('should log patient data access for /patients/:id endpoint', async () => {
      app.use((req, res, next) => {
        req.user = { id: 'provider-456', role: 'provider' };
        next();
      });
      app.use(hipaaAuditLogger);
      app.get('/patients/:id', (req, res) => {
        res.json({ success: true });
      });
      
      await request(app)
        .get('/patients/patient-789')
        .expect(200);
      
      // Wait for async audit logging
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockDb.raw).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO patient_access_audit'),
        expect.arrayContaining([
          'hashed_patient_id',
          '/patients/patient-789',
          'GET',
          'provider-456',
          'provider'
        ])
      );
    });
    
    test('should not log audit for non-patient endpoints', async () => {
      app.use(hipaaAuditLogger);
      app.get('/providers', (req, res) => {
        res.json({ success: true });
      });
      
      await request(app)
        .get('/providers')
        .expect(200);
      
      // Wait for async audit logging
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockDb.raw).not.toHaveBeenCalled();
    });
    
    test('should handle missing patient ID gracefully', async () => {
      app.use(hipaaAuditLogger);
      app.get('/patients', (req, res) => {
        res.json({ success: true });
      });
      
      await request(app)
        .get('/patients')
        .expect(200);
      
      // Wait for async audit logging  
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should not attempt to log without patient ID
      expect(mockDb.raw).not.toHaveBeenCalled();
    });
    
    test('should continue request processing even if audit logging fails', async () => {
      // Mock database failure
      mockDb.raw.mockRejectedValue(new Error('Database connection failed'));
      
      app.use(hipaaAuditLogger);
      app.get('/patients/me', (req, res) => {
        req.user = { id: 'patient-123', role: 'patient' };
        res.json({ success: true });
      });
      
      const response = await request(app)
        .get('/patients/me')
        .expect(200);
      
      expect(response.body).toEqual({ success: true });
    });
    
    test('should sanitize sensitive query parameters', async () => {
      app.use(hipaaAuditLogger);
      app.get('/patients/me', (req, res) => {
        req.user = { id: 'patient-123', role: 'patient' };
        res.json({ success: true });
      });
      
      await request(app)
        .get('/patients/me?limit=10&ssn=123456789&email=test@example.com')
        .expect(200);
      
      // Wait for async audit logging
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockDb.raw).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO patient_access_audit'),
        expect.arrayContaining([
          expect.any(String), // patient_id_hash
          expect.any(String), // endpoint
          expect.any(String), // method
          expect.any(String), // user_id
          expect.any(String), // role
          expect.any(Date),   // timestamp
          expect.any(String), // ip
          expect.any(String), // user_agent
          '{"limit":"10"}'    // sanitized query params (no SSN or email)
        ])
      );
    });
  });
  
  describe('generateAuditReport', () => {
    test('should generate audit report for patient', async () => {
      const mockAuditData = [
        {
          endpoint_accessed: '/patients/me',
          http_method: 'GET',
          accessed_by_role: 'patient',
          access_timestamp: '2025-09-19T10:00:00Z',
          query_parameters: null
        },
        {
          endpoint_accessed: '/patients/patient-123',
          http_method: 'GET', 
          accessed_by_role: 'provider',
          access_timestamp: '2025-09-19T11:00:00Z',
          query_parameters: '{"include":"measurements"}'
        }
      ];
      
      mockDb.raw.mockResolvedValue({ rows: mockAuditData });
      
      const startDate = '2025-09-19';
      const endDate = '2025-09-20';
      const report = await generateAuditReport('patient-123', startDate, endDate);
      
      expect(report).toEqual({
        patient_id_hash: 'hashed_patient_id',
        period: { start: startDate, end: endDate },
        total_access_events: 2,
        access_events: mockAuditData
      });
      
      expect(mockDb.raw).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['hashed_patient_id', startDate, endDate]
      );
    });
  });
  
  describe('hashPatientId', () => {
    test('should hash patient ID consistently', () => {
      const patientId = 'patient-123';
      const hash1 = hashPatientId(patientId);
      const hash2 = hashPatientId(patientId);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toBe('hashed_patient_id');
    });
    
    test('should handle null patient ID', () => {
      const hash = hashPatientId(null);
      expect(hash).toBeNull();
    });
  });
});

describe('HIPAA Compliance Verification', () => {
  test('should never log actual patient data', async () => {
    const app = express();
    app.use(express.json());
    app.use(hipaaAuditLogger);
    app.get('/patients/me', (req, res) => {
      req.user = { id: 'patient-123', role: 'patient' };
      res.json({ 
        patient_id: 'patient-123',
        ssn: '123-45-6789',
        medical_record: 'sensitive data'
      });
    });
    
    const mockDb = {
      raw: vi.fn().mockResolvedValue({ rows: [] })
    };
    
    const { getDatabase } = await import('../../src/config/database.js');
    const bcrypt = await import('bcryptjs');
    vi.mocked(getDatabase).mockReturnValue(mockDb);
    vi.mocked(bcrypt.default.hashSync).mockReturnValue('hashed_patient_id');
    
    await request(app)
      .get('/patients/me')
      .expect(200);
    
    // Wait for async audit logging
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Verify no sensitive data in audit log
    const auditCall = mockDb.raw.mock.calls[0];
    const auditParams = auditCall[1];
    
    // Should contain hashed ID, not actual patient ID
    expect(auditParams[0]).toBe('hashed_patient_id');
    expect(auditParams).not.toContain('patient-123');
    expect(auditParams).not.toContain('123-45-6789');
    expect(auditParams).not.toContain('sensitive data');
  });
});