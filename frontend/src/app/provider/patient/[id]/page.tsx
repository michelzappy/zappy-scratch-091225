'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ProviderPatientProfile() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id;
  
  const [activeTab, setActiveTab] = useState('overview');
  
  // Mock patient data
  const patient = {
    id: patientId,
    firstName: 'Emily',
    lastName: 'Johnson',
    email: 'emily.johnson@email.com',
    phone: '(555) 123-4567',
    dateOfBirth: '1996-03-15',
    age: 28,
    gender: 'Female',
    address: '123 Main St, Apt 4B, San Francisco, CA 94102',
    
    // Subscription
    subscription: {
      plan: 'Essential Care',
      price: 29,
      status: 'active',
      startDate: '2023-10-01',
      nextBilling: '2024-02-01',
      discount: 0
    },
    
    // Stats
    totalSpent: 1847,
    totalConsultations: 8,
    activeRx: 2,
    lastVisit: '2024-01-10',
    
    // Medical
    allergies: ['Penicillin', 'Sulfa drugs'],
    conditions: ['Acne vulgaris', 'Mild anxiety'],
    currentMedications: [
      { name: 'Tretinoin 0.025%', startDate: '2023-11-15', status: 'active' },
      { name: 'Doxycycline 100mg', startDate: '2023-11-15', status: 'active' }
    ]
  };
  
  const consultationHistory = [
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
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/provider/patients')}
                className="text-slate-600 hover:text-slate-900"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  {patient.firstName} {patient.lastName}
                </h1>
                <p className="text-sm text-slate-500">Patient ID: {patient.id}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Start Consultation
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Send Message
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Key Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-xs text-slate-500">Total Spent</p>
            <p className="text-xl font-bold text-slate-900">${patient.totalSpent}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-xs text-slate-500">Consultations</p>
            <p className="text-xl font-bold text-slate-900">{patient.totalConsultations}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-xs text-slate-500">Active Rx</p>
            <p className="text-xl font-bold text-slate-900">{patient.activeRx}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-xs text-slate-500">Last Visit</p>
            <p className="text-xl font-bold text-slate-900">{patient.lastVisit}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-xs text-slate-500">Subscription</p>
            <p className="text-xl font-bold text-green-600">{patient.subscription.plan}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-t-lg shadow-sm">
          <div className="flex border-b">
            {['overview', 'history', 'medications', 'subscription', 'notes'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium capitalize ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-lg shadow-sm p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Patient Information</h3>
                <dl className="space-y-2 text-sm">
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
                    <dd className="font-medium text-right">{patient.address}</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Medical Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Allergies</p>
                    <div className="flex flex-wrap gap-2">
                      {patient.allergies.map(allergy => (
                        <span key={allergy} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                          {allergy}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Conditions</p>
                    <div className="flex flex-wrap gap-2">
                      {patient.conditions.map(condition => (
                        <span key={condition} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
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
              <div className="space-y-3">
                {consultationHistory.map(visit => (
                  <div key={visit.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium">{visit.date}</span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                            {visit.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 mb-1">
                          <strong>Complaint:</strong> {visit.complaint}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Diagnosis:</strong> {visit.diagnosis}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Medications:</strong> {visit.medications.join(', ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${visit.revenue}</p>
                        <button className="text-blue-600 hover:text-blue-700 text-sm mt-1">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'medications' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Current Medications</h3>
              <div className="space-y-3">
                {patient.currentMedications.map((med, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{med.name}</p>
                        <p className="text-sm text-gray-500">Started: {med.startDate}</p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded">
                        {med.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'subscription' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Subscription Management</h3>
              <div className="border rounded-lg p-4 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-lg font-semibold text-blue-600">{patient.subscription.plan}</p>
                    <p className="text-sm text-gray-600">${patient.subscription.price}/month</p>
                    <p className="text-sm text-gray-500 mt-2">Member since: {patient.subscription.startDate}</p>
                    <p className="text-sm text-gray-500">Next billing: {patient.subscription.nextBilling}</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded">
                    {patient.subscription.status}
                  </span>
                </div>
              </div>
              
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
            </div>
          )}
          
          {activeTab === 'notes' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Provider Notes</h3>
              <textarea
                className="w-full p-3 border rounded-lg"
                rows={6}
                placeholder="Add notes about this patient..."
                defaultValue="Patient has wedding in March 2024 - prioritizing quick results for acne treatment. Responds well to combination therapy. Good compliance with medication regimen."
              />
              <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save Notes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
