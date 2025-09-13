import { pgTable, uuid, text, timestamp, boolean, integer, decimal, jsonb, pgEnum, time, inet, serial, date, interval } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define ENUMs
export const consultationStatusEnum = pgEnum('consultation_status', [
  'pending', 'assigned', 'in_progress', 'completed', 'cancelled'
]);

export const userRoleEnum = pgEnum('user_role', [
  'patient', 'provider', 'admin'
]);

export const messageTypeEnum = pgEnum('message_type', [
  'text', 'system', 'media', 'prescription'
]);

// Patients table
export const patients = pgTable('patients', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').unique(),
  phone: text('phone'),
  dateOfBirth: date('date_of_birth'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zip: text('zip'),
  insuranceInfo: jsonb('insurance_info'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// Providers table
export const providers = pgTable('providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  licenseNumber: text('license_number'),
  specialties: text('specialties').array().default([]),
  bio: text('bio'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// Consultations table
export const consultations = pgTable('consultations', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  providerId: uuid('provider_id').references(() => providers.id, { onDelete: 'set null' }),
  consultationType: text('consultation_type'),
  chiefComplaint: text('chief_complaint'),
  symptoms: text('symptoms').array(),
  status: consultationStatusEnum('status').default('pending'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow(),
  assignedAt: timestamp('assigned_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  notes: text('notes'),
  providerNotes: text('provider_notes'),
  autoAssigned: boolean('auto_assigned').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// Messages table
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  consultationId: uuid('consultation_id').notNull().references(() => consultations.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull(),
  senderType: userRoleEnum('sender_type').notNull(),
  messageType: messageTypeEnum('message_type').default('text'),
  content: text('content'),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Consultation media table
export const consultationMedia = pgTable('consultation_media', {
  id: uuid('id').primaryKey().defaultRandom(),
  consultationId: uuid('consultation_id').notNull().references(() => consultations.id, { onDelete: 'cascade' }),
  messageId: uuid('message_id').references(() => messages.id, { onDelete: 'cascade' }),
  originalFilename: text('original_filename').notNull(),
  storedFilename: text('stored_filename').notNull(),
  storagePath: text('storage_path').notNull(),
  fileSize: integer('file_size'),
  mimeType: text('mime_type').notNull(),
  uploadedBy: uuid('uploaded_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Treatment plans table
export const treatmentPlans = pgTable('treatment_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  consultationId: uuid('consultation_id').notNull().references(() => consultations.id, { onDelete: 'cascade' }),
  providerId: uuid('provider_id').notNull().references(() => providers.id),
  diagnosis: text('diagnosis'),
  treatmentSummary: text('treatment_summary').notNull(),
  instructions: text('instructions'),
  followUpRequired: boolean('follow_up_required').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// User sessions table
export const userSessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  sessionToken: text('session_token').notNull().unique(),
  userType: userRoleEnum('user_type').notNull(),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  lastActivity: timestamp('last_activity', { withTimezone: true }).defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// API logs table (for HIPAA compliance)
export const apiLogs = pgTable('api_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id'),
  method: text('method'),
  path: text('path'),
  statusCode: integer('status_code'),
  requestBody: jsonb('request_body'),
  responseBody: jsonb('response_body'),
  ipAddress: inet('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

// Define relations
export const consultationRelations = relations(consultations, ({ one, many }) => ({
  patient: one(patients, {
    fields: [consultations.patientId],
    references: [patients.id]
  }),
  provider: one(providers, {
    fields: [consultations.providerId],
    references: [providers.id]
  }),
  messages: many(messages),
  media: many(consultationMedia),
  treatmentPlans: many(treatmentPlans)
}));

export const patientRelations = relations(patients, ({ many }) => ({
  consultations: many(consultations)
}));

export const providerRelations = relations(providers, ({ many }) => ({
  consultations: many(consultations),
  treatmentPlans: many(treatmentPlans)
}));

export const messageRelations = relations(messages, ({ one, many }) => ({
  consultation: one(consultations, {
    fields: [messages.consultationId],
    references: [consultations.id]
  }),
  media: many(consultationMedia)
}));

export const consultationMediaRelations = relations(consultationMedia, ({ one }) => ({
  consultation: one(consultations, {
    fields: [consultationMedia.consultationId],
    references: [consultations.id]
  }),
  message: one(messages, {
    fields: [consultationMedia.messageId],
    references: [messages.id]
  })
}));

export const treatmentPlanRelations = relations(treatmentPlans, ({ one }) => ({
  consultation: one(consultations, {
    fields: [treatmentPlans.consultationId],
    references: [consultations.id]
  }),
  provider: one(providers, {
    fields: [treatmentPlans.providerId],
    references: [providers.id]
  })
}));

// Export all models for easy access
export const models = {
  consultations,
  patients,
  providers,
  messages,
  consultationMedia,
  treatmentPlans,
  userSessions,
  apiLogs
};
