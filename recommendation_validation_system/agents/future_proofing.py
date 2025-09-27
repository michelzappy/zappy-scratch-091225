"""
Future Proofing Maximizer Agent - Ensures recommendations are future-proof.
"""

from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime, timedelta

from .base_validator import BaseValidationAgent
from ..models import ValidationState, AgentReport


class FutureProofingMaximizerAgent(BaseValidationAgent):
    """Validates that recommendations adequately consider future needs and scalability"""
    
    def __init__(self):
        super().__init__(
            "Future Proofing Maximizer",
            "Ensures architectural decisions account for 2-3 year technology trajectory"
        )
        
    def validate(self, state: ValidationState, codebase_root: Path) -> AgentReport:
        """Validate future-proofing aspects of recommendations"""
        report = AgentReport(agent_name=self.name)
        
        # Analyze scalability readiness
        scalability_analysis = self._analyze_scalability_readiness(state, codebase_root)
        
        # Check technology longevity
        tech_longevity = self._evaluate_technology_longevity(state, codebase_root)
        
        # Assess integration readiness
        integration_readiness = self._assess_integration_readiness(state, codebase_root)
        
        # Evaluate compliance evolution
        compliance_readiness = self._evaluate_compliance_evolution(state)
        
        # Generate findings
        for issue in scalability_analysis['issues']:
            report.findings.append(self.create_finding(
                title=f"Scalability Gap: {issue['title']}",
                description=issue['description'],
                severity=issue['severity'],
                category="scalability",
                recommendation=issue['recommendation'],
                tags=["future-proofing", "scalability"]
            ))
        
        for tech_issue in tech_longevity['concerns']:
            report.findings.append(self.create_finding(
                title=f"Technology Risk: {tech_issue['title']}",
                description=tech_issue['description'],
                severity="medium",
                category="technology",
                recommendation=tech_issue['recommendation'],
                tags=["future-proofing", "technology"]
            ))
        
        # Calculate metrics
        future_proofing_score = self._calculate_future_proofing_score(
            scalability_analysis,
            tech_longevity,
            integration_readiness,
            compliance_readiness
        )
        
        report.metrics = {
            "future_proofing_score": future_proofing_score,
            "scalability_readiness": scalability_analysis['score'],
            "technology_longevity_score": tech_longevity['score'],
            "integration_readiness": integration_readiness['score'],
            "compliance_readiness": compliance_readiness['score'],
            "years_future_proof": self._estimate_years_future_proof(future_proofing_score)
        }
        
        # Generate recommendations
        report.recommendations = self._generate_future_proofing_recommendations(
            state, 
            scalability_analysis,
            tech_longevity,
            integration_readiness
        )
        
        report.summary = self._generate_future_proofing_summary(report.metrics)
        
        # Update validation state
        for rec_name in state.original_recommendations:
            if rec_name in state.validation_results:
                validation = state.validation_results[rec_name]
                validation.future_proofing_score = future_proofing_score
        
        return report
    
    def _analyze_scalability_readiness(
        self, 
        state: ValidationState, 
        codebase_root: Path
    ) -> Dict[str, Any]:
        """Analyze how well recommendations prepare for scale"""
        
        issues = []
        score = 5.0
        
        # Check for horizontal scaling considerations
        has_stateless_design = False
        has_caching_strategy = False
        has_database_scaling = False
        has_async_processing = False
        
        for rec in state.original_recommendations.values():
            rec_text = (rec.title + " " + rec.description).lower()
            
            if any(term in rec_text for term in ["stateless", "session", "jwt"]):
                has_stateless_design = True
                score += 1
            
            if any(term in rec_text for term in ["cache", "redis", "memcache"]):
                has_caching_strategy = True
                score += 1
            
            if any(term in rec_text for term in ["sharding", "partition", "read replica"]):
                has_database_scaling = True
                score += 1.5
            
            if any(term in rec_text for term in ["queue", "async", "event", "message"]):
                has_async_processing = True
                score += 1.5
        
        # Check what's missing
        if not has_stateless_design:
            issues.append({
                "title": "Stateless Design Missing",
                "description": "No mention of stateless architecture for horizontal scaling",
                "severity": "high",
                "recommendation": "Design API to be stateless, use JWT tokens or external session store"
            })
        
        if not has_caching_strategy:
            issues.append({
                "title": "No Caching Strategy",
                "description": "Caching is critical for performance at scale",
                "severity": "medium",
                "recommendation": "Implement multi-layer caching: CDN, API cache, database cache"
            })
        
        if not has_database_scaling:
            issues.append({
                "title": "Database Scaling Not Addressed",
                "description": "No strategy for database scaling beyond vertical scaling",
                "severity": "high",
                "recommendation": "Plan for read replicas, sharding, or database partitioning"
            })
        
        if not has_async_processing:
            issues.append({
                "title": "Synchronous Processing Bottleneck",
                "description": "All processing appears synchronous - will bottleneck at scale",
                "severity": "medium",
                "recommendation": "Implement message queues for async processing of heavy tasks"
            })
        
        # Check for microservices readiness if expecting high scale
        if state.business_context.get("expected_scale") == "high":
            if not any("microservice" in rec.description.lower() or "modular" in rec.description.lower() 
                      for rec in state.original_recommendations.values()):
                issues.append({
                    "title": "Monolith at High Scale",
                    "description": "High scale expected but no microservices consideration",
                    "severity": "high",
                    "recommendation": "Design modular architecture that can split into microservices"
                })
        
        return {
            "issues": issues,
            "score": min(score, 10),
            "has_stateless_design": has_stateless_design,
            "has_caching_strategy": has_caching_strategy,
            "has_database_scaling": has_database_scaling,
            "has_async_processing": has_async_processing
        }
    
    def _evaluate_technology_longevity(
        self, 
        state: ValidationState,
        codebase_root: Path
    ) -> Dict[str, Any]:
        """Evaluate if technology choices will age well"""
        
        concerns = []
        score = 7.0  # Start optimistic
        
        # Define technology lifecycle stages
        tech_lifecycle = {
            "emerging": ["bun", "deno", "htmx", "qwik"],  # Too new, risky
            "growing": ["svelte", "solid", "fastify", "trpc", "drizzle"],  # Good momentum
            "mature": ["react", "vue", "express", "nestjs", "postgres", "redis"],  # Safe bets
            "declining": ["angular.js", "backbone", "jquery", "grunt"],  # Avoid
            "legacy": ["php", "perl", "cold fusion"]  # Definitely avoid
        }
        
        backend_path = codebase_root / "backend"
        frontend_path = codebase_root / "frontend"
        
        # Check backend tech choices
        if backend_path.exists():
            package_json = backend_path / "package.json"
            
            # Express is mature but not cutting edge
            if self.check_dependency_exists(package_json, "express"):
                if not self.check_dependency_exists(package_json, "typescript"):
                    concerns.append({
                        "title": "Express without TypeScript",
                        "description": "Plain JavaScript Express apps are becoming legacy",
                        "recommendation": "Add TypeScript for long-term maintainability"
                    })
                    score -= 1
            
            # Check for modern patterns
            if not self.check_dependency_exists(package_json, "@nestjs/core"):
                if not self.check_dependency_exists(package_json, "fastify"):
                    score -= 0.5  # Missing modern framework
        
        # Check frontend tech choices  
        if frontend_path.exists():
            package_json = frontend_path / "package.json"
            
            # Next.js is good for longevity
            if self.check_dependency_exists(package_json, "next"):
                score += 0.5
            
            # Check for modern state management
            if not any(self.check_dependency_exists(package_json, lib) 
                      for lib in ["zustand", "@tanstack/react-query", "jotai"]):
                concerns.append({
                    "title": "Outdated State Management",
                    "description": "Modern state management patterns not adopted",
                    "recommendation": "Use React Query for server state, Zustand/Jotai for client state"
                })
        
        # Check database choices
        if not any(term in str(state.original_recommendations).lower() 
                  for term in ["postgres", "mysql", "mongodb", "dynamodb"]):
            concerns.append({
                "title": "Database Choice Unclear",
                "description": "No clear database strategy for long-term",
                "recommendation": "PostgreSQL is the safest long-term choice for most applications"
            })
        
        # AI/ML readiness
        if state.business_context.get("industry") == "telehealth":
            if not any("ai" in rec.description.lower() or "ml" in rec.description.lower() 
                      or "llm" in rec.description.lower() for rec in state.original_recommendations.values()):
                concerns.append({
                    "title": "No AI/ML Strategy",
                    "description": "Telehealth will increasingly require AI capabilities",
                    "recommendation": "Design architecture to integrate AI services (OpenAI, Anthropic, local models)"
                })
                score -= 1
        
        return {
            "concerns": concerns,
            "score": max(0, min(10, score))
        }
    
    def _assess_integration_readiness(
        self, 
        state: ValidationState,
        codebase_root: Path
    ) -> Dict[str, Any]:
        """Assess readiness for common integrations"""
        
        score = 5.0
        readiness_factors = {}
        
        # Check for API design that supports integrations
        has_webhooks = any("webhook" in rec.description.lower() for rec in state.original_recommendations.values())
        has_api_versioning = any("version" in rec.description.lower() for rec in state.original_recommendations.values())
        has_event_system = any("event" in rec.description.lower() for rec in state.original_recommendations.values())
        
        if has_webhooks:
            readiness_factors["webhooks"] = True
            score += 1.5
        
        if has_api_versioning:
            readiness_factors["api_versioning"] = True
            score += 1
        
        if has_event_system:
            readiness_factors["event_system"] = True
            score += 2
        
        # Check for common integration patterns
        backend_path = codebase_root / "backend"
        if backend_path.exists():
            # Check for OAuth support
            if self.check_dependency_exists(backend_path / "package.json", "passport"):
                readiness_factors["oauth_ready"] = True
                score += 0.5
            
            # Check for payment integration readiness
            if self.check_dependency_exists(backend_path / "package.json", "stripe"):
                readiness_factors["payment_ready"] = True
                score += 0.5
        
        return {
            "score": min(score, 10),
            "factors": readiness_factors
        }
    
    def _evaluate_compliance_evolution(self, state: ValidationState) -> Dict[str, Any]:
        """Evaluate readiness for evolving compliance requirements"""
        
        score = 5.0
        compliance_factors = {}
        
        # For telehealth, HIPAA is critical
        if state.business_context.get("industry") == "telehealth":
            has_audit_trail = any("audit" in rec.description.lower() for rec in state.original_recommendations.values())
            has_encryption = any("encrypt" in rec.description.lower() for rec in state.original_recommendations.values())
            has_access_control = any("rbac" in rec.description.lower() or "role" in rec.description.lower() 
                                   for rec in state.original_recommendations.values())
            
            if has_audit_trail:
                compliance_factors["audit_trail"] = True
                score += 2
            
            if has_encryption:
                compliance_factors["encryption"] = True
                score += 2
            
            if has_access_control:
                compliance_factors["access_control"] = True
                score += 1
        
        # GDPR considerations
        has_data_deletion = any("deletion" in rec.description.lower() or "gdpr" in rec.description.lower() 
                              for rec in state.original_recommendations.values())
        if has_data_deletion:
            compliance_factors["gdpr_ready"] = True
            score += 1
        
        return {
            "score": min(score, 10),
            "factors": compliance_factors
        }
    
    def _calculate_future_proofing_score(
        self,
        scalability: Dict[str, Any],
        tech_longevity: Dict[str, Any],
        integration: Dict[str, Any],
        compliance: Dict[str, Any]
    ) -> float:
        """Calculate overall future-proofing score"""
        
        # Weighted average
        score = (
            scalability['score'] * 0.3 +
            tech_longevity['score'] * 0.3 +
            integration['score'] * 0.2 +
            compliance['score'] * 0.2
        )
        
        return round(score, 1)
    
    def _estimate_years_future_proof(self, score: float) -> float:
        """Estimate how many years the architecture will remain viable"""
        
        if score >= 8:
            return 3.0
        elif score >= 6:
            return 2.0
        elif score >= 4:
            return 1.0
        else:
            return 0.5
    
    def _generate_future_proofing_recommendations(
        self,
        state: ValidationState,
        scalability: Dict[str, Any],
        tech_longevity: Dict[str, Any],
        integration: Dict[str, Any]
    ) -> List[str]:
        """Generate recommendations for future-proofing"""
        
        recommendations = []
        
        if scalability['score'] < 6:
            recommendations.append(
                "CRITICAL: Address scalability concerns now while in pre-production. "
                "Implement caching, async processing, and database scaling strategies."
            )
        
        if tech_longevity['score'] < 6:
            recommendations.append(
                "Review technology choices for longevity. Consider more established or "
                "faster-growing technologies for critical components."
            )
        
        if not scalability['has_async_processing']:
            recommendations.append(
                "Implement message queue (RabbitMQ, AWS SQS, or Redis Queue) for async processing"
            )
        
        if not scalability['has_caching_strategy']:
            recommendations.append(
                "Add Redis for caching and session management - essential for scale"
            )
        
        # AI readiness for telehealth
        if state.business_context.get("industry") == "telehealth":
            recommendations.append(
                "Design API to integrate with AI services for symptom analysis, triage, and recommendations"
            )
        
        # Event-driven architecture
        if state.constraint_profile and state.constraint_profile.is_pre_production:
            recommendations.append(
                "Consider event-driven architecture from the start - much harder to add later"
            )
        
        return recommendations
    
    def _generate_future_proofing_summary(self, metrics: Dict[str, Any]) -> str:
        """Generate summary of future-proofing analysis"""
        
        score = metrics['future_proofing_score']
        years = metrics['years_future_proof']
        
        if score >= 7:
            assessment = "well-positioned for future growth"
        elif score >= 5:
            assessment = "moderately future-proof with some gaps"
        else:
            assessment = "significant future-proofing concerns"
        
        summary = (
            f"Architecture is {assessment}. "
            f"Future-proofing score: {score}/10. "
            f"Estimated viability: {years} years before major refactoring needed. "
        )
        
        if metrics['scalability_readiness'] < 6:
            summary += "Scalability is a primary concern that needs immediate attention. "
        
        if metrics['technology_longevity_score'] < 6:
            summary += "Some technology choices may not age well. "
        
        return summary
