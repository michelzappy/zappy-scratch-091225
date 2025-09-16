"""Shared data models for the review automation toolkit."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple, TypedDict

Severity = str  # using string severities for flexibility


@dataclass
class Finding:
    """Structured improvement or risk surfaced by an agent."""

    agent: str
    title: str
    description: str
    severity: Severity = "info"
    file_path: Optional[str] = None
    line: Optional[int] = None
    tags: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "agent": self.agent,
            "title": self.title,
            "description": self.description,
            "severity": self.severity,
            "tags": list(self.tags),
        }
        if self.file_path:
            payload["file_path"] = self.file_path
        if self.line is not None:
            payload["line"] = self.line
        return payload

    def to_markdown(self) -> str:
        location = ""
        if self.file_path:
            location = f" (`{self.file_path}`"
            if self.line is not None:
                location += f":{self.line}"
            location += ")"
        tag_str = f" [{' '.join(f'#{tag}' for tag in self.tags)}]" if self.tags else ""
        return f"- **{self.severity.upper()}** {self.title}{location}{tag_str}\n  - {self.description}"


@dataclass
class AgentResult:
    """Container for an agent's outcome."""

    findings: List[Finding] = field(default_factory=list)
    artifacts: Dict[str, Any] = field(default_factory=dict)
    notes: Optional[str] = None

    def extend(self, other: "AgentResult") -> None:
        self.findings.extend(other.findings)
        self.artifacts.update(other.artifacts)
        if other.notes:
            if self.notes:
                self.notes += f"\n{other.notes}"
            else:
                self.notes = other.notes


@dataclass
class SharedState:
    """State object shared across agents."""

    artifacts: Dict[str, Any] = field(default_factory=dict)
    findings: List[Finding] = field(default_factory=list)

    def record(self, agent: str, result: AgentResult) -> None:
        self.findings.extend(result.findings)
        for key, value in result.artifacts.items():
            self.artifacts[f"{agent}:{key}"] = value

    def get_artifact(self, agent: str, key: str, default: Any = None) -> Any:
        return self.artifacts.get(f"{agent}:{key}", default)

    def all_findings(self) -> Sequence[Finding]:
        return tuple(self.findings)


class RouteMount(TypedDict):
    identifier: str
    base_path: str
    file_path: str


class RouteEndpoint(TypedDict):
    method: str
    path: str
    full_path: str
    line: int
    requires_auth: bool


class ComponentMap(TypedDict, total=False):
    backend_routes: List[Dict[str, Any]]
    backend_services: List[str]
    frontend_endpoints: List[Dict[str, Any]]
    database_tables: List[Dict[str, Any]]


def combine_artifacts(state: SharedState, keys: Iterable[Tuple[str, str]]) -> Dict[str, Any]:
    """Utility to combine artifacts from multiple agents."""

    output: Dict[str, Any] = {}
    for agent, key in keys:
        composite_key = f"{agent}:{key}"
        if composite_key in state.artifacts:
            output[key] = state.artifacts[composite_key]
    return output
