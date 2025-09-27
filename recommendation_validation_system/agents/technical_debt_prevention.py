"""
Technical Debt Prevention Agent - Identifies and prevents accumulation of technical debt.
"""

from pathlib import Path
from typing import Dict, Any, List

from .base_validator import BaseValidationAgent
from ..models import ValidationState, AgentReport


class TechnicalDebtPreventionAgent(BaseValidationAgent):
    """Identifies potential technical debt and suggests prevention strategies"""
    
    def __init__(self):
        super().__init__(
            "Technical Debt Prevention",
            "Identifies potential sources of technical debt and suggests prevention strategies"
        )
        
    def validate(self, state: ValidationState, codebase_root: Path) -> AgentReport:
        """Analyze recommendations for technical debt risks"""
        report = AgentReport(agent_name=self.name)
        
        # Analyze current technical debt
        current_debt = self._analyze_current_technical_debt(codebase_root)
        
        # Identify debt-inducing recommendations
        debt_risks = self._identify_debt_risks(state)
        
        # Find debt prevention opportunities
        prevention_opportunities = self._identify_prevention_opportunities(state, codebase_root)
        
        # Calculate technical health score
        health_score = self._calculate_technical_health_score(
            current_debt,
            debt_risks,
            prevention_opportunities
        )
        
        # Generate findings
        for risk in debt_risks:
            report.findings.append(self.create_finding(
                title=f"Technical Debt Risk: {risk['source']}",
                description=risk['description'],
                severity=risk['severity'],
                category="technical_debt",
                recommendation=risk['prevention'],
                tags=["technical_debt", "risk", risk['type']]
            ))
        
        for opportunity in prevention_opportunities:
            report.findings.append(self.create_finding(
                title=f"Debt Prevention Opportunity: {opportunity['title']}",
                description=opportunity['description'],
                severity="medium",
                category="prevention",
                recommendation=opportunity['action'],
                tags=["technical_debt", "prevention", "opportunity"]
            ))
        
        # Calculate metrics
        report.metrics = {
            "current_debt_score": current_debt['debt_score'],
            "projected_debt_increase": self._calculate_projected_debt_increase(state, debt_risks),
            "debt_risks_identified": len(debt_risks),
            "prevention_opportunities": len(prevention_opportunities),
            "technical_health_score": health_score,
            "code_quality_score": current_debt.get('code_quality', 5.0),
            "documentation_coverage": current_debt.get('doc_coverage', 0),
            "test_coverage_estimate": current_debt.get('test_coverage', 0)
        }
        
        # Generate recommendations
        report.recommendations = self._generate_debt_prevention_recommendations(
            state,
            current_debt,
            debt_risks,
            prevention_opportunities
        )
        
        report.summary = self._generate_debt_summary(
            report.metrics,
            debt_risks,
            prevention_opportunities
        )
        
        return report
    
    def _analyze_current_technical_debt(self, codebase_root: Path) -> Dict[str, Any]:
        """Analyze existing technical debt in the codebase"""
        
        debt_indicators = {
            'debt_score': 0,
            'code_quality': 5.0,
            'doc_coverage': 0,
            'test_coverage': 0,
            'issues': []
        }
        
        backend_path = codebase_root / "backend"
        frontend_path = codebase_root / "frontend"
        
        # Check for common debt indicators
        if backend_path.exists():
            # No TypeScript
            if not self.check_dependency_exists(backend_path / "package.json", "typescript"):
                debt_indicators['debt_score'] += 2
                debt_indicators['issues'].append("No TypeScript in backend")
            
            # Check for TODO/FIXME comments
            todo_patterns = self.find_patterns_in_files(
                backend_path / "src",
                r"(TODO|FIXME|HACK|XXX)",
                "*.js"
            )
            if len(todo_patterns) > 10:
                debt_indicators['debt_score'] += 1
                debt_indicators['issues'].append(f"{len(todo_patterns)} TODO/FIXME comments")
            
            # Check for large files
            src_path = backend_path / "src"
            if src_path.exists():
                large_files = []
                for file_path in src_path.rglob("*.js"):
                    try:
                        lines = len(file_path.read_text().split('\n'))
                        if lines > 500:
                            large_files.append(file_path.name)
                    except:
                        pass
                
                if large_files:
                    debt_indicators['debt_score'] += 1
                    debt_indicators['issues'].append(f"{len(large_files)} large files (>500 lines)")
            
            # Check for test coverage
            test_files = list(backend_path.glob("**/*.test.js")) + list(backend_path.glob("**/*.spec.js"))
            src_files = list((backend_path / "src").glob("**/*.js")) if (backend_path / "src").exists() else []
            
            if src_files:
                debt_indicators['test_coverage'] = (len(test_files) / len(src_files)) * 100
                if debt_indicators['test_coverage'] < 30:
                    debt_indicators['debt_score'] += 2
                    debt_indicators['issues'].append("Low test coverage")
        
        # Check frontend
        if frontend_path.exists():
            # Check for prop-types or TypeScript
            if not self.check_dependency_exists(frontend_path / "package.json", "typescript"):
                if not self.check_dependency_exists(frontend_path / "package.json", "prop-types"):
                    debt_indicators['debt_score'] += 1
                    debt_indicators['issues'].append("No type safety in frontend")
        
        # Check documentation
        docs_path = codebase_root / "docs"
        if not docs_path.exists() or not list(docs_path.glob("*.md")):
            debt_indicators['debt_score'] += 1
            debt_indicators['issues'].append("Minimal documentation")
        
        # Calculate code quality score
        debt_indicators['code_quality'] = max(0, 10 - debt_indicators['debt_score'])
        
        return debt_indicators
    
    def _identify_debt_risks(self, state: ValidationState) -> List[Dict[str, Any]]:
        """Identify recommendations that might create technical debt"""
        
        risks = []
        
        for rec_name, rec in state.original_recommendations.items():
            rec_text = (rec.title + " " + rec.description).lower()
            
            # Quick fixes that might create debt
            if "quick" in rec_text or "temporary" in rec_text or "workaround" in rec_text:
                risks.append({
                    "source": rec_name,
                    "type": "quick_fix",
                    "description": "Quick fixes often become permanent technical debt",
                    "severity": "medium",
                    "prevention": "Plan for proper implementation in next phase"
                })
            
            # Migration without cleanup
            if "migration" in rec_text and "cleanup" not in rec_text:
                risks.append({
                    "source": rec_name,
                    "type": "incomplete_migration",
                    "description": "Migration without cleanup leaves mixed patterns",
                    "severity": "high",
                    "prevention": "Include cleanup and removal of old patterns in scope"
                })
            
            # New technology without team expertise
            if state.business_context.get("team_nestjs_experience") == "none":
                if "nestjs" in rec_text:
                    risks.append({
                        "source": rec_name,
                        "type": "skill_gap",
                        "description": "New technology without expertise leads to poor patterns",
                        "severity": "high",
                        "prevention": "Invest in training or hire experienced developers"
                    })
            
            # Partial implementations
            if rec.estimated_effort_weeks < 2 and "implement" in rec_text:
                risks.append({
                    "source": rec_name,
                    "type": "partial_implementation",
                    "description": "Partial implementations often create inconsistency",
                    "severity": "medium",
                    "prevention": "Ensure complete implementation or clear phase boundaries"
                })
        
        # Check for missing testing strategy
        has_testing = any("test" in rec.title.lower() for rec in state.original_recommendations.values())
        if not has_testing:
            risks.append({
                "source": "missing_testing",
                "type": "no_testing_strategy",
                "description": "No testing strategy leads to untested code accumulation",
                "severity": "high",
                "prevention": "Add comprehensive testing strategy to recommendations"
            })
        
        # Check for documentation gaps
        has_docs = any("documentation" in rec.title.lower() for rec in state.original_recommendations.values())
        if not has_docs:
            risks.append({
                "source": "missing_documentation",
                "type": "documentation_gap",
                "description": "Undocumented changes become knowledge debt",
                "severity": "medium",
                "prevention": "Include documentation in all implementation tasks"
            })
        
        return risks
    
    def _identify_prevention_opportunities(
        self, 
        state: ValidationState,
        codebase_root: Path
    ) -> List[Dict[str, Any]]:
        """Identify opportunities to prevent technical debt"""
        
        opportunities = []
        
        # Pre-production advantage
        if state.constraint_profile and state.constraint_profile.is_pre_production:
            opportunities.append({
                "title": "Clean Slate Advantage",
                "description": "Pre-production allows fixing architectural issues without migration debt",
                "action": "Rebuild problematic modules from scratch instead of patching"
            })
            
            opportunities.append({
                "title": "Establish Standards Early",
                "description": "Set coding standards and patterns before codebase grows",
                "action": "Create and enforce style guides, linting rules, and architectural patterns"
            })
        
        # TypeScript opportunity
        backend_path = codebase_root / "backend"
        if backend_path.exists():
            if not self.check_dependency_exists(backend_path / "package.json", "typescript"):
                opportunities.append({
                    "title": "TypeScript Adoption",
                    "description": "TypeScript prevents entire classes of bugs and improves maintainability",
                    "action": "Adopt TypeScript now while codebase is small"
                })
        
        # Testing infrastructure
        if not (codebase_root / "jest.config.js").exists() and not (codebase_root / "vitest.config.js").exists():
            opportunities.append({
                "title": "Testing Infrastructure",
                "description": "Establish testing patterns early to prevent untested code accumulation",
                "action": "Set up testing framework with CI/CD integration"
            })
        
        # Documentation system
        if not (codebase_root / "docs").exists():
            opportunities.append({
                "title": "Documentation System",
                "description": "Establish documentation practices before knowledge debt accumulates",
                "action": "Set up documentation generation and enforce documentation standards"
            })
        
        # Code review process
        if state.business_context.get("team_size", 1) > 1:
            opportunities.append({
                "title": "Code Review Process",
                "description": "Peer review prevents bad patterns from entering codebase",
                "action": "Establish mandatory code review with clear guidelines"
            })
        
        # Automated quality checks
        opportunities.append({
            "title": "Automated Quality Gates",
            "description": "Automation prevents debt from entering the codebase",
            "action": "Set up linting, formatting, type checking, and test coverage in CI/CD"
        })
        
        return opportunities
    
    def _calculate_technical_health_score(
        self,
        current_debt: Dict[str, Any],
        debt_risks: List[Dict[str, Any]],
        prevention_opportunities: List[Dict[str, Any]]
    ) -> float:
        """Calculate overall technical health score"""
        
        # Start with inverse of debt score
        score = 10 - min(current_debt['debt_score'], 10)
        
        # Penalize for risks
        high_risks = sum(1 for risk in debt_risks if risk['severity'] == 'high')
        score -= high_risks * 0.5
        
        # Bonus for prevention opportunities being available
        if len(prevention_opportunities) > 3:
            score += 1
        
        # Bonus for good test coverage
        if current_debt.get('test_coverage', 0) > 50:
            score += 1
        
        return max(0, min(10, score))
    
    def _calculate_projected_debt_increase(
        self,
        state: ValidationState,
        debt_risks: List[Dict[str, Any]]
    ) -> float:
        """Calculate projected debt increase from recommendations"""
        
        increase = 0.0
        
        # Each high-risk item adds significant debt
        high_risks = sum(1 for risk in debt_risks if risk['severity'] == 'high')
        increase += high_risks * 2
        
        # Medium risks add moderate debt
        medium_risks = sum(1 for risk in debt_risks if risk['severity'] == 'medium')
        increase += medium_risks * 1
        
        # Migrations without cleanup
        for rec in state.original_recommendations.values():
            if "migration" in rec.title.lower():
                increase += 1.5
        
        # Reduce if proper practices are in place
        if any("testing" in rec.title.lower() for rec in state.original_recommendations.values()):
            increase -= 1
        
        if any("documentation" in rec.title.lower() for rec in state.original_recommendations.values()):
            increase -= 0.5
        
        return max(0, increase)
    
    def _generate_debt_prevention_recommendations(
        self,
        state: ValidationState,
        current_debt: Dict[str, Any],
        debt_risks: List[Dict[str, Any]],
        prevention_opportunities: List[Dict[str, Any]]
    ) -> List[str]:
        """Generate recommendations for preventing technical debt"""
        
        recommendations = []
        
        # Address current debt
        if current_debt['debt_score'] > 5:
            recommendations.append(
                f"CRITICAL: Current technical debt score is {current_debt['debt_score']}/10 - address before adding features"
            )
        
        # High-risk items
        high_risks = [r for r in debt_risks if r['severity'] == 'high']
        if high_risks:
            recommendations.append(
                f"Address {len(high_risks)} high-risk debt sources before they become permanent"
            )
        
        # Testing
        if current_debt.get('test_coverage', 0) < 30:
            recommendations.append(
                "Establish testing practices immediately - current coverage is critically low"
            )
        
        # Documentation
        if not any("documentation" in rec.title.lower() for rec in state.original_recommendations.values()):
            recommendations.append(
                "Include documentation in every task to prevent knowledge debt"
            )
        
        # Pre-production specific
        if state.constraint_profile and state.constraint_profile.is_pre_production:
            recommendations.append(
                "Use pre-production flexibility to establish strong technical foundations"
            )
            
            recommendations.append(
                "Fix architectural issues now - they become 10x harder after launch"
            )
        
        # Prevention opportunities
        if prevention_opportunities:
            top_opportunity = prevention_opportunities[0]
            recommendations.append(
                f"Priority prevention: {top_opportunity['title']} - {top_opportunity['action']}"
            )
        
        # Code quality
        recommendations.append(
            "Implement automated code quality checks in CI/CD pipeline"
        )
        
        return recommendations
    
    def _generate_debt_summary(
        self,
        metrics: Dict[str, Any],
        debt_risks: List[Dict[str, Any]],
        prevention_opportunities: List[Dict[str, Any]]
    ) -> str:
        """Generate summary of technical debt analysis"""
        
        health_score = metrics['technical_health_score']
        
        if health_score >= 7:
            assessment = "good technical health"
        elif health_score >= 5:
            assessment = "moderate technical debt risk"
        else:
            assessment = "high technical debt risk"
        
        summary = f"Project has {assessment}. "
        summary += f"Technical health score: {health_score:.1f}/10. "
        
        if metrics['current_debt_score'] > 5:
            summary += f"Current debt level is concerning ({metrics['current_debt_score']}/10). "
        
        if metrics['projected_debt_increase'] > 3:
            summary += f"Recommendations would add {metrics['projected_debt_increase']:.1f} debt points. "
        
        if metrics['debt_risks_identified'] > 0:
            summary += f"{metrics['debt_risks_identified']} debt risks identified. "
        
        if metrics['prevention_opportunities'] > 0:
            summary += f"{metrics['prevention_opportunities']} prevention opportunities available. "
        
        if metrics['test_coverage_estimate'] < 30:
            summary += "Critical: Test coverage is dangerously low. "
        
        return summary
