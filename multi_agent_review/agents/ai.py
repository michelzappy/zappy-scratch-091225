"""AI consultation specialist agent."""

from __future__ import annotations

import re
from pathlib import Path

from ..models import AgentResult
from ..repository import RepositoryContext
from .base import BaseAgent


class AIConsultationAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__(
            name="AI Consultation Specialist",
            description="Reviews the OpenAI-backed service for guardrails and safety gaps.",
        )

    def run(self, context: RepositoryContext, state) -> AgentResult:
        result = AgentResult()
        service_file = context.backend_src / "services" / "ai-consultation.service.js"
        content = context.maybe_read_text(service_file)
        if not content:
            return result

        json_parse_match = re.search(r"JSON\.parse\(response\.choices\[0\]\.message\.content\)", content)
        if json_parse_match:
            line = content.count("\n", 0, json_parse_match.start()) + 1
            result.findings.append(
                self.finding(
                    title="LLM JSON output is trusted without schema validation",
                    description=(
                        "Wrap the parsed response in a schema validator (zod/io-ts) to reject malformed content "
                        "before persisting clinical recommendations."
                    ),
                    severity="medium",
                    file_path=str(service_file.relative_to(context.root)),
                    line=line,
                    tags=["ai", "safety"],
                )
            )

        if "generatePatientMessage" in content and "disclaimer" not in content.lower():
            marker = "Create a warm, professional message"
            idx = content.find(marker)
            line = content.count("\n", 0, idx) + 1 if idx != -1 else None
            result.findings.append(
                self.finding(
                    title="Patient messaging prompt lacks compliance disclaimer",
                    description=(
                        "Add explicit instructions for medical disclaimers and clinician review when generating patient-facing "
                        "messages so AI output never replaces licensed guidance."
                    ),
                    severity="medium",
                    file_path=str(service_file.relative_to(context.root)),
                    line=line,
                    tags=["ai", "compliance"],
                )
            )

        return result
