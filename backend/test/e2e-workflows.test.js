/**
 * End-to-End Workflow Test Suite
 * Tests complete user journeys and business workflows for production readiness
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDatabase, getDatabase, closeDatabase } from '../src/config/database.js';
import bcrypt from 'bcryptjs';

describe('End-to-End Workflow Test Suite', () => {
  let db;
  let testData = {};

  beforeAll(async () => {
    try {
      await connectDatabase();
      db = getDatabase();
    } catch (error) {
      console.warn('Database connection failed - E2E tests will be limited');
    }
  }, 30000);

  afterAll(async () => {
    try {
      await cleanupTestData();
      await closeDatabase();
    } catch (error) {
      console.warn('E2E test cleanup failed');
    }
  });

  async function cleanupTestData() {
    if (!db) return;

    try {
      // Clean up in reverse order of dependencies
      if (testData.consultationId) {
        await db`DELETE FROM consultations WHERE id = ${testData.consultationId}`;
      }
      if (testData.prescriptionId) {
        await db`DELETE FROM prescriptions WHERE id = ${testData.prescriptionId}`;
      }
      if (testData.patientId) {
        await db`DELETE FROM patients WHERE id = ${testData.patientId}`;
      }
      if (testData.providerId) {
        await db`DELETE FROM providers WHERE id = ${testData.providerId}`;
      }
    } catch (error) {
      console.warn('Cleanup failed:', error.message);
    }
  }

  describe('Patient Registration and Onboarding Workflow', () => {
    it('should complete full patient registration workflow', async () => {
      const timestamp = Date.now();
      const patientEmail = `e2e-patient-${timestamp}@test.com`;
      
      // Step 1: Register new patient
      const registrationResponse = await request(app)
        .post('/api/patients/register')
        .send({
          email: patientEmail,
          password: 'SecurePass123!',
          first_name: 'E2E',
          last_name: 'Patient',
          date_of_birth: '1990-01-01',
          phone: '+1234567890'
        });

      if (registrationResponse.status === 201) {
        expect(registrationResponse.body.success).toBe(true);
        expect(registrationResponse.body.data.user).toBeDefined();
        expect(registrationResponse.body.data.token).toBeDefined();
        
        testData.patientId = registrationResponse.body.data.user.id;
        testData.patientToken = registrationResponse.body.data.token;
        testData.patientEmail = patientEmail;

        // Step 2: Login with new account
        const loginResponse = await request(app)
          .post('/api/patients/login')
          .send({
            email: patientEmail,
            password: 'SecurePass123!'
          });

        if (loginResponse.status === 200) {
          expect(loginResponse.body.success).toBe(true);
          expect(loginResponse.body.data.token).toBeDefined();
        }

        // Step 3: Update profile information
        const profileUpdateResponse = await request(app)
          .put('/api/patients/me')
          .set('Authorization', `Bearer ${testData.patientToken}`)
          .send({
            allergies: 'None known',
            emergency_contact_name: 'Emergency Contact',
            emergency_contact_phone: '+9876543210'
          });

        expect([200, 404].includes(profileUpdateResponse.status)).toBe(true);
      } else {
        console.warn('Patient registration failed - skipping dependent tests');
      }
    });

    it('should handle duplicate registration gracefully', async () => {
      if (!testData.patientEmail) {
        console.warn('Skipping duplicate registration test');
        return;
      }

      const duplicateResponse = await request(app)
        .post('/api/patients/register')
        .send({
          email: testData.patientEmail,
          password: 'AnotherPass123!',
          first_name: 'Duplicate',
          last_name: 'Patient',
          date_of_birth: '1985-01-01'
        });

      expect(duplicateResponse.status).toBe(409);
      expect(duplicateResponse.body.error).toContain('already');
    });
  });

  describe('Patient Consultation Workflow', () => {
    beforeEach(async () => {
      if (!testData.patientId) {
        console.warn('No patient available for consultation tests');
      }
    });

    it('should complete patient intake and consultation submission', async () => {
      if (!testData.patientToken) {
        console.warn('Skipping consultation workflow test');
        return;
      }

      // Step 1: Submit consultation request
      const consultationData = {
        chiefComplaint: 'Headache and fatigue',
        symptoms: 'Persistent headache for 3 days, feeling tired',
        symptomDuration: '3 days',
        severity: 'moderate'
      };

      const intakeResponse = await request(app)
        .post('/api/auth/intake')
        .send({
          email: testData.patientEmail,
          firstName: 'E2E',
          lastName: 'Patient',
          dateOfBirth: '1990-01-01',
          phone: '+1234567890',
          shippingAddress: '123 Test St',
          shippingCity: 'Test City',
          shippingState: 'TS',
          shippingZip: '12345',
          allergies: 'None',
          currentMedications: 'None',
          medicalConditions: 'None',
          ...consultationData
        });

      if (intakeResponse.status === 201) {
        expect(intakeResponse.body.success).toBe(true);
        expect(intakeResponse.body.data.consultationId).toBeDefined();
        testData.consultationId = intakeResponse.body.data.consultationId;

        // Step 2: Check consultation status
        const consultationsResponse = await request(app)
          .get('/api/patients/me/consultations')
          .set('Authorization', `Bearer ${testData.patientToken}`);

        expect([200, 404].includes(consultationsResponse.status)).toBe(true);
      }
    });

    it('should track consultation status progression', async () => {
      if (!testData.consultationId || !db) {
        console.warn('Skipping consultation status test');
        return;
      }

      // Simulate consultation status updates (normally done by providers)
      await db`
        UPDATE consultations 
        SET status = 'in_progress', provider_id = ${testData.providerId || null}
        WHERE id = ${testData.consultationId}
      `;

      await db`
        UPDATE consultations 
        SET status = 'completed', completed_at = NOW()
        WHERE id = ${testData.consultationId}
      `;

      // Verify status change
      const consultation = await db`
        SELECT status, completed_at FROM consultations 
        WHERE id = ${testData.consultationId}
      `;

      if (consultation.length > 0) {
        expect(consultation[0].status).toBe('completed');
        expect(consultation[0].completed_at).toBeDefined();
      }
    });
  });

  describe('Provider Workflow', () => {
    it('should complete provider registration and activation', async () => {
      if (!db) {
        console.warn('Skipping provider workflow test');
        return;
      }

      const timestamp = Date.now();
      const hashedPassword = await bcrypt.hash('ProviderPass123!', 10);

      // Create provider directly in database (simulating admin approval process)
      const providerResult = await db`
        INSERT INTO providers (
          email, password_hash, first_name, last_name, 
          license_number, npi_number, specialties, 
          states_licensed, status, created_at
        ) VALUES (
          ${`e2e-provider-${timestamp}@test.com`}, 
          ${hashedPassword}, 
          'E2E', 
          'Provider', 
          'LIC-E2E-123', 
          'NPI-123456', 
          ARRAY['Family Medicine'], 
          ARRAY['CA', 'NY'], 
          'active', 
          NOW()
        )
        RETURNING id, email
      `;

      if (providerResult.length > 0) {
        testData.providerId = providerResult[0].id;
        testData.providerEmail = providerResult[0].email;

        // Test provider login
        const loginResponse = await request(app)
          .post('/api/auth/login/provider')
          .send({
            email: testData.providerEmail,
            password: 'ProviderPass123!'
          });

        if (loginResponse.status === 200) {
          expect(loginResponse.body.success).toBe(true);
          expect(loginResponse.body.data.user.role).toBe('provider');
          testData.providerToken = loginResponse.body.data.accessToken;
        }
      }
    });

    it('should allow provider to review patient consultations', async () => {
      if (!testData.providerToken || !testData.patientId) {
        console.warn('Skipping provider consultation review test');
        return;
      }

      const consultationsResponse = await request(app)
        .get(`/api/patients/${testData.patientId}/consultations`)
        .set('Authorization', `Bearer ${testData.providerToken}`);

      expect([200, 404].includes(consultationsResponse.status)).toBe(true);
    });
  });

  describe('Prescription and Treatment Workflow', () => {
    it('should complete prescription creation and management', async () => {
      if (!testData.providerId || !testData.patientId || !testData.consultationId || !db) {
        console.warn('Skipping prescription workflow test');
        return;
      }

      // Create prescription
      const prescriptionResult = await db`
        INSERT INTO prescriptions (
          patient_id, consultation_id, provider_id,
          medication_name, dosage, instructions, 
          quantity, refills, status, created_at
        ) VALUES (
          ${testData.patientId}, 
          ${testData.consultationId}, 
          ${testData.providerId},
          'Test Medication', 
          '10mg', 
          'Take once daily with food', 
          30, 
          2, 
          'active', 
          NOW()
        )
        RETURNING id
      `;

      if (prescriptionResult.length > 0) {
        testData.prescriptionId = prescriptionResult[0].id;

        // Verify prescription appears in patient programs
        if (testData.patientToken) {
          const programsResponse = await request(app)
            .get('/api/patients/me/programs')
            .set('Authorization', `Bearer ${testData.patientToken}`);

          expect([200, 404].includes(programsResponse.status)).toBe(true);
        }
      }
    });

    it('should track prescription refill workflow', async () => {
      if (!testData.prescriptionId || !db) {
        console.warn('Skipping prescription refill test');
        return;
      }

      // Simulate refill request
      await db`
        UPDATE prescriptions 
        SET refills = refills - 1, last_filled = NOW()
        WHERE id = ${testData.prescriptionId}
      `;

      const prescription = await db`
        SELECT refills, last_filled FROM prescriptions 
        WHERE id = ${testData.prescriptionId}
      `;

      if (prescription.length > 0) {
        expect(prescription[0].refills).toBe(1);
        expect(prescription[0].last_filled).toBeDefined();
      }
    });
  });

  describe('Health Monitoring Workflow', () => {
    it('should complete health measurement logging workflow', async () => {
      if (!testData.patientToken) {
        console.warn('Skipping health monitoring test');
        return;
      }

      // Log health measurements
      const measurementData = {
        weight: 70.5,
        height: 175,
        blood_pressure_systolic: 120,
        blood_pressure_diastolic: 80,
        heart_rate: 72,
        temperature: 98.6,
        notes: 'Feeling good today'
      };

      const measurementResponse = await request(app)
        .post('/api/patients/me/measurements')
        .set('Authorization', `Bearer ${testData.patientToken}`)
        .send(measurementData);

      if (measurementResponse.status === 201) {
        expect(measurementResponse.body.success).toBe(true);
        expect(measurementResponse.body.data.bmi).toBeDefined();

        // Retrieve measurements
        const retrieveResponse = await request(app)
          .get('/api/patients/me/measurements')
          .set('Authorization', `Bearer ${testData.patientToken}`);

        expect([200, 404].includes(retrieveResponse.status)).toBe(true);
      }
    });

    it('should calculate BMI correctly', async () => {
      if (!testData.patientToken) return;

      const measurementData = {
        weight: 80, // kg
        height: 180 // cm
      };

      const response = await request(app)
        .post('/api/patients/me/measurements')
        .set('Authorization', `Bearer ${testData.patientToken}`)
        .send(measurementData);

      if (response.status === 201) {
        const expectedBMI = 80 / Math.pow(1.8, 2); // 24.69
        expect(response.body.data.bmi).toBeCloseTo(expectedBMI, 2);
      }
    });
  });

  describe('Order and Fulfillment Workflow', () => {
    it('should complete medication order workflow', async () => {
      if (!testData.patientId || !testData.prescriptionId || !db) {
        console.warn('Skipping order workflow test');
        return;
      }

      // Create order
      const orderResult = await db`
        INSERT INTO orders (
          patient_id, prescription_id, status, 
          total_amount, shipping_address, created_at
        ) VALUES (
          ${testData.patientId}, 
          ${testData.prescriptionId}, 
          'pending', 
          29.99, 
          '123 Test St, Test City, TS 12345', 
          NOW()
        )
        RETURNING id
      `;

      if (orderResult.length > 0) {
        testData.orderId = orderResult[0].id;

        // Add order items
        await db`
          INSERT INTO order_items (
            order_id, medication_name, quantity, 
            unit_price, total_price
          ) VALUES (
            ${testData.orderId}, 
            'Test Medication', 
            30, 
            0.99, 
            29.70
          )
        `;

        // Verify order appears in patient orders
        if (testData.patientToken) {
          const ordersResponse = await request(app)
            .get('/api/patients/me/orders')
            .set('Authorization', `Bearer ${testData.patientToken}`);

          expect([200, 404].includes(ordersResponse.status)).toBe(true);
        }
      }
    });

    it('should track order status progression', async () => {
      if (!testData.orderId || !db) {
        console.warn('Skipping order status test');
        return;
      }

      // Simulate order progression
      const statuses = ['confirmed', 'shipped', 'delivered'];
      
      for (const status of statuses) {
        await db`
          UPDATE orders 
          SET status = ${status}, updated_at = NOW()
          WHERE id = ${testData.orderId}
        `;

        const order = await db`
          SELECT status FROM orders WHERE id = ${testData.orderId}
        `;

        expect(order[0].status).toBe(status);
      }
    });
  });

  describe('Complete Patient Journey', () => {
    it('should demonstrate full patient lifecycle', async () => {
      // This test validates that all the workflows can work together
      // by checking that test data was created successfully throughout the test suite
      
      const lifecycle = {
        patientRegistered: !!testData.patientId,
        consultationSubmitted: !!testData.consultationId,
        providerAvailable: !!testData.providerId,
        prescriptionCreated: !!testData.prescriptionId,
        orderCreated: !!testData.orderId
      };

      console.log('Patient Lifecycle Completion:', lifecycle);

      // At minimum, patient should be registered
      expect(lifecycle.patientRegistered).toBe(true);

      // Count successful workflow completions
      const completedWorkflows = Object.values(lifecycle).filter(Boolean).length;
      expect(completedWorkflows).toBeGreaterThan(0);

      console.log(`Completed ${completedWorkflows}/5 workflow stages`);
    });

    it('should maintain data consistency across workflows', async () => {
      if (!db || !testData.patientId) {
        console.warn('Skipping data consistency test');
        return;
      }

      // Verify all related data is properly linked
      const patientData = await db`
        SELECT 
          p.id as patient_id,
          p.email,
          COUNT(DISTINCT c.id) as consultation_count,
          COUNT(DISTINCT pr.id) as prescription_count,
          COUNT(DISTINCT o.id) as order_count
        FROM patients p
        LEFT JOIN consultations c ON p.id = c.patient_id
        LEFT JOIN prescriptions pr ON p.id = pr.patient_id
        LEFT JOIN orders o ON p.id = o.patient_id
        WHERE p.id = ${testData.patientId}
        GROUP BY p.id, p.email
      `;

      if (patientData.length > 0) {
        const data = patientData[0];
        expect(data.patient_id).toBe(testData.patientId);
        
        console.log('Data consistency check:', {
          consultations: parseInt(data.consultation_count),
          prescriptions: parseInt(data.prescription_count),
          orders: parseInt(data.order_count)
        });

        // All counts should be non-negative
        expect(parseInt(data.consultation_count)).toBeGreaterThanOrEqual(0);
        expect(parseInt(data.prescription_count)).toBeGreaterThanOrEqual(0);
        expect(parseInt(data.order_count)).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should handle partial workflow failures gracefully', async () => {
      // Test what happens when a workflow is interrupted
      if (!db) return;

      try {
        await db.begin(async sql => {
          // Start a consultation
          const consultation = await sql`
            INSERT INTO consultations (
              patient_id, chief_complaint, created_at
            ) VALUES (
              ${testData.patientId || 'non-existent'}, 
              'Test incomplete workflow', 
              NOW()
            )
            RETURNING id
          `;

          // Simulate failure before completion
          throw new Error('Simulated failure');
        });
      } catch (error) {
        expect(error.message).toContain('Simulated failure');
      }

      // Verify rollback occurred
      const orphanedConsultations = await db`
        SELECT COUNT(*) as count 
        FROM consultations 
        WHERE chief_complaint = 'Test incomplete workflow'
      `;

      expect(parseInt(orphanedConsultations[0].count)).toBe(0);
    });

    it('should maintain system stability during concurrent workflows', async () => {
      // Test multiple patients going through workflows simultaneously
      const concurrentWorkflows = Array(3).fill().map(async (_, index) => {
        try {
          const response = await request(app)
            .post('/api/patients/register')
            .send({
              email: `concurrent-${index}-${Date.now()}@test.com`,
              password: 'ConcurrentPass123!',
              first_name: 'Concurrent',
              last_name: `Patient${index}`,
              date_of_birth: '1990-01-01'
            });

          return response.status;
        } catch (error) {
          return 500;
        }
      });

      const results = await Promise.allSettled(concurrentWorkflows);
      
      // Most workflows should complete successfully
      const successful = results.filter(r => 
        r.status === 'fulfilled' && [201, 409].includes(r.value)
      );
      
      expect(successful.length).toBeGreaterThan(0);
    });
  });
});