"""Repository indexing utilities used by the review agents."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Iterable, List, Optional

from .models import RouteEndpoint, RouteMount


@dataclass
class RepositoryContext:
    """Indexed view over the telehealth repository."""

    root: Path
    backend_path: Path = field(init=False)
    backend_src: Path = field(init=False)
    frontend_path: Path = field(init=False)
    database_path: Path = field(init=False)
    _cache: Dict[Path, str] = field(default_factory=dict, init=False)

    def __post_init__(self) -> None:
        self.root = self.root.resolve()
        self.backend_path = (self.root / "backend").resolve()
        self.backend_src = (self.backend_path / "src").resolve()
        self.frontend_path = (self.root / "frontend").resolve()
        self.database_path = (self.root / "database").resolve()

    def exists(self) -> bool:
        return self.root.exists()

    def read_text(self, path: Path) -> str:
        absolute = path if path.is_absolute() else (self.root / path)
        absolute = absolute.resolve()
        if absolute not in self._cache:
            self._cache[absolute] = absolute.read_text(encoding="utf-8")
        return self._cache[absolute]

    def maybe_read_text(self, path: Path) -> Optional[str]:
        try:
            return self.read_text(path)
        except FileNotFoundError:
            return None

    def read_json(self, path: Path) -> Dict:
        content = self.read_text(path)
        return json.loads(content)

    @property
    def backend_routes_dir(self) -> Path:
        return self.backend_src / "routes"

    @property
    def backend_services_dir(self) -> Path:
        return self.backend_src / "services"

    def iter_backend_route_files(self) -> Iterable[Path]:
        if not self.backend_routes_dir.exists():
            return []
        return sorted(self.backend_routes_dir.glob("*.js"))

    def iter_backend_service_files(self) -> Iterable[Path]:
        if not self.backend_services_dir.exists():
            return []
        return sorted(self.backend_services_dir.glob("*.js"))

    def iter_frontend_page_files(self) -> Iterable[Path]:
        if not self.frontend_path.exists():
            return []
        app_dir = self.frontend_path / "src" / "app"
        return sorted(app_dir.rglob("page.tsx")) if app_dir.exists() else []

    def iter_frontend_component_files(self) -> Iterable[Path]:
        if not self.frontend_path.exists():
            return []
        comp_dir = self.frontend_path / "src" / "components"
        return sorted(comp_dir.glob("*.tsx")) if comp_dir.exists() else []

    def iter_sql_files(self) -> Iterable[Path]:
        if not self.database_path.exists():
            return []
        return sorted(self.database_path.glob("*.sql"))

    def backend_route_mounts(self) -> List[RouteMount]:
        app_file = self.backend_src / "app.js"
        if not app_file.exists():
            return []
        content = self.read_text(app_file)

        import_pattern = re.compile(
            r"import\s+(?P<identifier>[A-Za-z0-9_]+)\s+from\s+['\"]\.\/routes\/(?P<file>[^'\"]+)['\"];"
        )
        use_pattern = re.compile(
            r"app\.use\(\s*['\"](?P<mount>[^'\"]+)['\"],\s*(?P<identifier>[A-Za-z0-9_]+)\s*\)"
        )

        identifier_to_file: Dict[str, str] = {}
        for match in import_pattern.finditer(content):
            identifier_to_file[match.group("identifier")] = match.group("file")

        mounts: List[RouteMount] = []
        for match in use_pattern.finditer(content):
            identifier = match.group("identifier")
            base_path = match.group("mount")
            file_name = identifier_to_file.get(identifier)
            if not file_name:
                continue
            if not file_name.endswith(".js"):
                file_name = f"{file_name}.js"
            route_file = (self.backend_routes_dir / file_name).resolve()
            mounts.append(
                {
                    "identifier": identifier,
                    "base_path": base_path,
                    "file_path": str(route_file.relative_to(self.root)),
                }
            )
        return mounts

    def parse_route_endpoints(self, route_path: Path, base_path: str) -> List[RouteEndpoint]:
        content = self.read_text(route_path)
        pattern = re.compile(
            r"router\.(get|post|put|delete|patch)\(\s*(?:['\"](?P<path>[^'\"]+)['\"]|`(?P<tpath>[^`]+)`)",
            re.IGNORECASE,
        )
        endpoints: List[RouteEndpoint] = []
        for match in pattern.finditer(content):
            method = match.group(1).upper()
            path_literal = match.group("path") or match.group("tpath") or ""
            normalized_path = self._normalize_path(path_literal)
            full_path = self._join_paths(base_path, normalized_path)
            line = content.count("\n", 0, match.start()) + 1
            requires_auth = "requireAuth" in content or "requireRole" in content or "optionalAuth" in content
            endpoints.append(
                {
                    "method": method,
                    "path": normalized_path,
                    "full_path": full_path,
                    "line": line,
                    "requires_auth": requires_auth,
                }
            )
        return endpoints

    @staticmethod
    def _join_paths(base: str, path: str) -> str:
        if path == "/":
            return base
        if path.startswith("/"):
            return base.rstrip("/") + path
        return f"{base.rstrip('/')}/{path}"

    @staticmethod
    def _normalize_path(path: str) -> str:
        # Convert template literals like `/foo/${id}` into `/foo/:id`
        if "${" in path:
            return re.sub(r"\$\{([^}]+)\}", lambda m: f":{m.group(1)}", path)
        return path
