"""Orchestrator coordinating the review agents."""

from __future__ import annotations

from pathlib import Path
from typing import List, Sequence

from .agents import (
    AIConsultationAgent,
    AutomationQualityAgent,
    BackendReviewAgent,
    DatabaseIntegrityAgent,
    FrontendExperienceAgent,
    IntegrationContractAgent,
    RepositoryCartographerAgent,
    SecurityComplianceAgent,
    SynthesisAgent,
)
from .agents.crm_integration import CRMIntegrationAgent
from .agents.communication_analytics import CommunicationAnalyticsAgent
from .agents.customer_journey import CustomerJourneyAgent
from .agents.api_integration import APIIntegrationAgent
from .agents.base import BaseAgent
from .models import SharedState
from .repository import RepositoryContext


class ReviewOrchestrator:
    """Coordinates the multi-agent review workflow."""

    def __init__(self, root: Path, agents: Sequence[BaseAgent] | None = None) -> None:
        self.root = Path(root)
        self.context = RepositoryContext(self.root)
        self.agents: List[BaseAgent] = list(agents) if agents else self._default_agents()

    def _default_agents(self) -> List[BaseAgent]:
        return [
            RepositoryCartographerAgent(),
            BackendReviewAgent(),
            SecurityComplianceAgent(),
            AIConsultationAgent(),
            DatabaseIntegrityAgent(),
            FrontendExperienceAgent(),
            IntegrationContractAgent(),
            AutomationQualityAgent(),
            SynthesisAgent(),
        ]

    def run(self) -> tuple[str, SharedState]:
        state = SharedState()
        for agent in self.agents:
            agent.execute(self.context, state)
        report = state.get_artifact("Synthesis Reporter", "report", "")
        return report, state

    def agent_names(self) -> List[str]:
        return [agent.name for agent in self.agents]
