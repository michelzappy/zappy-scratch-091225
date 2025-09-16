"""Command line interface for running the review orchestrator."""

from __future__ import annotations

import argparse
from pathlib import Path

from .orchestrator import ReviewOrchestrator


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the multi-agent review workflow")
    parser.add_argument(
        "--root",
        type=Path,
        default=Path.cwd(),
        help="Path to the repository root (defaults to current working directory)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Optional path to write the markdown report",
    )
    parser.add_argument(
        "--list-agents",
        action="store_true",
        help="List configured agents and exit",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    orchestrator = ReviewOrchestrator(args.root)

    if args.list_agents:
        for name in orchestrator.agent_names():
            print(name)
        return

    report, _state = orchestrator.run()
    print(report)

    if args.output:
        args.output.write_text(report, encoding="utf-8")


if __name__ == "__main__":
    main()
