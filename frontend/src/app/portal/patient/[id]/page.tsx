'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/Card';

type UserRole = 'provider' | 'admin' | 'provider-admin' | 'super-admin';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  address: string;
  
  subscription: {
    plan: string;
    price: number;
    status: 'active' | 'paused' | 'cancelled';
    startDate: string;
    nextBilling: string;
    discount: number;
  };
  
  totalSpent: number;
  totalConsultations: number;
  activeRx: number;
  lastVisit: string;
  
  allergies: string[];
  conditions: string[];
  currentMedications: Array<{
    name: string;
    startDate: string;
    status: 'active' | 'discontinued';
  }>;
}

interface ConsultationHistory {
  id: string;
  date: string;
  complaint: string;
  provider: string;
  diagnosis: string;
  medications: string[];
  status: string;
  revenue: number;
}

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id;
  
  const [activeTab, setActiveTab] = useState('overview');
  const [userRole, setUserRole] = useState<UserRole>('provider');
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
  
  // Mock patient data
  const [patient] = useState<Patient>({
    id: patientId as string,
    firstName: 'Emily',
    lastName: 'Johnson',
    email: 'emily.johnson@email.com',
    phone: '(555) 123-4567',
    dateOfBirth: '1996-03-15',
    age: 28,
    gender: 'Female',
    address: '123 Main St, Apt 4B, San Francisco, CA 94102',
    
    subscription: {
      plan: 'Essential Care',
      price: 29,
      status: 'active',
      startDate: '2023-10-01',
      nextBilling: '2024-02-01',
      discount: 0
    },
    
    totalSpent: 1847,
    totalConsultations: 8,
    activeRx: 2,
    lastVisit: '2024-01-10',
    
    allergies: ['Penicillin', 'Sulfa drugs'],
    conditions: ['Acne vulgaris', 'Mild anxiety'],
    currentMedications: [
      { name: 'Tretinoin 0.025%', startDate: '2023-11-15', status: 'active' },
      { name: 'Doxycycline 100mg', startDate: '2023-11-15', status: 'active' }
    ]
  });
  
  const [consultationHistory] = useState<ConsultationHistory[]>([
    {
      id: '1',
      date: '2024-01-10',
      complaint: 'Follow-up: Acne treatment',
      provider: 'Dr. Smith',
      diagnosis: 'Acne vulgaris - improving',
      medications: ['Tretinoin refill', 'Doxycycline refill'],
      status: 'completed',
      revenue: 147
    },
    {
      id: '2',
      date: '2023-11-15',
      complaint: 'Initial: Persistent acne',
      provider: 'Dr. Smith',
      diagnosis: 'Acne vulgaris',
      medications: ['Tretinoin 0.025%', 'Doxycycline 100mg'],
      status: 'completed',
      revenue: 147
    }
  ]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole') as UserRole;
    
    if (!token) {
      router.push('/portal/login');
      return;
    }
    
    if (role) {
      setUserRole(role);
    }
    
    // Load saved notes
    setNotes('Patient has wedding in March 2024 - prioritizing quick results for acne treatment. Responds well to combination therapy. Good compliance with medication regimen.');
    
    // Load medical records
    setMedicalRecords([
      {
        id: '1',
        date: '2024-01-10',
        type: 'Consultation Note',
        provider: 'Dr. Smith',
        content: 'Follow-up visit for acne treatment. Patient reports significant improvement in forehead area. Chin still showing some cystic lesions. Continue current regimen.',
        assessment: 'Acne vulgaris - improving',
        plan: 'Continue tretinoin 0.025% and doxycycline 100mg BID',
        vitals: { weight: '142 lbs', bp: '118/72' }
      },
      {
        id: '2',
        date: '2023-12-15',
        type: 'Progress Note',
        provider: 'Dr. Smith',
        content: 'Patient in purging phase. Expected reaction to tretinoin. Counseled on importance of continuing treatment.',
        assessment: 'Normal treatment response',
        plan: 'Continue current medications, add moisturizer PRN'
      },
      {
        id: '3',
        date: '2023-11-15',
        type: 'Initial Consultation',
        provider: 'Dr. Smith',
        content: 'New patient presenting with moderate to severe cystic acne. No previous treatment with retinoids. No contraindications to proposed treatment.',
        assessment: 'Acne vulgaris, moderate to severe',
        plan: 'Start tretinoin 0.025% QHS, doxycycline 100mg BID, sunscreen daily',
        vitals: { weight: '145 lbs', bp: '120/75' }
      }
    ]);
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/portal/patients')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-gray-600 mt-1">Patient ID: {patient.id}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => router.push(`/portal/consultation/new?patient=${patient.id}`)}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
          >
            Start Consultation
          </button>
          <button 
            onClick={() => router.push('/portal/messages')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Send Message
          </button>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Spent</p>
          <p className="text-2xl font-bold text-gray-900">${patient.totalSpent}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Consultations</p>
          <p className="text-2xl font-bold text-gray-900">{patient.totalConsultations}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active Rx</p>
          <p className="text-2xl font-bold text-gray-900">{patient.activeRx}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Last Visit</p>
          <p className="text-2xl font-bold text-gray-900">{patient.lastVisit}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Subscription</p>
          <p className="text-2xl font-bold text-green-600">{patient.subscription.plan}</p>
        </Card>
      </div>

      {/* Tab Navigation */}
      <Card className="overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {['overview', 'history', 'medications', 'medical records', 'subscription', 'notes'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium capitalize ${
                activeTab === tab
                  ? 'border-b-2 border-gray-900 text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Patient Information</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Age:</dt>
                    <dd className="font-medium">{patient.age} years ({patient.dateOfBirth})</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Gender:</dt>
                    <dd className="font-medium">{patient.gender}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Email:</dt>
                    <dd className="font-medium">{patient.email}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Phone:</dt>
                    <dd className="font-medium">{patient.phone}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Address:</dt>
                    <dd className="font-medium text-right max-w-xs">{patient.address}</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Medical Information</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Allergies</p>
                    <div className="flex flex-wrap gap-2">
                      {patient.allergies.map(allergy => (
                        <span key={allergy} className="px-3 py-1 bg-red-50 text-red-700 text-sm rounded-full">
                          {allergy}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Conditions</p>
                    <div className="flex flex-wrap gap-2">
                      {patient.conditions.map(condition => (
                        <span key={condition} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                          {condition}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'history' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Consultation History</h3>
              <div className="space-y-4">
                {consultationHistory.map(visit => (
                  <Card key={visit.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium">{visit.date}</span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            {visit.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 mb-1">
                          <strong>Complaint:</strong> {visit.complaint}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Diagnosis:</strong> {visit.diagnosis}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Provider:</strong> {visit.provider}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Medications:</strong> {visit.medications.join(', ')}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-gray-900">${visit.revenue}</p>
                        <button 
                          onClick={() => router.push(`/portal/consultation/${visit.id}`)}
                          className="text-gray-600 hover:text-gray-900 text-sm mt-1"
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              {userRole !== 'provider' && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Revenue from Patient</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${consultationHistory.reduce((sum, v) => sum + v.revenue, 0)}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'medications' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Current Medications</h3>
              <div className="space-y-3">
                {patient.currentMedications.map((med, idx) => (
                  <Card key={idx} className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{med.name}</p>
                        <p className="text-sm text-gray-500">Started: {med.startDate}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 text-sm rounded-full ${
                          med.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {med.status}
                        </span>
                        <button className="text-gray-600 hover:text-gray-900">
                          Edit
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <button className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition">
                Add Medication
              </button>
            </div>
          )}
          
          {activeTab === 'subscription' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Subscription Management</h3>
              <Card className="p-6 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{patient.subscription.plan}</p>
                    <p className="text-gray-600">${patient.subscription.price}/month</p>
                    {patient.subscription.discount > 0 && (
                      <p className="text-sm text-green-600">
                        {patient.subscription.discount}% discount applied
                      </p>
                    )}
                    <div className="mt-4 space-y-1 text-sm">
                      <p className="text-gray-500">Member since: {patient.subscription.startDate}</p>
                      <p className="text-gray-500">Next billing: {patient.subscription.nextBilling}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    patient.subscription.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : patient.subscription.status === 'paused'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {patient.subscription.status}
                  </span>
                </div>
              </Card>
              
              {(userRole === 'admin' || userRole === 'provider-admin' || userRole === 'super-admin') && (
                <div className="grid grid-cols-2 gap-4">
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    Change Plan
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    Apply Discount
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    Pause Subscription
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    Add Credit
                  </button>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'medical records' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Medical Records</h3>
                <button 
                  onClick={() => alert('Add new medical record')}
                  className="px-3 py-1 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition"
                >
                  Add Record
                </button>
              </div>
              
              <div className="space-y-4">
                {medicalRecords.map((record) => (
                  <Card key={record.id} className="p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{record.type}</h4>
                        <p className="text-sm text-gray-600">
                          {new Date(record.date).toLocaleDateString()} • {record.provider}
                        </p>
                      </div>
                      <button className="text-sm text-gray-600 hover:text-gray-900">
                        View Full →
                      </button>
                    </div>
                    
                    {record.vitals && (
                      <div className="flex gap-4 mb-3 text-sm">
                        <span className="text-gray-600">
                          Weight: <strong className="text-gray-900">{record.vitals.weight}</strong>
                        </span>
                        <span className="text-gray-600">
                          BP: <strong className="text-gray-900">{record.vitals.bp}</strong>
                        </span>
                      </div>
                    )}
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="font-medium text-gray-700">Clinical Note:</p>
                        <p className="text-gray-900">{record.content}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium text-gray-700">Assessment:</p>
                        <p className="text-gray-900">{record.assessment}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium text-gray-700">Plan:</p>
                        <p className="text-gray-900">{record.plan}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                      <div className="flex gap-2">
                        <button className="text-xs text-gray-600 hover:text-gray-900">
                          Edit
                        </button>
                        <span className="text-gray-400">•</span>
                        <button className="text-xs text-gray-600 hover:text-gray-900">
                          Add Addendum
                        </button>
                      </div>
                      <span className="text-xs text-gray-500">
                        Signed electronically by {record.provider}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
              
              {medicalRecords.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No medical records available
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'notes' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Provider Notes</h3>
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> These are informal provider notes. For official medical documentation, use the Medical Records tab.
                </p>
              </div>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                rows={8}
                placeholder="Add informal notes about this patient..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="mt-3 flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
                <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition">
                  Save Notes
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
