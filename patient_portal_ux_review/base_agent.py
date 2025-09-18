"""Base agent class for patient portal UX review agents."""

from __future__ import annotations

import re
import time
import uuid
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Dict, List, Optional, Set

from .models import (
    Finding, Action, AgentReport, SharedState,
    Severity, IssueCategory, ActionType
)
from .repository import RepositoryContext


class SafetyConstraintViolation(Exception):
    """Raised when an agent attempts to violate safety constraints."""
    pass


class BaseUXAgent(ABC):
    """Base class for all patient portal UX review agents."""
    
    # Safety constraints - these are hard-coded and cannot be overridden
    FORBIDDEN_BACKEND_PATTERNS = [
        r'backend/',
        r'server\.js',
        r'app\.js',
        r'config/',
        r'middleware/',
        r'routes/',
        r'controllers/',
        r'models/',
        r'services/',
        r'database/',
        r'migrations/',
        r'seeds/',
        r'\.sql$',
        r'drizzle\.config',
        r'package\.json$'  # Backend package.json
    ]
    
    ALLOWED_FRONTEND_PATTERNS = [
        r'frontend/src/',
        r'\.tsx?$',
        r'\.css$',
        r'\.scss$',
        r'tailwind\.config',
        r'next\.config',
        r'tsconfig\.json$',
        r'postcss\.config'
    ]
    
    PATIENT_PORTAL_PATHS = [
        'frontend/src/app/patient/',
        'frontend/src/components/patient/',
        'frontend/src/components/PatientLayout.tsx'
    ]
    
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.findings: List[Finding] = []
        self.proposed_actions: List[Action] = []
    
    def validate_file_safety(self, file_path: str) -> bool:
        """Validate that a file is safe to analyze/modify."""
        file_path = file_path.replace('\\', '/')  # Normalize path separators
        
        # Check if file is in forbidden backend areas
        for pattern in self.FORBIDDEN_BACKEND_PATTERNS:
            if re.search(pattern, file_path):
                return False
        
        # Check if file is in allowed frontend areas
        for pattern in self.ALLOWED_FRONTEND_PATTERNS:
            if re.search(pattern, file_path):
                return True
        
        return False
    
    def validate_action_safety(self, action: Action) -> bool:
        """Validate that a proposed action is safe."""
        # Check file path safety
        if not self.validate_file_safety(action.file_path):
            return False
        
        # Ensure action is only UI/frontend related
        safe_action_types = {
            ActionType.UI_IMPROVEMENT,
            ActionType.COMPONENT_UPDATE,
            ActionType.STYLE_FIX,
            ActionType.ACCESSIBILITY_FIX,
            ActionType.RESPONSIVE_FIX
        }
        
        if action.action_type not in safe_action_types:
            return False
        
        # Check that description doesn't mention backend changes
        backend_keywords = [
            'api', 'endpoint', 'server', 'database', 'backend',
            'route', 'controller', 'service', 'migration'
        ]
        
        description_lower = action.description.lower()
        for keyword in backend_keywords:
            if keyword in description_lower:
                return False
        
        return True
    
    def create_finding(
        self,
        title: str,
        description: str,
        severity: Severity,
        category: IssueCategory,
        file_path: str,
        line_number: Optional[int] = None,
        code_snippet: Optional[str] = None,
        recommendations: Optional[List[str]] = None,
        tags: Optional[List[str]] = None
    ) -> Finding:
        """Create a new finding with safety validation."""
        if not self.validate_file_safety(file_path):
            raise SafetyConstraintViolation(
                f"Agent {self.name} attempted to create finding for forbidden file: {file_path}"
            )
        
        finding = Finding(
            id=str(uuid.uuid4()),
            agent_name=self.name,
            title=title,
            description=description,
            severity=severity,
            category=category,
            file_path=file_path,
            line_number=line_number,
            code_snippet=code_snippet,
            recommendations=recommendations or [],
            tags=tags or []
        )
        
        self.findings.append(finding)
        return finding
    
    def create_action(
        self,
        action_type: ActionType,
        title: str,
        description: str,
        file_path: str,
        finding_ids: Optional[List[str]] = None,
        estimated_impact: str = ""
    ) -> Action:
        """Create a new action with safety validation."""
        action = Action(
            id=str(uuid.uuid4()),
            agent_name=self.name,
            action_type=action_type,
            title=title,
            description=description,
            file_path=file_path,
            finding_ids=finding_ids or [],
            estimated_impact=estimated_impact
        )
        
        if not self.validate_action_safety(action):
            raise SafetyConstraintViolation(
                f"Agent {self.name} attempted to create unsafe action: {action.title}"
            )
        
        action.safety_check_passed = True
        self.proposed_actions.append(action)
        return action
    
    def analyze_patient_portal_file(self, context: RepositoryContext, file_path: Path) -> None:
        """Analyze a single patient portal file."""
        if not self.validate_file_safety(str(file_path)):
            return
        
        # Check if file is in patient portal area
        file_str = str(file_path).replace('\\', '/')
        is_patient_file = any(
            patient_path in file_str 
            for patient_path in self.PATIENT_PORTAL_PATHS
        )
        
        if not is_patient_file:
            return
        
        try:
            content = context.read_text(file_path)
            self.analyze_file_content(context, file_path, content)
        except Exception as e:
            # Log error but continue with other files
            print(f"Warning: Could not analyze {file_path}: {e}")
    
    @abstractmethod
    def analyze_file_content(
        self, 
        context: RepositoryContext, 
        file_path: Path, 
        content: str
    ) -> None:
        """Analyze the content of a specific file."""
        pass
    
    def execute(self, context: RepositoryContext, shared_state: SharedState) -> AgentReport:
        """Execute the agent's analysis."""
        start_time = time.time()
        
        print(f"🔍 {self.name} starting analysis...")
        
        # Find and analyze patient portal files
        patient_files = self.find_patient_portal_files(context)
        
        for file_path in patient_files:
            self.analyze_patient_portal_file(context, file_path)
        
        # Add findings and actions to shared state
        for finding in self.findings:
            shared_state.add_finding(finding)
        
        for action in self.proposed_actions:
            shared_state.add_action(action)
        
        # Create report
        execution_time = time.time() - start_time
        report = AgentReport(
            agent_name=self.name,
            description=self.description,
            findings=self.findings.copy(),
            proposed_actions=self.proposed_actions.copy(),
            execution_time_seconds=execution_time,
            files_analyzed=len(patient_files)
        )
        
        shared_state.agent_reports.append(report)
        
        print(f"✅ {self.name} completed: {len(self.findings)} findings, {len(self.proposed_actions)} actions")
        
        return report
    
    def find_patient_portal_files(self, context: RepositoryContext) -> List[Path]:
        """Find all patient portal related files."""
        patient_files = []
        
        # Look for patient portal files
        for pattern in ['**/*.tsx', '**/*.ts', '**/*.css', '**/*.scss']:
            for file_path in context.root.glob(pattern):
                if self.validate_file_safety(str(file_path)):
                    file_str = str(file_path).replace('\\', '/')
                    # Check if it's a patient portal file
                    if any(patient_path in file_str for patient_path in self.PATIENT_PORTAL_PATHS):
                        patient_files.append(file_path)
        
        return patient_files
    
    def vote_on_action(self, action: Action, shared_state: SharedState) -> bool:
        """Vote on whether to approve an action proposed by another agent."""
        # Default implementation - agents can override this
        # Base criteria: action must be safe and well-described
        if not action.safety_check_passed:
            return False
        
        if len(action.description) < 20:  # Too vague
            return False
        
        # Check if action aligns with this agent's expertise
        return self.is_action_relevant_to_expertise(action)
    
    @abstractmethod
    def is_action_relevant_to_expertise(self, action: Action) -> bool:
        """Check if an action is relevant to this agent's area of expertise."""
        pass
    
    def communicate_with_peers(self, shared_state: SharedState) -> Dict[str, str]:
        """Communicate findings with peer agents."""
        communications = {}
        
        # Share summary of findings with peer agents
        if self.findings:
            critical_count = sum(1 for f in self.findings if f.severity == Severity.CRITICAL)
            high_count = sum(1 for f in self.findings if f.severity == Severity.HIGH)
            
            communications['findings_summary'] = (
                f"{self.name} found {len(self.findings)} issues: "
                f"{critical_count} critical, {high_count} high priority"
            )
        
        # Highlight any urgent issues that need immediate attention
        urgent_findings = [
            f for f in self.findings 
            if f.severity in [Severity.CRITICAL, Severity.HIGH]
        ]
        
        if urgent_findings:
            communications['urgent_issues'] = (
                f"{self.name} identified {len(urgent_findings)} urgent issues requiring attention"
            )
        
        return communications