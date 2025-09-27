"""
Constraint Optimization Agent - Finds optimal solutions given real-world constraints.
"""

from pathlib import Path
from typing import Dict, Any, List, Tuple
from itertools import combinations

from .base_validator import BaseValidationAgent
from ..models import (
    ValidationState, 
    AgentReport,
    AlternativeSolution,
    OriginalRecommendation
)


class ConstraintOptimizationAgent(BaseValidationAgent):
    """Optimizes recommendations based on real-world constraints"""
    
    def __init__(self):
        super().__init__(
            "Constraint Optimization",
            "Finds optimal solution paths given time, budget, skill, and resource constraints"
        )
        
    def validate(self, state: ValidationState, codebase_root: Path) -> AgentReport:
        """Optimize recommendations based on constraints"""
        report = AgentReport(agent_name=self.name)
        
        # Analyze all constraints
        constraint_analysis = self._analyze_constraints(state)
        
        # Find optimal implementation order
        optimal_order = self._optimize_implementation_order(state, constraint_analysis)
        
        # Identify constraint violations
        violations = self._identify_constraint_violations(state, constraint_analysis)
        
        # Generate phased approach
        phased_plan = self._generate_phased_approach(state, constraint_analysis)
        
        # Find quick wins
        quick_wins = self._identify_quick_wins(state, constraint_analysis)
        
        # Create findings for constraint violations
        for violation in violations:
            report.findings.append(self.create_finding(
                title=f"Constraint Violation: {violation['type']}",
                description=violation['description'],
                severity="high",
                category="constraint",
                recommendation=violation['solution'],
                tags=["constraint", "feasibility", violation['type']]
            ))
        
        # Calculate metrics
        feasibility_score = self._calculate_feasibility_score(
            constraint_analysis,
            violations,
            state
        )
        
        report.metrics = {
            "feasibility_score": feasibility_score,
            "constraint_violations": len(violations),
            "available_budget_used": constraint_analysis['budget_utilization'],
            "time_utilization": constraint_analysis['time_utilization'],
            "skill_gap_percentage": constraint_analysis['skill_gap_percentage'],
            "quick_wins_identified": len(quick_wins),
            "implementation_phases": len(phased_plan),
            "risk_adjusted_score": self._calculate_risk_adjusted_score(state, constraint_analysis)
        }
        
        # Generate recommendations
        report.recommendations = self._generate_optimization_recommendations(
            state,
            constraint_analysis,
            phased_plan,
            quick_wins,
            optimal_order
        )
        
        report.summary = self._generate_optimization_summary(
            report.metrics,
            constraint_analysis,
            phased_plan
        )
        
        # Store optimization results in state
        state.final_recommendations = self._compile_final_recommendations(
            optimal_order,
            phased_plan,
            quick_wins,
            constraint_analysis
        )
        
        return report
    
    def _analyze_constraints(self, state: ValidationState) -> Dict[str, Any]:
        """Analyze all project constraints"""
        
        if not state.constraint_profile:
            # Use defaults if no constraint profile
            return {
                "has_constraints": False,
                "budget_available": float('inf'),
                "time_available_weeks": 12,
                "team_size": 3,
                "skill_gaps": [],
                "risk_tolerance": "medium",
                "budget_utilization": 0,
                "time_utilization": 0,
                "skill_gap_percentage": 0
            }
        
        profile = state.constraint_profile
        context = state.business_context
        
        # Calculate budget constraints
        hourly_rate = context.get("developer_hourly_cost", 100)
        total_effort_weeks = sum(rec.estimated_effort_weeks for rec in state.original_recommendations.values())
        total_cost = total_effort_weeks * 40 * hourly_rate
        budget_utilization = (total_cost / profile.budget_constraints * 100) if profile.budget_constraints > 0 else 100
        
        # Calculate time constraints
        time_utilization = (total_effort_weeks / profile.available_developer_weeks * 100) if profile.available_developer_weeks > 0 else 100
        
        # Identify skill gaps
        skill_gaps = []
        if any("nestjs" in rec.description.lower() for rec in state.original_recommendations.values()):
            if context.get("team_nestjs_experience", "none") == "none":
                skill_gaps.append({"skill": "NestJS", "severity": "high", "training_weeks": 2})
        
        if any("typescript" in rec.description.lower() for rec in state.original_recommendations.values()):
            if context.get("team_typescript_experience", "none") == "none":
                skill_gaps.append({"skill": "TypeScript", "severity": "medium", "training_weeks": 1})
        
        if any("graphql" in rec.description.lower() for rec in state.original_recommendations.values()):
            if context.get("team_graphql_experience", "none") == "none":
                skill_gaps.append({"skill": "GraphQL", "severity": "medium", "training_weeks": 1})
        
        skill_gap_percentage = (len(skill_gaps) / 5) * 100  # Assume 5 key skills max
        
        return {
            "has_constraints": True,
            "budget_available": profile.budget_constraints,
            "time_available_weeks": profile.available_developer_weeks,
            "team_size": context.get("team_size", 3),
            "skill_gaps": skill_gaps,
            "risk_tolerance": profile.risk_tolerance,
            "learning_curve_acceptance": profile.learning_curve_acceptance,
            "can_afford_breaking_changes": profile.can_afford_breaking_changes,
            "budget_utilization": budget_utilization,
            "time_utilization": time_utilization,
            "skill_gap_percentage": skill_gap_percentage,
            "is_pre_production": profile.is_pre_production
        }
    
    def _optimize_implementation_order(
        self,
        state: ValidationState,
        constraints: Dict[str, Any]
    ) -> List[Tuple[str, Any]]:
        """Find optimal order for implementing recommendations"""
        
        recommendations = list(state.original_recommendations.items())
        
        # Score each recommendation for priority
        scored_recs = []
        for name, rec in recommendations:
            score = self._calculate_priority_score(name, rec, state, constraints)
            scored_recs.append((name, rec, score))
        
        # Sort by priority score
        scored_recs.sort(key=lambda x: x[2], reverse=True)
        
        # Apply dependency ordering
        ordered = self._apply_dependency_ordering(scored_recs, state)
        
        return [(name, rec) for name, rec, _ in ordered]
    
    def _calculate_priority_score(
        self,
        name: str,
        rec: OriginalRecommendation,
        state: ValidationState,
        constraints: Dict[str, Any]
    ) -> float:
        """Calculate priority score for a recommendation"""
        
        score = 0.0
        
        # Business impact weight
        score += rec.business_impact_score * 2
        
        # Technical necessity weight
        score += rec.technical_necessity_score * 1.5
        
        # Quick win bonus (low effort, high impact)
        if rec.estimated_effort_weeks <= 2:
            score += 5
        
        # Foundation bonus (needed for other work)
        if "foundation" in name.lower() or "typescript" in name.lower() or "documentation" in name.lower():
            score += 3
        
        # Pre-production advantage
        if constraints.get("is_pre_production"):
            if "architecture" in name.lower() or "database" in name.lower():
                score += 4
        
        # Risk adjustment
        if constraints.get("risk_tolerance") == "low":
            # Prefer low-risk items
            if "incremental" in rec.description.lower() or "gradual" in rec.description.lower():
                score += 2
        
        # Skill gap penalty
        skill_gap_skills = [gap["skill"].lower() for gap in constraints.get("skill_gaps", [])]
        if any(skill in rec.description.lower() for skill in skill_gap_skills):
            score -= 2
        
        return score
    
    def _apply_dependency_ordering(
        self,
        scored_recs: List[Tuple[str, Any, float]],
        state: ValidationState
    ) -> List[Tuple[str, Any, float]]:
        """Apply dependency constraints to ordering"""
        
        # Define dependencies
        dependencies = {
            "typescript_migration": [],  # No dependencies
            "api_documentation": ["typescript_migration"],  # Better with TypeScript
            "nestjs_migration": ["typescript_migration"],  # Requires TypeScript
            "frontend_refactor": ["api_documentation"],  # Needs documented APIs
            "testing_strategy": ["typescript_migration"],  # Better with types
        }
        
        # Simple topological sort with priority preservation
        ordered = []
        added = set()
        
        while len(ordered) < len(scored_recs):
            for name, rec, score in scored_recs:
                if name in added:
                    continue
                
                # Check dependencies
                deps = dependencies.get(name, [])
                if all(dep in added or dep not in [n for n, _, _ in scored_recs] for dep in deps):
                    ordered.append((name, rec, score))
                    added.add(name)
                    break
            else:
                # Add remaining items without dependency constraints
                for name, rec, score in scored_recs:
                    if name not in added:
                        ordered.append((name, rec, score))
                        added.add(name)
        
        return ordered
    
    def _identify_constraint_violations(
        self,
        state: ValidationState,
        constraints: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Identify where recommendations violate constraints"""
        
        violations = []
        
        # Budget violation
        if constraints['budget_utilization'] > 100:
            violations.append({
                "type": "budget",
                "description": f"Budget exceeded by {constraints['budget_utilization'] - 100:.1f}%",
                "solution": "Phase implementation or reduce scope"
            })
        
        # Time violation
        if constraints['time_utilization'] > 100:
            violations.append({
                "type": "time",
                "description": f"Timeline exceeded by {constraints['time_utilization'] - 100:.1f}%",
                "solution": "Parallelize work or extend timeline"
            })
        
        # Skill gap violations
        if constraints['skill_gap_percentage'] > 40:
            violations.append({
                "type": "skills",
                "description": f"Significant skill gaps: {constraints['skill_gap_percentage']:.0f}% of required skills missing",
                "solution": "Invest in training or hire specialists"
            })
        
        # Risk tolerance violation
        if constraints.get('risk_tolerance') == "low":
            high_risk_count = sum(
                1 for rec in state.original_recommendations.values()
                if "migration" in rec.title.lower() or "rewrite" in rec.title.lower()
            )
            if high_risk_count > 2:
                violations.append({
                    "type": "risk",
                    "description": f"{high_risk_count} high-risk items exceed low risk tolerance",
                    "solution": "Choose incremental approaches over big-bang changes"
                })
        
        return violations
    
    def _generate_phased_approach(
        self,
        state: ValidationState,
        constraints: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate a phased implementation plan"""
        
        phases = []
        available_weeks = constraints['time_available_weeks']
        team_size = constraints['team_size']
        
        # Get optimized order
        ordered_recs = self._optimize_implementation_order(state, constraints)
        
        # Phase 1: Foundation (Quick wins and prerequisites)
        phase1_items = []
        phase1_weeks = 0
        for name, rec in ordered_recs:
            if phase1_weeks + rec.estimated_effort_weeks <= min(4, available_weeks * 0.3):
                if rec.estimated_effort_weeks <= 2 or "foundation" in name.lower():
                    phase1_items.append((name, rec))
                    phase1_weeks += rec.estimated_effort_weeks
        
        if phase1_items:
            phases.append({
                "phase": 1,
                "name": "Foundation & Quick Wins",
                "duration_weeks": phase1_weeks,
                "items": [name for name, _ in phase1_items],
                "focus": "Build foundation and deliver immediate value",
                "risk": "low"
            })
        
        # Phase 2: Core improvements
        phase2_items = []
        phase2_weeks = 0
        remaining_weeks = available_weeks - phase1_weeks
        
        for name, rec in ordered_recs:
            if (name, rec) not in phase1_items:
                if phase2_weeks + rec.estimated_effort_weeks <= min(8, remaining_weeks * 0.5):
                    if rec.business_impact_score >= 7:
                        phase2_items.append((name, rec))
                        phase2_weeks += rec.estimated_effort_weeks
        
        if phase2_items:
            phases.append({
                "phase": 2,
                "name": "Core Improvements",
                "duration_weeks": phase2_weeks,
                "items": [name for name, _ in phase2_items],
                "focus": "Implement high-impact improvements",
                "risk": "medium"
            })
        
        # Phase 3: Advanced features
        phase3_items = []
        phase3_weeks = 0
        remaining_weeks -= phase2_weeks
        
        for name, rec in ordered_recs:
            if (name, rec) not in phase1_items and (name, rec) not in phase2_items:
                if remaining_weeks > 0:
                    phase3_items.append((name, rec))
                    phase3_weeks += rec.estimated_effort_weeks
                    remaining_weeks -= rec.estimated_effort_weeks
        
        if phase3_items:
            phases.append({
                "phase": 3,
                "name": "Advanced Features",
                "duration_weeks": phase3_weeks,
                "items": [name for name, _ in phase3_items],
                "focus": "Complete transformation",
                "risk": "medium-high"
            })
        
        return phases
    
    def _identify_quick_wins(
        self,
        state: ValidationState,
        constraints: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Identify quick win opportunities"""
        
        quick_wins = []
        
        # From original recommendations
        for name, rec in state.original_recommendations.items():
            if rec.estimated_effort_weeks <= 2 and rec.business_impact_score >= 7:
                quick_wins.append({
                    "name": name,
                    "effort_weeks": rec.estimated_effort_weeks,
                    "impact": rec.business_impact_score,
                    "roi": rec.business_impact_score / max(rec.estimated_effort_weeks, 0.5),
                    "source": "original"
                })
        
        # From alternatives
        for alt in state.alternative_solutions:
            if alt.effort_weeks <= 2 and alt.business_impact_score >= 7:
                quick_wins.append({
                    "name": alt.name,
                    "effort_weeks": alt.effort_weeks,
                    "impact": alt.business_impact_score,
                    "roi": alt.business_impact_score / max(alt.effort_weeks, 0.5),
                    "source": "alternative"
                })
        
        # Sort by ROI
        quick_wins.sort(key=lambda x: x["roi"], reverse=True)
        
        return quick_wins[:5]  # Top 5 quick wins
    
    def _calculate_feasibility_score(
        self,
        constraints: Dict[str, Any],
        violations: List[Dict[str, Any]],
        state: ValidationState
    ) -> float:
        """Calculate overall feasibility score"""
        
        score = 10.0
        
        # Deduct for violations
        score -= len(violations) * 1.5
        
        # Budget feasibility
        if constraints['budget_utilization'] > 100:
            score -= 2
        elif constraints['budget_utilization'] > 80:
            score -= 1
        
        # Time feasibility
        if constraints['time_utilization'] > 100:
            score -= 2
        elif constraints['time_utilization'] > 80:
            score -= 1
        
        # Skill gaps
        if constraints['skill_gap_percentage'] > 50:
            score -= 2
        elif constraints['skill_gap_percentage'] > 25:
            score -= 1
        
        # Bonus for pre-production flexibility
        if constraints.get('is_pre_production'):
            score += 1
        
        # Bonus for high risk tolerance
        if constraints.get('risk_tolerance') == "high":
            score += 0.5
        
        return max(0, min(10, score))
    
    def _calculate_risk_adjusted_score(
        self,
        state: ValidationState,
        constraints: Dict[str, Any]
    ) -> float:
        """Calculate risk-adjusted optimization score"""
        
        base_score = 5.0
        
        # Risk factors
        risk_factors = {
            "budget_overrun": constraints['budget_utilization'] > 100,
            "timeline_overrun": constraints['time_utilization'] > 100,
            "skill_gaps": constraints['skill_gap_percentage'] > 30,
            "high_complexity": any("migration" in rec.title.lower() for rec in state.original_recommendations.values())
        }
        
        # Calculate risk score
        risk_count = sum(risk_factors.values())
        risk_penalty = risk_count * 1.5
        
        # Risk tolerance adjustment
        if constraints.get('risk_tolerance') == "low":
            risk_penalty *= 1.5
        elif constraints.get('risk_tolerance') == "high":
            risk_penalty *= 0.5
        
        # Calculate final score
        score = base_score - risk_penalty
        
        # Add bonus for mitigation strategies
        if len(state.alternative_solutions) > 3:
            score += 1  # Have alternatives
        
        return max(0, min(10, score))
    
    def _compile_final_recommendations(
        self,
        optimal_order: List[Tuple[str, Any]],
        phased_plan: List[Dict[str, Any]],
        quick_wins: List[Dict[str, Any]],
        constraints: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Compile final optimized recommendations"""
        
        final_recs = []
        
        # Add phase information to recommendations
        for phase in phased_plan:
            phase_recs = {
                "phase": phase["phase"],
                "name": phase["name"],
                "duration_weeks": phase["duration_weeks"],
                "recommendations": []
            }
            
            for item_name in phase["items"]:
                # Find the recommendation
                for name, rec in optimal_order:
                    if name == item_name:
                        phase_recs["recommendations"].append({
                            "name": name,
                            "description": rec.description,
                            "effort_weeks": rec.estimated_effort_weeks,
                            "business_impact": rec.business_impact_score,
                            "technical_impact": rec.technical_necessity_score,
                            "is_quick_win": any(qw["name"] == name for qw in quick_wins)
                        })
                        break
            
            final_recs.append(phase_recs)
        
        return final_recs
    
    def _generate_optimization_recommendations(
        self,
        state: ValidationState,
        constraints: Dict[str, Any],
        phased_plan: List[Dict[str, Any]],
        quick_wins: List[Dict[str, Any]],
        optimal_order: List[Tuple[str, Any]]
    ) -> List[str]:
        """Generate optimization recommendations"""
        
        recommendations = []
        
        # Quick wins recommendation
        if quick_wins:
            recommendations.append(
                f"Start with {len(quick_wins)} quick wins that deliver immediate value in 2 weeks or less"
            )
        
        # Phasing recommendation
        if phased_plan:
            recommendations.append(
                f"Implement in {len(phased_plan)} phases over {sum(p['duration_weeks'] for p in phased_plan)} weeks"
            )
        
        # Constraint-based recommendations
        if constraints['budget_utilization'] > 100:
            recommendations.append(
                "Consider deferring lower-priority items to stay within budget"
            )
        
        if constraints['time_utilization'] > 100:
            recommendations.append(
                "Parallelize independent work streams or extend timeline"
            )
        
        if constraints['skill_gap_percentage'] > 30:
            recommendations.append(
                f"Address skill gaps through training ({', '.join(g['skill'] for g in constraints['skill_gaps'])}) or hiring"
            )
        
        # Pre-production advantage
        if constraints.get('is_pre_production'):
            recommendations.append(
                "Leverage pre-production flexibility to make foundational changes now"
            )
        
        # Risk mitigation
        if constraints.get('risk_tolerance') == "low":
            incremental_count = sum(
                1 for alt in state.alternative_solutions 
                if alt.risk_level in ["very_low", "low"]
            )
            if incremental_count > 0:
                recommendations.append(
                    f"Consider {incremental_count} low-risk alternatives for risk-averse implementation"
                )
        
        return recommendations
    
    def _generate_optimization_summary(
        self,
        metrics: Dict[str, Any],
        constraints: Dict[str, Any],
        phased_plan: List[Dict[str, Any]]
    ) -> str:
        """Generate summary of optimization analysis"""
        
        feasibility = metrics['feasibility_score']
        
        if feasibility >= 7:
            assessment = "highly feasible with current constraints"
        elif feasibility >= 5:
            assessment = "feasible with some adjustments needed"
        else:
            assessment = "challenging given current constraints"
        
        summary = f"Implementation is {assessment}. "
        summary += f"Feasibility score: {feasibility:.1f}/10. "
        
        if metrics['constraint_violations'] > 0:
            summary += f"{metrics['constraint_violations']} constraint violations need addressing. "
        
        if phased_plan:
            total_weeks = sum(p['duration_weeks'] for p in phased_plan)
            summary += f"Recommended {len(phased_plan)}-phase approach over {total_weeks} weeks. "
        
        if metrics['quick_wins_identified'] > 0:
            summary += f"{metrics['quick_wins_identified']} quick wins available for immediate impact. "
        
        if constraints['budget_utilization'] <= 100:
            summary += f"Within budget ({constraints['budget_utilization']:.0f}% utilization). "
        else:
            summary += f"Over budget by {constraints['budget_utilization'] - 100:.0f}%. "
        
        return summary
