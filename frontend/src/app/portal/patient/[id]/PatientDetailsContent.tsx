'use client';

import { useState, useEffect } from 'react';

// Simple date formatter to avoid date-fns issues on Vercel
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch {
    return dateString;
  }
};

// Types
interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  medical_record_number: string;
  status: 'active' | 'inactive';
  blood_type?: string;
  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

interface Allergy {
  id: string;
  allergen: string;
  reaction: string;
  severity: 'severe' | 'moderate' | 'mild';
}

interface VitalSign {
  type: string;
  value: string;
  unit: string;
  timestamp: string;
  status: 'normal' | 'warning' | 'critical';
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  prescriber: string;
  start_date: string;
  status: 'active' | 'discontinued';
  compliance?: number;
}

interface Condition {
  id: string;
  name: string;
  icd10_code: string;
  status: 'active' | 'resolved';
  onset_date: string;
  severity: 'mild' | 'moderate' | 'severe';
}

interface Consultation {
  id: string;
  type: string;
  provider: string;
  date: string;
  status: 'completed' | 'scheduled' | 'cancelled';
  notes?: string;
}

interface Plan {
  id: string;
  name: string;
  type: 'subscription' | 'treatment' | 'wellness';
  price: number;
  billing_cycle?: 'monthly' | 'quarterly' | 'annual';
  status: 'active' | 'paused' | 'cancelled';
  start_date: string;
  next_billing?: string;
  features?: string[];
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  category: 'lab-results' | 'imaging' | 'insurance' | 'consent' | 'other';
}

interface PatientDetailsContentProps {
  patientId: string;
}

export default function PatientDetailsContent({ patientId }: PatientDetailsContentProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Patient data states
  const [patient, setPatient] = useState<Patient | null>(null);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState({ type: 'progress', content: '' });
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration
      const mockPatients: Record<string, Patient> = {
        '1': {
          id: '1',
          first_name: 'Sarah',
          last_name: 'Johnson',
          email: 'sarah.j@email.com',
          phone: '(555) 123-4567',
          date_of_birth: '1990-05-15',
          gender: 'female',
          medical_record_number: 'MRN-2024-001234',
          status: 'active',
          blood_type: 'O+',
          emergency_contact: {
            name: 'John Johnson',
            phone: '(555) 123-4568',
            relationship: 'Spouse'
          }
        },
        '2': {
          id: '2',
          first_name: 'Michael',
          last_name: 'Chen',
          email: 'mchen@email.com',
          phone: '(555) 234-5678',
          date_of_birth: '1985-08-22',
          gender: 'male',
          medical_record_number: 'MRN-2024-001235',
          status: 'active',
          blood_type: 'A+',
          emergency_contact: {
            name: 'Lisa Chen',
            phone: '(555) 234-5679',
            relationship: 'Wife'
          }
        }
      };

      if (mockPatients[patientId]) {
        setPatient(mockPatients[patientId]);
        
        // Set mock allergies
        setAllergies([
          { id: '1', allergen: 'Penicillin', reaction: 'Anaphylaxis', severity: 'severe' },
          { id: '2', allergen: 'Ibuprofen', reaction: 'Rash', severity: 'moderate' }
        ]);

        // Set mock vital signs
        setVitalSigns([
          { type: 'BP', value: '120/80', unit: 'mmHg', timestamp: '09:30', status: 'normal' },
          { type: 'HR', value: '72', unit: 'bpm', timestamp: '09:30', status: 'normal' },
          { type: 'Temp', value: '98.6', unit: '°F', timestamp: '09:30', status: 'normal' },
          { type: 'O2', value: '98', unit: '%', timestamp: '09:30', status: 'normal' }
        ]);

        // Set mock medications
        setMedications([
          {
            id: '1',
            name: 'Tretinoin 0.025%',
            dosage: 'Apply nightly',
            frequency: 'Once daily',
            prescriber: 'Dr. Smith',
            start_date: '2024-01-10',
            status: 'active',
            compliance: 95
          },
          {
            id: '2',
            name: 'Doxycycline 100mg',
            dosage: '1 tablet',
            frequency: 'Twice daily',
            prescriber: 'Dr. Smith',
            start_date: '2024-01-10',
            status: 'active',
            compliance: 88
          }
        ]);

        // Set mock conditions
        setConditions([
          { id: '1', name: 'Acne Vulgaris', icd10_code: 'L70.0', status: 'active', onset_date: '2023-10-15', severity: 'moderate' },
          { id: '2', name: 'Seasonal Allergies', icd10_code: 'J30.1', status: 'active', onset_date: '2020-03-01', severity: 'mild' }
        ]);

        // Set mock consultations
        setConsultations([
          { id: '1', type: 'Follow-up', provider: 'Dr. Smith', date: '2024-01-15', status: 'completed', notes: 'Acne improving' },
          { id: '2', type: 'Initial', provider: 'Dr. Smith', date: '2024-01-10', status: 'completed', notes: 'Started treatment' },
          { id: '3', type: 'Follow-up', provider: 'Dr. Smith', date: '2024-02-15', status: 'scheduled' }
        ]);

        // Set mock plans/subscriptions
        setPlans([
          { 
            id: '1', 
            name: 'Premium Care Plan', 
            type: 'subscription',
            price: 49.99,
            billing_cycle: 'monthly',
            status: 'active',
            start_date: '2024-01-01',
            next_billing: '2024-02-01',
            features: ['Unlimited Consultations', '24/7 Support', 'Free Shipping']
          },
          {
            id: '2',
            name: 'Acne Treatment Program',
            type: 'treatment',
            price: 89.99,
            billing_cycle: 'monthly',
            status: 'active',
            start_date: '2024-01-10',
            next_billing: '2024-02-10',
            features: ['Custom Formulation', 'Monthly Adjustments', 'Progress Tracking']
          }
        ]);

        // Set mock documents
        setDocuments([
          {
            id: '1',
            name: 'Lab_Results_2024_01_10.pdf',
            type: 'application/pdf',
            size: '245 KB',
            uploadedBy: 'Dr. Smith',
            uploadedAt: '2024-01-10',
            category: 'lab-results'
          },
          {
            id: '2',
            name: 'Insurance_Card.jpg',
            type: 'image/jpeg',
            size: '1.2 MB',
            uploadedBy: 'Patient',
            uploadedAt: '2024-01-05',
            category: 'insurance'
          }
        ]);
      } else {
        setPatient(null);
      }
      
    } catch (error) {
      console.error('Error fetching patient data:', error);
      setPatient(null);
    } finally {
      setLoading(false);
    }
  };

  // Calculate age from date of birth
  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Patient not found</p>
      </div>
    );
  }

  const age = calculateAge(patient.date_of_birth);
  const tabs = ['overview', 'plans', 'medications', 'notes', 'lab-results', 'documents'];

  return (
    <div className="space-y-3">
      {/* Compact Patient Header */}
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-900">
                {patient.first_name} {patient.last_name}
              </h1>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                Active
              </span>
            </div>
            <div className="mt-1 flex gap-4 text-xs text-gray-600">
              <span className="font-mono">MRN: {patient.medical_record_number}</span>
              <span>{age}y {patient.gender === 'female' ? 'F' : 'M'}</span>
              <span>DOB: {formatDate(patient.date_of_birth)}</span>
              <span>Blood: {patient.blood_type}</span>
              {/* Subtle allergies display */}
              {allergies.length > 0 && (
                <span className="text-red-600">
                  Allergies: {allergies.map(a => a.allergen).join(', ')}
                </span>
              )}
            </div>
            <div className="mt-1 flex gap-4 text-xs text-gray-600">
              <span>{patient.phone}</span>
              <span>{patient.email}</span>
              {patient.emergency_contact && (
                <span>Emergency: {patient.emergency_contact.name} ({patient.emergency_contact.phone})</span>
              )}
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800">
              Start Consultation
            </button>
            <button className="px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
              Message
            </button>
            <button className="px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
              Labs
            </button>
          </div>
        </div>
      </div>

      {/* Compact Summary Cards */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
          <div className="text-xs text-gray-600">Active Plans</div>
          <div className="text-lg font-semibold text-gray-900">{plans.filter(p => p.status === 'active').length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
          <div className="text-xs text-gray-600">Conditions</div>
          <div className="text-lg font-semibold text-gray-900">{conditions.filter(c => c.status === 'active').length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
          <div className="text-xs text-gray-600">Medications</div>
          <div className="text-lg font-semibold text-gray-900">{medications.filter(m => m.status === 'active').length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
          <div className="text-xs text-gray-600">Last Visit</div>
          <div className="text-lg font-semibold text-gray-900">5d ago</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
          <div className="text-xs text-gray-600">Monthly</div>
          <div className="text-lg font-semibold text-green-600">${plans.filter(p => p.status === 'active').reduce((sum, p) => sum + p.price, 0).toFixed(2)}</div>
        </div>
      </div>

      {/* Stripe-style Tab Navigation */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Compact Content Area */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="p-4 space-y-4">
            {/* Active Conditions */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Active Conditions</h3>
              <div className="space-y-1">
                {conditions.filter(c => c.status === 'active').map((condition) => (
                  <div key={condition.id} className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{condition.name}</span>
                      <span className="text-xs text-gray-500">({condition.icd10_code})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 text-xs rounded ${
                        condition.severity === 'severe' ? 'bg-red-100 text-red-800' :
                        condition.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {condition.severity}
                      </span>
                      <span className="text-xs text-gray-500">Since {formatDate(condition.onset_date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Recent Activity</h3>
              <div className="space-y-1">
                {consultations.slice(0, 3).map((consultation) => (
                  <div key={consultation.id} className="flex items-center justify-between py-1.5 px-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        consultation.status === 'completed' ? 'bg-green-500' :
                        consultation.status === 'scheduled' ? 'bg-blue-500' :
                        'bg-gray-500'
                      }`}></span>
                      <span className="text-sm">{consultation.type} - {consultation.provider}</span>
                      {consultation.notes && <span className="text-xs text-gray-500">• {consultation.notes}</span>}
                    </div>
                    <span className="text-xs text-gray-500">{consultation.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Plans/Subscriptions Tab */}
        {activeTab === 'plans' && (
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Active Plans & Subscriptions</h3>
              <button className="px-2 py-1 bg-gray-900 text-white text-xs rounded hover:bg-gray-800">
                + Add Plan
              </button>
            </div>
            <div className="space-y-2">
              {plans.map((plan) => (
                <div key={plan.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{plan.name}</span>
                        <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded ${
                          plan.type === 'subscription' ? 'bg-blue-100 text-blue-800' :
                          plan.type === 'treatment' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {plan.type}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        ${plan.price}/{plan.billing_cycle} • Started {formatDate(plan.start_date)}
                      </div>
                      {plan.next_billing && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          Next billing: {formatDate(plan.next_billing)}
                        </div>
                      )}
                      {plan.features && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {plan.features.map((feature, idx) => (
                            <span key={idx} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                              {feature}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full ${
                        plan.status === 'active' ? 'bg-green-100 text-green-800' : 
                        plan.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {plan.status}
                      </span>
                      <div className="mt-1">
                        <button className="text-xs text-blue-600 hover:text-blue-800">Manage</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medications Tab */}
        {activeTab === 'medications' && (
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Current Medications</h3>
              <button className="px-2 py-1 bg-gray-900 text-white text-xs rounded hover:bg-gray-800">
                + Add
              </button>
            </div>
            <div className="space-y-2">
              {medications.map((med) => (
                <div key={med.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm">{med.name}</div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {med.dosage} • {med.frequency} • By {med.prescriber}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Started {formatDate(med.start_date)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full ${
                        med.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {med.status}
                      </span>
                      {med.compliance && (
                        <div className="mt-1 text-xs text-gray-500">
                          {med.compliance}% compliant
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Clinical Notes</h3>
              <button 
                onClick={() => setShowAddNote(!showAddNote)}
                className="px-2 py-1 bg-gray-900 text-white text-xs rounded hover:bg-gray-800"
              >
                {showAddNote ? 'Cancel' : '+ Add Note'}
              </button>
            </div>

            {/* Add Note Form */}
            {showAddNote && (
              <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Note Type</label>
                    <select 
                      value={newNote.type}
                      onChange={(e) => setNewNote({...newNote, type: e.target.value})}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      <option value="progress">Progress Note</option>
                      <option value="follow-up">Follow-up Note</option>
                      <option value="initial">Initial Note</option>
                      <option value="soap">SOAP Note</option>
                      <option value="general">General Note</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Note Content</label>
                    <textarea
                      value={newNote.content}
                      onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                      rows={4}
                      placeholder="Enter clinical notes here..."
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        // Add the note to the list
                        const newConsultation: Consultation = {
                          id: `new-${Date.now()}`,
                          type: newNote.type.charAt(0).toUpperCase() + newNote.type.slice(1),
                          provider: 'Dr. Smith',
                          date: new Date().toISOString().split('T')[0],
                          status: 'completed',
                          notes: newNote.content
                        };
                        setConsultations([newConsultation, ...consultations]);
                        setNewNote({ type: 'progress', content: '' });
                        setShowAddNote(false);
                      }}
                      className="px-3 py-1.5 bg-gray-900 text-white text-xs rounded hover:bg-gray-800"
                    >
                      Save Note
                    </button>
                    <button 
                      onClick={() => {
                        setNewNote({ type: 'progress', content: '' });
                        setShowAddNote(false);
                      }}
                      className="px-3 py-1.5 border border-gray-300 text-xs rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {consultations.map((consultation) => (
                <div key={consultation.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{consultation.type} Note</span>
                        <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full ${
                          consultation.status === 'completed' ? 'bg-green-100 text-green-800' :
                          consultation.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {consultation.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {consultation.date} • {consultation.provider}
                      </div>
                      {consultation.notes && (
                        <div className="mt-2 text-sm text-gray-700">
                          {consultation.notes}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <button className="text-xs text-blue-600 hover:text-blue-800">Edit</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lab Results Tab */}
        {activeTab === 'lab-results' && (
          <div className="p-4">
            <div className="text-center py-8 text-sm text-gray-500">
              No lab results available
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Patient Documents</h3>
              <label className="px-2 py-1 bg-gray-900 text-white text-xs rounded hover:bg-gray-800 cursor-pointer">
                + Upload Document
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Create new document entry
                      const newDoc: Document = {
                        id: `doc-${Date.now()}`,
                        name: file.name,
                        type: file.type,
                        size: file.size < 1024 * 1024 
                          ? `${(file.size / 1024).toFixed(1)} KB`
                          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                        uploadedBy: 'Dr. Smith',
                        uploadedAt: new Date().toISOString().split('T')[0],
                        category: file.name.toLowerCase().includes('lab') ? 'lab-results' :
                                 file.name.toLowerCase().includes('insurance') ? 'insurance' :
                                 file.name.toLowerCase().includes('consent') ? 'consent' :
                                 file.type.startsWith('image/') ? 'imaging' : 'other'
                      };
                      setDocuments([newDoc, ...documents]);
                      // Reset file input
                      e.target.value = '';
                    }
                  }}
                />
              </label>
            </div>

            {documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 rounded">
                          {doc.type.includes('pdf') ? (
                            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" />
                            </svg>
                          ) : doc.type.startsWith('image/') ? (
                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2 1 1 0 100-2 2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {doc.size} • Uploaded {doc.uploadedAt} by {doc.uploadedBy}
                          </div>
                          <span className={`inline-flex px-1.5 py-0.5 mt-1 text-xs font-medium rounded ${
                            doc.category === 'lab-results' ? 'bg-purple-100 text-purple-800' :
                            doc.category === 'imaging' ? 'bg-blue-100 text-blue-800' :
                            doc.category === 'insurance' ? 'bg-green-100 text-green-800' :
                            doc.category === 'consent' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {doc.category.replace('-', ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="text-xs text-blue-600 hover:text-blue-800">View</button>
                        <button className="text-xs text-red-600 hover:text-red-800">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">No documents uploaded yet</p>
                <p className="text-xs text-gray-400 mt-1">Upload lab results, imaging, or other patient documents</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
