"""Patient Portal UX Review Orchestrator."""

from __future__ import annotations

import time
from pathlib import Path
from typing import List, Optional

from .agents import (
    AccessibilityAgent,
    InterfaceConsistencyAgent,
    PatientJourneyAgent,
    MobileResponsivenessAgent,
    UXFlowAgent
)
from .base_agent import BaseUXAgent, SafetyConstraintViolation
from .models import SharedState, ReviewResult, AgentVote, Severity
from .repository import RepositoryContext


class PatientPortalUXOrchestrator:
    """Orchestrates the multi-agent patient portal UX review process."""
    
    def __init__(self, repository_root: Path, agents: Optional[List[BaseUXAgent]] = None):
        self.repository_root = Path(repository_root)
        self.context = RepositoryContext(self.repository_root)
        self.agents = agents or self._create_default_agents()
        self.shared_state = SharedState()
        
        # Safety validation
        self._validate_repository_structure()
    
    def _create_default_agents(self) -> List[BaseUXAgent]:
        """Create the default set of UX review agents."""
        return [
            UXFlowAgent(),
            AccessibilityAgent(),
            MobileResponsivenessAgent(),
            PatientJourneyAgent(),
            InterfaceConsistencyAgent()
        ]
    
    def _validate_repository_structure(self) -> None:
        """Validate that the repository has the expected structure."""
        required_paths = [
            'frontend/src/app/patient',
            'frontend/src/components'
        ]
        
        missing_paths = []
        for path in required_paths:
            if not (self.repository_root / path).exists():
                missing_paths.append(path)
        
        if missing_paths:
            print(f"⚠️  Warning: Missing expected paths: {', '.join(missing_paths)}")
            print("   The review will continue but some analyses may be limited.")
    
    def run_review(self) -> ReviewResult:
        """Run the complete multi-agent UX review process."""
        print("🚀 Starting Patient Portal UX Review")
        print(f"📁 Repository: {self.repository_root}")
        print(f"🤖 Agents: {len(self.agents)}")
        print("-" * 60)
        
        start_time = time.time()
        
        try:
            # Phase 1: Independent Analysis
            print("\n📋 Phase 1: Independent Analysis")
            self._run_independent_analysis()
            
            # Phase 2: Cross-Agent Validation
            print("\n🤝 Phase 2: Cross-Agent Validation")
            self._run_cross_validation()
            
            # Phase 3: Consensus Building
            print("\n🗳️  Phase 3: Consensus Building")
            self._build_consensus()
            
            # Phase 4: Action Coordination
            print("\n⚡ Phase 4: Action Coordination")
            approved_actions, rejected_actions = self._coordinate_actions()
            
            # Generate final report
            execution_time = time.time() - start_time
            result = self._generate_final_result(approved_actions, rejected_actions, execution_time)
            
            print(f"\n✅ Review completed in {execution_time:.2f} seconds")
            self._print_summary(result)
            
            return result
            
        except Exception as e:
            print(f"\n❌ Review failed: {e}")
            raise
    
    def _run_independent_analysis(self) -> None:
        """Run independent analysis by each agent."""
        for agent in self.agents:
            try:
                print(f"   Running {agent.name}...")
                agent.execute(self.context, self.shared_state)
            except SafetyConstraintViolation as e:
                print(f"   ⚠️  Safety violation in {agent.name}: {e}")
            except Exception as e:
                print(f"   ❌ Error in {agent.name}: {e}")
        
        total_findings = len(self.shared_state.findings)
        critical_findings = len([f for f in self.shared_state.findings if f.severity == Severity.CRITICAL])
        high_findings = len([f for f in self.shared_state.findings if f.severity == Severity.HIGH])
        
        print(f"   📊 Total findings: {total_findings} ({critical_findings} critical, {high_findings} high)")
    
    def _run_cross_validation(self) -> None:
        """Run cross-validation between agents."""
        print("   🔍 Agents reviewing each other's findings...")
        
        # Let each agent review findings from other agents
        for reviewing_agent in self.agents:
            for finding in self.shared_state.findings:
                if finding.agent_name != reviewing_agent.name:
                    # Agent can comment or validate findings from other agents
                    # This is a simplified implementation - could be more sophisticated
                    pass
        
        # Look for consensus on critical issues
        critical_findings = [f for f in self.shared_state.findings if f.severity == Severity.CRITICAL]
        if critical_findings:
            print(f"   🚨 {len(critical_findings)} critical issues require immediate attention")
        
        # Identify overlapping findings (multiple agents found similar issues)
        overlapping_issues = self._find_overlapping_findings()
        if overlapping_issues:
            print(f"   🔄 {len(overlapping_issues)} issues confirmed by multiple agents")
    
    def _find_overlapping_findings(self) -> List:
        """Find findings that multiple agents have identified in similar areas."""
        overlapping = []
        
        # Group findings by file and look for similar issues
        file_groups = {}
        for finding in self.shared_state.findings:
            if finding.file_path not in file_groups:
                file_groups[finding.file_path] = []
            file_groups[finding.file_path].append(finding)
        
        for file_path, findings in file_groups.items():
            if len(findings) > 1:
                # Look for findings with similar descriptions or categories
                for i, finding1 in enumerate(findings):
                    for finding2 in findings[i+1:]:
                        if (finding1.category == finding2.category and 
                            self._similar_descriptions(finding1.description, finding2.description)):
                            overlapping.append((finding1, finding2))
        
        return overlapping
    
    def _similar_descriptions(self, desc1: str, desc2: str) -> bool:
        """Check if two descriptions are similar (simplified implementation)."""
        # Simple word overlap check
        words1 = set(desc1.lower().split())
        words2 = set(desc2.lower().split())
        
        if len(words1) == 0 or len(words2) == 0:
            return False
        
        overlap = len(words1.intersection(words2))
        total = len(words1.union(words2))
        
        return overlap / total > 0.3  # 30% word overlap threshold
    
    def _build_consensus(self) -> None:
        """Build consensus on proposed actions."""
        if not self.shared_state.proposed_actions:
            print("   📝 No actions proposed")
            return
        
        print(f"   🗳️  Voting on {len(self.shared_state.proposed_actions)} proposed actions...")
        
        # Each agent votes on each proposed action
        for action in self.shared_state.proposed_actions:
            for agent in self.agents:
                if agent.name != action.agent_name:  # Don't vote on your own actions
                    try:
                        approval = agent.vote_on_action(action, self.shared_state)
                        reasoning = f"Action aligns with {agent.name} expertise" if approval else f"Outside {agent.name} expertise or concerns about safety/quality"
                        
                        vote = AgentVote(
                            agent_name=agent.name,
                            action_id=action.id,
                            approval=approval,
                            reasoning=reasoning
                        )
                        
                        self.shared_state.add_vote(vote)
                    except Exception as e:
                        print(f"     ⚠️  Error getting vote from {agent.name}: {e}")
        
        # Calculate consensus scores
        consensus_actions = self.shared_state.get_high_consensus_actions()
        print(f"   ✅ {len(consensus_actions)} actions reached consensus (≥{self.shared_state.consensus_threshold:.0%} approval)")
    
    def _coordinate_actions(self) -> tuple[List, List]:
        """Coordinate and approve actions based on consensus."""
        approved_actions = []
        rejected_actions = []
        
        consensus_actions = self.shared_state.get_high_consensus_actions()
        
        for action in self.shared_state.proposed_actions:
            if action in consensus_actions:
                # Final safety check
                if self._final_safety_check(action):
                    approved_actions.append(action)
                    print(f"   ✅ Approved: {action.title}")
                else:
                    rejected_actions.append(action)
                    print(f"   ❌ Rejected (safety): {action.title}")
            else:
                rejected_actions.append(action)
                consensus_score = self.shared_state.get_consensus_score(action.id)
                print(f"   ❌ Rejected (consensus {consensus_score:.0%}): {action.title}")
        
        return approved_actions, rejected_actions
    
    def _final_safety_check(self, action) -> bool:
        """Perform final safety validation on an action."""
        try:
            # Check that the action only modifies allowed files
            for agent in self.agents:
                if not agent.validate_action_safety(action):
                    return False
            
            # Additional safety checks
            if 'backend' in action.description.lower():
                return False
            
            if 'api' in action.description.lower() and 'ui' not in action.description.lower():
                return False
            
            return True
            
        except Exception:
            return False
    
    def _generate_final_result(self, approved_actions: List, rejected_actions: List, execution_time: float) -> ReviewResult:
        """Generate the final review result."""
        total_findings = len(self.shared_state.findings)
        critical_findings = len([f for f in self.shared_state.findings if f.severity == Severity.CRITICAL])
        high_findings = len([f for f in self.shared_state.findings if f.severity == Severity.HIGH])
        
        # Generate summary
        summary_parts = []
        summary_parts.append(f"Patient Portal UX Review completed with {total_findings} findings.")
        
        if critical_findings > 0:
            summary_parts.append(f"{critical_findings} critical issues require immediate attention.")
        
        if high_findings > 0:
            summary_parts.append(f"{high_findings} high-priority issues should be addressed soon.")
        
        summary_parts.append(f"{len(approved_actions)} improvement actions were approved by consensus.")
        
        if rejected_actions:
            summary_parts.append(f"{len(rejected_actions)} actions were rejected due to low consensus or safety concerns.")
        
        summary = " ".join(summary_parts)
        
        return ReviewResult(
            summary=summary,
            total_findings=total_findings,
            critical_findings=critical_findings,
            high_priority_findings=high_findings,
            approved_actions=approved_actions,
            rejected_actions=rejected_actions,
            agent_reports=self.shared_state.agent_reports,
            execution_time_seconds=execution_time
        )
    
    def _print_summary(self, result: ReviewResult) -> None:
        """Print a summary of the review results."""
        print("\n" + "=" * 60)
        print("📊 PATIENT PORTAL UX REVIEW SUMMARY")
        print("=" * 60)
        
        print(f"\n📋 FINDINGS:")
        print(f"   Total: {result.total_findings}")
        print(f"   Critical: {result.critical_findings}")
        print(f"   High Priority: {result.high_priority_findings}")
        
        print(f"\n⚡ ACTIONS:")
        print(f"   Approved: {len(result.approved_actions)}")
        print(f"   Rejected: {len(result.rejected_actions)}")
        
        print(f"\n🕐 PERFORMANCE:")
        print(f"   Execution Time: {result.execution_time_seconds:.2f} seconds")
        print(f"   Agents: {len(result.agent_reports)}")
        
        # Show critical findings
        if result.critical_findings > 0:
            print(f"\n🚨 CRITICAL ISSUES:")
            critical_findings = [f for f in self.shared_state.findings if f.severity == Severity.CRITICAL][:5]
            for finding in critical_findings:
                print(f"   • {finding.title} ({finding.agent_name})")
                print(f"     {finding.file_path}")
        
        # Show approved actions
        if result.approved_actions:
            print(f"\n✅ APPROVED ACTIONS:")
            for action in result.approved_actions[:5]:  # Show first 5
                consensus_score = self.shared_state.get_consensus_score(action.id)
                print(f"   • {action.title} (consensus: {consensus_score:.0%})")
                print(f"     {action.description[:80]}...")
        
        print("\n" + "=" * 60)
    
    def save_detailed_report(self, output_path: Path) -> None:
        """Save a detailed report to a file."""
        report_content = []
        
        report_content.append("# Patient Portal UX Review Report")
        report_content.append(f"Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        report_content.append(f"Repository: {self.repository_root}")
        report_content.append("")
        
        # Agent reports
        report_content.append("## Agent Reports")
        for report in self.shared_state.agent_reports:
            report_content.append(f"\n### {report.agent_name}")
            report_content.append(f"**Description:** {report.description}")
            report_content.append(f"**Files Analyzed:** {report.files_analyzed}")
            report_content.append(f"**Execution Time:** {report.execution_time_seconds:.2f}s")
            report_content.append(f"**Findings:** {len(report.findings)}")
            report_content.append(f"**Proposed Actions:** {len(report.proposed_actions)}")
        
        # Detailed findings
        report_content.append("\n## Detailed Findings")
        
        for severity in [Severity.CRITICAL, Severity.HIGH, Severity.MEDIUM, Severity.LOW]:
            severity_findings = [f for f in self.shared_state.findings if f.severity == severity]
            if severity_findings:
                report_content.append(f"\n### {severity.value.title()} Issues ({len(severity_findings)})")
                
                for finding in severity_findings:
                    report_content.append(f"\n#### {finding.title}")
                    report_content.append(f"**Agent:** {finding.agent_name}")
                    report_content.append(f"**File:** `{finding.file_path}`")
                    if finding.line_number:
                        report_content.append(f"**Line:** {finding.line_number}")
                    report_content.append(f"**Category:** {finding.category.value}")
                    report_content.append(f"**Description:** {finding.description}")
                    
                    if finding.recommendations:
                        report_content.append("**Recommendations:**")
                        for rec in finding.recommendations:
                            report_content.append(f"- {rec}")
        
        # Actions
        approved_actions = self.shared_state.get_high_consensus_actions()
        if approved_actions:
            report_content.append("\n## Approved Actions")
            for action in approved_actions:
                consensus_score = self.shared_state.get_consensus_score(action.id)
                report_content.append(f"\n### {action.title}")
                report_content.append(f"**Agent:** {action.agent_name}")
                report_content.append(f"**Type:** {action.action_type.value}")
                report_content.append(f"**Consensus:** {consensus_score:.0%}")
                report_content.append(f"**Description:** {action.description}")
                report_content.append(f"**File:** `{action.file_path}`")
                if action.estimated_impact:
                    report_content.append(f"**Expected Impact:** {action.estimated_impact}")
        
        # Write report
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(report_content))
        
        print(f"📄 Detailed report saved to: {output_path}")