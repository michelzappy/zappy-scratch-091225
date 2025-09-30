/**
 * Clinical Safety Service
 * Provides medication safety checks including drug interactions, allergies, and dosage validation
 * Critical for preventing medication errors and adverse events
 */

import { getDatabase } from '../config/database.js';

/**
 * Drug interaction database (simplified - in production, use First Databank or Lexicomp API)
 * Format: { drug1: [{ interactsWith: drug2, severity: 'critical'|'moderate'|'mild', description }] }
 */
const DRUG_INTERACTIONS = {
  'warfarin': [
    { interactsWith: 'aspirin', severity: 'critical', description: 'Increased bleeding risk' },
    { interactsWith: 'ibuprofen', severity: 'moderate', description: 'Increased bleeding risk' },
    { interactsWith: 'amoxicillin', severity: 'moderate', description: 'May increase INR' }
  ],
  'metformin': [
    { interactsWith: 'alcohol', severity: 'moderate', description: 'Risk of lactic acidosis' },
    { interactsWith: 'iodinated contrast', severity: 'critical', description: 'Risk of acute kidney injury' }
  ],
  'lisinopril': [
    { interactsWith: 'potassium', severity: 'critical', description: 'Hyperkalemia risk' },
    { interactsWith: 'ibuprofen', severity: 'moderate', description: 'Reduced antihypertensive effect' }
  ],
  'sildenafil': [
    { interactsWith: 'nitroglycerin', severity: 'critical', description: 'Severe hypotension risk' },
    { interactsWith: 'isosorbide', severity: 'critical', description: 'Severe hypotension risk' }
  ],
  'tramadol': [
    { interactsWith: 'sertraline', severity: 'moderate', description: 'Serotonin syndrome risk' },
    { interactsWith: 'fluoxetine', severity: 'moderate', description: 'Serotonin syndrome risk' }
  ]
};

/**
 * Common allergy cross-reactivity patterns
 */
const ALLERGY_CROSS_REACTIVITY = {
  'penicillin': ['amoxicillin', 'ampicillin', 'cephalexin'],
  'sulfa': ['sulfamethoxazole', 'trimethoprim-sulfamethoxazole'],
  'nsaid': ['ibuprofen', 'naproxen', 'aspirin', 'diclofenac']
};

/**
 * Check for drug-drug interactions
 * @param {Array} newMedications - Array of medication objects to be prescribed
 * @param {Array} currentMedications - Array of patient's current medications
 * @returns {Object} - { critical: [], moderate: [], mild: [] }
 */
export const checkDrugInteractions = async (newMedications, currentMedications = []) => {
  const interactions = {
    critical: [],
    moderate: [],
    mild: []
  };

  if (!Array.isArray(newMedications) || newMedications.length === 0) {
    return interactions;
  }

  // Normalize medication names to lowercase for comparison
  const normalizeString = (str) => String(str || '').toLowerCase().trim();
  
  const currentMedNames = Array.isArray(currentMedications) 
    ? currentMedications.map(med => normalizeString(typeof med === 'string' ? med : med.name))
    : [];

  // Check each new medication against current medications
  for (const newMed of newMedications) {
    const newMedName = normalizeString(typeof newMed === 'string' ? newMed : newMed.name);
    
    if (!newMedName) continue;

    // Check against known interaction database
    const knownInteractions = DRUG_INTERACTIONS[newMedName] || [];
    
    for (const interaction of knownInteractions) {
      const interactingDrug = normalizeString(interaction.interactsWith);
      
      // Check if patient is taking the interacting drug
      if (currentMedNames.some(med => med.includes(interactingDrug) || interactingDrug.includes(med))) {
        const interactionDetail = {
          medication1: newMedName,
          medication2: interaction.interactsWith,
          severity: interaction.severity,
          description: interaction.description,
          recommendation: getInteractionRecommendation(interaction.severity)
        };

        interactions[interaction.severity].push(interactionDetail);
      }
    }

    // Also check new medications against each other
    for (const otherNewMed of newMedications) {
      if (newMed === otherNewMed) continue;
      
      const otherMedName = normalizeString(typeof otherNewMed === 'string' ? otherNewMed : otherNewMed.name);
      
      for (const interaction of knownInteractions) {
        const interactingDrug = normalizeString(interaction.interactsWith);
        
        if (otherMedName.includes(interactingDrug) || interactingDrug.includes(otherMedName)) {
          interactions[interaction.severity].push({
            medication1: newMedName,
            medication2: otherMedName,
            severity: interaction.severity,
            description: interaction.description,
            recommendation: getInteractionRecommendation(interaction.severity)
          });
        }
      }
    }
  }

  return interactions;
};

/**
 * Check for allergy conflicts
 * @param {Array} medications - Medications to check
 * @param {String|Array} patientAllergies - Patient's known allergies
 * @returns {Array} - Array of allergy conflicts
 */
export const checkAllergies = async (medications, patientAllergies = []) => {
  const conflicts = [];

  if (!medications || medications.length === 0) {
    return conflicts;
  }

  // Parse patient allergies
  let allergies = [];
  if (typeof patientAllergies === 'string') {
    allergies = patientAllergies.split(',').map(a => a.toLowerCase().trim());
  } else if (Array.isArray(patientAllergies)) {
    allergies = patientAllergies.map(a => String(a).toLowerCase().trim());
  }

  if (allergies.length === 0 || (allergies.length === 1 && !allergies[0])) {
    return conflicts;
  }

  for (const med of medications) {
    const medName = (typeof med === 'string' ? med : med.name || '').toLowerCase().trim();
    
    if (!medName) continue;

    // Direct allergy match
    for (const allergy of allergies) {
      if (!allergy) continue;
      
      if (medName.includes(allergy) || allergy.includes(medName)) {
        conflicts.push({
          medication: medName,
          allergy: allergy,
          type: 'direct',
          severity: 'critical',
          recommendation: 'Do not prescribe - direct allergy match'
        });
      }

      // Check cross-reactivity
      for (const [allergyGroup, crossReactiveMeds] of Object.entries(ALLERGY_CROSS_REACTIVITY)) {
        if (allergy.includes(allergyGroup)) {
          for (const crossReactiveMed of crossReactiveMeds) {
            if (medName.includes(crossReactiveMed.toLowerCase())) {
              conflicts.push({
                medication: medName,
                allergy: allergy,
                type: 'cross-reactive',
                severity: 'high',
                crossReactiveGroup: allergyGroup,
                recommendation: `Caution: May cross-react with ${allergyGroup} allergy`
              });
            }
          }
        }
      }
    }
  }

  return conflicts;
};

/**
 * Validate medication dosage based on patient parameters
 * @param {Object} medication - Medication object with dosage info
 * @param {Object} patientData - Patient data including age, weight, renal function
 * @returns {Object} - { valid: boolean, warnings: [], recommendations: [] }
 */
export const validateDosage = async (medication, patientData) => {
  const result = {
    valid: true,
    warnings: [],
    recommendations: [],
    adjustmentNeeded: false,
    suggestedDosage: null
  };

  const { age, weight, renalFunction, hepaticFunction } = patientData;
  const medName = (medication.name || '').toLowerCase();
  const dosage = medication.dose || medication.dosage;

  // Age-based warnings
  if (age < 18) {
    result.warnings.push('Pediatric patient - verify dosage is appropriate for age');
  }
  
  if (age >= 65) {
    result.warnings.push('Geriatric patient - consider dose reduction and increased monitoring');
  }

  // Weight-based checks (simplified - real implementation would be drug-specific)
  if (weight && weight < 50) {
    result.warnings.push('Low body weight - consider dose adjustment');
  }

  // Renal function checks
  if (renalFunction && renalFunction.toLowerCase().includes('impaired')) {
    const renalExcretedDrugs = ['metformin', 'gabapentin', 'lisinopril', 'enalapril'];
    
    if (renalExcretedDrugs.some(drug => medName.includes(drug))) {
      result.warnings.push('Renal impairment - dose adjustment required');
      result.adjustmentNeeded = true;
      result.recommendations.push('Consult renal dosing guidelines or pharmacist');
    }
  }

  // Hepatic function checks
  if (hepaticFunction && hepaticFunction.toLowerCase().includes('impaired')) {
    const hepaticMetabolizedDrugs = ['warfarin', 'simvastatin', 'metoprolol'];
    
    if (hepaticMetabolizedDrugs.some(drug => medName.includes(drug))) {
      result.warnings.push('Hepatic impairment - dose adjustment may be required');
      result.adjustmentNeeded = true;
      result.recommendations.push('Consider dose reduction and increased monitoring');
    }
  }

  return result;
};

/**
 * Perform comprehensive medication safety check
 * @param {Object} params - { medications, patientData }
 * @returns {Object} - Complete safety assessment
 */
export const performComprehensiveSafetyCheck = async (params) => {
  const {
    medications = [],
    patientData = {}
  } = params;

  const {
    currentMedications = [],
    allergies = [],
    age,
    weight,
    renalFunction,
    hepaticFunction,
    pregnancyStatus,
    breastfeeding
  } = patientData;

  // Run all safety checks
  const [interactions, allergyConflicts, dosageValidations] = await Promise.all([
    checkDrugInteractions(medications, currentMedications),
    checkAllergies(medications, allergies),
    Promise.all(medications.map(med => validateDosage(med, patientData)))
  ]);

  // Pregnancy/breastfeeding checks
  const pregnancyWarnings = [];
  if (pregnancyStatus === 'pregnant' || breastfeeding) {
    pregnancyWarnings.push({
      severity: 'high',
      message: 'Patient is pregnant or breastfeeding - verify medication safety category'
    });
  }

  // Compile overall safety assessment
  const hasCriticalIssues = 
    interactions.critical.length > 0 || 
    allergyConflicts.some(c => c.severity === 'critical');

  const hasModerateIssues = 
    interactions.moderate.length > 0 || 
    allergyConflicts.some(c => c.severity === 'high') ||
    dosageValidations.some(v => v.adjustmentNeeded);

  return {
    overallSafety: hasCriticalIssues ? 'unsafe' : hasModerateIssues ? 'caution' : 'safe',
    requiresPharmacistReview: hasCriticalIssues,
    requiresProviderAcknowledgment: hasModerateIssues || hasCriticalIssues,
    interactions,
    allergyConflicts,
    dosageValidations,
    pregnancyWarnings,
    summary: {
      criticalIssues: interactions.critical.length + allergyConflicts.filter(c => c.severity === 'critical').length,
      warnings: interactions.moderate.length + allergyConflicts.length + dosageValidations.filter(v => v.warnings.length > 0).length,
      medicationsChecked: medications.length
    },
    timestamp: new Date().toISOString()
  };
};

/**
 * Get recommendation based on interaction severity
 * @param {string} severity - Interaction severity
 * @returns {string} - Recommendation
 */
const getInteractionRecommendation = (severity) => {
  const recommendations = {
    critical: 'Do not prescribe together - consider alternative medication',
    moderate: 'Use with caution - monitor closely for adverse effects',
    mild: 'Monitor for interaction - no immediate contraindication'
  };
  
  return recommendations[severity] || 'Review interaction and proceed with clinical judgment';
};

/**
 * Log clinical decision for audit trail
 * @param {Object} decisionData - Clinical decision data
 */
export const logClinicalDecision = async (decisionData) => {
  const db = getDatabase();
  
  try {
    await db`
      INSERT INTO clinical_decision_support_logs (
        consultation_id,
        provider_id,
        decision_type,
        ai_recommendation,
        provider_decision,
        deviation_reason,
        patient_safety_checked,
        drug_interaction_checked,
        allergy_checked,
        created_at
      ) VALUES (
        ${decisionData.consultationId},
        ${decisionData.providerId},
        ${decisionData.decisionType || 'medication'},
        ${JSON.stringify(decisionData.aiRecommendation || {})},
        ${JSON.stringify(decisionData.providerDecision || {})},
        ${decisionData.deviationReason || null},
        ${decisionData.safetyChecksCompleted || false},
        ${decisionData.drugInteractionChecked || false},
        ${decisionData.allergyChecked || false},
        ${new Date()}
      )
    `;
    
    console.log(`✅ Clinical decision logged for consultation ${decisionData.consultationId}`);
  } catch (error) {
    console.error('❌ Failed to log clinical decision:', error);
    // Don't throw - logging failure shouldn't block workflow
  }
};

export default {
  checkDrugInteractions,
  checkAllergies,
  validateDosage,
  performComprehensiveSafetyCheck,
  logClinicalDecision
};
