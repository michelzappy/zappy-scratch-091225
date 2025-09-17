"""UI Completeness Agent - Identifies missing UI elements."""

import re
from pathlib import Path
from typing import List, Dict, Any

from .base import BaseFrontendAgent
from ..models import (
    AgentResult,
    IssueSeverity,
    IssueType,
    RepositoryContext,
    SharedState
)


class UICompletenessAgent(BaseFrontendAgent):
    """Scans all pages for missing UI elements."""
    
    def __init__(self):
        super().__init__(
            name="UI Completeness Agent",
            description="Identifies forms without submit buttons, missing navigation, and incomplete UI flows"
        )
    
    def analyze(self, context: RepositoryContext, state: SharedState) -> AgentResult:
        result = AgentResult(agent_name=self.name)
        
        # Get all page files
        pages = context.get_pages()
        
        for page_file in pages:
            try:
                content = context.read_text(page_file)
                relative_path = str(page_file.relative_to(context.root))
                
                # Check for form completeness issues
                self._check_form_completeness(content, relative_path, result)
                
                # Check for navigation issues
                self._check_navigation_completeness(content, relative_path, result)
                
                # Check for loading states
                self._check_loading_states(content, relative_path, result)
                
                # Check for error handling UI
                self._check_error_ui(content, relative_path, result)
                
                # Check for actionable elements
                self._check_actionable_elements(content, relative_path, result)
                
            except Exception as e:
                result.add_issue(self.create_issue(
                    title=f"Unable to analyze file: {page_file.name}",
                    description=f"Error reading file: {str(e)}",
                    severity=IssueSeverity.LOW,
                    issue_type=IssueType.MISSING_ELEMENT,
                    file_path=str(page_file.relative_to(context.root))
                ))
        
        # Store findings for other agents
        result.artifacts['ui_issues'] = [issue.to_dict() for issue in result.issues]
        result.artifacts['total_pages_analyzed'] = len(pages)
        
        return result
    
    def _check_form_completeness(self, content: str, file_path: str, result: AgentResult) -> None:
        """Check if forms have proper submit mechanisms."""
        form_data = self.find_form_elements(content)
        
        # Forms without submit buttons
        if form_data['forms'] > 0 and form_data['submits'] == 0 and form_data['onsubmit_handlers'] == 0:
            line_num = self.find_line_number(content, '<form')
            
            result.add_issue(self.create_issue(
                title="Form missing submit mechanism",
                description="Form found without submit button or onSubmit handler. Users cannot complete the form.",
                severity=IssueSeverity.CRITICAL,
                issue_type=IssueType.MISSING_ELEMENT,
                file_path=file_path,
                line=line_num,
                tags=['form', 'submit', 'critical'],
                suggested_fix="Add a submit button: <button type='submit'>Submit</button> or add onSubmit handler to form",
                code_snippet=self.extract_code_snippet(content, line_num) if line_num else ""
            ))
        
        # Inputs without labels
        if form_data['inputs'] > 0:
            labels_count = len(re.findall(r'<label', content, re.IGNORECASE))
            if labels_count < form_data['inputs']:
                result.add_issue(self.create_issue(
                    title="Form inputs missing labels",
                    description="Some form inputs may be missing proper labels for accessibility.",
                    severity=IssueSeverity.MEDIUM,
                    issue_type=IssueType.ACCESSIBILITY,
                    file_path=file_path,
                    tags=['accessibility', 'labels'],
                    suggested_fix="Add proper labels for all input elements for accessibility"
                ))
    
    def _check_navigation_completeness(self, content: str, file_path: str, result: AgentResult) -> None:
        """Check for navigation issues."""
        # Look for broken or empty navigation links
        href_patterns = re.findall(r'href=[\'"]([^\'"]*)[\'"]', content)
        
        for href in href_patterns:
            if href in ['#', '', 'javascript:void(0)', 'javascript:;']:
                line_num = self.find_line_number(content, f'href="{href}"')
                
                result.add_issue(self.create_issue(
                    title="Empty or placeholder navigation link",
                    description=f"Navigation link with href='{href}' goes nowhere",
                    severity=IssueSeverity.MEDIUM,
                    issue_type=IssueType.BROKEN_FLOW,
                    file_path=file_path,
                    line=line_num,
                    tags=['navigation', 'broken-link'],
                    suggested_fix="Replace placeholder href with actual navigation target",
                    code_snippet=self.extract_code_snippet(content, line_num) if line_num else ""
                ))
        
        # Check for back/cancel buttons on forms
        if 'form' in content.lower() and 'cancel' not in content.lower() and 'back' not in content.lower():
            result.add_issue(self.create_issue(
                title="Form missing cancel/back option",
                description="Form page doesn't provide a way for users to go back or cancel",
                severity=IssueSeverity.LOW,
                issue_type=IssueType.MISSING_ELEMENT,
                file_path=file_path,
                tags=['navigation', 'ux'],
                suggested_fix="Add a cancel/back button or link to allow users to exit the form"
            ))
    
    def _check_loading_states(self, content: str, file_path: str, result: AgentResult) -> None:
        """Check for proper loading state handling."""
        loading_states = self.find_loading_states(content)
        
        # Check if there are async operations without loading states
        has_async = any(pattern in content for pattern in ['async', 'await', 'fetch', 'axios', '.then('])
        
        if has_async and not loading_states:
            result.add_issue(self.create_issue(
                title="Async operations without loading states",
                description="Page performs async operations but doesn't show loading states to users",
                severity=IssueSeverity.MEDIUM,
                issue_type=IssueType.MISSING_ELEMENT,
                file_path=file_path,
                tags=['loading', 'ux'],
                suggested_fix="Add loading indicators for async operations to improve user experience"
            ))
    
    def _check_error_ui(self, content: str, file_path: str, result: AgentResult) -> None:
        """Check for error handling UI elements."""
        error_patterns = self.find_error_handling(content)
        
        # Check if there's error handling but no error UI
        if error_patterns:
            has_error_ui = any(pattern in content.lower() for pattern in [
                'error message', 'error text', 'alert', 'toast', 'notification'
            ])
            
            if not has_error_ui:
                result.add_issue(self.create_issue(
                    title="Error handling without user feedback",
                    description="Code handles errors but doesn't show them to users",
                    severity=IssueSeverity.MEDIUM,
                    issue_type=IssueType.MISSING_ELEMENT,
                    file_path=file_path,
                    tags=['error-handling', 'ux'],
                    suggested_fix="Add error message display to inform users when something goes wrong"
                ))
    
    def _check_actionable_elements(self, content: str, file_path: str, result: AgentResult) -> None:
        """Check for actionable elements that might not work."""
        # Find clickable elements without handlers
        clickable_patterns = [
            (r'<button(?![^>]*onClick)(?![^>]*type=[\'"]submit[\'"])', 'button'),
            (r'<div(?![^>]*onClick)(?=[^>]*cursor.*pointer|[^>]*clickable)', 'clickable div'),
        ]
        
        for pattern, element_type in clickable_patterns:
            matches = list(re.finditer(pattern, content, re.IGNORECASE))
            for match in matches:
                line_num = content.count('\n', 0, match.start()) + 1
                
                result.add_issue(self.create_issue(
                    title=f"Potentially non-functional {element_type}",
                    description=f"{element_type.title()} appears clickable but has no click handler",
                    severity=IssueSeverity.MEDIUM,
                    issue_type=IssueType.BROKEN_FLOW,
                    file_path=file_path,
                    line=line_num,
                    tags=['click-handler', 'functionality'],
                    suggested_fix=f"Add onClick handler to {element_type}",
                    code_snippet=self.extract_code_snippet(content, line_num)
                ))
