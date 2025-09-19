"""Command Line Interface for Patient Portal UX Review System."""

import argparse
import sys
from pathlib import Path
from typing import Optional

from .orchestrator import PatientPortalUXOrchestrator
from .models import ReviewResult


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Patient Portal UX Review System - Multi-agent cooperative UI/UX analysis",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run review on current directory
  python -m patient_portal_ux_review

  # Run review on specific repository
  python -m patient_portal_ux_review --repo /path/to/repo

  # Save detailed report
  python -m patient_portal_ux_review --output report.md

  # Run with specific agents only
  python -m patient_portal_ux_review --agents accessibility,mobile

Safety Constraints:
  - Never modifies backend code
  - Never creates new pages
  - Only analyzes and suggests frontend improvements
  - All agents enforce strict safety validation
        """
    )
    
    parser.add_argument(
        '--repo', '-r',
        type=str,
        default='.',
        help='Path to the repository root (default: current directory)'
    )
    
    parser.add_argument(
        '--output', '-o',
        type=str,
        help='Path to save detailed report (optional)'
    )
    
    parser.add_argument(
        '--agents', '-a',
        type=str,
        help='Comma-separated list of agents to run (ux_flow,accessibility,mobile,journey,consistency)'
    )
    
    parser.add_argument(
        '--consensus-threshold',
        type=float,
        default=0.6,
        help='Consensus threshold for action approval (default: 0.6)'
    )
    
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Enable verbose output'
    )
    
    parser.add_argument(
        '--version',
        action='version',
        version='Patient Portal UX Review System 1.0.0'
    )
    
    args = parser.parse_args()
    
    # Validate repository path
    repo_path = Path(args.repo).resolve()
    if not repo_path.exists():
        print(f"❌ Error: Repository path does not exist: {repo_path}")
        sys.exit(1)
    
    # Check if it looks like a valid repository
    if not (repo_path / 'frontend').exists():
        print(f"⚠️  Warning: Repository doesn't appear to have a frontend directory")
        print(f"   Path: {repo_path}")
        response = input("Continue anyway? (y/N): ")
        if response.lower() != 'y':
            print("Aborted.")
            sys.exit(0)
    
    try:
        # Create orchestrator
        orchestrator = PatientPortalUXOrchestrator(repo_path)
        
        # Configure consensus threshold
        orchestrator.shared_state.consensus_threshold = args.consensus_threshold
        
        # Filter agents if specified
        if args.agents:
            agent_names = [name.strip().lower() for name in args.agents.split(',')]
            filtered_agents = []
            
            agent_map = {
                'ux_flow': 'UXFlowAgent',
                'accessibility': 'AccessibilityAgent', 
                'mobile': 'MobileResponsivenessAgent',
                'journey': 'PatientJourneyAgent',
                'consistency': 'InterfaceConsistencyAgent'
            }
            
            for agent in orchestrator.agents:
                for requested_name, agent_class in agent_map.items():
                    if requested_name in agent_names and agent.__class__.__name__ == agent_class:
                        filtered_agents.append(agent)
                        break
            
            if not filtered_agents:
                print(f"❌ Error: No valid agents found. Available: {', '.join(agent_map.keys())}")
                sys.exit(1)
            
            orchestrator.agents = filtered_agents
            print(f"🎯 Running with selected agents: {[a.name for a in filtered_agents]}")
        
        # Run the review
        result = orchestrator.run_review()
        
        # Save detailed report if requested
        if args.output:
            output_path = Path(args.output)
            orchestrator.save_detailed_report(output_path)
        
        # Exit with appropriate code based on findings
        if result.critical_findings > 0:
            print(f"\n⚠️  Exiting with code 2 due to {result.critical_findings} critical findings")
            sys.exit(2)
        elif result.high_priority_findings > 0:
            print(f"\n⚠️  Exiting with code 1 due to {result.high_priority_findings} high-priority findings")
            sys.exit(1)
        else:
            print(f"\n✅ No critical or high-priority issues found")
            sys.exit(0)
            
    except KeyboardInterrupt:
        print(f"\n\n⚠️  Review interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n❌ Review failed with error: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        sys.exit(1)


def run_quick_check(repo_path: Optional[str] = None) -> ReviewResult:
    """
    Run a quick UX check without CLI - useful for programmatic access.
    
    Args:
        repo_path: Path to repository (defaults to current directory)
        
    Returns:
        ReviewResult object with findings and actions
    """
    path = Path(repo_path or '.').resolve()
    orchestrator = PatientPortalUXOrchestrator(path)
    return orchestrator.run_review()


if __name__ == '__main__':
    main()