#!/usr/bin/env node

/**
 * Create Comprehensive Test Data
 * Creates test patient, provider, consultations, prescriptions, orders, and inventory data
 */

import 'dotenv/config';
import { connectDatabase, closeDatabase } from './src/config/database.js';
import bcrypt from 'bcryptjs';

async function createTestData() {
  console.log('🩺 Creating comprehensive test data...');
  
  let db;
  
  try {
    // Connect to database
    db = await connectDatabase();
    console.log('✅ Database connected');
    
    // Hash passwords
    const patientPasswordHash = await bcrypt.hash('password123', 12);
    const providerPasswordHash = await bcrypt.hash('provider123', 12);
    
    // Check if test data already exists
    const existingPatient = await db`
      SELECT id FROM patients WHERE email = 'patient@example.com'
    `;
    
    if (existingPatient.length > 0) {
      console.log('⏭️  Test data already exists');
      return;
    }
    
    // Create test patient
    console.log('👤 Creating test patient...');
    const patientResult = await db`
      INSERT INTO patients (
        id, email, password_hash, first_name, last_name,
        date_of_birth, phone, gender, shipping_address, shipping_city, shipping_state, shipping_zip,
        blood_type, allergies, current_medications, medical_conditions,
        total_spent, total_orders, stripe_customer_id, has_valid_payment_method,
        email_verified, subscription_status, subscription_tier, subscription_id, subscription_active,
        created_at, updated_at, is_active
      )
      VALUES (
        gen_random_uuid(),
        'patient@example.com',
        ${patientPasswordHash},
        'John',
        'Doe',
        '1990-01-01',
        '+1234567890',
        'Male',
        '123 Test St',
        'Test City',
        'CA',
        '90210',
        'O+',
        ARRAY['Penicillin', 'Shellfish'],
        ARRAY['Metformin 500mg'],
        ARRAY['Type 2 Diabetes', 'Hypertension'],
        150.00,
        3,
        'cus_test123',
        true,
        true,
        'active',
        'premium',
        'sub_test123',
        true,
        NOW(),
        NOW(),
        true
      )
      RETURNING id
    `;
    const patientId = patientResult[0].id;
    console.log('✅ Test patient created');
    
    // Create test provider
    console.log('👨‍⚕️ Creating test provider...');
    const providerResult = await db`
      INSERT INTO providers (
        id, email, password_hash, first_name, last_name,
        title, phone, license_number, license_state, npi_number, specialties,
        total_consultations, rating, total_reviews, is_active, is_available,
        max_daily_consultations, current_daily_consultations,
        profile_image_url, bio, years_experience, education,
        created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        'provider@example.com',
        ${providerPasswordHash},
        'Dr. Jane',
        'Smith',
        'MD',
        '+1987654321',
        'MD123456',
        'CA',
        '1234567890',
        ARRAY['Internal Medicine', 'Diabetes Management'],
        150,
        4.8,
        25,
        true,
        true,
        20,
        5,
        'https://example.com/provider.jpg',
        'Experienced internal medicine physician specializing in diabetes care.',
        15,
        'Harvard Medical School, Residency at UCSF',
        NOW(),
        NOW()
      )
      RETURNING id
    `;
    const providerId = providerResult[0].id;
    console.log('✅ Test provider created');
    
    // Create consultation
    console.log('💬 Creating test consultation...');
    const consultationResult = await db`
      INSERT INTO consultations (
        id, patient_id, provider_id, consultation_type, chief_complaint,
        symptoms, symptom_duration, severity, urgency, photos_urls, attachments,
        intake_data, diagnosis, treatment_plan, internal_notes, provider_notes,
        status, queue_position, estimated_wait_minutes,
        submitted_at, assigned_at, reviewed_at, plan_sent_at, completed_at,
        medication_offered, medication_ordered, order_id,
        follow_up_required, follow_up_date, consultation_fee, is_paid,
        created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        ${patientId},
        ${providerId},
        'Diabetes Management',
        'Blood sugar levels have been elevated recently',
        ARRAY['Increased thirst', 'Frequent urination', 'Fatigue'],
        '2 weeks',
        6,
        'regular',
        ARRAY['https://example.com/glucose-chart.jpg'],
        '{"glucose_readings": [180, 195, 210, 185]}',
        '{"weight": "180 lbs", "height": "5''10\\"", "exercise": "minimal"}',
        'Type 2 Diabetes - Poorly controlled',
        'Adjust metformin dosage and add lifestyle modifications',
        'Patient needs closer monitoring',
        'Continue current medication with dosage increase',
        'completed',
        1,
        15,
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '1 day',
        true,
        true,
        gen_random_uuid(),
        true,
        NOW() + INTERVAL '30 days',
        0.00,
        true,
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '1 day'
      )
      RETURNING id
    `;
    const consultationId = consultationResult[0].id;
    console.log('✅ Test consultation created');
    
    // Create prescription
    console.log('💊 Creating test prescription...');
    const prescriptionResult = await db`
      INSERT INTO prescriptions (
        id, consultation_id, provider_id, patient_id,
        medication_name, generic_name, dosage, quantity, frequency, duration, instructions,
        refills, refills_remaining, next_refill_date, expiration_date, last_filled_date,
        status, is_controlled_substance, price, subscription_price,
        created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        ${consultationId},
        ${providerId},
        ${patientId},
        'Metformin',
        'Metformin HCl',
        '1000mg',
        60,
        'Twice daily',
        '30 days',
        'Take with meals to reduce stomach upset',
        5,
        4,
        NOW() + INTERVAL '30 days',
        NOW() + INTERVAL '1 year',
        NOW() - INTERVAL '1 day',
        'active',
        false,
        25.00,
        20.00,
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '1 day'
      )
      RETURNING id
    `;
    const prescriptionId = prescriptionResult[0].id;
    console.log('✅ Test prescription created');
    
    // Create order
    console.log('🛒 Creating test order...');
    const orderResult = await db`
      INSERT INTO orders (
        id, order_number, patient_id, consultation_id, prescription_id,
        subtotal, shipping_cost, tax_amount, discount_amount, total_amount,
        payment_status, payment_method, stripe_payment_intent_id, paid_at,
        shipping_address, shipping_city, shipping_state, shipping_zip, shipping_method,
        fulfillment_status, pharmacy_order_id, tracking_number, carrier,
        shipped_at, delivered_at, is_subscription, subscription_frequency, next_refill_date,
        notes, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        'ORD-' || EXTRACT(EPOCH FROM NOW())::TEXT,
        ${patientId},
        ${consultationId},
        ${prescriptionId},
        20.00,
        5.99,
        2.08,
        0.00,
        28.07,
        'completed',
        'card',
        'pi_test123',
        NOW() - INTERVAL '1 day',
        '123 Test St',
        'Test City',
        'CA',
        '90210',
        'standard',
        'delivered',
        'PHARM123',
        'TRK123456789',
        'UPS',
        NOW() - INTERVAL '1 day',
        NOW(),
        true,
        'monthly',
        NOW() + INTERVAL '30 days',
        'First order for diabetes medication',
        NOW() - INTERVAL '1 day',
        NOW()
      )
      RETURNING id
    `;
    const orderId = orderResult[0].id;
    console.log('✅ Test order created');
    
    // Create order items
    console.log('📦 Creating test order items...');
    await db`
      INSERT INTO order_items (
        id, order_id, medication_name, quantity, unit_price, total_price, created_at
      )
      VALUES (
        gen_random_uuid(),
        ${orderId},
        'Metformin 1000mg',
        60,
        0.33,
        20.00,
        NOW() - INTERVAL '1 day'
      )
    `;
    console.log('✅ Test order items created');
    
    // Create consultation messages
    console.log('💬 Creating test messages...');
    await db`
      INSERT INTO consultation_messages (
        id, consultation_id, sender_id, sender_type, recipient_id,
        message_type, content, attachments, is_read, read_at, is_urgent,
        created_at
      )
      VALUES 
      (
        gen_random_uuid(),
        ${consultationId},
        ${patientId},
        'patient',
        ${providerId},
        'question',
        'I have been experiencing some nausea after taking the medication. Is this normal?',
        '{}',
        true,
        NOW() - INTERVAL '1 day',
        false,
        NOW() - INTERVAL '1 day'
      ),
      (
        gen_random_uuid(),
        ${consultationId},
        ${providerId},
        'provider',
        ${patientId},
        'response',
        'Yes, nausea is a common side effect of Metformin. Try taking it with food and it should improve over time. If it persists, let me know.',
        '{}',
        true,
        NOW() - INTERVAL '1 day',
        false,
        NOW() - INTERVAL '1 day'
      )
    `;
    console.log('✅ Test messages created');
    
    // Create patient measurements
    console.log('📊 Creating test measurements...');
    await db`
      INSERT INTO patient_measurements (
        id, patient_id, weight, height, bmi, blood_pressure_systolic, blood_pressure_diastolic,
        heart_rate, temperature, oxygen_saturation, glucose_level, cholesterol_total,
        cholesterol_ldl, cholesterol_hdl, triglycerides, measurement_date, measurement_time,
        notes, created_at
      )
      VALUES 
      (
        gen_random_uuid(),
        ${patientId},
        180.5,
        70.0,
        25.9,
        140,
        90,
        75,
        98.6,
        98,
        185.0,
        220,
        140,
        45,
        150,
        CURRENT_DATE,
        CURRENT_TIME,
        'Recent checkup measurements',
        NOW()
      ),
      (
        gen_random_uuid(),
        ${patientId},
        179.2,
        70.0,
        25.7,
        135,
        85,
        72,
        98.4,
        99,
        175.0,
        215,
        135,
        48,
        145,
        CURRENT_DATE - INTERVAL '1 month',
        CURRENT_TIME,
        'Previous month measurements',
        NOW() - INTERVAL '1 month'
      )
    `;
    console.log('✅ Test measurements created');
    
    console.log('');
    console.log('🎉 COMPREHENSIVE TEST DATA CREATED SUCCESSFULLY!');
    console.log('');
    console.log('🔐 TEST CREDENTIALS:');
    console.log('   Patient Email: patient@example.com');
    console.log('   Patient Password: password123');
    console.log('   Provider Email: provider@example.com');
    console.log('   Provider Password: provider123');
    console.log('');
    console.log('📊 CREATED DATA:');
    console.log('   ✅ 1 Patient (John Doe)');
    console.log('   ✅ 1 Provider (Dr. Jane Smith)');
    console.log('   ✅ 1 Consultation (Diabetes Management)');
    console.log('   ✅ 1 Prescription (Metformin)');
    console.log('   ✅ 1 Order (Delivered)');
    console.log('   ✅ 1 Order Item');
    console.log('   ✅ 2 Messages (Patient-Provider conversation)');
    console.log('   ✅ 2 Health Measurements');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  } finally {
    if (db) {
      await closeDatabase();
    }
  }
}

// Run the script
createTestData().catch(console.error);