import { pgTable, uuid, text, timestamp, boolean, integer, decimal, jsonb, pgEnum, time, inet, serial, date, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define ENUMs to match complete-schema.sql
export const consultationStatusEnum = pgEnum('consultation_status', [
  'pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'reviewed'
]);

export const urgencyEnum = pgEnum('urgency', [
  'regular', 'urgent', 'emergency'
]);

export const prescriptionStatusEnum = pgEnum('prescription_status', [
  'active', 'expired', 'cancelled', 'on_hold'
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending', 'processing', 'completed', 'failed', 'refunded'
]);

export const fulfillmentStatusEnum = pgEnum('fulfillment_status', [
  'pending', 'processing', 'shipped', 'delivered', 'returned'
]);

export const senderTypeEnum = pgEnum('sender_type', [
  'patient', 'provider', 'admin'
]);

export const ticketStatusEnum = pgEnum('ticket_status', [
  'open', 'in_progress', 'resolved', 'closed'
]);

export const ticketPriorityEnum = pgEnum('ticket_priority', [
  'low', 'medium', 'high', 'critical'
]);

// Enhanced Patients table matching complete-schema.sql
export const patients = pgTable('patients', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  dateOfBirth: date('date_of_birth').notNull(),
  gender: varchar('gender', { length: 20 }),
  
  // Shipping address
  shippingAddress: text('shipping_address'),
  shippingCity: varchar('shipping_city', { length: 100 }),
  shippingState: varchar('shipping_state', { length: 2 }),
  shippingZip: varchar('shipping_zip', { length: 10 }),
  
  // Medical information
  allergies: text('allergies'),
  currentMedications: text('current_medications'),
  medicalConditions: text('medical_conditions'),
  bloodType: varchar('blood_type', { length: 10 }),
  
  // Subscription and account tracking
  subscriptionTier: varchar('subscription_tier', { length: 50 }).default('free'),
  subscriptionActive: boolean('subscription_active').default(false),
  subscriptionStartDate: date('subscription_start_date'),
  subscriptionEndDate: date('subscription_end_date'),
  totalSpent: decimal('total_spent', { precision: 10, scale: 2 }).default('0'),
  totalOrders: integer('total_orders').default(0),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  
  // Profile
  profileImageUrl: text('profile_image_url'),
  emergencyContactName: varchar('emergency_contact_name', { length: 100 }),
  emergencyContactPhone: varchar('emergency_contact_phone', { length: 20 }),
  insuranceProvider: varchar('insurance_provider', { length: 100 }),
  insurancePolicyNumber: varchar('insurance_policy_number', { length: 100 }),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  lastLogin: timestamp('last_login', { withTimezone: true }),
  isActive: boolean('is_active').default(true)
});

// Enhanced Providers table matching complete-schema.sql
export const providers = pgTable('providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  title: varchar('title', { length: 20 }), // Dr., NP, PA, etc.
  phone: varchar('phone', { length: 20 }),
  licenseNumber: varchar('license_number', { length: 100 }),
  licenseState: varchar('license_state', { length: 2 }),
  npiNumber: varchar('npi_number', { length: 20 }),
  specialties: text('specialties').array(),
  
  // Statistics
  totalConsultations: integer('total_consultations').default(0),
  averageResponseTimeMinutes: integer('average_response_time_minutes'),
  rating: decimal('rating', { precision: 3, scale: 2 }),
  totalReviews: integer('total_reviews').default(0),
  
  // Availability
  isActive: boolean('is_active').default(true),
  isAvailable: boolean('is_available').default(true),
  maxDailyConsultations: integer('max_daily_consultations').default(50),
  currentDailyConsultations: integer('current_daily_consultations').default(0),
  
  // Profile
  profileImageUrl: text('profile_image_url'),
  bio: text('bio'),
  yearsExperience: integer('years_experience'),
  education: text('education'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  lastLogin: timestamp('last_login', { withTimezone: true })
});

// Admin users table
export const adminUsers = pgTable('admin_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  role: varchar('role', { length: 50 }).default('admin'), // admin, super_admin, support
  permissions: jsonb('permissions'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  lastLogin: timestamp('last_login', { withTimezone: true })
});

// Enhanced Consultations table with intake data
export const consultations = pgTable('consultations', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  providerId: uuid('provider_id').references(() => providers.id),
  
  // Intake data
  consultationType: varchar('consultation_type', { length: 100 }).notNull(),
  chiefComplaint: text('chief_complaint').notNull(),
  symptoms: text('symptoms').array(),
  symptomDuration: varchar('symptom_duration', { length: 100 }),
  severity: integer('severity'), // 1-10 scale
  urgency: urgencyEnum('urgency').default('regular'),
  photosUrls: text('photos_urls').array(),
  attachments: jsonb('attachments'),
  
  // Complete intake form data (from health quiz)
  intakeData: jsonb('intake_data'),
  
  // Provider assessment
  diagnosis: text('diagnosis'),
  treatmentPlan: text('treatment_plan'),
  internalNotes: text('internal_notes'),
  providerNotes: text('provider_notes'),
  
  // Status tracking
  status: varchar('status', { length: 50 }).default('pending'),
  queuePosition: integer('queue_position'),
  estimatedWaitMinutes: integer('estimated_wait_minutes'),
  
  // Timestamps
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow(),
  assignedAt: timestamp('assigned_at', { withTimezone: true }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  planSentAt: timestamp('plan_sent_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  
  // Conversion tracking
  medicationOffered: boolean('medication_offered').default(false),
  medicationOrdered: boolean('medication_ordered').default(false),
  orderId: uuid('order_id'),
  
  // Follow-up
  followUpRequired: boolean('follow_up_required').default(false),
  followUpDate: date('follow_up_date'),
  
  // Pricing
  consultationFee: decimal('consultation_fee', { precision: 10, scale: 2 }).default('0'),
  isPaid: boolean('is_paid').default(false),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// Prescriptions table
export const prescriptions = pgTable('prescriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  consultationId: uuid('consultation_id').notNull().references(() => consultations.id, { onDelete: 'cascade' }),
  providerId: uuid('provider_id').notNull().references(() => providers.id),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  
  // Medication details
  medicationName: varchar('medication_name', { length: 255 }).notNull(),
  genericName: varchar('generic_name', { length: 255 }),
  dosage: varchar('dosage', { length: 100 }),
  quantity: integer('quantity'),
  frequency: varchar('frequency', { length: 100 }),
  duration: varchar('duration', { length: 100 }),
  instructions: text('instructions'),
  refills: integer('refills').default(0),
  refillsRemaining: integer('refills_remaining').default(0),
  
  // Dates
  nextRefillDate: date('next_refill_date'),
  expirationDate: date('expiration_date'),
  lastFilledDate: date('last_filled_date'),
  
  // Status
  status: prescriptionStatusEnum('status').default('active'),
  isControlledSubstance: boolean('is_controlled_substance').default(false),
  
  // Pricing
  price: decimal('price', { precision: 10, scale: 2 }),
  subscriptionPrice: decimal('subscription_price', { precision: 10, scale: 2 }),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// Inventory management
export const inventory = pgTable('inventory', {
  id: uuid('id').primaryKey().defaultRandom(),
  sku: varchar('sku', { length: 100 }).unique().notNull(),
  medicationName: varchar('medication_name', { length: 255 }).notNull(),
  genericName: varchar('generic_name', { length: 255 }),
  strength: varchar('strength', { length: 50 }),
  form: varchar('form', { length: 50 }),
  
  // Stock levels
  quantityOnHand: integer('quantity_on_hand').default(0),
  quantityReserved: integer('quantity_reserved').default(0),
  reorderPoint: integer('reorder_point').default(10),
  reorderQuantity: integer('reorder_quantity').default(100),
  
  // Pricing
  costPerUnit: decimal('cost_per_unit', { precision: 10, scale: 2 }),
  retailPrice: decimal('retail_price', { precision: 10, scale: 2 }),
  subscriptionPrice: decimal('subscription_price', { precision: 10, scale: 2 }),
  
  // Supplier info
  supplierName: varchar('supplier_name', { length: 200 }),
  supplierSku: varchar('supplier_sku', { length: 100 }),
  leadTimeDays: integer('lead_time_days').default(7),
  
  // Categories
  category: varchar('category', { length: 100 }),
  subcategory: varchar('subcategory', { length: 100 }),
  tags: text('tags').array(),
  
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// Orders table
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: varchar('order_number', { length: 50 }).unique(),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  consultationId: uuid('consultation_id').references(() => consultations.id),
  prescriptionId: uuid('prescription_id').references(() => prescriptions.id),
  
  // Totals
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }),
  shippingCost: decimal('shipping_cost', { precision: 10, scale: 2 }).default('0'),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).default('0'),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }),
  
  // Payment
  paymentStatus: paymentStatusEnum('payment_status').default('pending'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  
  // Shipping
  shippingAddress: text('shipping_address'),
  shippingCity: varchar('shipping_city', { length: 100 }),
  shippingState: varchar('shipping_state', { length: 2 }),
  shippingZip: varchar('shipping_zip', { length: 10 }),
  shippingMethod: varchar('shipping_method', { length: 50 }),
  
  // Fulfillment
  fulfillmentStatus: fulfillmentStatusEnum('fulfillment_status').default('pending'),
  pharmacyOrderId: varchar('pharmacy_order_id', { length: 100 }),
  trackingNumber: varchar('tracking_number', { length: 100 }),
  carrier: varchar('carrier', { length: 50 }),
  shippedAt: timestamp('shipped_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  
  // Subscription
  isSubscription: boolean('is_subscription').default(false),
  subscriptionFrequency: varchar('subscription_frequency', { length: 50 }),
  nextRefillDate: date('next_refill_date'),
  
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// Order line items
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  inventoryId: uuid('inventory_id').references(() => inventory.id),
  prescriptionId: uuid('prescription_id').references(() => prescriptions.id),
  
  medicationName: varchar('medication_name', { length: 255 }),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Messages between patient and provider
export const consultationMessages = pgTable('consultation_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  consultationId: uuid('consultation_id').notNull().references(() => consultations.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull(),
  senderType: varchar('sender_type', { length: 20 }).notNull(),
  recipientId: uuid('recipient_id'),
  
  messageType: varchar('message_type', { length: 50 }),
  content: text('content').notNull(),
  attachments: jsonb('attachments'),
  
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at', { withTimezone: true }),
  isUrgent: boolean('is_urgent').default(false),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Patient health measurements tracking
export const patientMeasurements = pgTable('patient_measurements', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  
  // Vital signs
  weight: decimal('weight', { precision: 5, scale: 2 }),
  height: decimal('height', { precision: 5, scale: 2 }),
  bmi: decimal('bmi', { precision: 4, scale: 2 }),
  bloodPressureSystolic: integer('blood_pressure_systolic'),
  bloodPressureDiastolic: integer('blood_pressure_diastolic'),
  heartRate: integer('heart_rate'),
  temperature: decimal('temperature', { precision: 4, scale: 1 }),
  oxygenSaturation: integer('oxygen_saturation'),
  
  // Lab values
  glucoseLevel: decimal('glucose_level', { precision: 5, scale: 2 }),
  cholesterolTotal: integer('cholesterol_total'),
  cholesterolLdl: integer('cholesterol_ldl'),
  cholesterolHdl: integer('cholesterol_hdl'),
  triglycerides: integer('triglycerides'),
  
  measurementDate: date('measurement_date').notNull(),
  measurementTime: time('measurement_time'),
  notes: text('notes'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Support tickets system
export const supportTickets = pgTable('support_tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketNumber: varchar('ticket_number', { length: 50 }).unique(),
  
  // Requester
  requesterId: uuid('requester_id'),
  requesterType: varchar('requester_type', { length: 20 }), // patient, provider, admin
  requesterEmail: varchar('requester_email', { length: 255 }),
  
  // Ticket details
  category: varchar('category', { length: 100 }),
  subject: varchar('subject', { length: 255 }),
  description: text('description'),
  priority: ticketPriorityEnum('priority').default('medium'),
  status: ticketStatusEnum('status').default('open'),
  
  // Assignment
  assignedTo: uuid('assigned_to').references(() => adminUsers.id),
  assignedAt: timestamp('assigned_at', { withTimezone: true }),
  
  // Resolution
  resolution: text('resolution'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolutionTimeHours: integer('resolution_time_hours'),
  satisfactionRating: integer('satisfaction_rating'),
  
  // Related entities
  relatedConsultationId: uuid('related_consultation_id').references(() => consultations.id),
  relatedOrderId: uuid('related_order_id').references(() => orders.id),
  
  tags: text('tags').array(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// Analytics events for tracking and reporting
export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  eventCategory: varchar('event_category', { length: 100 }),
  eventAction: varchar('event_action', { length: 100 }),
  eventLabel: varchar('event_label', { length: 255 }),
  eventValue: decimal('event_value', { precision: 10, scale: 2 }),
  
  // User info
  userId: uuid('user_id'),
  userType: varchar('user_type', { length: 20 }),
  sessionId: varchar('session_id', { length: 100 }),
  
  // Context
  pageUrl: text('page_url'),
  referrerUrl: text('referrer_url'),
  userAgent: text('user_agent'),
  ipAddress: inet('ip_address'),
  
  // Additional data
  metadata: jsonb('metadata'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Define relations
export const patientsRelations = relations(patients, ({ many }) => ({
  consultations: many(consultations),
  prescriptions: many(prescriptions),
  orders: many(orders),
  measurements: many(patientMeasurements)
}));

export const providersRelations = relations(providers, ({ many }) => ({
  consultations: many(consultations),
  prescriptions: many(prescriptions)
}));

export const consultationsRelations = relations(consultations, ({ one, many }) => ({
  patient: one(patients, {
    fields: [consultations.patientId],
    references: [patients.id]
  }),
  provider: one(providers, {
    fields: [consultations.providerId],
    references: [providers.id]
  }),
  prescriptions: many(prescriptions),
  messages: many(consultationMessages),
  orders: many(orders)
}));

export const prescriptionsRelations = relations(prescriptions, ({ one, many }) => ({
  consultation: one(consultations, {
    fields: [prescriptions.consultationId],
    references: [consultations.id]
  }),
  provider: one(providers, {
    fields: [prescriptions.providerId],
    references: [providers.id]
  }),
  patient: one(patients, {
    fields: [prescriptions.patientId],
    references: [patients.id]
  }),
  orderItems: many(orderItems)
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  patient: one(patients, {
    fields: [orders.patientId],
    references: [patients.id]
  }),
  consultation: one(consultations, {
    fields: [orders.consultationId],
    references: [consultations.id]
  }),
  prescription: one(prescriptions, {
    fields: [orders.prescriptionId],
    references: [prescriptions.id]
  }),
  items: many(orderItems)
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  }),
  inventory: one(inventory, {
    fields: [orderItems.inventoryId],
    references: [inventory.id]
  }),
  prescription: one(prescriptions, {
    fields: [orderItems.prescriptionId],
    references: [prescriptions.id]
  })
}));

export const consultationMessagesRelations = relations(consultationMessages, ({ one }) => ({
  consultation: one(consultations, {
    fields: [consultationMessages.consultationId],
    references: [consultations.id]
  })
}));

export const patientMeasurementsRelations = relations(patientMeasurements, ({ one }) => ({
  patient: one(patients, {
    fields: [patientMeasurements.patientId],
    references: [patients.id]
  })
}));

export const supportTicketsRelations = relations(supportTickets, ({ one }) => ({
  assignedAdmin: one(adminUsers, {
    fields: [supportTickets.assignedTo],
    references: [adminUsers.id]
  }),
  relatedConsultation: one(consultations, {
    fields: [supportTickets.relatedConsultationId],
    references: [consultations.id]
  }),
  relatedOrder: one(orders, {
    fields: [supportTickets.relatedOrderId],
    references: [orders.id]
  })
}));

// Export all models for easy access
export const models = {
  patients,
  providers,
  adminUsers,
  consultations,
  prescriptions,
  inventory,
  orders,
  orderItems,
  consultationMessages,
  patientMeasurements,
  supportTickets,
  analyticsEvents
};
