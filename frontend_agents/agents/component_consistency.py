"""Component Consistency Agent - Ensures UI consistency across the app."""

import re
from pathlib import Path
from typing import List, Dict, Set, Any
from collections import defaultdict

from .base import BaseFrontendAgent
from ..models import (
    AgentResult,
    IssueSeverity,
    IssueType,
    RepositoryContext,
    SharedState
)


class ComponentConsistencyAgent(BaseFrontendAgent):
    """Ensures UI consistency across the app."""
    
    def __init__(self):
        super().__init__(
            name="Component Consistency Agent",
            description="Identifies duplicate components and inconsistent UI patterns"
        )
    
    def analyze(self, context: RepositoryContext, state: SharedState) -> AgentResult:
        result = AgentResult(agent_name=self.name)
        
        # Analyze all components and pages
        all_files = context.get_pages() + context.get_components()
        
        # Track patterns across files
        button_patterns = defaultdict(list)
        form_patterns = defaultdict(list)
        styling_patterns = defaultdict(list)
        component_duplicates = defaultdict(list)
        
        for file_path in all_files:
            try:
                content = context.read_text(file_path)
                relative_path = str(file_path.relative_to(context.root))
                
                # Analyze button patterns
                self._analyze_button_patterns(content, relative_path, button_patterns)
                
                # Analyze form patterns
                self._analyze_form_patterns(content, relative_path, form_patterns)
                
                # Analyze styling patterns
                self._analyze_styling_patterns(content, relative_path, styling_patterns)
                
                # Check for potential duplicate components
                self._check_component_duplicates(content, relative_path, component_duplicates)
                
            except Exception:
                continue
        
        # Analyze patterns for inconsistencies
        self._check_button_consistency(button_patterns, result)
        self._check_form_consistency(form_patterns, result)
        self._check_styling_consistency(styling_patterns, result)
        self._check_for_duplicates(component_duplicates, result)
        
        # Store analysis for other agents
        result.artifacts['button_patterns'] = dict(button_patterns)
        result.artifacts['form_patterns'] = dict(form_patterns)
        result.artifacts['styling_patterns'] = dict(styling_patterns)
        
        # Share component patterns with other agents
        state.component_patterns = {
            'buttons': dict(button_patterns),
            'forms': dict(form_patterns),
            'styles': dict(styling_patterns)
        }
        
        return result
    
    def _analyze_button_patterns(self, content: str, file_path: str, button_patterns: dict) -> None:
        """Analyze button patterns in the file."""
        # Find button elements with their classes and text
        button_regex = r'<button[^>]*className=[\'"]([^\'"]*)[\'"][^>]*>([^<]*)</button>'
        matches = re.findall(button_regex, content, re.IGNORECASE)
        
        for class_name, text in matches:
            pattern_key = f"{class_name}|{text.strip()}"
            button_patterns[pattern_key].append(file_path)
            
        # Also check for styled buttons
        styled_button_regex = r'<Button[^>]*variant=[\'"]([^\'"]*)[\'"][^>]*>([^<]*)</Button>'
        styled_matches = re.findall(styled_button_regex, content)
        
        for variant, text in styled_matches:
            pattern_key = f"variant-{variant}|{text.strip()}"
            button_patterns[pattern_key].append(file_path)
    
    def _analyze_form_patterns(self, content: str, file_path: str, form_patterns: dict) -> None:
        """Analyze form patterns in the file."""
        # Check form structure patterns
        has_form = bool(re.search(r'<form', content, re.IGNORECASE))
        has_fieldset = bool(re.search(r'<fieldset', content, re.IGNORECASE))
        has_validation = bool(re.search(r'(required|validate|error)', content, re.IGNORECASE))
        
        if has_form:
            pattern = f"form-fieldset:{has_fieldset}-validation:{has_validation}"
            form_patterns[pattern].append(file_path)
    
    def _analyze_styling_patterns(self, content: str, file_path: str, styling_patterns: dict) -> None:
        """Analyze styling patterns in the file."""
        # Extract className patterns
        class_matches = re.findall(r'className=[\'"]([^\'"]*)[\'"]', content)
        
        for class_string in class_matches:
            classes = class_string.split()
            for cls in classes:
                # Group similar styling patterns
                if any(pattern in cls for pattern in ['btn', 'button']):
                    styling_patterns[f"button-style:{cls}"].append(file_path)
                elif any(pattern in cls for pattern in ['card', 'panel']):
                    styling_patterns[f"card-style:{cls}"].append(file_path)
                elif any(pattern in cls for pattern in ['input', 'field']):
                    styling_patterns[f"input-style:{cls}"].append(file_path)
    
    def _check_component_duplicates(self, content: str, file_path: str, component_duplicates: dict) -> None:
        """Check for potential duplicate component logic."""
        # Look for similar component structures
        components = self.find_react_components(content)
        
        for component in components:
            # Create a simple signature based on the component content
            component_content = self._extract_component_content(content, component)
            if component_content:
                # Simplified hash of component structure
                signature = self._create_component_signature(component_content)
                component_duplicates[signature].append({'file': file_path, 'component': component})
    
    def _extract_component_content(self, content: str, component_name: str) -> str:
        """Extract the content of a specific component."""
        # Find component definition
        pattern = rf'(?:function|const)\s+{component_name}[^{{]*\{{([^}}]+)}}'
        match = re.search(pattern, content, re.DOTALL)
        
        if match:
            return match.group(1)
        return ""
    
    def _create_component_signature(self, component_content: str) -> str:
        """Create a simple signature for component comparison."""
        # Remove whitespace and create a basic structural signature
        normalized = re.sub(r'\s+', ' ', component_content.strip())
        
        # Extract key structural elements
        jsx_elements = re.findall(r'<(\w+)', normalized)
        jsx_signature = ''.join(sorted(set(jsx_elements)))
        
        return jsx_signature[:50]  # Limit signature length
    
    def _check_button_consistency(self, button_patterns: dict, result: AgentResult) -> None:
        """Check for button inconsistencies."""
        # Group buttons by similar text but different styling
        text_groups = defaultdict(list)
        
        for pattern_key, files in button_patterns.items():
            parts = pattern_key.split('|')
            if len(parts) == 2:
                class_name, text = parts
                if text.strip():  # Only consider buttons with text
                    text_groups[text.strip()].append((class_name, files))
        
        # Check for same text with different styles
        for text, style_files in text_groups.items():
            if len(style_files) > 1:
                styles = [style for style, _ in style_files]
                if len(set(styles)) > 1:  # Different styles for same text
                    all_files = []
                    for _, files in style_files:
                        all_files.extend(files)
                    
                    result.add_issue(self.create_issue(
                        title=f"Inconsistent button styling for '{text}'",
                        description=f"Button with text '{text}' uses different styles: {', '.join(set(styles))}",
                        severity=IssueSeverity.MEDIUM,
                        issue_type=IssueType.INCONSISTENT_UI,
                        file_path=all_files[0],  # Report on first occurrence
                        tags=['button', 'consistency', 'styling'],
                        suggested_fix=f"Standardize button styling for '{text}' across all usages"
                    ))
    
    def _check_form_consistency(self, form_patterns: dict, result: AgentResult) -> None:
        """Check for form inconsistencies."""
        if len(form_patterns) > 1:
            patterns = list(form_patterns.keys())
            all_files = []
            for files in form_patterns.values():
                all_files.extend(files)
            
            result.add_issue(self.create_issue(
                title="Inconsistent form patterns",
                description=f"Forms use different patterns: {', '.join(patterns)}",
                severity=IssueSeverity.MEDIUM,
                issue_type=IssueType.INCONSISTENT_UI,
                file_path=all_files[0],
                tags=['form', 'consistency', 'structure'],
                suggested_fix="Standardize form structure (fieldsets, validation) across all forms"
            ))
    
    def _check_styling_consistency(self, styling_patterns: dict, result: AgentResult) -> None:
        """Check for styling inconsistencies."""
        # Group by style type
        style_types = defaultdict(list)
        
        for pattern, files in styling_patterns.items():
            if ':' in pattern:
                style_type, class_name = pattern.split(':', 1)
                style_types[style_type].append((class_name, files))
        
        # Check each style type for consistency
        for style_type, classes in style_types.items():
            if len(classes) > 3:  # Only flag if there are many variations
                class_names = [class_name for class_name, _ in classes]
                unique_classes = set(class_names)
                
                if len(unique_classes) > 5:  # Too many variations
                    result.add_issue(self.create_issue(
                        title=f"Too many {style_type} variations",
                        description=f"Found {len(unique_classes)} different {style_type} classes. Consider consolidating.",
                        severity=IssueSeverity.LOW,
                        issue_type=IssueType.INCONSISTENT_UI,
                        file_path=classes[0][1][0],  # First file with this pattern
                        tags=['styling', 'consistency', style_type],
                        suggested_fix=f"Create a standard set of {style_type} classes and reuse them"
                    ))
    
    def _check_for_duplicates(self, component_duplicates: dict, result: AgentResult) -> None:
        """Check for duplicate components."""
        for signature, components in component_duplicates.items():
            if len(components) > 1 and signature:  # More than one component with same signature
                file_names = [comp['file'] for comp in components]
                component_names = [comp['component'] for comp in components]
                
                result.add_issue(self.create_issue(
                    title="Potential duplicate components",
                    description=f"Components {', '.join(component_names)} appear to have similar structure",
                    severity=IssueSeverity.LOW,
                    issue_type=IssueType.INCONSISTENT_UI,
                    file_path=file_names[0],
                    tags=['duplication', 'refactor'],
                    suggested_fix="Consider extracting common logic into a shared component",
                    dependencies=[f"Review {f}" for f in file_names[1:]]
                ))
