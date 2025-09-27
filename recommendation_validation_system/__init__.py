"""
Recommendation Validation System

A multi-agent system for validating migration recommendations and exploring alternatives.
Optimized for pre-production environments where major changes are feasible.
"""

from .orchestrator import PreProductionValidationOrchestrator
from .models import (
    ValidationLevel,
    BusinessPriority,
    ModernizationLevel,
    OriginalRecommendation,
    ValidationResult,
    AlternativeSolution,
    ConstraintProfile,
    ValidationState
)

__all__ = [
    'PreProductionValidationOrchestrator',
    'ValidationLevel',
    'BusinessPriority',
    'ModernizationLevel', 
    'OriginalRecommendation',
    'ValidationResult',
    'AlternativeSolution',
    'ConstraintProfile',
    'ValidationState'
]
