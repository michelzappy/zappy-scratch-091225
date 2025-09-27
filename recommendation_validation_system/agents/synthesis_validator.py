"""
Synthesis Validator Agent - Synthesizes all findings into a coherent validation report.
"""

from pathlib import Path
from typing import Dict, Any, List, Tuple
from collections import Counter

from .base_validator import BaseValidationAgent
from ..models import (
    ValidationState, 
    AgentReport,
    ValidationLevel,
    BusinessPriority
)


class SynthesisValidatorAgent(BaseValidationAgent):
    """Synthesizes all validation findings into a coherent final assessment"""
    
    def __init__(self):
        super().__init__(
            "Synthesis Validator",
            "Combines insights from all agents to provide final recommendations"
        )
        
    def validate(self, state: ValidationState, codebase_root: Path) -> AgentReport:
        """Synthesize all validation results"""
        report = AgentReport(agent_name=self.name)
        
        # Aggregate scores across all validations
        aggregated_scores = self._aggregate_validation_scores(state)
        
        # Identify consensus and conflicts
        consensus_analysis = self._analyze_agent_consensus(state)
        
        # Determine final recommendations
        final_recommendations = self._determine_final_recommendations(state, aggregated_scores)
        
        # Identify critical actions
        critical_actions = self._identify_critical_actions(state, aggregated_scores)
        
        # Generate risk assessment
        risk_assessment = self._assess_overall_risk(state, aggregated_scores)
        
        # Create synthesis findings
        if consensus_analysis['conflicts']:
            for conflict in consensus_analysis['conflicts']:
                report.findings.append(self.create_finding(
                    title=f"Validation Conflict: {conflict['area']}",
                    description=conflict['description'],
                    severity="medium",
                    category="synthesis",
                    recommendation=conflict['resolution'],
                    tags=["synthesis", "conflict", "validation"]
                ))
        
        # Calculate final metrics
        report.metrics = {
            "overall_validation_score": aggregated_scores['overall_score'],
            "confidence_level": aggregated_scores['confidence'],
            "consensus_percentage": consensus_analysis['consensus_percentage'],
            "critical_actions_count": len(critical_actions),
            "approved_recommendations": len(final_recommendations['approved']),
            "modified_recommendations": len(final_recommendations['modified']),
            "rejected_recommendations": len(final_recommendations['rejected']),
            "alternative_solutions_preferred": len(final_recommendations['alternatives_preferred']),
            "overall_risk_level": risk_assessment['overall_risk']
        }
        
        # Generate final recommendations
        report.recommendations = self._generate_synthesized_recommendations(
            state,
            final_recommendations,
            critical_actions,
            risk_assessment
        )
        
        report.summary = self._generate_synthesis_summary(
            report.metrics,
            final_recommendations,
            critical_actions,
            risk_assessment
        )
        
        # Store synthesis in state
        self._store_synthesis_results(state, final_recommendations, critical_actions, report)
        
        return report
    
    def _aggregate_validation_scores(self, state: ValidationState) -> Dict[str, Any]:
        """Aggregate scores from all validation results"""
        
        scores = {
            'business_necessity': [],
            'technical_necessity': [],
            'future_proofing': [],
            'risk': [],
            'confidence': []
        }
        
        for validation in state.validation_results.values():
            scores['business_necessity'].append(validation.business_necessity_score)
            scores['technical_necessity'].append(validation.technical_necessity_score)
            scores['future_proofing'].append(validation.future_proofing_score)
            scores['risk'].append(validation.risk_score)
            scores['confidence'].append(validation.confidence_score)
        
        # Calculate averages
        aggregated = {}
        for key, values in scores.items():
            if values:
                aggregated[f'avg_{key}'] = sum(values) / len(values)
            else:
                aggregated[f'avg_{key}'] = 5.0  # neutral default
        
        # Calculate overall score
        aggregated['overall_score'] = (
            aggregated['avg_business_necessity'] * 0.3 +
            aggregated['avg_technical_necessity'] * 0.25 +
            aggregated['avg_future_proofing'] * 0.25 +
            (10 - aggregated['avg_risk']) * 0.2  # Invert risk score
        )
        
        # Calculate confidence level
        aggregated['confidence'] = aggregated['avg_confidence']
        
        return aggregated
    
    def _analyze_agent_consensus(self, state: ValidationState) -> Dict[str, Any]:
        """Analyze consensus and conflicts among agent findings"""
        
        conflicts = []
        agreements = []
        
        # Check for conflicting validation levels
        validation_levels = {}
        for rec_name, validation in state.validation_results.items():
            if rec_name not in validation_levels:
                validation_levels[rec_name] = []
            validation_levels[rec_name].append(validation.validation_level)
        
        for rec_name, levels in validation_levels.items():
            level_counts = Counter(levels)
            if len(level_counts) > 1:
                # Conflict exists
                conflicts.append({
                    "area": rec_name,
                    "description": f"Mixed validation levels: {dict(level_counts)}",
                    "resolution": "Review specific agent concerns and find compromise"
                })
            else:
                agreements.append(rec_name)
        
        # Check for challenge disagreements
        for rec_name, validation in state.validation_results.items():
            if len(validation.challenges_raised) > 3:
                if validation.validation_level == ValidationLevel.CONFIRMED:
                    conflicts.append({
                        "area": rec_name,
                        "description": "Multiple challenges despite confirmation",
                        "resolution": "Address specific concerns before proceeding"
                    })
        
        consensus_percentage = (len(agreements) / (len(agreements) + len(conflicts)) * 100) if (agreements or conflicts) else 100
        
        return {
            "conflicts": conflicts,
            "agreements": agreements,
            "consensus_percentage": consensus_percentage
        }
    
    def _determine_final_recommendations(
        self,
        state: ValidationState,
        aggregated_scores: Dict[str, Any]
    ) -> Dict[str, List[Any]]:
        """Determine final status of each recommendation"""
        
        approved = []
        modified = []
        rejected = []
        alternatives_preferred = []
        
        for rec_name, rec in state.original_recommendations.items():
            if rec_name in state.validation_results:
                validation = state.validation_results[rec_name]
                
                # Determine status based on validation
                if validation.validation_level == ValidationLevel.CONFIRMED:
                    if validation.confidence_score >= 7:
                        approved.append({
                            "name": rec_name,
                            "recommendation": rec,
                            "validation": validation,
                            "reason": "High confidence confirmation"
                        })
                    else:
                        modified.append({
                            "name": rec_name,
                            "recommendation": rec,
                            "validation": validation,
                            "modifications": validation.challenges_raised,
                            "reason": "Confirmed with modifications needed"
                        })
                
                elif validation.validation_level == ValidationLevel.CHALLENGED:
                    if validation.alternatives_identified:
                        # Check if alternatives are better
                        best_alternative = self._find_best_alternative(rec_name, state)
                        if best_alternative:
                            alternatives_preferred.append({
                                "original": rec_name,
                                "alternative": best_alternative,
                                "reason": "Alternative provides better value"
                            })
                        else:
                            modified.append({
                                "name": rec_name,
                                "recommendation": rec,
                                "validation": validation,
                                "modifications": validation.challenges_raised,
                                "reason": "Challenged but viable with modifications"
                            })
                    else:
                        rejected.append({
                            "name": rec_name,
                            "recommendation": rec,
                            "validation": validation,
                            "reason": "Significant challenges without viable alternatives"
                        })
                
                elif validation.validation_level == ValidationLevel.ALTERNATIVE_PREFERRED:
                    best_alternative = self._find_best_alternative(rec_name, state)
                    if best_alternative:
                        alternatives_preferred.append({
                            "original": rec_name,
                            "alternative": best_alternative,
                            "reason": "Alternative clearly superior"
                        })
                
                elif validation.validation_level == ValidationLevel.OPPORTUNITY_MISSED:
                    modified.append({
                        "name": rec_name,
                        "recommendation": rec,
                        "validation": validation,
                        "modifications": ["Increase ambition level", "Consider more modern approaches"],
                        "reason": "Not ambitious enough for pre-production"
                    })
            else:
                # No validation results - default to modified
                modified.append({
                    "name": rec_name,
                    "recommendation": rec,
                    "validation": None,
                    "modifications": ["Requires further validation"],
                    "reason": "Insufficient validation data"
                })
        
        return {
            "approved": approved,
            "modified": modified,
            "rejected": rejected,
            "alternatives_preferred": alternatives_preferred
        }
    
    def _find_best_alternative(self, rec_name: str, state: ValidationState) -> Any:
        """Find the best alternative for a recommendation"""
        
        # Look for alternatives that address the same concern
        relevant_alternatives = []
        
        for alt in state.alternative_solutions:
            # Simple matching - could be more sophisticated
            if rec_name.lower() in alt.name.lower() or rec_name.lower() in alt.description.lower():
                relevant_alternatives.append(alt)
        
        if not relevant_alternatives:
            # Return any high-value alternative
            high_value = [alt for alt in state.alternative_solutions if alt.business_impact_score >= 8]
            if high_value:
                return max(high_value, key=lambda x: x.business_impact_score / max(x.effort_weeks, 0.1))
        
        # Return best relevant alternative by ROI
        if relevant_alternatives:
            return max(relevant_alternatives, key=lambda x: x.business_impact_score / max(x.effort_weeks, 0.1))
        
        return None
    
    def _identify_critical_actions(
        self,
        state: ValidationState,
        aggregated_scores: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Identify critical actions that must be taken"""
        
        critical_actions = []
        
        # Check for pre-production opportunities
        if state.constraint_profile and state.constraint_profile.is_pre_production:
            critical_actions.append({
                "action": "Leverage pre-production flexibility",
                "priority": "high",
                "deadline": "Before launch",
                "description": "Make architectural decisions that would be impossible post-launch"
            })
        
        # Check for compliance requirements
        if state.business_context.get("industry") == "telehealth":
            has_compliance = any(
                "compliance" in rec.description.lower() or "hipaa" in rec.description.lower()
                for rec in state.original_recommendations.values()
            )
            if not has_compliance:
                critical_actions.append({
                    "action": "Add HIPAA compliance measures",
                    "priority": "critical",
                    "deadline": "Before handling patient data",
                    "description": "Telehealth requires strict compliance measures"
                })
        
        # Check for security gaps
        if aggregated_scores.get('avg_risk', 0) > 7:
            critical_actions.append({
                "action": "Address high-risk items",
                "priority": "high",
                "deadline": "Immediate",
                "description": "High risk score requires immediate mitigation"
            })
        
        # Check for technical debt
        low_tech_score = aggregated_scores.get('avg_technical_necessity', 10) < 5
        if low_tech_score:
            critical_actions.append({
                "action": "Improve technical foundation",
                "priority": "medium",
                "deadline": "Phase 1",
                "description": "Technical foundation needs strengthening"
            })
        
        return critical_actions
    
    def _assess_overall_risk(
        self,
        state: ValidationState,
        aggregated_scores: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Assess overall project risk"""
        
        risk_factors = []
        risk_score = 0
        
        # Technical risks
        if aggregated_scores.get('avg_technical_necessity', 0) < 5:
            risk_factors.append("Weak technical foundation")
            risk_score += 2
        
        # Business risks
        if aggregated_scores.get('avg_business_necessity', 0) < 5:
            risk_factors.append("Low business alignment")
            risk_score += 2
        
        # Future-proofing risks
        if aggregated_scores.get('avg_future_proofing', 0) < 5:
            risk_factors.append("Poor future-proofing")
            risk_score += 1.5
        
        # Constraint risks
        if state.constraint_profile:
            if state.constraint_profile.available_developer_weeks < 8:
                risk_factors.append("Tight timeline")
                risk_score += 1.5
            
            if state.constraint_profile.skill_gap_tolerance == "low":
                risk_factors.append("Limited learning curve tolerance")
                risk_score += 1
        
        # Determine risk level
        if risk_score >= 6:
            overall_risk = "high"
        elif risk_score >= 3:
            overall_risk = "medium"
        else:
            overall_risk = "low"
        
        return {
            "overall_risk": overall_risk,
            "risk_score": risk_score,
            "risk_factors": risk_factors,
            "mitigation_priority": "high" if overall_risk == "high" else "medium"
        }
    
    def _generate_synthesized_recommendations(
        self,
        state: ValidationState,
        final_recommendations: Dict[str, List[Any]],
        critical_actions: List[Dict[str, Any]],
        risk_assessment: Dict[str, Any]
    ) -> List[str]:
        """Generate synthesized final recommendations"""
        
        recommendations = []
        
        # Critical actions first
        if critical_actions:
            recommendations.append(
                f"CRITICAL: {len(critical_actions)} critical actions required - "
                f"prioritize {critical_actions[0]['action']}"
            )
        
        # Approved recommendations
        if final_recommendations['approved']:
            recommendations.append(
                f"Proceed with {len(final_recommendations['approved'])} approved recommendations as planned"
            )
        
        # Modified recommendations
        if final_recommendations['modified']:
            recommendations.append(
                f"Implement {len(final_recommendations['modified'])} recommendations with suggested modifications"
            )
        
        # Alternative solutions
        if final_recommendations['alternatives_preferred']:
            recommendations.append(
                f"Replace {len(final_recommendations['alternatives_preferred'])} original recommendations with superior alternatives"
            )
        
        # Rejected recommendations
        if final_recommendations['rejected']:
            recommendations.append(
                f"Defer or cancel {len(final_recommendations['rejected'])} recommendations due to poor validation"
            )
        
        # Risk mitigation
        if risk_assessment['overall_risk'] == "high":
            recommendations.append(
                "HIGH RISK: Implement risk mitigation strategies before proceeding"
            )
        
        # Pre-production specific
        if state.constraint_profile and state.constraint_profile.is_pre_production:
            recommendations.append(
                "Take advantage of pre-production status to make bold architectural decisions"
            )
        
        # Quick wins
        if state.final_recommendations:
            quick_wins = sum(
                1 for phase in state.final_recommendations 
                for rec in phase.get('recommendations', [])
                if rec.get('is_quick_win')
            )
            if quick_wins > 0:
                recommendations.append(
                    f"Start with {quick_wins} quick wins for immediate value delivery"
                )
        
        return recommendations
    
    def _generate_synthesis_summary(
        self,
        metrics: Dict[str, Any],
        final_recommendations: Dict[str, List[Any]],
        critical_actions: List[Dict[str, Any]],
        risk_assessment: Dict[str, Any]
    ) -> str:
        """Generate synthesis summary"""
        
        overall_score = metrics['overall_validation_score']
        confidence = metrics['confidence_level']
        
        if overall_score >= 7:
            assessment = "strongly validated"
        elif overall_score >= 5:
            assessment = "partially validated with improvements needed"
        else:
            assessment = "poorly validated, significant changes required"
        
        summary = f"Recommendations are {assessment}. "
        summary += f"Overall validation score: {overall_score:.1f}/10, Confidence: {confidence:.1f}/10. "
        
        if metrics['consensus_percentage'] < 70:
            summary += f"Low consensus ({metrics['consensus_percentage']:.0f}%) suggests further review needed. "
        
        total_recs = (
            metrics['approved_recommendations'] + 
            metrics['modified_recommendations'] + 
            metrics['rejected_recommendations']
        )
        
        if total_recs > 0:
            approval_rate = (metrics['approved_recommendations'] / total_recs) * 100
            summary += f"Approval rate: {approval_rate:.0f}%. "
        
        if critical_actions:
            summary += f"{len(critical_actions)} critical actions identified. "
        
        summary += f"Risk level: {risk_assessment['overall_risk']}. "
        
        if metrics['alternative_solutions_preferred'] > 0:
            summary += f"{metrics['alternative_solutions_preferred']} alternatives preferred over originals. "
        
        return summary
    
    def _store_synthesis_results(
        self,
        state: ValidationState,
        final_recommendations: Dict[str, List[Any]],
        critical_actions: List[Dict[str, Any]],
        report: AgentReport
    ) -> None:
        """Store synthesis results in state for final output"""
        
        # Add synthesis metadata to final recommendations
        if not state.final_recommendations:
            state.final_recommendations = []
        
        # Add synthesis summary
        state.final_recommendations.append({
            "synthesis": {
                "overall_score": report.metrics['overall_validation_score'],
                "confidence": report.metrics['confidence_level'],
                "approved_count": len(final_recommendations['approved']),
                "modified_count": len(final_recommendations['modified']),
                "rejected_count": len(final_recommendations['rejected']),
                "alternatives_count": len(final_recommendations['alternatives_preferred']),
                "critical_actions": critical_actions,
                "final_verdict": report.summary
            }
        })
