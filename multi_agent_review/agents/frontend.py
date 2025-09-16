"""Frontend experience agent."""

from __future__ import annotations

import re
from typing import Iterable

from ..models import AgentResult
from ..repository import RepositoryContext
from .base import BaseAgent


class FrontendExperienceAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__(
            name="Frontend Experience",
            description="Examines Next.js screens for mock data and missing API integrations.",
        )

    def run(self, context: RepositoryContext, state) -> AgentResult:
        result = AgentResult()
        for page in context.iter_frontend_page_files():
            content = context.read_text(page)
            rel_path = str(page.relative_to(context.root))
            for line in self._find_mock_usage(content):
                result.findings.append(
                    self.finding(
                        title="Mock data still powering portal UI",
                        description="Replace mock collections with API calls wired through `apiClient` to surface real patient data.",
                        severity="medium",
                        file_path=rel_path,
                        line=line,
                        tags=["frontend", "mock"],
                    )
                )

            for line in self._find_todo_comments(content):
                result.findings.append(
                    self.finding(
                        title="TODO left in UI flow",
                        description="Resolve TODOs to finalize the patient/provider experience before release.",
                        severity="low",
                        file_path=rel_path,
                        line=line,
                        tags=["frontend", "todo"],
                    )
                )
        return result

    def _find_mock_usage(self, content: str) -> Iterable[int]:
        seen_lines = []
        for match in re.finditer(r"mock[A-Za-z0-9_]*", content):
            line = content.count('\n', 0, match.start()) + 1
            if line not in seen_lines:
                seen_lines.append(line)
                yield line
            if len(seen_lines) >= 5:
                break

    def _find_todo_comments(self, content: str) -> Iterable[int]:
        yielded = 0
        for match in re.finditer(r"TODO", content, re.IGNORECASE):
            yield content.count('\n', 0, match.start()) + 1
            yielded += 1
            if yielded >= 3:
                break
