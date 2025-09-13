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
        { sku: 'TAD-10-TAB', name: 'Tadalafil 10mg', price: 15, qty: 4, instructions: 'Take 1 tablet 30 min before activity', refills: 0 }
      ],
      duration: '1 month trial',
      followUp: '4 weeks',
      total: 120
    },
    standard: {
      name: 'ED Standard Supply',
      description: 'Most popular option for regular use',
      medications: [
        { sku: 'SIL-100-TAB', name: 'Sildenafil 100mg', price: 15, qty: 12, instructions: 'Take 1 tablet 30-60 min before activity', refills: 11 }
      ],
      duration: 'Monthly refills',
      followUp: '3 months',
      total: 180
    },
    daily: {
      name: 'Daily ED Treatment',
      description: 'Daily medication for spontaneity',
      medications: [
        { sku: 'TAD-5-TAB', name: 'Tadalafil 5mg', price: 25, qty: 30, instructions: 'Take 1 tablet daily at same time', refills: 11 }
      ],
      duration: 'Monthly refills',
      followUp: '3 months',
      total: 750
    },
    combination: {
      name: 'ED Combination Therapy',
      description: 'For treatment-resistant cases',
      medications: [
        { sku: 'SIL-100-TAB', name: 'Sildenafil 100mg', price: 15, qty: 8, instructions: 'Take as needed', refills: 5 },
        { sku: 'TAD-5-TAB', name: 'Tadalafil 5mg', price: 25, qty: 30, instructions: 'Take 1 tablet daily', refills: 5 }
      ],
      duration: 'Monthly refills',
      followUp: '6 weeks',
      total: 870
    }
  },

  hairLoss: {
    prevention: {
      name: 'Hair Loss Prevention',
      description: 'Early intervention for thinning hair',
      medications: [
        { sku: 'FIN-1-TAB', name: 'Finasteride 1mg', price: 25, qty: 30, instructions: 'Take 1 tablet daily', refills: 11 }
      ],
      duration: 'Ongoing',
      followUp: '6 months',
      total: 25
    },
    standard: {
      name: 'Hair Loss Standard',
      description: 'Comprehensive hair regrowth protocol',
      medications: [
        { sku: 'FIN-1-TAB', name: 'Finasteride 1mg', price: 25, qty: 30, instructions: 'Take 1 tablet daily', refills: 11 },
        { sku: 'MIN-5-SOL', name: 'Minoxidil 5% Solution', price: 29, qty: 1, instructions: 'Apply 1ml to scalp twice daily', refills: 11 }
      ],
      duration: 'Ongoing',
      followUp: '3 months',
      total: 54
    },
    aggressive: {
      name: 'Hair Loss Aggressive',
      description: 'Maximum strength protocol',
      medications: [
        { sku: 'FIN-1-TAB', name: 'Finasteride 1mg', price: 25, qty: 30, instructions: 'Take 1 tablet daily', refills: 11 },
        { sku: 'MIN-5-FOA', name: 'Minoxidil 5% Foam', price: 35, qty: 2, instructions: 'Apply twice daily', refills: 11 },
        { sku: 'KET-2-SH', name: 'Ketoconazole 2% Shampoo', price: 35, qty: 1, instructions: 'Use 2-3 times weekly', refills: 5 },
        { sku: 'BIO-10K', name: 'Biotin 10,000mcg', price: 15, qty: 30, instructions: 'Take 1 daily', refills: 11 }
      ],
      duration: 'Ongoing',
      followUp: '3 months',
      total: 120
    },
    postpartum: {
      name: 'Postpartum Hair Loss',
      description: 'Safe for breastfeeding mothers',
      medications: [
        { sku: 'MIN-2-SOL', name: 'Minoxidil 2% Solution', price: 25, qty: 1, instructions: 'Apply 1ml twice daily', refills: 5 },
        { sku: 'BIO-10K', name: 'Biotin 10,000mcg', price: 15, qty: 30, instructions: 'Take 1 daily', refills: 5 },
        { sku: 'IRON-65', name: 'Iron 65mg', price: 12, qty: 30, instructions: 'Take 1 daily with vitamin C', refills: 5 }
      ],
      duration: '6 months',
      followUp: '2 months',
      total: 52
    }
  },

  weightLoss: {
    starter: {
      name: 'Weight Loss Starter',
      description: 'Begin with lifestyle modification support',
      medications: [
        { sku: 'MET-500-TAB', name: 'Metformin 500mg', price: 35, qty: 60, instructions: 'Take 1 tablet twice daily with meals', refills: 5 },
        { sku: 'ORL-60-CAP', name: 'Orlistat 60mg', price: 45, qty: 90, instructions: 'Take 1 with each fat-containing meal', refills: 5 }
      ],
      duration: '3 months',
      followUp: '4 weeks',
      total: 80
    },
    standard: {
      name: 'Weight Loss Standard',
      description: 'Appetite suppressant therapy',
      medications: [
        { sku: 'PHE-375-TAB', name: 'Phentermine 37.5mg', price: 89, qty: 30, instructions: 'Take 1 tablet in morning before breakfast', refills: 2 }
      ],
      duration: '3 months max',
      followUp: '2 weeks',
      total: 89
    },
    glp1: {
      name: 'GLP-1 Weight Loss',
      description: 'Latest injectable weight loss medication',
      medications: [
        { sku: 'SEM-05-INJ', name: 'Semaglutide 0.5mg weekly', price: 299, qty: 4, instructions: 'Inject 0.5mg subcutaneously once weekly', refills: 11 }
      ],
      duration: 'Ongoing',
      followUp: 'Monthly',
      total: 299
    },
    combination: {
      name: 'Weight Loss Combination',
      description: 'Multi-modal approach for significant weight loss',
      medications: [
        { sku: 'PHE-375-TAB', name: 'Phentermine 37.5mg', price: 89, qty: 30, instructions: 'Take 1 tablet in morning', refills: 2 },
        { sku: 'MET-500-TAB', name: 'Metformin 500mg', price: 35, qty: 60, instructions: 'Take 1 tablet twice daily with meals', refills: 5 },
        { sku: 'TOP-25-TAB', name: 'Topiramate 25mg', price: 45, qty: 30, instructions: 'Take 1 tablet at bedtime', refills: 5 }
      ],
      duration: '3-6 months',
      followUp: '2 weeks',
      total: 169
    },
    maintenance: {
      name: 'Weight Maintenance',
      description: 'Long-term weight management',
      medications: [
        { sku: 'MET-1000-TAB', name: 'Metformin 1000mg', price: 40, qty: 60, instructions: 'Take 1 tablet twice daily', refills: 11 },
        { sku: 'NAL-50-TAB', name: 'Naltrexone 50mg', price: 55, qty: 30, instructions: 'Take 1 tablet daily', refills: 11 }
      ],
      duration: 'Ongoing',
      followUp: '3 months',
      total: 95
    }
  },

  anxiety: {
    mild: {
      name: 'Mild Anxiety Management',
      description: 'Non-controlled options for daily anxiety',
      medications: [
        { sku: 'HYD-25-TAB', name: 'Hydroxyzine 25mg', price: 35, qty: 30, instructions: 'Take 1 tablet up to 3 times daily as needed', refills: 5 },
        { sku: 'PRO-20-TAB', name: 'Propranolol 20mg', price: 25, qty: 30, instructions: 'Take 1 tablet before stressful events', refills: 5 }
      ],
      duration: 'As needed',
      followUp: '6 weeks',
      total: 60
    },
    performance: {
      name: 'Performance Anxiety',
      description: 'For public speaking and performance',
      medications: [
        { sku: 'PRO-40-TAB', name: 'Propranolol 40mg', price: 30, qty: 20, instructions: 'Take 1 tablet 1 hour before event', refills: 5 }
      ],
      duration: 'As needed',
      followUp: '3 months',
      total: 30
    },
    daily: {
      name: 'Daily Anxiety Treatment',
      description: 'SSRI therapy for generalized anxiety',
      medications: [
        { sku: 'SER-50-TAB', name: 'Sertraline 50mg', price: 45, qty: 30, instructions: 'Take 1 tablet daily in morning', refills: 5 },
        { sku: 'HYD-25-TAB', name: 'Hydroxyzine 25mg', price: 35, qty: 30, instructions: 'Take as needed for breakthrough anxiety', refills: 5 }
      ],
      duration: 'Ongoing',
      followUp: '4 weeks initially, then 3 months',
      total: 80
    }
  },

  depression: {
    mild: {
      name: 'Mild Depression Treatment',
      description: 'First-line SSRI therapy',
      medications: [
        { sku: 'ESC-10-TAB', name: 'Escitalopram 10mg', price: 40, qty: 30, instructions: 'Take 1 tablet daily', refills: 5 }
      ],
      duration: 'Minimum 6 months',
      followUp: '2 weeks, then monthly',
      total: 40
    },
    standard: {
      name: 'Depression Standard Treatment',
      description: 'Optimized SSRI/SNRI therapy',
      medications: [
        { sku: 'SER-100-TAB', name: 'Sertraline 100mg', price: 50, qty: 30, instructions: 'Take 1 tablet daily', refills: 5 },
        { sku: 'BUP-150-TAB', name: 'Bupropion XL 150mg', price: 55, qty: 30, instructions: 'Take 1 tablet in morning', refills: 5 }
      ],
      duration: 'Ongoing',
      followUp: 'Monthly',
      total: 105
    }
  },

  skincare: {
    antiAging: {
      name: 'Anti-Aging Protocol',
      description: 'Prescription-strength anti-aging regimen',
      medications: [
        { sku: 'TRE-01-CR', name: 'Tretinoin 0.1% Cream', price: 79, qty: 1, instructions: 'Apply at night', refills: 5 },
        { sku: 'HYD-4-CR', name: 'Hydroquinone 4% Cream', price: 65, qty: 1, instructions: 'Apply to dark spots twice daily', refills: 2 },
        { sku: 'VIT-C-SER', name: 'Vitamin C 20% Serum', price: 45, qty: 1, instructions: 'Apply in morning', refills: 5 }
      ],
      duration: 'Ongoing',
      followUp: '12 weeks',
      total: 189
    },
    melasma: {
      name: 'Melasma Treatment',
      description: 'Triple combination therapy for melasma',
      medications: [
        { sku: 'TRI-CR', name: 'Tri-Luma Cream', price: 125, qty: 1, instructions: 'Apply to affected areas at night', refills: 2 },
        { sku: 'SPF-50', name: 'Medical Grade SPF 50', price: 35, qty: 1, instructions: 'Apply every morning', refills: 5 }
      ],
      duration: '8-12 weeks',
      followUp: '4 weeks',
      total: 160
    },
    rosacea: {
      name: 'Rosacea Management',
      description: 'Reduce redness and inflammation',
      medications: [
        { sku: 'MET-075-GEL', name: 'Metronidazole 0.75% Gel', price: 55, qty: 1, instructions: 'Apply twice daily', refills: 5 },
        { sku: 'DOX-40-CAP', name: 'Doxycycline 40mg', price: 65, qty: 30, instructions: 'Take 1 daily', refills: 5 },
        { sku: 'IVE-1-CR', name: 'Ivermectin 1% Cream', price: 85, qty: 1, instructions: 'Apply once daily', refills: 5 }
      ],
      duration: 'Ongoing',
      followUp: '8 weeks',
      total: 205
    }
  }
};

// Function to get all conditions
export const getAllConditions = () => {
  return Object.keys(treatmentProtocols);
};

// Function to get protocols for a condition
export const getProtocolsForCondition = (condition: string) => {
  return treatmentProtocols[condition as keyof typeof treatmentProtocols] || {};
};

// Function to calculate total cost for a protocol
export const calculateProtocolCost = (medications: any[]) => {
  return medications.reduce((sum, med) => sum + (med.price * (med.qty || 1)), 0);
};

// Export condition display names
export const conditionDisplayNames: { [key: string]: string } = {
  acne: 'Acne Treatment',
  ed: 'Erectile Dysfunction',
  hairLoss: 'Hair Loss',
  weightLoss: 'Weight Loss',
  anxiety: 'Anxiety',
  depression: 'Depression', 
  skincare: 'Skincare'
};
