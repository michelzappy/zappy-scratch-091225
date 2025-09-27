"""
Business Context Alignment Agent - Ensures recommendations align with business priorities.
"""

from pathlib import Path
from typing import Dict, Any, List

from .base_validator import BaseValidationAgent
from ..models import (
    ValidationState, 
    AgentReport,
    BusinessPriority,
    ValidationResult
)


class BusinessContextAlignmentAgent(BaseValidationAgent):
    """Validates that technical recommendations align with business goals and constraints"""
    
    def __init__(self):
        super().__init__(
            "Business Context Alignment",
            "Ensures recommendations align with business priorities, timeline, and resources"
        )
        
    def validate(self, state: ValidationState, codebase_root: Path) -> AgentReport:
        """Analyze business context and validate recommendation priorities"""
        report = AgentReport(agent_name=self.name)
        
        # Analyze business context
        business_analysis = self._analyze_business_context(state)
        
        # Validate priority alignment
        priority_alignment = self._validate_priority_alignment(state)
        
        # Calculate ROI estimates
        roi_analysis = self._calculate_roi_estimates(state)
        
        # Assess resource requirements
        resource_assessment = self._assess_resource_requirements(state)
        
        # Generate findings
        for misalignment in priority_alignment['misalignments']:
            report.findings.append(self.create_finding(
                title=f"Business Misalignment: {misalignment['recommendation']}",
                description=misalignment['reason'],
                severity=misalignment['severity'],
                category="business",
                recommendation=misalignment['suggestion'],
                tags=["business", "priority", "alignment"]
            ))
        
        # Calculate metrics
        report.metrics = {
            "business_alignment_score": self._calculate_alignment_score(
                business_analysis,
                priority_alignment,
                roi_analysis
            ),
            "average_roi_ratio": self._calculate_average_roi(roi_analysis),
            "resource_utilization": resource_assessment['utilization_percentage'],
            "timeline_feasibility": resource_assessment['timeline_feasibility'],
            "business_value_score": self._calculate_business_value_score(state, roi_analysis)
        }
        
        # Generate recommendations
        report.recommendations = self._generate_business_recommendations(
            state,
            business_analysis,
            priority_alignment,
            resource_assessment
        )
        
        report.summary = self._generate_business_summary(
            report.metrics,
            priority_alignment,
            resource_assessment
        )
        
        # Update validation results with business context
        for rec_name in state.validation_results:
            if rec_name in roi_analysis:
                validation = state.validation_results[rec_name]
                validation.business_necessity_score = self._calculate_business_necessity(
                    rec_name, 
                    business_analysis,
                    roi_analysis
                )
                validation.effort_vs_benefit_ratio = roi_analysis[rec_name]['roi_ratio']
        
        return report
    
    def _analyze_business_context(self, state: ValidationState) -> Dict[str, Any]:
        """Analyze current business situation"""
        context = state.business_context
        
        analysis = {
            "industry": context.get("industry", "telehealth"),
            "stage": context.get("stage", "pre-production"),
            "revenue_pressure": context.get("revenue_pressure", "medium"),
            "compliance_requirements": context.get("hipaa_audit_timeline", "unknown"),
            "user_growth_rate": context.get("monthly_user_growth", 0),
            "current_pain_points": context.get("top_business_pain_points", []),
            "feature_delivery_pressure": context.get("feature_backlog_pressure", "medium"),
            "team_size": context.get("team_size", 3),
            "burn_rate": context.get("monthly_burn_rate", 0),
            "runway_months": context.get("runway_months", 12),
            "funding_stage": context.get("funding_stage", "seed"),
            "competition_level": context.get("competition_level", "high")
        }
        
        # Calculate business urgency score
        urgency_factors = []
        
        if analysis["revenue_pressure"] == "high":
            urgency_factors.append("Revenue growth is critical priority")
        
        if "compliance" in str(analysis["compliance_requirements"]).lower():
            urgency_factors.append("Compliance deadline approaching")
        
        if analysis["user_growth_rate"] > 20:
            urgency_factors.append("Rapid user growth requiring stability")
        
        if analysis["runway_months"] < 6:
            urgency_factors.append("Limited runway requires revenue focus")
        
        if analysis["competition_level"] == "high":
            urgency_factors.append("High competition requires rapid iteration")
        
        analysis["business_urgency_factors"] = urgency_factors
        analysis["overall_urgency"] = self._determine_urgency_level(urgency_factors)
        
        # Determine business priorities
        priorities = []
        
        if analysis["stage"] == "pre-production":
            priorities.extend(["build_solid_foundation", "prepare_for_scale"])
        
        if analysis["revenue_pressure"] == "high":
            priorities.append("revenue_generation")
        
        if analysis["compliance_requirements"] != "unknown":
            priorities.append("compliance_readiness")
        
        if analysis["feature_delivery_pressure"] == "high":
            priorities.append("feature_velocity")
        
        analysis["key_priorities"] = priorities
        
        return analysis
    
    def _validate_priority_alignment(self, state: ValidationState) -> Dict[str, Any]:
        """Check if technical recommendations align with business priorities"""
        
        business_context = state.business_context
        alignment_scores = {}
        misalignments = []
        
        for rec_name, rec in state.original_recommendations.items():
            alignment_score = 5.0  # neutral baseline
            
            # Check effort vs business stage
            if business_context.get("stage") == "pre-production":
                if rec.estimated_effort_weeks > 8:
                    alignment_score -= 1
                    misalignments.append({
                        "recommendation": rec_name,
                        "reason": f"Effort ({rec.estimated_effort_weeks} weeks) may delay launch",
                        "severity": "medium",
                        "suggestion": "Consider phased implementation or faster alternatives"
                    })
            
            # Check against revenue pressure
            if business_context.get("revenue_pressure") == "high":
                if rec.business_impact_score < 7:
                    alignment_score -= 2
                    misalignments.append({
                        "recommendation": rec_name,
                        "reason": "Low business impact when revenue is critical",
                        "severity": "high",
                        "suggestion": "Prioritize revenue-generating features first"
                    })
            
            # Check against team capacity
            team_size = business_context.get("team_size", 3)
            if rec.estimated_effort_weeks > team_size * 2:
                alignment_score -= 1.5
                misalignments.append({
                    "recommendation": rec_name,
                    "reason": f"Requires {rec.estimated_effort_weeks} weeks with only {team_size} developers",
                    "severity": "medium",
                    "suggestion": "Break into smaller deliverables or increase team"
                })
            
            # Bonus for critical alignments
            if "compliance" in rec.title.lower() and business_context.get("hipaa_audit_timeline"):
                alignment_score += 2
            
            if "api" in rec.title.lower() and business_context.get("feature_delivery_pressure") == "high":
                alignment_score += 1.5
            
            alignment_scores[rec_name] = {
                "score": max(0, min(10, alignment_score)),
                "priority": self._determine_business_priority(alignment_score),
                "justification": self._explain_priority(rec_name, alignment_score, business_context)
            }
        
        return {
            "alignment_scores": alignment_scores,
            "misalignments": misalignments,
            "total_alignment": sum(s["score"] for s in alignment_scores.values()) / len(alignment_scores) if alignment_scores else 5
        }
    
    def _calculate_roi_estimates(self, state: ValidationState) -> Dict[str, Any]:
        """Calculate rough ROI estimates for recommendations"""
        
        roi_estimates = {}
        hourly_rate = state.business_context.get("developer_hourly_cost", 100)
        
        for rec_name, rec in state.original_recommendations.items():
            # Estimate costs
            development_cost = rec.estimated_effort_weeks * 40 * hourly_rate
            opportunity_cost = self._estimate_opportunity_cost(rec, state)
            training_cost = self._estimate_training_cost(rec, state)
            total_cost = development_cost + opportunity_cost + training_cost
            
            # Estimate benefits
            productivity_gain = self._estimate_productivity_gain(rec_name, rec, state)
            maintenance_reduction = self._estimate_maintenance_reduction(rec_name, rec)
            business_value_gain = rec.business_impact_score * 10000  # rough value mapping
            risk_mitigation_value = self._estimate_risk_mitigation_value(rec_name, state)
            
            total_benefit = productivity_gain + maintenance_reduction + business_value_gain + risk_mitigation_value
            
            roi_estimates[rec_name] = {
                "total_cost": total_cost,
                "total_benefit": total_benefit,
                "roi_ratio": total_benefit / total_cost if total_cost > 0 else 0,
                "payback_period_months": (total_cost / (total_benefit / 12)) if total_benefit > 0 else float('inf'),
                "break_even_point": self._calculate_break_even(total_cost, total_benefit)
            }
        
        return roi_estimates
    
    def _assess_resource_requirements(self, state: ValidationState) -> Dict[str, Any]:
        """Assess if resources are sufficient for recommendations"""
        
        total_effort_weeks = sum(rec.estimated_effort_weeks for rec in state.original_recommendations.values())
        available_weeks = state.constraint_profile.available_developer_weeks if state.constraint_profile else 12
        
        team_size = state.business_context.get("team_size", 3)
        parallel_capacity = team_size * available_weeks
        
        # Check skill requirements
        skill_gaps = []
        if any("nestjs" in rec.description.lower() for rec in state.original_recommendations.values()):
            if state.business_context.get("team_nestjs_experience", "none") == "none":
                skill_gaps.append("NestJS expertise required")
        
        if any("typescript" in rec.description.lower() for rec in state.original_recommendations.values()):
            if state.business_context.get("team_typescript_experience", "basic") == "none":
                skill_gaps.append("TypeScript training needed")
        
        # Timeline feasibility
        if total_effort_weeks > parallel_capacity:
            timeline_feasibility = "challenging"
            feasibility_score = 3
        elif total_effort_weeks > parallel_capacity * 0.8:
            timeline_feasibility = "tight"
            feasibility_score = 6
        else:
            timeline_feasibility = "comfortable"
            feasibility_score = 9
        
        return {
            "total_effort_required": total_effort_weeks,
            "available_capacity": parallel_capacity,
            "utilization_percentage": (total_effort_weeks / parallel_capacity * 100) if parallel_capacity > 0 else 100,
            "timeline_feasibility": timeline_feasibility,
            "feasibility_score": feasibility_score,
            "skill_gaps": skill_gaps,
            "critical_path_weeks": self._calculate_critical_path(state)
        }
    
    def _determine_urgency_level(self, urgency_factors: List[str]) -> str:
        """Determine overall urgency level based on factors"""
        if len(urgency_factors) >= 3:
            return "high"
        elif len(urgency_factors) >= 1:
            return "medium"
        else:
            return "low"
    
    def _determine_business_priority(self, alignment_score: float) -> BusinessPriority:
        """Determine business priority based on alignment score"""
        if alignment_score >= 8:
            return BusinessPriority.CRITICAL
        elif alignment_score >= 6:
            return BusinessPriority.HIGH
        elif alignment_score >= 4:
            return BusinessPriority.MEDIUM
        elif alignment_score >= 2:
            return BusinessPriority.LOW
        else:
            return BusinessPriority.DEFERRED
    
    def _explain_priority(self, rec_name: str, score: float, context: Dict[str, Any]) -> str:
        """Explain why a recommendation has its priority"""
        
        explanations = []
        
        if score >= 7:
            explanations.append("High alignment with business goals")
        
        if context.get("revenue_pressure") == "high" and "api" in rec_name.lower():
            explanations.append("Critical for revenue generation")
        
        if context.get("stage") == "pre-production":
            explanations.append("Foundation-building priority")
        
        if score < 4:
            explanations.append("Low immediate business value")
        
        return "; ".join(explanations) if explanations else "Standard priority"
    
    def _estimate_opportunity_cost(self, rec: Any, state: ValidationState) -> float:
        """Estimate opportunity cost of implementing recommendation"""
        
        # What could we build instead with this time?
        feature_value_per_week = state.business_context.get("average_feature_value", 5000)
        return rec.estimated_effort_weeks * feature_value_per_week * 0.5  # 50% opportunity cost
    
    def _estimate_training_cost(self, rec: Any, state: ValidationState) -> float:
        """Estimate training cost for new technologies"""
        
        training_cost = 0
        team_size = state.business_context.get("team_size", 3)
        
        if "nestjs" in rec.title.lower():
            training_cost += team_size * 40 * 100  # 1 week training per developer
        
        if "typescript" in rec.title.lower():
            training_cost += team_size * 20 * 100  # 0.5 week training per developer
        
        return training_cost
    
    def _estimate_productivity_gain(self, rec_name: str, rec: Any, state: ValidationState) -> float:
        """Estimate productivity gains from recommendation"""
        
        # Base productivity improvement
        if "typescript" in rec_name.lower():
            return 20000  # Fewer bugs, better refactoring
        elif "api_documentation" in rec_name.lower():
            return 15000  # Faster onboarding, fewer misunderstandings
        elif "nestjs" in rec_name.lower():
            return 25000  # Better structure, faster development
        else:
            return rec.technical_necessity_score * 2000
    
    def _estimate_maintenance_reduction(self, rec_name: str, rec: Any) -> float:
        """Estimate maintenance cost reduction"""
        
        if "typescript" in rec_name.lower():
            return 10000  # Type safety reduces maintenance
        elif "testing" in rec_name.lower():
            return 15000  # Tests reduce regression bugs
        else:
            return rec.technical_necessity_score * 1000
    
    def _estimate_risk_mitigation_value(self, rec_name: str, state: ValidationState) -> float:
        """Estimate value of risk mitigation"""
        
        if state.business_context.get("industry") == "telehealth":
            if "compliance" in rec_name.lower() or "hipaa" in rec_name.lower():
                return 50000  # High value for compliance in healthcare
        
        if "security" in rec_name.lower():
            return 20000  # Security breach prevention
        
        return 5000  # Base risk mitigation value
    
    def _calculate_break_even(self, cost: float, benefit: float) -> int:
        """Calculate break-even point in months"""
        if benefit <= 0:
            return 999  # Never breaks even
        
        monthly_benefit = benefit / 12
        return int(cost / monthly_benefit) if monthly_benefit > 0 else 999
    
    def _calculate_critical_path(self, state: ValidationState) -> float:
        """Calculate critical path for implementation"""
        
        # Simplified - assumes some parallelization possible
        total_weeks = sum(rec.estimated_effort_weeks for rec in state.original_recommendations.values())
        team_size = state.business_context.get("team_size", 3)
        
        # Can parallelize based on team size
        return total_weeks / min(team_size, 3)
    
    def _calculate_alignment_score(
        self, 
        business_analysis: Dict[str, Any],
        priority_alignment: Dict[str, Any],
        roi_analysis: Dict[str, Any]
    ) -> float:
        """Calculate overall business alignment score"""
        
        # Base score from priority alignment
        score = priority_alignment.get("total_alignment", 5)
        
        # Adjust for ROI
        avg_roi = self._calculate_average_roi(roi_analysis)
        if avg_roi > 2:
            score += 1
        elif avg_roi < 1:
            score -= 1
        
        # Adjust for business urgency
        if business_analysis["overall_urgency"] == "high":
            # In high urgency, quick wins are more valuable
            quick_wins = sum(1 for rec in roi_analysis.values() if rec["payback_period_months"] < 3)
            if quick_wins > 2:
                score += 1
        
        return min(max(score, 0), 10)
    
    def _calculate_average_roi(self, roi_analysis: Dict[str, Any]) -> float:
        """Calculate average ROI across recommendations"""
        if not roi_analysis:
            return 1.0
        
        total_roi = sum(r["roi_ratio"] for r in roi_analysis.values())
        return total_roi / len(roi_analysis)
    
    def _calculate_business_necessity(
        self,
        rec_name: str,
        business_analysis: Dict[str, Any],
        roi_analysis: Dict[str, Any]
    ) -> float:
        """Calculate business necessity score for a recommendation"""
        
        score = 5.0  # baseline
        
        # Check ROI
        if rec_name in roi_analysis:
            roi = roi_analysis[rec_name]["roi_ratio"]
            if roi > 2:
                score += 2
            elif roi > 1.5:
                score += 1
            elif roi < 0.5:
                score -= 2
        
        # Check against business priorities
        if "revenue" in business_analysis["key_priorities"]:
            if "api" in rec_name.lower() or "payment" in rec_name.lower():
                score += 1.5
        
        if "compliance" in business_analysis["key_priorities"]:
            if "security" in rec_name.lower() or "audit" in rec_name.lower():
                score += 2
        
        if business_analysis["stage"] == "pre-production":
            if "foundation" in rec_name.lower() or "architecture" in rec_name.lower():
                score += 1
        
        return min(max(score, 0), 10)
    
    def _calculate_business_value_score(
        self,
        state: ValidationState,
        roi_analysis: Dict[str, Any]
    ) -> float:
        """Calculate overall business value score"""
        
        # Consider ROI, timeline, and strategic alignment
        avg_roi = self._calculate_average_roi(roi_analysis)
        
        # Check payback periods
        quick_payback = sum(1 for r in roi_analysis.values() if r["payback_period_months"] < 6)
        payback_score = (quick_payback / len(roi_analysis)) * 10 if roi_analysis else 5
        
        # Strategic value (pre-production advantage)
        strategic_score = 8 if state.constraint_profile and state.constraint_profile.is_pre_production else 5
        
        # Weighted average
        return (avg_roi * 3 + payback_score + strategic_score) / 5
    
    def _generate_business_recommendations(
        self,
        state: ValidationState,
        business_analysis: Dict[str, Any],
        priority_alignment: Dict[str, Any],
        resource_assessment: Dict[str, Any]
    ) -> List[str]:
        """Generate business-focused recommendations"""
        
        recommendations = []
        
        # Resource recommendations
        if resource_assessment["utilization_percentage"] > 100:
            recommendations.append(
                f"Current plan requires {resource_assessment['utilization_percentage']:.0f}% of capacity - "
                "consider phasing implementation or increasing team"
            )
        
        if resource_assessment["skill_gaps"]:
            recommendations.append(
                f"Address skill gaps: {', '.join(resource_assessment['skill_gaps'])} through "
                "training or hiring"
            )
        
        # Priority recommendations
        if business_analysis["overall_urgency"] == "high":
            recommendations.append(
                "Focus on quick wins with immediate business impact given high urgency"
            )
        
        # ROI recommendations
        low_roi = [name for name, analysis in priority_alignment["alignment_scores"].items() 
                  if analysis["priority"] == BusinessPriority.LOW]
        if low_roi:
            recommendations.append(
                f"Consider deferring low-ROI items: {', '.join(low_roi)}"
            )
        
        # Strategic recommendations
        if state.constraint_profile and state.constraint_profile.is_pre_production:
            recommendations.append(
                "Take advantage of pre-production flexibility to build solid technical foundation"
            )
        
        if business_analysis["runway_months"] < 6:
            recommendations.append(
                "With limited runway, prioritize revenue-generating features over technical perfection"
            )
        
        return recommendations
    
    def _generate_business_summary(
        self,
        metrics: Dict[str, Any],
        priority_alignment: Dict[str, Any],
        resource_assessment: Dict[str, Any]
    ) -> str:
        """Generate summary of business alignment analysis"""
        
        alignment_score = metrics["business_alignment_score"]
        
        if alignment_score >= 7:
            assessment = "well-aligned with business priorities"
        elif alignment_score >= 5:
            assessment = "moderately aligned with some gaps"
        else:
            assessment = "poorly aligned with business needs"
        
        summary = f"Recommendations are {assessment}. "
        summary += f"Business alignment score: {alignment_score:.1f}/10. "
        summary += f"Average ROI: {metrics['average_roi_ratio']:.1f}x. "
        
        if metrics["resource_utilization"] > 100:
            summary += f"Resource constraints: {metrics['resource_utilization']:.0f}% of capacity needed. "
        
        if priority_alignment["misalignments"]:
            summary += f"Found {len(priority_alignment['misalignments'])} business misalignments. "
        
        summary += f"Timeline feasibility: {resource_assessment['timeline_feasibility']}. "
        
        return summary
