'use client';

import { useState } from 'react';

interface MedicalDocument {
  id: string;
  name: string;
  type: 'lab_result' | 'prescription' | 'imaging' | 'consultation' | 'other';
  uploadDate: string;
  size: string;
  category: string;
}

export default function PatientMedicalRecords() {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'documents'>('overview');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  // Simplified medical data
  const medicalOverview = {
    bloodType: 'O+',
    allergies: ['Penicillin', 'Peanuts'],
    conditions: ['Hypertension', 'Type 2 Diabetes'],
    medications: [
      { name: 'Metformin', dose: '500mg', frequency: 'Twice daily' },
      { name: 'Lisinopril', dose: '10mg', frequency: 'Once daily' }
    ],
    lastVisit: 'Jan 5, 2025',
    nextAppointment: 'Feb 12, 2025'
  };

  // Mock documents
  const [documents] = useState<MedicalDocument[]>([
    {
      id: '1',
      name: 'Blood Test Results',
      type: 'lab_result',
      uploadDate: 'Jan 10, 2025',
      size: '245 KB',
      category: 'Lab Results'
    },
    {
      id: '2',
      name: 'X-Ray Report',
      type: 'imaging',
      uploadDate: 'Jan 5, 2025',
      size: '1.2 MB',
      category: 'Imaging'
    },
    {
      id: '3',
      name: 'Prescription',
      type: 'prescription',
      uploadDate: 'Jan 8, 2025',
      size: '128 KB',
      category: 'Prescriptions'
    }
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const getDocumentIcon = (type: string) => {
    switch(type) {
      case 'lab_result': return '🧪';
      case 'prescription': return '💊';
      case 'imaging': return '🩻';
      case 'consultation': return '👨‍⚕️';
      default: return '📄';
    }
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Medical Records</h1>
        <p className="text-sm text-slate-600 mt-1">Your health information in one place</p>
      </div>

      {/* Quick Stats - Mobile Priority */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-600">Blood Type</p>
          <p className="text-lg font-bold text-slate-900 mt-1">{medicalOverview.bloodType}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-600">Allergies</p>
          <p className="text-lg font-bold text-red-600 mt-1">{medicalOverview.allergies.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-600">Conditions</p>
          <p className="text-lg font-bold text-orange-600 mt-1">{medicalOverview.conditions.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-600">Medications</p>
          <p className="text-lg font-bold text-medical-600 mt-1">{medicalOverview.medications.length}</p>
        </div>
      </div>

      {/* Mobile-First Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'history', label: 'History', icon: '📋' },
            { id: 'documents', label: 'Documents', icon: '📁' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-medical-50 text-medical-700 border-b-2 border-medical-500'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="lg:hidden text-lg">{tab.icon}</span>
              <span className="hidden lg:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* Overview Tab - Mobile Optimized */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Critical Info Alert */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h3 className="font-semibold text-red-900 text-sm mb-2">⚠️ Critical Allergies</h3>
                <div className="flex flex-wrap gap-2">
                  {medicalOverview.allergies.map(allergy => (
                    <span key={allergy} className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>

              {/* Current Medications */}
              <div>
                <h3 className="font-semibold text-slate-900 text-sm mb-3">Current Medications</h3>
                <div className="space-y-2">
                  {medicalOverview.medications.map((med, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm text-slate-900">{med.name}</p>
                        <p className="text-xs text-slate-600">{med.dose} • {med.frequency}</p>
                      </div>
                      <button className="text-xs text-medical-600 hover:text-medical-700">
                        Details →
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Medical Conditions */}
              <div>
                <h3 className="font-semibold text-slate-900 text-sm mb-3">Medical Conditions</h3>
                <div className="flex flex-wrap gap-2">
                  {medicalOverview.conditions.map(condition => (
                    <span key={condition} className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                      {condition}
                    </span>
                  ))}
                </div>
              </div>

              {/* Appointments */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-600">Last Visit</p>
                  <p className="font-medium text-sm text-slate-900 mt-1">{medicalOverview.lastVisit}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <p className="text-xs text-emerald-600">Next Appointment</p>
                  <p className="font-medium text-sm text-emerald-900 mt-1">{medicalOverview.nextAppointment}</p>
                </div>
              </div>
            </div>
          )}

          {/* History Tab - Simplified */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {/* Expandable Sections */}
              {[
                { id: 'basic', title: 'Basic Information', emoji: '👤' },
                { id: 'conditions', title: 'Medical Conditions', emoji: '🏥' },
                { id: 'allergies', title: 'Allergies', emoji: '⚠️' },
                { id: 'family', title: 'Family History', emoji: '👨‍👩‍👧‍👦' },
                { id: 'lifestyle', title: 'Lifestyle', emoji: '🏃' },
                { id: 'emergency', title: 'Emergency Contact', emoji: '🚨' }
              ].map(section => (
                <div key={section.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                    className="w-full px-4 py-3 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{section.emoji}</span>
                      <span className="font-medium text-sm text-slate-900">{section.title}</span>
                    </div>
                    <svg 
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        expandedSection === section.id ? 'rotate-180' : ''
                      }`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {expandedSection === section.id && (
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
                      <p className="text-sm text-slate-600">
                        {section.id === 'basic' && 'Height: 175cm • Weight: 70kg • Blood Type: O+'}
                        {section.id === 'conditions' && 'Hypertension (2020) • Type 2 Diabetes (2021)'}
                        {section.id === 'allergies' && 'Medications: Penicillin • Food: Peanuts'}
                        {section.id === 'family' && 'Father: Heart Disease • Mother: Diabetes'}
                        {section.id === 'lifestyle' && 'Non-smoker • Moderate exercise • Social drinker'}
                        {section.id === 'emergency' && 'Jane Doe • (555) 123-4567 • Spouse'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              
              <button className="w-full py-2.5 px-4 bg-medical-600 text-white rounded-xl font-medium hover:bg-medical-700 transition-colors text-sm">
                Edit Medical History
              </button>
            </div>
          )}

          {/* Documents Tab - Mobile Optimized */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="document-upload"
                />
                <label htmlFor="document-upload" className="cursor-pointer">
                  <div className="text-3xl mb-2">📤</div>
                  <p className="text-sm font-medium text-slate-900">Upload Documents</p>
                  <p className="text-xs text-slate-500 mt-1">PDF, DOC, JPG up to 10MB</p>
                </label>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="bg-emerald-50 rounded-xl p-3">
                  <p className="text-sm font-medium text-emerald-900 mb-2">
                    {uploadedFiles.length} file(s) ready to upload
                  </p>
                  <button className="text-xs text-emerald-600 hover:text-emerald-700">
                    Upload Now →
                  </button>
                </div>
              )}

              {/* Documents List */}
              <div className="space-y-2">
                {documents.map(doc => (
                  <div key={doc.id} className="bg-white border border-slate-200 rounded-xl p-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{getDocumentIcon(doc.type)}</span>
                        <div>
                          <p className="font-medium text-sm text-slate-900">{doc.name}</p>
                          <p className="text-xs text-slate-600 mt-1">
                            {doc.category} • {doc.size} • {doc.uploadDate}
                          </p>
                        </div>
                      </div>
                      <button className="text-medical-600 hover:text-medical-700 text-sm">
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full py-2.5 px-4 border-2 border-dashed border-slate-300 text-slate-600 rounded-xl hover:border-slate-400 hover:text-slate-700 transition-colors text-sm">
                + Upload More Documents
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Buttons - Mobile Fixed */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-slate-200 lg:hidden">
        <div className="grid grid-cols-2 gap-2">
          <button className="py-2 px-4 bg-medical-600 text-white rounded-lg text-sm font-medium">
            📥 Download All
          </button>
          <button className="py-2 px-4 bg-emerald-600 text-white rounded-lg text-sm font-medium">
            📤 Share with Doctor
          </button>
        </div>
      </div>
    </div>
  );
}
