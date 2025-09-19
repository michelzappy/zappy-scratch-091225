'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewConsultationPortal() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Form data states
  const [patientInfo, setPatientInfo] = useState({
    patientId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: ''
  });
  const [consultationDetails, setConsultationDetails] = useState({
    type: '',
    priority: 'medium',
    scheduledDate: '',
    scheduledTime: '',
    estimatedDuration: '30',
    notes: '',
    reasonForVisit: ''
  });
  const [assignmentInfo, setAssignmentInfo] = useState({
    assignedProvider: '',
    department: '',
    consultationMethod: 'video',
    followUpRequired: false,
    followUpDate: ''
  });

  // Consultation types for providers
  const consultationTypes = [
    { value: 'initial_consultation', label: 'Initial Consultation', icon: '🩺' },
    { value: 'follow_up', label: 'Follow-up Visit', icon: '🔄' },
    { value: 'urgent_care', label: 'Urgent Care', icon: '🚨' },
    { value: 'specialist_referral', label: 'Specialist Referral', icon: '👨‍⚕️' },
    { value: 'routine_checkup', label: 'Routine Checkup', icon: '✅' },
    { value: 'medication_review', label: 'Medication Review', icon: '💊' }
  ];

  // Priority levels
  const priorityLevels = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  // Mock providers list (in production, fetch from API)
  const providers = [
    { id: 'dr-smith', name: 'Dr. Sarah Smith', department: 'General Medicine' },
    { id: 'dr-jones', name: 'Dr. Michael Jones', department: 'Cardiology' },
    { id: 'dr-wilson', name: 'Dr. Emily Wilson', department: 'Dermatology' },
    { id: 'dr-brown', name: 'Dr. James Brown', department: 'Mental Health' }
  ];

  // Handle form submission
  const handleSubmit = async () => {
    const consultationData = {
      patientInfo,
      consultationDetails,
      assignmentInfo,
      createdBy: localStorage.getItem('userId') || 'current-user',
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    try {
      // In production, send to API
      console.log('Creating consultation:', consultationData);
      
      // Save to localStorage for demo purposes
      const existingConsultations = JSON.parse(localStorage.getItem('portalConsultations') || '[]');
      const newConsultation = {
        ...consultationData,
        id: `consultation-${Date.now()}`,
        patientName: `${patientInfo.firstName} ${patientInfo.lastName}`
      };
      
      existingConsultations.push(newConsultation);
      localStorage.setItem('portalConsultations', JSON.stringify(existingConsultations));
      
      // Redirect back to consultations list
      router.push('/portal/consultations?created=true');
    } catch (error) {
      console.error('Error creating consultation:', error);
      alert('Error creating consultation. Please try again.');
    }
  };

  // Navigation functions
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Check if current step is valid
  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return patientInfo.firstName && patientInfo.lastName && patientInfo.email;
      case 2:
        return consultationDetails.type && consultationDetails.scheduledDate && consultationDetails.reasonForVisit;
      case 3:
        return assignmentInfo.assignedProvider && assignmentInfo.consultationMethod;
      default:
        return false;
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Patient Information</h2>
              <p className="text-gray-600 mb-6">Enter the patient's details for this consultation.</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Patient ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={patientInfo.patientId}
                    onChange={(e) => setPatientInfo(prev => ({ ...prev, patientId: e.target.value }))}
                    placeholder="Enter existing patient ID"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={patientInfo.firstName}
                    onChange={(e) => setPatientInfo(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter first name"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={patientInfo.lastName}
                    onChange={(e) => setPatientInfo(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter last name"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={patientInfo.email}
                    onChange={(e) => setPatientInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={patientInfo.phone}
                    onChange={(e) => setPatientInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={patientInfo.dateOfBirth}
                    onChange={(e) => setPatientInfo(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Consultation Details</h2>
              <p className="text-gray-600 mb-6">Configure the consultation settings and scheduling.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-3">
                    Consultation Type *
                  </label>
                  <div className="grid md:grid-cols-2 gap-3">
                    {consultationTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setConsultationDetails(prev => ({ ...prev, type: type.value }))}
                        className={`p-3 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                          consultationDetails.type === type.value
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{type.icon}</span>
                          <span className="font-medium text-gray-900">{type.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-3">
                    Priority Level
                  </label>
                  <div className="flex gap-3">
                    {priorityLevels.map((priority) => (
                      <button
                        key={priority.value}
                        onClick={() => setConsultationDetails(prev => ({ ...prev, priority: priority.value }))}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          consultationDetails.priority === priority.value
                            ? priority.color + ' ring-2 ring-offset-2 ring-gray-400'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {priority.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Scheduled Date *
                    </label>
                    <input
                      type="date"
                      value={consultationDetails.scheduledDate}
                      onChange={(e) => setConsultationDetails(prev => ({ ...prev, scheduledDate: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Scheduled Time
                    </label>
                    <input
                      type="time"
                      value={consultationDetails.scheduledTime}
                      onChange={(e) => setConsultationDetails(prev => ({ ...prev, scheduledTime: e.target.value }))}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Estimated Duration (minutes)
                  </label>
                  <select
                    value={consultationDetails.estimatedDuration}
                    onChange={(e) => setConsultationDetails(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Reason for Visit *
                  </label>
                  <textarea
                    value={consultationDetails.reasonForVisit}
                    onChange={(e) => setConsultationDetails(prev => ({ ...prev, reasonForVisit: e.target.value }))}
                    placeholder="Describe the reason for this consultation..."
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={consultationDetails.notes}
                    onChange={(e) => setConsultationDetails(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional notes or special instructions..."
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Assignment & Method</h2>
              <p className="text-gray-600 mb-6">Assign the consultation to a provider and set the consultation method.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Assign to Provider *
                  </label>
                  <select
                    value={assignmentInfo.assignedProvider}
                    onChange={(e) => setAssignmentInfo(prev => ({ ...prev, assignedProvider: e.target.value }))}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                    required
                  >
                    <option value="">Select a provider</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name} - {provider.department}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={assignmentInfo.department}
                    onChange={(e) => setAssignmentInfo(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="Department (auto-filled based on provider)"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-3">
                    Consultation Method *
                  </label>
                  <div className="grid md:grid-cols-3 gap-3">
                    {[
                      { value: 'video', label: 'Video Call', icon: '📹' },
                      { value: 'phone', label: 'Phone Call', icon: '📞' },
                      { value: 'in-person', label: 'In-Person', icon: '🏥' }
                    ].map((method) => (
                      <button
                        key={method.value}
                        onClick={() => setAssignmentInfo(prev => ({ ...prev, consultationMethod: method.value }))}
                        className={`p-3 rounded-lg border-2 text-center transition-all hover:shadow-md ${
                          assignmentInfo.consultationMethod === method.value
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{method.icon}</div>
                        <div className="font-medium text-gray-900 text-sm">{method.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="followUpRequired"
                    checked={assignmentInfo.followUpRequired}
                    onChange={(e) => setAssignmentInfo(prev => ({ ...prev, followUpRequired: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="followUpRequired" className="ml-2 text-gray-700 font-medium">
                    Follow-up required
                  </label>
                </div>

                {assignmentInfo.followUpRequired && (
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Follow-up Date
                    </label>
                    <input
                      type="date"
                      value={assignmentInfo.followUpDate}
                      onChange={(e) => setAssignmentInfo(prev => ({ ...prev, followUpDate: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                    />
                  </div>
                )}

                {/* Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Consultation Summary</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div><strong>Patient:</strong> {patientInfo.firstName} {patientInfo.lastName}</div>
                    <div><strong>Type:</strong> {consultationTypes.find(t => t.value === consultationDetails.type)?.label}</div>
                    <div><strong>Priority:</strong> <span className={`px-2 py-1 rounded ${priorityLevels.find(p => p.value === consultationDetails.priority)?.color}`}>{consultationDetails.priority}</span></div>
                    <div><strong>Date:</strong> {consultationDetails.scheduledDate} {consultationDetails.scheduledTime && `at ${consultationDetails.scheduledTime}`}</div>
                    <div><strong>Provider:</strong> {providers.find(p => p.id === assignmentInfo.assignedProvider)?.name}</div>
                    <div><strong>Method:</strong> {assignmentInfo.consultationMethod}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/portal/consultations"
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Consultations
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">New Consultation</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                <div className="ml-3 text-sm">
                  <div className={`font-medium ${step <= currentStep ? 'text-gray-900' : 'text-gray-500'}`}>
                    {step === 1 && 'Patient Info'}
                    {step === 2 && 'Consultation Details'}
                    {step === 3 && 'Assignment'}
                  </div>
                </div>
                {step < 3 && (
                  <div className={`ml-8 w-16 h-0.5 ${step < currentStep ? 'bg-purple-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {renderStepContent()}
          
          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            
            <div className="flex space-x-3">
              <Link
                href="/portal/consultations"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </Link>
              
              {currentStep < totalSteps ? (
                <button
                  onClick={nextStep}
                  disabled={!isStepValid()}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!isStepValid()}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Consultation
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}