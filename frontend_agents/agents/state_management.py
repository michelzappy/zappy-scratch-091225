"""State Management Agent - Reviews frontend state and data flow."""

import re
from pathlib import Path
from typing import List, Dict, Set, Any
from collections import defaultdict

from .base import BaseFrontendAgent
from ..models import (
    AgentResult,
    IssueSeverity,
    IssueType,
    RepositoryContext,
    SharedState
)


class StateManagementAgent(BaseFrontendAgent):
    """Reviews frontend state and data flow."""
    
    def __init__(self):
        super().__init__(
            name="State Management Agent",
            description="Identifies state management issues and missing dependencies"
        )
    
    def analyze(self, context: RepositoryContext, state: SharedState) -> AgentResult:
        result = AgentResult(agent_name=self.name)
        
        # Analyze all React files
        all_files = context.get_pages() + context.get_components()
        
        for file_path in all_files:
            try:
                content = context.read_text(file_path)
                relative_path = str(file_path.relative_to(context.root))
                
                # Check useState usage
                self._check_usestate_issues(content, relative_path, result)
                
                # Check useEffect dependencies
                self._check_useeffect_dependencies(content, relative_path, result)
                
                # Check for unused state variables
                self._check_unused_state(content, relative_path, result)
                
                # Check form state handling
                self._check_form_state_handling(content, relative_path, result)
                
                # Check prop drilling
                self._check_prop_drilling(content, relative_path, result)
                
            except Exception:
                continue
        
        # Store analysis for other agents
        result.artifacts['state_issues'] = [issue.to_dict() for issue in result.issues]
        
        return result
    
    def _check_usestate_issues(self, content: str, file_path: str, result: AgentResult) -> None:
        """Check for useState usage issues."""
        # Find all useState declarations
        usestate_pattern = r'const\s*\[([^,]+),\s*([^]]+)\]\s*=\s*useState\s*\(([^)]*)\)'
        matches = re.findall(usestate_pattern, content)
        
        for state_var, setter_var, initial_value in matches:
            state_var = state_var.strip()
            setter_var = setter_var.strip()
            
            # Check if setter is used
            if setter_var not in content:
                line_num = self.find_line_number(content, f"useState")
                
                result.add_issue(self.create_issue(
                    title=f"Unused state setter: {setter_var}",
                    description=f"State variable '{state_var}' has setter '{setter_var}' but setter is never used",
                    severity=IssueSeverity.LOW,
                    issue_type=IssueType.STATE_ISSUE,
                    file_path=file_path,
                    line=line_num,
                    tags=['useState', 'unused', 'cleanup'],
                    suggested_fix=f"Either use {setter_var} to update state or remove unused state",
                    code_snippet=self.extract_code_snippet(content, line_num) if line_num else ""
                ))
            
            # Check for missing initial state
            if not initial_value.strip():
                line_num = self.find_line_number(content, f"const [{state_var}")
                
                result.add_issue(self.create_issue(
                    title=f"useState without initial value: {state_var}",
                    description=f"State variable '{state_var}' initialized without a value, which may cause unexpected behavior",
                    severity=IssueSeverity.LOW,
                    issue_type=IssueType.STATE_ISSUE,
                    file_path=file_path,
                    line=line_num,
                    tags=['useState', 'initialization'],
                    suggested_fix=f"Provide an appropriate initial value for {state_var}",
                    code_snippet=self.extract_code_snippet(content, line_num) if line_num else ""
                ))
    
    def _check_useeffect_dependencies(self, content: str, file_path: str, result: AgentResult) -> None:
        """Check for useEffect dependency issues."""
        # Find useEffect calls
        useeffect_pattern = r'useEffect\s*\(\s*\(\)\s*=>\s*\{([^}]*)\}(?:[^,]*,\s*\[([^\]]*)\])?'
        matches = re.finditer(useeffect_pattern, content, re.DOTALL)
        
        for match in matches:
            effect_body = match.group(1)
            dependencies = match.group(2) if match.group(2) else None
            
            # Find variables used in effect
            used_vars = re.findall(r'\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b', effect_body)
            
            # Filter to likely state/prop variables (exclude common words)
            likely_dependencies = []
            common_words = {'if', 'else', 'for', 'while', 'return', 'const', 'let', 'var', 'function', 'true', 'false', 'null', 'undefined'}
            
            for var in used_vars:
                if var not in common_words and len(var) > 1:
                    # Check if it might be a state variable or prop
                    if re.search(rf'\b{var}\b.*=.*useState|props\.{var}|\b{var}\b.*\bstate\b', content):
                        likely_dependencies.append(var)
            
            if likely_dependencies and (dependencies is None or dependencies.strip() == ''):
                line_num = content.count('\n', 0, match.start()) + 1
                
                result.add_issue(self.create_issue(
                    title="useEffect missing dependencies",
                    description=f"useEffect uses variables {', '.join(set(likely_dependencies))} but has no dependency array",
                    severity=IssueSeverity.MEDIUM,
                    issue_type=IssueType.STATE_ISSUE,
                    file_path=file_path,
                    line=line_num,
                    tags=['useEffect', 'dependencies', 'hooks'],
                    suggested_fix=f"Add dependency array: [{', '.join(set(likely_dependencies))}]",
                    code_snippet=self.extract_code_snippet(content, line_num)
                ))
    
    def _check_unused_state(self, content: str, file_path: str, result: AgentResult) -> None:
        """Check for unused state variables."""
        # Find all state variables
        usestate_pattern = r'const\s*\[([^,]+),\s*([^]]+)\]\s*=\s*useState'
        matches = re.findall(usestate_pattern, content)
        
        for state_var, setter_var in matches:
            state_var = state_var.strip()
            
            # Count occurrences of state variable (excluding the declaration)
            var_pattern = rf'\b{re.escape(state_var)}\b'
            occurrences = len(re.findall(var_pattern, content))
            
            # If it only appears once (the declaration), it's unused
            if occurrences <= 1:
                line_num = self.find_line_number(content, f"const [{state_var}")
                
                result.add_issue(self.create_issue(
                    title=f"Unused state variable: {state_var}",
                    description=f"State variable '{state_var}' is declared but never used",
                    severity=IssueSeverity.LOW,
                    issue_type=IssueType.STATE_ISSUE,
                    file_path=file_path,
                    line=line_num,
                    tags=['useState', 'unused', 'cleanup'],
                    suggested_fix=f"Remove unused state variable {state_var} or use it in the component",
                    code_snippet=self.extract_code_snippet(content, line_num) if line_num else ""
                ))
    
    def _check_form_state_handling(self, content: str, file_path: str, result: AgentResult) -> None:
        """Check form state handling patterns."""
        has_form = bool(re.search(r'<form', content, re.IGNORECASE))
        has_input = bool(re.search(r'<input', content, re.IGNORECASE))
        
        if has_form or has_input:
            # Check for form state management
            has_form_state = any(pattern in content for pattern in [
                'useState', 'formData', 'formState', 'values', 'errors'
            ])
            
            # Check for controlled inputs
            has_value_prop = bool(re.search(r'value\s*=\s*\{', content))
            has_onchange = bool(re.search(r'onChange\s*=\s*\{', content))
            
            if (has_form or has_input) and not has_form_state:
                result.add_issue(self.create_issue(
                    title="Form without state management",
                    description="Form or input elements present but no apparent state management",
                    severity=IssueSeverity.MEDIUM,
                    issue_type=IssueType.STATE_ISSUE,
                    file_path=file_path,
                    tags=['form', 'state', 'controlled-input'],
                    suggested_fix="Add state management for form inputs using useState or form library"
                ))
            
            if has_input and has_value_prop and not has_onchange:
                line_num = self.find_line_number(content, 'value=')
                
                result.add_issue(self.create_issue(
                    title="Controlled input missing onChange handler",
                    description="Input has value prop but no onChange handler, making it read-only",
                    severity=IssueSeverity.HIGH,
                    issue_type=IssueType.STATE_ISSUE,
                    file_path=file_path,
                    line=line_num,
                    tags=['input', 'controlled', 'onChange'],
                    suggested_fix="Add onChange handler to make input controllable",
                    code_snippet=self.extract_code_snippet(content, line_num) if line_num else ""
                ))
    
    def _check_prop_drilling(self, content: str, file_path: str, result: AgentResult) -> None:
        """Check for potential prop drilling issues."""
        # Find prop definitions in components
        prop_pattern = r'(?:function|const)\s+\w+\s*\(\s*\{\s*([^}]+)\s*\}'
        matches = re.findall(prop_pattern, content)
        
        for props_string in matches:
            props = [prop.strip() for prop in props_string.split(',')]
            
            # If many props (potential prop drilling)
            if len(props) > 5:
                line_num = self.find_line_number(content, props_string)
                
                result.add_issue(self.create_issue(
                    title="Potential prop drilling",
                    description=f"Component receives many props ({len(props)}), which might indicate prop drilling",
                    severity=IssueSeverity.LOW,
                    issue_type=IssueType.STATE_ISSUE,
                    file_path=file_path,
                    line=line_num,
                    tags=['props', 'prop-drilling', 'refactor'],
                    suggested_fix="Consider using Context API or state management library to reduce prop drilling",
                    code_snippet=self.extract_code_snippet(content, line_num) if line_num else ""
                ))
                break  # Only report once per file
