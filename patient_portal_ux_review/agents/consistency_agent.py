"""Interface Consistency Agent for design system coherence and visual consistency."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional

from ..base_agent import BaseUXAgent
from ..models import ActionType, IssueCategory, Severity
from ..repository import RepositoryContext


class InterfaceConsistencyAgent(BaseUXAgent):
    """Agent that ensures design system coherence and visual consistency across the patient portal."""
    
    def __init__(self):
        super().__init__(
            name="Interface Consistency Agent",
            description="Ensures design system coherence, visual consistency, and component reuse across patient portal"
        )
        
        # Design system patterns to track
        self.design_tokens = {
            'colors': {
                'medical': ['medical-50', 'medical-100', 'medical-500', 'medical-600', 'medical-700'],
                'gray': ['gray-50', 'gray-100', 'gray-200', 'gray-300', 'gray-400', 'gray-500', 'gray-600', 'gray-700', 'gray-800', 'gray-900'],
                'status': ['red-', 'green-', 'yellow-', 'blue-'],
            },
            'spacing': ['p-', 'm-', 'space-', 'gap-'],
            'typography': ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl'],
            'borders': ['border-', 'rounded-'],
            'shadows': ['shadow-', 'drop-shadow-']
        }
        
        # Component patterns that should be consistent
        self.ui_components = {
            'buttons': {
                'patterns': [r'<button', r'Button'],
                'expected_classes': ['px-', 'py-', 'rounded-', 'font-', 'transition'],
                'variants': ['primary', 'secondary', 'outline', 'ghost']
            },
            'inputs': {
                'patterns': [r'<input', r'Input'],
                'expected_classes': ['border-', 'rounded-', 'px-', 'py-'],
                'states': ['focus:', 'hover:', 'disabled:']
            },
            'cards': {
                'patterns': [r'Card', r'card'],
                'expected_classes': ['bg-white', 'border', 'rounded-', 'shadow-', 'p-'],
                'variants': ['default', 'elevated', 'outlined']
            },
            'alerts': {
                'patterns': [r'Alert', r'alert', r'notification'],
                'expected_classes': ['border-', 'rounded-', 'p-'],
                'variants': ['success', 'error', 'warning', 'info']
            }
        }
        
        # Brand consistency patterns
        self.brand_patterns = {
            'logo': [r'TeleHealth', r'Zappy', r'Health'],
            'medical_colors': [r'medical-', r'blue-', r'green-'],
            'font_family': [r'font-sans', r'font-medium', r'font-semibold', r'font-bold'],
            'medical_icons': [r'medical', r'health', r'doctor', r'prescription']
        }
        
        # Inconsistency indicators
        self.inconsistency_patterns = [
            r'style=\{',  # Inline styles instead of classes
            r'#[0-9a-fA-F]{6}',  # Hardcoded hex colors
            r'px-\d+.*px-\d+',  # Multiple different paddings in same element
            r'text-\w+.*text-\w+',  # Multiple text sizes
        ]
        
        # Track usage across files
        self.usage_tracker = {
            'colors': {},
            'components': {},
            'spacing': {},
            'typography': {}
        }
    
    def analyze_file_content(
        self, 
        context: RepositoryContext, 
        file_path: Path, 
        content: str
    ) -> None:
        """Analyze file content for interface consistency issues."""
        if file_path.suffix == '.tsx':
            self._track_design_token_usage(file_path, content)
            self._check_component_consistency(file_path, content)
            self._check_brand_consistency(file_path, content)
            self._detect_inconsistencies(file_path, content)
            self._validate_component_structure(file_path, content)
    
    def _track_design_token_usage(self, file_path: Path, content: str) -> None:
        """Track usage of design tokens across files."""
        file_str = str(file_path)
        
        # Track color usage
        for color_category, colors in self.design_tokens['colors'].items():
            for color in colors:
                if color in content:
                    if color not in self.usage_tracker['colors']:
                        self.usage_tracker['colors'][color] = []
                    self.usage_tracker['colors'][color].append(file_str)
        
        # Track spacing usage
        spacing_patterns = [r'p-\d+', r'm-\d+', r'space-\w+-\d+', r'gap-\d+']
        for pattern in spacing_patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                if match not in self.usage_tracker['spacing']:
                    self.usage_tracker['spacing'][match] = []
                self.usage_tracker['spacing'][match].append(file_str)
        
        # Track typography usage
        typography_patterns = [r'text-\w+', r'font-\w+']
        for pattern in typography_patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                if match not in self.usage_tracker['typography']:
                    self.usage_tracker['typography'][match] = []
                self.usage_tracker['typography'][match].append(file_str)
    
    def _check_component_consistency(self, file_path: Path, content: str) -> None:
        """Check for consistent component patterns."""
        for component_name, component_info in self.ui_components.items():
            # Find component usage
            component_found = any(
                re.search(pattern, content, re.IGNORECASE) 
                for pattern in component_info['patterns']
            )
            
            if component_found:
                self._validate_component_classes(file_path, content, component_name, component_info)
                self._check_component_variants(file_path, content, component_name, component_info)
    
    def _validate_component_classes(
        self, 
        file_path: Path, 
        content: str, 
        component_name: str, 
        component_info: Dict
    ) -> None:
        """Validate that components use expected CSS classes."""
        lines = content.split('\n')
        
        for i, line in enumerate(lines, 1):
            # Check if line contains the component
            component_found = any(
                re.search(pattern, line, re.IGNORECASE) 
                for pattern in component_info['patterns']
            )
            
            if component_found and 'className' in line:
                # Check for expected classes
                missing_classes = []
                for expected_class in component_info['expected_classes']:
                    if not re.search(expected_class, line):
                        missing_classes.append(expected_class)
                
                if missing_classes:
                    self.create_finding(
                        title=f"{component_name.title()} component missing standard classes",
                        description=f"Component should include standard design system classes for consistency",
                        severity=Severity.MEDIUM,
                        category=IssueCategory.CONSISTENCY,
                        file_path=str(file_path),
                        line_number=i,
                        code_snippet=line.strip(),
                        recommendations=[
                            f"Add missing classes: {', '.join(missing_classes)}",
                            "Follow design system component patterns",
                            "Ensure visual consistency across components"
                        ],
                        tags=['component-consistency', 'design-system', component_name]
                    )
                
                # Check for interactive states if applicable
                if component_name in ['buttons', 'inputs'] and 'states' in component_info:
                    missing_states = []
                    for state in component_info['states']:
                        if not re.search(re.escape(state), line):
                            missing_states.append(state)
                    
                    if missing_states and len(missing_states) == len(component_info['states']):
                        self.create_finding(
                            title=f"{component_name.title()} component missing interactive states",
                            description="Interactive components should have hover, focus, and disabled states",
                            severity=Severity.MEDIUM,
                            category=IssueCategory.CONSISTENCY,
                            file_path=str(file_path),
                            line_number=i,
                            recommendations=[
                                f"Add interactive states: {', '.join(missing_states)}",
                                "Ensure consistent interactive behavior",
                                "Follow accessibility guidelines for states"
                            ],
                            tags=['interactive-states', 'consistency', component_name]
                        )
    
    def _check_component_variants(
        self, 
        file_path: Path, 
        content: str, 
        component_name: str, 
        component_info: Dict
    ) -> None:
        """Check for consistent component variant usage."""
        if 'variants' not in component_info:
            return
        
        # Look for variant usage patterns
        variant_usage = {}
        for variant in component_info['variants']:
            if variant in content.lower():
                variant_usage[variant] = True
        
        # If using variants, ensure they're used consistently
        if variant_usage:
            # This is a simplified check - in a real system you'd want more sophisticated variant detection
            lines = content.split('\n')
            for i, line in enumerate(lines, 1):
                if any(re.search(pattern, line, re.IGNORECASE) for pattern in component_info['patterns']):
                    # Check if variant classes are applied consistently
                    if 'variant' in line.lower() or any(v in line.lower() for v in component_info['variants']):
                        # Validate variant implementation
                        pass  # Placeholder for more detailed variant validation
    
    def _check_brand_consistency(self, file_path: Path, content: str) -> None:
        """Check for brand consistency across the patient portal."""
        # Check for consistent brand name usage
        brand_variations = re.findall(r'(telehealth|tele health|zappy|health)', content, re.IGNORECASE)
        if brand_variations:
            unique_variations = set(v.lower() for v in brand_variations)
            if len(unique_variations) > 1:
                self.create_finding(
                    title="Inconsistent brand name usage",
                    description="Brand name should be used consistently across the application",
                    severity=Severity.LOW,
                    category=IssueCategory.CONSISTENCY,
                    file_path=str(file_path),
                    recommendations=[
                        "Standardize brand name usage",
                        "Use consistent capitalization and spacing",
                        "Create brand guidelines for developers"
                    ],
                    tags=['brand-consistency', 'naming', 'visual-identity']
                )
        
        # Check for consistent medical color usage
        medical_colors = re.findall(r'(medical-\d+|blue-\d+|green-\d+)', content)
        if medical_colors:
            # Track color variety - too many different shades may indicate inconsistency
            unique_colors = set(medical_colors)
            if len(unique_colors) > 5:  # Arbitrary threshold
                self.create_finding(
                    title="Excessive color variety may reduce visual consistency",
                    description="Consider using fewer, more consistent color tokens",
                    severity=Severity.LOW,
                    category=IssueCategory.CONSISTENCY,
                    file_path=str(file_path),
                    recommendations=[
                        "Consolidate to primary brand colors",
                        "Create color palette guidelines",
                        "Use semantic color names"
                    ],
                    tags=['color-consistency', 'design-tokens', 'visual-hierarchy']
                )
    
    def _detect_inconsistencies(self, file_path: Path, content: str) -> None:
        """Detect inconsistency patterns in the code."""
        lines = content.split('\n')
        
        for i, line in enumerate(lines, 1):
            # Check for inline styles (should use Tailwind classes)
            if re.search(r'style=\{', line):
                self.create_finding(
                    title="Inline styles detected",
                    description="Use Tailwind CSS classes instead of inline styles for consistency",
                    severity=Severity.MEDIUM,
                    category=IssueCategory.CONSISTENCY,
                    file_path=str(file_path),
                    line_number=i,
                    code_snippet=line.strip(),
                    recommendations=[
                        "Convert inline styles to Tailwind classes",
                        "Use design system tokens",
                        "Maintain consistent styling approach"
                    ],
                    tags=['inline-styles', 'tailwind', 'consistency']
                )
            
            # Check for hardcoded hex colors
            hex_colors = re.findall(r'#[0-9a-fA-F]{6}', line)
            if hex_colors:
                self.create_finding(
                    title="Hardcoded hex colors detected",
                    description="Use design system color tokens instead of hardcoded colors",
                    severity=Severity.MEDIUM,
                    category=IssueCategory.CONSISTENCY,
                    file_path=str(file_path),
                    line_number=i,
                    code_snippet=line.strip(),
                    recommendations=[
                        "Replace with Tailwind color classes",
                        "Use semantic color tokens (medical-, gray-, etc.)",
                        "Ensure color consistency across components"
                    ],
                    tags=['hardcoded-colors', 'design-tokens', 'maintainability']
                )
            
            # Check for multiple conflicting classes
            padding_classes = re.findall(r'p[xy]?-\d+', line)
            if len(set(padding_classes)) > 2:  # More than 2 different padding classes
                self.create_finding(
                    title="Conflicting padding classes detected",
                    description="Multiple padding classes may cause unexpected layout behavior",
                    severity=Severity.LOW,
                    category=IssueCategory.CONSISTENCY,
                    file_path=str(file_path),
                    line_number=i,
                    code_snippet=line.strip(),
                    recommendations=[
                        "Use consistent padding approach",
                        "Avoid conflicting Tailwind classes",
                        "Review component spacing logic"
                    ],
                    tags=['conflicting-classes', 'tailwind', 'spacing']
                )
            
            # Check for multiple text size classes
            text_classes = re.findall(r'text-\w+', line)
            text_size_classes = [tc for tc in text_classes if re.match(r'text-(xs|sm|base|lg|xl|\d+xl)', tc)]
            if len(set(text_size_classes)) > 1:
                self.create_finding(
                    title="Multiple text size classes on same element",
                    description="Element has conflicting text size classes",
                    severity=Severity.MEDIUM,
                    category=IssueCategory.CONSISTENCY,
                    file_path=str(file_path),
                    line_number=i,
                    code_snippet=line.strip(),
                    recommendations=[
                        "Use only one text size class per element",
                        "Review typography hierarchy",
                        "Ensure consistent text scaling"
                    ],
                    tags=['conflicting-classes', 'typography', 'consistency']
                )
    
    def _validate_component_structure(self, file_path: Path, content: str) -> None:
        """Validate consistent component structure and naming."""
        # Check for component naming consistency
        component_declarations = re.findall(r'function\s+(\w+Component|\w+Page|\w+Layout)', content)
        component_exports = re.findall(r'export\s+default\s+(\w+)', content)
        
        # Check for consistent naming patterns
        if component_declarations or component_exports:
            all_components = component_declarations + component_exports
            
            # Check naming conventions
            inconsistent_naming = []
            for comp_name in all_components:
                if not re.match(r'^[A-Z][a-zA-Z0-9]*$', comp_name):  # PascalCase
                    inconsistent_naming.append(comp_name)
            
            if inconsistent_naming:
                self.create_finding(
                    title="Inconsistent component naming",
                    description="Components should follow PascalCase naming convention",
                    severity=Severity.LOW,
                    category=IssueCategory.CONSISTENCY,
                    file_path=str(file_path),
                    recommendations=[
                        "Use PascalCase for component names",
                        "Follow React naming conventions",
                        "Maintain consistent naming across codebase"
                    ],
                    tags=['naming-convention', 'component-structure', 'consistency']
                )
        
        # Check for consistent import patterns
        import_lines = [line for line in content.split('\n') if line.strip().startswith('import')]
        if len(import_lines) > 5:  # Arbitrary threshold
            # Check for import organization
            react_imports = [line for line in import_lines if 'react' in line.lower()]
            local_imports = [line for line in import_lines if './' in line or '@/' in line]
            
            # Simple check: React imports should come first
            if react_imports and local_imports:
                first_react_line = next((i for i, line in enumerate(import_lines) if 'react' in line.lower()), -1)
                first_local_line = next((i for i, line in enumerate(import_lines) if './' in line or '@/' in line), -1)
                
                if first_local_line != -1 and first_react_line > first_local_line:
                    self.create_finding(
                        title="Import organization could be improved",
                        description="Consider organizing imports: React imports first, then local imports",
                        severity=Severity.LOW,
                        category=IssueCategory.CONSISTENCY,
                        file_path=str(file_path),
                        recommendations=[
                            "Organize imports: external libraries first, then local imports",
                            "Group related imports together",
                            "Consider using import sorting tools"
                        ],
                        tags=['import-organization', 'code-structure', 'consistency']
                    )
    
    def analyze_cross_file_consistency(self, context: RepositoryContext) -> None:
        """Analyze consistency patterns across multiple files."""
        # This would be called after all files are analyzed
        self._check_design_token_consistency()
        self._identify_component_reuse_opportunities()
    
    def _check_design_token_consistency(self) -> None:
        """Check for consistent usage of design tokens across files."""
        # Analyze color usage patterns
        color_usage = self.usage_tracker['colors']
        
        # Find colors used in only one file (potential inconsistency)
        single_use_colors = {color: files for color, files in color_usage.items() if len(files) == 1}
        
        if single_use_colors:
            # Create a finding about color consistency
            pass  # Implementation would create findings about single-use colors
        
        # Analyze spacing consistency
        spacing_usage = self.usage_tracker['spacing']
        spacing_variety = len(spacing_usage.keys())
        
        if spacing_variety > 15:  # Arbitrary threshold
            # Too many different spacing values might indicate inconsistency
            pass  # Implementation would create findings about spacing consistency
    
    def _identify_component_reuse_opportunities(self) -> None:
        """Identify opportunities for component reuse and consistency."""
        # Analyze similar patterns across files that could be componentized
        # This would look for repeated UI patterns that could be extracted into reusable components
        pass
    
    def is_action_relevant_to_expertise(self, action) -> bool:
        """Check if action is relevant to interface consistency expertise."""
        consistency_keywords = [
            'consistency', 'design system', 'component', 'reuse', 'pattern',
            'brand', 'visual', 'style', 'theme', 'token', 'standardize'
        ]
        
        description_lower = action.description.lower()
        return any(keyword in description_lower for keyword in consistency_keywords)