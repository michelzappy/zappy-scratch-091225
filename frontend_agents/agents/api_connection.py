"""API Connection Agent - Verifies frontend-to-backend connections."""

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


class APIConnectionAgent(BaseFrontendAgent):
    """Verifies frontend-to-backend connections without modifying backend."""
    
    def __init__(self):
        super().__init__(
            name="API Connection Agent",
            description="Checks if API calls match available endpoints and identifies mock data"
        )
    
    def analyze(self, context: RepositoryContext, state: SharedState) -> AgentResult:
        result = AgentResult(agent_name=self.name)
        
        # First, scan backend routes to understand available endpoints
        backend_endpoints = self._scan_backend_endpoints(context)
        
        # Analyze frontend API usage
        pages = context.get_pages()
        components = context.get_components()
        all_files = pages + components
        
        # Also check lib files for API definitions
        lib_files = context.iter_frontend_files("*.ts")
        all_files.extend([f for f in lib_files if 'lib' in str(f)])
        
        for file_path in all_files:
            try:
                content = context.read_text(file_path)
                relative_path = str(file_path.relative_to(context.root))
                
                # Check API calls against available endpoints
                self._check_api_calls(content, relative_path, backend_endpoints, result)
                
                # Check for hardcoded/mock data
                self._check_mock_data(content, relative_path, result)
                
                # Check for proper error handling in API calls
                self._check_api_error_handling(content, relative_path, result)
                
                # Check for loading states with API calls
                self._check_api_loading_states(content, relative_path, result)
                
            except Exception as e:
                continue
        
        # Store API analysis for other agents
        result.artifacts['backend_endpoints'] = backend_endpoints
        result.artifacts['api_issues'] = [issue.to_dict() for issue in result.issues]
        
        # Share API endpoints with other agents
        state.api_endpoints = backend_endpoints
        
        return result
    
    def _scan_backend_endpoints(self, context: RepositoryContext) -> List[str]:
        """Scan backend routes to understand available API endpoints."""
        endpoints = []
        
        backend_routes_dir = context.root / "backend" / "src" / "routes"
        if not backend_routes_dir.exists():
            return endpoints
        
        for route_file in backend_routes_dir.glob("*.js"):
            try:
                content = context.read_text(route_file)
                
                # Extract route definitions
                route_patterns = [
                    r'router\.(get|post|put|delete|patch)\s*\([\'"]([^\'"]+)[\'"]',
                    r'app\.(get|post|put|delete|patch)\s*\([\'"]([^\'"]+)[\'"]',
                ]
                
                for pattern in route_patterns:
                    matches = re.findall(pattern, content)
                    for method, path in matches:
                        # Construct full endpoint
                        endpoint = f"{method.upper()} /api{path}" if not path.startswith('/api') else f"{method.upper()} {path}"
                        endpoints.append(endpoint)
                        
            except Exception:
                continue
        
        return endpoints
    
    def _check_api_calls(self, content: str, file_path: str, backend_endpoints: List[str], 
                        result: AgentResult) -> None:
        """Check if API calls match available backend endpoints."""
        api_calls = self.find_api_calls(content)
        
        # Convert backend endpoints to a more searchable format
        available_paths = []
        for endpoint in backend_endpoints:
            parts = endpoint.split(' ', 1)
            if len(parts) == 2:
                available_paths.append(parts[1])  # Just the path part
        
        for api_call in api_calls:
            # Normalize API call path
            normalized_call = api_call
            if not normalized_call.startswith('/api'):
                normalized_call = '/api' + normalized_call if not normalized_call.startswith('/') else '/api' + normalized_call
            
            # Check if this endpoint exists
            endpoint_exists = any(normalized_call.startswith(path.split('?')[0]) or 
                                 path.startswith(normalized_call.split('?')[0]) 
                                 for path in available_paths)
            
            if not endpoint_exists and not self._is_external_api(api_call):
                line_num = self.find_line_number(content, api_call)
                
                result.add_issue(self.create_issue(
                    title="API call to non-existent endpoint",
                    description=f"Frontend calls {normalized_call} but this endpoint may not exist in backend",
                    severity=IssueSeverity.HIGH,
                    issue_type=IssueType.API_CONNECTION,
                    file_path=file_path,
                    line=line_num,
                    tags=['api', 'endpoint', 'connection'],
                    suggested_fix=f"Verify endpoint {normalized_call} exists in backend or update the API call",
                    code_snippet=self.extract_code_snippet(content, line_num) if line_num else ""
                ))
    
    def _check_mock_data(self, content: str, file_path: str, result: AgentResult) -> None:
        """Check for hardcoded/mock data that should use real APIs."""
        mock_patterns = [
            (r'const\s+\w+\s*=\s*\[.*\{.*\}.*\]', 'hardcoded array data'),
            (r'data:\s*\[.*\{.*\}.*\]', 'hardcoded object data'),
            (r'mock\w*', 'mock data reference'),
            (r'dummy\w*', 'dummy data reference'),
            (r'fake\w*', 'fake data reference'),
            (r'test\w*data', 'test data reference'),
            (r'placeholder\w*', 'placeholder data'),
        ]
        
        for pattern, description in mock_patterns:
            matches = list(re.finditer(pattern, content, re.IGNORECASE | re.DOTALL))
            for match in matches:
                line_num = content.count('\n', 0, match.start()) + 1
                
                # Skip if it's clearly in a test file or comment
                if any(skip in file_path.lower() for skip in ['test', 'spec', '__test__']) or \
                   any(skip in match.group().lower() for skip in ['//', '/*', '*/']):
                    continue
                
                result.add_issue(self.create_issue(
                    title=f"Potential mock data usage",
                    description=f"Found {description} that might should be replaced with real API call",
                    severity=IssueSeverity.MEDIUM,
                    issue_type=IssueType.API_CONNECTION,
                    file_path=file_path,
                    line=line_num,
                    tags=['mock-data', 'api'],
                    suggested_fix="Replace mock/hardcoded data with actual API call",
                    code_snippet=self.extract_code_snippet(content, line_num, context_lines=1)
                ))
    
    def _check_api_error_handling(self, content: str, file_path: str, result: AgentResult) -> None:
        """Check if API calls have proper error handling."""
        api_calls = self.find_api_calls(content)
        
        if api_calls:
            # Check if there's any error handling
            has_error_handling = any(pattern in content for pattern in [
                '.catch(', 'try {', 'catch (', 'onError', 'error:', 'Error'
            ])
            
            if not has_error_handling:
                result.add_issue(self.create_issue(
                    title="API calls without error handling",
                    description="File makes API calls but doesn't appear to handle errors",
                    severity=IssueSeverity.MEDIUM,
                    issue_type=IssueType.API_CONNECTION,
                    file_path=file_path,
                    tags=['error-handling', 'api'],
                    suggested_fix="Add error handling for API calls using try/catch or .catch()"
                ))
    
    def _check_api_loading_states(self, content: str, file_path: str, result: AgentResult) -> None:
        """Check if API calls have loading state management."""
        api_calls = self.find_api_calls(content)
        loading_states = self.find_loading_states(content)
        
        if api_calls and not loading_states:
            result.add_issue(self.create_issue(
                title="API calls without loading states",
                description="File makes API calls but doesn't manage loading states",
                severity=IssueSeverity.LOW,
                issue_type=IssueType.API_CONNECTION,
                file_path=file_path,
                tags=['loading', 'api', 'ux'],
                suggested_fix="Add loading state management for better user experience during API calls"
            ))
    
    def _is_external_api(self, api_call: str) -> bool:
        """Check if an API call is to an external service."""
        external_patterns = [
            'http://', 'https://', 'api.stripe.com', 'api.twilio.com',
            'googleapis.com', 'api.sendgrid.com', 'api.mailgun.com'
        ]
        
        return any(pattern in api_call for pattern in external_patterns)
