"""Flow Navigator Agent - Maps and validates user journey flows."""

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


class FlowNavigatorAgent(BaseFrontendAgent):
    """Maps and validates user journey flows."""
    
    def __init__(self):
        super().__init__(
            name="Flow Navigator Agent",
            description="Traces complete user paths and identifies broken navigation chains"
        )
    
    def analyze(self, context: RepositoryContext, state: SharedState) -> AgentResult:
        result = AgentResult(agent_name=self.name)
        
        # Build navigation map
        navigation_map = self._build_navigation_map(context)
        
        # Check for flow issues
        self._check_navigation_flows(navigation_map, result)
        
        # Check for orphaned pages
        self._check_orphaned_pages(navigation_map, context, result)
        
        # Check for dead-end flows
        self._check_dead_ends(navigation_map, result)
        
        # Store navigation map for other agents
        result.artifacts['navigation_map'] = navigation_map
        result.artifacts['flow_issues'] = [issue.to_dict() for issue in result.issues]
        
        # Share navigation data with other agents
        state.navigation_flows = navigation_map
        
        return result
    
    def _build_navigation_map(self, context: RepositoryContext) -> Dict[str, Dict[str, Any]]:
        """Build a map of all navigation flows in the application."""
        navigation_map = {}
        
        pages = context.get_pages()
        
        for page_file in pages:
            try:
                content = context.read_text(page_file)
                relative_path = str(page_file.relative_to(context.root))
                
                # Extract route from file path
                route = self._extract_route_from_path(relative_path)
                
                # Find outgoing links
                outgoing_links = self._extract_navigation_links(content)
                
                # Find forms and their actions
                form_actions = self._extract_form_actions(content)
                
                # Check if this is a protected route
                is_protected = self._is_protected_route(content, route)
                
                navigation_map[route] = {
                    'file_path': relative_path,
                    'outgoing_links': outgoing_links,
                    'form_actions': form_actions,
                    'is_protected': is_protected,
                    'has_back_button': self._has_back_navigation(content),
                    'breadcrumbs': self._has_breadcrumbs(content),
                    'page_type': self._classify_page_type(content, route)
                }
                
            except Exception as e:
                # Skip files we can't read
                continue
                
        return navigation_map
    
    def _extract_route_from_path(self, file_path: str) -> str:
        """Extract the route from a file path."""
        # Convert file path to route
        route = file_path.replace('frontend/src/app', '').replace('/page.tsx', '')
        if not route:
            route = '/'
        elif not route.startswith('/'):
            route = '/' + route
            
        return route
    
    def _extract_navigation_links(self, content: str) -> List[str]:
        """Extract all navigation links from content."""
        links = []
        
        # Find href attributes
        href_matches = re.findall(r'href=[\'"]([^\'"]+)[\'"]', content)
        links.extend(href_matches)
        
        # Find Next.js router pushes
        router_matches = re.findall(r'router\.push\([\'"]([^\'"]+)[\'"]', content)
        links.extend(router_matches)
        
        # Find useRouter navigation
        navigate_matches = re.findall(r'navigate\([\'"]([^\'"]+)[\'"]', content)
        links.extend(navigate_matches)
        
        # Filter out external links and fragments
        internal_links = []
        for link in links:
            if not link.startswith('http') and not link.startswith('mailto') and not link.startswith('tel'):
                if link and link != '#':
                    internal_links.append(link)
                    
        return internal_links
    
    def _extract_form_actions(self, content: str) -> List[str]:
        """Extract form actions and their targets."""
        actions = []
        
        # Find form action attributes
        form_actions = re.findall(r'action=[\'"]([^\'"]+)[\'"]', content)
        actions.extend(form_actions)
        
        # Find onSubmit handlers that might redirect
        onsubmit_matches = re.findall(r'onSubmit.*?router\.push\([\'"]([^\'"]+)[\'"]', content, re.DOTALL)
        actions.extend(onsubmit_matches)
        
        return actions
    
    def _is_protected_route(self, content: str, route: str) -> bool:
        """Check if this appears to be a protected route."""
        # Look for auth checks
        auth_patterns = [
            'useAuth', 'requireAuth', 'isAuthenticated', 'user &&', 'session &&',
            'protected', 'login', 'signin'
        ]
        
        return any(pattern in content for pattern in auth_patterns) or 'login' in route.lower()
    
    def _has_back_navigation(self, content: str) -> bool:
        """Check if page has back navigation."""
        back_patterns = [
            'back', 'cancel', 'return', 'router.back', 'history.back',
            'go back', 'previous'
        ]
        
        return any(pattern in content.lower() for pattern in back_patterns)
    
    def _has_breadcrumbs(self, content: str) -> bool:
        """Check if page has breadcrumb navigation."""
        breadcrumb_patterns = [
            'breadcrumb', 'nav.*aria-label.*breadcrumb', 'ol.*breadcrumb'
        ]
        
        return any(re.search(pattern, content, re.IGNORECASE) for pattern in breadcrumb_patterns)
    
    def _classify_page_type(self, content: str, route: str) -> str:
        """Classify the type of page."""
        if 'form' in content.lower() or any(word in route.lower() for word in ['new', 'edit', 'create']):
            return 'form'
        elif 'login' in route.lower() or 'signin' in route.lower():
            return 'auth'
        elif 'dashboard' in route.lower() or route == '/':
            return 'dashboard'
        elif any(word in route.lower() for word in ['list', 'index', 'all']):
            return 'listing'
        elif re.search(r'/\[.*\]', route):  # Dynamic route
            return 'details'
        else:
            return 'page'
    
    def _check_navigation_flows(self, navigation_map: Dict[str, Dict[str, Any]], result: AgentResult) -> None:
        """Check for broken navigation flows."""
        all_routes = set(navigation_map.keys())
        
        for route, page_data in navigation_map.items():
            for link in page_data['outgoing_links']:
                # Normalize the link
                normalized_link = self._normalize_link(link)
                
                # Check if the target exists
                if normalized_link not in all_routes and not self._is_external_or_dynamic(normalized_link):
                    result.add_issue(self.create_issue(
                        title="Broken navigation link",
                        description=f"Page {route} links to {normalized_link} which doesn't exist",
                        severity=IssueSeverity.HIGH,
                        issue_type=IssueType.BROKEN_FLOW,
                        file_path=page_data['file_path'],
                        tags=['navigation', 'broken-link'],
                        suggested_fix=f"Either create the target page {normalized_link} or fix the link"
                    ))
    
    def _check_orphaned_pages(self, navigation_map: Dict[str, Dict[str, Any]], 
                             context: RepositoryContext, result: AgentResult) -> None:
        """Check for pages that can't be reached through navigation."""
        all_routes = set(navigation_map.keys())
        linked_routes = set()
        
        # Collect all linked routes
        for page_data in navigation_map.values():
            for link in page_data['outgoing_links']:
                normalized_link = self._normalize_link(link)
                if normalized_link in all_routes:
                    linked_routes.add(normalized_link)
        
        # Always consider root route as reachable
        linked_routes.add('/')
        
        # Check for orphaned routes
        orphaned = all_routes - linked_routes
        
        for orphaned_route in orphaned:
            page_data = navigation_map[orphaned_route]
            
            # Skip certain types that might be intentionally not linked
            if not self._is_intentionally_orphaned(orphaned_route):
                result.add_issue(self.create_issue(
                    title="Orphaned page",
                    description=f"Page {orphaned_route} cannot be reached through navigation",
                    severity=IssueSeverity.MEDIUM,
                    issue_type=IssueType.NAVIGATION_ISSUE,
                    file_path=page_data['file_path'],
                    tags=['navigation', 'orphaned'],
                    suggested_fix=f"Add navigation links to {orphaned_route} from appropriate pages"
                ))
    
    def _check_dead_ends(self, navigation_map: Dict[str, Dict[str, Any]], result: AgentResult) -> None:
        """Check for dead-end pages with no way back."""
        for route, page_data in navigation_map.items():
            page_type = page_data['page_type']
            
            # Form pages should have back/cancel options
            if page_type == 'form' and not page_data['has_back_button']:
                result.add_issue(self.create_issue(
                    title="Form page missing back navigation",
                    description=f"Form at {route} has no way for users to go back or cancel",
                    severity=IssueSeverity.MEDIUM,
                    issue_type=IssueType.MISSING_ELEMENT,
                    file_path=page_data['file_path'],
                    tags=['navigation', 'form', 'ux'],
                    suggested_fix="Add a back button or cancel link to allow users to exit the form"
                ))
            
            # Deep pages should have breadcrumbs or back navigation
            if route.count('/') > 2 and not page_data['breadcrumbs'] and not page_data['has_back_button']:
                result.add_issue(self.create_issue(
                    title="Deep page missing navigation context",
                    description=f"Deep page {route} lacks breadcrumbs or back navigation",
                    severity=IssueSeverity.LOW,
                    issue_type=IssueType.MISSING_ELEMENT,
                    file_path=page_data['file_path'],
                    tags=['navigation', 'breadcrumbs', 'ux'],
                    suggested_fix="Add breadcrumbs or back navigation to help users understand their location"
                ))
    
    def _normalize_link(self, link: str) -> str:
        """Normalize a link to match route format."""
        if link.startswith('/'):
            return link
        else:
            return '/' + link
    
    def _is_external_or_dynamic(self, link: str) -> bool:
        """Check if a link is external or uses dynamic routing."""
        return (
            link.startswith('http') or 
            link.startswith('mailto') or 
            link.startswith('tel') or
            '[' in link or  # Dynamic route parameter
            link.startswith('#')  # Fragment
        )
    
    def _is_intentionally_orphaned(self, route: str) -> bool:
        """Check if a page is intentionally not linked (like error pages)."""
        orphan_patterns = [
            '404', 'error', 'not-found', 'unauthorized', '403', '500',
            'maintenance', 'offline'
        ]
        
        return any(pattern in route.lower() for pattern in orphan_patterns)
