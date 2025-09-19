"""Command Line Interface for Frontend Troubleshooting Agents."""

import argparse
import sys
from pathlib import Path
from .orchestrator import FrontendOrchestrator


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Frontend Troubleshooting Multi-Agent System",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python -m frontend_agents                    # Analyze current directory
  python -m frontend_agents --root /path/to/project
  python -m frontend_agents --output report.json
  python -m frontend_agents --quiet           # Minimal output
        """
    )
    
    parser.add_argument(
        "--root", 
        type=Path,
        default=Path.cwd(),
        help="Root directory of the project (default: current directory)"
    )
    
    parser.add_argument(
        "--output", "-o",
        type=Path,
        help="Output path for the analysis report (default: frontend_analysis_report.json)"
    )
    
    parser.add_argument(
        "--quiet", "-q",
        action="store_true",
        help="Minimal output - only show summary"
    )
    
    parser.add_argument(
        "--list-agents",
        action="store_true", 
        help="List all available agents and exit"
    )
    
    args = parser.parse_args()
    
    # Initialize orchestrator
    try:
        orchestrator = FrontendOrchestrator(args.root)
    except Exception as e:
        print(f"❌ Error initializing orchestrator: {e}")
        sys.exit(1)
    
    # Handle list agents command
    if args.list_agents:
        print("Available Frontend Troubleshooting Agents:")
        print("=" * 45)
        for i, agent in enumerate(orchestrator.agents, 1):
            print(f"{i:2d}. {agent.name}")
            print(f"    {agent.description}")
        return
    
    # Check if frontend directory exists
    frontend_path = args.root / "frontend"
    if not frontend_path.exists():
        print(f"❌ No frontend directory found at {frontend_path}")
        print("   Make sure you're running this from the project root")
        sys.exit(1)
    
    if not args.quiet:
        print("🔧 Frontend Troubleshooting Multi-Agent System")
        print(f"📁 Analyzing: {args.root}")
        print(f"🎯 Frontend: {frontend_path}")
        
    try:
        # Run the analysis
        if args.quiet:
            # Redirect output to suppress agent progress messages
            import io
            from contextlib import redirect_stdout
            
            f = io.StringIO()
            with redirect_stdout(f):
                report = orchestrator.run_analysis()
        else:
            report = orchestrator.run_analysis()
        
        # Export report
        output_path = args.output or (args.root / "frontend_analysis_report.json")
        orchestrator.export_report(report, output_path)
        
        # Print summary
        orchestrator.print_summary(report)
        
        # Exit with appropriate code
        critical_count = len(report['issues_by_severity']['critical'])
        high_count = len(report['issues_by_severity']['high']) 
        
        if critical_count > 0:
            sys.exit(2)  # Critical issues found
        elif high_count > 0:
            sys.exit(1)  # High priority issues found
        else:
            sys.exit(0)  # Success
            
    except KeyboardInterrupt:
        print("\n❌ Analysis interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        if not args.quiet:
            import traceback
            traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
