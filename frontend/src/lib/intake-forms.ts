// Progressive Disclosure Intake Forms for DTC Telehealth Platform
// Step-based flow with email capture and personalized engagement

export interface IntakeQuestion {
  id: string;
  question: string;
  type: 'select' | 'multiselect' | 'text' | 'number' | 'yesno' | 'scale' | 'date' | 'height' | 'blood_pressure' | 'textarea' | 'email' | 'phone';
  options?: string[];
  required: boolean;
  placeholder?: string;
  helpText?: string;
  followUp?: { 
    condition: { field: string; value: any };
    questions: IntakeQuestion[];
  };
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  skipLogic?: {
    field: string;
    value: any;
    action: 'show' | 'hide';
  };
}

export interface IntakeStep {
  stepNumber: number;
  title: string;
  subtitle?: string;
  questions: IntakeQuestion[]; // Max 1-2 questions per step
  stepType: 'symptom' | 'medical' | 'email' | 'personal' | 'payment' | 'lifestyle';
}

export interface IntakeForm {
  name: string;
  icon: string;
  estimatedTime: string;
  description: string;
  steps: IntakeStep[]; // Changed from sections to steps
  totalSteps: number;
  disclaimers?: string[];
}

// Progress milestones for progress bar
export interface ProgressMilestone {
  range: [number, number]; // [startStep, endStep]
  label: string;
  percentage: number;
}

export const progressMilestones: ProgressMilestone[] = [
  { range: [1, 2], label: 'Understanding Your Needs', percentage: 25 },
  { range: [3, 5], label: 'Medical Review', percentage: 50 },
  { range: [6, 8], label: 'Treatment Planning', percentage: 75 },
  { range: [9, 11], label: 'Finalizing Details', percentage: 100 }
];

// Email capture step template
const createEmailCaptureStep = (stepNumber: number, title: string, subtitle: string): IntakeStep => ({
  stepNumber,
  title,
  subtitle,
  stepType: 'email',
  questions: [{
    id: 'email',
    question: 'What\'s your email address?',
    type: 'email',
    required: true,
    placeholder: 'your@email.com',
    validation: { 
      pattern: '^[^@]+@[^@]+\\.[^@]+$', 
      message: 'Please enter a valid email address' 
    }
  }]
});

// Personal details steps template
const createPersonalDetailsSteps = (startStep: number): IntakeStep[] => [
  {
    stepNumber: startStep,
    title: "Almost Done!",
    subtitle: "Just need a few details to complete your consultation",
    stepType: 'personal',
    questions: [{
      id: 'full_name',
      question: 'What\'s your full name?',
      type: 'text',
      required: true,
      placeholder: 'First and Last Name'
    }]
  },
  {
    stepNumber: startStep + 1,
    title: "Contact Information",
    stepType: 'personal',
    questions: [
      {
        id: 'phone',
        question: 'Phone number',
        type: 'phone',
        required: true,
        placeholder: '(555) 123-4567',
        validation: {
          pattern: '^[\\d\\s\\(\\)\\-\\+]+$',
          message: 'Please enter a valid phone number'
        }
      },
      {
        id: 'address',
        question: 'Shipping address',
        type: 'textarea',
        required: true,
        placeholder: 'Street Address, City, State, ZIP'
      }
    ]
  },
  {
    stepNumber: startStep + 2,
    title: "Payment & Insurance",
    stepType: 'payment',
    questions: [{
      id: 'insurance_type',
      question: 'How would you like to pay?',
      type: 'select',
      options: ['Insurance', 'Self-pay', 'HSA/FSA'],
      required: true
    }]
  }
];

export const intakeForms: Record<string, IntakeForm> = {
  weightLoss: {
    name: 'Weight Management & GLP-1 Consultation',
    icon: '⚖️',
    estimatedTime: '5-7 minutes',
    description: 'Personalized weight management plan with medical support',
    totalSteps: 11,
    steps: [
      // Step 1-2: Symptom Engagement
      {
        stepNumber: 1,
        title: "Let's Start With Your Goal",
        subtitle: "We're here to help you succeed",
        stepType: 'symptom',
        questions: [{
          id: 'primary_goal',
          question: 'What is your main weight loss goal?',
          type: 'select',
          options: [
            'Lose 10-20 lbs',
            'Lose 20-50 lbs', 
            'Lose 50+ lbs',
            'Maintain weight loss',
            'Improve overall health'
          ],
          required: true
        }]
      },
      {
        stepNumber: 2,
        title: "Understanding Your Journey",
        subtitle: "You're not alone in this",
        stepType: 'symptom',
        questions: [{
          id: 'biggest_challenge',
          question: 'What\'s your biggest challenge with losing weight?',
          type: 'select',
          options: [
            'Constant hunger and cravings',
            'Emotional or stress eating',
            'No time for meal prep or exercise',
            'Slow metabolism',
            'Medical conditions make it harder',
            'Nothing seems to work long-term'
          ],
          required: true
        }]
      },
      // Step 3: Core Medical Safety
      {
        stepNumber: 3,
        title: "Quick Safety Check",
        stepType: 'medical',
        questions: [{
          id: 'current_medications',
          question: 'Are you currently taking any medications?',
          type: 'yesno',
          required: true,
          helpText: 'This helps us ensure safe treatment options'
        }]
      },
      // Step 4: Email Capture
      createEmailCaptureStep(
        4,
        "Save Your Progress",
        "Get your personalized weight loss plan delivered to your inbox"
      ),
      // Step 5-8: Progressive Medical History
      {
        stepNumber: 5,
        title: "Your Current Stats",
        stepType: 'medical',
        questions: [
          {
            id: 'current_weight',
            question: 'Current weight (lbs)',
            type: 'number',
            required: true,
            validation: { min: 50, max: 800 }
          },
          {
            id: 'height',
            question: 'Height',
            type: 'height',
            required: true,
            placeholder: "5'8\" or 173cm"
          }
        ]
      },
      {
        stepNumber: 6,
        title: "Medical History",
        stepType: 'medical',
        questions: [{
          id: 'medical_conditions',
          question: 'Do you have any of these conditions?',
          type: 'multiselect',
          options: [
            'Diabetes',
            'High blood pressure',
            'High cholesterol',
            'Thyroid disorder',
            'PCOS',
            'None of these'
          ],
          required: true
        }]
      },
      {
        stepNumber: 7,
        title: "What You've Tried",
        stepType: 'lifestyle',
        questions: [{
          id: 'previous_attempts',
          question: 'What weight loss methods have you tried before?',
          type: 'multiselect',
          options: [
            'Diet changes',
            'Exercise programs',
            'Weight loss medications',
            'GLP-1 medications',
            'Surgery',
            'Nothing yet'
          ],
          required: true
        }]
      },
      {
        stepNumber: 8,
        title: "Your Lifestyle",
        stepType: 'lifestyle',
        questions: [{
          id: 'exercise_frequency',
          question: 'How often do you exercise?',
          type: 'select',
          options: [
            'Never',
            '1-2 times per week',
            '3-4 times per week',
            '5+ times per week'
          ],
          required: true
        }]
      },
      // Step 9-11: Personal Details
      ...createPersonalDetailsSteps(9)
    ],
    disclaimers: [
      'Prescription medications require medical evaluation',
      'Individual results may vary'
    ]
  },

  hairLoss: {
    name: 'Hair Loss & Restoration Consultation',
    icon: '💇',
    estimatedTime: '5-7 minutes',
    description: 'Expert hair loss treatment with proven medications',
    totalSteps: 11,
    steps: [
      // Step 1-2: Symptom Engagement
      {
        stepNumber: 1,
        title: "Let's Address Your Hair Loss",
        subtitle: "We understand how this affects you",
        stepType: 'symptom',
        questions: [{
          id: 'hair_loss_location',
          question: 'Where are you noticing hair loss?',
          type: 'multiselect',
          options: [
            'Receding hairline',
            'Crown/top of head',
            'Temples',
            'Overall thinning',
            'Patches'
          ],
          required: true
        }]
      },
      {
        stepNumber: 2,
        title: "Timeline",
        subtitle: "Understanding your pattern",
        stepType: 'symptom',
        questions: [{
          id: 'duration',
          question: 'How long has this been happening?',
          type: 'select',
          options: [
            'Just started (less than 6 months)',
            '6-12 months',
            '1-2 years',
            '2-5 years',
            'More than 5 years'
          ],
          required: true
        }]
      },
      // Step 3: Core Medical Safety
      {
        stepNumber: 3,
        title: "Quick Medical Check",
        stepType: 'medical',
        questions: [{
          id: 'medical_conditions',
          question: 'Do you have any scalp conditions or autoimmune diseases?',
          type: 'yesno',
          required: true,
          helpText: 'This helps determine the best treatment approach'
        }]
      },
      // Step 4: Email Capture
      createEmailCaptureStep(
        4,
        "Save Your Assessment",
        "Get your personalized hair restoration plan"
      ),
      // Step 5-8: Progressive Medical History
      {
        stepNumber: 5,
        title: "Hair Loss Pattern",
        stepType: 'medical',
        questions: [{
          id: 'family_history',
          question: 'Does hair loss run in your family?',
          type: 'select',
          options: [
            'Yes - mother\'s side',
            'Yes - father\'s side',
            'Yes - both sides',
            'No',
            'Not sure'
          ],
          required: true
        }]
      },
      {
        stepNumber: 6,
        title: "Previous Treatments",
        stepType: 'medical',
        questions: [{
          id: 'tried_treatments',
          question: 'Have you tried any hair loss treatments?',
          type: 'multiselect',
          options: [
            'Minoxidil (Rogaine)',
            'Finasteride (Propecia)',
            'Supplements',
            'Special shampoos',
            'None yet'
          ],
          required: true
        }]
      },
      {
        stepNumber: 7,
        title: "Rate of Loss",
        stepType: 'medical',
        questions: [{
          id: 'loss_rate',
          question: 'How quickly is your hair loss progressing?',
          type: 'select',
          options: [
            'Very gradual',
            'Steady progression',
            'Rapid',
            'Sudden'
          ],
          required: true
        }]
      },
      {
        stepNumber: 8,
        title: "Lifestyle Factors",
        stepType: 'lifestyle',
        questions: [{
          id: 'stress_level',
          question: 'How would you rate your current stress level?',
          type: 'scale',
          options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
          required: true,
          helpText: 'Stress can impact hair health'
        }]
      },
      // Step 9-11: Personal Details
      ...createPersonalDetailsSteps(9)
    ]
  },

  mensHealth: {
    name: 'Men\'s Health & ED Consultation',
    icon: '👨‍⚕️',
    estimatedTime: '5-7 minutes',
    description: 'Confidential treatment for ED and men\'s wellness',
    totalSteps: 11,
    steps: [
      // Step 1-2: Symptom Engagement
      {
        stepNumber: 1,
        title: "Let's Help You Feel Your Best",
        subtitle: "Your health matters - let's address it together",
        stepType: 'symptom',
        questions: [{
          id: 'primary_concern',
          question: 'What brings you here today?',
          type: 'select',
          options: [
            'Erectile dysfunction',
            'Performance anxiety',
            'Low energy/libido',
            'Premature ejaculation',
            'General wellness'
          ],
          required: true
        }]
      },
      {
        stepNumber: 2,
        title: "Understanding the Impact",
        subtitle: "You're not alone - we can help",
        stepType: 'symptom',
        questions: [{
          id: 'duration',
          question: 'How long have you noticed this?',
          type: 'select',
          options: [
            'Recently (less than 3 months)',
            '3-6 months',
            '6-12 months',
            'Over a year',
            'It varies'
          ],
          required: true
        }]
      },
      // Step 3: Core Medical Safety
      {
        stepNumber: 3,
        title: "Important Health Check",
        stepType: 'medical',
        questions: [{
          id: 'heart_conditions',
          question: 'Do you have diabetes, heart disease, or high blood pressure?',
          type: 'yesno',
          required: true,
          helpText: 'These conditions affect treatment options'
        }]
      },
      // Step 4: Email Capture
      createEmailCaptureStep(
        4,
        "Secure Your Results",
        "Your confidential consultation results will be sent here"
      ),
      // Step 5-8: Progressive Medical History
      {
        stepNumber: 5,
        title: "Severity Assessment",
        stepType: 'medical',
        questions: [{
          id: 'severity',
          question: 'How would you rate the severity? (1 = mild, 10 = severe)',
          type: 'scale',
          options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
          required: true
        }]
      },
      {
        stepNumber: 6,
        title: "Current Medications",
        stepType: 'medical',
        questions: [{
          id: 'current_medications',
          question: 'Are you taking any medications?',
          type: 'text',
          placeholder: 'List any current medications or type "None"',
          required: true
        }]
      },
      {
        stepNumber: 7,
        title: "Lifestyle Factors",
        stepType: 'lifestyle',
        questions: [
          {
            id: 'smoking',
            question: 'Do you smoke?',
            type: 'select',
            options: ['Never', 'Occasionally', 'Daily', 'Quit'],
            required: true
          },
          {
            id: 'alcohol',
            question: 'Alcohol consumption?',
            type: 'select',
            options: ['Never', 'Occasionally', '1-2 drinks/day', '3+ drinks/day'],
            required: true
          }
        ]
      },
      {
        stepNumber: 8,
        title: "Relationship Status",
        stepType: 'personal',
        questions: [{
          id: 'relationship',
          question: 'Are you in a relationship?',
          type: 'select',
          options: [
            'Single',
            'In a relationship',
            'Married',
            'Prefer not to say'
          ],
          required: false
        }]
      },
      // Step 9-11: Personal Details
      ...createPersonalDetailsSteps(9)
    ]
  },

  womensHealth: {
    name: 'Women\'s Health Consultation',
    icon: '👩‍⚕️',
    estimatedTime: '5-7 minutes',
    description: 'Comprehensive women\'s health and wellness care',
    totalSteps: 11,
    steps: [
      // Step 1-2: Symptom Engagement
      {
        stepNumber: 1,
        title: "How Can We Help You Today?",
        subtitle: "Your health and comfort are our priority",
        stepType: 'symptom',
        questions: [{
          id: 'primary_concern',
          question: 'What brings you here today?',
          type: 'select',
          options: [
            'Birth control consultation',
            'UTI symptoms',
            'Yeast infection',
            'Irregular periods',
            'Menopause symptoms',
            'PCOS management'
          ],
          required: true
        }]
      },
      {
        stepNumber: 2,
        title: "Duration of Symptoms",
        stepType: 'symptom',
        questions: [{
          id: 'symptom_duration',
          question: 'How long have you experienced this?',
          type: 'select',
          options: [
            'Just started',
            'Less than 1 week',
            '1-2 weeks',
            '2-4 weeks',
            'More than a month'
          ],
          required: true
        }]
      },
      // Step 3: Core Medical Safety
      {
        stepNumber: 3,
        title: "Important Health Question",
        stepType: 'medical',
        questions: [{
          id: 'pregnancy_status',
          question: 'Could you be pregnant?',
          type: 'select',
          options: [
            'No - using contraception',
            'No - not sexually active',
            'Possibly',
            'Yes',
            'Currently pregnant'
          ],
          required: true
        }]
      },
      // Step 4: Email Capture
      createEmailCaptureStep(
        4,
        "Secure Your Information",
        "Your confidential health plan will be sent here"
      ),
      // Step 5-8: Progressive Medical History
      {
        stepNumber: 5,
        title: "Menstrual History",
        stepType: 'medical',
        questions: [{
          id: 'last_period',
          question: 'When was your last menstrual period?',
          type: 'date',
          required: true
        }]
      },
      {
        stepNumber: 6,
        title: "Medical Conditions",
        stepType: 'medical',
        questions: [{
          id: 'conditions',
          question: 'Do you have any of these conditions?',
          type: 'multiselect',
          options: [
            'PCOS',
            'Endometriosis',
            'Thyroid disorder',
            'High blood pressure',
            'None of these'
          ],
          required: true
        }]
      },
      {
        stepNumber: 7,
        title: "Current Medications",
        stepType: 'medical',
        questions: [{
          id: 'current_medications',
          question: 'Are you taking any medications or birth control?',
          type: 'text',
          placeholder: 'List current medications or type "None"',
          required: true
        }]
      },
      {
        stepNumber: 8,
        title: "Lifestyle",
        stepType: 'lifestyle',
        questions: [{
          id: 'sexually_active',
          question: 'Are you sexually active?',
          type: 'yesno',
          required: true
        }]
      },
      // Step 9-11: Personal Details
      ...createPersonalDetailsSteps(9)
    ]
  },

  longevity: {
    name: 'Longevity & Anti-Aging Consultation',
    icon: '🧬',
    estimatedTime: '5-7 minutes',
    description: 'Optimize your healthspan with personalized protocols',
    totalSteps: 11,
    steps: [
      // Step 1-2: Symptom Engagement
      {
        stepNumber: 1,
        title: "Your Longevity Goals",
        subtitle: "Let's optimize your healthspan together",
        stepType: 'symptom',
        questions: [{
          id: 'primary_goals',
          question: 'What\'s your main longevity goal?',
          type: 'select',
          options: [
            'Increase daily energy',
            'Improve mental clarity',
            'Better sleep quality',
            'Disease prevention',
            'Slow aging process',
            'Optimize hormones'
          ],
          required: true
        }]
      },
      {
        stepNumber: 2,
        title: "How You Feel",
        stepType: 'symptom',
        questions: [{
          id: 'age_feeling',
          question: 'How do you feel compared to your actual age?',
          type: 'select',
          options: [
            'Much younger',
            'Slightly younger',
            'My age',
            'Slightly older',
            'Much older'
          ],
          required: true
        }]
      },
      // Step 3: Core Medical Safety
      {
        stepNumber: 3,
        title: "Health Status",
        stepType: 'medical',
        questions: [{
          id: 'chronic_conditions',
          question: 'Do you have any chronic health conditions?',
          type: 'yesno',
          required: true,
          helpText: 'This helps us personalize your protocol'
        }]
      },
      // Step 4: Email Capture
      createEmailCaptureStep(
        4,
        "Your Longevity Plan",
        "Receive your personalized anti-aging protocol"
      ),
      // Step 5-8: Progressive Medical History
      {
        stepNumber: 5,
        title: "Current Age",
        stepType: 'medical',
        questions: [{
          id: 'current_age',
          question: 'What is your current age?',
          type: 'number',
          required: true,
          validation: { min: 18, max: 120 }
        }]
      },
      {
        stepNumber: 6,
        title: "Family Longevity",
        stepType: 'medical',
        questions: [{
          id: 'family_longevity',
          question: 'How long did your parents/grandparents live?',
          type: 'select',
          options: [
            'Under 70',
            '70-80',
            '80-90',
            'Over 90',
            'Still living'
          ],
          required: true
        }]
      },
      {
        stepNumber: 7,
        title: "Current Supplements",
        stepType: 'medical',
        questions: [{
          id: 'supplements',
          question: 'What supplements do you currently take?',
          type: 'text',
          placeholder: 'List supplements or type "None"',
          required: true
        }]
      },
      {
        stepNumber: 8,
        title: "Activity Level",
        stepType: 'lifestyle',
        questions: [{
          id: 'exercise_frequency',
          question: 'How often do you exercise?',
          type: 'select',
          options: [
            'Never',
            '1-2 times/week',
            '3-4 times/week',
            '5+ times/week'
          ],
          required: true
        }]
      },
      // Step 9-11: Personal Details
      ...createPersonalDetailsSteps(9)
    ]
  },

  trt: {
    name: 'Testosterone Replacement Therapy',
    icon: '💪',
    estimatedTime: '5-7 minutes',
    description: 'Expert TRT assessment and treatment',
    totalSteps: 11,
    steps: [
      // Step 1-2: Symptom Engagement
      {
        stepNumber: 1,
        title: "Let's Restore Your Vitality",
        subtitle: "We understand these symptoms affect your quality of life",
        stepType: 'symptom',
        questions: [{
          id: 'primary_symptoms',
          question: 'What\'s your main concern?',
          type: 'select',
          options: [
            'Low energy and fatigue',
            'Decreased muscle mass',
            'Low libido',
            'Mood changes',
            'Poor recovery from exercise',
            'Brain fog'
          ],
          required: true
        }]
      },
      {
        stepNumber: 2,
        title: "Impact on Daily Life",
        stepType: 'symptom',
        questions: [{
          id: 'symptom_impact',
          question: 'How much do these symptoms affect your daily life?',
          type: 'scale',
          options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
          required: true,
          helpText: '1 = minimal impact, 10 = severe impact'
        }]
      },
      // Step 3: Core Medical Safety
      {
        stepNumber: 3,
        title: "Prostate Health",
        stepType: 'medical',
        questions: [{
          id: 'prostate_issues',
          question: 'Do you have any prostate issues or family history of prostate cancer?',
          type: 'yesno',
          required: true,
          helpText: 'Important for safe TRT treatment'
        }]
      },
      // Step 4: Email Capture
      createEmailCaptureStep(
        4,
        "Your TRT Assessment",
        "Get your personalized testosterone optimization plan"
      ),
      // Step 5-8: Progressive Medical History
      {
        stepNumber: 5,
        title: "Previous Testing",
        stepType: 'medical',
        questions: [{
          id: 'previous_test',
          question: 'Have you had testosterone levels checked?',
          type: 'yesno',
          required: true
        }]
      },
      {
        stepNumber: 6,
        title: "Cardiovascular Health",
        stepType: 'medical',
        questions: [{
          id: 'heart_health',
          question: 'Any heart or cardiovascular issues?',
          type: 'multiselect',
          options: [
            'Heart disease',
            'High blood pressure',
            'Blood clots',
            'None of these'
          ],
          required: true
        }]
      },
      {
        stepNumber: 7,
        title: "Family Planning",
        stepType: 'medical',
        questions: [{
          id: 'fertility',
          question: 'Are you trying to have children?',
          type: 'select',
          options: [
            'Yes, currently',
            'Yes, in the future',
            'No',
            'Already have children'
          ],
          required: true
        }]
      },
      {
        stepNumber: 8,
        title: "Exercise Habits",
        stepType: 'lifestyle',
        questions: [{
          id: 'exercise_frequency',
          question: 'How often do you exercise?',
          type: 'select',
          options: [
            'Never',
            '1-2 times/week',
            '3-4 times/week',
            '5+ times/week'
          ],
          required: true
        }]
      },
      // Step 9-11: Personal Details
      ...createPersonalDetailsSteps(9)
    ]
  }
};

// Helper function to get form by condition
export function getIntakeForm(condition: string): IntakeForm | null {
  return intakeForms[condition as keyof typeof intakeForms] || null;
}

// Helper function to get current milestone based on step
export function getCurrentMilestone(stepNumber: number): ProgressMilestone | null {
  return progressMilestones.find(
    milestone => stepNumber >= milestone.range[0] && stepNumber <= milestone.range[1]
  ) || null;
}

// Helper function to calculate progress percentage
export function calculateProgress(currentStep: number, totalSteps: number): number {
  return Math.round((currentStep / totalSteps) * 100);
}

// Helper function to validate form responses
export function validateFormResponses(condition: string, responses: any) {
  const form = getIntakeForm(condition);
  if (!form) return { valid: false, errors: ['Invalid condition'] };
  
  const errors: string[] = [];
  
  form.steps.forEach(step => {
    step.questions.forEach(question => {
      if (question.required && !responses[question.id]) {
        errors.push(`${question.question} is required`);
      }
      
      if (question.validation && responses[question.id]) {
        if (question.type === 'number') {
          const value = Number(responses[question.id]);
          if (question.validation.min && value < question.validation.min) {
            errors.push(`${question.question} must be at least ${question.validation.min}`);
          }
          if (question.validation.max && value > question.validation.max) {
            errors.push(`${question.question} must be less than ${question.validation.max}`);
          }
        }
        
        if (question.type === 'email' && question.validation.pattern) {
          const regex = new RegExp(question.validation.pattern);
          if (!regex.test(responses[question.id])) {
            errors.push(question.validation.message || `${question.question} is invalid`);
          }
        }
        
        if (question.type === 'phone' && question.validation.pattern) {
          const regex = new RegExp(question.validation.pattern);
          if (!regex.test(responses[question.id])) {
            errors.push(question.validation.message || `${question.question} is invalid`);
          }
        }
      }
    });
  });
  
  return { valid: errors.length === 0, errors };
}

// Calculate BMI for weight loss consultations
export function calculateBMI(weight: number, heightInches: number) {
  return (weight / (heightInches * heightInches)) * 703;
}
