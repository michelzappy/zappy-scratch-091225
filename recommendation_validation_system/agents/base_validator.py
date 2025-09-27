"""
Base class for validation agents.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from pathlib import Path
import re
import json

from ..models import ValidationState, AgentReport, AgentFinding


class BaseValidationAgent(ABC):
    """Base class for all validation agents"""
    
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        
    @abstractmethod
    def validate(self, state: ValidationState, codebase_root: Path) -> AgentReport:
        """
        Execute validation logic and return a report.
        
        Args:
            state: Shared validation state
            codebase_root: Root path of the codebase
            
        Returns:
            AgentReport with findings and recommendations
        """
        pass
        
    def challenge_assumption(self, assumption: str, evidence: List[str]) -> Dict[str, Any]:
        """Helper method for challenging recommendations"""
        return {
            "challenged_assumption": assumption,
            "counter_evidence": evidence,
            "confidence": self._calculate_challenge_confidence(evidence)
        }
        
    def _calculate_challenge_confidence(self, evidence: List[str]) -> float:
        """Calculate confidence based on evidence strength"""
        # Simple heuristic - more sophisticated logic would analyze evidence quality
        base_score = min(len(evidence) * 2.0, 8.0)
        # Bonus for concrete metrics or specific examples
        if any('metric' in e.lower() or '%' in e for e in evidence):
            base_score += 1.0
        if any('example' in e.lower() or 'file:' in e.lower() for e in evidence):
            base_score += 1.0
        return min(base_score, 10.0)
    
    def analyze_file_structure(self, root: Path, pattern: str = "**/*") -> Dict[str, int]:
        """Analyze file structure and return counts by extension"""
        file_counts = {}
        for file_path in root.glob(pattern):
            if file_path.is_file():
                ext = file_path.suffix.lower()
                file_counts[ext] = file_counts.get(ext, 0) + 1
        return file_counts
    
    def find_patterns_in_files(self, root: Path, pattern: str, file_pattern: str = "**/*.js") -> List[Dict[str, Any]]:
        """Find regex patterns in files"""
        matches = []
        for file_path in root.glob(file_pattern):
            if file_path.is_file():
                try:
                    content = file_path.read_text()
                    for match in re.finditer(pattern, content, re.MULTILINE):
                        line_num = content[:match.start()].count('\n') + 1
                        matches.append({
                            'file': str(file_path.relative_to(root)),
                            'line': line_num,
                            'match': match.group(0),
                            'context': self._get_context(content, match.start(), match.end())
                        })
                except Exception as e:
                    # Skip files that can't be read
                    continue
        return matches
    
    def _get_context(self, content: str, start: int, end: int, context_lines: int = 2) -> str:
        """Get context around a match"""
        lines = content.split('\n')
        match_line = content[:start].count('\n')
        start_line = max(0, match_line - context_lines)
        end_line = min(len(lines), match_line + context_lines + 1)
        return '\n'.join(lines[start_line:end_line])
    
    def check_dependency_exists(self, package_json_path: Path, dependency: str) -> bool:
        """Check if a dependency exists in package.json"""
        if not package_json_path.exists():
            return False
        try:
            with open(package_json_path) as f:
                package_data = json.load(f)
            deps = package_data.get('dependencies', {})
            dev_deps = package_data.get('devDependencies', {})
            return dependency in deps or dependency in dev_deps
        except Exception:
            return False
    
    def assess_code_quality_metrics(self, root: Path) -> Dict[str, Any]:
        """Assess basic code quality metrics"""
        metrics = {
            'total_files': 0,
            'total_lines': 0,
            'avg_file_size': 0,
            'max_file_size': 0,
            'has_tests': False,
            'has_documentation': False,
            'has_linting': False,
            'has_typescript': False
        }
        
        file_sizes = []
        for file_path in root.rglob('*.js'):
            if 'node_modules' not in str(file_path):
                try:
                    content = file_path.read_text()
                    lines = len(content.split('\n'))
                    file_sizes.append(lines)
                    metrics['total_files'] += 1
                    metrics['total_lines'] += lines
                except Exception:
                    continue
        
        if file_sizes:
            metrics['avg_file_size'] = sum(file_sizes) / len(file_sizes)
            metrics['max_file_size'] = max(file_sizes)
        
        # Check for common indicators
        metrics['has_tests'] = any(root.rglob('*.test.js')) or any(root.rglob('*.spec.js'))
        metrics['has_documentation'] = (root / 'README.md').exists() or any(root.rglob('*.md'))
        metrics['has_linting'] = (root / '.eslintrc.js').exists() or (root / '.eslintrc.json').exists()
        metrics['has_typescript'] = (root / 'tsconfig.json').exists()
        
        return metrics
    
    def create_finding(
        self,
        title: str,
        description: str,
        severity: str = "medium",
        category: str = "general",
        file_path: Optional[str] = None,
        line_number: Optional[int] = None,
        recommendation: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> AgentFinding:
        """Helper to create a finding"""
        return AgentFinding(
            title=title,
            description=description,
            severity=severity,
            category=category,
            file_path=file_path,
            line_number=line_number,
            recommendation=recommendation,
            tags=tags or []
        )
