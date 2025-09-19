"""Frontend Troubleshooting Orchestrator - Coordinates all agents."""

from pathlib import Path
from typing import List, Dict, Any, Optional
import json
from datetime import datetime

from .models import SharedState, RepositoryContext, FrontendIssue, IssueSeverity
from .agents import (
    UICompletenessAgent,
    FlowNavigatorAgent,
    APIConnectionAgent,
    ComponentConsistencyAgent,
    StateManagementAgent,
    UserFeedbackAgent,
    RouteGuardianAgent
)


class FrontendOrchestrator:
    """Coordinates the frontend troubleshooting multi-agent workflow."""
    
    def __init__(self, root_path: Path, agents: Optional[List] = None):
        self.root_path = Path(root_path)
        self.context = RepositoryContext(root=self.root_path, frontend_path=self.root_path / "frontend")
        self.state = SharedState()
        
        # Initialize agents in order of dependency
        self.agents = agents or self._default_agents()
        
    def _default_agents(self) -> List:
        """Get the default set of agents in optimal execution order."""
        return [
            # Foundation agents (provide data for others)
            FlowNavigatorAgent(),          # Maps navigation first
            APIConnectionAgent(),         # Scans API endpoints
            
            # Analysis agents (use foundation data)
            UICompletenessAgent(),         # Checks UI completeness
            ComponentConsistencyAgent(),   # Analyzes component patterns
            StateManagementAgent(),        # Reviews state handling
            UserFeedbackAgent(),           # Checks user feedback
            RouteGuardianAgent(),          # Validates routes & security
        ]
    
    def run_analysis(self) -> Dict[str, Any]:
        """Run the complete frontend analysis."""
        print(f"🚀 Starting Frontend Troubleshooting Analysis...")
        print(f"📂 Root: {self.root_path}")
        print(f"🔍 Agents: {len(self.agents)}")
        
        analysis_start = datetime.now()
        
        # Execute agents in sequence
        for i, agent in enumerate(self.agents, 1):
            print(f"\n[{i}/{len(self.agents)}] Running {agent.name}...")
            
            try:
                result = agent.analyze(self.context, self.state)
                self.state.record_result(result)
                
                # Process any messages from this agent
                self._process_agent_messages(result)
                
                print(f"  ✅ Found {len(result.issues)} issues")
                
            except Exception as e:
                print(f"  ❌ Error in {agent.name}: {str(e)}")
                continue
        
        analysis_duration = datetime.now() - analysis_start
        
        # Generate comprehensive report
        report = self._generate_report(analysis_duration)
        
        return report
    
    def _process_agent_messages(self, result) -> None:
        """Process messages sent by agents to enable collaboration."""
        for message in result.messages:
            # Handle different message types
            if message.message_type == 'alert':
                print(f"  🚨 {message.from_agent}: {message.data.get('message', 'Alert')}")
            elif message.message_type == 'coordinate':
                print(f"  🤝 {message.from_agent} requests coordination on: {message.issue.title if message.issue else 'general'}")
    
    def _generate_report(self, duration) -> Dict[str, Any]:
        """Generate a comprehensive analysis report."""
        all_issues = self.state.all_issues()
        critical_issues = self.state.critical_issues()
        
        # Categorize issues
        issues_by_severity = self._categorize_by_severity(all_issues)
        issues_by_type = self._categorize_by_type(all_issues)
        issues_by_agent = self._categorize_by_agent(all_issues)
        
        # Generate summary statistics
        stats = self._generate_statistics()
        
        # Create action plan
        action_plan = self._generate_action_plan(all_issues)
        
        report = {
            'summary': {
                'total_issues': len(all_issues),
                'critical_issues': len(critical_issues),
                'analysis_duration': str(duration),
                'agents_run': len(self.agents),
                'files_analyzed': stats.get('files_analyzed', 0),
            },
            'issues_by_severity': issues_by_severity,
            'issues_by_type': issues_by_type,
            'issues_by_agent': issues_by_agent,
            'critical_issues': [issue.to_dict() for issue in critical_issues],
            'action_plan': action_plan,
            'statistics': stats,
            'all_issues': [issue.to_dict() for issue in all_issues]
        }
        
        return report
    
    def _categorize_by_severity(self, issues: List[FrontendIssue]) -> Dict[str, List[Dict]]:
        """Categorize issues by severity level."""
        categories = {
            'critical': [],
            'high': [],
            'medium': [],
            'low': []
        }
        
        for issue in issues:
            categories[issue.severity.value].append(issue.to_dict())
            
        return categories
    
    def _categorize_by_type(self, issues: List[FrontendIssue]) -> Dict[str, List[Dict]]:
        """Categorize issues by type."""
        categories = {}
        
        for issue in issues:
            issue_type = issue.type.value
            if issue_type not in categories:
                categories[issue_type] = []
            categories[issue_type].append(issue.to_dict())
            
        return categories
    
    def _categorize_by_agent(self, issues: List[FrontendIssue]) -> Dict[str, List[Dict]]:
        """Categorize issues by the agent that found them."""
        categories = {}
        
        for issue in issues:
            agent = issue.agent
            if agent not in categories:
                categories[agent] = []
            categories[agent].append(issue.to_dict())
            
        return categories
    
    def _generate_statistics(self) -> Dict[str, Any]:
        """Generate analysis statistics."""
        stats = {}
        
        # Count files analyzed
        total_files = 0
        for result in self.state.agents_results.values():
            total_files += result.artifacts.get('total_pages_analyzed', 0)
        
        stats['files_analyzed'] = total_files
        
        # Navigation statistics
        if 'Flow Navigator Agent' in self.state.agents_results:
            nav_result = self.state.agents_results['Flow Navigator Agent']
            nav_map = nav_result.artifacts.get('navigation_map', {})
            stats['total_routes'] = len(nav_map)
            stats['protected_routes'] = sum(1 for route_data in nav_map.values() 
                                          if route_data.get('is_protected', False))
        
        # API statistics
        if 'API Connection Agent' in self.state.agents_results:
            api_result = self.state.agents_results['API Connection Agent']
            stats['backend_endpoints'] = len(api_result.artifacts.get('backend_endpoints', []))
        
        return stats
    
    def _generate_action_plan(self, issues: List[FrontendIssue]) -> Dict[str, Any]:
        """Generate an action plan for fixing issues."""
        plan = {
            'immediate_actions': [],    # Critical issues
            'short_term_actions': [],   # High priority issues
            'long_term_actions': [],    # Medium/Low priority issues
        }
        
        for issue in issues:
            action_item = {
                'title': issue.title,
                'description': issue.description,
                'suggested_fix': issue.suggested_fix,
                'file_path': issue.file_path,
                'severity': issue.severity.value,
                'tags': issue.tags
            }
            
            if issue.severity == IssueSeverity.CRITICAL:
                plan['immediate_actions'].append(action_item)
            elif issue.severity == IssueSeverity.HIGH:
                plan['short_term_actions'].append(action_item)
            else:
                plan['long_term_actions'].append(action_item)
        
        return plan
    
    def export_report(self, report: Dict[str, Any], output_path: Optional[Path] = None) -> Path:
        """Export the report to a file."""
        if output_path is None:
            output_path = self.root_path / "frontend_analysis_report.json"
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"\n📊 Report exported to: {output_path}")
        return output_path
    
    def print_summary(self, report: Dict[str, Any]) -> None:
        """Print a summary of the analysis results."""
        summary = report['summary']
        
        print(f"\n" + "="*60)
        print(f"🎯 FRONTEND ANALYSIS SUMMARY")
        print(f"="*60)
        print(f"📁 Files Analyzed: {summary.get('files_analyzed', 'N/A')}")
        print(f"⏱️  Duration: {summary['analysis_duration']}")
        print(f"🤖 Agents Run: {summary['agents_run']}")
        print(f"\n📊 ISSUES FOUND:")
        print(f"  🔴 Critical: {len(report['issues_by_severity']['critical'])}")
        print(f"  🟠 High:     {len(report['issues_by_severity']['high'])}")
        print(f"  🟡 Medium:   {len(report['issues_by_severity']['medium'])}")
        print(f"  🔵 Low:      {len(report['issues_by_severity']['low'])}")
        print(f"  📈 Total:    {summary['total_issues']}")
        
        # Show critical issues if any
        if report['issues_by_severity']['critical']:
            print(f"\n🚨 CRITICAL ISSUES:")
            for issue in report['issues_by_severity']['critical'][:5]:  # Show top 5
                print(f"  • {issue['title']} ({issue['file_path']})")
            if len(report['issues_by_severity']['critical']) > 5:
                print(f"  ... and {len(report['issues_by_severity']['critical']) - 5} more")
        
        print(f"\n💡 Next steps: Check the detailed report for specific fixes")
        print(f"="*60)
