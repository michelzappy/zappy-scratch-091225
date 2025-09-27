/**
 * Model type definitions for the healthcare platform
 * Maps to database models and entities
 */

// User related types
export interface User {
  id: string;
  email: string;
  password?: string; // Never sent to client
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber?: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  PATIENT = 'patient',
  PROVIDER = 'provider',
  ADMIN = 'admin',
  STAFF = 'staff'
}

// Patient related types
export interface Patient {
  id: string;
  userId: string;
  dateOfBirth: Date;
  gender?: 'male' | 'female' | 'other';
  medicalRecordNumber: string;
  insurance?: InsuranceInfo;
  emergencyContact?: EmergencyContact;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  expirationDate?: Date;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

// Provider related types
export interface Provider {
  id: string;
  userId: string;
  npiNumber: string;
  licenseNumber: string;
  licenseState: string;
  specialties: string[];
  qualifications: string[];
  availability?: ProviderAvailability;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderAvailability {
  schedule: WeeklySchedule;
  exceptions: ScheduleException[];
}

export interface WeeklySchedule {
  [key: string]: DaySchedule; // monday, tuesday, etc.
}

export interface DaySchedule {
  isAvailable: boolean;
  slots?: TimeSlot[];
}

export interface TimeSlot {
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
}

export interface ScheduleException {
  date: Date;
  isAvailable: boolean;
  reason?: string;
}

// Appointment related types
export interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  reason: string;
  notes?: string;
  videoRoomUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum AppointmentType {
  VIDEO = 'video',
  IN_PERSON = 'in_person',
  PHONE = 'phone'
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

// Medical Record types (PHI)
export interface MedicalRecord {
  id: string;
  patientId: string;
  providerId: string;
  appointmentId?: string;
  type: RecordType;
  content: string; // Encrypted
  attachments?: string[]; // File URLs
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export enum RecordType {
  CONSULTATION = 'consultation',
  LAB_RESULT = 'lab_result',
  PRESCRIPTION = 'prescription',
  IMAGING = 'imaging',
  PROCEDURE = 'procedure',
  DISCHARGE_SUMMARY = 'discharge_summary'
}

// Prescription types
export interface Prescription {
  id: string;
  patientId: string;
  providerId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  refills: number;
  instructions?: string;
  pharmacyId?: string;
  status: PrescriptionStatus;
  prescribedDate: Date;
  expirationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum PrescriptionStatus {
  ACTIVE = 'active',
  FILLED = 'filled',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}
