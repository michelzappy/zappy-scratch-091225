"""UX Flow Agent for validating user journeys and interaction patterns."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Dict, List, Set, Tuple

from ..base_agent import BaseUXAgent
from ..models import ActionType, IssueCategory, Severity
from ..repository import RepositoryContext


class UXFlowAgent(BaseUXAgent):
    """Agent that validates user journeys, task completion flows, and interaction patterns."""
    
    def __init__(self):
        super().__init__(
            name="UX Flow Agent",
            description="Validates complete user journeys and interaction patterns for optimal task completion"
        )
        
        # Key user flows to validate
        self.critical_flows = {
            'login_to_dashboard': ['/patient/login', '/patient/dashboard'],
            'new_consultation': ['/patient/dashboard', '/patient/new-consultation'],
            'view_orders': ['/patient/dashboard', '/patient/orders'],
            'check_messages': ['/patient/dashboard', '/patient/messages'],
            'profile_management': ['/patient/dashboard', '/patient/profile']
        }
        
        # UI patterns that indicate good UX
        self.positive_patterns = [
            r'loading|spinner|skeleton',  # Loading states
            r'error|alert|notification',  # Error handling
            r'success|complete|confirmation',  # Success feedback
            r'disabled|aria-disabled',  # Disabled states
            r'hover:|focus:|active:',  # Interactive states
        ]
        
        # UI patterns that indicate UX issues
        self.problematic_patterns = [
            r'TODO|FIXME|HACK',  # Incomplete implementations
            r'console\.log|console\.error',  # Debug code left in
            r'onClick=\{\}|href="#"',  # Non-functional links/buttons
            r'placeholder.*text|lorem ipsum',  # Placeholder text
        ]
    
    def analyze_file_content(
        self, 
        context: RepositoryContext, 
        file_path: Path, 
        content: str
    ) -> None:
        """Analyze file content for UX flow issues."""
        file_str = str(file_path)
        
        # Analyze different types of files
        if file_path.suffix == '.tsx':
            self._analyze_component_ux(file_path, content)
        elif 'page.tsx' in file_str:
            self._analyze_page_ux(file_path, content)
        
        # Common analysis for all files
        self._check_for_problematic_patterns(file_path, content)
        self._check_for_missing_ux_patterns(file_path, content)
    
    def _analyze_component_ux(self, file_path: Path, content: str) -> None:
        """Analyze component-specific UX patterns."""
        # Check for missing loading states
        if 'useState' in content and 'loading' not in content.lower():
            if any(keyword in content for keyword in ['fetch', 'axios', 'api', 'async']):
                self.create_finding(
                    title="Missing loading state in interactive component",
                    description="Component appears to make async calls but lacks loading state feedback for users",
                    severity=Severity.MEDIUM,
                    category=IssueCategory.USABILITY,
                    file_path=str(file_path),
                    recommendations=[
                        "Add loading state with spinner or skeleton",
                        "Show loading feedback during async operations",
                        "Consider loading states for better UX"
                    ],
                    tags=['loading-state', 'async-ux']
                )
        
        # Check for missing error handling
        if any(keyword in content for keyword in ['fetch', 'axios', 'api', 'async']):
            if 'error' not in content.lower() and 'catch' not in content:
                self.create_finding(
                    title="Missing error handling in interactive component",
                    description="Component makes API calls but lacks error handling and user feedback",
                    severity=Severity.HIGH,
                    category=IssueCategory.USABILITY,
                    file_path=str(file_path),
                    recommendations=[
                        "Add try-catch blocks for async operations",
                        "Show user-friendly error messages",
                        "Implement retry mechanisms where appropriate"
                    ],
                    tags=['error-handling', 'async-ux']
                )
        
        # Check for form validation
        if '<form' in content or 'onSubmit' in content:
            if 'validation' not in content.lower() and 'required' not in content:
                self.create_finding(
                    title="Form lacks proper validation feedback",
                    description="Form component should provide clear validation feedback to users",
                    severity=Severity.MEDIUM,
                    category=IssueCategory.USABILITY,
                    file_path=str(file_path),
                    recommendations=[
                        "Add client-side validation",
                        "Show validation errors inline",
                        "Provide clear success/error feedback"
                    ],
                    tags=['form-validation', 'user-feedback']
                )
    
    def _analyze_page_ux(self, file_path: Path, content: str) -> None:
        """Analyze page-specific UX patterns."""
        # Check for navigation breadcrumbs on deeper pages
        if '/patient/' in str(file_path) and str(file_path) != 'patient/dashboard/page.tsx':
            if 'breadcrumb' not in content.lower() and 'back' not in content.lower():
                self.create_finding(
                    title="Page lacks navigation context",
                    description="Users may get lost without clear navigation context or back button",
                    severity=Severity.LOW,
                    category=IssueCategory.USABILITY,
                    file_path=str(file_path),
                    recommendations=[
                        "Add breadcrumb navigation",
                        "Include back button or clear navigation path",
                        "Consider page hierarchy indicators"
                    ],
                    tags=['navigation', 'user-orientation']
                )
        
        # Check for empty states
        if any(keyword in content for keyword in ['map(', 'length === 0', 'filter(']):
            if 'empty' not in content.lower() and 'no ' not in content.lower():
                self.create_finding(
                    title="Missing empty state handling",
                    description="Lists or data displays should handle empty states gracefully",
                    severity=Severity.MEDIUM,
                    category=IssueCategory.USABILITY,
                    file_path=str(file_path),
                    recommendations=[
                        "Add empty state messaging",
                        "Provide helpful actions in empty states",
                        "Guide users on next steps"
                    ],
                    tags=['empty-states', 'user-guidance']
                )
    
    def _check_for_problematic_patterns(self, file_path: Path, content: str) -> None:
        """Check for patterns that indicate UX problems."""
        lines = content.split('\n')
        
        for i, line in enumerate(lines, 1):
            for pattern in self.problematic_patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    severity = Severity.HIGH if 'TODO' in pattern or 'FIXME' in pattern else Severity.MEDIUM
                    
                    self.create_finding(
                        title=f"Problematic UX pattern detected",
                        description=f"Line contains pattern that may indicate incomplete UX implementation: {pattern}",
                        severity=severity,
                        category=IssueCategory.USABILITY,
                        file_path=str(file_path),
                        line_number=i,
                        code_snippet=line.strip(),
                        recommendations=[
                            "Complete the implementation",
                            "Remove debug/placeholder code",
                            "Ensure functional user interactions"
                        ],
                        tags=['incomplete-implementation', 'ux-debt']
                    )
    
    def _check_for_missing_ux_patterns(self, file_path: Path, content: str) -> None:
        """Check for missing UX patterns that should be present."""
        # Check for interactive elements without proper states
        interactive_elements = re.findall(r'<(button|input|select|textarea)', content, re.IGNORECASE)
        
        if interactive_elements:
            # Should have hover/focus states
            if not re.search(r'hover:|focus:', content):
                self.create_finding(
                    title="Interactive elements lack visual feedback states",
                    description="Buttons and form elements should have clear hover and focus states",
                    severity=Severity.MEDIUM,
                    category=IssueCategory.USABILITY,
                    file_path=str(file_path),
                    recommendations=[
                        "Add hover and focus styles",
                        "Ensure keyboard accessibility",
                        "Provide visual feedback for interactions"
                    ],
                    tags=['interactive-states', 'visual-feedback']
                )
            
            # Should have disabled states where appropriate
            if 'disabled' in content and not re.search(r'disabled:|aria-disabled', content):
                self.create_finding(
                    title="Disabled states need better visual indication",
                    description="Disabled elements should be clearly visually distinguished",
                    severity=Severity.LOW,
                    category=IssueCategory.USABILITY,
                    file_path=str(file_path),
                    recommendations=[
                        "Add disabled styling",
                        "Ensure disabled elements are obvious",
                        "Consider accessibility for disabled states"
                    ],
                    tags=['disabled-states', 'visual-clarity']
                )
    
    def is_action_relevant_to_expertise(self, action) -> bool:
        """Check if action is relevant to UX flow expertise."""
        ux_keywords = [
            'flow', 'navigation', 'interaction', 'usability', 'user experience',
            'button', 'form', 'loading', 'error', 'feedback', 'state'
        ]
        
        description_lower = action.description.lower()
        return any(keyword in description_lower for keyword in ux_keywords)
    
    def propose_ux_improvements(self, context: RepositoryContext) -> None:
        """Propose specific UX improvements based on findings."""
        # Group findings by type to propose comprehensive solutions
        loading_findings = [f for f in self.findings if 'loading-state' in f.tags]
        error_findings = [f for f in self.findings if 'error-handling' in f.tags]
        
        if loading_findings:
            self.create_action(
                action_type=ActionType.UI_IMPROVEMENT,
                title="Implement consistent loading states",
                description="Add loading spinners and skeleton screens for better async UX feedback",
                file_path="frontend/src/components/",
                finding_ids=[f.id for f in loading_findings],
                estimated_impact="Improves perceived performance and user confidence"
            )
        
        if error_findings:
            self.create_action(
                action_type=ActionType.UI_IMPROVEMENT,
                title="Enhance error handling and user feedback",
                description="Add comprehensive error states with recovery options",
                file_path="frontend/src/components/",
                finding_ids=[f.id for f in error_findings],
                estimated_impact="Reduces user frustration and provides clear recovery paths"
            )