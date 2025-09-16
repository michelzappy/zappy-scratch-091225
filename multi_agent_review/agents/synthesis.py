"""Synthesis agent to assemble the final report."""

from __future__ import annotations

from collections import Counter, defaultdict
from typing import Dict, List

from ..models import AgentResult, Finding, SharedState
from .base import BaseAgent


class SynthesisAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__(
            name="Synthesis Reporter",
            description="Aggregates findings into a markdown report.",
        )

    def run(self, context, state: SharedState) -> AgentResult:
        findings = list(state.all_findings())
        if not findings:
            report = "# Review Report\n\nNo findings recorded."
        else:
            report = self._build_report(findings, state)

        result = AgentResult()
        result.artifacts["report"] = report
        return result

    def _build_report(self, findings: List[Finding], state: SharedState) -> str:
        severity_counts = Counter(f.severity for f in findings)
        by_agent: Dict[str, List[Finding]] = defaultdict(list)
        for finding in findings:
            by_agent[finding.agent].append(finding)

        lines = ["# Multi-agent Review Report", ""]
        lines.append("## Summary")
        lines.append(
            " | ".join(f"{severity.title()}: {count}" for severity, count in severity_counts.items()) or "No findings"
        )
        lines.append("")

        automation = state.get_artifact("Automation & Quality", "commands")
        if automation:
            lines.append("### Automation Commands")
            for workspace, cmds in automation.items():
                if cmds:
                    lines.append(f"- **{workspace.title()}**: {', '.join(cmds)}")
            lines.append("")

        lines.append("## Findings by Agent")
        for agent_name, agent_findings in sorted(by_agent.items()):
            lines.append(f"### {agent_name}")
            for finding in agent_findings:
                lines.append(finding.to_markdown())
            lines.append("")

        return "\n".join(lines)
