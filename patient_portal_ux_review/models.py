"""Data models for the patient portal UX review system."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Any


class Severity(Enum):
    """Issue severity levels."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class IssueCategory(Enum):
    """Categories of UX issues."""
    USABILITY = "usability"
    ACCESSIBILITY = "accessibility"
    CONSISTENCY = "consistency"
    RESPONSIVENESS = "responsiveness"
    USER_FLOW = "user_flow"
    PERFORMANCE = "performance"


class ActionType(Enum):
    """Types of actions agents can take."""
    UI_IMPROVEMENT = "ui_improvement"
    COMPONENT_UPDATE = "component_update"
    STYLE_FIX = "style_fix"
    ACCESSIBILITY_FIX = "accessibility_fix"
    RESPONSIVE_FIX = "responsive_fix"


@dataclass
class Finding:
    """A UX/UI issue discovered by an agent."""
    id: str
    agent_name: str
    title: str
    description: str
    severity: Severity
    category: IssueCategory
    file_path: str
    line_number: Optional[int] = None
    code_snippet: Optional[str] = None
    recommendations: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class Action:
    """An action that an agent can take to fix an issue."""
    id: str
    agent_name: str
    action_type: ActionType
    title: str
    description: str
    file_path: str
    finding_ids: List[str] = field(default_factory=list)
    estimated_impact: str = ""
    safety_check_passed: bool = False
    consensus_score: float = 0.0


@dataclass
class AgentVote:
    """A vote from an agent on a proposed action."""
    agent_name: str
    action_id: str
    approval: bool
    reasoning: str
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class AgentReport:
    """Report from a single agent's analysis."""
    agent_name: str
    description: str
    findings: List[Finding] = field(default_factory=list)
    proposed_actions: List[Action] = field(default_factory=list)
    execution_time_seconds: float = 0.0
    files_analyzed: int = 0
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class SharedState:
    """Shared state between all agents during the review process."""
    findings: List[Finding] = field(default_factory=list)
    proposed_actions: List[Action] = field(default_factory=list)
    agent_reports: List[AgentReport] = field(default_factory=list)
    votes: List[AgentVote] = field(default_factory=list)
    consensus_threshold: float = 0.6
    artifacts: Dict[str, Any] = field(default_factory=dict)
    
    def add_finding(self, finding: Finding) -> None:
        """Add a finding to the shared state."""
        self.findings.append(finding)
    
    def add_action(self, action: Action) -> None:
        """Add a proposed action to the shared state."""
        self.proposed_actions.append(action)
    
    def add_vote(self, vote: AgentVote) -> None:
        """Add an agent vote to the shared state."""
        self.votes.append(vote)
    
    def get_consensus_score(self, action_id: str) -> float:
        """Calculate consensus score for a proposed action."""
        action_votes = [v for v in self.votes if v.action_id == action_id]
        if not action_votes:
            return 0.0
        
        approval_count = sum(1 for v in action_votes if v.approval)
        return approval_count / len(action_votes)
    
    def get_high_consensus_actions(self) -> List[Action]:
        """Get actions that have reached consensus threshold."""
        consensus_actions = []
        for action in self.proposed_actions:
            score = self.get_consensus_score(action.id)
            if score >= self.consensus_threshold:
                action.consensus_score = score
                consensus_actions.append(action)
        return consensus_actions
    
    def to_json(self) -> str:
        """Serialize state to JSON."""
        def convert_to_dict(obj):
            if hasattr(obj, '__dataclass_fields__'):
                result = {}
                for field_name, field_def in obj.__dataclass_fields__.items():
                    value = getattr(obj, field_name)
                    if isinstance(value, datetime):
                        result[field_name] = value.isoformat()
                    elif isinstance(value, (Severity, IssueCategory, ActionType)):
                        result[field_name] = value.value
                    elif isinstance(value, list):
                        result[field_name] = [convert_to_dict(item) for item in value]
                    else:
                        result[field_name] = value
                return result
            return obj
        
        return json.dumps(convert_to_dict(self), indent=2)


@dataclass
class ReviewResult:
    """Final result of the multi-agent review process."""
    summary: str
    total_findings: int
    critical_findings: int
    high_priority_findings: int
    approved_actions: List[Action] = field(default_factory=list)
    rejected_actions: List[Action] = field(default_factory=list)
    agent_reports: List[AgentReport] = field(default_factory=list)
    execution_time_seconds: float = 0.0
    timestamp: datetime = field(default_factory=datetime.now)
    
    def save_to_file(self, file_path: Path) -> None:
        """Save the review result to a file."""
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump({
                'summary': self.summary,
                'total_findings': self.total_findings,
                'critical_findings': self.critical_findings,
                'high_priority_findings': self.high_priority_findings,
                'approved_actions_count': len(self.approved_actions),
                'rejected_actions_count': len(self.rejected_actions),
                'execution_time_seconds': self.execution_time_seconds,
                'timestamp': self.timestamp.isoformat(),
                'detailed_report': 'See console output for detailed findings'
            }, f, indent=2)