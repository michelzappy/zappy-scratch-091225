"""
Automated Frontend Error Fixing Orchestrator

Complete implementation strategy for automatically fixing the 378 frontend errors
with strict constraints and safety checks.
"""

from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple, Set
from dataclasses import dataclass
from enum import Enum
import json
import re
import os
from datetime import datetime

from .models import SharedState, RepositoryContext, FrontendIssue


class FixingPriority(Enum):
    CRITICAL = 1    # Breaks core functionality
    HIGH = 2        # Major user experience issues  
    MEDIUM = 3      # Moderate improvements
    LOW = 4         # Nice to have fixes


@dataclass
class AutomatedFixingPlan:
    """Complete plan for automated error fixing with safety constraints."""
    
    # Core constraints
    constraints: List[str]
    
    # Issue prioritization
    critical_fixes: List[Dict[str, Any]]
    high_impact_fixes: List[Dict[str, Any]]
    medium_impact_fixes: List[Dict[str, Any]]
    low_impact_fixes: List[Dict[str, Any]]
    
    # Execution strategy
    execution_phases: Dict[str, Any]
    safety_protocols: Dict[str, Any]
    validation_framework: Dict[str, Any]


class AutomatedFixingOrchestrator:
    """
    Main orchestrator for automated frontend error fixing.
    
    Key Safety Rules:
    1. ALWAYS check if pages/files exist before creating
    2. NO database schema changes
    3. IGNORE refill-related functionality  
    4. Focus on highest impact fixes first
    5. Validate every change before proceeding
    """
    
    def __init__(self, root_path: Path):
        self.root_path = Path(root_path)
        self.frontend_path = self.root_path / "frontend"
        self.existing_pages: Set[str] = set()
        self.existing_routes: Set[str] = set()
        
    def create_fixing_strategy(self, analysis_data: Dict[str, Any]) -> AutomatedFixingPlan:
        """Create comprehensive automated fixing strategy."""
        
        # Scan existing pages first
        self._scan_existing_structure()
        
        # Apply constraints and filters
        filtered_issues = self._filter_issues_by_constraints(analysis_data)
        
        # Prioritize by impact
        prioritized_fixes = self._prioritize_fixes_by_impact(filtered_issues)
        
        # Create execution plan
        execution_plan = self._create_execution_plan(prioritized_fixes)
        
        return AutomatedFixingPlan(
            constraints=self._get_safety_constraints(),
            critical_fixes=prioritized_fixes['critical'],
            high_impact_fixes=prioritized_fixes['high'],
            medium_impact_fixes=prioritized_fixes['medium'], 
            low_impact_fixes=prioritized_fixes['low'],
            execution_phases=execution_plan,
            safety_protocols=self._get_safety_protocols(),
            validation_framework=self._get_validation_framework()
        )
    
    def _scan_existing_structure(self) -> None:
        """Scan existing frontend structure to avoid duplicating pages."""
        print("🔍 Scanning existing frontend structure...")
        
        # Scan for existing pages
        app_dir = self.frontend_path / "src" / "app"
        if app_dir.exists():
            for item in app_dir.rglob("page.tsx"):
                relative_path = item.relative_to(app_dir)
                route = "/" + "/".join(relative_path.parts[:-1]) if relative_path.parts[:-1] else "/"
                self.existing_routes.add(route)
                self.existing_pages.add(str(item))
                
        print(f"   ✅ Found {len(self.existing_pages)} existing pages")
        print(f"   ✅ Found {len(self.existing_routes)} existing routes")
        
        # Log existing routes for reference
        print("   📋 Existing routes:")
        for route in sorted(self.existing_routes):
            print(f"      - {route}")
    
    def _filter_issues_by_constraints(self, analysis_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Filter issues based on safety constraints."""
        print("🔒 Applying safety constraints...")
        
        all_issues = analysis_data.get('all_issues', [])
        filtered = []
        skipped = []
        
        for issue in all_issues:
            if self._should_skip_issue(issue):
                skipped.append(issue)
            else:
                filtered.append(issue)
        
        print(f"   ✅ {len(filtered)} issues can be safely fixed")
        print(f"   ⏭️  {len(skipped)} issues skipped due to constraints")
        
        return filtered
    
    def _should_skip_issue(self, issue: Dict[str, Any]) -> bool:
        """Check if issue should be skipped based on constraints."""
        issue_text = f"{issue.get('title', '')} {issue.get('description', '')} {issue.get('file_path', '')}".lower()
        
        # Skip refill-related issues
        refill_keywords = ['refill', 'prescription-refill', 'refills', 'medication-refill']
        if any(keyword in issue_text for keyword in refill_keywords):
            return True
            
        # Skip database-related changes
        database_keywords = ['database', 'migration', 'schema', 'db', 'sql', 'prisma']
        if any(keyword in issue_text for keyword in database_keywords):
            return True
            
        # Skip priority-related functionality (as requested)
        priority_keywords = ['priority', 'urgent', 'high-priority', 'low-priority']
        if any(keyword in issue_text for keyword in priority_keywords):
            return True
            
        return False
    
    def _prioritize_fixes_by_impact(self, issues: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Prioritize fixes by their impact on user experience."""
        print("📊 Prioritizing fixes by impact...")
        
        prioritized = {
            'critical': [],
            'high': [],
            'medium': [],
            'low': []
        }
        
        for issue in issues:
            impact_level = self._assess_impact_level(issue)
            prioritized[impact_level].append(issue)
        
        print(f"   🔴 Critical: {len(prioritized['critical'])} issues")
        print(f"   🟠 High:     {len(prioritized['high'])} issues")
        print(f"   🟡 Medium:   {len(prioritized['medium'])} issues")
        print(f"   🔵 Low:      {len(prioritized['low'])} issues")
        
        return prioritized
    
    def _assess_impact_level(self, issue: Dict[str, Any]) -> str:
        """Assess the impact level of an issue."""
        title = issue.get('title', '').lower()
        description = issue.get('description', '').lower()
        issue_type = issue.get('type', '').lower()
        severity = issue.get('severity', '').lower()
        
        # Critical: Breaks core functionality
        critical_indicators = [
            'critical', 'broken page', '404', 'crash', 'error 500',
            'login broken', 'cannot access', 'site down'
        ]
        if (severity == 'critical' or 
            any(indicator in title or indicator in description for indicator in critical_indicators)):
            return 'critical'
        
        # High: Major user experience issues
        high_indicators = [
            'navigation broken', 'missing page', 'broken link', 'cannot navigate',
            'form broken', 'button not working', 'api error', 'data not loading'
        ]
        if (issue_type in ['navigation_issue', 'missing_element'] or
            any(indicator in title or indicator in description for indicator in high_indicators)):
            return 'high'
        
        # Medium: Moderate improvements
        medium_indicators = [
            'loading state', 'error handling', 'user feedback', 'state management',
            'async issue', 'useeffect', 'dependency'
        ]
        if (issue_type in ['api_connection', 'broken_flow', 'state_issue'] or
            any(indicator in title or indicator in description for indicator in medium_indicators)):
            return 'medium'
        
        # Low: Nice to have fixes
        return 'low'
    
    def _create_execution_plan(self, prioritized_fixes: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
        """Create detailed execution plan for fixes."""
        print("📋 Creating execution plan...")
        
        return {
            "phase_1_critical_fixes": {
                "name": "Critical Issue Resolution",
                "duration": "Immediate (1-2 hours)",
                "description": "Fix issues that completely break functionality",
                "issues": prioritized_fixes['critical'],
                "fix_strategies": self._get_critical_fix_strategies(),
                "validation": "Full build and runtime testing after each fix"
            },
            
            "phase_2_missing_pages": {
                "name": "Missing Page Creation",
                "duration": "Priority (4-8 hours)", 
                "description": "Create missing pages after verifying they don't exist",
                "issues": [issue for issue in prioritized_fixes['high'] 
                          if 'missing' in issue.get('description', '').lower()],
                "fix_strategies": self._get_page_creation_strategies(),
                "validation": "Page accessibility and navigation testing"
            },
            
            "phase_3_navigation_fixes": {
                "name": "Navigation and Link Fixes",
                "duration": "High Priority (2-4 hours)",
                "description": "Fix broken navigation and links",
                "issues": [issue for issue in prioritized_fixes['high'] 
                          if 'navigation' in issue.get('description', '').lower() or
                             'link' in issue.get('description', '').lower()],
                "fix_strategies": self._get_navigation_fix_strategies(),
                "validation": "Navigation flow testing"
            },
            
            "phase_4_api_integration": {
                "name": "API Connection and Data Flow",
                "duration": "Medium Priority (1-2 days)",
                "description": "Fix API connections and data handling",
                "issues": [issue for issue in prioritized_fixes['medium'] 
                          if issue.get('type') == 'api_connection'],
                "fix_strategies": self._get_api_fix_strategies(),
                "validation": "API connectivity and data flow testing"
            },
            
            "phase_5_interaction_fixes": {
                "name": "User Interaction Improvements",
                "duration": "Lower Priority (1-2 days)",
                "description": "Fix buttons, forms, and interactions",
                "issues": [issue for issue in prioritized_fixes['medium'] + prioritized_fixes['low']
                          if 'button' in issue.get('description', '').lower() or
                             'form' in issue.get('description', '').lower()],
                "fix_strategies": self._get_interaction_fix_strategies(),
                "validation": "User interaction testing"
            }
        }
    
    def _get_critical_fix_strategies(self) -> List[str]:
        """Get strategies for fixing critical issues."""
        return [
            "Immediate error resolution with rollback capability",
            "Fix broken imports and dependencies",
            "Resolve TypeScript compilation errors", 
            "Fix runtime crashes and 500 errors",
            "Ensure core pages load without errors"
        ]
    
    def _get_page_creation_strategies(self) -> List[str]:
        """Get strategies for creating missing pages with safety checks."""
        return [
            "ALWAYS check if page exists before creating (CRITICAL RULE)",
            "Scan existing route structure first",
            "Use consistent page templates based on functionality",
            "Implement basic functionality with TODO comments for complex logic",
            "Follow Next.js 13+ app router conventions",
            "Include proper TypeScript typing",
            "Add basic error handling and loading states",
            "Ensure responsive design with Tailwind CSS"
        ]
    
    def _get_navigation_fix_strategies(self) -> List[str]:
        """Get strategies for fixing navigation issues."""
        return [
            "Update broken links to point to existing pages",
            "Add proper Next.js Link components",
            "Implement client-side navigation",
            "Fix route parameter handling",
            "Add proper authentication guards",
            "Ensure consistent navigation patterns"
        ]
    
    def _get_api_fix_strategies(self) -> List[str]:
        """Get strategies for API integration fixes."""
        return [
            "Use existing backend API endpoints only",
            "Add proper error handling for API calls",
            "Implement loading states during API requests",
            "Add retry logic for failed requests",
            "Replace mock data with real API calls",
            "Fix async/await patterns",
            "Add proper data validation"
        ]
    
    def _get_interaction_fix_strategies(self) -> List[str]:
        """Get strategies for fixing user interactions."""
        return [
            "Add missing onClick handlers to buttons",
            "Implement proper form submission logic",
            "Add form validation and error display",
            "Fix broken event listeners",
            "Add keyboard navigation support",
            "Implement proper state management for interactions"
        ]
    
    def _get_safety_constraints(self) -> List[str]:
        """Get list of safety constraints for automated fixing."""
        return [
            "NEVER create a page without checking if it already exists",
            "NO database schema changes or migrations",
            "NO new database tables, columns, or relationships",
            "NO user role or permission database modifications",
            "IGNORE all refill-related functionality completely",
            "SKIP any priority-related features or modifications",
            "Frontend-only modifications where possible",
            "Use existing API endpoints only",
            "Maintain existing data structures",
            "Always validate changes before proceeding",
            "Create backups before any file modification",
            "Enable rollback for any failed changes"
        ]
    
    def _get_safety_protocols(self) -> Dict[str, Any]:
        """Get safety protocols for automated fixing."""
        return {
            "pre_fix_checks": [
                "Verify page/file doesn't already exist",
                "Check if issue violates constraints",
                "Ensure fix won't break existing functionality",
                "Validate fix approach against safety rules"
            ],
            
            "during_fix_protocols": [
                "Create backup before any file modification",
                "Make atomic changes (one issue at a time)",
                "Validate syntax after each change",
                "Test basic functionality after each fix"
            ],
            
            "post_fix_validation": [
                "Run TypeScript compilation check",
                "Verify Next.js build succeeds", 
                "Test page loading and basic navigation",
                "Check for new console errors",
                "Confirm fix addresses original issue"
            ],
            
            "rollback_triggers": [
                "Build failure after fix",
                "New runtime errors introduced",
                "Existing functionality broken",
                "Validation tests fail"
            ]
        }
    
    def _get_validation_framework(self) -> Dict[str, Any]:
        """Get validation framework for ensuring fix quality."""
        return {
            "validation_levels": {
                "syntax": "TypeScript/ESLint validation",
                "build": "Next.js build success",
                "runtime": "Page loading without errors", 
                "navigation": "Route accessibility testing",
                "integration": "API connectivity verification"
            },
            
            "success_criteria": {
                "must_pass": [
                    "TypeScript compilation succeeds",
                    "ESLint rules pass",
                    "Next.js build completes",
                    "No new console errors",
                    "Original issue is resolved"
                ],
                "should_pass": [
                    "Page loads in reasonable time",
                    "Navigation works smoothly",
                    "API calls return expected data",
                    "Forms submit successfully"
                ]
            },
            
            "test_scenarios": [
                "Load each fixed page",
                "Navigate between pages",
                "Submit forms if applicable",
                "Test button interactions",
                "Verify API data loading"
            ]
        }


def generate_automated_fixing_report(root_path: Path, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate comprehensive automated fixing report.
    
    Args:
        root_path: Path to project root
        analysis_data: Frontend analysis results
    
    Returns:
        Complete automated fixing strategy and plan
    """
    orchestrator = AutomatedFixingOrchestrator(root_path)
    fixing_plan = orchestrator.create_fixing_strategy(analysis_data)
    
    total_fixable = (len(fixing_plan.critical_fixes) + 
                    len(fixing_plan.high_impact_fixes) + 
                    len(fixing_plan.medium_impact_fixes) + 
                    len(fixing_plan.low_impact_fixes))
    
    report = {
        "automated_fixing_strategy": {
            "approach": "Phase-based automated fixing with safety constraints",
            "total_issues_identified": analysis_data.get('analysis_metadata', {}).get('total_issues', 0),
            "total_fixable_issues": total_fixable,
            "skipped_issues": analysis_data.get('analysis_metadata', {}).get('total_issues', 0) - total_fixable,
            "estimated_time": "3-5 days for complete automated fixing"
        },
        
        "safety_constraints": fixing_plan.constraints,
        
        "execution_phases": fixing_plan.execution_phases,
        
        "fix_breakdown": {
            "critical_fixes": {
                "count": len(fixing_plan.critical_fixes),
                "description": "Issues that break core functionality",
                "fixes": fixing_plan.critical_fixes
            },
            "high_impact_fixes": {
                "count": len(fixing_plan.high_impact_fixes), 
                "description": "Major user experience issues",
                "fixes": fixing_plan.high_impact_fixes
            },
            "medium_impact_fixes": {
                "count": len(fixing_plan.medium_impact_fixes),
                "description": "Moderate improvements", 
                "fixes": fixing_plan.medium_impact_fixes
            },
            "low_impact_fixes": {
                "count": len(fixing_plan.low_impact_fixes),
                "description": "Nice to have improvements",
                "fixes": fixing_plan.low_impact_fixes
            }
        },
        
        "safety_protocols": fixing_plan.safety_protocols,
        
        "validation_framework": fixing_plan.validation_framework,
        
        "implementation_recommendations": [
            "Start with critical fixes to ensure system stability",
            "Always verify pages don't exist before creating them",
            "Focus on highest impact fixes first for maximum benefit",
            "Use phase-by-phase approach with validation between phases",
            "Enable rollback capability for safe automated fixing",
            "Monitor build status continuously during fixing process"
        ],
        
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "root_path": str(root_path),
            "strategy_version": "2.0.0",
            "safety_focused": True
        }
    }
    
    return report
