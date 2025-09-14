'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Common medications database
const medicationDatabase = {
  acne: [
    { sku: 'TRE-025-CR', name: 'Tretinoin 0.025%', price: 59 },
    { sku: 'TRE-050-CR', name: 'Tretinoin 0.05%', price: 69 },
    { sku: 'DOX-100-CAP', name: 'Doxycycline 100mg', price: 4 }
  ],
  ed: [
    { sku: 'SIL-50-TAB', name: 'Sildenafil 50mg', price: 10 },
    { sku: 'SIL-100-TAB', name: 'Sildenafil 100mg', price: 15 }
  ],
  hairLoss: [
    { sku: 'FIN-1-TAB', name: 'Finasteride 1mg', price: 2 },
    { sku: 'MIN-5-SOL', name: 'Minoxidil 5%', price: 29 }
  ],
  weightLoss: [
    { sku: 'PHE-375-TAB', name: 'Phentermine 37.5mg', price: 89 },
    { sku: 'MET-500-TAB', name: 'Metformin 500mg', price: 3 }
  ]
};

export default function ProviderConsultationReview() {
  const params = useParams();
  const router = useRouter();
  const consultationId = params.id;

  const [consultation, setConsultation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assessment');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentNotes, setTreatmentNotes] = useState('');
  const [selectedMedications, setSelectedMedications] = useState<any[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchConsultation();
  }, [consultationId]);

  const fetchConsultation = async () => {
    try {
      // Mock consultation data
      const mockConsultation = {
        id: consultationId,
        first_name: 'Emily',
        last_name: 'Johnson',
        email: 'emily.johnson@email.com',
        phone: '(555) 123-4567',
        date_of_birth: '1996-03-15',
        age: 28,
        gender: 'Female',
        
        // Medical history
        allergies: 'Penicillin, Sulfa drugs',
        current_medications: 'Birth control (Yaz), Vitamin D',
        
        // Current consultation
        chief_complaint: 'Persistent acne on face and back for 6 months',
        symptoms: 'Inflammatory acne with scarring, worse during menstrual cycle',
        symptom_duration: '6 months',
        severity: 7,
        submitted_at: new Date(Date.now() - 45 * 60000).toISOString(),
        
        // Shipping
        shipping_address: '123 Main St, Apt 4B, San Francisco, CA 94102'
      };
      
      setConsultation(mockConsultation);
      
      // Pre-fill with AI suggestions
      setDiagnosis('Acne vulgaris, moderate to severe');
      setTreatmentNotes('Start combination therapy with topical retinoid and oral antibiotic. Counsel on skin care routine and sun protection. Follow up in 6-8 weeks.');
      
      // Pre-select common medications
      setSelectedMedications([
        { ...medicationDatabase.acne[0], qty: 1, instructions: 'Apply QHS' },
        { ...medicationDatabase.acne[2], qty: 90, instructions: 'Take 100mg BID with food' }
      ]);
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMedication = (med: any) => {
    setSelectedMedications([...selectedMedications, { ...med, qty: 30, instructions: '' }]);
  };

  const removeMedication = (index: number) => {
    setSelectedMedications(selectedMedications.filter((_, i) => i !== index));
  };

  const sendTreatmentPlan = () => {
    setSending(true);
    setTimeout(() => {
      alert('Treatment plan sent to patient!');
      router.push('/provider/dashboard');
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalCost = selectedMedications.reduce((sum, med) => sum + (med.price * (med.qty || 1)), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Compact Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/provider/dashboard')}
              className="text-slate-600 hover:text-slate-900"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Consultation #{consultationId}</h1>
              <p className="text-xs text-slate-500">Submitted {new Date(consultation?.submitted_at).toLocaleTimeString()}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full">
              Pending Review
            </span>
            <button
              onClick={sendTreatmentPlan}
              disabled={sending}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send Treatment Plan'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Patient Info Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="grid grid-cols-6 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Patient</span>
              <p className="font-semibold">{consultation.first_name} {consultation.last_name}</p>
              <p className="text-xs text-slate-600">{consultation.age}y {consultation.gender}</p>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500">Chief Complaint</span>
              <p className="font-semibold text-red-600">{consultation.chief_complaint}</p>
              <p className="text-xs text-slate-600">Severity: {consultation.severity}/10 • Duration: {consultation.symptom_duration}</p>
            </div>
            <div>
              <span className="text-slate-500">Allergies</span>
              <p className="font-semibold text-orange-600">{consultation.allergies}</p>
            </div>
            <div>
              <span className="text-slate-500">Current Meds</span>
              <p className="font-semibold">{consultation.current_medications}</p>
            </div>
            <div>
              <span className="text-slate-500">Contact</span>
              <p className="text-xs">{consultation.email}</p>
              <p className="text-xs">{consultation.phone}</p>
            </div>
          </div>
        </div>

        {/* Main Content Area - Side by Side */}
        <div className="grid grid-cols-2 gap-4">
          {/* Left Column - Assessment & Treatment */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-slate-900">Clinical Assessment</h2>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">AI Assisted</span>
              </div>
              
              {/* Diagnosis */}
              <div className="mb-3">
                <label className="text-xs text-slate-500 font-medium">Diagnosis</label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter diagnosis..."
                />
              </div>

              {/* Treatment Plan */}
              <div>
                <label className="text-xs text-slate-500 font-medium">Treatment Plan</label>
                <textarea
                  value={treatmentNotes}
                  onChange={(e) => setTreatmentNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>

            {/* Detailed Symptoms (Collapsible) */}
            <details className="border-t pt-3">
              <summary className="text-xs font-medium text-slate-600 cursor-pointer hover:text-slate-900">
                View Detailed Symptoms & History
              </summary>
              <div className="mt-2 text-sm text-slate-600 space-y-1">
                <p><strong>Symptoms:</strong> {consultation.symptoms}</p>
                <p><strong>Previous Treatments:</strong> OTC benzoyl peroxide, Proactiv (no improvement)</p>
                <p><strong>Lifestyle:</strong> High stress, irregular sleep, dairy consumption</p>
                <p><strong>Goal:</strong> Clear skin for wedding in 3 months</p>
              </div>
            </details>
          </div>

          {/* Right Column - Medications */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">Medications</h2>
              <span className="text-sm font-bold text-green-600">Total: ${totalCost}</span>
            </div>

            {/* Selected Medications */}
            <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
              {selectedMedications.map((med, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded text-sm">
                  <div className="flex-1">
                    <span className="font-medium">{med.name}</span>
                    <span className="text-slate-600 ml-2">${med.price}</span>
                  </div>
                  <input
                    type="number"
                    value={med.qty}
                    onChange={(e) => {
                      const updated = [...selectedMedications];
                      updated[index].qty = parseInt(e.target.value) || 1;
                      setSelectedMedications(updated);
                    }}
                    className="w-16 px-2 py-1 text-xs border rounded mx-2"
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
                    className="w-24 px-2 py-1 text-xs border rounded"
                    placeholder="Instructions"
                  />
                  <button
                    onClick={() => removeMedication(index)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Add Medications */}
            <div className="border-t pt-3">
              <p className="text-xs font-medium text-slate-600 mb-2">Quick Add</p>
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(medicationDatabase).map(([category, meds]) => (
                  <div key={category}>
                    <p className="text-xs text-slate-500 capitalize mb-1">{category}</p>
                    {meds.slice(0, 2).map((med) => (
                      <button
                        key={med.sku}
                        onClick={() => addMedication(med)}
                        className="w-full text-left px-2 py-1 text-xs border border-slate-200 rounded hover:bg-blue-50 hover:border-blue-300 mb-1"
                      >
                        {med.name} - ${med.price}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Info Bar */}
        <div className="mt-4 bg-white rounded-lg shadow-sm p-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-slate-500">
                <strong>Ship to:</strong> {consultation.shipping_address}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span className="text-sm">Send copy to patient</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span className="text-sm">Enable follow-up messaging</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
