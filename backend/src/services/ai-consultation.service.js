import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

class AIConsultationService {
  constructor() {
    // Initialize OpenAI client when API key is provided
    this.openai = process.env.OPENAI_API_KEY ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    }) : null;
    
    this.model = process.env.AI_MODEL || 'gpt-4';
    this.temperature = parseFloat(process.env.AI_TEMPERATURE || '0.7');
    this.maxTokens = parseInt(process.env.AI_MAX_TOKENS || '1000');
  }

  /**
   * Generate AI assessment based on HPI and consultation data
   */
  async generateAssessment(consultationData, hpi) {
    if (!this.openai) {
      return this.getMockAssessment(consultationData);
    }

    try {
      const prompt = `
        As a medical professional, provide a clinical assessment based on the following patient information:
        
        Chief Complaint: ${hpi.chiefComplaint}
        Onset: ${hpi.onset}
        Location: ${hpi.location}
        Duration: ${hpi.duration}
        Characteristics: ${hpi.characteristics}
        Aggravating Factors: ${hpi.aggravatingFactors}
        Relieving Factors: ${hpi.relievingFactors}
        Severity: ${hpi.severity}
        Context/Previous Treatments: ${hpi.context}
        
        Patient Demographics:
        - Age: ${consultationData.age}
        - Gender: ${consultationData.gender}
        - Allergies: ${consultationData.allergies}
        - Current Medications: ${consultationData.current_medications}
        - Past Medical History: ${consultationData.past_medical_history}
        
        Please provide:
        1. A specific diagnosis
        2. A comprehensive treatment plan
        3. Key differential diagnoses to consider
        
        Format the response as JSON with fields: diagnosis, assessment, differentialDiagnosis
      `;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a medical assistant helping providers with clinical assessments. Provide evidence-based recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content);
      return {
        diagnosis: result.diagnosis,
        assessment: result.assessment,
        differentialDiagnosis: result.differentialDiagnosis || []
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.getMockAssessment(consultationData);
    }
  }

  /**
   * Generate patient-friendly message
   */
  async generatePatientMessage(diagnosis, plan, patientName) {
    if (!this.openai) {
      return this.getMockPatientMessage(diagnosis, plan, patientName);
    }

    try {
      const prompt = `
        Create a warm, professional message to a patient explaining their diagnosis and treatment plan.
        
        Patient Name: ${patientName}
        Diagnosis: ${diagnosis}
        Treatment Plan: ${JSON.stringify(plan)}
        
        The message should:
        1. Be empathetic and reassuring
        2. Explain the diagnosis in simple terms
        3. Clearly outline the treatment plan and medications
        4. Include important instructions and expectations
        5. End with encouragement and next steps
        
        Keep it under 300 words and use a friendly, professional tone.
      `;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a healthcare provider writing a message to a patient. Use clear, simple language and be empathetic.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 500
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.getMockPatientMessage(diagnosis, plan, patientName);
    }
  }

  /**
   * Generate medication recommendations
   */
  async generateMedicationRecommendations(diagnosis, patientData) {
    if (!this.openai) {
      return this.getMockMedicationRecommendations(diagnosis);
    }

    try {
      const prompt = `
        Based on the diagnosis and patient information, recommend appropriate medications:
        
        Diagnosis: ${diagnosis}
        Patient Age: ${patientData.age}
        Allergies: ${patientData.allergies}
        Current Medications: ${patientData.current_medications}
        
        Provide medication recommendations including:
        1. First-line treatment options
        2. Alternative medications if allergies/contraindications exist
        3. Dosing recommendations
        4. Duration of treatment
        5. Important side effects to monitor
        
        Format as JSON with fields: medications (array), monitoring, duration
      `;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a clinical decision support system providing medication recommendations. Always consider drug interactions and contraindications.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: this.maxTokens,
        response_format: { type: 'json_object' }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.getMockMedicationRecommendations(diagnosis);
    }
  }

  /**
   * Generate SOAP note from consultation data
   */
  async generateSOAPNote(consultationData, hpi, assessment, plan) {
    if (!this.openai) {
      return this.getMockSOAPNote(consultationData, hpi, assessment, plan);
    }

    try {
      const prompt = `
        Generate a complete SOAP note based on the following information:
        
        Patient: ${consultationData.first_name} ${consultationData.last_name}, ${consultationData.age}y ${consultationData.gender}
        
        HPI: ${JSON.stringify(hpi)}
        Assessment: ${assessment}
        Plan: ${JSON.stringify(plan)}
        
        Format as a proper SOAP note with:
        S (Subjective): Include chief complaint, HPI, ROS, PMH, medications, allergies
        O (Objective): Include any available objective findings
        A (Assessment): Include diagnosis and clinical reasoning
        P (Plan): Include medications, follow-up, patient education
      `;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are generating medical documentation. Create a complete, professional SOAP note.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.getMockSOAPNote(consultationData, hpi, assessment, plan);
    }
  }

  // Mock responses when OpenAI is not configured
  getMockAssessment(consultationData) {
    const assessments = {
      acne: {
        diagnosis: 'Acne vulgaris, moderate to severe, with hormonal component',
        assessment: 'Patient presents with moderate to severe inflammatory acne with post-inflammatory hyperpigmentation. The cyclical pattern correlating with menses and history of PCOS suggests a hormonal component. Combination therapy with topical retinoid and oral antibiotic is indicated.',
        differentialDiagnosis: ['Rosacea', 'Folliculitis', 'Perioral dermatitis']
      },
      default: {
        diagnosis: 'Condition requiring further evaluation',
        assessment: 'Patient presents with symptoms requiring comprehensive evaluation and treatment planning.',
        differentialDiagnosis: []
      }
    };

    // Simple keyword matching for demo
    const complaint = consultationData.chief_complaint?.toLowerCase() || '';
    if (complaint.includes('acne')) return assessments.acne;
    return assessments.default;
  }

  getMockPatientMessage(diagnosis, plan, patientName) {
    return `Dear ${patientName},

Thank you for your consultation today. After reviewing your symptoms and medical history, I've diagnosed you with ${diagnosis}.

This is a common and very treatable condition. I'm confident that with the right treatment plan, we can significantly improve your symptoms.

Your Treatment Plan:
${plan.medications?.map(med => `• ${med.name}: ${med.instructions}`).join('\n') || '• Medications as prescribed'}

Important Instructions:
• Take all medications as directed
• Be patient - improvement typically takes 6-8 weeks
• Use sun protection daily if prescribed retinoids
• Stay hydrated and maintain a healthy diet

What to Expect:
You may experience some initial dryness or mild irritation, which is normal and usually improves. If you experience severe side effects, please contact us immediately.

We'll follow up in 6-8 weeks to assess your progress. In the meantime, don't hesitate to reach out if you have any questions or concerns.

You're taking an important step toward better health, and I'm here to support you throughout your treatment journey.

Best regards,
Dr. Smith`;
  }

  getMockMedicationRecommendations(diagnosis) {
    const recommendations = {
      'acne': {
        medications: [
          {
            name: 'Tretinoin 0.025%',
            dose: 'Apply thin layer at bedtime',
            duration: '12 weeks minimum',
            sideEffects: 'Initial dryness, purging, photosensitivity'
          },
          {
            name: 'Doxycycline 100mg',
            dose: 'Twice daily with food',
            duration: '3 months',
            sideEffects: 'GI upset, photosensitivity'
          }
        ],
        monitoring: 'Follow up in 6-8 weeks to assess response',
        duration: '3-6 months initial treatment'
      },
      'default': {
        medications: [],
        monitoring: 'Regular follow-up recommended',
        duration: 'As clinically indicated'
      }
    };

    const condition = diagnosis?.toLowerCase() || '';
    if (condition.includes('acne')) return recommendations.acne;
    return recommendations.default;
  }

  getMockSOAPNote(consultationData, hpi, assessment, plan) {
    return `SOAP NOTE

Date: ${new Date().toLocaleDateString()}
Patient: ${consultationData.first_name} ${consultationData.last_name}
DOB: ${consultationData.date_of_birth} (${consultationData.age} years old)

SUBJECTIVE:
Chief Complaint: ${hpi.chiefComplaint}

History of Present Illness:
The patient presents with ${hpi.chiefComplaint}. Symptoms began ${hpi.onset} and have been present for ${hpi.duration}. 
Location: ${hpi.location}
Character: ${hpi.characteristics}
Aggravating factors: ${hpi.aggravatingFactors}
Relieving factors: ${hpi.relievingFactors}
Timing: ${hpi.timing}
Severity: ${hpi.severity}
Context: ${hpi.context}

Past Medical History: ${consultationData.past_medical_history || 'As documented'}
Current Medications: ${consultationData.current_medications}
Allergies: ${consultationData.allergies}
Social History: Non-contributory

Review of Systems: 
Constitutional: Denies fever, chills, weight loss
Skin: As per HPI
All other systems: Negative

OBJECTIVE:
Vital Signs: Within normal limits
Physical Exam: Limited telehealth examination
Skin: Unable to fully assess via video, patient-provided photos show ${hpi.characteristics}

ASSESSMENT:
${assessment}

PLAN:
1. Medications:
${plan.medications?.map(med => `   - ${med.name}: ${med.instructions}`).join('\n') || '   As prescribed'}

2. Patient Education:
   - Counseled on diagnosis and treatment expectations
   - Discussed proper medication use and potential side effects
   - Emphasized importance of adherence and sun protection

3. Follow-up:
   - Scheduled in 6-8 weeks to assess treatment response
   - Patient instructed to contact if symptoms worsen or side effects occur

Provider: Dr. Smith, MD
Electronically signed at ${new Date().toLocaleString()}`;
  }
}

// Export singleton instance
export default new AIConsultationService();
