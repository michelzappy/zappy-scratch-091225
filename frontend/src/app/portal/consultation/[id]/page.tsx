'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/Card';
import { apiClient } from '@/lib/api';
import NotificationPopup from '@/components/NotificationPopup';

// Common medications database
const medicationDatabase = {
  acne: [
    { sku: 'TRE-025-CR', name: 'Tretinoin 0.025%', price: 59 },
    { sku: 'TRE-050-CR', name: 'Tretinoin 0.05%', price: 69 },
    { sku: 'DOX-100-CAP', name: 'Doxycycline 100mg', price: 45 },
    { sku: 'BPO-5-GEL', name: 'Benzoyl Peroxide 5%', price: 29 }
  ],
  ed: [
    { sku: 'SIL-50-TAB', name: 'Sildenafil 50mg', price: 10 },
    { sku: 'SIL-100-TAB', name: 'Sildenafil 100mg', price: 15 },
    { sku: 'TAD-20-TAB', name: 'Tadalafil 20mg', price: 12 }
  ],
  hairLoss: [
    { sku: 'FIN-1-TAB', name: 'Finasteride 1mg', price: 25 },
    { sku: 'MIN-5-SOL', name: 'Minoxidil 5%', price: 29 }
  ],
  weightLoss: [
    { sku: 'PHE-375-TAB', name: 'Phentermine 37.5mg', price: 89 },
    { sku: 'MET-500-TAB', name: 'Metformin 500mg', price: 30 },
    { sku: 'SEM-025-INJ', name: 'Semaglutide 0.25mg', price: 299 }
  ]
};

export default function ConsultationReviewPage() {
  const params = useParams();
  const router = useRouter();
  const consultationId = params.id;

  const [consultation, setConsultation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('hpi');
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // HPI (History of Present Illness) Structure
  const [hpi, setHpi] = useState({
    chiefComplaint: '',
    onset: '',
    location: '',
    duration: '',
    characteristics: '',
    aggravatingFactors: '',
    relievingFactors: '',
    timing: '',
    severity: '',
    context: ''
  });

  // Assessment & Plan
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentNotes, setTreatmentNotes] = useState('');
  const [selectedMedications, setSelectedMedications] = useState<any[]>([]);
  
  // Patient Communication
  const [patientVisibleNote, setPatientVisibleNote] = useState('');
  const [internalProviderNote, setInternalProviderNote] = useState('');
  
  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/portal/login');
      return;
    }
    fetchConsultation();
  }, [consultationId, router]);

  const fetchConsultation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.consultations.getById(consultationId as string);
      const consultationData = response.data;
      
      setConsultation(consultationData);

      // Pre-fill HPI from patient data if available
      if (consultationData) {
        setHpi({
          chiefComplaint: consultationData.chief_complaint || '',
          onset: consultationData.symptom_onset || '',
          location: consultationData.symptom_location || '',
          duration: consultationData.symptom_duration || '',
          characteristics: consultationData.symptoms || '',
          aggravatingFactors: consultationData.aggravating_factors || '',
          relievingFactors: consultationData.relieving_factors || '',
          timing: consultationData.timing || '',
          severity: consultationData.severity ? `${consultationData.severity}/10` : '',
          context: consultationData.previous_treatments || ''
        });

        // Pre-fill existing assessment if available
        setDiagnosis(consultationData.diagnosis || '');
        setTreatmentNotes(consultationData.treatment_notes || '');
        setPatientVisibleNote(consultationData.patient_message || '');
        setInternalProviderNote(consultationData.provider_notes || '');
        
        // Load existing medications if available
        if (consultationData.medications && consultationData.medications.length > 0) {
          setSelectedMedications(consultationData.medications);
        }
      }

    } catch (err) {
      console.error('Error fetching consultation:', err);
      setError('Failed to load consultation details');
    } finally {
      setLoading(false);
    }
  };

  const generateAIContent = async (type: 'assessment' | 'plan' | 'message') => {
    setAiLoading(true);
    try {
      const response = await fetch('/api/ai-consultation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          consultation,
          hpi,
          diagnosis
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (type === 'assessment') {
          setDiagnosis(data.diagnosis);
          setTreatmentNotes(data.assessment);
        } else if (type === 'message') {
          setPatientVisibleNote(data.message);
        }
      }
    } catch (error) {
      console.error('AI generation error:', error);
      setNotification({ type: 'error', text: 'AI suggestions temporarily unavailable' });
    } finally {
      setAiLoading(false);
    }
  };

  const addMedication = (med: any) => {
    setSelectedMedications([...selectedMedications, { ...med, qty: 30, instructions: '' }]);
  };

  const removeMedication = (index: number) => {
    setSelectedMedications(selectedMedications.filter((_, i) => i !== index));
  };

  const sendTreatmentPlan = async () => {
    setSending(true);
    try {
      const payload = {
        hpi,
        diagnosis,
        treatmentNotes,
        medications: selectedMedications,
        patientVisibleNote,
        internalProviderNote,
        status: 'completed'
      };

      await apiClient.consultations.complete(consultationId as string, payload);
      
      setNotification({ type: 'success', text: 'Treatment plan sent to patient and pharmacy!' });
      
      // Navigate after a short delay to let user see the notification
      setTimeout(() => {
        router.push('/portal/consultations');
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      setNotification({ type: 'error', text: 'Error sending treatment plan. Please try again.' });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchConsultation}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Consultation not found</p>
      </div>
    );
  }

  const totalCost = selectedMedications.reduce((sum, med) => sum + (med.price * (med.qty || 1)), 0);

  return (
    <div className="space-y-6">
      {/* Notification Popup */}
      <NotificationPopup
        message={notification}
        onClose={() => setNotification(null)}
        duration={4000}
      />

      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/portal/consultations')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Consultation #{consultationId}</h1>
            <p className="text-gray-600">Submitted {new Date(consultation?.submitted_at).toLocaleTimeString()}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full">
            Pending Review
          </span>
          <button
            onClick={sendTreatmentPlan}
            disabled={sending}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send Treatment Plan'}
          </button>
        </div>
      </div>

      {/* Patient Info Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-6 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Patient</span>
            <p className="font-semibold">{consultation.first_name} {consultation.last_name}</p>
            <p className="text-xs text-gray-600">{consultation.age}y {consultation.gender}</p>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">Chief Complaint</span>
            <p className="font-semibold text-red-600">{consultation.chief_complaint}</p>
            <p className="text-xs text-gray-600">Severity: {consultation.severity}/10 • Duration: {consultation.symptom_duration}</p>
          </div>
          <div>
            <span className="text-gray-500">Allergies</span>
            <p className="font-semibold text-orange-600">{consultation.allergies}</p>
          </div>
          <div>
            <span className="text-gray-500">Current Meds</span>
            <p className="font-semibold">{consultation.current_medications}</p>
          </div>
          <div>
            <span className="text-gray-500">Contact</span>
            <p className="text-xs">{consultation.email}</p>
            <p className="text-xs">{consultation.phone}</p>
          </div>
        </div>
      </Card>

      {/* Section Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'hpi', label: 'HPI / History' },
            { id: 'assessment', label: 'Assessment & Plan' },
            { id: 'medications', label: 'Medications' },
            { id: 'communication', label: 'Patient Communication' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSection === tab.id
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* HPI Section */}
      {activeSection === 'hpi' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">History of Present Illness (HPI)</h2>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">AI Pre-filled</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(hpi).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setHpi({ ...hpi, [key]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Assessment & Plan Section */}
      {activeSection === 'assessment' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Clinical Assessment</h2>
            <button
              onClick={() => generateAIContent('assessment')}
              disabled={aiLoading}
              className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200"
            >
              {aiLoading ? 'Generating...' : '🤖 Generate AI Assessment'}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Plan</label>
              <textarea
                value={treatmentNotes}
                onChange={(e) => setTreatmentNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                rows={4}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Medications Section */}
      {activeSection === 'medications' && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Medications</h3>
            <div className="space-y-2 mb-4">
              {selectedMedications.map((med, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex-1">
                    <span className="font-medium">{med.name}</span>
                    <span className="text-gray-600 ml-2">${med.price}</span>
                  </div>
                  <input
                    type="number"
                    value={med.qty}
                    onChange={(e) => {
                      const updated = [...selectedMedications];
                      updated[index].qty = parseInt(e.target.value) || 1;
                      setSelectedMedications(updated);
                    }}
                    className="w-20 px-2 py-1 border rounded mx-2"
                    placeholder="Qty"
                  />
                  <input
                    type="text"
                    value={med.instructions}
                    onChange={(e) => {
                      const updated = [...selectedMedications];
                      updated[index].instructions = e.target.value;
                      setSelectedMedications(updated);
                    }}
                    className="w-48 px-2 py-1 border rounded"
                    placeholder="Instructions"
                  />
                  <button
                    onClick={() => removeMedication(index)}
                    className="ml-2 text-red-500 hover:text-red-700 text-xl"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-green-600">Total: ${totalCost}</span>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Medication Library</h3>
            {Object.entries(medicationDatabase).map(([category, meds]) => (
              <div key={category} className="mb-4">
                <p className="text-sm font-medium text-gray-600 capitalize mb-2">{category}</p>
                <div className="space-y-1">
                  {meds.map((med) => (
                    <button
                      key={med.sku}
                      onClick={() => addMedication(med)}
                      className="w-full text-left px-3 py-2 text-sm border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300"
                    >
                      {med.name} - ${med.price}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Patient Communication Section */}
      {activeSection === 'communication' && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Message to Patient</h3>
              <button
                onClick={() => generateAIContent('message')}
                disabled={aiLoading}
                className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200"
              >
                {aiLoading ? 'Generating...' : '🤖 Generate Message'}
              </button>
            </div>
            <div className="mb-2">
              <span className="text-xs text-green-600 font-medium">✓ Patient will see this message</span>
            </div>
            <textarea
              value={patientVisibleNote}
              onChange={(e) => setPatientVisibleNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              rows={10}
              placeholder="Enter a message for the patient about their diagnosis and treatment plan..."
            />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Internal Provider Notes</h3>
            <div className="mb-2">
              <span className="text-xs text-red-600 font-medium">🔒 Private - Not visible to patient</span>
            </div>
            <textarea
              value={internalProviderNote}
              onChange={(e) => setInternalProviderNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              rows={10}
              placeholder="Internal notes for provider reference only..."
            />
          </Card>
        </div>
      )}

      {/* Bottom Action Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" defaultChecked />
              <span className="text-sm">Send copy to patient portal</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" defaultChecked />
              <span className="text-sm">Enable follow-up messaging</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" defaultChecked />
              <span className="text-sm">Send to pharmacy</span>
            </label>
          </div>
          <div className="text-sm text-gray-600">
            <strong>Ship to:</strong> {consultation.shipping_address}
          </div>
        </div>
      </Card>
    </div>
  );
}
