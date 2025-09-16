"""Integration contract agent."""

from __future__ import annotations

from typing import Dict, List, Set, Tuple

from ..models import AgentResult, ComponentMap, SharedState
from .base import BaseAgent


class IntegrationContractAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__(
            name="Integration Contract",
            description="Cross-checks frontend API client calls against Express routes.",
        )

    def run(self, context, state: SharedState) -> AgentResult:
        result = AgentResult()
        component_map: ComponentMap = state.get_artifact("Repository Cartographer", "component_map", {})
        backend_routes = component_map.get("backend_routes", [])
        frontend_endpoints = component_map.get("frontend_endpoints", [])

        backend_set: Set[Tuple[str, str]] = set()
        backend_index: Dict[Tuple[str, str], Dict[str, object]] = {}
        for route in backend_routes:
            for endpoint in route.get("endpoints", []):
                key = (endpoint["method"], endpoint["full_path"])
                backend_set.add(key)
                backend_index[key] = {
                    "file_path": route["file_path"],
                    "line": endpoint["line"],
                }

        frontend_set: Set[Tuple[str, str]] = set()
        frontend_index: Dict[Tuple[str, str], Dict[str, object]] = {}
        for endpoint in frontend_endpoints:
            key = (endpoint["method"], endpoint["path"])
            frontend_set.add(key)
            frontend_index[key] = endpoint

        missing_in_frontend = sorted(backend_set - frontend_set)[:12]
        for method, path in missing_in_frontend:
            info = backend_index[(method, path)]
            result.findings.append(
                self.finding(
                    title="Backend endpoint missing from API client",
                    description=(
                        f"Expose `{method} {path}` through the Next.js api client to keep the portal in sync with the Express app."
                    ),
                    severity="medium",
                    file_path=info["file_path"],
                    line=info["line"],
                    tags=["integration"],
                )
            )

        extra_in_frontend = sorted(frontend_set - backend_set)[:12]
        for method, path in extra_in_frontend:
            info = frontend_index[(method, path)]
            result.findings.append(
                self.finding(
                    title="Frontend references undefined API route",
                    description=(
                        f"The client calls `{method} {path}` but no Express route exposes it. Either implement the route or update the UI."
                    ),
                    severity="high",
                    file_path=info["file_path"],
                    line=info["line"],
                    tags=["integration"],
                )
            )

        if not missing_in_frontend and not extra_in_frontend:
            result.findings.append(
                self.finding(
                    title="Frontend and backend API contracts aligned",
                    description="API client paths mirror Express routes.",
                    severity="info",
                )
            )

        return result
