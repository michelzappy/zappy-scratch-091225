"""Route Guardian Agent - Validates routing and access control."""

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


class RouteGuardianAgent(BaseFrontendAgent):
    """Validates routing and access control."""
    
    def __init__(self):
        super().__init__(
            name="Route Guardian Agent",
            description="Checks protected routes, 404 handlers, and role-based UI access"
        )
    
    def analyze(self, context: RepositoryContext, state: SharedState) -> AgentResult:
        result = AgentResult(agent_name=self.name)
        
        # Get navigation data from Flow Navigator if available
        navigation_map = state.navigation_flows or {}
        
        # Analyze all pages
        pages = context.get_pages()
        
        for page_file in pages:
            try:
                content = context.read_text(page_file)
                relative_path = str(page_file.relative_to(context.root))
                route = self._extract_route_from_path(relative_path)
                
                # Check route protection
                self._check_route_protection(content, relative_path, route, result)
                
                # Check for role-based UI
                self._check_role_based_ui(content, relative_path, result)
                
                # Check for 404/error handling
                self._check_error_page_handling(content, relative_path, route, result)
                
                # Check redirect logic
                self._check_redirect_logic(content, relative_path, result)
                
            except Exception:
                continue
        
        # Check for missing error pages
        self._check_missing_error_pages(context, result)
        
        # Store analysis for other agents
        result.artifacts['route_issues'] = [issue.to_dict() for issue in result.issues]
        
        return result
    
    def _extract_route_from_path(self, file_path: str) -> str:
        """Extract the route from a file path."""
        route = file_path.replace('frontend/src/app', '').replace('/page.tsx', '')
        if not route:
            route = '/'
        elif not route.startswith('/'):
            route = '/' + route
        return route
    
    def _check_route_protection(self, content: str, file_path: str, route: str, result: AgentResult) -> None:
        """Check if protected routes have proper auth checks."""
        # Identify if this should be a protected route
        protected_indicators = [
            'dashboard', 'profile', 'settings', 'admin', 'portal',
            'patient', 'provider', 'consultation', 'orders', 'messages'
        ]
        
        should_be_protected = any(indicator in route.lower() for indicator in protected_indicators)
        
        # Check for authentication patterns
        auth_patterns = [
            'useAuth',
            'requireAuth',
            'isAuthenticated',
            'user &&',
            'session &&',
            'authCheck',
            'getSession',
            'checkAuth',
        ]
        
        has_auth_check = any(pattern in content for pattern in auth_patterns)
        
        # Check for redirect on unauthorized
        redirect_patterns = [
            'redirect',
            'router.push',
            'navigate(',
            'window.location',
        ]
        
        has_redirect = any(pattern in content for pattern in redirect_patterns)
        
        if should_be_protected and not has_auth_check:
            result.add_issue(self.create_issue(
                title="Protected route missing authentication check",
                description=f"Route {route} appears to need protection but has no authentication check",
                severity=IssueSeverity.HIGH,
                issue_type=IssueType.NAVIGATION_ISSUE,
                file_path=file_path,
                tags=['auth', 'protection', 'security'],
                suggested_fix="Add authentication check to protect this route from unauthorized access"
            ))
        
        # If it has auth check but no redirect, it might leave users hanging
        if has_auth_check and not has_redirect and should_be_protected:
            result.add_issue(self.create_issue(
                title="Auth check without redirect logic",
                description=f"Route {route} checks authentication but doesn't redirect unauthorized users",
                severity=IssueSeverity.MEDIUM,
                issue_type=IssueType.NAVIGATION_ISSUE,
                file_path=file_path,
                tags=['auth', 'redirect', 'ux'],
                suggested_fix="Add redirect to login page for unauthorized users"
            ))
    
    def _check_role_based_ui(self, content: str, file_path: str, result: AgentResult) -> None:
        """Check for proper role-based UI implementation."""
        # Look for role checks
        role_patterns = [
            r'role\s*===?\s*[\'"]([^\'"]+)[\'"]',
            r'hasRole\s*\([\'"]([^\'"]+)[\'"]',
            r'isRole\s*\([\'"]([^\'"]+)[\'"]',
            r'userRole\s*===?\s*[\'"]([^\'"]+)[\'"]',
        ]
        
        roles_found = []
        for pattern in role_patterns:
            matches = re.findall(pattern, content)
            roles_found.extend(matches)
        
        if roles_found:
            # Check if role-based rendering is properly implemented
            conditional_render_patterns = [
                r'role\s*===?\s*[\'"][^\'"]+[\'"].*?\?',  # Ternary operator
                r'role\s*===?\s*[\'"][^\'"]+[\'"].*?&&',  # Logical AND
                r'if\s*\([^)]*role',  # If statement
            ]
            
            has_conditional_render = any(re.search(pattern, content) for pattern in conditional_render_patterns)
            
            if not has_conditional_render:
                result.add_issue(self.create_issue(
                    title="Role checks without conditional rendering",
                    description=f"File checks user roles {roles_found} but doesn't use them for conditional UI rendering",
                    severity=IssueSeverity.MEDIUM,
                    issue_type=IssueType.NAVIGATION_ISSUE,
                    file_path=file_path,
                    tags=['roles', 'conditional-render', 'security'],
                    suggested_fix="Use role checks for conditional rendering to show/hide UI elements"
                ))
    
    def _check_error_page_handling(self, content: str, file_path: str, route: str, result: AgentResult) -> None:
        """Check for proper error page handling."""
        # Check if this is an error page
        is_error_page = any(error_indicator in route.lower() for error_indicator in [
            '404', 'error', 'not-found', 'unauthorized'
        ])
        
        if is_error_page:
            # Error pages should have navigation back
            has_back_nav = any(back_pattern in content.lower() for back_pattern in [
                'back', 'home', 'return', 'go back', 'router.back', 'navigate'
            ])
            
            if not has_back_nav:
                result.add_issue(self.create_issue(
                    title="Error page missing navigation",
                    description=f"Error page {route} doesn't provide a way for users to navigate away",
                    severity=IssueSeverity.MEDIUM,
                    issue_type=IssueType.MISSING_ELEMENT,
                    file_path=file_path,
                    tags=['error-page', 'navigation', 'ux'],
                    suggested_fix="Add navigation links or buttons to help users recover from errors"
                ))
        else:
            # Regular pages should handle their own errors
            has_error_boundary = any(error_pattern in content for error_pattern in [
                'ErrorBoundary', 'componentDidCatch', 'error', 'try', 'catch'
            ])
            
            # Check if page makes API calls but doesn't handle errors
            api_calls = self.find_api_calls(content)
            if api_calls and not has_error_boundary:
                result.add_issue(self.create_issue(
                    title="API calls without error handling UI",
                    description="Page makes API calls but doesn't handle errors in the UI",
                    severity=IssueSeverity.LOW,
                    issue_type=IssueType.MISSING_ELEMENT,
                    file_path=file_path,
                    tags=['error-handling', 'api', 'ux'],
                    suggested_fix="Add error handling UI for API failures"
                ))
    
    def _check_redirect_logic(self, content: str, file_path: str, result: AgentResult) -> None:
        """Check for proper redirect logic."""
        redirect_patterns = [
            (r'router\.push\([\'"]([^\'"]+)[\'"]', 'Next.js router push'),
            (r'navigate\([\'"]([^\'"]+)[\'"]', 'React router navigate'),
            (r'window\.location\s*=\s*[\'"]([^\'"]+)[\'"]', 'Direct location change'),
        ]
        
        for pattern, redirect_type in redirect_patterns:
            matches = re.finditer(pattern, content)
            for match in matches:
                target = match.group(1)
                line_num = content.count('\n', 0, match.start()) + 1
                
                # Check for redirects to relative URLs that might be broken
                if target.startswith('/') and not target.startswith('//'):
                    # This is a relative internal redirect - should be checked
                    # But we'll leave detailed checking to Flow Navigator
                    continue
                
                # Check for direct external redirects without user confirmation
                if target.startswith('http') and 'confirm' not in content:
                    result.add_issue(self.create_issue(
                        title="External redirect without user confirmation",
                        description=f"Page redirects to external URL {target} without user awareness",
                        severity=IssueSeverity.MEDIUM,
                        issue_type=IssueType.NAVIGATION_ISSUE,
                        file_path=file_path,
                        line=line_num,
                        tags=['redirect', 'external', 'security'],
                        suggested_fix="Add user confirmation before redirecting to external URLs",
                        code_snippet=self.extract_code_snippet(content, line_num)
                    ))
    
    def _check_missing_error_pages(self, context: RepositoryContext, result: AgentResult) -> None:
        """Check for missing essential error pages."""
        pages = context.get_pages()
        existing_routes = [self._extract_route_from_path(str(p.relative_to(context.root))) for p in pages]
        
        essential_error_pages = [
            ('/404', '404 - Page Not Found'),
            ('/error', 'General Error Page'),
            ('/unauthorized', 'Unauthorized Access Page'),
        ]
        
        for route, description in essential_error_pages:
            if not any(route in existing_route for existing_route in existing_routes):
                result.add_issue(self.create_issue(
                    title=f"Missing {description.lower()}",
                    description=f"No {description.lower()} found at {route}",
                    severity=IssueSeverity.LOW,
                    issue_type=IssueType.MISSING_ELEMENT,
                    file_path="frontend/src/app",
                    tags=['error-pages', 'missing'],
                    suggested_fix=f"Create {description.lower()} at {route}"
                ))
