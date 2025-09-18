// Mock data service for when database connection fails
import { v4 as uuidv4 } from 'uuid';

// Mock data
const mockPatients = [
  {
    id: uuidv4(),
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0123',
    date_of_birth: '1990-01-15',
    gender: 'male',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },
  {
    id: uuidv4(),
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@example.com',
    phone: '+1-555-0124',
    date_of_birth: '1985-03-22',
    gender: 'female',
    created_at: new Date('2024-01-02'),
    updated_at: new Date('2024-01-02')
  },
  {
    id: uuidv4(),
    first_name: 'Bob',
    last_name: 'Johnson',
    email: 'bob.johnson@example.com',
    phone: '+1-555-0125',
    date_of_birth: '1992-07-08',
    gender: 'male',
    created_at: new Date('2024-01-03'),
    updated_at: new Date('2024-01-03')
  }
];

const mockProviders = [
  {
    id: uuidv4(),
    first_name: 'Dr. Sarah',
    last_name: 'Wilson',
    email: 'dr.wilson@clinic.com',
    license_number: 'MD12345',
    specialties: ['General Medicine'],
    states_licensed: ['CA', 'NY'],
    status: 'active',
    available_for_consultations: true,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },
  {
    id: uuidv4(),
    first_name: 'Dr. Michael',
    last_name: 'Brown',
    email: 'dr.brown@clinic.com',
    license_number: 'MD67890',
    specialties: ['Cardiology'],
    states_licensed: ['CA'],
    status: 'active',
    available_for_consultations: true,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  }
];

const mockConsultations = [
  {
    id: uuidv4(),
    patient_id: mockPatients[0].id,
    provider_id: mockProviders[0].id,
    chief_complaint: 'Routine checkup',
    symptoms: ['No symptoms'],
    status: 'completed',
    priority: 'low',
    diagnosis: 'Healthy patient',
    treatment_plan: 'Continue regular exercise and healthy diet',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    completed_at: new Date(Date.now() - 1 * 60 * 60 * 1000)
  },
  {
    id: uuidv4(),
    patient_id: mockPatients[1].id,
    provider_id: null,
    chief_complaint: 'Weight management consultation',
    symptoms: ['Fatigue', 'Weight gain'],
    status: 'pending',
    priority: 'medium',
    created_at: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    updated_at: new Date(Date.now() - 30 * 60 * 1000)
  },
  {
    id: uuidv4(),
    patient_id: mockPatients[2].id,
    provider_id: mockProviders[1].id,
    chief_complaint: 'Chest pain evaluation',
    symptoms: ['Chest pain', 'Shortness of breath'],
    status: 'in_progress',
    priority: 'high',
    created_at: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    updated_at: new Date(Date.now() - 15 * 60 * 1000)  // 15 minutes ago
  },
  {
    id: uuidv4(),
    patient_id: mockPatients[0].id,
    provider_id: mockProviders[0].id,
    chief_complaint: 'Follow-up appointment',
    symptoms: ['Mild headache'],
    status: 'pending',
    priority: 'low',
    created_at: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    updated_at: new Date(Date.now() - 10 * 60 * 1000)
  },
  {
    id: uuidv4(),
    patient_id: mockPatients[1].id,
    provider_id: mockProviders[1].id,
    chief_complaint: 'Medication review',
    symptoms: ['Side effects from current medication'],
    status: 'in_progress',
    priority: 'urgent',
    created_at: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    updated_at: new Date(Date.now() - 2 * 60 * 1000)  // 2 minutes ago
  }
];

const mockMessages = [
  {
    id: uuidv4(),
    consultation_id: mockConsultations[0].id,
    sender_id: mockPatients[0].id,
    sender_type: 'patient',
    content: 'Thank you for the consultation!',
    is_read: true,
    created_at: new Date('2024-01-15')
  },
  {
    id: uuidv4(),
    consultation_id: mockConsultations[1].id,
    sender_id: mockPatients[1].id,
    sender_type: 'patient',
    content: 'I have been experiencing fatigue lately.',
    is_read: false,
    created_at: new Date('2024-01-20')
  }
];

const mockOrders = [
  {
    id: uuidv4(),
    patient_id: mockPatients[0].id,
    consultation_id: mockConsultations[0].id,
    status: 'delivered',
    total_amount: 89.99,
    shipping_address: '123 Main St, Anytown, CA 90210',
    created_at: new Date('2024-01-16'),
    updated_at: new Date('2024-01-18')
  }
];

// Mock data service functions
export class MockDataService {
  // Patients
  static getPatients(limit = 50, offset = 0) {
    return mockPatients.slice(offset, offset + limit);
  }

  static getPatientById(id) {
    return mockPatients.find(p => p.id === id);
  }

  static getPatientByEmail(email) {
    return mockPatients.find(p => p.email === email);
  }

  // Providers
  static getProviders(limit = 50, offset = 0) {
    return mockProviders.slice(offset, offset + limit);
  }

  static getProviderById(id) {
    return mockProviders.find(p => p.id === id);
  }

  static getAvailableProviders() {
    return mockProviders.filter(p => p.available_for_consultations && p.status === 'active');
  }

  // Consultations
  static getConsultations(limit = 50, offset = 0, filters = {}) {
    let consultations = [...mockConsultations];
    
    if (filters.status) {
      consultations = consultations.filter(c => c.status === filters.status);
    }
    
    if (filters.patient_id) {
      consultations = consultations.filter(c => c.patient_id === filters.patient_id);
    }
    
    if (filters.provider_id) {
      consultations = consultations.filter(c => c.provider_id === filters.provider_id);
    }

    if (filters.dateRange === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      consultations = consultations.filter(c => c.created_at >= today);
    }
    
    return consultations
      .sort((a, b) => b.created_at - a.created_at)
      .slice(offset, offset + limit);
  }

  static getConsultationById(id) {
    return mockConsultations.find(c => c.id === id);
  }

  static getConsultationsWithProviderInfo(filters = {}) {
    const consultations = this.getConsultations(50, 0, filters);
    return consultations.map(consultation => {
      const patient = this.getPatientById(consultation.patient_id);
      const provider = consultation.provider_id ?
        this.getProviderById(consultation.provider_id) : null;
      
      return {
        ...consultation,
        // Patient information
        patient_name: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient',
        first_name: patient?.first_name || 'Unknown',
        last_name: patient?.last_name || 'Patient',
        
        // Provider information
        provider_first_name: provider?.first_name || null,
        provider_last_name: provider?.last_name || null,
        provider_title: provider ? 'Dr.' : null,
        provider_name: provider ? `${provider.first_name} ${provider.last_name}` : 'Unassigned',
        assigned_provider: provider ? `${provider.first_name} ${provider.last_name}` : 'Unassigned',
        
        // Consultation type mapping
        consultation_type: consultation.chief_complaint || 'General Consultation',
        type: consultation.chief_complaint || 'General Consultation',
        
        // Ensure dates are properly formatted
        created_at: consultation.created_at?.toISOString() || new Date().toISOString(),
        submitted_at: consultation.created_at?.toISOString() || new Date().toISOString(),
        
        // Add priority if missing
        priority: consultation.priority || 'medium'
      };
    });
  }

  // Messages
  static getMessages(consultationId) {
    return mockMessages.filter(m => m.consultation_id === consultationId);
  }

  static getUnreadMessagesCount(patientId) {
    const patientConsultations = mockConsultations.filter(c => c.patient_id === patientId);
    const consultationIds = patientConsultations.map(c => c.id);
    
    return mockMessages.filter(m => 
      consultationIds.includes(m.consultation_id) && 
      !m.is_read && 
      m.sender_type !== 'patient'
    ).length;
  }

  // Orders
  static getOrders(patientId, limit = 10, offset = 0) {
    return mockOrders
      .filter(o => o.patient_id === patientId)
      .slice(offset, offset + limit);
  }

  static getOrderById(id) {
    return mockOrders.find(o => o.id === id);
  }

  // Dashboard stats
  static getDashboardStats() {
    return {
      total_patients: mockPatients.length,
      total_providers: mockProviders.length,
      total_consultations: mockConsultations.length,
      pending_consultations: mockConsultations.filter(c => c.status === 'pending').length,
      completed_consultations: mockConsultations.filter(c => c.status === 'completed').length,
      active_providers: mockProviders.filter(p => p.status === 'active').length
    };
  }

  static getPatientStats(patientId) {
    const patientConsultations = mockConsultations.filter(c => c.patient_id === patientId);
    const patientOrders = mockOrders.filter(o => o.patient_id === patientId);
    
    return {
      total_consultations: patientConsultations.filter(c => c.status === 'completed').length,
      total_orders: patientOrders.length,
      active_prescriptions: 0, // Would need prescription mock data
      unread_messages: this.getUnreadMessagesCount(patientId),
      last_consultation_date: patientConsultations.length > 0 ? 
        Math.max(...patientConsultations.map(c => c.created_at)) : null,
      subscription_tier: 'basic',
      subscription_active: true
    };
  }

  // Provider queue for dashboard
  static getProviderQueue(dateRange = 'today') {
    const filters = { dateRange };
    return this.getConsultationsWithProviderInfo(filters);
  }
}

export default MockDataService;