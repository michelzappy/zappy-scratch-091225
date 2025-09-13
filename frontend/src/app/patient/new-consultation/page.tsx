'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface QuizData {
  condition: string;
  symptoms: string[];
  duration: string;
  severity: string;
  previousTreatments: string[];
  allergies: string[];
  medications: string[];
  medicalHistory: string[];
}

export default function NewConsultation() {
  const router = useRouter();
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [urgency, setUrgency] = useState('regular');
  const [preferredTime, setPreferredTime] = useState('');

  useEffect(() => {
    // Load quiz data from localStorage
    const savedQuizData = localStorage.getItem('healthQuizData');
    if (savedQuizData) {
      setQuizData(JSON.parse(savedQuizData));
    } else {
      // Redirect to quiz if no data exists
      router.push('/patient/health-quiz');
    }
  }, [router]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const consultation = {
      id: Date.now().toString(),
      quizData,
      additionalInfo,
      photos: photos.map(p => p.name),
      urgency,
      preferredTime,
      status: 'pending',
      createdAt: new Date().toISOString(),
      providerId: null,
      messages: []
    };

    // Save consultation
    const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
    consultations.push(consultation);
    localStorage.setItem('consultations', JSON.stringify(consultations));

    // Clear quiz data
    localStorage.removeItem('healthQuizData');

    // Redirect to dashboard
    router.push('/patient/dashboard?tab=consultations&status=submitted');
  };

  const conditionNames: Record<string, string> = {
    'hair-loss': 'Hair Loss',
    'ed': 'Erectile Dysfunction',
    'weight-loss': 'Weight Management',
    'skin': 'Skin Conditions',
    'mental-health': 'Mental Health'
  };

  if (!quizData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading consultation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-purple-600">
              TeleHealth
            </Link>
            <Link href="/patient/dashboard" className="text-gray-600 hover:text-gray-900">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Consultation Request</h1>
          <p className="text-lg text-gray-600 mt-2">
            We've received your health assessment. Just a few more details needed.
          </p>
        </div>

        {/* Quiz Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Health Assessment Summary</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Condition</h3>
              <p className="text-gray-900 bg-purple-50 px-3 py-2 rounded-lg inline-block">
                {conditionNames[quizData.condition] || quizData.condition}
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-2">Duration</h3>
              <p className="text-gray-900">{quizData.duration}</p>
            </div>

            <div className="md:col-span-2">
              <h3 className="font-medium text-gray-700 mb-2">Symptoms</h3>
              <div className="flex flex-wrap gap-2">
                {quizData.symptoms.map((symptom, index) => (
                  <span key={index} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                    {symptom}
                  </span>
                ))}
              </div>
            </div>

            {quizData.medications.length > 0 && (
              <div className="md:col-span-2">
                <h3 className="font-medium text-gray-700 mb-2">Current Medications</h3>
                <div className="flex flex-wrap gap-2">
                  {quizData.medications.map((med, index) => (
                    <span key={index} className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {med}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {quizData.allergies.length > 0 && (
              <div className="md:col-span-2">
                <h3 className="font-medium text-gray-700 mb-2">Allergies</h3>
                <div className="flex flex-wrap gap-2">
                  {quizData.allergies.map((allergy, index) => (
                    <span key={index} className="bg-red-50 text-red-800 px-3 py-1 rounded-full text-sm">
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link href="/patient/health-quiz" className="text-purple-600 hover:text-purple-700 text-sm mt-4 inline-block">
            Edit Assessment →
          </Link>
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Information</h2>
          
          {/* Photo Upload */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Upload Photos (Optional)
            </label>
            <p className="text-sm text-gray-600 mb-4">
              If applicable, upload photos to help providers better understand your condition
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="cursor-pointer">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-2 text-purple-600 font-medium">Click to upload photos</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB each</p>
              </label>
            </div>

            {photos.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={URL.createObjectURL(photo)} 
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Any other information you'd like to share with the provider..."
              className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
              rows={4}
            />
          </div>

          {/* Urgency Level */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              How urgent is your condition?
            </label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: 'regular', label: 'Regular', description: 'Response within 24 hours' },
                { value: 'urgent', label: 'Urgent', description: 'Response within 4 hours' },
                { value: 'emergency', label: 'Emergency', description: 'Immediate response needed' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setUrgency(option.value)}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    urgency === option.value
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-xs text-gray-600 mt-1">{option.description}</div>
                </button>
              ))}
            </div>
            {urgency === 'emergency' && (
              <div className="mt-2 p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ For life-threatening emergencies, please call 911 or visit your nearest emergency room.
                </p>
              </div>
            )}
          </div>

          {/* Preferred Contact Time */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Preferred Contact Time
            </label>
            <select
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
            >
              <option value="">Any time</option>
              <option value="morning">Morning (8 AM - 12 PM)</option>
              <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
              <option value="evening">Evening (5 PM - 9 PM)</option>
            </select>
          </div>
        </div>

        {/* Terms and Submit */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="mb-6">
            <label className="flex items-start">
              <input type="checkbox" className="mt-1 mr-3" required />
              <span className="text-sm text-gray-600">
                I understand that this consultation is not for emergency medical conditions. 
                I consent to share my health information with licensed healthcare providers 
                for the purpose of receiving medical advice and treatment.
              </span>
            </label>
          </div>

          <div className="flex gap-4">
            <Link 
              href="/patient/health-quiz"
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-full font-semibold hover:border-gray-400 transition-all"
            >
              ← Back to Assessment
            </Link>
            <button
              onClick={handleSubmit}
              className="flex-1 bg-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-purple-700 transition-all"
            >
              Submit Consultation Request
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            🔒 Your information is encrypted and HIPAA compliant
          </p>
        </div>
      </main>
    </div>
  );
}
