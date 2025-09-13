// Comprehensive Medical Intake Forms for DTC Telehealth Platform
// Designed to be thorough yet elegant, following best practices from leading telehealth companies

export interface IntakeQuestion {
  id: string;
  question: string;
  type: 'select' | 'multiselect' | 'text' | 'number' | 'yesno' | 'scale' | 'date' | 'height' | 'blood_pressure' | 'textarea';
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

export interface IntakeSection {
  title: string;
  subtitle?: string;
  questions: IntakeQuestion[];
}

export interface IntakeForm {
  name: string;
  icon: string;
  estimatedTime: string;
  description: string;
  sections: IntakeSection[];
  disclaimers?: string[];
}

export const intakeForms: Record<string, IntakeForm> = {
  weightLoss: {
    name: 'Weight Management & GLP-1 Consultation',
    icon: '⚖️',
    estimatedTime: '8-10 minutes',
    description: 'Comprehensive assessment for medical weight management including GLP-1 medications',
    sections: [
      {
        title: 'Weight History',
        questions: [
          {
            id: 'current_weight',
            question: 'What is your current weight (lbs)?',
            type: 'number',
            required: true,
            validation: { min: 50, max: 800 }
          },
          {
            id: 'height',
            question: 'What is your height?',
            type: 'text',
            required: true,
            placeholder: "e.g., 5'8\" or 173cm"
          },
          {
            id: 'goal_weight',
            question: 'What is your goal weight (lbs)?',
            type: 'number',
            required: true
          },
          {
            id: 'weight_loss_timeline',
            question: 'When would you like to reach your goal?',
            type: 'select',
            options: ['1 month', '3 months', '6 months', '1 year', 'No specific timeline'],
            required: true
          },
          {
            id: 'previous_max_weight',
            question: 'What is the most you have ever weighed?',
            type: 'number',
            required: true
          },
          {
            id: 'weight_gain_timeline',
            question: 'When did you start gaining weight?',
            type: 'select',
            options: ['Last 6 months', 'Last year', '2-5 years ago', '5-10 years ago', 'More than 10 years ago', 'Since childhood'],
            required: true
          }
        ]
      },
      {
        title: 'Medical History',
        questions: [
          {
            id: 'medical_conditions',
            question: 'Do you have any of the following conditions?',
            type: 'multiselect',
            options: ['Diabetes', 'High blood pressure', 'High cholesterol', 'Heart disease', 'Thyroid disorder', 'PCOS', 'Sleep apnea', 'None'],
            required: true
          },
          {
            id: 'medications',
            question: 'Are you currently taking any medications?',
            type: 'text',
            placeholder: 'List all current medications',
            required: true
          },
          {
            id: 'allergies',
            question: 'Do you have any medication allergies?',
            type: 'text',
            required: true
          },
          {
            id: 'pregnant_nursing',
            question: 'Are you pregnant or breastfeeding?',
            type: 'yesno',
            required: true
          }
        ]
      },
      {
        title: 'Previous Weight Loss Attempts',
        questions: [
          {
            id: 'previous_methods',
            question: 'What weight loss methods have you tried?',
            type: 'multiselect',
            options: ['Diet changes', 'Exercise', 'Weight Watchers', 'Keto', 'Intermittent fasting', 'Phentermine', 'GLP-1 medications', 'Surgery', 'None'],
            required: true
          },
          {
            id: 'most_successful',
            question: 'What worked best for you?',
            type: 'text',
            required: false
          },
          {
            id: 'challenges',
            question: 'What are your biggest challenges with weight loss?',
            type: 'multiselect',
            options: ['Hunger/cravings', 'Emotional eating', 'Time for exercise', 'Meal planning', 'Social situations', 'Medical conditions', 'Slow metabolism'],
            required: true
          }
        ]
      },
      {
        title: 'Lifestyle',
        questions: [
          {
            id: 'exercise_frequency',
            question: 'How often do you exercise?',
            type: 'select',
            options: ['Never', '1-2 times/week', '3-4 times/week', '5+ times/week'],
            required: true
          },
          {
            id: 'diet_quality',
            question: 'How would you rate your current diet?',
            type: 'scale',
            options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            required: true
          },
          {
            id: 'water_intake',
            question: 'How much water do you drink daily?',
            type: 'select',
            options: ['Less than 2 cups', '2-4 cups', '4-8 cups', 'More than 8 cups'],
            required: true
          }
        ]
      }
    ]
  },

  hairLoss: {
    name: 'Hair Loss & Restoration Consultation',
    icon: '💇',
    estimatedTime: '6-8 minutes',
    description: 'Comprehensive evaluation for hair loss treatment including prescription options',
    sections: [
      {
        title: 'Hair Loss Pattern',
        questions: [
          {
            id: 'hair_loss_location',
            question: 'Where are you experiencing hair loss?',
            type: 'multiselect',
            options: ['Receding hairline', 'Crown/top of head', 'Temples', 'Overall thinning', 'Patches', 'Eyebrows/body hair'],
            required: true
          },
          {
            id: 'hair_loss_duration',
            question: 'How long have you noticed hair loss?',
            type: 'select',
            options: ['Less than 6 months', '6-12 months', '1-2 years', '2-5 years', 'More than 5 years'],
            required: true
          },
          {
            id: 'hair_loss_rate',
            question: 'How would you describe the rate of hair loss?',
            type: 'select',
            options: ['Gradual', 'Moderate', 'Rapid', 'Sudden'],
            required: true
          },
          {
            id: 'family_history',
            question: 'Does hair loss run in your family?',
            type: 'select',
            options: ['Yes - mother\'s side', 'Yes - father\'s side', 'Yes - both sides', 'No', 'Not sure'],
            required: true
          }
        ]
      },
      {
        title: 'Previous Treatments',
        questions: [
          {
            id: 'previous_treatments',
            question: 'Have you tried any hair loss treatments?',
            type: 'multiselect',
            options: ['Minoxidil (Rogaine)', 'Finasteride (Propecia)', 'Hair transplant', 'PRP therapy', 'Supplements', 'Special shampoos', 'None'],
            required: true
          },
          {
            id: 'treatment_results',
            question: 'If you tried treatments, what were the results?',
            type: 'text',
            required: false
          }
        ]
      },
      {
        title: 'Health & Lifestyle',
        questions: [
          {
            id: 'stress_level',
            question: 'How would you rate your stress level?',
            type: 'scale',
            options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            required: true
          },
          {
            id: 'medical_conditions',
            question: 'Do you have any of these conditions?',
            type: 'multiselect',
            options: ['Thyroid disorder', 'Anemia', 'Autoimmune disease', 'Scalp conditions', 'None'],
            required: true
          },
          {
            id: 'recent_events',
            question: 'Any recent events that might affect hair?',
            type: 'multiselect',
            options: ['Surgery', 'Childbirth', 'Major illness', 'Significant weight loss', 'Medication changes', 'None'],
            required: true
          }
        ]
      }
    ]
  },

  longevity: {
    name: 'Longevity & Anti-Aging Consultation',
    icon: '🧬',
    estimatedTime: '7-10 minutes',
    description: 'Optimize your healthspan with personalized longevity protocols and biomarker tracking',
    sections: [
      {
        title: 'Health Goals',
        questions: [
          {
            id: 'longevity_goals',
            question: 'What are your primary longevity goals?',
            type: 'multiselect',
            options: ['Increase energy', 'Improve cognitive function', 'Better sleep', 'Disease prevention', 'Slow aging', 'Optimize hormones', 'Enhance physical performance'],
            required: true
          },
          {
            id: 'current_age',
            question: 'What is your current age?',
            type: 'number',
            required: true
          },
          {
            id: 'biological_age_feeling',
            question: 'How old do you feel compared to your actual age?',
            type: 'select',
            options: ['Much younger', 'Slightly younger', 'My age', 'Slightly older', 'Much older'],
            required: true
          }
        ]
      },
      {
        title: 'Current Health Status',
        questions: [
          {
            id: 'health_conditions',
            question: 'Do you have any chronic health conditions?',
            type: 'multiselect',
            options: ['Diabetes', 'Heart disease', 'High blood pressure', 'High cholesterol', 'Autoimmune', 'Cancer history', 'None'],
            required: true
          },
          {
            id: 'family_longevity',
            question: 'How long did your parents/grandparents live?',
            type: 'select',
            options: ['Under 70', '70-80', '80-90', 'Over 90', 'Still living', 'Unknown'],
            required: true
          },
          {
            id: 'current_supplements',
            question: 'What supplements do you currently take?',
            type: 'text',
            placeholder: 'List all supplements and dosages',
            required: false
          }
        ]
      },
      {
        title: 'Lifestyle Factors',
        questions: [
          {
            id: 'exercise_type',
            question: 'What type of exercise do you do?',
            type: 'multiselect',
            options: ['Cardio', 'Strength training', 'Yoga', 'HIIT', 'Walking', 'Swimming', 'None'],
            required: true
          },
          {
            id: 'sleep_quality',
            question: 'How would you rate your sleep quality?',
            type: 'scale',
            options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            required: true
          },
          {
            id: 'diet_type',
            question: 'Which best describes your diet?',
            type: 'select',
            options: ['Mediterranean', 'Keto', 'Paleo', 'Vegetarian', 'Vegan', 'Standard American', 'Other'],
            required: true
          },
          {
            id: 'alcohol_consumption',
            question: 'How often do you drink alcohol?',
            type: 'select',
            options: ['Never', 'Occasionally', '1-2 drinks/week', '3-5 drinks/week', 'Daily'],
            required: true
          }
        ]
      },
      {
        title: 'Lab Work',
        questions: [
          {
            id: 'recent_labs',
            question: 'Have you had lab work done in the last year?',
            type: 'yesno',
            required: true
          },
          {
            id: 'lab_concerns',
            question: 'Any concerning lab values?',
            type: 'text',
            placeholder: 'e.g., high glucose, low vitamin D',
            required: false
          }
        ]
      }
    ]
  },

  womensHealth: {
    name: 'Women\'s Health Consultation',
    icon: '👩‍⚕️',
    estimatedTime: '6-8 minutes',
    description: 'Comprehensive women\'s health services including birth control, UTI treatment, and hormonal care',
    sections: [
      {
        title: 'Primary Concern',
        questions: [
          {
            id: 'primary_concern',
            question: 'What brings you here today?',
            type: 'select',
            options: ['Birth control', 'UTI symptoms', 'Yeast infection', 'Menopause symptoms', 'PCOS', 'Irregular periods', 'Other'],
            required: true
          },
          {
            id: 'symptom_duration',
            question: 'How long have you had these symptoms?',
            type: 'select',
            options: ['Less than 1 week', '1-2 weeks', '2-4 weeks', '1-3 months', 'More than 3 months'],
            required: true
          }
        ]
      },
      {
        title: 'Menstrual History',
        questions: [
          {
            id: 'last_period',
            question: 'When was your last menstrual period?',
            type: 'date',
            required: true
          },
          {
            id: 'period_regularity',
            question: 'Are your periods regular?',
            type: 'select',
            options: ['Very regular', 'Mostly regular', 'Irregular', 'No periods', 'Menopause'],
            required: true
          },
          {
            id: 'period_symptoms',
            question: 'Do you experience any of these?',
            type: 'multiselect',
            options: ['Heavy bleeding', 'Painful cramps', 'PMS', 'Mood changes', 'Headaches', 'None'],
            required: true
          }
        ]
      },
      {
        title: 'Sexual & Reproductive Health',
        questions: [
          {
            id: 'sexually_active',
            question: 'Are you sexually active?',
            type: 'yesno',
            required: true
          },
          {
            id: 'pregnancy_status',
            question: 'Could you be pregnant?',
            type: 'select',
            options: ['No - using contraception', 'No - not sexually active', 'No - partner is sterile', 'Possibly', 'Yes', 'Currently pregnant'],
            required: true
          },
          {
            id: 'pregnancies',
            question: 'Number of pregnancies?',
            type: 'number',
            required: true
          },
          {
            id: 'birth_control_history',
            question: 'Have you used birth control before?',
            type: 'multiselect',
            options: ['Pills', 'IUD', 'Implant', 'Shot', 'Patch', 'Ring', 'Condoms only', 'None'],
            required: true
          }
        ]
      },
      {
        title: 'Medical History',
        questions: [
          {
            id: 'medical_conditions',
            question: 'Do you have any of these conditions?',
            type: 'multiselect',
            options: ['PCOS', 'Endometriosis', 'Fibroids', 'Thyroid disorder', 'Diabetes', 'High blood pressure', 'None'],
            required: true
          },
          {
            id: 'surgeries',
            question: 'Any gynecological surgeries?',
            type: 'multiselect',
            options: ['C-section', 'Hysterectomy', 'Ovarian surgery', 'D&C', 'None'],
            required: true
          }
        ]
      }
    ]
  },

  mensHealth: {
    name: 'Men\'s Health & ED Consultation',
    icon: '👨‍⚕️',
    estimatedTime: '5-7 minutes',
    description: 'Confidential consultation for erectile dysfunction, premature ejaculation, and men\'s wellness',
    sections: [
      {
        title: 'Primary Concern',
        questions: [
          {
            id: 'primary_concern',
            question: 'What brings you here today?',
            type: 'select',
            options: ['Erectile dysfunction', 'Premature ejaculation', 'Low libido', 'Prostate health', 'Hair loss', 'Other'],
            required: true
          },
          {
            id: 'symptom_duration',
            question: 'How long have you experienced this?',
            type: 'select',
            options: ['Less than 1 month', '1-3 months', '3-6 months', '6-12 months', 'More than 1 year'],
            required: true
          },
          {
            id: 'severity',
            question: 'How severe is the problem?',
            type: 'scale',
            options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            required: true
          }
        ]
      },
      {
        title: 'Sexual Health (if applicable)',
        questions: [
          {
            id: 'ed_frequency',
            question: 'How often do you have difficulty with erections?',
            type: 'select',
            options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            required: false
          },
          {
            id: 'morning_erections',
            question: 'Do you have morning erections?',
            type: 'select',
            options: ['Yes, regularly', 'Sometimes', 'Rarely', 'Never'],
            required: false
          },
          {
            id: 'relationship_status',
            question: 'Are you in a relationship?',
            type: 'select',
            options: ['Single', 'In a relationship', 'Married', 'Prefer not to say'],
            required: false
          }
        ]
      },
      {
        title: 'Health Factors',
        questions: [
          {
            id: 'medical_conditions',
            question: 'Do you have any of these conditions?',
            type: 'multiselect',
            options: ['Diabetes', 'High blood pressure', 'Heart disease', 'High cholesterol', 'Depression/anxiety', 'Prostate issues', 'None'],
            required: true
          },
          {
            id: 'medications',
            question: 'Current medications?',
            type: 'text',
            placeholder: 'List all medications',
            required: true
          },
          {
            id: 'smoking',
            question: 'Do you smoke?',
            type: 'select',
            options: ['Never', 'Former smoker', 'Occasionally', 'Daily'],
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
      }
    ]
  },

  trt: {
    name: 'Testosterone Replacement Therapy Consultation',
    icon: '💪',
    estimatedTime: '8-10 minutes',
    description: 'Expert assessment for low testosterone symptoms and personalized TRT treatment plans',
    sections: [
      {
        title: 'Symptoms',
        questions: [
          {
            id: 'low_t_symptoms',
            question: 'Which symptoms are you experiencing?',
            type: 'multiselect',
            options: [
              'Low energy/fatigue',
              'Decreased libido',
              'Erectile dysfunction',
              'Loss of muscle mass',
              'Increased body fat',
              'Mood changes/depression',
              'Poor concentration',
              'Hot flashes',
              'Decreased body hair'
            ],
            required: true
          },
          {
            id: 'symptom_impact',
            question: 'How much do these symptoms affect your daily life?',
            type: 'scale',
            options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            required: true
          },
          {
            id: 'symptom_timeline',
            question: 'When did symptoms begin?',
            type: 'select',
            options: ['Last few months', '6-12 months ago', '1-2 years ago', '2-5 years ago', 'More than 5 years'],
            required: true
          }
        ]
      },
      {
        title: 'Previous Testing',
        questions: [
          {
            id: 'previous_testosterone_test',
            question: 'Have you had testosterone levels checked?',
            type: 'yesno',
            required: true
          },
          {
            id: 'testosterone_level',
            question: 'If yes, what was your total testosterone level?',
            type: 'text',
            placeholder: 'e.g., 250 ng/dL',
            required: false
          },
          {
            id: 'other_hormone_tests',
            question: 'Any other hormone tests done?',
            type: 'multiselect',
            options: ['Free testosterone', 'Estradiol', 'LH/FSH', 'Prolactin', 'Thyroid', 'None', 'Not sure'],
            required: true
          }
        ]
      },
      {
        title: 'Medical History',
        questions: [
          {
            id: 'prostate_health',
            question: 'Any prostate issues?',
            type: 'multiselect',
            options: ['Enlarged prostate', 'Elevated PSA', 'Prostate cancer', 'Family history of prostate cancer', 'None'],
            required: true
          },
          {
            id: 'cardiovascular_health',
            question: 'Any heart/cardiovascular issues?',
            type: 'multiselect',
            options: ['Heart disease', 'High blood pressure', 'Blood clots', 'Stroke', 'None'],
            required: true
          },
          {
            id: 'fertility_concerns',
            question: 'Are you trying to have children?',
            type: 'select',
            options: ['Yes, currently', 'Yes, in the future', 'No', 'Already have children'],
            required: true
          },
          {
            id: 'sleep_apnea',
            question: 'Do you have sleep apnea?',
            type: 'select',
            options: ['Yes, treated with CPAP', 'Yes, untreated', 'No', 'Not sure'],
            required: true
          }
        ]
      },
      {
        title: 'Lifestyle',
        questions: [
          {
            id: 'exercise_frequency',
            question: 'How often do you exercise?',
            type: 'select',
            options: ['Never', '1-2 times/week', '3-4 times/week', '5+ times/week'],
            required: true
          },
          {
            id: 'body_composition_goals',
            question: 'What are your body composition goals?',
            type: 'multiselect',
            options: ['Build muscle', 'Lose fat', 'Increase strength', 'Improve energy', 'Better recovery'],
            required: true
          }
        ]
      }
    ]
  }
};

// Helper function to get form by condition
export function getIntakeForm(condition: string) {
  return intakeForms[condition as keyof typeof intakeForms] || null;
}

// Helper function to validate form responses
export function validateFormResponses(condition: string, responses: any) {
  const form = getIntakeForm(condition);
  if (!form) return { valid: false, errors: ['Invalid condition'] };
  
  const errors: string[] = [];
  
  form.sections.forEach(section => {
    section.questions.forEach((question: any) => {
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
      }
    });
  });
  
  return { valid: errors.length === 0, errors };
}

// Calculate BMI for weight loss consultations
export function calculateBMI(weight: number, heightInches: number) {
  return (weight / (heightInches * heightInches)) * 703;
}
