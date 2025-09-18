import OpenAI from 'openai';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Comprehensive Zod schemas for AI response validation
const AssessmentResponseSchema = z.object({
  diagnosis: z.string()
    .min(1, 'Diagnosis is required')
    .max(500, 'Diagnosis too long')
    .refine(val => val.trim().length > 0, 'Diagnosis cannot be empty'),
  
  assessment: z.string()
    .min(10, 'Assessment must be at least 10 characters')
    .max(2000, 'Assessment too long')
    .refine(val => val.trim().length > 0, 'Assessment cannot be empty'),
  
  differentialDiagnosis: z.array(z.string().min(1)).optional().default([]),
  
  // Optional fields that might be included
  severity: z.enum(['mild', 'moderate', 'severe']).optional(),
  urgency: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  followUpRequired: z.boolean().optional(),
  redFlags: z.array(z.string()).optional().default([])
});

const MedicationSchema = z.object({
  name: z.string()
    .min(1, 'Medication name is required')
    .max(200, 'Medication name too long'),
  
  dose: z.string()
    .min(1, 'Dose is required')
    .max(100, 'Dose description too long'),
  
  frequency: z.string()
    .min(1, 'Frequency is required')
    .max(100, 'Frequency description too long'),
  
  duration: z.string().optional(),
  instructions: z.string().optional(),
  sideEffects: z.array(z.string()).optional().default([]),
  contraindications: z.array(z.string()).optional().default([])
});

const MedicationResponseSchema = z.object({
  medications: z.array(MedicationSchema).optional().default([]),
  
  monitoring: z.string().optional(),
  
  duration: z.string().optional(),
  
  // Additional safety fields
  drugInteractions: z.array(z.string()).optional().default([]),
  allergicReactions: z.array(z.string()).optional().default([]),
  specialInstructions: z.string().optional()
});

const SOAPNoteSchema = z.object({
  subjective: z.string().min(10, 'Subjective section too short'),
  objective: z.string().min(5, 'Objective section too short'),
  assessment: z.string().min(10, 'Assessment section too short'),
  plan: z.string().min(10, 'Plan section too short')
});

// Validation helper functions with comprehensive error logging
const validateAIResponse = (schema, data, responseType) => {
  try {
    const validatedData = schema.parse(data);
    console.log(`✅ AI ${responseType} validation successful`);
    return { success: true, data: validatedData, errors: null };
  } catch (error) {
    const validationErrors = error.errors || [{ message: error.message }];
    
    console.error(`❌ AI ${responseType} validation failed:`, {
      timestamp: new Date().toISOString(),
      responseType,
      errors: validationErrors,
      rawData: JSON.stringify(data, null, 2)
    });
    
    // Log specific validation issues for monitoring
    validationErrors.forEach(err => {
      console.error(`  - Field: ${err.path?.join('.') || 'root'}, Issue: ${err.message}`);
    });
    
    return { 
      success: false, 
      data: null, 
      errors: validationErrors.map(err => ({
        field: err.path?.join('.') || 'root',
        message: err.message,
        code: err.code
      }))
    };
  }
};

// Enhanced error handling for AI response parsing
const safeParseAIResponse = (responseContent, responseType) => {
  try {
    const parsedData = JSON.parse(responseContent);
    console.log(`📥 AI ${responseType} response received:`, {
      timestamp: new Date().toISOString(),
      responseType,
      hasData: !!parsedData
    });
    return { success: true, data: parsedData, error: null };
  } catch (error) {
    console.error(`❌ AI ${responseType} JSON parsing failed:`, {
      timestamp: new Date().toISOString(),
      responseType,
      error: error.message,
      rawContent: responseContent?.substring(0, 200) + '...'
    });
    return { 
      success: false, 
      data: null, 
      error: `Invalid JSON response from AI: ${error.message}` 
    };
  }
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
        Ensure diagnosis is concise but specific, assessment is comprehensive, and differentialDiagnosis is an array of strings.
      `;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a medical assistant helping providers with clinical assessments. Provide evidence-based recommendations. Always return valid JSON with the exact fields requested.'
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

      // Safe JSON parsing with error handling
      const parseResult = safeParseAIResponse(response.choices[0].message.content, 'assessment');
      if (!parseResult.success) {
        const e = new Error(`AI response parsing failed: ${parseResult.error}`);
        e.status = 502;
        throw e;
      }

      // Comprehensive schema validation
      const validation = validateAIResponse(AssessmentResponseSchema, parseResult.data, 'assessment');
      if (!validation.success) {
        console.error('🚨 AI assessment validation failed - potential data corruption risk');
        const e = new Error(`AI response validation failed: ${validation.errors.map(err => err.message).join(', ')}`);
        e.status = 502;
        e.validationErrors = validation.errors;
        throw e;
      }
      
      console.log('✅ AI assessment validated and safe for persistence');
      return validation.data;
      
    } catch (error) {
      console.error('OpenAI API error:', {
        timestamp: new Date().toISOString(),
        error: error.message,
        status: error.status,
        validationErrors: error.validationErrors
      });
      
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
      
      console.log('✅ Patient message generated with proper disclaimers');
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
        
        Format as JSON with fields: medications (array with name, dose, frequency), monitoring, duration
        Each medication must have: name, dose, frequency (all required strings)
      `;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a clinical decision support system providing medication recommendations. Always consider drug interactions and contraindications. Return valid JSON with exact fields requested.'
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

      // Safe JSON parsing with error handling
      const parseResult = safeParseAIResponse(response.choices[0].message.content, 'medication');
      if (!parseResult.success) {
        const e = new Error(`AI response parsing failed: ${parseResult.error}`);
        e.status = 502;
        throw e;
      }

      // Comprehensive schema validation
      const validation = validateAIResponse(MedicationResponseSchema, parseResult.data, 'medication');
      if (!validation.success) {
        console.error('🚨 AI medication validation failed - potential medication safety risk');
        const e = new Error(`AI medication response validation failed: ${validation.errors.map(err => err.message).join(', ')}`);
        e.status = 502;
        e.validationErrors = validation.errors;
        throw e;
      }
      
      console.log('✅ AI medication recommendations validated and safe for clinical use');
      return validation.data;
      
    } catch (error) {
      console.error('OpenAI API error:', {
        timestamp: new Date().toISOString(),
        error: error.message,
        status: error.status,
        validationErrors: error.validationErrors
      });
      
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

      const soapNote = response.choices[0].message.content;
      
      // Basic validation for SOAP note structure
      if (!soapNote || soapNote.trim().length < 50) {
        console.error('🚨 AI SOAP note validation failed - insufficient content');
        const e = new Error('AI generated SOAP note is too short or empty');
        e.status = 502;
        throw e;
      }
      
      console.log('✅ AI SOAP note generated successfully');
      return soapNote;
      
    } catch (error) {
      console.error('OpenAI API error:', {
        timestamp: new Date().toISOString(),
        error: error.message,
        status: error.status
      });
      
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
