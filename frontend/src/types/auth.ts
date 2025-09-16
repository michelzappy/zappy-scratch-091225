export interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    role?: string;
  };
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Provider {
  id: string;
  userId: string;
  licenseNumber?: string;
  specialties: string[];
  consultationTypes: string[];
  bio?: string;
  experienceYears?: number;
  isActive: boolean;
  maxDailyConsultations: number;
  hourlyRate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  profile: Patient | Provider | null;
  role: 'patient' | 'provider' | 'admin' | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
