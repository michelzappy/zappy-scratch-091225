"""Backend API review agent."""

from __future__ import annotations

import re
from pathlib import Path
from typing import List

from ..models import AgentResult
from ..repository import RepositoryContext
from .base import BaseAgent


class BackendReviewAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__(
            name="Backend API Reviewer",
            description="Checks Express routes for missing authentication and unfinished implementations.",
        )
        self.auth_exempt_prefixes = {"/api/auth", "/webhooks"}

    def run(self, context: RepositoryContext, state) -> AgentResult:
        result = AgentResult()
        for mount in context.backend_route_mounts():
            route_file = Path(context.root / mount["file_path"])
            content = context.read_text(route_file)

            if not self._is_auth_protected(content) and not self._is_exempt(mount["base_path"]):
                result.findings.append(
                    self.finding(
                        title="Route missing authentication guard",
                        description=(
                            f"The router mounted at `{mount['base_path']}` does not reference `requireAuth` or `requireRole`. "
                            "Attach role-aware middleware so protected resources cannot be accessed anonymously."
                        ),
                        severity="high",
                        file_path=mount["file_path"],
                        tags=["auth", "backend"],
                    )
                )

            for placeholder in self._find_placeholders(content):
                result.findings.append(
                    self.finding(
                        title="Placeholder implementation in API route",
                        description="Replace the placeholder response with production logic for file uploads and retrieval.",
                        severity="medium",
                        file_path=mount["file_path"],
                        line=placeholder,
                        tags=["todo", "backend"],
                    )
                )

        return result

    def _is_auth_protected(self, content: str) -> bool:
        return any(token in content for token in ("requireAuth", "requireRole", "optionalAuth"))

    def _is_exempt(self, base_path: str) -> bool:
        return any(base_path.startswith(prefix) for prefix in self.auth_exempt_prefixes)

    def _find_placeholders(self, content: str) -> List[int]:
        matches = []
        for match in re.finditer(r"implementation needed", content, re.IGNORECASE):
            line = content.count("\n", 0, match.start()) + 1
            matches.append(line)
        return matches
