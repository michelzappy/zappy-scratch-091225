"""Database integrity agent."""

from __future__ import annotations

import re
from ..models import AgentResult
from ..repository import RepositoryContext
from .base import BaseAgent


class DatabaseIntegrityAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__(
            name="Database Integrity",
            description="Checks schema definitions for missing constraints and lingering seed data.",
        )

    def run(self, context: RepositoryContext, state) -> AgentResult:
        result = AgentResult()
        init_sql = context.database_path / "init.sql"
        content = context.maybe_read_text(init_sql)
        if not content:
            return result

        table_blocks = list(self._iter_table_blocks(content))
        for name, block_start, block_text in table_blocks:
            if name == "user_sessions" and "REFERENCES" not in block_text:
                line = content.count("\n", 0, block_start) + 1
                result.findings.append(
                    self.finding(
                        title="user_sessions table lacks foreign key constraint",
                        description=(
                            "Connect `user_id` to the appropriate patients/providers table with a foreign key to enforce referential "
                            "integrity for session revocation."
                        ),
                        severity="medium",
                        file_path=str(init_sql.relative_to(context.root)),
                        line=line,
                        tags=["database", "integrity"],
                    )
                )

        for match in re.finditer(r"INSERT INTO\s+patients", content, re.IGNORECASE):
            line = content.count("\n", 0, match.start()) + 1
            result.findings.append(
                self.finding(
                    title="Seed patient records included in init.sql",
                    description="Remove hard-coded sample patients before production to avoid leaking test identities.",
                    severity="low",
                    file_path=str(init_sql.relative_to(context.root)),
                    line=line,
                    tags=["database", "seed"],
                )
            )

        return result

    def _iter_table_blocks(self, content: str):
        pattern = re.compile(r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?P<name>[A-Za-z0-9_]+)\s*\(", re.IGNORECASE)
        for match in pattern.finditer(content):
            name = match.group("name")
            start = match.start()
            end = content.find("\n);", match.end())
            if end == -1:
                end = content.find(");", match.end())
            if end == -1:
                continue
            block_text = content[match.end():end]
            yield name, start, block_text
