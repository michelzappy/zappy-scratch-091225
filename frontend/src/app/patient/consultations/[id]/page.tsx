'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ConsultationDetails() {
  const params = useParams();
  const router = useRouter();
  const consultationId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [consultation, setConsultation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConsultation = async () => {
      try {
        setLoading(true);
        // Try to fetch from API first
        try {
          const data = await api.get<any>(`/consultations/${consultationId}`);
          if (data) {
            setConsultation(data);
          } else {
            throw new Error('No data received');
          }
        } catch (apiError: any) {
          // Fallback to mock data for demo purposes
          const mockConsultation = getMockConsultation(consultationId);
          if (mockConsultation) {
            setConsultation(mockConsultation);
          } else {
            setError('Consultation not found');
          }
        }
      } catch (err: any) {
        setError(err?.error || err?.message || 'Failed to load consultation');
      } finally {
        setLoading(false);
      }
    };

    if (consultationId) {
      fetchConsultation();
    }
  }, [consultationId]);

  // Mock data function
  const getMockConsultation = (id: string) => {
    const mockData: Record<string, any> = {
      '1': {
        id: '1',
        type: 'Initial Consultation',
        program_name: 'Acne Treatment Program',
        status: 'completed',
        created_at: new Date('2024-01-15'),
        completed_at: new Date('2024-01-17'),
        patient_info: {
          name: 'Patient',
          age: 28,
          gender: 'Female'
        },
        chief_complaint: 'Moderate acne on face and back',
        medical_history: [
          'No known allergies',
          'Previous use of benzoyl peroxide with minimal improvement'
        ],
        current_medications: [],
        assessment: {
          diagnosis: 'Moderate inflammatory acne',
          severity: 'Moderate',
          affected_areas: ['Face', 'Back']
        },
        treatment_plan: {
          medications: [
            {
              name: 'Tretinoin',
              dosage: '0.05% cream',
              frequency: 'Once daily at bedtime',
              duration: '12 weeks',
              instructions: 'Apply a pea-sized amount to clean, dry skin. Start with every other night for first 2 weeks.'
            },
            {
              name: 'Doxycycline',
              dosage: '100mg tablets',
              frequency: 'Twice daily with food',
              duration: '12 weeks',
              instructions: 'Take with a full glass of water. Avoid lying down for 30 minutes after taking.'
            }
          ],
          lifestyle_recommendations: [
            'Use a gentle, non-comedogenic cleanser twice daily',
            'Apply oil-free moisturizer with SPF 30+ daily',
            'Avoid picking or squeezing acne lesions',
            'Consider dietary modifications (reduce dairy and high-glycemic foods)'
          ],
          follow_up: '4 weeks'
        },
      },
      '2': {
        id: '2',
        type: 'Follow-up',
        program_name: 'Acne Treatment Program',
        status: 'submitted',
        created_at: new Date('2024-01-20'),
        patient_info: {
          name: 'Patient',
          age: 28,
          gender: 'Female'
        },
        chief_complaint: 'Follow-up for acne treatment',
        notes: 'Patient reports improvement in acne lesions. Experiencing mild dryness from tretinoin.',
        current_progress: {
          improvement_level: 'Moderate',
          side_effects: ['Mild dryness', 'Occasional peeling'],
          adherence: 'Good - using medications as prescribed'
        },
        recommendations: 'Continue current treatment. Add moisturizer for dryness. Will review in 2 weeks.'
      },
      '3': {
        id: '3',
        type: 'Refill Check-in',
        program_name: 'Acne Treatment Program',
        status: 'submitted',
        created_at: new Date('2024-01-22'),
        patient_info: {
          name: 'Patient',
          age: 28,
          gender: 'Female'
        },
        refill_request: {
          medications: ['Tretinoin 0.05% cream', 'Doxycycline 100mg'],
          reason: 'Routine refill'
        },
        current_status: 'Medications are working well. Need refill for continued treatment.',
        last_refill_date: new Date('2023-12-22')
      },
      '123': {
        id: '123',
        type: 'Initial Consultation',
        program_name: 'Acne Treatment Program',
        status: 'completed',
        created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        completed_at: new Date(Date.now() - 43 * 24 * 60 * 60 * 1000),
        patient_info: {
          name: 'Patient',
          age: 28,
          gender: 'Female'
        },
        chief_complaint: 'Moderate acne on face and back',
        medical_history: [
          'No known allergies',
          'Previous use of benzoyl peroxide with minimal improvement'
        ],
        current_medications: [],
        assessment: {
          diagnosis: 'Moderate inflammatory acne',
          severity: 'Moderate',
          affected_areas: ['Face', 'Back']
        },
        treatment_plan: {
          medications: [
            {
              name: 'Tretinoin',
              dosage: '0.05% cream',
              frequency: 'Once daily at bedtime',
              duration: '12 weeks',
              instructions: 'Apply a pea-sized amount to clean, dry skin. Start with every other night for first 2 weeks.'
            },
            {
              name: 'Doxycycline',
              dosage: '100mg tablets',
              frequency: 'Twice daily with food',
              duration: '12 weeks',
              instructions: 'Take with a full glass of water. Avoid lying down for 30 minutes after taking.'
            }
          ],
          lifestyle_recommendations: [
            'Use a gentle, non-comedogenic cleanser twice daily',
            'Apply oil-free moisturizer with SPF 30+ daily',
            'Avoid picking or squeezing acne lesions',
            'Consider dietary modifications (reduce dairy and high-glycemic foods)'
          ],
          follow_up: '4 weeks'
        },
        prescriptions: [
          {
            id: 'rx-123-1',
            medication: 'Tretinoin 0.05% cream',
            quantity: '1 tube (30g)',
            refills: 3,
            status: 'active'
          },
          {
            id: 'rx-123-2',
            medication: 'Doxycycline 100mg',
            quantity: '180 tablets',
            refills: 2,
            status: 'active'
          }
        ],
        provider_info: {
          name: 'Dr. Sarah Johnson',
          credentials: 'MD',
          specialty: 'Dermatology'
        }
      },
      '124': {
        id: '124',
        type: 'Initial Consultation',
        program_name: 'Weight Management Program',
        status: 'completed',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        completed_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
        patient_info: {
          name: 'Patient',
          age: 35,
          gender: 'Male'
        },
        chief_complaint: 'Weight loss management',
        medical_history: [
          'BMI: 32',
          'Pre-diabetes',
          'Hypertension - controlled'
        ],
        current_medications: ['Lisinopril 10mg daily'],
        assessment: {
          diagnosis: 'Obesity class I',
          current_weight: '220 lbs',
          target_weight: '180 lbs',
          bmi: 32
        },
        treatment_plan: {
          medications: [
            {
              name: 'Semaglutide',
              dosage: '0.5mg weekly',
              frequency: 'Once weekly subcutaneous injection',
              duration: 'Ongoing with reassessment every 3 months',
              instructions: 'Inject on the same day each week. Can be taken with or without food.'
            }
          ],
          lifestyle_recommendations: [
            'Follow provided meal plan focusing on protein and vegetables',
            'Aim for 150 minutes of moderate exercise per week',
            'Track daily caloric intake using app',
            'Stay hydrated with at least 64oz of water daily'
          ],
          follow_up: '4 weeks'
        },
        prescriptions: [
          {
            id: 'rx-124-1',
            medication: 'Semaglutide 0.5mg',
            quantity: '12 weekly doses',
            refills: 5,
            status: 'active'
          }
        ],
        provider_info: {
          name: 'Dr. Michael Chen',
          credentials: 'MD',
          specialty: 'Internal Medicine'
        }
      }
    };

    return mockData[id] || null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading consultation details...</p>
        </div>
      </div>
    );
  }

  if (error || !consultation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Consultation not found'}</p>
          <Link 
            href="/patient/dashboard" 
            className="px-4 py-2 bg-medical-600 text-white rounded-lg hover:bg-medical-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Consultation Details</h1>
        <Link 
          href="/patient/dashboard" 
          className="text-medical-600 hover:text-medical-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      {/* Consultation Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{consultation.program_name}</h2>
              <p className="text-gray-600 mt-1">{consultation.type}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              consultation.status === 'completed' 
                ? 'bg-green-100 text-green-800'
                : consultation.status === 'in_progress'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {consultation.status.replace('_', ' ').charAt(0).toUpperCase() + consultation.status.slice(1)}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Consultation Date</p>
              <p className="font-medium">{new Date(consultation.created_at).toLocaleDateString()}</p>
            </div>
            {consultation.completed_at && (
              <div>
                <p className="text-gray-500">Completed Date</p>
                <p className="font-medium">{new Date(consultation.completed_at).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Provider Info */}
        {consultation.provider_info && (
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Provider Information</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-medical-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-medical-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">{consultation.provider_info.name}, {consultation.provider_info.credentials}</p>
                <p className="text-sm text-gray-600">{consultation.provider_info.specialty}</p>
              </div>
            </div>
          </div>
        )}

        {/* Chief Complaint & Assessment - For Initial Consultation */}
        {consultation.type === 'Initial Consultation' && (
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Clinical Summary</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Chief Complaint</p>
                <p className="text-gray-900">{consultation.chief_complaint}</p>
              </div>
              {consultation.assessment && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Assessment</p>
                  <p className="text-gray-900">{consultation.assessment.diagnosis}</p>
                  {consultation.assessment.severity && (
                    <p className="text-sm text-gray-600 mt-1">Severity: {consultation.assessment.severity}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Follow-up Summary */}
        {consultation.type === 'Follow-up' && (
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Follow-up Summary</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Reason for Follow-up</p>
                <p className="text-gray-900">{consultation.chief_complaint}</p>
              </div>
              {consultation.notes && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Provider Notes</p>
                  <p className="text-gray-900">{consultation.notes}</p>
                </div>
              )}
              {consultation.current_progress && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Current Progress</p>
                  <div className="space-y-2">
                    <p className="text-gray-900">Improvement: {consultation.current_progress.improvement_level}</p>
                    <p className="text-gray-900">Adherence: {consultation.current_progress.adherence}</p>
                    {consultation.current_progress.side_effects && consultation.current_progress.side_effects.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600">Side Effects:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {consultation.current_progress.side_effects.map((effect: string, index: number) => (
                            <li key={index}>{effect}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {consultation.recommendations && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Recommendations</p>
                  <p className="text-gray-900">{consultation.recommendations}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Refill Check-in Summary */}
        {consultation.type === 'Refill Check-in' && (
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Refill Check-in Summary</h3>
            <div className="space-y-4">
              {consultation.refill_request && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Medications Requested</p>
                  <ul className="list-disc list-inside">
                    {consultation.refill_request.medications.map((med: string, index: number) => (
                      <li key={index} className="text-gray-900">{med}</li>
                    ))}
                  </ul>
                  {consultation.refill_request.reason && (
                    <p className="text-sm text-gray-600 mt-2">Reason: {consultation.refill_request.reason}</p>
                  )}
                </div>
              )}
              {consultation.current_status && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Current Status</p>
                  <p className="text-gray-900">{consultation.current_status}</p>
                </div>
              )}
              {consultation.last_refill_date && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Last Refill Date</p>
                  <p className="text-gray-900">{new Date(consultation.last_refill_date).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Treatment Plan */}
        {consultation.treatment_plan && (
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Treatment Plan</h3>
            
            {/* Medications */}
            {consultation.treatment_plan.medications && consultation.treatment_plan.medications.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Prescribed Medications</h4>
                <div className="space-y-3">
                  {consultation.treatment_plan.medications.map((med: any, index: number) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{med.name}</p>
                          <p className="text-sm text-gray-600 mt-1">{med.dosage} • {med.frequency}</p>
                          <p className="text-sm text-gray-600">Duration: {med.duration}</p>
                        </div>
                      </div>
                      {med.instructions && (
                        <p className="text-sm text-gray-700 mt-2 italic">{med.instructions}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lifestyle Recommendations */}
            {consultation.treatment_plan.lifestyle_recommendations && consultation.treatment_plan.lifestyle_recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Lifestyle Recommendations</h4>
                <ul className="list-disc list-inside space-y-1">
                  {consultation.treatment_plan.lifestyle_recommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-sm text-gray-600">{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Follow-up */}
            {consultation.treatment_plan.follow_up && (
              <div className="mt-4">
                <p className="text-sm text-gray-500">Next Follow-up</p>
                <p className="font-medium">{consultation.treatment_plan.follow_up}</p>
              </div>
            )}
          </div>
        )}

        {/* Prescriptions */}
        {consultation.prescriptions && consultation.prescriptions.length > 0 && (
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Active Prescriptions</h3>
            <div className="space-y-3">
              {consultation.prescriptions.map((rx: any) => (
                <div key={rx.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{rx.medication}</p>
                    <p className="text-sm text-gray-600">Quantity: {rx.quantity} • Refills: {rx.refills}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    rx.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {rx.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          href="/patient/messages" 
          className="flex-1 text-center px-6 py-3 bg-medical-600 text-white rounded-lg hover:bg-medical-700 font-medium"
        >
          Message Provider
        </Link>
        <Link 
          href="/patient/refill-checkin" 
          className="flex-1 text-center px-6 py-3 border border-medical-600 text-medical-600 rounded-lg hover:bg-medical-50 font-medium"
        >
          Request Refill
        </Link>
      </div>
    </div>
  );
}