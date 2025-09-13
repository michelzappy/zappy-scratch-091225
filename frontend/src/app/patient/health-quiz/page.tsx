'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getIntakeForm, IntakeForm, IntakeStep, treatmentPlans } from '@/lib/intake-forms';

// Progress Bar Component
const ProgressBar: React.FC<{ currentStep: number; totalSteps: number }> = ({ currentStep, totalSteps }) => {
  const progressPercentage = (currentStep / totalSteps) * 100;
  
  return (
    <div className="w-full">
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
  question: any;
  value: string;
  onChange: (name: string, value: string) => void;
}> = ({ question, value, onChange }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
      {question.question}
    </h2>
    {question.helpText && (
      <p className="text-gray-600 text-center mb-4">{question.helpText}</p>
    )}
    <div className="space-y-3 max-w-lg mx-auto">
      {question.options?.map((option: string) => (
        <label
          key={option}
          className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
            value === option 
              ? 'bg-zappy-light-yellow border-zappy-pink' 
              : 'border-gray-200 hover:border-zappy-pink bg-white'
          }`}
        >
          <input
            type="radio"
            name={question.id}
            value={option}
            checked={value === option}
            onChange={(e) => onChange(question.id, e.target.value)}
            className="sr-only"
          />
          <span className="font-medium text-gray-700">{option}</span>
        </label>
      ))}
    </div>
  </div>
);

// Checkbox Group Component
const CheckboxGroup: React.FC<{
  question: any;
  value: string[];
  onChange: (name: string, value: string) => void;
}> = ({ question, value, onChange }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
      {question.question}
    </h2>
    {question.helpText && (
      <p className="text-gray-600 text-center mb-4">{question.helpText}</p>
    )}
    <div className="space-y-3 max-w-lg mx-auto">
      {question.options?.map((option: string) => {
        const isChecked = value.includes(option);
        return (
          <label
            key={option}
            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              isChecked 
                ? 'bg-zappy-light-yellow border-zappy-pink' 
                : 'border-gray-200 hover:border-zappy-pink bg-white'
            }`}
          >
            <input
              type="checkbox"
              name={question.id}
              value={option}
              checked={isChecked}
              onChange={(e) => onChange(question.id, e.target.value)}
              className="w-5 h-5 text-zappy-pink bg-gray-100 border-gray-300 rounded focus:ring-zappy-pink focus:ring-2"
            />
            <span className="ml-3 font-medium text-gray-700">{option}</span>
          </label>
        );
      })}
    </div>
  </div>
);

// Input Field Component
const InputField: React.FC<{
  question: any;
  value: string;
  onChange: (name: string, value: string) => void;
}> = ({ question, value, onChange }) => (
  <div>
    <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
      {question.question}
    </h2>
    {question.helpText && (
      <p className="text-gray-600 text-center mb-4">{question.helpText}</p>
    )}
    <div className="max-w-lg mx-auto">
      {question.type === 'textarea' ? (
        <textarea
          id={question.id}
          name={question.id}
          value={value}
          onChange={(e) => onChange(question.id, e.target.value)}
          placeholder={question.placeholder}
          rows={4}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-zappy-pink focus:border-zappy-pink transition-all"
        />
      ) : (
        <input
          type={question.type === 'email' ? 'email' : 
                question.type === 'phone' ? 'tel' :
                question.type === 'number' ? 'number' :
                question.type === 'date' ? 'date' :
                'text'}
          id={question.id}
          name={question.id}
          value={value}
          onChange={(e) => onChange(question.id, e.target.value)}
          placeholder={question.placeholder}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-zappy-pink focus:border-zappy-pink transition-all"
        />
      )}
    </div>
  </div>
);

// Scale Component
const ScaleGroup: React.FC<{
  question: any;
  value: string;
  onChange: (name: string, value: string) => void;
}> = ({ question, value, onChange }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
      {question.question}
    </h2>
    {question.helpText && (
      <p className="text-gray-600 text-center mb-4">{question.helpText}</p>
    )}
    <div className="flex justify-center gap-2 max-w-lg mx-auto">
      {question.options?.map((option: string) => (
        <button
          key={option}
          onClick={() => onChange(question.id, option)}
          className={`w-12 h-12 rounded-lg font-semibold transition-all ${
            value === option 
              ? 'bg-zappy-pink text-white transform scale-110' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  </div>
);

// Plan Selection Component
const PlanSelection: React.FC<{
  condition: string;
  selectedPlan: string;
  onChange: (planId: string) => void;
}> = ({ condition, selectedPlan, onChange }) => {
  const plans = treatmentPlans[condition] || [];
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
        Choose Your Treatment Plan
      </h2>
      <p className="text-gray-600 text-center mb-8">
        Select the plan that best fits your needs and budget
      </p>
      
      <div className="flex gap-6 overflow-x-auto pb-4 px-4 max-w-full">
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => onChange(plan.id)}
            className={`relative rounded-2xl p-6 cursor-pointer transition-all min-w-[280px] max-w-[320px] flex-1 ${
              selectedPlan === plan.id
                ? 'bg-zappy-light-yellow border-2 border-zappy-pink shadow-xl transform scale-105'
                : 'bg-white border-2 border-gray-200 hover:border-zappy-pink hover:shadow-lg'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-zappy-pink text-white px-4 py-1 rounded-full text-sm font-bold">
                  Most Popular
                </span>
              </div>
            )}
            
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 mb-2">{plan.name}</h3>
              <div className="flex items-baseline justify-center">
                <span className="text-3xl font-bold text-zappy-pink">{plan.price}</span>
                <span className="text-gray-600 ml-1">{plan.duration}</span>
              </div>
              <p className="text-gray-600 text-sm mt-2">{plan.description}</p>
            </div>
            
            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            
            <div className="mt-6">
              <button
                className={`w-full py-3 rounded-full font-bold transition-all ${
                  selectedPlan === plan.id
                    ? 'bg-zappy-pink text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {selectedPlan === plan.id ? 'Selected ✓' : 'Select Plan'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Component
export default function HealthQuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get condition from query string
  const condition = searchParams?.get('condition') || 'weightLoss';
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [intakeForm, setIntakeForm] = useState<IntakeForm | null>(null);

  useEffect(() => {
    const form = getIntakeForm(condition);
    if (!form) {
      // Redirect to home if invalid condition
      router.push('/');
      return;
    }
    setIntakeForm(form);
  }, [condition, router]);

  const handleNext = useCallback(() => {
    if (!intakeForm) return;
    
    if (currentStep < intakeForm.totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Form complete - save and redirect
      const selectedPlanId = formData.selected_plan;
      const selectedPlan = treatmentPlans[condition]?.find(p => p.id === selectedPlanId);
      
      const consultationData = {
        condition,
        responses: formData,
        selectedPlan: selectedPlan ? {
          id: selectedPlan.id,
          name: selectedPlan.name,
          price: selectedPlan.price,
          tier: selectedPlanId
        } : null,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem(`${condition}_intake_responses`, JSON.stringify(consultationData));
      
      // TODO: Submit to backend API
      // await api.post('/consultations', consultationData);
      
      setCurrentStep(intakeForm.totalSteps + 1); // Show completion screen
    }
  }, [currentStep, formData, intakeForm, condition]);

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  }, []);

  const handleInputChange = useCallback((name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleCheckboxChange = useCallback((name: string, value: string) => {
    setFormData((prev) => {
      const currentValues = (prev[name] as string[]) || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      return { ...prev, [name]: newValues };
    });
  }, []);

  const renderStep = () => {
    if (!intakeForm) return null;

    // Completion screen
    if (currentStep > intakeForm.totalSteps) {
      return (
        <div className="w-full text-center animate-fade-in pt-8">
          <div className="mb-8">
            <div className="w-16 h-16 bg-zappy-light-yellow rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-zappy-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Thank You!</h2>
            <p className="text-gray-600">Your {intakeForm.name} has been submitted.</p>
          </div>
          
          <p className="text-lg text-gray-600 mb-8">
            A Zappy specialist will review your information and create your personalized treatment plan.
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

    const currentStepConfig = intakeForm.steps.find(s => s.stepNumber === currentStep);
    if (!currentStepConfig) return null;

    // Check if this is the plan selection step
    const isPlanSelectionStep = currentStepConfig.questions.some(q => q.id === 'selected_plan');
    
    if (isPlanSelectionStep) {
      return (
        <div className="w-full animate-fade-in">
          <PlanSelection
            condition={condition}
            selectedPlan={formData.selected_plan || ''}
            onChange={(planId) => handleInputChange('selected_plan', planId)}
          />
        </div>
      );
    }

    return (
      <div className="w-full animate-fade-in">
        <div className="space-y-6">
          {currentStepConfig.questions.map((question) => {
            const fieldValue = formData[question.id] || (question.type === 'multiselect' ? [] : '');
            
            if (question.type === 'select' || question.type === 'yesno') {
              return (
                <RadioGroup
                  key={question.id}
                  question={question}
                  value={fieldValue as string}
                  onChange={handleInputChange}
                />
              );
            } else if (question.type === 'multiselect') {
              return (
                <CheckboxGroup
                  key={question.id}
                  question={question}
                  value={fieldValue as string[]}
                  onChange={handleCheckboxChange}
                />
              );
            } else if (question.type === 'scale') {
              return (
                <ScaleGroup
                  key={question.id}
                  question={question}
                  value={fieldValue as string}
                  onChange={handleInputChange}
                />
              );
            } else {
              return (
                <InputField
                  key={question.id}
                  question={question}
                  value={fieldValue as string}
                  onChange={handleInputChange}
                />
              );
            }
          })}
        </div>
      </div>
    );
  };

  if (!intakeForm) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zappy-pink mx-auto mb-4"></div>
          <p className="text-gray-600">Loading consultation form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      {/* Progress Bar */}
      {currentStep <= intakeForm.totalSteps && (
        <div className="w-full max-w-2xl mx-auto px-4 pt-16 pb-8">
          <ProgressBar currentStep={currentStep} totalSteps={intakeForm.totalSteps} />
        </div>
      )}
      
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pb-12">
        {renderStep()}
        
        {currentStep <= intakeForm.totalSteps && (
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
              {currentStep === intakeForm.totalSteps ? 'Complete →' : 'Continue →'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
