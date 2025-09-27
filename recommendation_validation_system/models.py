"""
Data models for the Recommendation Validation System.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from enum import Enum


class ValidationLevel(Enum):
    """Validation status for recommendations"""
    CONFIRMED = "confirmed"
    CHALLENGED = "challenged"
    ALTERNATIVE_PREFERRED = "alternative_preferred"
    REQUIRES_MORE_DATA = "requires_more_data"
    OPPORTUNITY_MISSED = "opportunity_missed"  # Pre-production specific


class BusinessPriority(Enum):
    """Business priority levels"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    DEFERRED = "deferred"


class ModernizationLevel(Enum):
    """How modern/future-proof a solution is"""
    CUTTING_EDGE = "cutting_edge"
    MODERN = "modern"
    STANDARD = "standard"
    LEGACY = "legacy"
    OUTDATED = "outdated"


@dataclass
class OriginalRecommendation:
    """Original recommendation to be validated"""
    title: str
    description: str
    estimated_effort_weeks: int
    business_impact_score: float
    technical_necessity_score: float
    original_rationale: str
    modernization_level: Optional[ModernizationLevel] = None


@dataclass
class ValidationResult:
    """Result of validating a recommendation"""
    recommendation: OriginalRecommendation
    validation_level: ValidationLevel
    confidence_score: float  # 0-10
    business_necessity_score: float  # 0-10
    technical_necessity_score: float  # 0-10
    future_proofing_score: float  # 0-10 (pre-production focus)
    risk_score: float  # 0-10
    effort_vs_benefit_ratio: float
    challenges_raised: List[str] = field(default_factory=list)
    alternatives_identified: List[str] = field(default_factory=list)
    opportunities_identified: List[str] = field(default_factory=list)  # Pre-production specific
    supporting_evidence: List[str] = field(default_factory=list)
    blocking_concerns: List[str] = field(default_factory=list)
    modernization_gaps: List[str] = field(default_factory=list)  # Pre-production specific


@dataclass
class AlternativeSolution:
    """Alternative solution to original recommendation"""
    name: str
    description: str
    effort_weeks: int
    business_impact_score: float
    technical_impact_score: float
    future_proofing_score: float  # Pre-production specific
    risk_level: str
    modernization_level: ModernizationLevel
    implementation_steps: List[str]
    pros: List[str]
    cons: List[str]
    prerequisites: List[str]
    long_term_benefits: List[str] = field(default_factory=list)  # Pre-production specific


@dataclass
class ConstraintProfile:
    """Project constraints"""
    available_developer_weeks: int
    budget_constraints: float
    skill_gap_tolerance: str  # "low", "medium", "high"
    business_deadline_pressure: str
    risk_tolerance: str
    learning_curve_acceptance: str
    is_pre_production: bool = True  # Pre-production flag
    can_afford_breaking_changes: bool = True
    technology_ambition_level: str = "high"  # "conservative", "moderate", "high", "aggressive"
    
    
@dataclass
class ValidationState:
    """Shared state across validation agents"""
    original_recommendations: Dict[str, OriginalRecommendation] = field(default_factory=dict)
    validation_results: Dict[str, ValidationResult] = field(default_factory=dict)
    alternative_solutions: List[AlternativeSolution] = field(default_factory=list)
    constraint_profile: Optional[ConstraintProfile] = None
    business_context: Dict[str, Any] = field(default_factory=dict)
    codebase_metrics: Dict[str, Any] = field(default_factory=dict)
    final_recommendations: List[Dict[str, Any]] = field(default_factory=list)
    future_requirements: Dict[str, Any] = field(default_factory=dict)  # Pre-production specific
    modernization_opportunities: List[Dict[str, Any]] = field(default_factory=list)
    
    def add_validation_result(self, key: str, result: ValidationResult) -> None:
        """Add a validation result"""
        self.validation_results[key] = result
        
    def add_alternative(self, solution: AlternativeSolution) -> None:
        """Add an alternative solution"""
        self.alternative_solutions.append(solution)
        
    def set_metric(self, category: str, key: str, value: Any) -> None:
        """Set a codebase metric"""
        if category not in self.codebase_metrics:
            self.codebase_metrics[category] = {}
        self.codebase_metrics[category][key] = value
        
    def get_metric(self, category: str, key: str, default: Any = None) -> Any:
        """Get a codebase metric"""
        return self.codebase_metrics.get(category, {}).get(key, default)


@dataclass
class AgentFinding:
    """Finding from an agent analysis"""
    title: str
    description: str
    severity: str  # "low", "medium", "high", "critical"
    category: str
    file_path: Optional[str] = None
    line_number: Optional[int] = None
    recommendation: Optional[str] = None
    tags: List[str] = field(default_factory=list)


@dataclass
class AgentReport:
    """Report from an individual agent"""
    agent_name: str
    findings: List[AgentFinding] = field(default_factory=list)
    metrics: Dict[str, Any] = field(default_factory=dict)
    recommendations: List[str] = field(default_factory=list)
    opportunities: List[str] = field(default_factory=list)
    summary: Optional[str] = None
