/**
 * Automated Triage Service
 * Analyzes consultation data to determine clinical risk level and urgency
 * 
 * @module services/triageService
 */

import logger from '../utils/logger.js';

/**
 * Critical symptoms that require immediate attention
 */
const CRITICAL_SYMPTOMS = [
  'chest pain',
  'shortness of breath',
  'severe bleeding',
  'loss of consciousness',
  'severe head injury',
  'stroke symptoms',
  'difficulty breathing',
  'severe allergic reaction',
  'suicide ideation',
  'severe abdominal pain',
  'uncontrolled bleeding',
  'seizure',
  'altered mental status'
];

/**
 * High-risk symptoms requiring urgent attention
 */
const HIGH_RISK_SYMPTOMS = [
  'high fever',
  'severe pain',
  'persistent vomiting',
  'severe headache',
  'vision changes',
  'severe dizziness',
  'fainting',
  'blood in stool',
  'blood in urine',
  'severe rash'
];

/**
 * SLA thresholds in minutes based on urgency
 */
export const SLA_THRESHOLDS = {
  urgent: 30,       // 30 minutes
  high: 120,        // 2 hours
  medium: 480,      // 8 hours
  routine: 1440     // 24 hours
};

/**
 * Perform automated triage on consultation data
 * 
 * @param {Object} consultationData - Consultation information
 * @param {string} consultationData.chiefComplaint - Primary complaint
 * @param {string} consultationData.symptoms - Symptom description
 * @param {Object} consultationData.vitalSigns - Vital signs if available
 * @param {Object} consultationData.medicalHistory - Patient medical history
 * @returns {Object} Triage results including score, risk level, and recommendations
 */
export const performAutomatedTriage = async (consultationData) => {
  let triageScore = 0;
  const redFlags = [];
  const recommendations = [];
  
  try {
    // Analyze symptoms text
    const symptomsText = `${consultationData.chiefComplaint || ''} ${consultationData.symptoms || ''}`.toLowerCase();
    
    // Check for critical symptoms
    CRITICAL_SYMPTOMS.forEach(symptom => {
      if (symptomsText.includes(symptom)) {
        triageScore += 50;
        redFlags.push({
          type: 'critical_symptom',
          description: symptom,
          severity: 'critical'
        });
      }
    });
    
    // Check for high-risk symptoms
    HIGH_RISK_SYMPTOMS.forEach(symptom => {
      if (symptomsText.includes(symptom)) {
        triageScore += 25;
        redFlags.push({
          type: 'high_risk_symptom',
          description: symptom,
          severity: 'high'
        });
      }
    });
    
    // Analyze vital signs if available
    if (consultationData.vitalSigns) {
      const vitalResults = analyzeVitalSigns(consultationData.vitalSigns);
      triageScore += vitalResults.score;
      redFlags.push(...vitalResults.flags);
    }
    
    // Consider age factors
    if (consultationData.age) {
      const ageResults = analyzeAgeFactors(consultationData.age, symptomsText);
      triageScore += ageResults.score;
      if (ageResults.flag) redFlags.push(ageResults.flag);
    }
    
    // Consider medical history
    if (consultationData.medicalHistory) {
      const historyResults = analyzeMedicalHistory(
        consultationData.medicalHistory,
        symptomsText
      );
      triageScore += historyResults.score;
      redFlags.push(...historyResults.flags);
    }
    
    // Determine clinical risk level
    const { clinicalRiskLevel, requiresSynchronousVisit, urgency } = 
      determineClinicalRisk(triageScore, redFlags);
    
    // Generate recommendations
    if (requiresSynchronousVisit) {
      recommendations.push({
        type: 'synchronous_visit',
        message: 'Patient should be directed to emergency care or synchronous telehealth visit',
        priority: 'critical'
      });
    }
    
    if (clinicalRiskLevel === 'high' || clinicalRiskLevel === 'critical') {
      recommendations.push({
        type: 'provider_notification',
        message: 'Immediate provider notification required',
        priority: 'high'
      });
    }
    
    // Log triage result
    logger.info('Automated triage completed', {
      triageScore,
      clinicalRiskLevel,
      redFlagCount: redFlags.length,
      requiresSynchronousVisit
    });
    
    return {
      triageScore,
      clinicalRiskLevel,
      urgency,
      redFlags,
      requiresSynchronousVisit,
      recommendations,
      slaThresholdMinutes: SLA_THRESHOLDS[urgency],
      triageCompletedAt: new Date()
    };
    
  } catch (error) {
    logger.error('Error performing automated triage', { error: error.message });
    
    // Default to high priority on error to be safe
    return {
      triageScore: 30,
      clinicalRiskLevel: 'high',
      urgency: 'high',
      redFlags: [{
        type: 'triage_error',
        description: 'Automated triage failed - defaulting to high priority',
        severity: 'high'
      }],
      requiresSynchronousVisit: false,
      recommendations: [{
        type: 'manual_review',
        message: 'Manual triage review required',
        priority: 'high'
      }],
      slaThresholdMinutes: SLA_THRESHOLDS.high,
      triageCompletedAt: new Date(),
      error: error.message
    };
  }
};

/**
 * Analyze vital signs for abnormalities
 * 
 * @param {Object} vitalSigns - Vital signs data
 * @returns {Object} Analysis results with score and flags
 */
function analyzeVitalSigns(vitalSigns) {
  let score = 0;
  const flags = [];
  
  const {
    bloodPressureSystolic,
    bloodPressureDiastolic,
    heartRate,
    temperature,
    oxygenSaturation,
    respiratoryRate
  } = vitalSigns;
  
  // Blood pressure
  if (bloodPressureSystolic) {
    if (bloodPressureSystolic > 180 || bloodPressureSystolic < 90) {
      score += 30;
      flags.push({
        type: 'vital_sign',
        description: `Critical blood pressure: ${bloodPressureSystolic}/${bloodPressureDiastolic}`,
        severity: 'critical'
      });
    } else if (bloodPressureSystolic > 160 || bloodPressureSystolic < 100) {
      score += 15;
      flags.push({
        type: 'vital_sign',
        description: `Abnormal blood pressure: ${bloodPressureSystolic}/${bloodPressureDiastolic}`,
        severity: 'high'
      });
    }
  }
  
  // Heart rate
  if (heartRate) {
    if (heartRate > 120 || heartRate < 50) {
      score += 25;
      flags.push({
        type: 'vital_sign',
        description: `Abnormal heart rate: ${heartRate} bpm`,
        severity: heartRate > 150 || heartRate < 40 ? 'critical' : 'high'
      });
    } else if (heartRate > 100 || heartRate < 60) {
      score += 10;
      flags.push({
