import { Patient, Provider } from './auth';
import { Message, ConsultationMedia } from './message';

export type ConsultationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ConsultationStatus = 'pending' | 'assigned' | 'completed' | 'cancelled' | 'reviewed';

export interface Consultation {
  id: string;
  patientId: string;
  consultationType: string;
  status: ConsultationStatus;
  submittedAt: string;
  scheduledAt?: string;
  completedAt?: string;
  providerNotes?: string;
  clientNotes?: string;
  priority: ConsultationPriority;
  chiefComplaint: string;
  symptoms: string[];
  assignedProviderId?: string;
  questionnaireResponses?: Record<string, any>;
  estimatedResponseTime?: string;
  autoAssigned: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Related data
  patient?: Patient;
  assignedProvider?: Provider;
  messages?: Message[];
  media?: ConsultationMedia[];
  treatmentPlans?: TreatmentPlan[];
}

export interface TreatmentPlan {
  id: string;
  consultationId: string;
  providerId: string;
  patientId: string;
  diagnosis?: string;
  treatmentSummary: string;
  instructions?: string;
  followUpRequired: boolean;
  followUpDays?: number;
  followUpInstructions?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsultationCreateData {
  consultationType: string;
  chiefComplaint: string;
  symptoms: string[];
  priority?: ConsultationPriority;
  questionnaireResponses?: Record<string, any>;
}
