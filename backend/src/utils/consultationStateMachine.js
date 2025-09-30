/**
 * Consultation State Machine
 * Defines valid consultation states and transitions for clinical workflow
 * Prevents invalid state changes that could impact patient care
 */

export const CONSULTATION_STATES = {
  PENDING: 'pending',
  TRIAGED: 'triaged',
  ASSIGNED: 'assigned',
  IN_REVIEW: 'in_review',
  REQUIRES_INFO: 'requires_info',
  REQUIRES_PEER_REVIEW: 'requires_peer_review',
  PRESCRIPTION_PENDING: 'prescription_pending',
  PRESCRIPTION_APPROVED: 'prescription_approved',
  PRESCRIPTION_SENT: 'prescription_sent',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  ESCALATED: 'escalated'
};

// Define valid state transitions with context requirements
export const STATE_TRANSITIONS = {
  [CONSULTATION_STATES.PENDING]: {
    allowedStates: [
      CONSULTATION_STATES.TRIAGED,
      CONSULTATION_STATES.CANCELLED,
      CONSULTATION_STATES.ESCALATED
    ],
    requiresContext: []
  },
  
  [CONSULTATION_STATES.TRIAGED]: {
    allowedStates: [
      CONSULTATION_STATES.ASSIGNED,
      CONSULTATION_STATES.ESCALATED,
      CONSULTATION_STATES.CANCELLED
    ],
    requiresContext: []
  },
  
  [CONSULTATION_STATES.ASSIGNED]: {
    allowedStates: [
      CONSULTATION_STATES.IN_REVIEW,
      CONSULTATION_STATES.REQUIRES_INFO,
      CONSULTATION_STATES.CANCELLED
    ],
    requiresContext: ['providerId']
  },
  
  [CONSULTATION_STATES.IN_REVIEW]: {
    allowedStates: [
      CONSULTATION_STATES.PRESCRIPTION_PENDING,
      CONSULTATION_STATES.COMPLETED,
      CONSULTATION_STATES.REQUIRES_PEER_REVIEW,
      CONSULTATION_STATES.REQUIRES_INFO,
      CONSULTATION_STATES.ESCALATED
    ],
    requiresContext: []
  },
  
  [CONSULTATION_STATES.REQUIRES_INFO]: {
    allowedStates: [
      CONSULTATION_STATES.IN_REVIEW,
      CONSULTATION_STATES.CANCELLED
    ],
    requiresContext: []
  },
  
  [CONSULTATION_STATES.REQUIRES_PEER_REVIEW]: {
    allowedStates: [
      CONSULTATION_STATES.IN_REVIEW,
      CONSULTATION_STATES.ESCALATED
    ],
    requiresContext: ['reviewedBy']
  },
  
  [CONSULTATION_STATES.PRESCRIPTION_PENDING]: {
    allowedStates: [
      CONSULTATION_STATES.PRESCRIPTION_APPROVED,
      CONSULTATION_STATES.REQUIRES_PEER_REVIEW,
      CONSULTATION_STATES.IN_REVIEW
    ],
    requiresContext: []
  },
  
  [CONSULTATION_STATES.PRESCRIPTION_APPROVED]: {
    allowedStates: [
      CONSULTATION_STATES.PRESCRIPTION_SENT,
      CONSULTATION_STATES.COMPLETED
    ],
    requiresContext: ['prescriptionData']
  },
  
  [CONSULTATION_STATES.PRESCRIPTION_SENT]: {
    allowedStates: [
      CONSULTATION_STATES.COMPLETED
    ],
    requiresContext: ['pharmacyOrderId']
  },
  
  [CONSULTATION_STATES.COMPLETED]: {
    allowedStates: [],
    requiresContext: []
  },
  
  [CONSULTATION_STATES.CANCELLED]: {
    allowedStates: [],
    requiresContext: ['cancellationReason']
  },
  
  [CONSULTATION_STATES.ESCALATED]: {
    allowedStates: [
      CONSULTATION_STATES.ASSIGNED,
      CONSULTATION_STATES.CANCELLED
    ],
    requiresContext: ['escalationReason']
  }
};

/**
 * Validate if a state transition is allowed
 * @param {string} currentState - Current consultation state
 * @param {string} newState - Desired new state
 * @param {Object} context - Context data required for transition
 * @returns {Object} - { valid: boolean, error: string, missingContext: array }
 */
export const validateStateTransition = (currentState, newState, context = {}) => {
  // Check if current state exists in our state machine
  if (!STATE_TRANSITIONS[currentState]) {
    return {
      valid: false,
      error: `Invalid current state: ${currentState}`,
      missingContext: []
    };
  }

  const transition = STATE_TRANSITIONS[currentState];
  
  // Check if new state is allowed from current state
  if (!transition.allowedStates.includes(newState)) {
    return {
      valid: false,
      error: `Invalid transition from ${currentState} to ${newState}`,
      allowedStates: transition.allowedStates,
      missingContext: []
    };
  }

  // Check if all required context is provided
  const missingContext = transition.requiresContext.filter(
    field => !context[field] || (typeof context[field] === 'string' && !context[field].trim())
  );

  if (missingContext.length > 0) {
    return {
      valid: false,
      error: `Missing required context for transition: ${missingContext.join(', ')}`,
      missingContext
    };
  }

  // Check new state specific requirements
  if (newState === CONSULTATION_STATES.ASSIGNED && !context.providerId) {
    return {
      valid: false,
      error: 'Provider ID required for assignment',
      missingContext: ['providerId']
    };
  }

  if (newState === CONSULTATION_STATES.PRESCRIPTION_APPROVED && !context.prescriptionData) {
    return {
      valid: false,
      error: 'Prescription data required for approval',
      missingContext: ['prescriptionData']
    };
  }

  return {
    valid: true,
    error: null,
    missingContext: []
  };
};

/**
 * Get human-readable description of state
 * @param {string} state - Consultation state
 * @returns {string} - Description
 */
export const getStateDescription = (state) => {
  const descriptions = {
    [CONSULTATION_STATES.PENDING]: 'Consultation submitted, awaiting triage',
    [CONSULTATION_STATES.TRIAGED]: 'Consultation triaged, awaiting provider assignment',
    [CONSULTATION_STATES.ASSIGNED]: 'Provider assigned, awaiting review',
    [CONSULTATION_STATES.IN_REVIEW]: 'Provider actively reviewing consultation',
    [CONSULTATION_STATES.REQUIRES_INFO]: 'Additional information needed from patient',
    [CONSULTATION_STATES.REQUIRES_PEER_REVIEW]: 'Flagged for peer review',
    [CONSULTATION_STATES.PRESCRIPTION_PENDING]: 'Treatment plan being prepared',
    [CONSULTATION_STATES.PRESCRIPTION_APPROVED]: 'Prescription approved by provider',
    [CONSULTATION_STATES.PRESCRIPTION_SENT]: 'Prescription sent to pharmacy',
    [CONSULTATION_STATES.COMPLETED]: 'Consultation completed',
    [CONSULTATION_STATES.CANCELLED]: 'Consultation cancelled',
    [CONSULTATION_STATES.ESCALATED]: 'Consultation escalated for urgent attention'
  };
  
  return descriptions[state] || 'Unknown state';
};

/**
 * Get patient-friendly status message
 * @param {string} state - Consultation state
 * @returns {string} - Patient-friendly message
 */
export const getPatientFriendlyMessage = (state) => {
  const messages = {
    [CONSULTATION_STATES.PENDING]: 'Your consultation has been submitted and is being reviewed.',
    [CONSULTATION_STATES.TRIAGED]: 'Your consultation has been prioritized.',
    [CONSULTATION_STATES.ASSIGNED]: 'A healthcare provider has been assigned to your consultation.',
    [CONSULTATION_STATES.IN_REVIEW]: 'Your provider is reviewing your consultation.',
    [CONSULTATION_STATES.REQUIRES_INFO]: 'Your provider needs additional information. Please check your messages.',
    [CONSULTATION_STATES.REQUIRES_PEER_REVIEW]: 'Your consultation is being reviewed by our medical team.',
    [CONSULTATION_STATES.PRESCRIPTION_PENDING]: 'Your provider is preparing your treatment plan.',
    [CONSULTATION_STATES.PRESCRIPTION_APPROVED]: 'Your treatment plan has been approved.',
    [CONSULTATION_STATES.PRESCRIPTION_SENT]: 'Your prescription has been sent to the pharmacy.',
    [CONSULTATION_STATES.COMPLETED]: 'Your consultation is complete. You can view the results in your dashboard.',
    [CONSULTATION_STATES.CANCELLED]: 'Your consultation has been cancelled.',
    [CONSULTATION_STATES.ESCALATED]: 'Your consultation requires urgent attention and has been prioritized.'
  };
  
  return messages[state] || 'Your consultation status has been updated.';
};

/**
 * Check if state is terminal (no further transitions possible)
 * @param {string} state - Consultation state
 * @returns {boolean} - True if terminal state
 */
export const isTerminalState = (state) => {
  return [
    CONSULTATION_STATES.COMPLETED,
    CONSULTATION_STATES.CANCELLED
  ].includes(state);
};

/**
 * Get all possible next states from current state
 * @param {string} currentState - Current consultation state
 * @returns {array} - Array of possible next states
 */
export const getPossibleNextStates = (currentState) => {
  const transition = STATE_TRANSITIONS[currentState];
  return transition ? transition.allowedStates : [];
};
