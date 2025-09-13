'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Treatment protocols by condition
const treatmentProtocols = {
  acne: {
    mild: {
      name: 'Mild Acne Protocol',
      medications: [
        { sku: 'TRE-025-CR', name: 'Tretinoin 0.025% Cream', price: 59, qty: 1, instructions: 'Apply thin layer at bedtime' }
      ],
      total: 59
    },
    moderate: {
      name: 'Moderate Acne Protocol',
      medications: [
        { sku: 'TRE-050-CR', name: 'Tretinoin 0.05% Cream', price: 69, qty: 1, instructions: 'Apply thin layer at bedtime' },
        { sku: 'DOX-100-CAP', name: 'Doxycycline 100mg', price: 45, qty: 60, instructions: 'Take 1 tablet twice daily with food' }
      ],
      total: 114
    },
    severe: {
      name: 'Severe Acne Protocol',
      medications: [
        { sku: 'TRE-050-CR', name: 'Tretinoin 0.05% Cream', price: 69, qty: 1, instructions: 'Apply thin layer at bedtime' },
        { sku: 'DOX-100-CAP', name: 'Doxycycline 100mg', price: 45, qty: 60, instructions: 'Take 1 tablet twice daily with food' },
        { sku: 'BPO-5-GEL', name: 'Benzoyl Peroxide 5% Gel', price: 29, qty: 1, instructions: 'Apply in morning after washing' }
      ],
      total: 143
    }
  },
  ed: {
    trial: {
      name: 'ED Trial Pack',
      medications: [
        { sku: 'SIL-50-TAB', name: 'Sildenafil 50mg', price: 10, qty: 6, instructions: 'Take 1 tablet 30-60 min before activity' }
      ],
      total: 60
    },
    standard: {
      name: 'ED Standard Supply',
      medications: [
        { sku: 'SIL-100-TAB', name: 'Sildenafil 100mg', price: 15, qty: 12, instructions: 'Take 1 tablet 30-60 min before activity' }
      ],
      total: 180
    },
    daily: {
      name: 'Daily ED Treatment',
      medications: [
        { sku: 'TAD-5-TAB', name: 'Tadalafil 5mg', price: 25, qty: 30, instructions: 'Take 1 tablet daily at same time' }
      ],
      total: 750
    }
  },
  hairLoss: {
    prevention: {
      name: 'Hair Loss Prevention',
      medications: [
        { sku: 'FIN-1-TAB', name: 'Finasteride 1mg', price: 25, qty: 30, instructions: 'Take 1 tablet daily' }
      ],
      total: 25
    },
    standard: {
      name: 'Hair Loss Standard',
      medications: [
        { sku: 'FIN-1-TAB', name: 'Finasteride 1mg', price: 25, qty: 30, instructions: 'Take 1 tablet daily' },
        { sku: 'MIN-5-SOL', name: 'Minoxidil 5% Solution', price: 29, qty: 1, instructions: 'Apply 1ml to scalp twice daily' }
      ],
      total: 54
    },
    aggressive: {
      name: 'Hair Loss Aggressive',
      medications: [
        { sku: 'FIN-1-TAB', name: 'Finasteride 1mg', price: 25, qty: 30, instructions: 'Take 1 tablet daily' },
        { sku: 'MIN-5-SOL', name: 'Minoxidil 5% Solution', price: 29, qty: 2, instructions: 'Apply 1ml to scalp twice daily' },
        { sku: 'KET-2-SH', name: 'Ketoconazole 2% Shampoo', price: 35, qty: 1, instructions: 'Use 2-3 times weekly' }
      ],
      total: 89
    }
  },
  weightLoss: {
    starter: {
      name: 'Weight Loss Starter',
      medications: [
        { sku: 'MET-500-TAB', name: 'Metformin 500mg', price: 35, qty: 60, instructions: 'Take 1 tablet twice daily with meals' }
      ],
      total: 35
    },
    standard: {
      name: 'Weight Loss Standard',
      medications: [
        { sku: 'PHE-375-TAB', name: 'Phentermine 37.5mg', price: 89, qty: 30, instructions: 'Take 1 tablet in morning before breakfast' }
      ],
      total: 89
    },
    combination: {
      name: 'Weight Loss Combination',
      medications: [
        { sku: 'PHE-375-TAB', name: 'Phentermine 37.5mg', price: 89, qty: 30, instructions: 'Take 1 tablet in morning before breakfast' },
        { sku: 'MET-500-TAB', name: 'Metformin 500mg', price: 35, qty: 60, instructions: 'Take 1 tablet twice daily with meals' }
      ],
      total: 124
    }
  }
};

export default function ProviderConsultationReview() {
  const params = useParams();
  const router = useRouter();
  const consultationId = params.id;

  const [consultation, setConsultation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentNotes, setTreatmentNotes] = useState('');
  const [selectedMedications, setSelectedMedications] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [hpiSummary, setHpiSummary] = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState('');
  const [patientCondition, setPatientCondition] = useState('acne'); // Determined from intake form

  useEffect(() => {
    fetchConsultation();
  }, [consultationId]);

  const fetchConsultation = async () => {
    try {
      // Mock consultation data with full HPI
      const mockConsultation = {
        id: consultationId,
        first_name: 'Emily',
        last_name: 'Johnson',
        date_of_birth: '1996-03-15',
        age: 28,
        gender: 'Female',
        
        // Medical history
        allergies: 'Penicillin, Sulfa drugs',
        current_medications: 'Birth control (Yaz), Vitamin D 2000 IU daily',
        
        // Current consultation
        chief_complaint: 'Persistent acne on face and back',
        symptom_duration: '6 months',
        severity: 7,
        submitted_at: new Date(Date.now() - 45 * 60000).toISOString(),
        
        // Full HPI from intake form
        hpi: {
          onset: 'Started 6 months ago, gradually worsening',
          location: 'Face (cheeks, forehead, chin) and upper back',
          character: 'Inflammatory papules and pustules with some comedones',
          timing: 'Worse during menstrual cycle (week before period)',
          aggravating: 'Stress, dairy products, touching face',
          relieving: 'Some improvement with OTC benzoyl peroxide',
          associated: 'Oily skin, occasional scarring, mild hyperpigmentation',
          previous_treatments: [
            'Benzoyl peroxide 2.5% - minimal improvement',
            'Salicylic acid cleanser - dried skin',
            'Proactiv system - no improvement'
          ],
          lifestyle: {
            sleep: '5-6 hours/night (irregular)',
            stress_level: 'High (work deadlines)',
            diet: 'Regular dairy consumption, occasional fast food',
            exercise: '2-3 times per week',
            skincare: 'Cetaphil cleanser, moisturizer SPF 30'
          },
          goals: 'Clear skin for wedding in 3 months, prevent scarring',
          family_history: 'Mother had severe acne in 20s',
          relevant_history: 'No history of isotretinoin use, not pregnant/planning'
        }
      };
      
      setConsultation(mockConsultation);
      
      // Pre-fill HPI summary as a paragraph
      const hpiParagraph = `28-year-old female presents with persistent acne on face and back for 6 months with severity 7/10. Started 6 months ago and has been gradually worsening. Located on face (cheeks, forehead, chin) and upper back. Characterized as inflammatory papules and pustules with some comedones. Symptoms worsen during menstrual cycle (week before period) and are aggravated by stress, dairy products, and touching face. Some improvement noted with OTC benzoyl peroxide. Previous treatments include benzoyl peroxide 2.5% (minimal improvement), salicylic acid cleanser (dried skin), and Proactiv system (no improvement). Patient's goal is clear skin for wedding in 3 months and prevention of scarring. Allergies: Penicillin, Sulfa drugs. Current medications: Birth control (Yaz), Vitamin D 2000 IU daily.`;
      
      setHpiSummary(hpiParagraph);
      
      // Pre-fill with AI suggestions
      setDiagnosis('Acne vulgaris, moderate to severe');
      setTreatmentNotes('Start combination therapy with topical retinoid and oral antibiotic. Counsel on skin care routine and sun protection. Follow up in 6-8 weeks.');
      
      // Pre-select moderate acne protocol as default
      setSelectedProtocol('moderate');
      setSelectedMedications(treatmentProtocols.acne.moderate.medications);
      setPatientCondition('acne'); // This would come from the patient's intake form
      
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
      alert('Treatment plan sent to patient and pharmacy!');
      router.push('/provider/dashboard');
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-600"></div>
      </div>
    );
  }

  const totalCost = selectedMedications.reduce((sum, med) => sum + (med.price * (med.qty || 1)), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Compact Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/provider/dashboard')} className="text-slate-600 hover:text-slate-900">←</button>
            <span className="text-sm font-medium text-slate-900">
              {consultation.first_name} {consultation.last_name}, {consultation.age} • #{consultationId}
            </span>
          </div>
          <button
            onClick={sendTreatmentPlan}
            disabled={sending || selectedMedications.length === 0}
            className="px-4 py-1.5 bg-medical-600 text-white text-sm font-medium rounded hover:bg-medical-700 transition disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Approve & Send'}
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-3">
        {/* Provider-focused layout: HPI → Treatment → Prescriptions */}
        <div className="grid grid-cols-2 gap-3">
          {/* Left Column: HPI + Treatment Plan */}
          <div className="space-y-3">
            {/* HPI - Editable paragraph summary */}
            <div className="bg-white rounded border border-slate-200 p-3">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Patient Presentation (HPI)</h3>
              <textarea
                value={hpiSummary}
                onChange={(e) => setHpiSummary(e.target.value)}
                className="w-full px-2 py-1.5 text-sm text-slate-700 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-medical-500"
                rows={6}
                placeholder="Patient history and presentation..."
              />
            </div>

            {/* Treatment Plan & Message to Patient */}
            <div className="bg-white rounded border border-slate-200 p-3">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Treatment Plan</h3>
              
              <div className="mb-3">
                <label className="text-xs font-medium text-slate-700">Diagnosis</label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-medical-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Message to Patient</label>
                <textarea
                  value={treatmentNotes}
                  onChange={(e) => setTreatmentNotes(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-medical-500"
                  rows={4}
                  placeholder="Instructions for the patient..."
                />
              </div>
            </div>
          </div>

          {/* Right Column: Prescriptions Only */}
          <div className="bg-white rounded border border-slate-200 p-3 h-fit">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Prescriptions</h3>
              <span className="text-lg font-bold text-emerald-600">${totalCost}</span>
            </div>

            {/* Selected Medications */}
            <div className="space-y-2 mb-3">
              {selectedMedications.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No medications selected</p>
              ) : (
                selectedMedications.map((med, index) => (
                  <div key={index} className="bg-blue-50 rounded p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{med.name}</span>
                      <button onClick={() => removeMedication(index)} className="text-red-500 hover:text-red-700">×</button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={med.qty}
                        onChange={(e) => {
                          const updated = [...selectedMedications];
                          updated[index].qty = parseInt(e.target.value) || 1;
                          setSelectedMedications(updated);
                        }}
                        className="w-16 px-2 py-1 text-xs border border-slate-200 rounded"
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
                        className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded"
                        placeholder="Sig: instructions..."
                      />
                      <span className="text-sm text-slate-600 self-center">${med.price}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Treatment Protocol Selection */}
            <div>
              <p className="text-xs font-medium text-slate-700 mb-2">Select Treatment Protocol:</p>
              <div className="space-y-2">
                {Object.entries(treatmentProtocols[patientCondition as keyof typeof treatmentProtocols] || {}).map(([key, protocol]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedProtocol(key);
                      setSelectedMedications(protocol.medications);
                    }}
                    className={`w-full text-left px-3 py-2 rounded transition ${
                      selectedProtocol === key 
                        ? 'bg-medical-50 border-2 border-medical-500 text-medical-700' 
                        : 'bg-white border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium">{protocol.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {protocol.medications.map(m => m.name).join(' + ')}
                        </div>
                      </div>
                      <span className="text-sm font-bold text-emerald-600">${protocol.total}</span>
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Custom medication option */}
              <button
                onClick={() => {
                  setSelectedProtocol('custom');
                  setSelectedMedications([]);
                }}
                className={`w-full mt-2 text-left px-3 py-2 rounded transition ${
                  selectedProtocol === 'custom' 
                    ? 'bg-purple-50 border-2 border-purple-500 text-purple-700' 
                    : 'bg-white border border-dashed border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="text-sm font-medium">Custom Protocol</div>
                <div className="text-xs text-slate-500">Build your own combination</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
