'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Types
interface FormData {
  // Step 1-2: Symptom Engagement
  primaryGoal: string;
  biggestChallenge: string;
  
  // Step 3: Core Medical Safety
  currentMedications: string;
  
  // Step 4: Email Capture
  email: string;
  
  // Step 5-8: Medical History
  currentWeight: string;
  height: string;
  medicalConditions: string[];
  previousAttempts: string;
  
  // Step 9-11: Personal Details
  fullName: string;
  phone: string;
  address: string;
}

interface FormStep {
  step: number;
  title: string;
  subtitle?: string;
  field: {
    name: keyof FormData;
    type: 'radio' | 'checkbox' | 'text' | 'email' | 'tel' | 'textarea' | 'number';
    label?: string;
    placeholder?: string;
    options?: { value: string; label: string }[];
  };
}

// Form Steps Configuration
const FORM_STEPS: FormStep[] = [
  {
    step: 1,
    title: "",
    subtitle: "",
    field: {
      name: 'primaryGoal',
      type: 'radio',
      label: 'What is your primary health goal?',
      options: [
        { value: 'lose_weight', label: 'Lose weight' },
        { value: 'manage_diabetes', label: 'Manage diabetes' },
        { value: 'improve_energy', label: 'Improve energy levels' },
        { value: 'overall_health', label: 'Overall health improvement' }
      ]
    }
  },
  {
    step: 2,
    title: "",
    field: {
      name: 'biggestChallenge',
      type: 'radio',
      label: "What's been your biggest challenge?",
      options: [
        { value: 'diet', label: 'Sticking to a healthy diet' },
        { value: 'exercise', label: 'Finding time to exercise' },
        { value: 'motivation', label: 'Staying motivated' },
        { value: 'medical', label: 'Medical conditions' }
      ]
    }
  },
  {
    step: 3,
    title: "",
    subtitle: "",
    field: {
      name: 'currentMedications',
      type: 'radio',
      label: 'Are you currently taking any medications?',
      options: [
        { value: 'yes', label: 'Yes, I take medications' },
        { value: 'no', label: 'No medications' },
        { value: 'unsure', label: "I'm not sure" }
      ]
    }
  },
  {
    step: 4,
    title: "",
    subtitle: "",
    field: {
      name: 'email',
      type: 'email',
      label: "Enter your email to save your progress",
      placeholder: 'your@email.com'
    }
  },
  {
    step: 5,
    title: "",
    field: {
      name: 'currentWeight',
      type: 'number',
      label: 'What is your current weight?',
      placeholder: '180 lbs'
    }
  },
  {
    step: 6,
    title: "",
    field: {
      name: 'height',
      type: 'text',
      label: 'What is your height?',
      placeholder: "e.g., 5'8\" or 173cm"
    }
  },
  {
    step: 7,
    title: "",
    subtitle: "",
    field: {
      name: 'medicalConditions',
      type: 'checkbox',
      label: 'Do you have any of these conditions? (Select all that apply)',
      options: [
        { value: 'diabetes', label: 'Diabetes' },
        { value: 'high_bp', label: 'High blood pressure' },
        { value: 'heart_disease', label: 'Heart disease' },
        { value: 'thyroid', label: 'Thyroid condition' },
        { value: 'none', label: 'None of the above' }
      ]
    }
  },
  {
    step: 8,
    title: "",
    field: {
      name: 'previousAttempts',
      type: 'radio',
      label: 'Have you tried weight loss programs before?',
      options: [
        { value: 'never', label: 'This is my first time' },
        { value: 'once', label: 'Once or twice' },
        { value: 'several', label: 'Several times' },
        { value: 'many', label: 'Many times' }
      ]
    }
  },
  {
    step: 9,
    title: "",
    subtitle: "",
    field: {
      name: 'fullName',
      type: 'text',
      label: "What's your full name?",
      placeholder: 'John Doe'
    }
  },
  {
    step: 10,
    title: "",
    field: {
      name: 'phone',
      type: 'tel',
      label: "What's your phone number?",
      placeholder: '(555) 123-4567'
    }
  },
  {
    step: 11,
    title: "",
    subtitle: "",
    field: {
      name: 'address',
      type: 'textarea',
      label: 'Where should we send your medication?',
      placeholder: '123 Main St\nApt 4B\nNew York, NY 10001'
    }
  }
];

const TOTAL_STEPS = FORM_STEPS.length;

// Initial form data
const initialFormData: FormData = {
  primaryGoal: '',
  biggestChallenge: '',
  currentMedications: '',
  email: '',
  currentWeight: '',
  height: '',
  medicalConditions: [],
  previousAttempts: '',
  fullName: '',
  phone: '',
  address: ''
};

// Progress Bar Component
const ProgressBar: React.FC<{ currentStep: number; totalSteps: number }> = ({ currentStep, totalSteps }) => {
  const progressPercentage = (currentStep / totalSteps) * 100;
  
  return (
    <div className="w-full">
      {/* Progress Bar - simplified, just the bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className="bg-zappy-pink h-1.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};

// Radio Group Component
const RadioGroup: React.FC<{
  field: FormStep['field'];
  value: string;
  onChange: (name: string, value: string) => void;
}> = ({ field, value, onChange }) => (
  <div className="space-y-6">
    {field.label && (
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
        {field.label}
      </h2>
    )}
    <div className="space-y-3 max-w-lg mx-auto">
      {field.options?.map((option) => (
        <label
          key={option.value}
          className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
            value === option.value 
              ? 'bg-zappy-light-yellow border-zappy-pink' 
              : 'border-gray-200 hover:border-zappy-pink bg-white'
          }`}
        >
          <input
            type="radio"
            name={field.name}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(field.name, e.target.value)}
            className="sr-only"
          />
          <span className="font-medium text-gray-700">{option.label}</span>
        </label>
      ))}
    </div>
  </div>
);

// Checkbox Group Component
const CheckboxGroup: React.FC<{
  field: FormStep['field'];
  value: string[];
  onChange: (name: string, value: string) => void;
}> = ({ field, value, onChange }) => (
  <div className="space-y-6">
    {field.label && (
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
        {field.label}
      </h2>
    )}
    <div className="space-y-3 max-w-lg mx-auto">
      {field.options?.map((option) => {
        const isChecked = value.includes(option.value);
        return (
          <label
            key={option.value}
            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              isChecked 
                ? 'bg-zappy-light-yellow border-zappy-pink' 
                : 'border-gray-200 hover:border-zappy-pink bg-white'
            }`}
          >
            <input
              type="checkbox"
              name={field.name}
              value={option.value}
              checked={isChecked}
              onChange={(e) => onChange(field.name, e.target.value)}
              className="w-5 h-5 text-zappy-pink bg-gray-100 border-gray-300 rounded focus:ring-zappy-pink focus:ring-2"
            />
            <span className="ml-3 font-medium text-gray-700">{option.label}</span>
          </label>
        );
      })}
    </div>
  </div>
);

// Input Field Component
const InputField: React.FC<{
  field: FormStep['field'];
  value: string;
  onChange: (name: string, value: string) => void;
}> = ({ field, value, onChange }) => (
  <div>
    {field.label && (
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
        {field.label}
      </h2>
    )}
    <div className="max-w-lg mx-auto">
      {field.type === 'textarea' ? (
        <textarea
          id={field.name}
          name={field.name}
          value={value}
          onChange={(e) => onChange(field.name, e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-zappy-pink focus:border-zappy-pink transition-all"
        />
      ) : (
        <input
          type={field.type}
          id={field.name}
          name={field.name}
          value={value}
          onChange={(e) => onChange(field.name, e.target.value)}
          placeholder={field.placeholder}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-zappy-pink focus:border-zappy-pink transition-all"
        />
      )}
    </div>
  </div>
);

// Main Component
export default function HealthQuizPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const handleNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Form complete - save and redirect
      localStorage.setItem('intakeFormResponses', JSON.stringify({
        ...formData,
        timestamp: new Date().toISOString()
      }));
      setCurrentStep(TOTAL_STEPS + 1); // Show completion screen
    }
  }, [currentStep, formData]);

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  }, []);

  const handleInputChange = useCallback((name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleCheckboxChange = useCallback((name: string, value: string) => {
    setFormData((prev) => {
      const currentValues = prev[name as keyof FormData] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      return { ...prev, [name]: newValues };
    });
  }, []);

  const renderStep = () => {
    // Completion screen
    if (currentStep > TOTAL_STEPS) {
      return (
        <div className="w-full text-center animate-fade-in pt-8">
          <div className="mb-8">
            <div className="w-16 h-16 bg-zappy-light-yellow rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-zappy-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Thank You!</h2>
            <p className="text-gray-600">Your information has been submitted.</p>
          </div>
          
          <p className="text-lg text-gray-600 mb-8">
            A Zappy specialist will review your intake form and create your personalized treatment plan.
          </p>
          
          <button
            onClick={() => router.push('/patient/dashboard')}
            className="bg-zappy-pink text-white font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform shadow-lg"
          >
            Go to Dashboard
          </button>
        </div>
      );
    }

    const stepConfig = FORM_STEPS.find(s => s.step === currentStep);
    if (!stepConfig) return null;

    const { field } = stepConfig;
    const fieldValue = formData[field.name];

    return (
      <div className="w-full animate-fade-in">
        <div className="space-y-6">
          {field.type === 'radio' && (
            <RadioGroup 
              field={field} 
              value={fieldValue as string} 
              onChange={handleInputChange} 
            />
          )}
          {field.type === 'checkbox' && (
            <CheckboxGroup 
              field={field} 
              value={fieldValue as string[]} 
              onChange={handleCheckboxChange} 
            />
          )}
          {(field.type === 'text' || field.type === 'email' || field.type === 'tel' || 
            field.type === 'textarea' || field.type === 'number') && (
            <InputField 
              field={field} 
              value={fieldValue as string} 
              onChange={handleInputChange} 
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      {/* Progress Bar - positioned with proper spacing */}
      {currentStep <= TOTAL_STEPS && (
        <div className="w-full max-w-2xl mx-auto px-4 pt-16 pb-8">
          <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />
        </div>
      )}
      
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pb-12">
        {renderStep()}
        
        {currentStep <= TOTAL_STEPS && (
          <div className="mt-16 flex justify-between items-center">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="text-gray-600 font-bold py-3 px-6 rounded-full hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Back
            </button>
            
            <button
              onClick={handleNext}
              className="bg-zappy-pink text-white font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform shadow-lg"
            >
              {currentStep === TOTAL_STEPS ? 'Complete →' : 'Continue →'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
