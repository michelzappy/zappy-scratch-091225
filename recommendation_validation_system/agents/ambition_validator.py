"""
Ambition Level Validator Agent - Ensures recommendations are ambitious enough for pre-production.
"""

from pathlib import Path
from typing import Dict, Any, List

from .base_validator import BaseValidationAgent
from ..models import (
    ValidationState, 
    AgentReport, 
    ValidationLevel,
    ModernizationLevel,
    AlternativeSolution
)


class AmbitionLevelValidatorAgent(BaseValidationAgent):
    """Validates that recommendations are ambitious enough for pre-production environment"""
    
    def __init__(self):
        super().__init__(
            "Ambition Level Validator",
            "Ensures recommendations leverage pre-production opportunity to make bold architectural choices"
        )
        
    def validate(self, state: ValidationState, codebase_root: Path) -> AgentReport:
        """Validate ambition level of recommendations"""
        report = AgentReport(agent_name=self.name)
        
        # Check if we're being too conservative
        conservative_indicators = self._check_conservative_patterns(state)
        
        # Identify missed opportunities
        missed_opportunities = self._identify_missed_opportunities(state, codebase_root)
        
        # Evaluate modernization potential
        modernization_gaps = self._evaluate_modernization_gaps(state, codebase_root)
        
        # Generate findings
        for indicator in conservative_indicators:
            report.findings.append(self.create_finding(
                title=f"Conservative Approach: {indicator['title']}",
                description=indicator['description'],
                severity="high" if state.constraint_profile.is_pre_production else "medium",
                category="ambition",
                recommendation=indicator['recommendation'],
                tags=["pre-production", "opportunity", "ambition"]
            ))
        
        for opportunity in missed_opportunities:
            report.findings.append(self.create_finding(
                title=f"Missed Opportunity: {opportunity['title']}",
                description=opportunity['description'],
                severity="high",
                category="opportunity",
                recommendation=opportunity['action'],
                tags=["pre-production", "modernization", "future-proofing"]
            ))
        
        # Add metrics
        report.metrics = {
            "conservative_indicators_count": len(conservative_indicators),
            "missed_opportunities_count": len(missed_opportunities),
            "modernization_gaps_count": len(modernization_gaps),
            "ambition_score": self._calculate_ambition_score(state),
            "opportunity_score": self._calculate_opportunity_score(missed_opportunities)
        }
        
        # Add recommendations
        report.recommendations = self._generate_ambitious_recommendations(state, codebase_root)
        report.opportunities = [opp['title'] for opp in missed_opportunities]
        
        # Summary
        report.summary = self._generate_summary(report.metrics)
        
        # Update validation state
        for rec_name in state.original_recommendations:
            if rec_name in state.validation_results:
                validation = state.validation_results[rec_name]
                validation.modernization_gaps = modernization_gaps
                validation.opportunities_identified = [opp['title'] for opp in missed_opportunities]
        
        return report
    
    def _check_conservative_patterns(self, state: ValidationState) -> List[Dict[str, Any]]:
        """Check for overly conservative patterns in recommendations"""
        indicators = []
        
        # Check NestJS recommendation
        if "nestjs_migration" in state.original_recommendations:
            rec = state.original_recommendations["nestjs_migration"]
            
            # Check if it's just migration vs full rebuild
            if "migration" in rec.title.lower() and "rebuild" not in rec.title.lower():
                indicators.append({
                    "title": "Incremental Migration vs Clean Architecture",
                    "description": (
                        "The recommendation suggests migrating existing Express code to NestJS. "
                        "In pre-production, consider building a clean NestJS architecture from scratch "
                        "to avoid carrying over legacy patterns."
                    ),
                    "recommendation": "Build NestJS from scratch with optimal patterns rather than migrating"
                })
        
        # Check if we're keeping too much existing code
        if not any("rewrite" in rec.title.lower() or "rebuild" in rec.title.lower() 
                  for rec in state.original_recommendations.values()):
            indicators.append({
                "title": "Preserving Legacy Code",
                "description": (
                    "Recommendations focus on improving existing code rather than rebuilding. "
                    "Pre-production is the only time you can afford a clean slate approach."
                ),
                "recommendation": "Consider complete rewrites of problematic modules"
            })
        
        # Check technology choices
        if not any("graphql" in rec.description.lower() or "trpc" in rec.description.lower() 
                  for rec in state.original_recommendations.values()):
            indicators.append({
                "title": "Traditional REST-only Approach",
                "description": (
                    "No consideration of modern API patterns like GraphQL or tRPC. "
                    "These provide better type safety and developer experience."
                ),
                "recommendation": "Evaluate GraphQL or tRPC for type-safe API layer"
            })
        
        return indicators
    
    def _identify_missed_opportunities(self, state: ValidationState, codebase_root: Path) -> List[Dict[str, Any]]:
        """Identify opportunities only available in pre-production"""
        opportunities = []
        
        # Database architecture opportunities
        opportunities.append({
            "title": "Database Architecture Optimization",
            "description": (
                "Pre-production allows complete database redesign for optimal performance, "
                "proper indexing, and future scalability"
            ),
            "action": "Design database schema from scratch with proper normalization and indexing"
        })
        
        # Authentication system
        if not any("auth" in rec.title.lower() for rec in state.original_recommendations.values()):
            opportunities.append({
                "title": "Modern Authentication System",
                "description": (
                    "Opportunity to implement modern auth (Supabase Auth, Auth0, Clerk) "
                    "instead of maintaining custom JWT implementation"
                ),
                "action": "Replace custom auth with battle-tested auth service"
            })
        
        # Event-driven architecture
        opportunities.append({
            "title": "Event-Driven Architecture Foundation",
            "description": (
                "Implement event sourcing and CQRS patterns from the start "
                "for better scalability and audit trails"
            ),
            "action": "Design with event-driven patterns for future scalability"
        })
        
        # Microservices consideration
        if state.business_context.get("expected_scale", "medium") == "high":
            opportunities.append({
                "title": "Microservices Architecture Evaluation",
                "description": (
                    "High expected scale suggests considering microservices from start "
                    "rather than monolith-to-microservices migration later"
                ),
                "action": "Evaluate microservices architecture for high-scale requirements"
            })
        
        # Real-time capabilities
        backend_path = codebase_root / "backend"
        if backend_path.exists():
            has_websockets = self.check_dependency_exists(backend_path / "package.json", "socket.io")
            if has_websockets:
                opportunities.append({
                    "title": "Modern Real-time Architecture",
                    "description": (
                        "Current Socket.io implementation could be replaced with more modern "
                        "solutions like Server-Sent Events or WebTransport"
                    ),
                    "action": "Evaluate modern real-time communication patterns"
                })
        
        # Testing architecture
        if not any("testing" in rec.title.lower() for rec in state.original_recommendations.values()):
            opportunities.append({
                "title": "Comprehensive Testing Strategy",
                "description": (
                    "Implement testing pyramid from day one: unit, integration, e2e, "
                    "contract testing, and performance testing"
                ),
                "action": "Build comprehensive testing architecture from the start"
            })
        
        return opportunities
    
    def _evaluate_modernization_gaps(self, state: ValidationState, codebase_root: Path) -> List[str]:
        """Evaluate gaps in modernization"""
        gaps = []
        
        backend_path = codebase_root / "backend"
        frontend_path = codebase_root / "frontend"
        
        # Check backend modernization
        if backend_path.exists():
            package_json = backend_path / "package.json"
            
            # Check for modern patterns
            if not self.check_dependency_exists(package_json, "@nestjs/core"):
                if not self.check_dependency_exists(package_json, "fastify"):
                    gaps.append("Using Express instead of modern frameworks (NestJS/Fastify)")
            
            if not self.check_dependency_exists(package_json, "typescript"):
                gaps.append("Not using TypeScript in backend")
            
            if not self.check_dependency_exists(package_json, "@prisma/client"):
                if not self.check_dependency_exists(package_json, "drizzle-orm"):
                    gaps.append("Not using modern ORMs (Prisma/Drizzle)")
        
        # Check frontend modernization  
        if frontend_path.exists():
            package_json = frontend_path / "package.json"
            
            if not self.check_dependency_exists(package_json, "@tanstack/react-query"):
                gaps.append("Not using modern data fetching (React Query/SWR)")
            
            if not self.check_dependency_exists(package_json, "zod"):
                gaps.append("Not using runtime validation (Zod)")
        
        # Check for missing modern practices
        if not any("container" in rec.description.lower() or "docker" in rec.description.lower() 
                  for rec in state.original_recommendations.values()):
            gaps.append("No containerization strategy mentioned")
        
        if not any("observability" in rec.description.lower() or "monitoring" in rec.description.lower()
                  for rec in state.original_recommendations.values()):
            gaps.append("No observability/monitoring strategy")
        
        return gaps
    
    def _calculate_ambition_score(self, state: ValidationState) -> float:
        """Calculate how ambitious the recommendations are"""
        score = 5.0  # baseline
        
        # Check for bold keywords
        bold_keywords = ["rebuild", "rewrite", "from scratch", "cutting-edge", "modern", "next-gen"]
        conservative_keywords = ["incremental", "gradual", "safe", "minimal", "preserve"]
        
        for rec in state.original_recommendations.values():
            text = (rec.title + " " + rec.description).lower()
            
            for keyword in bold_keywords:
                if keyword in text:
                    score += 0.5
            
            for keyword in conservative_keywords:
                if keyword in text:
                    score -= 0.3
        
        # Bonus for pre-production specific recommendations
        if state.constraint_profile and state.constraint_profile.is_pre_production:
            score += 2.0
        
        return min(max(score, 0), 10)
    
    def _calculate_opportunity_score(self, opportunities: List[Dict[str, Any]]) -> float:
        """Calculate opportunity utilization score"""
        # Each opportunity is worth points
        score = len(opportunities) * 1.5
        return min(score, 10)
    
    def _generate_ambitious_recommendations(self, state: ValidationState, codebase_root: Path) -> List[str]:
        """Generate ambitious recommendations"""
        recommendations = []
        
        if state.constraint_profile and state.constraint_profile.is_pre_production:
            recommendations.append(
                "LEVERAGE PRE-PRODUCTION STATUS: Make bold architectural decisions now that would be "
                "impossible after launch"
            )
            
            recommendations.append(
                "Consider complete rewrites of problematic modules rather than refactoring"
            )
            
            recommendations.append(
                "Implement cutting-edge but proven technologies (e.g., Edge computing, tRPC, Bun runtime)"
            )
            
            recommendations.append(
                "Design for 10x scale from day one - it's much harder to scale later"
            )
            
            recommendations.append(
                "Build comprehensive DevOps and observability from the start"
            )
        
        return recommendations
    
    def _generate_summary(self, metrics: Dict[str, Any]) -> str:
        """Generate summary of findings"""
        ambition_score = metrics.get("ambition_score", 0)
        opportunity_score = metrics.get("opportunity_score", 0)
        
        if ambition_score < 5:
            assessment = "overly conservative"
        elif ambition_score < 7:
            assessment = "moderately ambitious"  
        else:
            assessment = "appropriately ambitious"
        
        summary = (
            f"The current recommendations are {assessment} for a pre-production environment. "
            f"Ambition score: {ambition_score:.1f}/10, Opportunity utilization: {opportunity_score:.1f}/10. "
        )
        
        if metrics["missed_opportunities_count"] > 3:
            summary += (
                f"Found {metrics['missed_opportunities_count']} significant opportunities that are "
                "only feasible in pre-production. "
            )
        
        if metrics["modernization_gaps_count"] > 2:
            summary += (
                f"Identified {metrics['modernization_gaps_count']} modernization gaps that should "
                "be addressed while breaking changes are still possible."
            )
        
        return summary
