'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface QuizData {
  condition: string;
  symptoms: string[];
  duration: string;
  severity: string;
  previousTreatments: string[];
  allergies: string[];
  medications: string[];
  medicalHistory: string[];
  lifestyle: {
    smoking: boolean;
    alcohol: string;
    exercise: string;
  };
}

export default function HealthQuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [quizData, setQuizData] = useState<QuizData>({
    condition: '',
    symptoms: [],
    duration: '',
    severity: '',
    previousTreatments: [],
    allergies: [],
    medications: [],
    medicalHistory: [],
    lifestyle: {
      smoking: false,
      alcohol: 'none',
      exercise: 'none'
    }
  });

  const conditions = [
    { id: 'hair-loss', name: 'Hair Loss', icon: '💊', description: 'Thinning hair or balding' },
    { id: 'ed', name: 'Erectile Dysfunction', icon: '🔵', description: 'Difficulty with erections' },
    { id: 'weight-loss', name: 'Weight Management', icon: '⚖️', description: 'Weight loss solutions' },
    { id: 'skin', name: 'Skin Conditions', icon: '✨', description: 'Acne, aging, or other skin issues' },
    { id: 'mental-health', name: 'Mental Health', icon: '🧠', description: 'Anxiety or depression' }
  ];

  const symptomsByCondition: Record<string, string[]> = {
    'hair-loss': [
      'Gradual thinning on top of head',
      'Circular or patchy bald spots',
      'Sudden loosening of hair',
      'Full-body hair loss',
      'Patches of scaling'
    ],
    'ed': [
      'Trouble getting an erection',
      'Trouble keeping an erection',
      'Reduced sexual desire',
      'Premature ejaculation',
      'Delayed ejaculation'
    ],
    'weight-loss': [
      'Difficulty losing weight',
      'Constant hunger',
      'Low energy',
      'Slow metabolism',
      'Emotional eating'
    ],
    'skin': [
      'Acne breakouts',
      'Dark spots',
      'Fine lines and wrinkles',
      'Uneven skin tone',
      'Dry or oily skin'
    ],
    'mental-health': [
      'Persistent sadness',
      'Loss of interest',
      'Anxiety or worry',
      'Difficulty sleeping',
      'Difficulty concentrating'
    ]
  };

  const handleNext = () => {
    if (step < 7) {
      setStep(step + 1);
    } else {
      // Save quiz data and redirect to consultation
      localStorage.setItem('healthQuizData', JSON.stringify(quizData));
      router.push('/patient/new-consultation');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const updateQuizData = (field: keyof QuizData, value: any) => {
    setQuizData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const progressPercentage = (step / 7) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-purple-600">
              TeleHealth
            </Link>
            <span className="text-sm text-gray-600">
              Step {step} of 7
            </span>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-600 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quiz Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          {/* Step 1: Condition Selection */}
          {step === 1 && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                What brings you here today?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Select the condition you'd like to address
              </p>
              <div className="grid gap-4">
                {conditions.map(condition => (
                  <button
                    key={condition.id}
                    onClick={() => {
                      updateQuizData('condition', condition.id);
                      handleNext();
                    }}
                    className={`p-6 rounded-xl border-2 text-left transition-all hover:border-purple-600 hover:shadow-md ${
                      quizData.condition === condition.id 
                        ? 'border-purple-600 bg-purple-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">{condition.icon}</span>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {condition.name}
                        </h3>
                        <p className="text-gray-600">
                          {condition.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Symptoms */}
          {step === 2 && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                What symptoms are you experiencing?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Select all that apply
              </p>
              <div className="space-y-3">
                {symptomsByCondition[quizData.condition]?.map(symptom => (
                  <label
                    key={symptom}
                    className="flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-purple-600 cursor-pointer transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={quizData.symptoms.includes(symptom)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateQuizData('symptoms', [...quizData.symptoms, symptom]);
                        } else {
                          updateQuizData('symptoms', quizData.symptoms.filter(s => s !== symptom));
                        }
                      }}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="ml-3 text-gray-900">{symptom}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Duration */}
          {step === 3 && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                How long have you been experiencing this?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                This helps us understand your condition better
              </p>
              <div className="grid gap-4">
                {[
                  'Less than 1 month',
                  '1-3 months',
                  '3-6 months',
                  '6-12 months',
                  'More than 1 year'
                ].map(duration => (
                  <button
                    key={duration}
                    onClick={() => {
                      updateQuizData('duration', duration);
                      handleNext();
                    }}
                    className={`p-4 rounded-lg border-2 text-left transition-all hover:border-purple-600 ${
                      quizData.duration === duration 
                        ? 'border-purple-600 bg-purple-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    <span className="text-gray-900 font-medium">{duration}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Previous Treatments */}
          {step === 4 && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Have you tried any treatments before?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Select all that apply
              </p>
              <div className="space-y-3">
                {[
                  'Over-the-counter medications',
                  'Prescription medications',
                  'Natural remedies',
                  'Lifestyle changes',
                  'No previous treatments'
                ].map(treatment => (
                  <label
                    key={treatment}
                    className="flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-purple-600 cursor-pointer transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={quizData.previousTreatments.includes(treatment)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateQuizData('previousTreatments', [...quizData.previousTreatments, treatment]);
                        } else {
                          updateQuizData('previousTreatments', quizData.previousTreatments.filter(t => t !== treatment));
                        }
                      }}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="ml-3 text-gray-900">{treatment}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Allergies */}
          {step === 5 && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Do you have any allergies?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                This is important for prescribing safe medications
              </p>
              <div className="space-y-3">
                {[
                  'No known allergies',
                  'Penicillin',
                  'Sulfa drugs',
                  'Aspirin/NSAIDs',
                  'Latex',
                  'Other medications'
                ].map(allergy => (
                  <label
                    key={allergy}
                    className="flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-purple-600 cursor-pointer transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={quizData.allergies.includes(allergy)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (allergy === 'No known allergies') {
                            updateQuizData('allergies', [allergy]);
                          } else {
                            updateQuizData('allergies', [...quizData.allergies.filter(a => a !== 'No known allergies'), allergy]);
                          }
                        } else {
                          updateQuizData('allergies', quizData.allergies.filter(a => a !== allergy));
                        }
                      }}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="ml-3 text-gray-900">{allergy}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Current Medications */}
          {step === 6 && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Are you currently taking any medications?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Include prescription, over-the-counter, and supplements
              </p>
              <textarea
                placeholder="List your current medications, one per line..."
                value={quizData.medications.join('\n')}
                onChange={(e) => {
                  const meds = e.target.value.split('\n').filter(m => m.trim());
                  updateQuizData('medications', meds);
                }}
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none h-32"
              />
              <p className="text-sm text-gray-500 mt-2">
                If none, you can leave this blank
              </p>
            </div>
          )}

          {/* Step 7: Medical History */}
          {step === 7 && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Do you have any of these conditions?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Select all that apply
              </p>
              <div className="space-y-3">
                {[
                  'None of these',
                  'High blood pressure',
                  'Diabetes',
                  'Heart disease',
                  'Kidney disease',
                  'Liver disease',
                  'Thyroid disorder',
                  'Mental health conditions'
                ].map(condition => (
                  <label
                    key={condition}
                    className="flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-purple-600 cursor-pointer transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={quizData.medicalHistory.includes(condition)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (condition === 'None of these') {
                            updateQuizData('medicalHistory', [condition]);
                          } else {
                            updateQuizData('medicalHistory', [...quizData.medicalHistory.filter(c => c !== 'None of these'), condition]);
                          }
                        } else {
                          updateQuizData('medicalHistory', quizData.medicalHistory.filter(c => c !== condition));
                        }
                      }}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="ml-3 text-gray-900">{condition}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium"
              >
                ← Back
              </button>
            )}
            <div className="ml-auto">
              {step < 7 ? (
                <button
                  onClick={handleNext}
                  disabled={
                    (step === 2 && quizData.symptoms.length === 0) ||
                    (step === 5 && quizData.allergies.length === 0) ||
                    (step === 7 && quizData.medicalHistory.length === 0)
                  }
                  className="px-8 py-3 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Continue →
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 transition-all"
                >
                  Complete Assessment →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            🔒 Your information is secure and HIPAA compliant
          </p>
        </div>
      </main>
    </div>
  );
}
