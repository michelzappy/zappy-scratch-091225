"""Base class for frontend troubleshooting agents."""

from __future__ import annotations
import re
from abc import ABC, abstractmethod
from pathlib import Path
from typing import List, Optional

from ..models import (
    AgentResult, 
    FrontendIssue, 
    IssueSeverity, 
    IssueType,
    RepositoryContext, 
    SharedState
)


class BaseFrontendAgent(ABC):
    """Base class for all frontend troubleshooting agents."""
    
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        
    @abstractmethod
    def analyze(self, context: RepositoryContext, state: SharedState) -> AgentResult:
        """Analyze the frontend code and return results."""
        pass
        
    def create_issue(self, 
                    title: str,
                    description: str,
                    severity: IssueSeverity,
                    issue_type: IssueType,
                    file_path: str,
                    line: Optional[int] = None,
                    tags: Optional[List[str]] = None,
                    suggested_fix: str = "",
                    dependencies: Optional[List[str]] = None,
                    code_snippet: str = "") -> FrontendIssue:
        """Helper to create a FrontendIssue."""
        return FrontendIssue(
            title=title,
            description=description,
            severity=severity,
            type=issue_type,
            file_path=file_path,
            line=line,
            agent=self.name,
            tags=tags or [],
            suggested_fix=suggested_fix,
            dependencies=dependencies or [],
            code_snippet=code_snippet
        )
        
    def find_line_number(self, content: str, search_text: str) -> Optional[int]:
        """Find the line number for a given text in content."""
        lines = content.split('\n')
        for i, line in enumerate(lines, 1):
            if search_text in line:
                return i
        return None
        
    def extract_code_snippet(self, content: str, line_num: int, context_lines: int = 2) -> str:
        """Extract a code snippet around the specified line."""
        lines = content.split('\n')
        start = max(0, line_num - context_lines - 1)
        end = min(len(lines), line_num + context_lines)
        
        snippet_lines = []
        for i in range(start, end):
            prefix = f"{i+1:3d}: "
            if i == line_num - 1:
                prefix = f">>> {i+1}: "
            snippet_lines.append(f"{prefix}{lines[i]}")
            
        return '\n'.join(snippet_lines)
        
    def find_react_components(self, content: str) -> List[str]:
        """Find React components in the content."""
        # Find function components
        func_pattern = r'(?:export\s+)?(?:const|function)\s+([A-Z][a-zA-Z0-9]*)\s*(?:\(|\s*=)'
        func_matches = re.findall(func_pattern, content)
        
        # Find class components
        class_pattern = r'class\s+([A-Z][a-zA-Z0-9]*)\s+extends'
        class_matches = re.findall(class_pattern, content)
        
        return func_matches + class_matches
        
    def find_jsx_elements(self, content: str) -> List[str]:
        """Find JSX elements in the content."""
        # Simple pattern to find JSX tags
        pattern = r'<([A-Za-z][A-Za-z0-9]*)'
        matches = re.findall(pattern, content)
        return list(set(matches))  # Remove duplicates
        
    def find_api_calls(self, content: str) -> List[str]:
        """Find API calls in the content."""
        patterns = [
            r'fetch\([\'"]([^\'"]+)',  # fetch calls
            r'axios\.[get|post|put|delete]+\([\'"]([^\'"]+)',  # axios calls
            r'api\.[a-zA-Z]+\([\'"]([^\'"]+)',  # api object calls
        ]
        
        calls = []
        for pattern in patterns:
            matches = re.findall(pattern, content)
            calls.extend(matches)
            
        return calls
        
    def find_navigation_links(self, content: str) -> List[str]:
        """Find navigation links and hrefs."""
        patterns = [
            r'href=[\'"]([^\'"]+)',  # href attributes
            r'router\.push\([\'"]([^\'"]+)',  # Next.js router
            r'navigate\([\'"]([^\'"]+)',  # React router navigate
        ]
        
        links = []
        for pattern in patterns:
            matches = re.findall(pattern, content)
            links.extend(matches)
            
        return links
        
    def find_form_elements(self, content: str) -> dict:
        """Find form elements and their properties."""
        forms = {
            'forms': len(re.findall(r'<form', content, re.IGNORECASE)),
            'inputs': len(re.findall(r'<input', content, re.IGNORECASE)),
            'buttons': len(re.findall(r'<button', content, re.IGNORECASE)),
            'submits': len(re.findall(r'type=[\'"]submit[\'"]', content, re.IGNORECASE)),
            'onsubmit_handlers': len(re.findall(r'onSubmit=', content)),
        }
        return forms
        
    def find_loading_states(self, content: str) -> List[str]:
        """Find loading state patterns."""
        patterns = [
            r'loading',
            r'isLoading',
            r'pending',
            r'isPending',
            r'fetching',
            r'isFetching'
        ]
        
        states = []
        for pattern in patterns:
            if re.search(pattern, content, re.IGNORECASE):
                states.append(pattern)
                
        return states
        
    def find_error_handling(self, content: str) -> List[str]:
        """Find error handling patterns."""
        patterns = [
            r'catch\s*\(',
            r'\.catch\(',
            r'error',
            r'Error',
            r'try\s*{',
            r'throw\s+',
        ]
        
        error_patterns = []
        for pattern in patterns:
            matches = re.findall(pattern, content)
            if matches:
                error_patterns.append(pattern)
                
        return error_patterns
