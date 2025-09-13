// Comprehensive Treatment Protocols for DTC Telehealth

export const treatmentProtocols = {
  acne: {
    mild: {
      name: 'Mild Acne Protocol',
      description: 'For occasional breakouts and blackheads',
      medications: [
        { sku: 'TRE-025-CR', name: 'Tretinoin 0.025% Cream', price: 59, qty: 1, instructions: 'Apply thin layer at bedtime', refills: 3 },
        { sku: 'BPO-25-GEL', name: 'Benzoyl Peroxide 2.5% Gel', price: 25, qty: 1, instructions: 'Apply in morning after washing', refills: 3 }
      ],
      duration: '8-12 weeks',
      followUp: '6 weeks',
      total: 84
    },
    moderate: {
      name: 'Moderate Acne Protocol',
      description: 'For persistent inflammatory acne',
      medications: [
        { sku: 'TRE-050-CR', name: 'Tretinoin 0.05% Cream', price: 69, qty: 1, instructions: 'Apply thin layer at bedtime', refills: 3 },
        { sku: 'DOX-100-CAP', name: 'Doxycycline 100mg', price: 45, qty: 60, instructions: 'Take 1 tablet twice daily with food', refills: 2 },
        { sku: 'CLN-1-SOL', name: 'Clindamycin 1% Solution', price: 35, qty: 1, instructions: 'Apply to affected areas twice daily', refills: 3 }
      ],
      duration: '12-16 weeks',
      followUp: '4 weeks',
      total: 149
    },
    severe: {
      name: 'Severe Acne Protocol',
      description: 'For cystic or nodular acne',
      medications: [
        { sku: 'TRE-050-CR', name: 'Tretinoin 0.05% Cream', price: 69, qty: 1, instructions: 'Apply thin layer at bedtime', refills: 3 },
        { sku: 'DOX-100-CAP', name: 'Doxycycline 100mg', price: 45, qty: 60, instructions: 'Take 1 tablet twice daily with food', refills: 2 },
        { sku: 'BPO-5-GEL', name: 'Benzoyl Peroxide 5% Gel', price: 29, qty: 1, instructions: 'Apply in morning after washing', refills: 3 },
        { sku: 'SPR-100-TAB', name: 'Spironolactone 100mg', price: 35, qty: 30, instructions: 'Take 1 tablet daily (females only)', refills: 3 }
      ],
      duration: '16-24 weeks',
      followUp: '4 weeks',
      total: 178
    },
    hormonal: {
      name: 'Hormonal Acne Protocol',
      description: 'For adult female hormonal acne',
      medications: [
        { sku: 'SPR-100-TAB', name: 'Spironolactone 100mg', price: 35, qty: 30, instructions: 'Take 1 tablet daily', refills: 6 },
        { sku: 'TRE-025-CR', name: 'Tretinoin 0.025% Cream', price: 59, qty: 1, instructions: 'Apply thin layer at bedtime', refills: 3 },
        { sku: 'AZA-15-CR', name: 'Azelaic Acid 15% Cream', price: 45, qty: 1, instructions: 'Apply twice daily', refills: 3 }
      ],
      duration: 'Ongoing',
      followUp: '8 weeks',
      total: 139
    }
  },

  ed: {
    trial: {
      name: 'ED Trial Pack',
      description: 'Try different medications to find what works',
      medications: [
        { sku: 'SIL-50-TAB', name: 'Sildenafil 50mg', price: 10, qty: 6, instructions: 'Take 1 tablet 30-60 min before activity', refills: 0 },
      prevention: {
        name: 'Early Prevention',
        description: 'For mild thinning or family history',
        medications: [
          { sku: 'FIN-1-TAB', name: 'Finasteride 1mg', price: 25, qty: 30, instructions: 'Take 1 tablet daily' }
        ],
        total: 25
      },
      standard: {
        name: 'Standard Treatment',
        description: 'Proven combination therapy',
        medications: [
          { sku: 'FIN-1-TAB', name: 'Finasteride 1mg', price: 25, qty: 30, instructions: 'Take 1 tablet daily' },
          { sku: 'MIN-5-SOL', name: 'Minoxidil 5% Solution', price: 29, qty: 1, instructions: 'Apply 1ml to scalp twice daily' }
        ],
        total: 54
      },
      advanced: {
        name: 'Advanced Protocol',
        description: 'Maximum medical therapy',
        medications: [
          { sku: 'FIN-1-TAB', name: 'Finasteride 1mg', price: 25, qty: 30, instructions: 'Take 1 tablet daily' },
          { sku: 'MIN-5-FOAM', name: 'Minoxidil 5% Foam', price: 35, qty: 2, instructions: 'Apply to scalp twice daily' },
          { sku: 'KET-2-SH', name: 'Ketoconazole 2% Shampoo', price: 35, qty: 1, instructions: 'Use 2-3 times weekly' },
          { sku: 'BIOTIN-10', name: 'Biotin 10mg', price: 20, qty: 30, instructions: 'Take 1 daily' }
        ],
        total: 115
      },
      dutasteride: {
        name: 'Dutasteride Protocol',
        description: 'For aggressive hair loss',
        medications: [
          { sku: 'DUT-05-TAB', name: 'Dutasteride 0.5mg', price: 45, qty: 30, instructions: 'Take 1 tablet daily' },
          { sku: 'MIN-5-FOAM', name: 'Minoxidil 5% Foam', price: 35, qty: 2, instructions: 'Apply to scalp twice daily' }
        ],
        total: 80
      },
      women: {
        name: 'Women\'s Hair Loss',
        description: 'Female pattern hair loss',
        medications: [
          { sku: 'MIN-2-SOL', name: 'Minoxidil 2% Solution', price: 25, qty: 1, instructions: 'Apply 1ml to scalp twice daily' },
          { sku: 'SPIRO-50', name: 'Spironolactone 50mg', price: 30, qty: 30, instructions: 'Take 1 tablet daily' },
          { sku: 'BIOTIN-10', name: 'Biotin 10mg', price: 20, qty: 30, instructions: 'Take 1 daily' }
        ],
        contraindications: ['Pregnancy', 'Kidney disease'],
        total: 75
      }
    }
  },

  longevity: {
    name: 'Longevity & Anti-Aging',
    icon: '🧬',
    protocols: {
      basic: {
        name: 'Longevity Basics',
        description: 'Evidence-based anti-aging',
        medications: [
          { sku: 'MET-500-TAB', name: 'Metformin ER 500mg', price: 35, qty: 60, instructions: 'Take 1 tablet twice daily' },
          { sku: 'VIT-D3', name: 'Vitamin D3 5000IU', price: 15, qty: 30, instructions: 'Take 1 daily' },
          { sku: 'OMEGA-3', name: 'Omega-3 EPA/DHA', price: 25, qty: 30, instructions: 'Take 2 capsules daily' }
        ],
        total: 75
      },
      nad_boost: {
        name: 'NAD+ Enhancement',
        description: 'Cellular energy optimization',
        medications: [
          { sku: 'NAD-500-SUB', name: 'NAD+ Sublingual 500mg', price: 89, qty: 30, instructions: 'Dissolve 1 tablet under tongue daily' },
          { sku: 'NMN-250', name: 'NMN 250mg', price: 65, qty: 30, instructions: 'Take 1 capsule in morning' },
          { sku: 'RESV-500', name: 'Resveratrol 500mg', price: 35, qty: 30, instructions: 'Take 1 capsule daily' }
        ],
        total: 189
      },
      comprehensive: {
        name: 'Comprehensive Longevity',
        description: 'Full anti-aging protocol',
        medications: [
          { sku: 'MET-500-TAB', name: 'Metformin ER 500mg', price: 35, qty: 60, instructions: 'Take 1 tablet twice daily' },
          { sku: 'NAD-500-SUB', name: 'NAD+ Sublingual 500mg', price: 89, qty: 30, instructions: 'Dissolve 1 tablet under tongue daily' },
          { sku: 'RAPA-1', name: 'Rapamycin 1mg', price: 120, qty: 4, instructions: 'Take 1mg once weekly' },
          { sku: 'VIT-D3', name: 'Vitamin D3 5000IU', price: 15, qty: 30, instructions: 'Take 1 daily' }
        ],
        requiresLabs: true,
        total: 259
      },
      hormone_optimize: {
        name: 'Hormone Optimization',
        description: 'Age-related hormone support',
        medications: [
          { sku: 'DHEA-25', name: 'DHEA 25mg', price: 20, qty: 30, instructions: 'Take 1 daily in morning' },
          { sku: 'PREG-10', name: 'Pregnenolone 10mg', price: 25, qty: 30, instructions: 'Take 1 daily' },
          { sku: 'MEL-3', name: 'Melatonin 3mg', price: 15, qty: 30, instructions: 'Take 1 at bedtime' }
        ],
        total: 60
      }
    }
  },

  womensHealth: {
    name: 'Women\'s Health',
    icon: '👩‍⚕️',
    protocols: {
      birth_control: {
        name: 'Birth Control',
        description: 'Combined oral contraceptive',
        medications: [
          { sku: 'BC-COMBO', name: 'Combination OCP (Generic)', price: 20, qty: 3, instructions: 'Take 1 tablet daily at same time' }
        ],
        total: 60
      },
      uti_treatment: {
        name: 'UTI Treatment',
        description: 'Uncomplicated UTI',
        medications: [
          { sku: 'NITRO-100', name: 'Nitrofurantoin 100mg', price: 25, qty: 14, instructions: 'Take 1 capsule twice daily with food x 7 days' },
          { sku: 'AZO-STD', name: 'Phenazopyridine 200mg', price: 15, qty: 6, instructions: 'Take 1 tablet three times daily for 2 days' }
        ],
        total: 40
      },
      yeast_infection: {
        name: 'Yeast Infection',
        description: 'Vaginal candidiasis treatment',
        medications: [
          { sku: 'FLUC-150', name: 'Fluconazole 150mg', price: 15, qty: 1, instructions: 'Take 1 tablet as single dose' }
        ],
        total: 15
      },
      menopause_mild: {
        name: 'Menopause Support - Mild',
        description: 'Non-hormonal symptom relief',
        medications: [
          { sku: 'BLACK-COH', name: 'Black Cohosh 40mg', price: 25, qty: 30, instructions: 'Take 1 tablet twice daily' },
          { sku: 'VIT-E', name: 'Vitamin E 400IU', price: 15, qty: 30, instructions: 'Take 1 daily' }
        ],
        total: 40
      },
      menopause_hrt: {
        name: 'HRT - Bioidentical',
        description: 'Hormone replacement therapy',
        medications: [
          { sku: 'ESTR-1-CR', name: 'Estradiol 1mg Cream', price: 65, qty: 1, instructions: 'Apply 1 pump daily to inner arm' },
          { sku: 'PROG-100', name: 'Progesterone 100mg', price: 45, qty: 30, instructions: 'Take 1 capsule at bedtime days 14-28' }
        ],
        requiresLabs: true,
        total: 110
      },
      pcos: {
        name: 'PCOS Management',
        description: 'Polycystic ovary syndrome',
        medications: [
          { sku: 'MET-500-TAB', name: 'Metformin ER 500mg', price: 35, qty: 60, instructions: 'Take 1 tablet twice daily with meals' },
          { sku: 'SPIRO-50', name: 'Spironolactone 50mg', price: 30, qty: 30, instructions: 'Take 1 tablet daily' },
          { sku: 'INOSITOL', name: 'Inositol Powder', price: 25, qty: 1, instructions: '2g twice daily in water' }
        ],
        total: 90
      }
    }
  },

  mensHealth: {
    name: 'Men\'s Health',
    icon: '👨‍⚕️',
    protocols: {
      ed_trial: {
        name: 'ED Trial Pack',
        description: 'Try different options',
        medications: [
          { sku: 'SIL-50-TAB', name: 'Sildenafil 50mg', price: 10, qty: 6, instructions: 'Take 1 tablet 30-60 min before activity' },
          { sku: 'TAD-10-TAB', name: 'Tadalafil 10mg', price: 15, qty: 4, instructions: 'Take 1 tablet 30 min before activity' }
        ],
        total: 120
      },
      ed_daily: {
        name: 'Daily ED Treatment',
        description: 'Continuous coverage',
        medications: [
          { sku: 'TAD-5-TAB', name: 'Tadalafil 5mg', price: 8, qty: 30, instructions: 'Take 1 tablet daily at same time' }
        ],
        total: 240
      },
      premature_ejac: {
        name: 'Premature Ejaculation',
        description: 'SSRI treatment',
        medications: [
          { sku: 'SERT-50', name: 'Sertraline 50mg', price: 20, qty: 30, instructions: 'Take 1 tablet daily' },
          { sku: 'LIDO-SPRAY', name: 'Lidocaine Spray', price: 35, qty: 1, instructions: 'Apply 3 sprays 10-15 min before activity' }
        ],
        total: 55
      },
      prostate_health: {
        name: 'Prostate Support',
        description: 'BPH management',
        medications: [
          { sku: 'TAMS-04', name: 'Tamsulosin 0.4mg', price: 25, qty: 30, instructions: 'Take 1 capsule daily after same meal' },
          { sku: 'SAW-PALM', name: 'Saw Palmetto 320mg', price: 20, qty: 30, instructions: 'Take 1 capsule daily' }
        ],
        total: 45
      }
    }
  },

  trt: {
    name: 'Testosterone Therapy',
    icon: '💪',
    protocols: {
      injection_starter: {
        name: 'TRT Starter - Injections',
        description: 'Weekly testosterone cypionate',
        medications: [
          { sku: 'TEST-CYP-200', name: 'Testosterone Cypionate 200mg/ml', price: 80, qty: 1, instructions: 'Inject 0.5ml (100mg) IM weekly' },
          { sku: 'HCG-5000', name: 'HCG 5000IU', price: 60, qty: 1, instructions: 'Inject 250IU subQ twice weekly' },
          { sku: 'AI-ARIM', name: 'Anastrozole 1mg', price: 30, qty: 10, instructions: 'Take 0.5mg twice weekly if needed' }
        ],
        labsRequired: ['Total T', 'Free T', 'Estradiol', 'PSA', 'CBC', 'CMP'],
        followUp: '6 weeks',
        total: 170
      },
      injection_maintain: {
        name: 'TRT Maintenance',
        description: 'Monthly supply',
        medications: [
          { sku: 'TEST-CYP-200', name: 'Testosterone Cypionate 200mg/ml', price: 80, qty: 2, instructions: 'Inject prescribed dose IM weekly' },
          { sku: 'HCG-5000', name: 'HCG 5000IU', price: 60, qty: 1, instructions: 'Inject 250IU subQ twice weekly' }
        ],
        total: 220
      },
      gel_daily: {
        name: 'TRT Gel',
        description: 'Daily topical application',
        medications: [
          { sku: 'TEST-GEL-1', name: 'Testosterone Gel 1%', price: 120, qty: 1, instructions: 'Apply 2 pumps to shoulders/upper arms daily' }
        ],
        total: 120
      },
      pellets: {
        name: 'TRT Pellets',
        description: 'Long-acting implants',
        medications: [
          { sku: 'TEST-PEL', name: 'Testosterone Pellets', price: 650, qty: 1, instructions: 'Implanted every 4-6 months (includes procedure)' }
        ],
        total: 650
      },
      clomid_restart: {
        name: 'Natural T Boost',
        description: 'Clomiphene for natural production',
        medications: [
          { sku: 'CLOM-50', name: 'Clomiphene 50mg', price: 40, qty: 30, instructions: 'Take 25mg daily (half tablet)' },
          { sku: 'DHEA-50', name: 'DHEA 50mg', price: 20, qty: 30, instructions: 'Take 1 daily in morning' },
          { sku: 'VIT-D3', name: 'Vitamin D3 5000IU', price: 15, qty: 30, instructions: 'Take 1 daily' }
        ],
        total: 75
      }
    }
  }
};

// Helper function to get protocols for a specific condition
export function getProtocolsByCondition(condition: string) {
  return treatmentProtocols[condition as keyof typeof treatmentProtocols] || null;
}

// Helper function to get all conditions
export function getAllConditions() {
  return Object.keys(treatmentProtocols).map(key => ({
    key,
    name: treatmentProtocols[key as keyof typeof treatmentProtocols].name,
    icon: treatmentProtocols[key as keyof typeof treatmentProtocols].icon
  }));
}
