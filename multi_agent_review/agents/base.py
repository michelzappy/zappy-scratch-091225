"""Base classes for review agents."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List, Optional

from ..models import AgentResult, Finding, Severity, SharedState
from ..repository import RepositoryContext


@dataclass
class BaseAgent:
    name: str
    description: str

    def execute(self, context: RepositoryContext, state: SharedState) -> AgentResult:
        result = self.run(context, state)
        state.record(self.name, result)
        return result

    def run(self, context: RepositoryContext, state: SharedState) -> AgentResult:  # pragma: no cover - interface
        raise NotImplementedError

    def finding(
        self,
        title: str,
        description: str,
        *,
        severity: Severity = "info",
        file_path: Optional[str] = None,
        line: Optional[int] = None,
        tags: Optional[Iterable[str]] = None,
    ) -> Finding:
        return Finding(
            agent=self.name,
            title=title,
            description=description,
            severity=severity,
            file_path=file_path,
            line=line,
            tags=list(tags) if tags else [],
        )


class CompositeAgent(BaseAgent):
    """Agent that delegates to a collection of child agents."""

    def __init__(self, name: str, description: str, children: List[BaseAgent]):
        super().__init__(name=name, description=description)
        self.children = children

    def run(self, context: RepositoryContext, state: SharedState) -> AgentResult:
        aggregate = AgentResult()
        for child in self.children:
            aggregate.extend(child.execute(context, state))
        return aggregate
