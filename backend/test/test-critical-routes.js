#!/usr/bin/env node

/**
 * Test script to verify all critical backend routes are working
 * This tests the routes mentioned in BACKEND_ISSUES_CRITICAL_MISSING_ROUTES.md
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

// Test routes that don't require authentication
const publicRoutes = [
  { method: 'GET', path: '/health', description: 'Health check' },
  { method: 'GET', path: '/api/providers', description: 'Get all providers (public)' },
];

// Test routes that would require authentication (we'll test structure only)
const protectedRoutes = [
  { method: 'POST', path: '/api/auth/login', description: 'Universal login endpoint' },
  { method: 'GET', path: '/api/auth/profile', description: 'Get user profile' },
  { method: 'GET', path: '/api/admin/dashboard', description: 'Admin dashboard data' },
  { method: 'GET', path: '/api/admin/audit-logs', description: 'Admin audit logs' },
  { method: 'GET', path: '/api/consultations/provider/queue', description: 'Provider consultation queue' },
  { method: 'GET', path: '/api/messages/unread-count', description: 'Unread message count' },
  { method: 'GET', path: '/api/files/test-id/download', description: 'File download endpoint' },
];

async function testRoute(method, path, description) {
  try {
    const url = `${BASE_URL}${path}`;
    console.log(`Testing ${method} ${path} - ${description}`);
    
    const response = await fetch(url, { method });
    const status = response.status;
    
    // For protected routes, 401 (Unauthorized) means the route exists but requires auth
    // For public routes, 200 means success
    // 404 means the route doesn't exist (this is what we're checking for)
    
    if (status === 404) {
      console.log(`❌ MISSING: ${method} ${path} returned 404 - Route not found`);
      return false;
    } else if (status === 401) {
      console.log(`✅ EXISTS: ${method} ${path} returned 401 - Route exists but requires auth`);
      return true;
    } else if (status === 200) {
      console.log(`✅ WORKING: ${method} ${path} returned 200 - Route working`);
      return true;
    } else {
      console.log(`⚠️  EXISTS: ${method} ${path} returned ${status} - Route exists`);
      return true;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${method} ${path} - ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing Critical Backend Routes\n');
  console.log('=' .repeat(60));
  
  let allPassed = true;
  
  // Test public routes
  console.log('\n📂 Testing Public Routes:');
  console.log('-'.repeat(40));
  for (const route of publicRoutes) {
    const passed = await testRoute(route.method, route.path, route.description);
    if (!passed) allPassed = false;
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
  }
  
  // Test protected routes (should return 401, not 404)
  console.log('\n🔒 Testing Protected Routes (expecting 401 Unauthorized):');
  console.log('-'.repeat(40));
  for (const route of protectedRoutes) {
    const passed = await testRoute(route.method, route.path, route.description);
    if (!passed) allPassed = false;
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
  }
  
  // Test specific patient and provider routes with dummy IDs
  console.log('\n👥 Testing Parameterized Routes:');
  console.log('-'.repeat(40));
  const paramRoutes = [
    { method: 'GET', path: '/api/patients/test-id/consultations', description: 'Patient consultations' },
    { method: 'GET', path: '/api/providers/test-id', description: 'Provider by ID' },
    { method: 'GET', path: '/api/providers/test-id/consultations', description: 'Provider consultations' },
    { method: 'GET', path: '/api/consultations/patient/test-id', description: 'Patient-specific consultations' },
  ];
  
  for (const route of paramRoutes) {
    const passed = await testRoute(route.method, route.path, route.description);
    if (!passed) allPassed = false;
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
  }
  
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('🎉 ALL CRITICAL ROUTES ARE IMPLEMENTED AND ACCESSIBLE!');
    console.log('✅ No missing routes found - the backend issues document may be outdated.');
  } else {
    console.log('❌ Some routes are missing or have issues.');
  }
  console.log('='.repeat(60));
}

// Run the tests
runTests().catch(console.error);