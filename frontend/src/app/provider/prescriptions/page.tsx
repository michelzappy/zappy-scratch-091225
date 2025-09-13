'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Prescription {
  id: string;
  patientName: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  refills: number;
  instructions: string;
  prescribedDate: string;
  status: 'active' | 'expired' | 'cancelled';
}

interface RefillRequest {
  id: string;
  prescriptionId: string;
  patientName: string;
  medication: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'denied';
}

export default function ProviderPrescriptions() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'new' | 'history' | 'refills'>('new');
  const [showPharmacySelection, setShowPharmacySelection] = useState(false);
  
  // New prescription form
  const [prescriptionForm, setPrescriptionForm] = useState({
    patientName: '',
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    refills: 0,
    instructions: '',
    sendToPharmacy: false,
    pharmacyId: ''
  });

  // Mock data
  const [prescriptionHistory] = useState<Prescription[]>([
    {
      id: '1',
      patientName: 'John Doe',
      medication: 'Amoxicillin',
      dosage: '500mg',
      frequency: 'Twice daily',
      duration: '7 days',
      refills: 2,
      instructions: 'Take with food',
      prescribedDate: '2025-01-10',
      status: 'active'
    },
    {
      id: '2',
      patientName: 'Jane Smith',
      medication: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      duration: '30 days',
      refills: 5,
      instructions: 'Take in the morning',
      prescribedDate: '2025-01-08',
      status: 'active'
    }
  ]);

  const [refillRequests] = useState<RefillRequest[]>([
    {
      id: '1',
      prescriptionId: '1',
      patientName: 'John Doe',
      medication: 'Amoxicillin 500mg',
      requestDate: '2025-01-12',
      status: 'pending'
    },
    {
      id: '2',
      prescriptionId: '2',
      patientName: 'Jane Smith',
      medication: 'Lisinopril 10mg',
      requestDate: '2025-01-11',
      status: 'approved'
    }
  ]);

  const commonMedications = [
    'Amoxicillin',
    'Azithromycin',
    'Lisinopril',
    'Metformin',
    'Amlodipine',
    'Omeprazole',
    'Simvastatin',
    'Losartan',
    'Albuterol',
    'Gabapentin'
  ];

  const dosageUnits = ['mg', 'mcg', 'g', 'mL', 'units'];
  const frequencies = [
    'Once daily',
    'Twice daily',
    'Three times daily',
    'Four times daily',
    'Every 4 hours',
    'Every 6 hours',
    'Every 8 hours',
    'Every 12 hours',
    'As needed',
    'At bedtime'
  ];

  const pharmacies = [
    { id: '1', name: 'CVS Pharmacy', address: '123 Main St' },
    { id: '2', name: 'Walgreens', address: '456 Oak Ave' },
    { id: '3', name: 'Rite Aid', address: '789 Elm St' }
  ];

  const handlePrescriptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Store prescription (mock)
    const newPrescription: Prescription = {
      id: Date.now().toString(),
      ...prescriptionForm,
      prescribedDate: new Date().toISOString().split('T')[0],
      status: 'active'
    };
    
    // Save to localStorage
    const prescriptions = JSON.parse(localStorage.getItem('prescriptions') || '[]');
    prescriptions.push(newPrescription);
    localStorage.setItem('prescriptions', JSON.stringify(prescriptions));
    
    // Reset form
    setPrescriptionForm({
      patientName: '',
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      refills: 0,
      instructions: '',
      sendToPharmacy: false,
      pharmacyId: ''
    });
    
    // Show success message
    alert('Prescription created successfully!');
    setActiveTab('history');
  };

  const handleRefillAction = (requestId: string, action: 'approve' | 'deny') => {
    alert(`Refill request ${action}d`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/provider/dashboard" className="text-health-600 hover:text-health-700 text-sm">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Prescription Management</h1>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('new')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'new'
                    ? 'border-b-2 border-health-500 text-health-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                New Prescription
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'history'
                    ? 'border-b-2 border-health-500 text-health-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Prescription History
              </button>
              <button
                onClick={() => setActiveTab('refills')}
                className={`py-4 px-6 text-sm font-medium relative ${
                  activeTab === 'refills'
                    ? 'border-b-2 border-health-500 text-health-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Refill Requests
                {refillRequests.filter(r => r.status === 'pending').length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {refillRequests.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* New Prescription Form */}
            {activeTab === 'new' && (
              <form onSubmit={handlePrescriptionSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patient Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={prescriptionForm.patientName}
                      onChange={(e) => setPrescriptionForm(prev => ({ ...prev, patientName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-health-500 focus:border-health-500"
                      placeholder="Enter patient name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medication *
                    </label>
                    <input
                      type="text"
                      required
                      value={prescriptionForm.medication}
                      onChange={(e) => setPrescriptionForm(prev => ({ ...prev, medication: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-health-500 focus:border-health-500"
                      placeholder="Enter medication name"
                      list="medications"
                    />
                    <datalist id="medications">
                      {commonMedications.map(med => (
                        <option key={med} value={med} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dosage *
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        required
                        value={prescriptionForm.dosage}
                        onChange={(e) => setPrescriptionForm(prev => ({ ...prev, dosage: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-health-500 focus:border-health-500"
                        placeholder="e.g., 500mg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequency *
                    </label>
                    <select
                      required
                      value={prescriptionForm.frequency}
                      onChange={(e) => setPrescriptionForm(prev => ({ ...prev, frequency: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-health-500 focus:border-health-500"
                    >
                      <option value="">Select frequency</option>
                      {frequencies.map(freq => (
                        <option key={freq} value={freq}>{freq}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration *
                    </label>
                    <input
                      type="text"
                      required
                      value={prescriptionForm.duration}
                      onChange={(e) => setPrescriptionForm(prev => ({ ...prev, duration: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-health-500 focus:border-health-500"
                      placeholder="e.g., 7 days, 1 month"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Refills
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="12"
                      value={prescriptionForm.refills}
                      onChange={(e) => setPrescriptionForm(prev => ({ ...prev, refills: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-health-500 focus:border-health-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instructions
                  </label>
                  <textarea
                    value={prescriptionForm.instructions}
                    onChange={(e) => setPrescriptionForm(prev => ({ ...prev, instructions: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-health-500 focus:border-health-500"
                    rows={3}
                    placeholder="Special instructions for the patient..."
                  />
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="sendToPharmacy"
                      checked={prescriptionForm.sendToPharmacy}
                      onChange={(e) => {
                        setPrescriptionForm(prev => ({ ...prev, sendToPharmacy: e.target.checked }));
                        setShowPharmacySelection(e.target.checked);
                      }}
                      className="rounded border-gray-300 text-health-600 focus:ring-health-500"
                    />
                    <label htmlFor="sendToPharmacy" className="ml-2 text-sm text-gray-700">
                      Send to pharmacy electronically
                    </label>
                  </div>

                  {showPharmacySelection && (
                    <div className="ml-6 space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Select Pharmacy
                      </label>
                      {pharmacies.map(pharmacy => (
                        <label key={pharmacy.id} className="flex items-center">
                          <input
                            type="radio"
                            name="pharmacy"
                            value={pharmacy.id}
                            checked={prescriptionForm.pharmacyId === pharmacy.id}
                            onChange={(e) => setPrescriptionForm(prev => ({ ...prev, pharmacyId: e.target.value }))}
                            className="text-health-600 focus:ring-health-500"
                          />
                          <span className="ml-2 text-sm">
                            {pharmacy.name} - {pharmacy.address}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => router.push('/provider/dashboard')}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-health-600 text-white rounded-md hover:bg-health-700"
                  >
                    Create Prescription
                  </button>
                </div>
              </form>
            )}

            {/* Prescription History */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                {prescriptionHistory.map(prescription => (
                  <div key={prescription.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{prescription.patientName}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            prescription.status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : prescription.status === 'expired'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {prescription.status}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-health-600">
                          {prescription.medication} - {prescription.dosage}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {prescription.frequency} for {prescription.duration}
                        </p>
                        {prescription.instructions && (
                          <p className="text-sm text-gray-500 mt-1">
                            Instructions: {prescription.instructions}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>Prescribed: {prescription.prescribedDate}</span>
                          <span>Refills: {prescription.refills}</span>
                        </div>
                      </div>
                      <div className="ml-4 space-x-2">
                        <button className="text-health-600 hover:text-health-700 text-sm">
                          View
                        </button>
                        <button className="text-gray-600 hover:text-gray-700 text-sm">
                          Print
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Refill Requests */}
            {activeTab === 'refills' && (
              <div className="space-y-4">
                {refillRequests.map(request => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{request.patientName}</h3>
                        <p className="text-sm text-gray-600 mt-1">{request.medication}</p>
                        <p className="text-xs text-gray-500 mt-1">Requested: {request.requestDate}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {request.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleRefillAction(request.id, 'approve')}
                              className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRefillAction(request.id, 'deny')}
                              className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                            >
                              Deny
                            </button>
                          </>
                        ) : (
                          <span className={`px-3 py-1 text-sm rounded-full ${
                            request.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {request.status === 'approved' ? 'Approved' : 'Denied'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
