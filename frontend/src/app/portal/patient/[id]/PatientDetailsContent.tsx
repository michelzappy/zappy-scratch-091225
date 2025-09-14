'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Timeline from '@/components/Timeline';
import Alert from '@/components/Alert';
import { api } from '@/lib/api';
import { format } from 'date-fns';

// Types
interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  created_at: string;
  subscription_active: boolean;
  account_credit: number;
  total_consultations: number;
  total_orders: number;
  total_spent: number;
  last_visit: string;
}

interface Subscription {
  id: string;
  plan_id: string;
  plan_name: string;
  price: number;
  status: string;
  current_period_start: string;
  current_period_end: string;
  paused_at?: string;
  resume_date?: string;
  canceled_at?: string;
  cancel_reason?: string;
}

interface TreatmentPlan {
  id: string;
  condition: string;
  name: string;
  price: number;
  consultation_id: string;
  started_at: string;
  assigned_to: string;
}

interface Medication {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  status: string;
  prescriber: string;
  consultation_type: string;
  created_at: string;
}

interface Consultation {
  id: string;
  consultation_type: string;
  status: string;
  provider_name: string;
  created_at: string;
  message_count: number;
}

interface ClinicalNote {
  id: string;
  type: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  content?: string;
  provider_name: string;
  created_at: string;
  is_locked: boolean;
}

interface BillingItem {
  id: string;
  order_number: string;
  total_amount: number;
  payment_status: string;
  created_at: string;
  items: any[];
}

interface PatientDetailsContentProps {
  patientId: string;
}

export default function PatientDetailsContent({ patientId }: PatientDetailsContentProps) {
  const router = useRouter();

  // State management
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>([]);
  const [billingHistory, setBillingHistory] = useState<BillingItem[]>([]);
  const [statistics, setStatistics] = useState<any>(null);

  // Admin controls state
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ClinicalNote | null>(null);

  // Form state for modals
  const [billingType, setBillingType] = useState('credit');
  const [billingAmount, setBillingAmount] = useState('');
  const [billingReason, setBillingReason] = useState('');
  const [noteType, setNoteType] = useState('soap');
  const [noteContent, setNoteContent] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    content: ''
  });

  // Fetch patient data
  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      
      // Fetch comprehensive patient data
      const response = await api.get(`/admin/patients/${patientId}/full`);
      const data = response.data.data;
      
      setPatient(data.patient);
      setSubscription(data.subscription);
      setTreatmentPlans(data.activePlans || []);
      setMedications(data.medications || []);
      setConsultations(data.consultationHistory || []);
      setClinicalNotes(data.clinicalNotes || []);
      setBillingHistory(data.billingHistory || []);

      // Fetch statistics
      const statsResponse = await api.get(`/admin/patients/${patientId}/statistics`);
      setStatistics(statsResponse.data.data);
      
    } catch (error) {
      console.error('Error fetching patient data:', error);
      console.error('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  // Subscription management
  const handleSubscriptionAction = async (action: string) => {
    try {
      const payload: any = { action };
      
      if (action === 'pause') {
        const resumeDate = prompt('Enter resume date (YYYY-MM-DD):');
        if (!resumeDate) return;
        payload.resume_date = resumeDate;
      }
      
      if (action === 'cancel') {
        const reason = prompt('Enter cancellation reason:');
        if (!reason) return;
        payload.reason = reason;
        payload.immediate = confirm('Cancel immediately? (Yes for immediate, No for end of period)');
      }
      
      if (action === 'change_plan') {
        const planId = prompt('Enter new plan ID (basic/premium/annual):');
        if (!planId) return;
        payload.plan_id = planId;
      }

      await api.put(`/admin/patients/${patientId}/subscription`, payload);
      console.log(`Subscription ${action} completed`);
      fetchPatientData();
      setShowSubscriptionModal(false);
    } catch (error) {
      console.error('Subscription action error:', error);
      console.error(`Failed to ${action} subscription`);
    }
  };

  // Billing adjustment
  const handleBillingAdjustment = async () => {
    try {
      await api.post(`/admin/patients/${patientId}/billing/adjustment`, {
        type: billingType,
        amount: parseFloat(billingAmount),
        reason: billingReason
      });
      
      console.log(`Billing ${billingType} applied successfully`);
      fetchPatientData();
      setShowBillingModal(false);
      setBillingAmount('');
      setBillingReason('');
    } catch (error) {
      console.error('Billing adjustment error:', error);
      console.error('Failed to apply billing adjustment');
    }
  };

  // Clinical notes management
  const handleSaveNote = async () => {
    try {
      const payload: any = { type: noteType };
      
      if (noteType === 'soap') {
        payload.subjective = noteContent.subjective;
        payload.objective = noteContent.objective;
        payload.assessment = noteContent.assessment;
        payload.plan = noteContent.plan;
      } else {
        payload.content = noteContent.content;
      }

      if (selectedNote) {
        // Update existing note
        await api.put(`/admin/patients/${patientId}/notes/${selectedNote.id}`, payload);
        console.log('Note updated successfully');
      } else {
        // Create new note
        await api.post(`/admin/patients/${patientId}/notes`, payload);
        console.log('Note created successfully');
      }
      
      fetchPatientData();
      setShowNoteModal(false);
      setSelectedNote(null);
      setNoteContent({
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
        content: ''
      });
    } catch (error) {
      console.error('Note save error:', error);
      console.error('Failed to save note');
    }
  };

  // Treatment plan override
  const handleTreatmentOverride = async (planId: string) => {
    try {
      const reason = prompt('Enter reason for treatment plan override:');
      if (!reason) return;
      
      await api.put(`/admin/patients/${patientId}/treatment-plan/${planId}`, {
        reason,
        modifications: {}
      });
      
      console.log('Treatment plan override applied');
      fetchPatientData();
    } catch (error) {
      console.error('Treatment override error:', error);
      console.error('Failed to override treatment plan');
    }
  };

  // Add patient flag
  const handleAddFlag = async (flagType: string) => {
    try {
      const reason = prompt(`Enter reason for ${flagType} flag:`);
      if (!reason) return;
      
      await api.post(`/admin/patients/${patientId}/flags`, {
        type: flagType,
        reason
      });
      
      console.log('Patient flag added');
      fetchPatientData();
    } catch (error) {
      console.error('Add flag error:', error);
      console.error('Failed to add patient flag');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading patient data...</div>
      </div>
    );
  }

  if (!patient) {
    return <Alert type="danger" title="Error" message="Patient not found" />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Patient Info and Admin Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {patient.first_name} {patient.last_name}
            </h1>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <p>Email: {patient.email}</p>
              <p>Phone: {patient.phone || 'Not provided'}</p>
              <p>DOB: {format(new Date(patient.date_of_birth), 'MMM dd, yyyy')}</p>
              <p>Member Since: {format(new Date(patient.created_at), 'MMM dd, yyyy')}</p>
            </div>
          </div>
          
          {/* Admin Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowSubscriptionModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Manage Subscription
            </button>
            <button
              onClick={() => setShowBillingModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Billing Adjustment
            </button>
            <button
              onClick={() => setShowNoteModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Add Note
            </button>
            <div className="relative group">
              <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                Add Flag
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg hidden group-hover:block z-10">
                <button
                  onClick={() => handleAddFlag('high_risk')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  High Risk
                </button>
                <button
                  onClick={() => handleAddFlag('vip')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  VIP
                </button>
                <button
                  onClick={() => handleAddFlag('collections')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Collections
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-600">Lifetime Value</div>
            <div className="text-2xl font-bold">
              ${statistics?.lifetime_value || '0.00'}
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-600">Total Consultations</div>
            <div className="text-2xl font-bold">
              {statistics?.total_consultations || 0}
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-600">Active Prescriptions</div>
            <div className="text-2xl font-bold">
              {statistics?.active_prescriptions || 0}
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-600">Account Credit</div>
            <div className="text-2xl font-bold">
              ${patient.account_credit || '0.00'}
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Sections */}
      {/* ... Rest of the UI components would go here ... */}

      {/* Modals */}
      {/* Subscription Management Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Manage Subscription</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleSubscriptionAction('change_plan')}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Change Plan
              </button>
              <button
                onClick={() => handleSubscriptionAction('pause')}
                className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Pause Subscription
              </button>
              <button
                onClick={() => handleSubscriptionAction('resume')}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Resume Subscription
              </button>
              <button
                onClick={() => handleSubscriptionAction('cancel')}
                className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Cancel Subscription
              </button>
            </div>
            <button
              onClick={() => setShowSubscriptionModal(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Billing Adjustment Modal */}
      {showBillingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Billing Adjustment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={billingType}
                  onChange={(e) => setBillingType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="credit">Credit</option>
                  <option value="refund">Refund</option>
                  <option value="discount">Discount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <input
                  type="number"
                  value={billingAmount}
                  onChange={(e) => setBillingAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <textarea
                  value={billingReason}
                  onChange={(e) => setBillingReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  placeholder="Enter reason for adjustment..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleBillingAdjustment}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Apply Adjustment
                </button>
                <button
                  onClick={() => {
                    setShowBillingModal(false);
                    setBillingAmount('');
                    setBillingReason('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clinical Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {selectedNote ? 'Edit Clinical Note' : 'Add Clinical Note'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Note Type</label>
                <select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={!!selectedNote}
                >
                  <option value="soap">SOAP Note</option>
                  <option value="progress">Progress Note</option>
                  <option value="admin">Admin Note</option>
                  <option value="internal">Internal Note</option>
                </select>
              </div>

              {noteType === 'soap' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Subjective</label>
                    <textarea
                      value={noteContent.subjective}
                      onChange={(e) => setNoteContent({...noteContent, subjective: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md"
                      rows={3}
                      placeholder="Patient's chief complaint and history..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Objective</label>
                    <textarea
                      value={noteContent.objective}
                      onChange={(e) => setNoteContent({...noteContent, objective: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md"
                      rows={3}
                      placeholder="Clinical findings and observations..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Assessment</label>
                    <textarea
                      value={noteContent.assessment}
                      onChange={(e) => setNoteContent({...noteContent, assessment: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md"
                      rows={3}
                      placeholder="Clinical assessment and diagnosis..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Plan</label>
                    <textarea
                      value={noteContent.plan}
                      onChange={(e) => setNoteContent({...noteContent, plan: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md"
                      rows={3}
                      placeholder="Treatment plan and next steps..."
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-1">Note Content</label>
                  <textarea
                    value={noteContent.content}
                    onChange={(e) => setNoteContent({...noteContent, content: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={8}
                    placeholder="Enter note content..."
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleSaveNote}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {selectedNote ? 'Update Note' : 'Save Note'}
                </button>
                <button
                  onClick={() => {
                    setShowNoteModal(false);
                    setSelectedNote(null);
                    setNoteContent({
                      subjective: '',
                      objective: '',
                      assessment: '',
                      plan: '',
                      content: ''
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
