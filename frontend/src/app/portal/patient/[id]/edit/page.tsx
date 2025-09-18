'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  insurance: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
  };
  medicalHistory: {
    allergies: string[];
    medications: string[];
    conditions: string[];
  };
  status: 'active' | 'inactive' | 'pending';
}

export default function EditPatientPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    fetchPatient();
  }, [patientId]);

  const fetchPatient = async () => {
    // Mock data - in production, fetch from API
    const mockPatient: Patient = {
      id: patientId,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1 (555) 123-4567',
      dateOfBirth: '1985-06-15',
      gender: 'female',
      address: {
        street: '123 Main Street, Apt 4B',
        city: 'New York',
        state: 'NY',
        zipCode: '10001'
      },
      emergencyContact: {
        name: 'John Johnson',
        relationship: 'Spouse',
        phone: '+1 (555) 987-6543'
      },
      insurance: {
        provider: 'Blue Cross Blue Shield',
        policyNumber: 'BCBS123456789',
        groupNumber: 'GRP987654'
      },
      medicalHistory: {
        allergies: ['Penicillin', 'Shellfish'],
        medications: ['Lisinopril 10mg', 'Metformin 500mg'],
        conditions: ['Hypertension', 'Type 2 Diabetes']
      },
      status: 'active'
    };

    setPatient(mockPatient);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!patient) return;
    
    setSaving(true);
    
    try {
      // Mock save - in production, send to API
      console.log('Saving patient:', patient);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      alert('Patient information updated successfully!');
      
      // Redirect back to patient details
      router.push(`/portal/patient/${patientId}`);
    } catch (error) {
      console.error('Error saving patient:', error);
      alert('Error saving patient information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updatePatient = (updates: Partial<Patient>) => {
    setPatient(prev => prev ? { ...prev, ...updates } : null);
  };

  const updateNestedField = (path: string[], value: any) => {
    setPatient(prev => {
      if (!prev) return null;
      
      const newPatient = { ...prev };
      let current: any = newPatient;
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      return newPatient;
    });
  };

  const addArrayItem = (path: string[], item: string) => {
    setPatient(prev => {
      if (!prev) return null;
      
      const newPatient = { ...prev };
      let current: any = newPatient;
      
      for (const key of path.slice(0, -1)) {
        current = current[key];
      }
      
      const arrayKey = path[path.length - 1];
      current[arrayKey] = [...current[arrayKey], item];
      
      return newPatient;
    });
  };

  const removeArrayItem = (path: string[], index: number) => {
    setPatient(prev => {
      if (!prev) return null;
      
      const newPatient = { ...prev };
      let current: any = newPatient;
      
      for (const key of path.slice(0, -1)) {
        current = current[key];
      }
      
      const arrayKey = path[path.length - 1];
      current[arrayKey] = current[arrayKey].filter((_: any, i: number) => i !== index);
      
      return newPatient;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading patient information...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Patient not found</p>
          <Link href="/portal/patients" className="mt-4 inline-block text-purple-600 hover:text-purple-700">
            ← Back to Patients
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href={`/portal/patient/${patientId}`}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Patient Details
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Edit Patient: {patient.name}</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href={`/portal/patient/${patientId}`}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </Link>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'basic', label: 'Basic Information' },
              { key: 'contact', label: 'Contact & Address' },
              { key: 'insurance', label: 'Insurance' },
              { key: 'medical', label: 'Medical History' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          
          {/* Basic Information Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={patient.name}
                    onChange={(e) => updatePatient({ name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={patient.email}
                    onChange={(e) => updatePatient({ email: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={patient.phone}
                    onChange={(e) => updatePatient({ phone: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={patient.dateOfBirth}
                    onChange={(e) => updatePatient({ dateOfBirth: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    value={patient.gender}
                    onChange={(e) => updatePatient({ gender: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={patient.status}
                    onChange={(e) => updatePatient({ status: e.target.value as 'active' | 'inactive' | 'pending' })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Contact & Address Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Contact & Address Information</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4">Address</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={patient.address.street}
                        onChange={(e) => updateNestedField(['address', 'street'], e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          value={patient.address.city}
                          onChange={(e) => updateNestedField(['address', 'city'], e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State
                        </label>
                        <input
                          type="text"
                          value={patient.address.state}
                          onChange={(e) => updateNestedField(['address', 'state'], e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          value={patient.address.zipCode}
                          onChange={(e) => updateNestedField(['address', 'zipCode'], e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Name
                      </label>
                      <input
                        type="text"
                        value={patient.emergencyContact.name}
                        onChange={(e) => updateNestedField(['emergencyContact', 'name'], e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Relationship
                      </label>
                      <input
                        type="text"
                        value={patient.emergencyContact.relationship}
                        onChange={(e) => updateNestedField(['emergencyContact', 'relationship'], e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={patient.emergencyContact.phone}
                        onChange={(e) => updateNestedField(['emergencyContact', 'phone'], e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Insurance Tab */}
          {activeTab === 'insurance' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Insurance Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Insurance Provider
                  </label>
                  <input
                    type="text"
                    value={patient.insurance.provider}
                    onChange={(e) => updateNestedField(['insurance', 'provider'], e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Policy Number
                  </label>
                  <input
                    type="text"
                    value={patient.insurance.policyNumber}
                    onChange={(e) => updateNestedField(['insurance', 'policyNumber'], e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Number
                  </label>
                  <input
                    type="text"
                    value={patient.insurance.groupNumber}
                    onChange={(e) => updateNestedField(['insurance', 'groupNumber'], e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Medical History Tab */}
          {activeTab === 'medical' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Medical History</h2>
              
              <div className="space-y-6">
                {/* Allergies */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4">Allergies</h3>
                  <div className="space-y-3">
                    {patient.medicalHistory.allergies.map((allergy, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <input
                          type="text"
                          value={allergy}
                          onChange={(e) => {
                            const newAllergies = [...patient.medicalHistory.allergies];
                            newAllergies[index] = e.target.value;
                            updateNestedField(['medicalHistory', 'allergies'], newAllergies);
                          }}
                          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                        <button
                          onClick={() => removeArrayItem(['medicalHistory', 'allergies'], index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addArrayItem(['medicalHistory', 'allergies'], '')}
                      className="text-purple-600 hover:text-purple-700 text-sm"
                    >
                      + Add Allergy
                    </button>
                  </div>
                </div>

                {/* Current Medications */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4">Current Medications</h3>
                  <div className="space-y-3">
                    {patient.medicalHistory.medications.map((medication, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <input
                          type="text"
                          value={medication}
                          onChange={(e) => {
                            const newMedications = [...patient.medicalHistory.medications];
                            newMedications[index] = e.target.value;
                            updateNestedField(['medicalHistory', 'medications'], newMedications);
                          }}
                          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                        <button
                          onClick={() => removeArrayItem(['medicalHistory', 'medications'], index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addArrayItem(['medicalHistory', 'medications'], '')}
                      className="text-purple-600 hover:text-purple-700 text-sm"
                    >
                      + Add Medication
                    </button>
                  </div>
                </div>

                {/* Medical Conditions */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4">Medical Conditions</h3>
                  <div className="space-y-3">
                    {patient.medicalHistory.conditions.map((condition, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <input
                          type="text"
                          value={condition}
                          onChange={(e) => {
                            const newConditions = [...patient.medicalHistory.conditions];
                            newConditions[index] = e.target.value;
                            updateNestedField(['medicalHistory', 'conditions'], newConditions);
                          }}
                          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                        <button
                          onClick={() => removeArrayItem(['medicalHistory', 'conditions'], index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addArrayItem(['medicalHistory', 'conditions'], '')}
                      className="text-purple-600 hover:text-purple-700 text-sm"
                    >
                      + Add Condition
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button (repeated at bottom for convenience) */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link
              href={`/portal/patient/${patientId}`}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Cancel
            </Link>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}