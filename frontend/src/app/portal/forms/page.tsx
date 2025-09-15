'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import { intakeForms, getIntakeForm, IntakeForm, IntakeQuestion, IntakeStep } from '@/lib/intake-forms';

export default function FormsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('library');
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewForm, setPreviewForm] = useState<any>(null);
  const [editingForm, setEditingForm] = useState<any>(null);
  const [selectedIntakeForm, setSelectedIntakeForm] = useState<IntakeForm | null>(null);
  const [currentPreviewStep, setCurrentPreviewStep] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const customForms = [
    {
      id: 'custom-1',
      name: 'Follow-up Questionnaire',
      type: 'custom',
      category: 'follow-up',
      status: 'active',
      submissions: 45,
      lastUpdated: '2024-12-08',
    },
    {
      id: 'custom-2',
      name: 'Side Effects Report',
      type: 'custom',
      category: 'monitoring',
      status: 'active',
      submissions: 23,
      lastUpdated: '2024-12-07',
    },
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    
    if (!token) {
      router.push('/portal/login');
      return;
    }
    
    // Check if user has admin access
    if (role === 'provider') {
      // Regular providers don't have access to forms management
      router.push('/portal/dashboard');
      return;
    }
    
    // Admin, provider-admin, and super-admin can access
    if (role === 'admin' || role === 'provider-admin' || role === 'super-admin') {
      // User has access, continue with page logic
    } else {
      // Default redirect if no valid role
      router.push('/portal/dashboard');
    }
  }, [router]);

  const handlePreviewIntakeForm = (formKey: string) => {
    const form = getIntakeForm(formKey);
    if (form) {
      setSelectedIntakeForm(form);
      setCurrentPreviewStep(0);
      setShowPreview(true);
    }
  };

  const renderQuestionInput = (question: IntakeQuestion) => {
    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
            placeholder={question.placeholder || 'Enter your answer...'}
            required={question.required}
          />
        );
      
      case 'textarea':
        return (
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
            rows={4}
            placeholder={question.placeholder || 'Enter your answer...'}
            required={question.required}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
            placeholder={question.placeholder}
            min={question.validation?.min}
            max={question.validation?.max}
            required={question.required}
          />
        );
      
      case 'select':
        return (
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
            required={question.required}
          >
            <option value="">Select an option...</option>
            {question.options?.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'multiselect':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  value={option}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'yesno':
        return (
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name={question.id}
                value="yes"
                required={question.required}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name={question.id}
                value="no"
                required={question.required}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">No</span>
            </label>
          </div>
        );
      
      case 'scale':
        return (
          <div className="flex justify-between">
            {question.options?.map((option) => (
              <label key={option} className="flex flex-col items-center">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  required={question.required}
                  className="mb-1"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'date':
        return (
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
            required={question.required}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
      />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical Forms</h1>
          <p className="text-gray-600 mt-1">Comprehensive intake forms and questionnaires</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Import JSON
          </button>
          <button
            onClick={() => setShowFormBuilder(true)}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
          >
            Create Custom Form
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('library')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'library'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Intake Form Library
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'custom'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Custom Forms
          </button>
        </nav>
      </div>

      {/* Intake Forms Library */}
      {activeTab === 'library' && (
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Medical Intake Forms</h2>
            <p className="text-sm text-gray-600">
              Comprehensive, clinically-designed forms for various conditions. These forms include advanced logic, 
              validations, and follow-up questions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(intakeForms).map(([key, form]) => (
              <Card key={key} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{form.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{form.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{form.estimatedTime}</p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">{form.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Steps:</span>
                    <span className="font-medium">{form.steps.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Questions:</span>
                    <span className="font-medium">
                      {form.steps.reduce((sum, step) => sum + step.questions.length, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Condition:</span>
                    <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-between">
                  <button
                    onClick={() => handlePreviewIntakeForm(key)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Preview
                  </button>
                  <button className="text-sm text-gray-600 hover:text-gray-900">
                    Copy
                  </button>
                  <button className="text-sm text-gray-600 hover:text-gray-900">
                    Export
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {/* Form Stats */}
          <Card className="mt-8 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Intake Forms</p>
                <p className="text-2xl font-bold text-gray-900">{Object.keys(intakeForms).length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Questions</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Object.values(intakeForms).reduce((total, form) => 
                    total + form.steps.reduce((sum, step) => sum + step.questions.length, 0), 0
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg. Completion Time</p>
                <p className="text-2xl font-bold text-green-600">7-9 min</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Conditions Covered</p>
                <p className="text-2xl font-bold text-purple-600">{Object.keys(intakeForms).length}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Custom Forms */}
      {activeTab === 'custom' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customForms.map((form) => (
            <Card key={form.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{form.name}</h3>
                  <p className="text-sm text-gray-500">{form.category}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  form.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {form.status}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Submissions:</span>
                  <span className="font-medium">{form.submissions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Last Updated:</span>
                  <span className="font-medium">{form.lastUpdated}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex justify-between">
                <button className="text-sm text-gray-600 hover:text-gray-900">Edit</button>
                <button className="text-sm text-gray-600 hover:text-gray-900">Preview</button>
                <button className="text-sm text-gray-600 hover:text-gray-900">Delete</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Intake Form Preview Modal */}
      {showPreview && selectedIntakeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{selectedIntakeForm.icon}</span>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedIntakeForm.name}</h3>
                    <p className="text-gray-600">{selectedIntakeForm.estimatedTime}</p>
                  </div>
                </div>
              </div>
              <p className="text-gray-600">{selectedIntakeForm.description}</p>
            </div>

            {/* Step Navigation */}
            <div className="mb-6">
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {selectedIntakeForm.steps.map((step, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPreviewStep(index)}
                    className={`px-4 py-2 text-sm rounded-lg whitespace-nowrap ${
                      currentPreviewStep === index
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {step.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Step */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-4">
                {selectedIntakeForm.steps[currentPreviewStep].title}
              </h4>
              {selectedIntakeForm.steps[currentPreviewStep].subtitle && (
                <p className="text-sm text-gray-600 mb-4">
                  {selectedIntakeForm.steps[currentPreviewStep].subtitle}
                </p>
              )}
              
              <form className="space-y-6">
                {selectedIntakeForm.steps[currentPreviewStep].questions.map((question, index) => (
                  <div key={question.id} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {index + 1}. {question.question}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {question.helpText && (
                      <p className="text-xs text-gray-500">{question.helpText}</p>
                    )}
                    {renderQuestionInput(question)}
                  </div>
                ))}
              </form>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <button
                onClick={() => {
                  if (currentPreviewStep > 0) {
                    setCurrentPreviewStep(currentPreviewStep - 1);
                  }
                }}
                disabled={currentPreviewStep === 0}
                className={`px-4 py-2 rounded-lg ${
                  currentPreviewStep === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                Previous
              </button>
              
              <button
                onClick={() => {
                  setShowPreview(false);
                  setSelectedIntakeForm(null);
                  setCurrentPreviewStep(0);
                }}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Close Preview
              </button>
              
              <button
                onClick={() => {
                  if (currentPreviewStep < selectedIntakeForm.steps.length - 1) {
                    setCurrentPreviewStep(currentPreviewStep + 1);
                  }
                }}
                disabled={currentPreviewStep === selectedIntakeForm.steps.length - 1}
                className={`px-4 py-2 rounded-lg ${
                  currentPreviewStep === selectedIntakeForm.steps.length - 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
