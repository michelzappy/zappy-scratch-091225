"""Data models for frontend troubleshooting agents."""

from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Any


class IssueSeverity(Enum):
    CRITICAL = "critical"  # Blocks user actions
    HIGH = "high"         # Breaks user flows
    MEDIUM = "medium"     # Inconsistent experience
    LOW = "low"          # Missing helpful feedback


class IssueType(Enum):
    MISSING_ELEMENT = "missing_element"
    BROKEN_FLOW = "broken_flow"
    INCONSISTENT_UI = "inconsistent_ui"
    API_CONNECTION = "api_connection"
    STATE_ISSUE = "state_issue"
    NAVIGATION_ISSUE = "navigation_issue"
    ACCESSIBILITY = "accessibility"


@dataclass
class FrontendIssue:
    """Represents a frontend issue found by an agent."""
    title: str
    description: str
    severity: IssueSeverity
    type: IssueType
    file_path: str
    line: Optional[int] = None
    agent: str = ""
    tags: List[str] = field(default_factory=list)
    suggested_fix: str = ""
    dependencies: List[str] = field(default_factory=list)
    code_snippet: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            'title': self.title,
            'description': self.description,
            'severity': self.severity.value,
            'type': self.type.value,
            'file_path': self.file_path,
            'line': self.line,
            'agent': self.agent,
            'tags': self.tags,
            'suggested_fix': self.suggested_fix,
            'dependencies': self.dependencies,
            'code_snippet': self.code_snippet
        }


@dataclass
class AgentMessage:
    """Message sent between agents."""
    from_agent: str
    to_agents: List[str]  # Can be specific agents or ['broadcast']
    message_type: str  # verify, fix, coordinate, alert
    issue: Optional[FrontendIssue] = None
    data: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AgentResult:
    """Result from an agent's analysis."""
    agent_name: str
    issues: List[FrontendIssue] = field(default_factory=list)
    artifacts: Dict[str, Any] = field(default_factory=dict)
    messages: List[AgentMessage] = field(default_factory=list)

    def add_issue(self, issue: FrontendIssue) -> None:
        issue.agent = self.agent_name
        self.issues.append(issue)

    def send_message(self, to_agents: List[str], message_type: str, 
                    issue: Optional[FrontendIssue] = None, 
                    data: Optional[Dict[str, Any]] = None) -> None:
        message = AgentMessage(
            from_agent=self.agent_name,
            to_agents=to_agents,
            message_type=message_type,
            issue=issue,
            data=data or {}
        )
        self.messages.append(message)


@dataclass
class SharedState:
    """Shared state between all agents."""
    agents_results: Dict[str, AgentResult] = field(default_factory=dict)
    page_components: Dict[str, List[str]] = field(default_factory=dict)
    api_endpoints: List[str] = field(default_factory=list)
    navigation_flows: Dict[str, List[str]] = field(default_factory=dict)
    component_patterns: Dict[str, Any] = field(default_factory=dict)

    def record_result(self, result: AgentResult) -> None:
        self.agents_results[result.agent_name] = result

    def get_artifact(self, agent: str, key: str, default: Any = None) -> Any:
        if agent in self.agents_results:
            return self.agents_results[agent].artifacts.get(key, default)
        return default

    def all_issues(self) -> List[FrontendIssue]:
        issues = []
        for result in self.agents_results.values():
            issues.extend(result.issues)
        return sorted(issues, key=lambda x: x.severity.value)

    def critical_issues(self) -> List[FrontendIssue]:
        return [issue for issue in self.all_issues() 
                if issue.severity == IssueSeverity.CRITICAL]


@dataclass
class RepositoryContext:
    """Context about the frontend repository structure."""
    root: Path
    frontend_path: Path
    
    def __post_init__(self) -> None:
        self.frontend_path = self.root / "frontend"
        
    def read_text(self, path: Path) -> str:
        """Read text content from a file."""
        return path.read_text(encoding='utf-8')
        
    def maybe_read_text(self, path: Path) -> Optional[str]:
        """Read text content from a file if it exists."""
        try:
            return self.read_text(path)
        except FileNotFoundError:
            return None
            
    def iter_frontend_files(self, pattern: str = "*.tsx") -> List[Path]:
        """Get all frontend files matching pattern."""
        src_path = self.frontend_path / "src"
        if not src_path.exists():
            return []
        return list(src_path.rglob(pattern))
        
    def get_pages(self) -> List[Path]:
        """Get all page component files."""
        pages = []
        app_path = self.frontend_path / "src" / "app"
        if app_path.exists():
            pages.extend(app_path.rglob("page.tsx"))
        return pages
        
    def get_components(self) -> List[Path]:
        """Get all component files."""
        components_path = self.frontend_path / "src" / "components"
        if not components_path.exists():
            return []
        return list(components_path.rglob("*.tsx"))
