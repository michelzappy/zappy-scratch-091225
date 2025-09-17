import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Schema validation for AI responses
const validateAssessmentSchema = (data) => {
  const required = ['diagnosis', 'assessment'];
  const errors = [];
  
  if (typeof data !== 'object' || data === null) {
    errors.push('Response must be an object');
    return { isValid: false, errors };
  }
  
  required.forEach(field => {
    if (!data[field] || typeof data[field] !== 'string' || data[field].trim().length === 0) {
      errors.push(`Field '${field}' is required and must be a non-empty string`);
    }
  });
  
  if (data.differentialDiagnosis && !Array.isArray(data.differentialDiagnosis)) {
    errors.push('differentialDiagnosis must be an array if provided');
  }
  
  return { isValid: errors.length === 0, errors };
};

const validateMedicationSchema = (data) => {
  const errors = [];
  
  if (typeof data !== 'object' || data === null) {
    errors.push('Response must be an object');
    return { isValid: false, errors };
  }
  
  if (data.medications && !Array.isArray(data.medications)) {
    errors.push('medications must be an array if provided');
  } else if (data.medications) {
    data.medications.forEach((med, index) => {
      if (typeof med !== 'object' || !med.name || !med.dose) {
        errors.push(`Medication at index ${index} must have name and dose fields`);
      }
    });
  }
  
  return { isValid: errors.length === 0, errors };
};

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
      const e = new Error('AI model unavailable: missing OPENAI_API_KEY');
      e.status = 503;
      throw e;
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

      const rawResult = JSON.parse(response.choices[0].message.content);
      
      // Validate AI response schema
      const validation = validateAssessmentSchema(rawResult);
      if (!validation.isValid) {
        console.error('AI assessment validation failed:', validation.errors);
        const e = new Error('AI response validation failed');
        e.status = 502;
        throw e;
      }
      
      return {
        diagnosis: rawResult.diagnosis,
        assessment: rawResult.assessment,
        differentialDiagnosis: rawResult.differentialDiagnosis || []
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      if (error.status) {
        throw error;
      }
      const e = new Error('AI service temporarily unavailable');
      e.status = 503;
      throw e;
    }
  }

  /**
   * Generate patient-friendly message
   */
  async generatePatientMessage(diagnosis, plan, patientName) {
    if (!this.openai) {
      const e = new Error('AI model unavailable: missing OPENAI_API_KEY');
      e.status = 503;
      throw e;
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
        6. MUST include medical disclaimer that this is AI-assisted and requires provider review
        7. MUST include instruction to contact provider for concerns
        
        Keep it under 300 words and use a friendly, professional tone.
        Include this medical disclaimer: "This message contains AI-assisted recommendations and must be reviewed by a licensed healthcare provider before implementation."
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

      const patientMessage = response.choices[0].message.content;
      
      // Add compliance disclaimer if not already present
      const disclaimerText = "\n\n⚠️ IMPORTANT MEDICAL DISCLAIMER: This message contains AI-assisted recommendations that must be reviewed and approved by a licensed healthcare provider before implementation. This information is not a substitute for professional medical advice. Please contact your healthcare provider immediately if you have concerns about your condition or treatment.";
      
      if (!patientMessage.toLowerCase().includes('disclaimer') && !patientMessage.toLowerCase().includes('ai-assisted')) {
        return patientMessage + disclaimerText;
      }
      
      return patientMessage;
    } catch (error) {
      console.error('OpenAI API error:', error);
      if (error.status) {
        throw error;
      }
      const e = new Error('AI service temporarily unavailable');
      e.status = 503;
      throw e;
    }
  }

  /**
   * Generate medication recommendations
   */
  async generateMedicationRecommendations(diagnosis, patientData) {
    if (!this.openai) {
      const e = new Error('AI model unavailable: missing OPENAI_API_KEY');
      e.status = 503;
      throw e;
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

      const rawResult = JSON.parse(response.choices[0].message.content);
      
      // Validate medication recommendations schema
      const validation = validateMedicationSchema(rawResult);
      if (!validation.isValid) {
        console.error('AI medication validation failed:', validation.errors);
        const e = new Error('AI response validation failed');
        e.status = 502;
        throw e;
      }
      
      return rawResult;
    } catch (error) {
      console.error('OpenAI API error:', error);
      if (error.status) {
        throw error;
      }
      const e = new Error('AI service temporarily unavailable');
      e.status = 503;
      throw e;
    }
  }

  /**
   * Generate SOAP note from consultation data
   */
  async generateSOAPNote(consultationData, hpi, assessment, plan) {
    if (!this.openai) {
      const e = new Error('AI model unavailable: missing OPENAI_API_KEY');
      e.status = 503;
      throw e;
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
      if (error.status) {
        throw error;
      }
      const e = new Error('AI service temporarily unavailable');
      e.status = 503;
      throw e;
    }
  }

}

// Export singleton instance
export default new AIConsultationService();
