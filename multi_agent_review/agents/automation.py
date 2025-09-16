"""Automation & quality agent."""

from __future__ import annotations

from pathlib import Path
from typing import Dict, List

from ..models import AgentResult
from ..repository import RepositoryContext
from .base import BaseAgent


class AutomationQualityAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__(
            name="Automation & Quality",
            description="Summarizes available lint/test scripts and flags missing coverage.",
        )

    def run(self, context: RepositoryContext, state) -> AgentResult:
        result = AgentResult()
        workspaces = {
            "backend": context.backend_path / "package.json",
            "frontend": context.frontend_path / "package.json",
        }
        commands: Dict[str, List[str]] = {}

        for name, package_path in workspaces.items():
            package = context.maybe_read_text(package_path)
            if not package:
                continue
            data = context.read_json(package_path)
            scripts = data.get("scripts", {})
            recommended = [cmd for cmd in ("lint", "test", "type-check") if cmd in scripts]
            commands[name] = [f"npm run {cmd}" for cmd in recommended]

            missing = [cmd for cmd in ("lint", "test") if cmd not in scripts]
            if missing:
                result.findings.append(
                    self.finding(
                        title=f"{name.title()} workspace missing automation script",
                        description=(
                            f"Add {' and '.join(missing)} scripts to `{name}/package.json` so CI can validate patches automatically."
                        ),
                        severity="low",
                        file_path=str(package_path.relative_to(context.root)),
                        tags=["automation"],
                    )
                )
            else:
                result.findings.append(
                    self.finding(
                        title=f"{name.title()} automation commands discovered",
                        description=", ".join(f"npm run {cmd}" for cmd in recommended) or "No standard commands",
                        severity="info",
                        file_path=str(package_path.relative_to(context.root)),
                        tags=["automation"],
                    )
                )

        result.artifacts["commands"] = commands
        return result
