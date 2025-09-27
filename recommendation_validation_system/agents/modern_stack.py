"""
Modern Stack Evaluator Agent - Evaluates technology stack modernity and alternatives.
"""

from pathlib import Path
from typing import Dict, Any, List, Tuple
from datetime import datetime

from .base_validator import BaseValidationAgent
from ..models import (
    ValidationState, 
    AgentReport,
    AlternativeSolution,
    ModernizationLevel
)


class ModernStackEvaluatorAgent(BaseValidationAgent):
    """Evaluates if recommendations use sufficiently modern technology approaches"""
    
    def __init__(self):
        super().__init__(
            "Modern Stack Evaluator",
            "Assesses technology choices against current best practices and emerging standards"
        )
        
        # Define technology rankings (2024-2025 perspective)
        self.tech_rankings = {
            "backend_frameworks": {
                "cutting_edge": ["bun", "deno", "hono"],
                "modern": ["nestjs", "fastify", "trpc"],
                "standard": ["express + typescript", "koa"],
                "legacy": ["express (js only)", "restify"]
            },
            "databases": {
                "cutting_edge": ["edgedb", "surrealdb", "neon"],
                "modern": ["postgresql", "planetscale", "cockroachdb"],
                "standard": ["mysql", "mongodb"],
                "legacy": ["oracle", "db2"]
            },
            "orms": {
                "cutting_edge": ["drizzle", "kysely"],
                "modern": ["prisma", "typeorm"],
                "standard": ["sequelize", "mongoose"],
                "legacy": ["bookshelf", "waterline"]
            },
            "api_patterns": {
                "cutting_edge": ["trpc", "graphql federation"],
                "modern": ["graphql", "openapi 3.1"],
                "standard": ["rest + swagger", "json-rpc"],
                "legacy": ["soap", "xml-rpc"]
            },
            "frontend_frameworks": {
                "cutting_edge": ["qwik", "solid", "astro"],
                "modern": ["next.js 14+", "remix", "sveltekit"],
                "standard": ["react spa", "vue 3"],
                "legacy": ["angular.js", "backbone"]
            },
            "state_management": {
                "cutting_edge": ["valtio", "jotai"],
                "modern": ["zustand", "@tanstack/react-query"],
                "standard": ["redux-toolkit", "mobx"],
                "legacy": ["redux (plain)", "vuex"]
            },
            "deployment": {
                "cutting_edge": ["edge functions", "wasm"],
                "modern": ["kubernetes", "serverless", "vercel"],
                "standard": ["docker", "pm2"],
                "legacy": ["bare metal", "ftp deployment"]
            }
        }
    
    def validate(self, state: ValidationState, codebase_root: Path) -> AgentReport:
        """Evaluate technology stack modernity"""
        report = AgentReport(agent_name=self.name)
        
        # Analyze current stack
        current_stack = self._analyze_current_stack(codebase_root)
        
        # Evaluate recommended stack
        recommended_stack = self._evaluate_recommended_stack(state)
        
        # Compare with modern alternatives
        modern_alternatives = self._identify_modern_alternatives(
            current_stack, 
            recommended_stack,
            state
        )
        
        # Generate technology gap analysis
        tech_gaps = self._analyze_technology_gaps(
            current_stack,
            recommended_stack,
            state
        )
        
        # Create findings
        for gap in tech_gaps:
            report.findings.append(self.create_finding(
                title=f"Technology Gap: {gap['category']}",
                description=gap['description'],
                severity=gap['severity'],
                category="technology",
                recommendation=gap['recommendation'],
                tags=["modernization", "technology", gap['category']]
            ))
        
        # Calculate modernization scores
        current_modernity = self._calculate_modernity_score(current_stack)
        recommended_modernity = self._calculate_modernity_score(recommended_stack)
        improvement_delta = recommended_modernity - current_modernity
        
        report.metrics = {
            "current_stack_modernity": current_modernity,
            "recommended_stack_modernity": recommended_modernity,
            "modernity_improvement": improvement_delta,
            "modern_alternatives_count": len(modern_alternatives),
            "technology_gaps_count": len(tech_gaps),
            "cutting_edge_adoption": self._calculate_cutting_edge_percentage(recommended_stack)
        }
        
        # Add modern alternatives to state
        for alt in modern_alternatives:
            state.add_alternative(alt)
        
        # Generate recommendations
        report.recommendations = self._generate_modernization_recommendations(
            current_stack,
            recommended_stack,
            tech_gaps,
            state
        )
        
        report.summary = self._generate_modernization_summary(
            report.metrics,
            tech_gaps,
            modern_alternatives
        )
        
        return report
    
    def _analyze_current_stack(self, codebase_root: Path) -> Dict[str, Any]:
        """Analyze the current technology stack"""
        stack = {
            "backend": {},
            "frontend": {},
            "database": {},
            "deployment": {},
            "modernity_level": ModernizationLevel.STANDARD
        }
        
        # Analyze backend
        backend_path = codebase_root / "backend"
        if backend_path.exists():
            package_json = backend_path / "package.json"
            
            # Framework detection
            if self.check_dependency_exists(package_json, "@nestjs/core"):
                stack["backend"]["framework"] = "nestjs"
                stack["backend"]["modernity"] = "modern"
            elif self.check_dependency_exists(package_json, "fastify"):
                stack["backend"]["framework"] = "fastify"
                stack["backend"]["modernity"] = "modern"
            elif self.check_dependency_exists(package_json, "express"):
                if self.check_dependency_exists(package_json, "typescript"):
                    stack["backend"]["framework"] = "express + typescript"
                    stack["backend"]["modernity"] = "standard"
                else:
                    stack["backend"]["framework"] = "express"
                    stack["backend"]["modernity"] = "legacy"
            
            # ORM detection
            if self.check_dependency_exists(package_json, "drizzle-orm"):
                stack["backend"]["orm"] = "drizzle"
                stack["backend"]["orm_modernity"] = "cutting_edge"
            elif self.check_dependency_exists(package_json, "@prisma/client"):
                stack["backend"]["orm"] = "prisma"
                stack["backend"]["orm_modernity"] = "modern"
            elif self.check_dependency_exists(package_json, "sequelize"):
                stack["backend"]["orm"] = "sequelize"
                stack["backend"]["orm_modernity"] = "standard"
            
            # API pattern detection
            if self.check_dependency_exists(package_json, "@trpc/server"):
                stack["backend"]["api_pattern"] = "trpc"
                stack["backend"]["api_modernity"] = "cutting_edge"
            elif self.check_dependency_exists(package_json, "graphql"):
                stack["backend"]["api_pattern"] = "graphql"
                stack["backend"]["api_modernity"] = "modern"
            else:
                stack["backend"]["api_pattern"] = "rest"
                stack["backend"]["api_modernity"] = "standard"
        
        # Analyze frontend
        frontend_path = codebase_root / "frontend"
        if frontend_path.exists():
            package_json = frontend_path / "package.json"
            
            # Framework detection
            if self.check_dependency_exists(package_json, "next"):
                stack["frontend"]["framework"] = "next.js"
                stack["frontend"]["modernity"] = "modern"
            elif self.check_dependency_exists(package_json, "@remix-run/react"):
                stack["frontend"]["framework"] = "remix"
                stack["frontend"]["modernity"] = "modern"
            elif self.check_dependency_exists(package_json, "react"):
                stack["frontend"]["framework"] = "react"
                stack["frontend"]["modernity"] = "standard"
            
            # State management detection
            if self.check_dependency_exists(package_json, "zustand"):
                stack["frontend"]["state_management"] = "zustand"
                stack["frontend"]["state_modernity"] = "modern"
            elif self.check_dependency_exists(package_json, "@tanstack/react-query"):
                stack["frontend"]["state_management"] = "react-query"
                stack["frontend"]["state_modernity"] = "modern"
            elif self.check_dependency_exists(package_json, "redux"):
                stack["frontend"]["state_management"] = "redux"
                stack["frontend"]["state_modernity"] = "standard"
        
        # Check deployment
        if (codebase_root / "Dockerfile").exists():
            stack["deployment"]["containerized"] = True
            stack["deployment"]["modernity"] = "standard"
        
        if (codebase_root / "vercel.json").exists():
            stack["deployment"]["platform"] = "vercel"
            stack["deployment"]["modernity"] = "modern"
        
        return stack
    
    def _evaluate_recommended_stack(self, state: ValidationState) -> Dict[str, Any]:
        """Evaluate the technology stack in recommendations"""
        stack = {
            "backend": {},
            "frontend": {},
            "database": {},
            "deployment": {}
        }
        
        for rec in state.original_recommendations.values():
            rec_text = (rec.title + " " + rec.description).lower()
            
            # Backend recommendations
            if "nestjs" in rec_text:
                stack["backend"]["framework"] = "nestjs"
                stack["backend"]["modernity"] = "modern"
            elif "fastify" in rec_text:
                stack["backend"]["framework"] = "fastify"
                stack["backend"]["modernity"] = "modern"
            
            # ORM recommendations
            if "prisma" in rec_text:
                stack["backend"]["orm"] = "prisma"
                stack["backend"]["orm_modernity"] = "modern"
            elif "drizzle" in rec_text:
                stack["backend"]["orm"] = "drizzle"
                stack["backend"]["orm_modernity"] = "cutting_edge"
            
            # API pattern recommendations
            if "graphql" in rec_text:
                stack["backend"]["api_pattern"] = "graphql"
                stack["backend"]["api_modernity"] = "modern"
            elif "trpc" in rec_text:
                stack["backend"]["api_pattern"] = "trpc"
                stack["backend"]["api_modernity"] = "cutting_edge"
            elif "swagger" in rec_text or "openapi" in rec_text:
                stack["backend"]["api_pattern"] = "rest + openapi"
                stack["backend"]["api_modernity"] = "standard"
            
            # Deployment recommendations
            if "kubernetes" in rec_text or "k8s" in rec_text:
                stack["deployment"]["platform"] = "kubernetes"
                stack["deployment"]["modernity"] = "modern"
            elif "serverless" in rec_text:
                stack["deployment"]["platform"] = "serverless"
                stack["deployment"]["modernity"] = "modern"
            elif "edge" in rec_text:
                stack["deployment"]["platform"] = "edge"
                stack["deployment"]["modernity"] = "cutting_edge"
        
        return stack
    
    def _identify_modern_alternatives(
        self,
        current_stack: Dict[str, Any],
        recommended_stack: Dict[str, Any],
        state: ValidationState
    ) -> List[AlternativeSolution]:
        """Identify more modern technology alternatives"""
        alternatives = []
        
        # Check if tRPC is being considered
        if recommended_stack.get("backend", {}).get("api_pattern") != "trpc":
            if state.constraint_profile and state.constraint_profile.is_pre_production:
                alternatives.append(AlternativeSolution(
                    name="tRPC Full-Stack TypeScript",
                    description="Use tRPC for end-to-end type-safe APIs without code generation",
                    effort_weeks=5,
                    business_impact_score=8.5,
                    technical_impact_score=9.0,
                    future_proofing_score=9.0,
                    risk_level="medium",
                    modernization_level=ModernizationLevel.CUTTING_EDGE,
                    implementation_steps=[
                        "Set up tRPC server with Express/Fastify adapter",
                        "Define type-safe procedures (queries and mutations)",
                        "Generate React Query hooks automatically",
                        "Implement real-time subscriptions with WebSockets",
                        "Add authentication with tRPC context"
                    ],
                    pros=[
                        "100% type-safe API without code generation",
                        "Automatic client generation",
                        "Excellent developer experience",
                        "No API versioning needed",
                        "Smaller bundle size than GraphQL"
                    ],
                    cons=[
                        "TypeScript-only (not a con if already using TS)",
                        "Smaller ecosystem than REST/GraphQL",
                        "Requires monorepo or careful package management"
                    ],
                    prerequisites=["TypeScript proficiency", "Monorepo setup recommended"],
                    long_term_benefits=[
                        "Dramatically reduced API maintenance",
                        "Impossible to have frontend/backend type mismatches",
                        "Faster development velocity"
                    ]
                ))
        
        # Check for edge runtime opportunities
        if recommended_stack.get("deployment", {}).get("platform") != "edge":
            alternatives.append(AlternativeSolution(
                name="Edge Runtime Deployment",
                description="Deploy to edge functions for global low-latency performance",
                effort_weeks=3,
                business_impact_score=9.0,
                technical_impact_score=8.0,
                future_proofing_score=9.5,
                risk_level="low",
                modernization_level=ModernizationLevel.CUTTING_EDGE,
                implementation_steps=[
                    "Refactor to be edge-runtime compatible",
                    "Use Cloudflare Workers or Vercel Edge Functions",
                    "Implement edge-compatible database (Cloudflare D1, PlanetScale)",
                    "Set up global CDN distribution",
                    "Implement edge caching strategies"
                ],
                pros=[
                    "Sub-50ms response times globally",
                    "Automatic scaling",
                    "Lower costs than traditional hosting",
                    "Better user experience",
                    "Built-in DDoS protection"
                ],
                cons=[
                    "Limited runtime (no Node.js APIs)",
                    "Cold start considerations",
                    "Debugging can be more complex"
                ],
                prerequisites=["Understanding of edge runtime limitations"],
                long_term_benefits=[
                    "Global performance without complex infrastructure",
                    "Significant cost savings at scale",
                    "Future-proof architecture"
                ]
            ))
        
        # Modern database alternatives
        if "postgres" not in str(recommended_stack).lower():
            alternatives.append(AlternativeSolution(
                name="PostgreSQL with Modern Extensions",
                description="Use PostgreSQL with vector search, JSON, and time-series extensions",
                effort_weeks=2,
                business_impact_score=8.0,
                technical_impact_score=8.5,
                future_proofing_score=9.0,
                risk_level="very_low",
                modernization_level=ModernizationLevel.MODERN,
                implementation_steps=[
                    "Set up PostgreSQL 16 with extensions",
                    "Enable pgvector for AI/ML features",
                    "Use JSONB for flexible schemas",
                    "Implement row-level security",
                    "Set up logical replication for real-time sync"
                ],
                pros=[
                    "Battle-tested reliability",
                    "Incredible feature set",
                    "Great performance",
                    "Extensive ecosystem",
                    "AI-ready with pgvector"
                ],
                cons=[
                    "Requires more setup than hosted solutions",
                    "Need to manage backups and scaling"
                ],
                prerequisites=["Basic PostgreSQL knowledge"],
                long_term_benefits=[
                    "Single database for all needs",
                    "Ready for AI/ML features",
                    "Proven scalability"
                ]
            ))
        
        return alternatives
    
    def _analyze_technology_gaps(
        self,
        current_stack: Dict[str, Any],
        recommended_stack: Dict[str, Any],
        state: ValidationState
    ) -> List[Dict[str, Any]]:
        """Identify gaps in technology modernization"""
        gaps = []
        
        # Check for missing modern patterns
        if not current_stack.get("backend", {}).get("orm_modernity") in ["modern", "cutting_edge"]:
            if not recommended_stack.get("backend", {}).get("orm_modernity") in ["modern", "cutting_edge"]:
                gaps.append({
                    "category": "database_access",
                    "description": "Still using legacy ORM patterns or raw SQL",
                    "severity": "medium",
                    "recommendation": "Adopt Drizzle or Prisma for type-safe database access"
                })
        
        # Check for missing type safety
        if state.constraint_profile and state.constraint_profile.is_pre_production:
            if "trpc" not in str(recommended_stack).lower() and "graphql" not in str(recommended_stack).lower():
                gaps.append({
                    "category": "api_type_safety",
                    "description": "Missing end-to-end type safety opportunity",
                    "severity": "high",
                    "recommendation": "Implement tRPC or GraphQL for type-safe APIs"
                })
        
        # Check for missing real-time capabilities
        if not any(term in str(current_stack).lower() + str(recommended_stack).lower() 
                  for term in ["websocket", "server-sent", "subscription", "real-time"]):
            gaps.append({
                "category": "real_time",
                "description": "No real-time capabilities planned",
                "severity": "medium",
                "recommendation": "Add WebSocket or Server-Sent Events support"
            })
        
        # Check for missing observability
        if not any(term in str(recommended_stack).lower() 
                  for term in ["monitoring", "observability", "tracing", "metrics"]):
            gaps.append({
                "category": "observability",
                "description": "No modern observability strategy",
                "severity": "high",
                "recommendation": "Implement OpenTelemetry for comprehensive observability"
            })
        
        return gaps
    
    def _calculate_modernity_score(self, stack: Dict[str, Any]) -> float:
        """Calculate how modern a technology stack is"""
        score = 5.0  # baseline
        
        # Backend scoring
        backend_modernity = stack.get("backend", {}).get("modernity", "standard")
        if backend_modernity == "cutting_edge":
            score += 2
        elif backend_modernity == "modern":
            score += 1.5
        elif backend_modernity == "legacy":
            score -= 1
        
        # ORM scoring
        orm_modernity = stack.get("backend", {}).get("orm_modernity", "standard")
        if orm_modernity == "cutting_edge":
            score += 1
        elif orm_modernity == "modern":
            score += 0.5
        
        # API pattern scoring
        api_modernity = stack.get("backend", {}).get("api_modernity", "standard")
        if api_modernity == "cutting_edge":
            score += 1.5
        elif api_modernity == "modern":
            score += 1
        
        # Frontend scoring
        frontend_modernity = stack.get("frontend", {}).get("modernity", "standard")
        if frontend_modernity == "modern":
            score += 0.5
        
        # Deployment scoring
        deployment_modernity = stack.get("deployment", {}).get("modernity", "standard")
        if deployment_modernity == "cutting_edge":
            score += 1
        elif deployment_modernity == "modern":
            score += 0.5
        
        return min(max(score, 0), 10)
    
    def _calculate_cutting_edge_percentage(self, stack: Dict[str, Any]) -> float:
        """Calculate percentage of cutting-edge technologies"""
        total_techs = 0
        cutting_edge_count = 0
        
        for category in stack.values():
            if isinstance(category, dict):
                for key, value in category.items():
                    if "modernity" in key:
                        total_techs += 1
                        if value == "cutting_edge":
                            cutting_edge_count += 1
        
        if total_techs == 0:
            return 0
        
        return round((cutting_edge_count / total_techs) * 100, 1)
    
    def _generate_modernization_recommendations(
        self,
        current_stack: Dict[str, Any],
        recommended_stack: Dict[str, Any],
        tech_gaps: List[Dict[str, Any]],
        state: ValidationState
    ) -> List[str]:
        """Generate modernization recommendations"""
        recommendations = []
        
        if state.constraint_profile and state.constraint_profile.is_pre_production:
            recommendations.append(
                "PRE-PRODUCTION ADVANTAGE: Adopt cutting-edge technologies now while breaking changes are possible"
            )
            
            if self._calculate_cutting_edge_percentage(recommended_stack) < 20:
                recommendations.append(
                    "Consider more ambitious technology choices - you're playing it too safe for pre-production"
                )
        
        # Specific technology recommendations
        if not recommended_stack.get("backend", {}).get("api_pattern") in ["trpc", "graphql"]:
            recommendations.append(
                "Implement tRPC for type-safe APIs - eliminates entire classes of bugs"
            )
        
        if not recommended_stack.get("deployment", {}).get("platform") == "edge":
            recommendations.append(
                "Consider edge deployment for global performance and cost efficiency"
            )
        
        # Database recommendations
        if len(tech_gaps) > 2:
            recommendations.append(
                f"Address {len(tech_gaps)} technology gaps before they become technical debt"
            )
        
        return recommendations
    
    def _generate_modernization_summary(
        self,
        metrics: Dict[str, Any],
        tech_gaps: List[Dict[str, Any]],
        alternatives: List[AlternativeSolution]
    ) -> str:
        """Generate summary of modernization analysis"""
        
        current_score = metrics['current_stack_modernity']
        recommended_score = metrics['recommended_stack_modernity']
        improvement = metrics['modernity_improvement']
        
        if recommended_score >= 7:
            assessment = "appropriately modern"
        elif recommended_score >= 5:
            assessment = "moderately modern with room for improvement"
        else:
            assessment = "insufficiently modern for 2024-2025 standards"
        
        summary = (
            f"Technology stack assessment: {assessment}. "
            f"Current modernity: {current_score:.1f}/10, "
            f"Recommended: {recommended_score:.1f}/10 "
            f"(+{improvement:.1f} improvement). "
        )
        
        if metrics['cutting_edge_adoption'] < 20:
            summary += (
                f"Only {metrics['cutting_edge_adoption']}% cutting-edge adoption - "
                "consider more ambitious choices in pre-production. "
            )
        
        if len(alternatives) > 0:
            summary += f"Found {len(alternatives)} more modern alternatives to consider. "
        
        if len(tech_gaps) > 2:
            summary += f"Identified {len(tech_gaps)} significant technology gaps. "
        
        return summary
