"""
Alternative Solution Generator Agent - Generates creative alternatives to original recommendations.
"""

from pathlib import Path
from typing import Dict, Any, List

from .base_validator import BaseValidationAgent
from ..models import (
    ValidationState, 
    AgentReport,
    AlternativeSolution,
    ModernizationLevel
)


class AlternativeSolutionGenerator(BaseValidationAgent):
    """Generates alternative solutions to the original recommendations"""
    
    def __init__(self):
        super().__init__(
            "Alternative Solution Generator",
            "Generates creative alternatives to original recommendations with different trade-offs"
        )
        
    def validate(self, state: ValidationState, codebase_root: Path) -> AgentReport:
        """Generate multiple alternative approaches"""
        report = AgentReport(agent_name=self.name)
        
        # Generate different categories of alternatives
        documentation_alternatives = self._generate_documentation_alternatives(state, codebase_root)
        architecture_alternatives = self._generate_architecture_alternatives(state, codebase_root)
        incremental_alternatives = self._generate_incremental_alternatives(state)
        innovative_alternatives = self._generate_innovative_alternatives(state)
        
        # Combine all alternatives
        all_alternatives = (
            documentation_alternatives + 
            architecture_alternatives + 
            incremental_alternatives + 
            innovative_alternatives
        )
        
        # Add to state
        for alt in all_alternatives:
            state.add_alternative(alt)
            
            # Create finding for each high-value alternative
            if alt.business_impact_score >= 8 or alt.future_proofing_score >= 8:
                report.findings.append(self.create_finding(
                    title=f"High-Value Alternative: {alt.name}",
                    description=alt.description,
                    severity="medium",
                    category="alternative",
                    recommendation=f"Consider implementing: {alt.name}",
                    tags=["alternative", "opportunity", str(alt.modernization_level.value)]
                ))
        
        # Calculate metrics
        report.metrics = {
            "alternatives_generated": len(all_alternatives),
            "documentation_options": len(documentation_alternatives),
            "architecture_options": len(architecture_alternatives),
            "incremental_options": len(incremental_alternatives),
            "innovative_options": len(innovative_alternatives),
            "average_effort_weeks": sum(alt.effort_weeks for alt in all_alternatives) / len(all_alternatives) if all_alternatives else 0,
            "high_value_alternatives": sum(1 for alt in all_alternatives if alt.business_impact_score >= 8)
        }
        
        # Generate recommendations
        report.recommendations = self._generate_alternative_recommendations(
            state,
            all_alternatives
        )
        
        report.summary = self._generate_alternatives_summary(
            report.metrics,
            all_alternatives
        )
        
        return report
    
    def _generate_documentation_alternatives(
        self, 
        state: ValidationState,
        codebase_root: Path
    ) -> List[AlternativeSolution]:
        """Generate alternatives specifically for API documentation"""
        alternatives = []
        
        # Check if documentation is in recommendations
        has_swagger_recommendation = any(
            "swagger" in rec.description.lower() or "documentation" in rec.title.lower()
            for rec in state.original_recommendations.values()
        )
        
        if has_swagger_recommendation:
            # Alternative 1: JSDoc/TSDoc with auto-generation
            alternatives.append(AlternativeSolution(
                name="JSDoc/TSDoc Auto-Generated Documentation",
                description="Use inline code documentation with automatic API doc generation",
                effort_weeks=1,
                business_impact_score=8.0,
                technical_impact_score=7.0,
                future_proofing_score=7.5,
                risk_level="very_low",
                modernization_level=ModernizationLevel.MODERN,
                implementation_steps=[
                    "Add comprehensive JSDoc comments to all API endpoints",
                    "Install swagger-jsdoc for automatic Swagger generation",
                    "Configure swagger-ui-express for documentation UI",
                    "Set up CI/CD to validate documentation completeness",
                    "Generate TypeScript types from JSDoc annotations"
                ],
                pros=[
                    "Documentation lives with code - always in sync",
                    "No separate documentation files to maintain",
                    "Can start immediately with existing code",
                    "Developers more likely to update inline docs",
                    "IDE support for documentation"
                ],
                cons=[
                    "Requires discipline to maintain comments",
                    "Less flexibility than standalone documentation",
                    "May clutter code files"
                ],
                prerequisites=["Basic JSDoc knowledge"],
                long_term_benefits=[
                    "Self-documenting codebase",
                    "Reduced documentation drift",
                    "Better developer onboarding"
                ]
            ))
            
            # Alternative 2: GraphQL with auto-documentation
            if state.constraint_profile and state.constraint_profile.is_pre_production:
                alternatives.append(AlternativeSolution(
                    name="GraphQL with Introspection",
                    description="Replace REST with GraphQL for automatic API documentation and type safety",
                    effort_weeks=4,
                    business_impact_score=9.0,
                    technical_impact_score=9.0,
                    future_proofing_score=9.0,
                    risk_level="medium",
                    modernization_level=ModernizationLevel.MODERN,
                    implementation_steps=[
                        "Design GraphQL schema for all entities",
                        "Implement GraphQL resolvers",
                        "Set up Apollo Server or similar",
                        "Generate TypeScript types from schema",
                        "Implement GraphQL playground for testing"
                    ],
                    pros=[
                        "Self-documenting API through introspection",
                        "Clients request only needed data",
                        "Strong typing throughout",
                        "Excellent tooling ecosystem",
                        "Single endpoint simplifies infrastructure"
                    ],
                    cons=[
                        "Learning curve for team",
                        "More complex caching strategies",
                        "N+1 query problems need attention"
                    ],
                    prerequisites=["GraphQL knowledge", "Schema design skills"],
                    long_term_benefits=[
                        "Reduced over-fetching and under-fetching",
                        "Better mobile app performance",
                        "Easier API evolution"
                    ]
                ))
        
        return alternatives
    
    def _generate_architecture_alternatives(
        self, 
        state: ValidationState,
        codebase_root: Path
    ) -> List[AlternativeSolution]:
        """Generate architectural alternatives"""
        alternatives = []
        
        # Check current architecture needs
        has_nestjs_recommendation = any(
            "nestjs" in rec.description.lower()
            for rec in state.original_recommendations.values()
        )
        
        if has_nestjs_recommendation:
            # Alternative: Clean Architecture with Express
            alternatives.append(AlternativeSolution(
                name="Clean Architecture Pattern with Express",
                description="Implement clean architecture principles without framework migration",
                effort_weeks=3,
                business_impact_score=7.5,
                technical_impact_score=8.0,
                future_proofing_score=8.5,
                risk_level="low",
                modernization_level=ModernizationLevel.MODERN,
                implementation_steps=[
                    "Create domain layer with business entities",
                    "Implement use cases layer for business logic",
                    "Build repository pattern for data access",
                    "Create presentation layer for API routes",
                    "Implement dependency injection manually or with tsyringe"
                ],
                pros=[
                    "Framework-agnostic architecture",
                    "Testable business logic",
                    "Clear separation of concerns",
                    "No framework lock-in",
                    "Gradual implementation possible"
                ],
                cons=[
                    "More boilerplate than NestJS",
                    "Need to enforce patterns manually",
                    "Less tooling support"
                ],
                prerequisites=["Clean architecture understanding", "SOLID principles"],
                long_term_benefits=[
                    "Easy to test and maintain",
                    "Framework changes become easier",
                    "Clear boundaries aid team scaling"
                ]
            ))
        
        # Serverless alternative
        if state.constraint_profile and state.constraint_profile.is_pre_production:
            alternatives.append(AlternativeSolution(
                name="Serverless Architecture with AWS Lambda",
                description="Build on serverless infrastructure for automatic scaling and cost efficiency",
                effort_weeks=5,
                business_impact_score=8.5,
                technical_impact_score=8.0,
                future_proofing_score=9.0,
                risk_level="medium",
                modernization_level=ModernizationLevel.CUTTING_EDGE,
                implementation_steps=[
                    "Break application into Lambda functions",
                    "Set up API Gateway for routing",
                    "Use DynamoDB or Aurora Serverless for data",
                    "Implement with Serverless Framework or SAM",
                    "Set up CloudWatch for monitoring"
                ],
                pros=[
                    "Zero server management",
                    "Automatic scaling",
                    "Pay only for actual usage",
                    "Built-in high availability",
                    "Focus purely on business logic"
                ],
                cons=[
                    "Vendor lock-in (AWS)",
                    "Cold start latency",
                    "Local development complexity",
                    "Distributed system debugging"
                ],
                prerequisites=["AWS knowledge", "Serverless patterns understanding"],
                long_term_benefits=[
                    "Infinite scaling potential",
                    "Minimal operational overhead",
                    "Cost-efficient at any scale"
                ]
            ))
        
        return alternatives
    
    def _generate_incremental_alternatives(
        self,
        state: ValidationState
    ) -> List[AlternativeSolution]:
        """Generate incremental improvement alternatives"""
        alternatives = []
        
        # Incremental TypeScript adoption
        alternatives.append(AlternativeSolution(
            name="Gradual TypeScript Migration",
            description="Convert to TypeScript file-by-file as code is touched",
            effort_weeks=2,
            business_impact_score=7.0,
            technical_impact_score=8.0,
            future_proofing_score=7.5,
            risk_level="very_low",
            modernization_level=ModernizationLevel.STANDARD,
            implementation_steps=[
                "Set up TypeScript with allowJs: true",
                "Create type definitions for core models",
                "Convert utilities and helpers first",
                "Gradually convert routes as modified",
                "Enforce TypeScript for all new files"
            ],
            pros=[
                "No big-bang migration",
                "Learn TypeScript gradually",
                "Can deploy continuously",
                "Low risk of breaking changes",
                "Immediate benefits from partial adoption"
            ],
            cons=[
                "Mixed JS/TS codebase for a while",
                "Slower to realize full benefits",
                "Requires ongoing discipline"
            ],
            prerequisites=["Basic TypeScript knowledge"],
            long_term_benefits=[
                "Full type safety eventually",
                "Smooth learning curve",
                "Proven migration path"
            ]
        ))
        
        # API standardization without framework change
        alternatives.append(AlternativeSolution(
            name="API Standardization Layer",
            description="Create standardized response formats and error handling without framework change",
            effort_weeks=1,
            business_impact_score=6.5,
            technical_impact_score=7.0,
            future_proofing_score=6.5,
            risk_level="very_low",
            modernization_level=ModernizationLevel.STANDARD,
            implementation_steps=[
                "Create response wrapper utilities",
                "Implement global error handler middleware",
                "Standardize validation with express-validator",
                "Create API versioning strategy",
                "Document patterns for team"
            ],
            pros=[
                "Quick implementation",
                "Immediate consistency benefits",
                "No learning curve",
                "Works with existing code",
                "Can implement today"
            ],
            cons=[
                "Doesn't address deeper architectural issues",
                "Manual enforcement required",
                "Less powerful than framework solution"
            ],
            prerequisites=["None - uses existing knowledge"],
            long_term_benefits=[
                "Consistent API experience",
                "Easier frontend development",
                "Foundation for future improvements"
            ]
        ))
        
        return alternatives
    
    def _generate_innovative_alternatives(
        self,
        state: ValidationState
    ) -> List[AlternativeSolution]:
        """Generate innovative, forward-thinking alternatives"""
        alternatives = []
        
        # Only suggest innovative options in pre-production
        if state.constraint_profile and state.constraint_profile.is_pre_production:
            
            # AI-Enhanced Development
            alternatives.append(AlternativeSolution(
                name="AI-Powered Development Pipeline",
                description="Integrate AI tools for code generation, testing, and documentation",
                effort_weeks=2,
                business_impact_score=8.0,
                technical_impact_score=7.5,
                future_proofing_score=9.5,
                risk_level="low",
                modernization_level=ModernizationLevel.CUTTING_EDGE,
                implementation_steps=[
                    "Set up GitHub Copilot for team",
                    "Integrate AI code review tools",
                    "Use AI for test generation",
                    "Implement AI-powered documentation generation",
                    "Create AI-assisted debugging workflows"
                ],
                pros=[
                    "Dramatically increased developer productivity",
                    "Consistent code quality",
                    "Reduced boilerplate writing",
                    "Faster bug detection",
                    "Always up-to-date documentation"
                ],
                cons=[
                    "Requires AI tool subscriptions",
                    "Team needs AI tool training",
                    "Code ownership questions"
                ],
                prerequisites=["Openness to AI-assisted development"],
                long_term_benefits=[
                    "10x developer productivity potential",
                    "Reduced human error",
                    "Focus on creative problem-solving"
                ]
            ))
            
            # Event-Driven from the start
            if state.business_context.get("expected_scale", "medium") in ["high", "very_high"]:
                alternatives.append(AlternativeSolution(
                    name="Event-Driven Architecture Foundation",
                    description="Build on event sourcing and CQRS patterns from day one",
                    effort_weeks=6,
                    business_impact_score=7.5,
                    technical_impact_score=9.0,
                    future_proofing_score=10.0,
                    risk_level="medium",
                    modernization_level=ModernizationLevel.CUTTING_EDGE,
                    implementation_steps=[
                        "Design event schema for all domain events",
                        "Implement event store (EventStore or Kafka)",
                        "Create command and query separation",
                        "Build event projections for read models",
                        "Implement event replay capabilities"
                    ],
                    pros=[
                        "Complete audit trail by design",
                        "Time-travel debugging",
                        "Natural microservices boundaries",
                        "Incredible scalability",
                        "Real-time capabilities built-in"
                    ],
                    cons=[
                        "Steep learning curve",
                        "More complex initial setup",
                        "Eventually consistent by nature",
                        "Requires mindset shift"
                    ],
                    prerequisites=["Event sourcing knowledge", "CQRS understanding"],
                    long_term_benefits=[
                        "Unlimited horizontal scaling",
                        "Perfect audit trail for compliance",
                        "Natural evolution to microservices",
                        "Built-in analytics capabilities"
                    ]
                ))
        
        return alternatives
    
    def _generate_alternative_recommendations(
        self,
        state: ValidationState,
        alternatives: List[AlternativeSolution]
    ) -> List[str]:
        """Generate recommendations based on alternatives"""
        recommendations = []
        
        # Find highest value alternatives
        high_value = [alt for alt in alternatives if alt.business_impact_score >= 8]
        if high_value:
            recommendations.append(
                f"Found {len(high_value)} high-value alternatives that may provide better ROI than original recommendations"
            )
        
        # Low effort, high impact options
        quick_wins = [alt for alt in alternatives if alt.effort_weeks <= 2 and alt.business_impact_score >= 7]
        if quick_wins:
            recommendations.append(
                f"Consider {len(quick_wins)} quick-win alternatives that can be implemented in 2 weeks or less"
            )
        
        # Pre-production specific
        if state.constraint_profile and state.constraint_profile.is_pre_production:
            cutting_edge = [alt for alt in alternatives if alt.modernization_level == ModernizationLevel.CUTTING_EDGE]
            if cutting_edge:
                recommendations.append(
                    f"Take advantage of pre-production flexibility with {len(cutting_edge)} cutting-edge alternatives"
                )
        
        # Risk-based recommendations
        low_risk = [alt for alt in alternatives if alt.risk_level in ["very_low", "low"]]
        if low_risk:
            recommendations.append(
                f"{len(low_risk)} low-risk alternatives available for conservative implementation"
            )
        
        return recommendations
    
    def _generate_alternatives_summary(
        self,
        metrics: Dict[str, Any],
        alternatives: List[AlternativeSolution]
    ) -> str:
        """Generate summary of alternatives analysis"""
        
        total = metrics["alternatives_generated"]
        
        summary = f"Generated {total} alternative solutions across multiple categories. "
        
        if metrics["high_value_alternatives"] > 0:
            summary += f"{metrics['high_value_alternatives']} high-value alternatives identified. "
        
        avg_effort = metrics["average_effort_weeks"]
        if avg_effort < 4:
            summary += f"Average implementation time: {avg_effort:.1f} weeks (quick wins available). "
        else:
            summary += f"Average implementation time: {avg_effort:.1f} weeks. "
        
        # Highlight best alternatives
        if alternatives:
            best_roi = max(alternatives, key=lambda x: x.business_impact_score / max(x.effort_weeks, 0.1))
            summary += f"Best ROI option: '{best_roi.name}' with {best_roi.business_impact_score:.1f} impact score in {best_roi.effort_weeks} weeks. "
        
        return summary
