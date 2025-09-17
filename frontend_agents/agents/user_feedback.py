"""User Feedback Agent - Ensures proper user feedback mechanisms."""

import re
from pathlib import Path
from typing import List, Dict, Set, Any

from .base import BaseFrontendAgent
from ..models import (
    AgentResult,
    IssueSeverity,
    IssueType,
    RepositoryContext,
    SharedState
)


class UserFeedbackAgent(BaseFrontendAgent):
    """Ensures proper user feedback mechanisms."""
    
    def __init__(self):
        super().__init__(
            name="User Feedback Agent",
            description="Checks for actions without confirmation messages and missing user feedback"
        )
    
    def analyze(self, context: RepositoryContext, state: SharedState) -> AgentResult:
        result = AgentResult(agent_name=self.name)
        
        # Analyze all React files
        all_files = context.get_pages() + context.get_components()
        
        for file_path in all_files:
            try:
                content = context.read_text(file_path)
                relative_path = str(file_path.relative_to(context.root))
                
                # Check for actions without feedback
                self._check_action_feedback(content, relative_path, result)
                
                # Check for loading states
                self._check_loading_feedback(content, relative_path, result)
                
                # Check for error messaging
                self._check_error_feedback(content, relative_path, result)
                
                # Check for success confirmations
                self._check_success_feedback(content, relative_path, result)
                
                # Check for destructive actions without confirmation
                self._check_destructive_actions(content, relative_path, result)
                
            except Exception:
                continue
        
        # Store analysis for other agents
        result.artifacts['feedback_issues'] = [issue.to_dict() for issue in result.issues]
        
        return result
    
    def _check_action_feedback(self, content: str, file_path: str, result: AgentResult) -> None:
        """Check for user actions without proper feedback."""
        # Find click handlers and form submissions
        action_patterns = [
            (r'onClick\s*=\s*\{([^}]+)\}', 'click action'),
            (r'onSubmit\s*=\s*\{([^}]+)\}', 'form submission'),
            (r'onDelete\s*=\s*\{([^}]+)\}', 'delete action'),
            (r'onSave\s*=\s*\{([^}]+)\}', 'save action'),
        ]
        
        for pattern, action_type in action_patterns:
            matches = re.finditer(pattern, content)
            for match in matches:
                handler_content = match.group(1)
                line_num = content.count('\n', 0, match.start()) + 1
                
                # Check if handler has feedback mechanisms
                has_feedback = any(feedback_pattern in handler_content for feedback_pattern in [
                    'toast', 'alert', 'notify', 'message', 'success', 'error', 'confirm'
                ])
                
                # Check if it's an async action (likely needs loading state)
                is_async = any(async_pattern in handler_content for async_pattern in [
                    'await', 'async', '.then', 'Promise', 'fetch', 'axios'
                ])
                
                if is_async and not has_feedback:
                    result.add_issue(self.create_issue(
                        title=f"{action_type.title()} without user feedback",
                        description=f"Async {action_type} doesn't provide user feedback about success/failure",
                        severity=IssueSeverity.MEDIUM,
                        issue_type=IssueType.MISSING_ELEMENT,
                        file_path=file_path,
                        line=line_num,
                        tags=['feedback', 'ux', 'async'],
                        suggested_fix=f"Add success/error feedback for {action_type}",
                        code_snippet=self.extract_code_snippet(content, line_num)
                    ))
    
    def _check_loading_feedback(self, content: str, file_path: str, result: AgentResult) -> None:
        """Check for loading state feedback."""
        # Find async operations without loading states
        async_patterns = [
            'fetch(',
            'axios.',
            'await ',
            '.then(',
        ]
        
        has_async = any(pattern in content for pattern in async_patterns)
        loading_indicators = [
            'loading',
            'isLoading',
            'pending',
            'isPending',
            'spinner',
            'Loading...',
            'Please wait',
        ]
        
        has_loading_ui = any(indicator in content for indicator in loading_indicators)
        
        if has_async and not has_loading_ui:
            result.add_issue(self.create_issue(
                title="Async operations without loading indicators",
                description="File performs async operations but doesn't show loading states to users",
                severity=IssueSeverity.MEDIUM,
                issue_type=IssueType.MISSING_ELEMENT,
                file_path=file_path,
                tags=['loading', 'ux', 'feedback'],
                suggested_fix="Add loading indicators for async operations to improve user experience"
            ))
    
    def _check_error_feedback(self, content: str, file_path: str, result: AgentResult) -> None:
        """Check for error message display."""
        # Find error handling without user-facing messages
        has_error_handling = any(pattern in content for pattern in [
            '.catch(', 'try {', 'catch (', 'error'
        ])
        
        error_ui_patterns = [
            'error message',
            'Error:',
            'alert(',
            'toast',
            'notification',
            'setError',
            'showError',
            'errorMessage',
        ]
        
        has_error_ui = any(pattern in content.lower() for pattern in [p.lower() for p in error_ui_patterns])
        
        if has_error_handling and not has_error_ui:
            result.add_issue(self.create_issue(
                title="Error handling without user feedback",
                description="Code handles errors but doesn't display them to users",
                severity=IssueSeverity.MEDIUM,
                issue_type=IssueType.MISSING_ELEMENT,
                file_path=file_path,
                tags=['error', 'feedback', 'ux'],
                suggested_fix="Add error message display to inform users when something goes wrong"
            ))
    
    def _check_success_feedback(self, content: str, file_path: str, result: AgentResult) -> None:
        """Check for success confirmation feedback."""
        # Find form submissions or save actions without success feedback
        action_indicators = [
            'onSubmit',
            'handleSubmit',
            'save',
            'create',
            'update',
            'delete',
        ]
        
        has_actions = any(action in content for action in action_indicators)
        
        success_feedback_patterns = [
            'success',
            'saved',
            'created',
            'updated',
            'deleted',
            'completed',
            'toast',
            'notification',
            'alert',
        ]
        
        has_success_feedback = any(pattern in content.lower() for pattern in success_feedback_patterns)
        
        if has_actions and not has_success_feedback:
            result.add_issue(self.create_issue(
                title="Actions without success confirmation",
                description="File has user actions but no success confirmation feedback",
                severity=IssueSeverity.LOW,
                issue_type=IssueType.MISSING_ELEMENT,
                file_path=file_path,
                tags=['success', 'feedback', 'ux'],
                suggested_fix="Add success messages to confirm when actions complete successfully"
            ))
    
    def _check_destructive_actions(self, content: str, file_path: str, result: AgentResult) -> None:
        """Check for destructive actions without confirmation."""
        destructive_patterns = [
            (r'delete|remove|destroy', 'destructive action'),
            (r'clear|reset|wipe', 'data clearing action'),
        ]
        
        for pattern, action_type in destructive_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                # Check for confirmation patterns
                confirmation_patterns = [
                    'confirm',
                    'Are you sure',
                    'modal',
                    'dialog',
                    'prompt',
                ]
                
                has_confirmation = any(conf_pattern in content.lower() for conf_pattern in 
                                     [p.lower() for p in confirmation_patterns])
                
                if not has_confirmation:
                    line_num = self.find_line_number(content, pattern)
                    
                    result.add_issue(self.create_issue(
                        title=f"{action_type.title()} without confirmation",
                        description=f"Found {action_type} but no confirmation dialog or prompt",
                        severity=IssueSeverity.MEDIUM,
                        issue_type=IssueType.MISSING_ELEMENT,
                        file_path=file_path,
                        line=line_num,
                        tags=['confirmation', 'destructive', 'ux'],
                        suggested_fix=f"Add confirmation dialog for {action_type} to prevent accidental data loss",
                        code_snippet=self.extract_code_snippet(content, line_num) if line_num else ""
                    ))
                    break  # Only report once per file
