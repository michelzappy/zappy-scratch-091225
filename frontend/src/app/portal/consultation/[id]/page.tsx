'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Card from '@/components/Card';

interface ConsultationDetail {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  type: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  date: string;
  provider: string;
  chiefComplaint: string;
  symptoms: string[];
  duration: string;
  medications: string[];
  allergies: string[];
  notes: string;
}

export default function ConsultationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [consultation, setConsultation] = useState<ConsultationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/portal/login');
      return;
    }

    // Fetch consultation details (mock data for now)
    fetchConsultationDetails();
  }, [router, params.id]);

  const fetchConsultationDetails = async () => {
    // Mock data - replace with actual API call
    const mockConsultation: ConsultationDetail = {
      id: params.id as string,
      patientName: 'Sarah Johnson',
      patientEmail: 'sarah.j@email.com',
      patientPhone: '(555) 123-4567',
      type: 'Acne Treatment',
      status: 'in-progress',
      priority: 'high',
      date: '2024-01-15T10:00:00',
      provider: 'Dr. Smith',
      chiefComplaint: 'Severe acne breakout for the past 3 weeks',
      symptoms: ['Cystic acne', 'Inflammation', 'Scarring concerns'],
      duration: '3 weeks',
      medications: ['Birth control pills', 'Vitamin D supplement'],
      allergies: ['Penicillin', 'Sulfa drugs'],
      notes: 'Patient has tried OTC treatments without success. Considering prescription retinoid therapy.'
    };
    
    setConsultation(mockConsultation);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Consultation not found</p>
        <button 
          onClick={() => router.push('/portal/consultations')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Back to Consultations
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consultation Details</h1>
          <p className="text-gray-600 mt-1">ID: {consultation.id}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => router.push('/portal/consultations')}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Back
          </button>
          {consultation.status === 'in-progress' && (
            <button
              onClick={() => {
                alert('Opening video consultation...');
                // Implement video call functionality
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Start Video Call
            </button>
          )}
          <button
            onClick={() => {
              alert('Completing consultation...');
              // Update status to completed
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Complete Consultation
          </button>
        </div>
      </div>

      {/* Status and Priority */}
      <div className="flex space-x-4">
        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(consultation.status)}`}>
          {consultation.status}
        </span>
        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 ${getPriorityColor(consultation.priority)}`}>
          Priority: {consultation.priority}
        </span>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="text-gray-900 font-medium">{consultation.patientName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-gray-900">{consultation.patientEmail}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="text-gray-900">{consultation.patientPhone}</p>
            </div>
            <button
              onClick={() => router.push(`/portal/patient/${consultation.id}`)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              View Full Patient Profile →
            </button>
          </div>
        </Card>

        {/* Consultation Details */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Consultation Details</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="text-gray-900 font-medium">{consultation.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Provider</p>
              <p className="text-gray-900">{consultation.provider}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Scheduled Date/Time</p>
              <p className="text-gray-900">{new Date(consultation.date).toLocaleString()}</p>
            </div>
          </div>
        </Card>

        {/* Chief Complaint */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Chief Complaint</h2>
          <p className="text-gray-700">{consultation.chiefComplaint}</p>
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">Symptoms</p>
            <div className="flex flex-wrap gap-2">
              {consultation.symptoms.map((symptom, i) => (
                <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                  {symptom}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">Duration</p>
            <p className="text-gray-900">{consultation.duration}</p>
          </div>
        </Card>

        {/* Medical History */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Medical History</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-2">Current Medications</p>
              {consultation.medications.length > 0 ? (
                <ul className="list-disc list-inside text-gray-700">
                  {consultation.medications.map((med, i) => (
                    <li key={i}>{med}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">None reported</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Allergies</p>
              {consultation.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {consultation.allergies.map((allergy, i) => (
                    <span key={i} className="px-2 py-1 bg-red-50 text-red-700 rounded text-sm">
                      {allergy}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">None reported</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Notes Section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Provider Notes</h2>
        <p className="text-gray-700 mb-4">{consultation.notes}</p>
        <textarea
          placeholder="Add additional notes..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />
        <button className="mt-3 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition">
          Save Notes
        </button>
      </Card>

      {/* Action Buttons */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              alert('Prescribing medication...');
              router.push('/portal/prescriptions/new');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Prescribe Medication
          </button>
          <button
            onClick={() => {
              alert('Ordering lab tests...');
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Order Lab Tests
          </button>
          <button
            onClick={() => {
              alert('Scheduling follow-up...');
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Schedule Follow-up
          </button>
          <button
            onClick={() => {
              alert('Sending message to patient...');
              router.push('/portal/messages');
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Message Patient
          </button>
        </div>
      </Card>
    </div>
  );
}
