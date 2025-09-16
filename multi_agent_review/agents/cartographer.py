"""Repository cartographer agent."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Dict, List

from ..models import AgentResult, ComponentMap
from ..repository import RepositoryContext
from .base import BaseAgent


class RepositoryCartographerAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__(
            name="Repository Cartographer",
            description="Builds a component map of routes, services, SQL tables, and frontend endpoints.",
        )

    def run(self, context: RepositoryContext, state) -> AgentResult:
        result = AgentResult()
        map_data: ComponentMap = {}

        backend_routes = []
        for mount in context.backend_route_mounts():
            route_path = Path(context.root / mount["file_path"])
            endpoints = context.parse_route_endpoints(route_path, mount["base_path"])
            backend_routes.append(
                {
                    "identifier": mount["identifier"],
                    "base_path": mount["base_path"],
                    "file_path": mount["file_path"],
                    "endpoint_count": len(endpoints),
                    "endpoints": endpoints,
                }
            )
        map_data["backend_routes"] = backend_routes

        services = []
        for service_file in context.iter_backend_service_files():
            services.append(str(service_file.relative_to(context.root)))
        map_data["backend_services"] = services

        frontend_endpoints = self._parse_frontend_api_client(context)
        if frontend_endpoints:
            map_data["frontend_endpoints"] = frontend_endpoints

        database_tables = self._parse_database_tables(context)
        if database_tables:
            map_data["database_tables"] = database_tables

        result.artifacts["component_map"] = map_data

        result.findings.append(
            self.finding(
                title="Component map generated",
                description=(
                    "Indexed "
                    f"{len(backend_routes)} Express router modules, "
                    f"{len(services)} services, "
                    f"{len(database_tables)} SQL tables, and "
                    f"{len(frontend_endpoints)} frontend API endpoints for downstream agents."
                ),
                severity="info",
            )
        )
        return result

    def _parse_frontend_api_client(self, context: RepositoryContext) -> List[Dict[str, object]]:
        api_file = context.frontend_path / "src" / "lib" / "api.ts"
        content = context.maybe_read_text(api_file)
        if not content:
            return []

        endpoints: List[Dict[str, object]] = []
        for line_no, line in enumerate(content.splitlines(), 1):
            match = re.search(r"this\.client\.(get|post|put|delete)\(([^,]+)", line)
            if not match:
                continue
            method = match.group(1).upper()
            raw_arg = match.group(2).strip()
            if not raw_arg or raw_arg[0] not in ("'", '"', '`'):
                continue
            delimiter = raw_arg[0]
            closing = raw_arg.find(delimiter, 1)
            if closing == -1:
                continue
            raw_path = raw_arg[1:closing]
            normalized = RepositoryContext._normalize_path(raw_path)
            endpoints.append(
                {
                    "method": method,
                    "path": normalized,
                    "line": line_no,
                    "file_path": str(api_file.relative_to(context.root)),
                }
            )
        return endpoints

    def _parse_database_tables(self, context: RepositoryContext) -> List[Dict[str, object]]:
        tables: List[Dict[str, object]] = []
        create_table_pattern = re.compile(
            r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?P<name>[A-Za-z0-9_]+)",
            re.IGNORECASE,
        )
        for sql_file in context.iter_sql_files():
            content = context.read_text(sql_file)
            for match in create_table_pattern.finditer(content):
                line = content.count("\n", 0, match.start()) + 1
                tables.append(
                    {
                        "name": match.group("name"),
                        "file_path": str(sql_file.relative_to(context.root)),
                        "line": line,
                    }
                )
        return tables
