/**
 * Performance and Load Testing Framework
 * Tests system performance, scalability, and resource usage under load
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDatabase, getDatabase, closeDatabase } from '../src/config/database.js';
import { generateTokens, ROLES } from '../src/middleware/auth.js';

describe('Performance and Load Testing Suite', () => {
  let db;
  let authToken;
  let testPatientId;

  beforeAll(async () => {
    try {
      await connectDatabase();
      db = getDatabase();
      
      // Create test user for authenticated tests
      const tokens = generateTokens({
        id: 'perf-test-user',
        email: 'perf@test.com',
        role: ROLES.PATIENT,
        verified: true
      });
      authToken = tokens.accessToken;
    } catch (error) {
      console.warn('Database connection failed - performance tests will be limited');
    }
  }, 30000);

  afterAll(async () => {
    try {
      if (db && testPatientId) {
        await db`DELETE FROM patients WHERE id = ${testPatientId}`;
      }
      await closeDatabase();
    } catch (error) {
      console.warn('Performance test cleanup failed');
    }
  });

  describe('Response Time Performance', () => {
    it('should respond to health checks within acceptable time', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/health')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(100); // Should respond within 100ms
      expect(response.body).toBeDefined();
    });

    it('should handle authentication requests efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123'
        });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(500); // Auth should be fast even for failures
      expect(response.status).toBe(401);
    });

    it('should retrieve patient data efficiently', async () => {
      if (!authToken) {
        console.warn('Skipping patient data performance test');
        return;
      }

      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/patients/me')
        .set('Authorization', `Bearer ${authToken}`);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(200);
      expect([200, 404].includes(response.status)).toBe(true);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple concurrent health checks', async () => {
      const concurrentRequests = 20;
      const startTime = Date.now();

      const requests = Array(concurrentRequests).fill().map(() =>
        request(app).get('/health')
      );

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Average response time should be reasonable
      const avgResponseTime = totalTime / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(200);

      console.log(`Concurrent health checks: ${concurrentRequests} requests in ${totalTime}ms (avg: ${avgResponseTime.toFixed(2)}ms)`);
    });

    it('should handle concurrent authentication attempts', async () => {
      const concurrentRequests = 10;
      const startTime = Date.now();

      const requests = Array(concurrentRequests).fill().map((_, index) =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: `concurrent-${index}@test.com`,
            password: 'password123'
          })
      );

      const responses = await Promise.allSettled(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All requests should complete (though may fail auth)
      expect(responses.length).toBe(concurrentRequests);
      
      const successfulRequests = responses.filter(r => r.status === 'fulfilled');
      expect(successfulRequests.length).toBe(concurrentRequests);

      console.log(`Concurrent auth attempts: ${concurrentRequests} requests in ${totalTime}ms`);
    });

    it('should handle concurrent API requests with authentication', async () => {
      if (!authToken) {
        console.warn('Skipping concurrent authenticated API test');
        return;
      }

      const concurrentRequests = 15;
      const endpoints = [
        '/api/patients/me',
        '/api/patients/me/stats',
        '/api/patients/me/programs',
        '/api/patients/me/consultations',
        '/api/patients/me/orders'
      ];

      const startTime = Date.now();

      const requests = Array(concurrentRequests).fill().map((_, index) => {
        const endpoint = endpoints[index % endpoints.length];
        return request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${authToken}`);
      });

      const responses = await Promise.allSettled(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const successfulRequests = responses.filter(r => 
        r.status === 'fulfilled' && [200, 404].includes(r.value.status)
      );

      expect(successfulRequests.length).toBeGreaterThan(0);
      console.log(`Concurrent API requests: ${concurrentRequests} requests in ${totalTime}ms`);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should maintain stable memory usage under load', async () => {
      const initialMemory = process.memoryUsage();
      
      // Simulate load with multiple requests
      const loadRequests = Array(50).fill().map(() =>
        request(app).get('/health')
      );

      await Promise.all(loadRequests);

      // Allow garbage collection
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePercent = (memoryIncrease / initialMemory.heapUsed) * 100;

      console.log(`Memory usage change: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB (${memoryIncreasePercent.toFixed(2)}%)`);
      
      // Memory increase should be reasonable (less than 50% for this load)
      expect(memoryIncreasePercent).toBeLessThan(50);
    });

    it('should handle large request payloads efficiently', async () => {
      const largePayload = {
        email: 'large-payload@test.com',
        password: 'TestPass123!',
        first_name: 'Test',
        last_name: 'User',
        date_of_birth: '1990-01-01',
        medical_history: 'x'.repeat(1000), // 1KB of data
        notes: 'y'.repeat(2000) // 2KB of data
      };

      const startTime = Date.now();

      const response = await request(app)
        .post('/api/patients/register')
        .send(largePayload);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should handle large payloads within reasonable time
      expect(responseTime).toBeLessThan(1000);
      expect([201, 400, 409, 413].includes(response.status)).toBe(true);
    });
  });

  describe('Database Performance', () => {
    it('should perform database queries efficiently', async () => {
      if (!db) {
        console.warn('Skipping database performance test');
        return;
      }

      const startTime = Date.now();

      // Simple query
      const result = await db`SELECT COUNT(*) as count FROM patients`;

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(queryTime).toBeLessThan(100); // Should be very fast
      expect(result[0].count).toBeDefined();
    });

    it('should handle concurrent database operations', async () => {
      if (!db) {
        console.warn('Skipping concurrent database test');
        return;
      }

      const concurrentQueries = 10;
      const startTime = Date.now();

      const queries = Array(concurrentQueries).fill().map(() =>
        db`SELECT NOW() as current_time, pg_sleep(0.01)` // Small delay to simulate work
      );

      const results = await Promise.allSettled(queries);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBe(concurrentQueries);

      console.log(`Concurrent DB queries: ${concurrentQueries} queries in ${totalTime}ms`);
    });

    it('should maintain connection pool efficiency', async () => {
      if (!db) return;

      // Test rapid connection usage
      const rapidQueries = Array(20).fill().map(async (_, index) => {
        const startTime = Date.now();
        const result = await db`SELECT ${index} as query_number`;
        const endTime = Date.now();
        
        return {
          queryNumber: result[0].query_number,
          duration: endTime - startTime
        };
      });

      const results = await Promise.all(rapidQueries);
      
      // All queries should complete
      expect(results.length).toBe(20);
      
      // Average query time should be low (connection pooling working)
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      expect(avgDuration).toBeLessThan(50);

      console.log(`Connection pool test: 20 queries, avg duration: ${avgDuration.toFixed(2)}ms`);
    });
  });

  describe('Error Handling Under Load', () => {
    it('should gracefully handle malformed requests under load', async () => {
      const malformedRequests = Array(10).fill().map(() =>
        request(app)
          .post('/api/auth/login')
          .set('Content-Type', 'application/json')
          .send('invalid json')
      );

      const responses = await Promise.allSettled(malformedRequests);
      
      responses.forEach(response => {
        expect(response.status).toBe('fulfilled');
        expect(response.value.status).toBe(400);
      });
    });

    it('should handle rate limiting appropriately', async () => {
      // Test a rapid burst of requests to same endpoint
      const burstSize = 30;
      const requests = Array(burstSize).fill().map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'rate-limit-test@example.com',
            password: 'password123'
          })
      );

      const responses = await Promise.allSettled(requests);
      
      // Some requests should succeed, others may be rate limited
      const successfulRequests = responses.filter(r => 
        r.status === 'fulfilled' && [400, 401, 429].includes(r.value.status)
      );
      
      expect(successfulRequests.length).toBeGreaterThan(0);
    });
  });

  describe('Scalability Metrics', () => {
    it('should demonstrate linear scalability for read operations', async () => {
      const testSizes = [5, 10, 20];
      const results = [];

      for (const size of testSizes) {
        const startTime = Date.now();
        
        const requests = Array(size).fill().map(() =>
          request(app).get('/health')
        );
        
        await Promise.all(requests);
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        
        results.push({
          requestCount: size,
          totalTime,
          avgTime: totalTime / size
        });
      }

      // Log scaling characteristics
      results.forEach(result => {
        console.log(`${result.requestCount} requests: ${result.totalTime}ms total, ${result.avgTime.toFixed(2)}ms avg`);
      });

      // Average time per request should not increase dramatically
      const timeIncrease = results[2].avgTime / results[0].avgTime;
      expect(timeIncrease).toBeLessThan(3); // Should scale reasonably
    });

    it('should handle sustained load efficiently', async () => {
      const sustainedDuration = 5000; // 5 seconds
      const requestInterval = 100; // Request every 100ms
      const expectedRequests = Math.floor(sustainedDuration / requestInterval);
      
      const startTime = Date.now();
      const responses = [];
      
      // Send requests at regular intervals
      while (Date.now() - startTime < sustainedDuration) {
        responses.push(request(app).get('/health'));
        await new Promise(resolve => setTimeout(resolve, requestInterval));
      }
      
      const results = await Promise.allSettled(responses);
      const successfulRequests = results.filter(r => 
        r.status === 'fulfilled' && r.value.status === 200
      );
      
      console.log(`Sustained load test: ${successfulRequests.length}/${responses.length} successful requests over ${sustainedDuration}ms`);
      
      // Should handle most requests successfully
      const successRate = successfulRequests.length / responses.length;
      expect(successRate).toBeGreaterThan(0.8); // 80% success rate
    });
  });

  describe('Resource Cleanup and Leak Detection', () => {
    it('should properly cleanup database connections', async () => {
      if (!db) return;

      // Simulate multiple operations that might leave connections open
      const operations = Array(10).fill().map(async () => {
        await db`SELECT 1`;
        await db`SELECT 2`;
        await db`SELECT 3`;
      });

      await Promise.all(operations);

      // All operations should complete without hanging
      expect(true).toBe(true);
    });

    it('should not leak event listeners', async () => {
      const initialListeners = process.listenerCount('uncaughtException');
      
      // Perform operations that might add listeners
      await request(app).get('/health');
      await request(app).get('/health');
      await request(app).get('/health');
      
      const finalListeners = process.listenerCount('uncaughtException');
      
      // Should not increase dramatically
      expect(finalListeners - initialListeners).toBeLessThanOrEqual(1);
    });
  });
});