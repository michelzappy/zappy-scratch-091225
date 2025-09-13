'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { intakeForms, type IntakeQuestion, type IntakeForm, type IntakeSection } from '@/lib/intake-forms';

export default function HealthQuizPage() {
  const router = useRouter();
  const [selectedCondition, setSelectedCondition] = useState<string>('');
  const [currentForm, setCurrentForm] = useState<IntakeForm | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Available conditions with enhanced details
  const conditions = [
    { 
      id: 'weightLoss', 
      name: 'Weight Management & GLP-1', 
      icon: '⚖️', 
      description: 'Medical weight loss including Ozempic, Wegovy, and Mounjaro',
      estimatedTime: '8-10 minutes'
    },
    { 
      id: 'hairLoss', 
      name: 'Hair Loss & Restoration', 
      icon: '💇', 
      description: 'Prescription treatments for hair regrowth and prevention',
      estimatedTime: '6-8 minutes'
    },
    { 
      id: 'mensHealth', 
      name: 'Men\'s Health & ED', 
      icon: '👨‍⚕️', 
      description: 'Erectile dysfunction and men\'s wellness treatments',
      estimatedTime: '5-7 minutes'
    },
    { 
      id: 'womensHealth', 
      name: 'Women\'s Health', 
      icon: '👩‍⚕️', 
      description: 'Birth control, UTI treatment, and hormonal care',
      estimatedTime: '6-8 minutes'
    },
    { 
      id: 'trt', 
      name: 'Testosterone Therapy', 
      icon: '💪', 
      description: 'TRT for low testosterone symptoms',
      estimatedTime: '8-10 minutes'
    },
    { 
      id: 'longevity', 
      name: 'Longevity & Anti-Aging', 
      icon: '🧬', 
      description: 'Optimize healthspan with personalized protocols',
      estimatedTime: '7-10 minutes'
    }
  ];

  // Load the selected form
  useEffect(() => {
    if (selectedCondition && intakeForms[selectedCondition]) {
      setCurrentForm(intakeForms[selectedCondition]);
      setCurrentSectionIndex(0);
      setCurrentQuestionIndex(0);
    }
  }, [selectedCondition]);

  // Calculate progress
  const calculateProgress = () => {
    if (!currentForm) return 0;
    
    const totalSections = currentForm.sections.length;
    const totalQuestions = currentForm.sections.reduce((acc: number, section: IntakeSection) => 
      acc + section.questions.length, 0
    );
    
    let questionsAnswered = 0;
    for (let i = 0; i < currentSectionIndex; i++) {
      questionsAnswered += currentForm.sections[i].questions.length;
    }
    questionsAnswered += currentQuestionIndex;
    
    return (questionsAnswered / totalQuestions) * 100;
  };

  // Get current question
  const getCurrentQuestion = (): IntakeQuestion | null => {
    if (!currentForm) return null;
    const section = currentForm.sections[currentSectionIndex];
    if (!section) return null;
    return section.questions[currentQuestionIndex] || null;
  };

  // Check if question should be displayed based on skip logic
  const shouldShowQuestion = (question: IntakeQuestion): boolean => {
    if (!question.skipLogic) return true;
    
    const { field, value, action } = question.skipLogic;
    const fieldValue = responses[field];
    
    if (action === 'show') {
      return fieldValue === value || (Array.isArray(fieldValue) && fieldValue.includes(value));
    } else {
      return fieldValue !== value && !(Array.isArray(fieldValue) && fieldValue.includes(value));
    }
  };

  // Validate current question
  const validateQuestion = (question: IntakeQuestion): boolean => {
    const value = responses[question.id];
    
    if (question.required && !value) {
      setErrors({ ...errors, [question.id]: 'This field is required' });
      return false;
    }
    
    if (question.validation && value) {
      const { min, max, pattern, message } = question.validation;
      
      if (question.type === 'number') {
        const numValue = Number(value);
        if (min !== undefined && numValue < min) {
          setErrors({ ...errors, [question.id]: message || `Value must be at least ${min}` });
          return false;
        }
        if (max !== undefined && numValue > max) {
          setErrors({ ...errors, [question.id]: message || `Value must be less than ${max}` });
          return false;
        }
      }
      
      if (pattern && typeof value === 'string') {
        const regex = new RegExp(pattern);
        if (!regex.test(value)) {
          setErrors({ ...errors, [question.id]: message || 'Invalid format' });
          return false;
        }
      }
    }
    
    // Clear error if validation passes
    const newErrors = { ...errors };
    delete newErrors[question.id];
    setErrors(newErrors);
    
    return true;
  };

  // Handle next question/section
  const handleNext = () => {
    if (!currentForm) return;
    
    const currentQuestion = getCurrentQuestion();
    if (currentQuestion && currentQuestion.required && !validateQuestion(currentQuestion)) {
      return;
    }
    
    const section = currentForm.sections[currentSectionIndex];
    
    // Find next visible question in current section
    let nextQuestionIndex = currentQuestionIndex + 1;
    while (nextQuestionIndex < section.questions.length) {
      if (shouldShowQuestion(section.questions[nextQuestionIndex])) {
        setCurrentQuestionIndex(nextQuestionIndex);
        return;
      }
      nextQuestionIndex++;
    }
    
    // Move to next section
    if (currentSectionIndex < currentForm.sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      setCurrentQuestionIndex(0);
    } else {
      // Form complete - save and redirect
      localStorage.setItem('intakeFormResponses', JSON.stringify({
        condition: selectedCondition,
        responses,
        timestamp: new Date().toISOString()
      }));
      router.push('/patient/new-consultation');
    }
  };

  // Handle previous question/section
  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      const prevSection = currentForm!.sections[currentSectionIndex - 1];
      setCurrentQuestionIndex(prevSection.questions.length - 1);
    } else {
      // Go back to condition selection
      setSelectedCondition('');
      setCurrentForm(null);
      setResponses({});
      setErrors({});
    }
  };

  // Update response for current question
  const updateResponse = (questionId: string, value: any) => {
    setResponses({ ...responses, [questionId]: value });
    // Clear error when user starts typing
    if (errors[questionId]) {
      const newErrors = { ...errors };
      delete newErrors[questionId];
      setErrors(newErrors);
    }
  };

  // Render question based on type
  const renderQuestion = (question: IntakeQuestion) => {
    const value = responses[question.id] || '';
    const error = errors[question.id];
    
    switch (question.type) {
      case 'select':
        return (
          <div>
            <select
              value={value}
              onChange={(e) => updateResponse(question.id, e.target.value)}
              className={`w-full p-4 border-2 rounded-lg focus:outline-none focus:border-purple-600 ${
                error ? 'border-red-500' : 'border-gray-200'
              }`}
            >
              <option value="">Select an option...</option>
              {question.options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );
        
      case 'multiselect':
        return (
          <div className="space-y-3">
            {question.options?.map(option => (
              <label
                key={option}
                className="flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-purple-600 cursor-pointer transition-all"
              >
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      updateResponse(question.id, [...currentValues, option]);
                    } else {
                      updateResponse(question.id, currentValues.filter(v => v !== option));
                    }
                  }}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="ml-3 text-gray-900">{option}</span>
              </label>
            ))}
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );
        
      case 'text':
      case 'textarea':
        return (
          <div>
            {question.type === 'textarea' ? (
              <textarea
                value={value}
                onChange={(e) => updateResponse(question.id, e.target.value)}
                placeholder={question.placeholder}
                className={`w-full p-4 border-2 rounded-lg focus:outline-none focus:border-purple-600 h-32 ${
                  error ? 'border-red-500' : 'border-gray-200'
                }`}
              />
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => updateResponse(question.id, e.target.value)}
                placeholder={question.placeholder}
                className={`w-full p-4 border-2 rounded-lg focus:outline-none focus:border-purple-600 ${
                  error ? 'border-red-500' : 'border-gray-200'
                }`}
              />
            )}
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );
        
      case 'number':
        return (
          <div>
            <input
              type="number"
              value={value}
              onChange={(e) => updateResponse(question.id, e.target.value)}
              placeholder={question.placeholder}
              min={question.validation?.min}
              max={question.validation?.max}
              className={`w-full p-4 border-2 rounded-lg focus:outline-none focus:border-purple-600 ${
                error ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );
        
      case 'yesno':
        return (
          <div className="flex gap-4">
            {['Yes', 'No'].map(option => (
              <button
                key={option}
                onClick={() => updateResponse(question.id, option === 'Yes')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  value === (option === 'Yes')
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-600'
                }`}
              >
                {option}
              </button>
            ))}
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );
        
      case 'scale':
        return (
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-500">Low</span>
              <span className="text-sm text-gray-500">High</span>
            </div>
            <div className="grid grid-cols-10 gap-2">
              {question.options?.map(option => (
                <button
                  key={option}
                  onClick={() => updateResponse(question.id, option)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    value === option
                      ? 'border-purple-600 bg-purple-600 text-white'
                      : 'border-gray-200 hover:border-purple-600'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );
        
      case 'date':
        return (
          <div>
            <input
              type="date"
              value={value}
              onChange={(e) => updateResponse(question.id, e.target.value)}
              className={`w-full p-4 border-2 rounded-lg focus:outline-none focus:border-purple-600 ${
                error ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );
        
      case 'height':
        return (
          <div className="flex gap-4">
            <input
              type="number"
              placeholder="Feet"
              value={value.feet || ''}
              onChange={(e) => updateResponse(question.id, { ...value, feet: e.target.value })}
              className={`flex-1 p-4 border-2 rounded-lg focus:outline-none focus:border-purple-600 ${
                error ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            <input
              type="number"
              placeholder="Inches"
              value={value.inches || ''}
              onChange={(e) => updateResponse(question.id, { ...value, inches: e.target.value })}
              className={`flex-1 p-4 border-2 rounded-lg focus:outline-none focus:border-purple-600 ${
                error ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );
        
      case 'blood_pressure':
        return (
          <div className="flex gap-4">
            <input
              type="number"
              placeholder="Systolic (top number)"
              value={value.systolic || ''}
              onChange={(e) => updateResponse(question.id, { ...value, systolic: e.target.value })}
              className={`flex-1 p-4 border-2 rounded-lg focus:outline-none focus:border-purple-600 ${
                error ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            <span className="self-center text-gray-500">/</span>
            <input
              type="number"
              placeholder="Diastolic (bottom number)"
              value={value.diastolic || ''}
              onChange={(e) => updateResponse(question.id, { ...value, diastolic: e.target.value })}
              className={`flex-1 p-4 border-2 rounded-lg focus:outline-none focus:border-purple-600 ${
                error ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-purple-600">
              TeleHealth
            </Link>
            {currentForm && (
              <span className="text-sm text-gray-600">
                {currentForm.estimatedTime} • {Math.round(calculateProgress())}% complete
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      {currentForm && (
        <div className="bg-white border-b">
          <div className="container mx-auto px-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-600 transition-all duration-300"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          
          {/* Condition Selection */}
          {!selectedCondition && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                What brings you here today?
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Select a condition to begin your medical assessment
              </p>
              
              <div className="grid gap-4">
                {conditions.map(condition => (
                  <button
                    key={condition.id}
                    onClick={() => setSelectedCondition(condition.id)}
                    className="p-6 rounded-xl border-2 text-left transition-all hover:border-purple-600 hover:shadow-md border-gray-200 group"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">{condition.icon}</span>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                          {condition.name}
                        </h3>
                        <p className="text-gray-600 mb-2">
                          {condition.description}
                        </p>
                        <p className="text-sm text-purple-600 font-medium">
                          ⏱ {condition.estimatedTime}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Intake Form Questions */}
          {currentForm && getCurrentQuestion() && (
            <div>
              {/* Section Title */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentForm.sections[currentSectionIndex].title}
                </h2>
                {currentForm.sections[currentSectionIndex].subtitle && (
                  <p className="text-gray-600 mt-2">
                    {currentForm.sections[currentSectionIndex].subtitle}
                  </p>
                )}
              </div>
              
              {/* Current Question */}
              <div className="mb-8">
                <label className="block text-lg font-medium text-gray-900 mb-4">
                  {getCurrentQuestion()!.question}
                  {getCurrentQuestion()!.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                
                {getCurrentQuestion()!.helpText && (
                  <p className="text-sm text-gray-500 mb-4">
                    {getCurrentQuestion()!.helpText}
                  </p>
                )}
                
                {renderQuestion(getCurrentQuestion()!)}
              </div>
              
              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  ← Back
                </button>
                
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 transition-all"
                >
                  {currentSectionIndex === currentForm.sections.length - 1 && 
                   currentQuestionIndex === currentForm.sections[currentSectionIndex].questions.length - 1
                    ? 'Complete Assessment →'
                    : 'Continue →'}
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Security & Disclaimers */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-500">
            🔒 Your information is secure and HIPAA compliant
          </p>
          {currentForm?.disclaimers && currentForm.disclaimers.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
              <p className="text-xs text-yellow-800">
                {currentForm.disclaimers.join(' • ')}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
