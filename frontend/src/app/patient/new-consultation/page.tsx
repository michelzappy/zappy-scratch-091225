'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewConsultation() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    consultationType: '',
    chiefComplaint: '',
    symptoms: [] as string[],
    symptomDuration: '',
    painLevel: 0,
    medications: '',
    allergies: '',
    additionalInfo: '',
    files: [] as File[],
  });

  const consultationTypes = [
    'General Medicine',
    'Dermatology',
    'Mental Health',
    'Pediatrics',
    'Women\'s Health',
    'Men\'s Health',
    'Chronic Care',
    'Urgent Care',
  ];

  const commonSymptoms = [
    'Fever', 'Headache', 'Fatigue', 'Cough', 'Sore Throat',
    'Nausea', 'Abdominal Pain', 'Back Pain', 'Chest Pain',
    'Shortness of Breath', 'Dizziness', 'Rash', 'Joint Pain',
  ];

  const handleSymptomToggle = (symptom: string) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        files: [...prev.files, ...Array.from(e.target.files!)]
      }));
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    // Store consultation in localStorage (mock)
    const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
    const newConsultation = {
      id: Date.now().toString(),
      ...formData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      patientId: JSON.parse(localStorage.getItem('user') || '{}').id,
    };
    consultations.push(newConsultation);
    localStorage.setItem('consultations', JSON.stringify(consultations));
    
    router.push('/patient/dashboard?tab=consultations');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/patient/dashboard" className="text-medical-600 hover:text-medical-700 text-sm">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">New Consultation Request</h1>
          <p className="text-gray-600 mt-2">Tell us about your health concern</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map(step => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= step ? 'bg-medical-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-full h-1 mx-2 ${
                    currentStep > step ? 'bg-medical-600' : 'bg-gray-200'
                  }`} style={{ width: '100px' }} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-600">Type</span>
            <span className="text-xs text-gray-600">Symptoms</span>
            <span className="text-xs text-gray-600">Details</span>
            <span className="text-xs text-gray-600">Review</span>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          {/* Step 1: Consultation Type */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">What type of consultation do you need?</h2>
              <div className="grid grid-cols-2 gap-4">
                {consultationTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setFormData(prev => ({ ...prev, consultationType: type }))}
                    className={`p-4 border rounded-lg text-left hover:border-medical-600 transition ${
                      formData.consultationType === type
                        ? 'border-medical-600 bg-medical-50'
                        : 'border-gray-300'
                    }`}
                  >
                    <span className="font-medium">{type}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Symptoms */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">What symptoms are you experiencing?</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Main Concern *
                </label>
                <textarea
                  value={formData.chiefComplaint}
                  onChange={(e) => setFormData(prev => ({ ...prev, chiefComplaint: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-medical-500 focus:border-medical-500"
                  rows={3}
                  placeholder="Describe your main health concern..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select all symptoms that apply:
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {commonSymptoms.map(symptom => (
                    <label key={symptom} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.symptoms.includes(symptom)}
                        onChange={() => handleSymptomToggle(symptom)}
                        className="rounded border-gray-300 text-medical-600 focus:ring-medical-500"
                      />
                      <span className="text-sm">{symptom}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How long have you had these symptoms?
                  </label>
                  <select
                    value={formData.symptomDuration}
                    onChange={(e) => setFormData(prev => ({ ...prev, symptomDuration: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-medical-500 focus:border-medical-500"
                  >
                    <option value="">Select duration</option>
                    <option value="less-than-24h">Less than 24 hours</option>
                    <option value="1-3-days">1-3 days</option>
                    <option value="1-week">About a week</option>
                    <option value="2-weeks">1-2 weeks</option>
                    <option value="1-month">About a month</option>
                    <option value="longer">More than a month</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pain Level (0-10)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={formData.painLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, painLevel: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>No pain</span>
                    <span className="font-bold text-medical-600">{formData.painLevel}</span>
                    <span>Severe</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Additional Details */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Additional Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Medications
                </label>
                <textarea
                  value={formData.medications}
                  onChange={(e) => setFormData(prev => ({ ...prev, medications: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-medical-500 focus:border-medical-500"
                  rows={2}
                  placeholder="List any medications you're currently taking..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Known Allergies
                </label>
                <textarea
                  value={formData.allergies}
                  onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-medical-500 focus:border-medical-500"
                  rows={2}
                  placeholder="List any known allergies..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Medical Documents or Photos
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">Click to upload files</p>
                      <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                    </div>
                  </label>
                </div>
                {formData.files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {formData.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm truncate">{file.name}</span>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Any additional information
                </label>
                <textarea
                  value={formData.additionalInfo}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-medical-500 focus:border-medical-500"
                  rows={3}
                  placeholder="Any other details you'd like to share..."
                />
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Review Your Consultation Request</h2>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700">Consultation Type</h3>
                  <p className="text-gray-900">{formData.consultationType}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700">Chief Complaint</h3>
                  <p className="text-gray-900">{formData.chiefComplaint}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700">Symptoms</h3>
                  <p className="text-gray-900">{formData.symptoms.join(', ') || 'None selected'}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700">Duration</h3>
                  <p className="text-gray-900">{formData.symptomDuration || 'Not specified'}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700">Pain Level</h3>
                  <p className="text-gray-900">{formData.painLevel}/10</p>
                </div>
                
                {formData.files.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-700">Uploaded Files</h3>
                    <p className="text-gray-900">{formData.files.length} file(s) attached</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Previous
              </button>
            )}
            
            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={currentStep === 1 && !formData.consultationType}
                className="ml-auto px-6 py-2 bg-medical-600 text-white rounded-md hover:bg-medical-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="ml-auto px-6 py-2 bg-medical-600 text-white rounded-md hover:bg-medical-700"
              >
                Submit Consultation
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
