"""Security and compliance review agent."""

from __future__ import annotations

import re
from pathlib import Path

from ..models import AgentResult
from ..repository import RepositoryContext
from .base import BaseAgent


class SecurityComplianceAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__(
            name="Security & Compliance",
            description="Audits middleware and webhook handlers for missing protections.",
        )

    def run(self, context: RepositoryContext, state) -> AgentResult:
        result = AgentResult()
        for mount in context.backend_route_mounts():
            content = context.read_text(Path(context.root / mount["file_path"]))

            for line in self._detect_raw_body_parsing_issue(content):
                result.findings.append(
                    self.finding(
                        title="Raw webhook payload parsed without Buffer conversion",
                        description=(
                            "The handler uses `express.raw` but parses `req.body` without converting the Buffer to a string. "
                            "Call `JSON.parse(req.body.toString())` to avoid runtime crashes."
                        ),
                        severity="high",
                        file_path=mount["file_path"],
                        line=line,
                        tags=["security", "webhook"],
                    )
                )

            line = self._detect_missing_signature_verification(content)
            if line:
                result.findings.append(
                    self.finding(
                        title="Webhook signature captured but never validated",
                        description=(
                            "The SendGrid webhook stores the `signature` header yet never verifies it. "
                            "Use the official verification helper to prevent forged requests."
                        ),
                        severity="medium",
                        file_path=mount["file_path"],
                        line=line,
                        tags=["security", "webhook"],
                    )
                )

        return result

    def _detect_raw_body_parsing_issue(self, content: str):
        lines = []
        if "express.raw" not in content:
            return lines
        for match in re.finditer(r"JSON\.parse\(req\.body\)", content):
            line = content.count("\n", 0, match.start()) + 1
            lines.append(line)
        return lines

    def _detect_missing_signature_verification(self, content: str):
        if "sendgrid" not in content.lower():
            return 0
        marker = "Verify webhook signature"
        idx = content.find(marker)
        if idx == -1:
            return 0
        after = content[idx: idx + 200]
        if "TODO" in after or "optional" in after.lower():
            line = content.count("\n", 0, idx) + 1
            return line
        if "signature" in after and "verify" not in content[idx: idx + 500].lower():
            line = content.count("\n", 0, idx) + 1
            return line
        return 0
