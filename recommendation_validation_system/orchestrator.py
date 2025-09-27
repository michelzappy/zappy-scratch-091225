"""
Orchestrator for coordinating validation agents.
"""

from pathlib import Path
from typing import Dict, Any, List, Optional
import json
from datetime import datetime

from .models import (
    ValidationState,
    ConstraintProfile,
    OriginalRecommendation,
    ModernizationLevel,
    ValidationLevel,
    BusinessPriority,
    AgentReport
)

from .agents import (
    AmbitionLevelValidatorAgent,
    ArchitectureDecisionChallengerAgent,
    FutureProofingMaximizerAgent,
    ModernStackEvaluatorAgent,
    BusinessContextAlignmentAgent,
    AlternativeSolutionGenerator,
    ConstraintOptimizationAgent,
    SynthesisValidatorAgent,
    TechnicalDebtPreventionAgent
)


class PreProductionValidationOrchestrator:
    """Orchestrates multi-agent validation of recommendations"""
    
    def __init__(self, codebase_root: Path):
        self.codebase_root = codebase_root
        self.state = ValidationState()
        self.agents = []
        self.reports = {}
        self._initialize_agents()
        
    def _initialize_agents(self):
        """Initialize all validation agents"""
        self.agents = [
            # First wave: Analysis agents
            ArchitectureDecisionChallengerAgent(),
            ModernStackEvaluatorAgent(),
            TechnicalDebtPreventionAgent(),
            
            # Second wave: Context agents
            AmbitionLevelValidatorAgent(),
            BusinessContextAlignmentAgent(),
            FutureProofingMaximizerAgent(),
            
            # Third wave: Solution agents
            AlternativeSolutionGenerator(),
            ConstraintOptimizationAgent(),
            
            # Final: Synthesis
            SynthesisValidatorAgent()
        ]
    
    def set_constraint_profile(self, profile: ConstraintProfile):
        """Set project constraints"""
        self.state.constraint_profile = profile
    
    def set_business_context(self, context: Dict[str, Any]):
        """Set business context"""
        self.state.business_context = context
    
    def add_recommendation(self, name: str, recommendation: OriginalRecommendation):
        """Add a recommendation to validate"""
        self.state.original_recommendations[name] = recommendation
    
    def validate(self) -> Dict[str, Any]:
        """Run full validation pipeline"""
        
        print(f"\n{'='*60}")
        print("Starting Multi-Agent Validation System")
        print(f"{'='*60}")
        print(f"Validating {len(self.state.original_recommendations)} recommendations")
        print(f"Pre-production mode: {self.state.constraint_profile.is_pre_production if self.state.constraint_profile else 'Unknown'}")
        print()
        
        # Run each agent
        for agent in self.agents:
            print(f"Running {agent.name}...")
            report = agent.validate(self.state, self.codebase_root)
            self.reports[agent.name] = report
            
            # Show summary
            if report.summary:
                print(f"  Summary: {report.summary[:100]}...")
            print(f"  Findings: {len(report.findings)}")
            print(f"  Recommendations: {len(report.recommendations)}")
            print()
        
        # Compile final results
        final_results = self._compile_results()
        
        # Generate executive summary
        executive_summary = self._generate_executive_summary(final_results)
        final_results['executive_summary'] = executive_summary
        
        return final_results
    
    def _compile_results(self) -> Dict[str, Any]:
        """Compile all agent results into final output"""
        
        results = {
            "timestamp": datetime.now().isoformat(),
            "codebase_root": str(self.codebase_root),
            "total_recommendations": len(self.state.original_recommendations),
            "total_alternatives": len(self.state.alternative_solutions),
            "agent_reports": {},
            "validation_results": {},
            "final_recommendations": self.state.final_recommendations,
            "metrics_summary": {},
            "all_findings": [],
            "all_recommendations": []
        }
        
        # Compile agent reports
        for agent_name, report in self.reports.items():
            results["agent_reports"][agent_name] = {
                "summary": report.summary,
                "metrics": report.metrics,
                "findings_count": len(report.findings),
                "recommendations_count": len(report.recommendations)
            }
            
            # Aggregate findings and recommendations
            results["all_findings"].extend([
                {
                    "agent": agent_name,
                    "title": f.title,
                    "description": f.description,
                    "severity": f.severity,
                    "category": f.category
                }
                for f in report.findings
            ])
            
            results["all_recommendations"].extend([
                {"agent": agent_name, "recommendation": rec}
                for rec in report.recommendations
            ])
            
            # Collect key metrics
            for key, value in report.metrics.items():
                if key not in results["metrics_summary"]:
                    results["metrics_summary"][key] = value
        
        # Add validation results
        for rec_name, validation in self.state.validation_results.items():
            results["validation_results"][rec_name] = {
                "validation_level": validation.validation_level.value,
                "confidence_score": validation.confidence_score,
                "business_necessity": validation.business_necessity_score,
                "technical_necessity": validation.technical_necessity_score,
                "future_proofing": validation.future_proofing_score,
                "risk_score": validation.risk_score,
                "challenges_raised": validation.challenges_raised,
                "alternatives_identified": validation.alternatives_identified
            }
        
        # Add alternatives summary
        results["alternatives_summary"] = [
            {
                "name": alt.name,
                "effort_weeks": alt.effort_weeks,
                "business_impact": alt.business_impact_score,
                "technical_impact": alt.technical_impact_score,
                "risk_level": alt.risk_level,
                "modernization_level": alt.modernization_level.value
            }
            for alt in self.state.alternative_solutions
        ]
        
        return results
    
    def _generate_executive_summary(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate executive summary of validation"""
        
        metrics = results.get("metrics_summary", {})
        
        # Determine overall verdict
        overall_score = metrics.get("overall_validation_score", 5.0)
        if overall_score >= 7:
            verdict = "APPROVED WITH CONFIDENCE"
            action = "Proceed with implementation as planned"
        elif overall_score >= 5:
            verdict = "CONDITIONALLY APPROVED"
            action = "Implement with suggested modifications"
        else:
            verdict = "NEEDS SIGNIFICANT REVISION"
            action = "Review alternatives and address concerns"
        
        # Count validation outcomes
        validation_counts = {
            "confirmed": 0,
            "challenged": 0,
            "alternatives_preferred": 0,
            "rejected": 0
        }
        
        for validation in results.get("validation_results", {}).values():
            level = validation.get("validation_level", "")
            if level == "confirmed":
                validation_counts["confirmed"] += 1
            elif level == "challenged":
                validation_counts["challenged"] += 1
            elif level == "alternative_preferred":
                validation_counts["alternatives_preferred"] += 1
            else:
                validation_counts["rejected"] += 1
        
        # Find critical issues
        critical_findings = [
            f for f in results.get("all_findings", [])
            if f.get("severity") in ["high", "critical"]
        ]
        
        # Compile executive summary
        summary = {
            "verdict": verdict,
            "recommended_action": action,
            "overall_validation_score": overall_score,
            "confidence_level": metrics.get("confidence_level", 5.0),
            "validation_breakdown": validation_counts,
            "critical_issues_count": len(critical_findings),
            "alternatives_generated": len(results.get("alternatives_summary", [])),
            "quick_wins_available": metrics.get("quick_wins_identified", 0),
            "feasibility_score": metrics.get("feasibility_score", 5.0),
            "technical_health_score": metrics.get("technical_health_score", 5.0),
            "future_proofing_score": metrics.get("future_proofing_score", 5.0),
            "business_alignment_score": metrics.get("business_alignment_score", 5.0),
            "risk_level": metrics.get("overall_risk_level", "medium"),
            "key_recommendations": self._get_top_recommendations(results),
            "critical_actions": self._get_critical_actions(results),
            "pre_production_advantages": self._get_pre_production_advantages()
        }
        
        return summary
    
    def _get_top_recommendations(self, results: Dict[str, Any]) -> List[str]:
        """Extract top recommendations"""
        
        # Find synthesis recommendations (highest priority)
        synthesis_recs = []
        for rec_data in results.get("all_recommendations", []):
            if rec_data["agent"] == "Synthesis Validator":
                synthesis_recs.append(rec_data["recommendation"])
        
        # Return top 5 or synthesis recommendations
        return synthesis_recs[:5] if synthesis_recs else [
            rec["recommendation"] for rec in results.get("all_recommendations", [])[:5]
        ]
    
    def _get_critical_actions(self, results: Dict[str, Any]) -> List[str]:
        """Extract critical actions"""
        
        critical = []
        for rec_data in results.get("all_recommendations", []):
            rec = rec_data["recommendation"]
            if "CRITICAL" in rec or "HIGH RISK" in rec:
                critical.append(rec)
        
        return critical[:3]  # Top 3 critical actions
    
    def _get_pre_production_advantages(self) -> List[str]:
        """List pre-production specific advantages"""
        
        if not self.state.constraint_profile or not self.state.constraint_profile.is_pre_production:
            return []
        
        return [
            "Can make breaking changes without migration costs",
            "Opportunity to establish proper architecture from start",
            "No existing users to migrate",
            "Can adopt cutting-edge technologies",
            "Time to build comprehensive testing and documentation"
        ]
    
    def save_results(self, results: Dict[str, Any], output_path: Path):
        """Save validation results to file"""
        
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        print(f"Results saved to: {output_path}")
    
    def print_executive_summary(self, summary: Dict[str, Any]):
        """Print formatted executive summary"""
        
        print("\n" + "="*60)
        print("EXECUTIVE SUMMARY")
        print("="*60)
        print(f"\nVERDICT: {summary['verdict']}")
        print(f"ACTION: {summary['recommended_action']}")
        print(f"\nOverall Score: {summary['overall_validation_score']:.1f}/10")
        print(f"Confidence: {summary['confidence_level']:.1f}/10")
        print(f"Feasibility: {summary['feasibility_score']:.1f}/10")
        print(f"Risk Level: {summary['risk_level']}")
        
        print("\nValidation Breakdown:")
        for status, count in summary['validation_breakdown'].items():
            print(f"  - {status.replace('_', ' ').title()}: {count}")
        
        if summary['critical_issues_count'] > 0:
            print(f"\n⚠️  Critical Issues: {summary['critical_issues_count']}")
        
        if summary['quick_wins_available'] > 0:
            print(f"\n✨ Quick Wins Available: {summary['quick_wins_available']}")
        
        if summary['critical_actions']:
            print("\nCritical Actions:")
            for action in summary['critical_actions']:
                print(f"  • {action}")
        
        print("\nTop Recommendations:")
        for i, rec in enumerate(summary['key_recommendations'], 1):
            print(f"  {i}. {rec}")
        
        if summary['pre_production_advantages']:
            print("\nPre-Production Advantages:")
            for advantage in summary['pre_production_advantages']:
                print(f"  ✓ {advantage}")
        
        print("\n" + "="*60)
