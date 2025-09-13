'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface MedicalDocument {
  id: string;
  name: string;
  type: 'lab_result' | 'prescription' | 'imaging' | 'consultation' | 'other';
  uploadDate: string;
  size: string;
  category: string;
}

export default function PatientMedicalRecords() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'history' | 'documents'>('history');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  // Medical history form
  const [medicalHistory, setMedicalHistory] = useState({
    // Basic Health Information
    bloodType: '',
    height: '',
    weight: '',
    
    // Medical Conditions
    chronicConditions: [] as string[],
    pastSurgeries: '',
    currentMedications: '',
    
    // Allergies
    medicationAllergies: '',
    foodAllergies: '',
    environmentalAllergies: '',
    
    // Family History
    familyHistory: '',
    
    // Lifestyle
    smokingStatus: '',
    alcoholConsumption: '',
    exerciseFrequency: '',
    
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: ''
  });

  // Mock documents
  const [documents] = useState<MedicalDocument[]>([
    {
      id: '1',
      name: 'Blood Test Results - January 2025.pdf',
      type: 'lab_result',
      uploadDate: '2025-01-10',
      size: '245 KB',
      category: 'Lab Results'
    },
    {
      id: '2',
      name: 'X-Ray Report - Chest.pdf',
      type: 'imaging',
      uploadDate: '2025-01-05',
      size: '1.2 MB',
      category: 'Imaging'
    },
    {
      id: '3',
      name: 'Prescription - Dr. Smith.pdf',
      type: 'prescription',
      uploadDate: '2025-01-08',
      size: '128 KB',
      category: 'Prescriptions'
    }
  ]);

  const chronicConditionsList = [
    'Diabetes Type 2',
    'Hypertension',
    'Asthma',
    'Heart Disease',
    'Arthritis',
    'COPD',
    'Cancer',
    'Thyroid Disorder',
    'Kidney Disease',
    'Depression',
    'Anxiety',
    'None'
  ];

  const handleConditionToggle = (condition: string) => {
    setMedicalHistory(prev => ({
      ...prev,
      chronicConditions: prev.chronicConditions.includes(condition)
        ? prev.chronicConditions.filter(c => c !== condition)
        : [...prev.chronicConditions, condition]
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleHistorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save to localStorage (mock)
    localStorage.setItem('medicalHistory', JSON.stringify(medicalHistory));
    alert('Medical history saved successfully!');
  };

  const handleDocumentUpload = () => {
    if (uploadedFiles.length > 0) {
      // Mock upload
      const newDocs = uploadedFiles.map(file => ({
        id: Date.now().toString(),
        name: file.name,
        type: 'other' as const,
        uploadDate: new Date().toISOString().split('T')[0],
        size: `${(file.size / 1024).toFixed(0)} KB`,
        category: 'Documents'
      }));
      
      // Save to localStorage
      const existingDocs = JSON.parse(localStorage.getItem('medicalDocuments') || '[]');
      localStorage.setItem('medicalDocuments', JSON.stringify([...existingDocs, ...newDocs]));
      
      setUploadedFiles([]);
      alert('Documents uploaded successfully!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/patient/dashboard" className="text-medical-600 hover:text-medical-700 text-sm">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Medical Records</h1>
          <p className="text-gray-600 mt-2">Manage your medical history and documents</p>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'history'
                    ? 'border-b-2 border-medical-500 text-medical-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Medical History
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'documents'
                    ? 'border-b-2 border-medical-500 text-medical-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Documents
              </button>
            </nav>
          </div>

          {/* Medical History Form */}
          {activeTab === 'history' && (
            <form onSubmit={handleHistorySubmit} className="p-6 space-y-8">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Health Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blood Type
                    </label>
                    <select
                      value={medicalHistory.bloodType}
                      onChange={(e) => setMedicalHistory(prev => ({ ...prev, bloodType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-medical-500 focus:border-medical-500"
                    >
                      <option value="">Select blood type</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={medicalHistory.height}
                      onChange={(e) => setMedicalHistory(prev => ({ ...prev, height: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-medical-500 focus:border-medical-500"
                      placeholder="e.g., 175"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={medicalHistory.weight}
                      onChange={(e) => setMedicalHistory(prev => ({ ...prev, weight: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-medical-500 focus:border-medical-500"
                      placeholder="e.g., 70"
                    />
                  </div>
                </div>
              </div>

              {/* Medical Conditions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical Conditions</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chronic Conditions (check all that apply)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {chronicConditionsList.map(condition => (
                        <label key={condition} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={medicalHistory.chronicConditions.includes(condition)}
                            onChange={() => handleConditionToggle(condition)}
                            className="rounded border-gray-300 text-medical-600 focus:ring-medical-500"
                          />
                          <span className="text-sm">{condition}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Past Surgeries
                    </label>
                    <textarea
                      value={medicalHistory.pastSurgeries}
                      onChange={(e) => setMedicalHistory(prev => ({ ...prev, pastSurgeries: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-medical-500 focus:border-medical-500"
                      rows={2}
                      placeholder="List any surgeries you've had (e.g., Appendectomy 2020, Knee surgery 2018)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Medications
                    </label>
                    <textarea
                      value={medicalHistory.currentMedications}
                      onChange={(e) => setMedicalHistory(prev => ({ ...prev, currentMedications: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-medical-500 focus:border-medical-500"
                      rows={2}
                      placeholder="List all medications you're currently taking"
                    />
                  </div>
                </div>
              </div>

              {/* Allergies */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Allergies</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medication Allergies
                    </label>
                    <textarea
                      value={medicalHistory.medicationAllergies}
                      onChange={(e) => setMedicalHistory(prev => ({ ...prev, medicationAllergies: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-medical-500 focus:border-medical-500"
                      rows={2}
                      placeholder="e.g., Penicillin, Aspirin"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Food Allergies
                    </label>
                    <textarea
                      value={medicalHistory.foodAllergies}
                      onChange={(e) => setMedicalHistory(prev => ({ ...prev, foodAllergies: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-medical-500 focus:border-medical-500"
                      rows={2}
                      placeholder="e.g., Peanuts, Shellfish"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Environmental Allergies
                    </label>
                    <textarea
                      value={medicalHistory.environmentalAllergies}
                      onChange={(e) => setMedicalHistory(prev => ({ ...prev, environmentalAllergies: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-medical-500 focus:border-medical-500"
                      rows={2}
                      placeholder="e.g., Pollen, Dust"
                    />
                  </div>
                </div>
              </div>

              {/* Family History */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Family History</h3>
                <textarea
                  value={medicalHistory.familyHistory}
                  onChange={(e) => setMedicalHistory(prev => ({ ...prev, familyHistory: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-medical-500 focus:border-medical-500"
                  rows={3}
                  placeholder="List any significant medical conditions in your family (e.g., Heart disease - father, Diabetes - mother)"
                />
              </div>

              {/* Lifestyle */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Lifestyle</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Smoking Status
                    </label>
                    <select
                      value={medicalHistory.smokingStatus}
                      onChange={(e) => setMedicalHistory(prev => ({ ...prev, smokingStatus: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-medical-500 focus:border-medical-500"
                    >
                      <option value="">Select status</option>
                      <option value="never">Never smoked</option>
                      <option value="former">Former smoker</option>
                      <option value="current">Current smoker</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alcohol Consumption
                    </label>
                    <select
                      value={medicalHistory.alcoholConsumption}
                      onChange={(e) => setMedicalHistory(prev => ({ ...prev, alcoholConsumption: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-medical-500 focus:border-medical-500"
                    >
                      <option value="">Select frequency</option>
                      <option value="never">Never</option>
                      <option value="occasionally">Occasionally</option>
                      <option value="moderate">Moderate (1-2 drinks/day)</option>
                      <option value="heavy">Heavy (3+ drinks/day)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Exercise Frequency
                    </label>
                    <select
                      value={medicalHistory.exerciseFrequency}
                      onChange={(e) => setMedicalHistory(prev => ({ ...prev, exerciseFrequency: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-medical-500 focus:border-medical-500"
                    >
                      <option value="">Select frequency</option>
                      <option value="never">Never</option>
                      <option value="rarely">Rarely (less than once/week)</option>
                      <option value="sometimes">Sometimes (1-2 times/week)</option>
                      <option value="regularly">Regularly (3-4 times/week)</option>
                      <option value="daily">Daily</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={medicalHistory.emergencyContactName}
                      onChange={(e) => setMedicalHistory(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-medical-500 focus:border-medical-500"
                      placeholder="Full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={medicalHistory.emergencyContactPhone}
                      onChange={(e) => setMedicalHistory(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-medical-500 focus:border-medical-500"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relationship
                    </label>
                    <input
                      type="text"
                      value={medicalHistory.emergencyContactRelation}
                      onChange={(e) => setMedicalHistory(prev => ({ ...prev, emergencyContactRelation: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-medical-500 focus:border-medical-500"
                      placeholder="e.g., Spouse, Parent, Friend"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-medical-600 text-white rounded-md hover:bg-medical-700"
                >
                  Save Medical History
                </button>
              </div>
            </form>
          )}

          {/* Documents */}
          {activeTab === 'documents' && (
            <div className="p-6">
              {/* Upload Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Documents</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="document-upload"
                  />
                  <label htmlFor="document-upload" className="cursor-pointer">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">Click to upload medical documents</p>
                      <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX, JPG, PNG up to 10MB</p>
                    </div>
                  </label>
                </div>
                
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                        <span className="text-sm">{file.name}</span>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={handleDocumentUpload}
                      className="mt-2 px-4 py-2 bg-medical-600 text-white rounded hover:bg-medical-700"
                    >
                      Upload {uploadedFiles.length} file(s)
                    </button>
                  </div>
                )}
              </div>

              {/* Documents List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Documents</h3>
                <div className="space-y-3">
                  {documents.map(doc => (
                    <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded ${
                            doc.type === 'lab_result' ? 'bg-blue-100' :
                            doc.type === 'prescription' ? 'bg-green-100' :
                            doc.type === 'imaging' ? 'bg-purple-100' :
                            'bg-gray-100'
                          }`}>
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{doc.name}</p>
                            <p className="text-sm text-gray-500">
                              {doc.category} • {doc.size} • Uploaded {doc.uploadDate}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button className="text-medical-600 hover:text-medical-700">
                            View
                          </button>
                          <button className="text-gray-600 hover:text-gray-700">
                            Download
                          </button>
                          <button className="text-red-600 hover:text-red-700">
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
