"""
Architecture Decision Challenger Agent - Devil's advocate for architectural recommendations.
"""

from pathlib import Path
from typing import Dict, Any, List

from .base_validator import BaseValidationAgent
from ..models import (
    ValidationState, 
    AgentReport, 
    ValidationLevel,
    ValidationResult,
    AlternativeSolution,
    ModernizationLevel
)


class ArchitectureDecisionChallengerAgent(BaseValidationAgent):
    """Challenges architectural decisions and provides alternatives"""
    
    def __init__(self):
        super().__init__(
            "Architecture Decision Challenger",
            "Acts as devil's advocate for architectural recommendations, ensuring thorough evaluation"
        )
        
    def validate(self, state: ValidationState, codebase_root: Path) -> AgentReport:
        """Challenge architectural recommendations"""
        report = AgentReport(agent_name=self.name)
        
        # Analyze current codebase quality
        current_quality = self._assess_current_architecture(codebase_root)
        
        # Challenge each recommendation
        challenges = {}
        for rec_name, rec in state.original_recommendations.items():
            challenges[rec_name] = self._challenge_recommendation(rec_name, rec, state, current_quality)
        
        # Generate alternatives
        alternatives = self._generate_alternatives(state, codebase_root, current_quality)
        
        # Create findings based on challenges
        for rec_name, challenge_data in challenges.items():
            if challenge_data['challenges']:
                report.findings.append(self.create_finding(
                    title=f"Challenge: {rec_name}",
                    description="; ".join(challenge_data['challenges']),
                    severity=challenge_data['severity'],
                    category="architecture",
                    recommendation=challenge_data['alternative_approach'],
                    tags=["architecture", "validation", "challenge"]
                ))
        
        # Add alternatives to state
        for alt in alternatives:
            state.add_alternative(alt)
        
        # Update metrics
        report.metrics = {
            "current_architecture_score": current_quality['overall_score'],
            "challenges_raised": sum(len(c['challenges']) for c in challenges.values()),
            "alternatives_generated": len(alternatives),
            "nestjs_necessity_score": self._evaluate_nestjs_necessity(state, current_quality),
            "typescript_readiness": current_quality.get('typescript_readiness', 0)
        }
        
        # Generate recommendations
        report.recommendations = self._generate_architectural_recommendations(state, current_quality)
        
        # Summary
        report.summary = self._generate_challenge_summary(challenges, alternatives, current_quality)
        
        # Update validation results
        for rec_name, challenge_data in challenges.items():
            if rec_name not in state.validation_results:
                state.validation_results[rec_name] = ValidationResult(
                    recommendation=state.original_recommendations[rec_name],
                    validation_level=challenge_data['validation_level'],
                    confidence_score=challenge_data['confidence'],
                    business_necessity_score=5.0,  # Will be updated by business agent
                    technical_necessity_score=challenge_data['technical_necessity'],
                    future_proofing_score=7.0,  # Will be updated by future-proofing agent
                    risk_score=challenge_data['risk_score'],
                    effort_vs_benefit_ratio=challenge_data['effort_vs_benefit']
                )
            
            validation = state.validation_results[rec_name]
            validation.challenges_raised = challenge_data['challenges']
            validation.alternatives_identified = challenge_data['alternatives']
        
        return report
    
    def _assess_current_architecture(self, codebase_root: Path) -> Dict[str, Any]:
        """Assess quality of current architecture"""
        quality = {
            'overall_score': 5.0,
            'express_quality': 0,
            'has_service_layer': False,
            'has_middleware_organization': False,
            'consistent_error_handling': False,
            'has_request_validation': False,
            'typescript_readiness': 0,
            'test_coverage': 0
        }
        
        backend_path = codebase_root / "backend"
        if not backend_path.exists():
            return quality
        
        # Check Express app structure
        app_file = backend_path / "src" / "app.js"
        if app_file.exists():
            content = app_file.read_text()
            
            # Check for organized middleware
            if "middleware" in content and "app.use" in content:
                quality['has_middleware_organization'] = True
                quality['express_quality'] += 2
            
            # Check for error handling
            if "globalErrorHandler" in content or "errorHandler" in content:
                quality['consistent_error_handling'] = True
                quality['express_quality'] += 2
        
        # Check for service layer
        services_dir = backend_path / "src" / "services"
        if services_dir.exists() and any(services_dir.glob("*.js")):
            quality['has_service_layer'] = True
            quality['express_quality'] += 3
        
        # Check for validation
        routes_dir = backend_path / "src" / "routes"
        if routes_dir.exists():
            validation_patterns = self.find_patterns_in_files(
                routes_dir, 
                r"express-validator|joi|yup|zod",
                "*.js"
            )
            if validation_patterns:
                quality['has_request_validation'] = True
                quality['express_quality'] += 1
        
        # Check TypeScript readiness
        ts_config = backend_path / "tsconfig.json"
        if ts_config.exists():
            quality['typescript_readiness'] = 8
        elif self.check_dependency_exists(backend_path / "package.json", "typescript"):
            quality['typescript_readiness'] = 5
        else:
            # Check if code is TypeScript-ready (uses modern JS)
            modern_patterns = self.find_patterns_in_files(
                backend_path / "src",
                r"(async\s+function|async\s*\(|const\s+\w+\s*=|class\s+\w+)",
                "*.js"
            )
            if len(modern_patterns) > 10:
                quality['typescript_readiness'] = 3
        
        # Check test coverage
        test_files = list(backend_path.glob("**/*.test.js")) + list(backend_path.glob("**/*.spec.js"))
        if test_files:
            quality['test_coverage'] = min(len(test_files) * 5, 50)  # Rough estimate
        
        # Calculate overall score
        quality['overall_score'] = (
            quality['express_quality'] * 0.4 +
            quality['typescript_readiness'] * 0.3 +
            quality['test_coverage'] / 10 * 0.3
        )
        
        return quality
    
    def _challenge_recommendation(
        self, 
        rec_name: str, 
        rec: Any, 
        state: ValidationState,
        current_quality: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Challenge a specific recommendation"""
        
        challenges = []
        alternatives = []
        severity = "medium"
        confidence = 7.0
        technical_necessity = 7.0
        risk_score = 5.0
        effort_vs_benefit = 1.0
        validation_level = ValidationLevel.CONFIRMED
        alternative_approach = None
        
        # Challenge NestJS migration specifically
        if rec_name == "nestjs_migration":
            if current_quality['express_quality'] > 6:
                challenges.append("Current Express architecture is well-structured and maintainable")
                alternatives.append("Enhance existing Express with TypeScript and better patterns")
                severity = "high"
                confidence = 8.0
                technical_necessity = 5.0
                validation_level = ValidationLevel.CHALLENGED
                alternative_approach = "Consider Express + TypeScript + architectural improvements instead"
            
            if state.constraint_profile and state.constraint_profile.available_developer_weeks < 8:
                challenges.append(f"Only {state.constraint_profile.available_developer_weeks} weeks available - insufficient for full NestJS migration")
                alternatives.append("Phased approach: TypeScript first, then evaluate NestJS need")
                risk_score = 8.0
                effort_vs_benefit = 0.5
            
            if current_quality['typescript_readiness'] < 3:
                challenges.append("Codebase not TypeScript-ready - requires significant refactoring first")
                alternatives.append("Modernize JavaScript patterns before framework migration")
                technical_necessity = 4.0
        
        # Challenge API documentation
        elif rec_name == "api_documentation":
            # This is usually good, but check if it's the right priority
            if state.constraint_profile and state.constraint_profile.is_pre_production:
                challenges.append("In pre-production, API might change significantly - documentation may need rewriting")
                alternatives.append("Use auto-generated documentation from code annotations")
                alternative_approach = "Implement JSDoc/TSDoc with auto-generation instead of manual Swagger"
        
        # Challenge frontend refactor
        elif rec_name == "frontend_refactor":
            frontend_path = state.codebase_metrics.get('frontend_path', Path('frontend'))
            if self.check_dependency_exists(Path(frontend_path) / "package.json", "typescript"):
                challenges.append("Frontend already uses TypeScript - may not need major refactor")
                alternatives.append("Targeted improvements to specific problem areas")
                technical_necessity = 5.0
                validation_level = ValidationLevel.CHALLENGED
        
        return {
            'challenges': challenges,
            'alternatives': alternatives,
            'severity': severity,
            'confidence': confidence,
            'technical_necessity': technical_necessity,
            'risk_score': risk_score,
            'effort_vs_benefit': effort_vs_benefit,
            'validation_level': validation_level,
            'alternative_approach': alternative_approach
        }
    
    def _generate_alternatives(
        self, 
        state: ValidationState, 
        codebase_root: Path,
        current_quality: Dict[str, Any]
    ) -> List[AlternativeSolution]:
        """Generate alternative architectural approaches"""
        
        alternatives = []
        
        # Alternative 1: Express + TypeScript Enhancement
        if current_quality['express_quality'] > 5:
            alternatives.append(AlternativeSolution(
                name="Express TypeScript Progressive Enhancement",
                description="Keep Express, add TypeScript file-by-file, improve architecture incrementally",
                effort_weeks=4,
                business_impact_score=7.0,
                technical_impact_score=7.5,
                future_proofing_score=6.5,
                risk_level="low",
                modernization_level=ModernizationLevel.MODERN,
                implementation_steps=[
                    "Set up TypeScript configuration alongside JavaScript",
                    "Convert critical routes to TypeScript first",
                    "Implement service layer pattern in TypeScript",
                    "Add comprehensive type definitions for data models",
                    "Gradually convert remaining files as touched"
                ],
                pros=[
                    "Minimal disruption to development",
                    "Can deploy continuously",
                    "Team learns TypeScript gradually",
                    "Lower risk of introducing bugs"
                ],
                cons=[
                    "Mixed JS/TS codebase temporarily",
                    "Doesn't get framework benefits of NestJS",
                    "Requires discipline to maintain architecture"
                ],
                prerequisites=["TypeScript setup", "ESLint configuration"],
                long_term_benefits=[
                    "Smooth path to NestJS if needed later",
                    "Improved code quality immediately",
                    "Better IDE support and refactoring"
                ]
            ))
        
        # Alternative 2: Fastify instead of NestJS
        alternatives.append(AlternativeSolution(
            name="Fastify + TypeScript Modern Stack",
            description="Use Fastify (faster than Express) with TypeScript for modern, performant API",
            effort_weeks=5,
            business_impact_score=8.0,
            technical_impact_score=8.5,
            future_proofing_score=8.0,
            risk_level="medium",
            modernization_level=ModernizationLevel.MODERN,
            implementation_steps=[
                "Set up Fastify with TypeScript template",
                "Implement plugin architecture for features",
                "Use Fastify schema validation (faster than alternatives)",
                "Migrate routes with automatic request/response validation",
                "Leverage Fastify's built-in swagger support"
            ],
            pros=[
                "Much faster than Express (2x throughput)",
                "Built-in TypeScript support",
                "Excellent plugin ecosystem",
                "Schema-based validation (faster than decorators)",
                "Lower learning curve than NestJS"
            ],
            cons=[
                "Different API than Express",
                "Smaller community than Express/NestJS",
                "Less opinionated than NestJS"
            ],
            prerequisites=["TypeScript knowledge", "Understanding of schema validation"],
            long_term_benefits=[
                "Better performance at scale",
                "Modern architecture without heavy framework",
                "Easy to extend and customize"
            ]
        ))
        
        # Alternative 3: Modular Monolith Architecture
        if state.constraint_profile and state.constraint_profile.is_pre_production:
            alternatives.append(AlternativeSolution(
                name="Modular Monolith with Clear Boundaries",
                description="Design modular monolith that can easily split to microservices later",
                effort_weeks=6,
                business_impact_score=9.0,
                technical_impact_score=9.0,
                future_proofing_score=9.5,
                risk_level="medium",
                modernization_level=ModernizationLevel.CUTTING_EDGE,
                implementation_steps=[
                    "Design clear module boundaries (patients, consultations, prescriptions)",
                    "Each module has own routes, services, repositories",
                    "Implement message bus for inter-module communication",
                    "Use Domain-Driven Design principles",
                    "Build with microservices extraction in mind"
                ],
                pros=[
                    "Easier to manage than microservices initially",
                    "Clear path to microservices when needed",
                    "Better code organization",
                    "Enables team scaling",
                    "Lower operational complexity"
                ],
                cons=[
                    "Requires upfront design work",
                    "Need discipline to maintain boundaries",
                    "More complex than simple MVC"
                ],
                prerequisites=["DDD understanding", "Clear domain boundaries"],
                long_term_benefits=[
                    "Smooth transition to microservices",
                    "Better team autonomy",
                    "Easier to maintain and scale",
                    "Clear ownership boundaries"
                ]
            ))
        
        return alternatives
    
    def _evaluate_nestjs_necessity(self, state: ValidationState, current_quality: Dict[str, Any]) -> float:
        """Evaluate how necessary NestJS really is"""
        
        necessity_score = 5.0  # neutral baseline
        
        # Factors increasing necessity
        if current_quality['express_quality'] < 4:
            necessity_score += 2  # Poor current architecture
        
        if not current_quality['has_service_layer']:
            necessity_score += 1.5  # No clear architecture
        
        if current_quality['test_coverage'] < 20:
            necessity_score += 1  # Poor testability
        
        # Factors decreasing necessity
        if current_quality['express_quality'] > 7:
            necessity_score -= 2  # Already well-structured
        
        if current_quality['typescript_readiness'] > 6:
            necessity_score -= 1  # Already moving to TypeScript
        
        if state.constraint_profile:
            if state.constraint_profile.available_developer_weeks < 6:
                necessity_score -= 2  # Not enough time
            
            if state.constraint_profile.learning_curve_acceptance == "low":
                necessity_score -= 1.5  # Team not ready for big changes
        
        return max(0, min(10, necessity_score))
    
    def _generate_architectural_recommendations(
        self, 
        state: ValidationState,
        current_quality: Dict[str, Any]
    ) -> List[str]:
        """Generate architectural recommendations based on analysis"""
        
        recommendations = []
        
        if current_quality['express_quality'] > 6:
            recommendations.append(
                "Current Express architecture is decent - consider incremental improvements over complete rewrite"
            )
        
        if current_quality['typescript_readiness'] < 5:
            recommendations.append(
                "Focus on TypeScript adoption first - this provides immediate benefits with lower risk"
            )
        
        if not current_quality['has_service_layer']:
            recommendations.append(
                "Implement service layer pattern regardless of framework choice - improves testability"
            )
        
        if state.constraint_profile and state.constraint_profile.is_pre_production:
            recommendations.append(
                "Consider more ambitious architectures (event-driven, CQRS) while breaking changes are possible"
            )
            
            recommendations.append(
                "Evaluate newer alternatives like Bun, Deno, or Edge runtimes for better performance"
            )
        
        return recommendations
    
    def _generate_challenge_summary(
        self,
        challenges: Dict[str, Any],
        alternatives: List[Any],
        current_quality: Dict[str, Any]
    ) -> str:
        """Generate summary of challenges"""
        
        total_challenges = sum(len(c['challenges']) for c in challenges.values())
        
        summary = f"Raised {total_challenges} challenges across recommendations. "
        
        if current_quality['overall_score'] > 6:
            summary += "Current architecture is reasonably well-structured, suggesting incremental improvements may be preferable to major migration. "
        
        if alternatives:
            summary += f"Generated {len(alternatives)} alternative approaches that may provide better risk/reward ratios. "
        
        nestjs_challenges = challenges.get('nestjs_migration', {}).get('challenges', [])
        if nestjs_challenges:
            summary += f"NestJS migration particularly challenged: {len(nestjs_challenges)} concerns raised. "
        
        return summary
