#!/usr/bin/env node

/**
 * Reference Data Seeds
 * Handles medications, pharmacies, and treatment plans
 * Only inserts if missing to avoid duplicates
 */

import { sql } from 'drizzle-orm';
import { 
  insertIfNotExists, 
  recordExists,
  logSeedOperation,
  getRecordCount 
} from '../scripts/seed-utils.js';

/**
 * Seed medications catalog
 * Essential medications for telehealth platform
 */
async function seedMedications(db) {
  logSeedOperation('Seeding medications');
  
  const medications = [
    {
      name: 'Semaglutide',
      generic_name: 'Semaglutide',
      brand_name: 'Ozempic®',
      category: 'Weight Loss',
      available_dosages: JSON.stringify([
        { strength: '0.25mg', form: 'injection' },
        { strength: '0.5mg', form: 'injection' },
        { strength: '1mg', form: 'injection' }
      ]),
      base_price: 299.00,
      subscription_discount: 0.15,
      requires_prescription: true,
      controlled_substance: false,
      active: true,
      stock_quantity: 1000,
      description: 'GLP-1 receptor agonist for weight management',
      side_effects: ['Nausea', 'Vomiting', 'Diarrhea', 'Constipation'],
      contraindications: ['Personal or family history of medullary thyroid carcinoma', 'Multiple Endocrine Neoplasia syndrome type 2']
    },
    {
      name: 'Sildenafil',
      generic_name: 'Sildenafil Citrate',
      brand_name: 'Viagra®',
      category: 'ED',
      available_dosages: JSON.stringify([
        { strength: '25mg', form: 'tablet' },
        { strength: '50mg', form: 'tablet' },
        { strength: '100mg', form: 'tablet' }
      ]),
      base_price: 30.00,
      subscription_discount: 0.20,
      requires_prescription: true,
      controlled_substance: false,
      active: true,
      stock_quantity: 5000,
      description: 'PDE5 inhibitor for erectile dysfunction',
      side_effects: ['Headache', 'Flushing', 'Indigestion', 'Nasal congestion'],
      contraindications: ['Nitrate medications', 'Severe heart disease', 'Recent stroke or heart attack']
    },
    {
      name: 'Finasteride',
      generic_name: 'Finasteride',
      brand_name: 'Propecia®',
      category: 'Hair Loss',
      available_dosages: JSON.stringify([
        { strength: '1mg', form: 'tablet' }
      ]),
      base_price: 25.00,
      subscription_discount: 0.15,
      requires_prescription: true,
      controlled_substance: false,
      active: true,
      stock_quantity: 3000,
      description: '5-alpha reductase inhibitor for male pattern baldness',
      side_effects: ['Decreased libido', 'Erectile dysfunction', 'Decreased ejaculate volume'],
      contraindications: ['Women who are or may become pregnant', 'Children']
    },
    {
      name: 'Minoxidil',
      generic_name: 'Minoxidil',
      brand_name: 'Rogaine®',
      category: 'Hair Loss',
      available_dosages: JSON.stringify([
        { strength: '2%', form: 'solution' },
        { strength: '5%', form: 'solution' }
      ]),
      base_price: 35.00,
      subscription_discount: 0.10,
      requires_prescription: false,
      controlled_substance: false,
      active: true,
      stock_quantity: 2000,
      description: 'Topical vasodilator for hair regrowth',
      side_effects: ['Scalp irritation', 'Unwanted hair growth on face/hands', 'Rapid heart rate'],
      contraindications: ['Scalp infections', 'Open wounds on scalp']
    },
    {
      name: 'Metformin',
      generic_name: 'Metformin Hydrochloride',
      brand_name: 'Glucophage®',
      category: 'Longevity',
      available_dosages: JSON.stringify([
        { strength: '500mg', form: 'tablet' },
        { strength: '850mg', form: 'tablet' },
        { strength: '1000mg', form: 'tablet' }
      ]),
      base_price: 15.00,
      subscription_discount: 0.10,
      requires_prescription: true,
      controlled_substance: false,
      active: true,
      stock_quantity: 4000,
      description: 'Biguanide for metabolic health and longevity',
      side_effects: ['Nausea', 'Diarrhea', 'Metallic taste', 'Vitamin B12 deficiency'],
      contraindications: ['Kidney disease', 'Liver disease', 'Heart failure']
    }
  ];

  try {
    let insertedCount = 0;
    
    for (const medication of medications) {
      const exists = await recordExists(db, 'medications', 'name', medication.name);
      
      if (!exists) {
        await db`
          INSERT INTO medications (
            id, name, generic_name, brand_name, category, available_dosages,
            base_price, subscription_discount, requires_prescription, controlled_substance,
            active, stock_quantity, description, side_effects, contraindications,
            created_at, updated_at
          )
          VALUES (
            gen_random_uuid(),
            ${medication.name},
            ${medication.generic_name},
            ${medication.brand_name},
            ${medication.category},
            ${medication.available_dosages}::jsonb,
            ${medication.base_price},
            ${medication.subscription_discount},
            ${medication.requires_prescription},
            ${medication.controlled_substance},
            ${medication.active},
            ${medication.stock_quantity},
            ${medication.description},
            ${medication.side_effects},
            ${medication.contraindications},
            NOW(),
            NOW()
          )
        `;
        insertedCount++;
      }
    }
    
    if (insertedCount > 0) {
      logSeedOperation(`✅ Inserted ${insertedCount} medications`);
    } else {
      logSeedOperation('⏭️  All medications already exist');
    }
  } catch (error) {
    console.error('❌ Error seeding medications:', error);
    throw error;
  }
}

/**
 * Seed pharmacies for fulfillment
 * Partner pharmacies for medication delivery
 */
async function seedPharmacies(db) {
  logSeedOperation('Seeding pharmacies');
  
  const pharmacies = [
    {
      name: 'TeleHealth Pharmacy Partners',
      api_endpoint: 'https://api.pharmacy-partner.com/v1',
      address: '123 Healthcare Blvd',
      city: 'San Francisco',
      state: 'CA',
      zip: '94105',
      phone: '1-800-PHARMACY',
      email: 'fulfillment@pharmacy-partner.com',
      supported_medications: ['Semaglutide', 'Sildenafil', 'Finasteride', 'Minoxidil', 'Metformin'],
      states_serviced: ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'WA', 'AZ', 'MA'],
      active: true,
      preferred: true
    },
    {
      name: 'National Compounding Pharmacy',
      api_endpoint: 'https://api.compounding-rx.com/v2',
      address: '456 Compound Way',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      phone: '1-800-COMPOUND',
      email: 'orders@compounding-rx.com',
      supported_medications: ['Semaglutide', 'Custom Compounds'],
      states_serviced: ['TX', 'CA', 'NY', 'FL', 'IL'],
      active: true,
      preferred: false
    }
  ];

  try {
    let insertedCount = 0;
    
    for (const pharmacy of pharmacies) {
      const exists = await recordExists(db, 'pharmacies', 'name', pharmacy.name);
      
      if (!exists) {
        await db`
          INSERT INTO pharmacies (
            id, name, api_endpoint, address, city, state, zip, phone, email,
            supported_medications, states_serviced, active, preferred,
            created_at, updated_at
          )
          VALUES (
            gen_random_uuid(),
            ${pharmacy.name},
            ${pharmacy.api_endpoint},
            ${pharmacy.address},
            ${pharmacy.city},
            ${pharmacy.state},
            ${pharmacy.zip},
            ${pharmacy.phone},
            ${pharmacy.email},
            ${pharmacy.supported_medications},
            ${pharmacy.states_serviced},
            ${pharmacy.active},
            ${pharmacy.preferred},
            NOW(),
            NOW()
          )
        `;
        insertedCount++;
      }
    }
    
    if (insertedCount > 0) {
      logSeedOperation(`✅ Inserted ${insertedCount} pharmacies`);
    } else {
      logSeedOperation('⏭️  All pharmacies already exist');
    }
  } catch (error) {
    console.error('❌ Error seeding pharmacies:', error);
    throw error;
  }
}

/**
 * Seed treatment plans
 * Only seed if treatment_plans table exists and is empty
 */
async function seedTreatmentPlans(db) {
  logSeedOperation('Checking treatment plans');
  
  try {
    // Check if treatment_plans table exists
    const tableExistsResult = await db`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'treatment_plans'
      ) as exists
    `;
    
    if (!tableExistsResult[0]?.exists) {
      logSeedOperation('⏭️  Treatment plans table does not exist, skipping');
      return;
    }

    // Check if any treatment plans exist
    const count = await getRecordCount(db, 'treatment_plans');
    
    if (count > 0) {
      logSeedOperation(`⏭️  Treatment plans already exist (${count} records)`);
      return;
    }

    // Basic treatment plans for essential conditions
    const treatmentPlans = [
      {
        condition: 'weightLoss',
        plan_tier: 'basic',
        name: 'Weight Loss Starter',
        price: 99.00,
        billing_period: 'month',
        protocol_key: 'starter',
        features: JSON.stringify([
          'Initial consultation',
          'Basic weight loss medication',
          'Monthly check-ins',
          'Email support'
        ]),
        medications: JSON.stringify([
          { sku: 'MET-500-TAB', qty: 60 }
        ]),
        is_popular: false,
        sort_order: 1
      },
      {
        condition: 'hairLoss',
        plan_tier: 'basic',
        name: 'Hair Loss Essential',
        price: 25.00,
        billing_period: 'month',
        protocol_key: 'prevention',
        features: JSON.stringify([
          'Finasteride prescription',
          'Quarterly consultations',
          'Progress tracking'
        ]),
        medications: JSON.stringify([
          { sku: 'FIN-1-TAB', qty: 30 }
        ]),
        is_popular: true,
        sort_order: 1
      },
      {
        condition: 'mensHealth',
        plan_tier: 'basic',
        name: 'ED Essential',
        price: 2.00,
        billing_period: 'dose',
        protocol_key: 'standard',
        features: JSON.stringify([
          'Sildenafil prescription',
          'Online consultations',
          'Discreet packaging'
        ]),
        medications: JSON.stringify([
          { sku: 'SIL-50-TAB', qty: 10 }
        ]),
        is_popular: true,
        sort_order: 1
      }
    ];

    let insertedCount = 0;
    
    for (const plan of treatmentPlans) {
      await db`
        INSERT INTO treatment_plans (
          id, condition, plan_tier, name, price, billing_period, protocol_key,
          features, medications, is_popular, sort_order, created_at, updated_at
        )
        VALUES (
          gen_random_uuid(),
          ${plan.condition},
          ${plan.plan_tier},
          ${plan.name},
          ${plan.price},
          ${plan.billing_period},
          ${plan.protocol_key},
          ${plan.features}::jsonb,
          ${plan.medications}::jsonb,
          ${plan.is_popular},
          ${plan.sort_order},
          NOW(),
          NOW()
        )
      `;
      insertedCount++;
    }
    
    logSeedOperation(`✅ Inserted ${insertedCount} treatment plans`);
  } catch (error) {
    console.error('❌ Error seeding treatment plans:', error);
    // Don't throw error if treatment_plans table doesn't exist
    if (!error.message.includes('does not exist')) {
      throw error;
    }
  }
}

/**
 * Main reference data seeding function
 */
export default async function seedReference(db) {
  logSeedOperation('Starting reference data seeding');
  
  try {
    // Seed medications
    await seedMedications(db);
    
    // Seed pharmacies
    await seedPharmacies(db);
    
    // Seed treatment plans (if table exists)
    await seedTreatmentPlans(db);
    
    logSeedOperation('✅ Reference data seeding completed successfully');
  } catch (error) {
    logSeedOperation('❌ Reference data seeding failed');
    throw error;
  }
}