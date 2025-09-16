'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/Card';

type UserRole = 'provider' | 'admin' | 'provider-admin' | 'super-admin';

interface ProgressMarker {
  date: string;
  weight?: number;
  bloodPressure?: string;
  photoUrls?: string[];
  notes?: string;
}

interface CheckIn {
  id: string;
  patientId: string;
  patientName: string;
  submittedAt: string;
  type: 'monthly' | 'quarterly' | 'symptom-update';
  status: 'pending' | 'in-review' | 'completed';
  
  // Interval History
  intervalHistory: {
    chiefComplaint: string;
    symptomChanges: string;
    sideEffects: string[];
    adherence: string; // percentage or description
    lifestyleChanges: string;
    newMedicalConditions: string;
    hospitalizations: string;
  };
  
  // Progress Markers
  progressMarkers: ProgressMarker[];
  currentWeight: number;
  weightChange: number;
  photoComparison?: {
    before: string;
    current: string;
  };
  
  // Current Medications
  currentMedications: {
    name: string;
    dose: string;
    frequency: string;
    startDate: string;
    effectiveness: 'excellent' | 'good' | 'moderate' | 'poor';
  }[];
  
  // Assessment & Plan
  assessment: string;
  plan: string;
  
  // Recommendation
  recommendation: 'continue' | 'increase' | 'decrease' | 'switch' | 'discontinue';
  recommendedDose?: string;
  alternativeMedication?: string;
}

export default function CheckInDetailPage() {
  const params = useParams();
  const router = useRouter();
  const checkInId = params.id;
  
  const [userRole, setUserRole] = useState<UserRole>('provider');
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [messageToPatient, setMessageToPatient] = useState('');
  const [recommendation, setRecommendation] = useState<'continue' | 'increase' | 'decrease' | 'switch' | 'discontinue'>('continue');
  const [newDose, setNewDose] = useState('');
  const [alternativeMed, setAlternativeMed] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole') as UserRole;
    
    if (!token) {
      router.push('/portal/login');
      return;
    }
    
    if (role) {
      setUserRole(role);
      if (role === 'admin') {
        // Regular admins might not have access
        router.push('/portal/dashboard');
        return;
      }
    }

    fetchCheckInDetails();
  }, [router]);

  const fetchCheckInDetails = async () => {
    // Mock data
    const mockCheckIn: CheckIn = {
      id: checkInId as string,
      patientId: '123',
      patientName: 'Sarah Johnson',
      submittedAt: '2024-01-15T09:00:00',
      type: 'monthly',
      status: 'pending',
      
      intervalHistory: {
        chiefComplaint: 'Acne improving but still having occasional breakouts',
        symptomChanges: 'Significant improvement in forehead acne, but still getting cystic acne on chin area',
        sideEffects: ['Mild dryness', 'Initial purging resolved'],
        adherence: '95% - Missed only 2 days this month',
        lifestyleChanges: 'Started new skincare routine, reduced dairy intake',
        newMedicalConditions: 'None',
        hospitalizations: 'None'
      },
      
      progressMarkers: [
        {
          date: '2023-11-15',
          weight: 145,
          photoUrls: ['before1.jpg', 'before2.jpg'],
          notes: 'Baseline - severe cystic acne'
        },
        {
          date: '2023-12-15',
          weight: 143,
          photoUrls: ['progress1.jpg', 'progress2.jpg'],
          notes: 'Initial improvement, purging phase'
        },
        {
          date: '2024-01-15',
          weight: 142,
          photoUrls: ['current1.jpg', 'current2.jpg'],
          notes: 'Significant clearing on forehead'
        }
      ],
      
      currentWeight: 142,
      weightChange: -3,
      
      photoComparison: {
        before: 'before_photo.jpg',
        current: 'current_photo.jpg'
      },
      
      currentMedications: [
        {
          name: 'Tretinoin',
          dose: '0.025%',
          frequency: 'Once daily at bedtime',
          startDate: '2023-11-15',
          effectiveness: 'good'
        },
        {
          name: 'Doxycycline',
          dose: '100mg',
          frequency: 'Twice daily',
          startDate: '2023-11-15',
          effectiveness: 'moderate'
        }
      ],
      
      assessment: '',
      plan: '',
      recommendation: 'continue'
    };
    
    setCheckIn(mockCheckIn);
    setAssessment('Patient showing good response to current treatment regimen. Forehead acne has cleared significantly. Chin area still showing some cystic lesions but improving.');
    setPlan('Continue current medications for another month. Consider increasing tretinoin to 0.05% if plateau in improvement.');
    setLoading(false);
  };

  const handleSaveAndComplete = () => {
    // Save the assessment and complete the check-in
    if (checkIn) {
      const updatedCheckIn = {
        ...checkIn,
        assessment,
        plan,
        recommendation,
        recommendedDose: newDose,
        alternativeMedication: alternativeMed,
        status: 'completed' as const
      };
      setCheckIn(updatedCheckIn);
      alert('Check-in completed successfully!');
      router.push('/portal/checkin-reviews');
    }
  };

  const getEffectivenessColor = (effectiveness: string) => {
    switch (effectiveness) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'poor': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading || !checkIn) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/portal/checkin-reviews')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {checkIn.type.charAt(0).toUpperCase() + checkIn.type.slice(1).replace('-', ' ')} Check-in Review
              </h1>
              <p className="text-gray-600 mt-1">
                {checkIn.patientName} • Submitted {new Date(checkIn.submittedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => router.push(`/portal/patient/${checkIn.patientId}`)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            View Patient Profile
          </button>
        </div>
      </div>

      {/* Interval History */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Interval History</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Chief Complaint</p>
            <p className="mt-1 text-gray-900">{checkIn.intervalHistory.chiefComplaint}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-700">Symptom Changes</p>
            <p className="mt-1 text-gray-900">{checkIn.intervalHistory.symptomChanges}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Side Effects</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {checkIn.intervalHistory.sideEffects.map((effect, idx) => (
                  <span key={idx} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded">
                    {effect}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700">Medication Adherence</p>
              <p className="mt-1 text-gray-900">{checkIn.intervalHistory.adherence}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-700">Lifestyle Changes</p>
            <p className="mt-1 text-gray-900">{checkIn.intervalHistory.lifestyleChanges}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">New Medical Conditions</p>
              <p className="mt-1 text-gray-900">{checkIn.intervalHistory.newMedicalConditions}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Hospitalizations</p>
              <p className="mt-1 text-gray-900">{checkIn.intervalHistory.hospitalizations}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Progress Markers */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Progress Markers</h2>
        
        {/* Weight Trend */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">Weight Trend</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">{checkIn.currentWeight} lbs</span>
              <span className={`text-sm font-medium ${checkIn.weightChange < 0 ? 'text-green-600' : checkIn.weightChange > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                ({checkIn.weightChange > 0 ? '+' : ''}{checkIn.weightChange} lbs)
              </span>
            </div>
          </div>
          
          {/* Progress Timeline */}
          <div className="space-y-3">
            {checkIn.progressMarkers.map((marker, idx) => (
              <div key={idx} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium">{idx + 1}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(marker.date).toLocaleDateString()}
                    </p>
                    {marker.weight && (
                      <p className="text-sm text-gray-600">{marker.weight} lbs</p>
                    )}
                  </div>
                  {marker.notes && (
                    <p className="text-sm text-gray-600 mt-1">{marker.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Photo Comparison */}
        {checkIn.photoComparison && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Photo Comparison</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-2">Before</p>
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">Photo Placeholder</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Current</p>
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">Photo Placeholder</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Current Medications */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Medications</h2>
        <div className="space-y-3">
          {checkIn.currentMedications.map((med, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{med.name} - {med.dose}</p>
                <p className="text-sm text-gray-600">{med.frequency}</p>
                <p className="text-xs text-gray-500">Started: {med.startDate}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Effectiveness</p>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getEffectivenessColor(med.effectiveness)}`}>
                  {med.effectiveness}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Assessment & Plan */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Assessment & Plan</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assessment
            </label>
            <textarea
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder="Enter your assessment of the patient's progress..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plan
            </label>
            <textarea
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder="Enter your treatment plan..."
            />
          </div>
        </div>
      </Card>

      {/* Message to Patient */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Message to Patient</h2>
        <textarea
          value={messageToPatient}
          onChange={(e) => setMessageToPatient(e.target.value)}
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
          placeholder="Enter a message for the patient about their progress and next steps..."
        />
      </Card>

      {/* Order Section - Medication Adjustment */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Medication Orders</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recommendation
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {['continue', 'increase', 'decrease', 'switch', 'discontinue'].map((option) => (
                <button
                  key={option}
                  onClick={() => setRecommendation(option as any)}
                  className={`px-4 py-2 rounded-lg capitalize transition ${
                    recommendation === option
                      ? 'bg-gray-900 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {(recommendation === 'increase' || recommendation === 'decrease') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Dose
              </label>
              <input
                type="text"
                value={newDose}
                onChange={(e) => setNewDose(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                placeholder="Enter new dose..."
              />
            </div>
          )}

          {recommendation === 'switch' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alternative Medication
              </label>
              <input
                type="text"
                value={alternativeMed}
                onChange={(e) => setAlternativeMed(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                placeholder="Enter alternative medication and dose..."
              />
            </div>
          )}

          {/* Quick Templates */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Quick Templates</p>
            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200">
                Continue current regimen
              </button>
              <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200">
                Increase tretinoin to 0.05%
              </button>
              <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200">
                Add benzoyl peroxide
              </button>
              <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200">
                Switch to isotretinoin
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center bg-white border-t border-gray-200 px-6 py-4 sticky bottom-0">
        <button
          onClick={() => router.push('/portal/checkin-reviews')}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Save Draft
        </button>
        <div className="flex space-x-3">
          <button
            onClick={() => alert('Request more information from patient')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Request More Info
          </button>
          <button
            onClick={handleSaveAndComplete}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
          >
            Complete Review
          </button>
        </div>
      </div>
    </div>
  );
}
