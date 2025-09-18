"""Accessibility Agent for WCAG compliance and inclusive design."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Dict, List, Set

from ..base_agent import BaseUXAgent
from ..models import ActionType, IssueCategory, Severity
from ..repository import RepositoryContext


class AccessibilityAgent(BaseUXAgent):
    """Agent that ensures WCAG compliance and inclusive user experience."""
    
    def __init__(self):
        super().__init__(
            name="Accessibility Agent",
            description="Ensures WCAG compliance, screen reader compatibility, and inclusive design"
        )
        
        # WCAG 2.1 AA requirements to check
        self.wcag_checks = {
            'color_contrast': {
                'patterns': [r'text-gray-400', r'text-gray-300', r'opacity-50'],
                'severity': Severity.HIGH,
                'description': 'Low contrast text may not meet WCAG AA standards'
            },
            'missing_alt_text': {
                'patterns': [r'<img(?![^>]*alt=)', r'<Image(?![^>]*alt=)'],
                'severity': Severity.HIGH,
                'description': 'Images must have descriptive alt text for screen readers'
            },
            'missing_labels': {
                'patterns': [r'<input(?![^>]*aria-label)(?![^>]*<label)'],
                'severity': Severity.HIGH,
                'description': 'Form inputs must have associated labels or aria-label'
            },
            'keyboard_navigation': {
                'patterns': [r'onClick(?![^}]*onKeyDown)', r'tabIndex="-1"'],
                'severity': Severity.MEDIUM,
                'description': 'Interactive elements must be keyboard accessible'
            }
        }
        
        # Required ARIA attributes for common patterns
        self.aria_requirements = {
            'button': ['aria-label', 'aria-describedby'],
            'modal': ['aria-modal', 'aria-labelledby'],
            'dialog': ['role', 'aria-labelledby'],
            'alert': ['role="alert"', 'aria-live'],
            'tab': ['role="tab"', 'aria-selected'],
            'menu': ['role="menu"', 'aria-expanded']
        }
        
        # Color combinations that may fail contrast
        self.low_contrast_combinations = [
            ('text-gray-400', 'bg-white'),
            ('text-gray-300', 'bg-gray-100'),
            ('text-blue-300', 'bg-blue-50'),
            ('text-green-300', 'bg-green-50')
        ]
    
    def analyze_file_content(
        self, 
        context: RepositoryContext, 
        file_path: Path, 
        content: str
    ) -> None:
        """Analyze file content for accessibility issues."""
        if file_path.suffix == '.tsx':
            self._check_wcag_compliance(file_path, content)
            self._check_aria_attributes(file_path, content)
            self._check_semantic_html(file_path, content)
            self._check_keyboard_accessibility(file_path, content)
            self._check_focus_management(file_path, content)
            self._check_color_accessibility(file_path, content)
    
    def _check_wcag_compliance(self, file_path: Path, content: str) -> None:
        """Check basic WCAG compliance requirements."""
        lines = content.split('\n')
        
        for i, line in enumerate(lines, 1):
            # Check for images without alt text
            if re.search(r'<(img|Image)', line, re.IGNORECASE):
                if not re.search(r'alt=', line):
                    self.create_finding(
                        title="Image missing alt text",
                        description="All images must have descriptive alt text for screen readers (WCAG 1.1.1)",
                        severity=Severity.HIGH,
                        category=IssueCategory.ACCESSIBILITY,
                        file_path=str(file_path),
                        line_number=i,
                        code_snippet=line.strip(),
                        recommendations=[
                            "Add descriptive alt attribute",
                            "Use alt='' for decorative images",
                            "Ensure alt text describes image purpose"
                        ],
                        tags=['wcag-1.1.1', 'images', 'screen-reader']
                    )
            
            # Check for form inputs without labels
            if re.search(r'<input', line, re.IGNORECASE):
                if not re.search(r'(aria-label|aria-labelledby|<label)', line):
                    # Look for associated label in surrounding lines
                    context_lines = lines[max(0, i-3):min(len(lines), i+3)]
                    has_label = any(re.search(r'<label', ctx_line) for ctx_line in context_lines)
                    
                    if not has_label:
                        self.create_finding(
                            title="Form input missing accessible label",
                            description="All form inputs must have associated labels or aria-label (WCAG 3.3.2)",
                            severity=Severity.HIGH,
                            category=IssueCategory.ACCESSIBILITY,
                            file_path=str(file_path),
                            line_number=i,
                            code_snippet=line.strip(),
                            recommendations=[
                                "Add <label> element associated with input",
                                "Use aria-label for inline labeling",
                                "Use aria-labelledby to reference existing text"
                            ],
                            tags=['wcag-3.3.2', 'forms', 'labels']
                        )
            
            # Check for buttons without accessible names
            if re.search(r'<button', line, re.IGNORECASE):
                if not re.search(r'(aria-label|>.*<|title=)', line):
                    self.create_finding(
                        title="Button missing accessible name",
                        description="Buttons must have accessible names for screen readers (WCAG 4.1.2)",
                        severity=Severity.HIGH,
                        category=IssueCategory.ACCESSIBILITY,
                        file_path=str(file_path),
                        line_number=i,
                        code_snippet=line.strip(),
                        recommendations=[
                            "Add visible text content to button",
                            "Use aria-label for icon-only buttons",
                            "Ensure button purpose is clear"
                        ],
                        tags=['wcag-4.1.2', 'buttons', 'screen-reader']
                    )
    
    def _check_aria_attributes(self, file_path: Path, content: str) -> None:
        """Check for proper ARIA attribute usage."""
        lines = content.split('\n')
        
        for i, line in enumerate(lines, 1):
            # Check for modal/dialog without proper ARIA
            if re.search(r'(modal|dialog|popup)', line, re.IGNORECASE):
                if not re.search(r'aria-modal|role="dialog"', content):
                    self.create_finding(
                        title="Modal/Dialog missing ARIA attributes",
                        description="Modals must have proper ARIA attributes for accessibility",
                        severity=Severity.HIGH,
                        category=IssueCategory.ACCESSIBILITY,
                        file_path=str(file_path),
                        line_number=i,
                        recommendations=[
                            "Add aria-modal='true' to modal container",
                            "Add role='dialog' or role='alertdialog'",
                            "Include aria-labelledby pointing to title"
                        ],
                        tags=['aria', 'modals', 'navigation']
                    )
            
            # Check for expandable content without aria-expanded
            if re.search(r'(dropdown|collapse|expand|accordion)', line, re.IGNORECASE):
                if 'onClick' in line and 'aria-expanded' not in content:
                    self.create_finding(
                        title="Expandable content missing aria-expanded",
                        description="Expandable UI elements need aria-expanded for screen readers",
                        severity=Severity.MEDIUM,
                        category=IssueCategory.ACCESSIBILITY,
                        file_path=str(file_path),
                        line_number=i,
                        recommendations=[
                            "Add aria-expanded attribute to trigger element",
                            "Update aria-expanded state when toggling",
                            "Consider aria-controls to link trigger and content"
                        ],
                        tags=['aria', 'expandable-content', 'state']
                    )
            
            # Check for custom select/combobox without proper ARIA
            if re.search(r'(select|combobox|autocomplete)', line, re.IGNORECASE):
                if 'role=' not in line and '<select' not in line:
                    self.create_finding(
                        title="Custom select missing proper ARIA roles",
                        description="Custom select components need proper ARIA roles and states",
                        severity=Severity.HIGH,
                        category=IssueCategory.ACCESSIBILITY,
                        file_path=str(file_path),
                        line_number=i,
                        recommendations=[
                            "Add role='combobox' or role='listbox'",
                            "Include aria-expanded for dropdown state",
                            "Use aria-selected for options"
                        ],
                        tags=['aria', 'custom-controls', 'forms']
                    )
    
    def _check_semantic_html(self, file_path: Path, content: str) -> None:
        """Check for proper semantic HTML usage."""
        # Check for heading hierarchy
        headings = re.findall(r'<h([1-6])', content)
        if headings:
            heading_levels = [int(h) for h in headings]
            
            # Check if h1 exists
            if 1 not in heading_levels and len(heading_levels) > 0:
                self.create_finding(
                    title="Page missing h1 heading",
                    description="Every page should have exactly one h1 for document structure",
                    severity=Severity.MEDIUM,
                    category=IssueCategory.ACCESSIBILITY,
                    file_path=str(file_path),
                    recommendations=[
                        "Add h1 heading for page title",
                        "Ensure h1 describes page content",
                        "Maintain logical heading hierarchy"
                    ],
                    tags=['semantic-html', 'headings', 'structure']
                )
            
            # Check for skipped heading levels
            for i in range(len(heading_levels) - 1):
                if heading_levels[i+1] - heading_levels[i] > 1:
                    self.create_finding(
                        title="Heading hierarchy skips levels",
                        description="Heading levels should not skip (e.g., h1 to h3 without h2)",
                        severity=Severity.LOW,
                        category=IssueCategory.ACCESSIBILITY,
                        file_path=str(file_path),
                        recommendations=[
                            "Use sequential heading levels",
                            "Don't skip heading levels for styling",
                            "Use CSS for visual hierarchy"
                        ],
                        tags=['semantic-html', 'headings', 'hierarchy']
                    )
        
        # Check for landmark elements
        landmark_elements = ['main', 'nav', 'aside', 'header', 'footer', 'section']
        has_landmarks = any(f'<{element}' in content for element in landmark_elements)
        
        if not has_landmarks and 'page.tsx' in str(file_path):
            self.create_finding(
                title="Page lacks semantic landmark elements",
                description="Pages should use semantic HTML5 elements for better navigation",
                severity=Severity.MEDIUM,
                category=IssueCategory.ACCESSIBILITY,
                file_path=str(file_path),
                recommendations=[
                    "Use <main> for primary content",
                    "Use <nav> for navigation areas",
                    "Add <section> for distinct content areas"
                ],
                tags=['semantic-html', 'landmarks', 'navigation']
            )
    
    def _check_keyboard_accessibility(self, file_path: Path, content: str) -> None:
        """Check for keyboard accessibility requirements."""
        lines = content.split('\n')
        
        for i, line in enumerate(lines, 1):
            # Check for onClick without keyboard support
            if 'onClick' in line and 'onKeyDown' not in line:
                # Allow for certain elements that are naturally keyboard accessible
                if not re.search(r'<(button|input|select|textarea|a)', line, re.IGNORECASE):
                    self.create_finding(
                        title="Interactive element not keyboard accessible",
                        description="Non-button elements with onClick need keyboard event handlers",
                        severity=Severity.HIGH,
                        category=IssueCategory.ACCESSIBILITY,
                        file_path=str(file_path),
                        line_number=i,
                        code_snippet=line.strip(),
                        recommendations=[
                            "Add onKeyDown handler for Enter and Space keys",
                            "Consider using button element instead",
                            "Add tabIndex='0' if element should be focusable"
                        ],
                        tags=['keyboard-access', 'interactive-elements', 'wcag-2.1.1']
                    )
            
            # Check for tabIndex=-1 on interactive elements
            if 'tabIndex="-1"' in line and 'onClick' in line:
                self.create_finding(
                    title="Interactive element removed from tab order",
                    description="Interactive elements with tabIndex='-1' are not keyboard accessible",
                    severity=Severity.HIGH,
                    category=IssueCategory.ACCESSIBILITY,
                    file_path=str(file_path),
                    line_number=i,
                    code_snippet=line.strip(),
                    recommendations=[
                        "Remove tabIndex='-1' or use tabIndex='0'",
                        "Ensure keyboard users can access functionality",
                        "Consider alternative interaction methods"
                    ],
                    tags=['keyboard-access', 'tab-order', 'interactive-elements']
                )
    
    def _check_focus_management(self, file_path: Path, content: str) -> None:
        """Check for proper focus management."""
        # Check for focus indicators
        if 'focus:' not in content and ('button' in content.lower() or 'input' in content.lower()):
            self.create_finding(
                title="Interactive elements missing focus indicators",
                description="All interactive elements need visible focus indicators (WCAG 2.4.7)",
                severity=Severity.MEDIUM,
                category=IssueCategory.ACCESSIBILITY,
                file_path=str(file_path),
                recommendations=[
                    "Add focus: styles to interactive elements",
                    "Ensure focus indicators are visible",
                    "Test with keyboard navigation"
                ],
                tags=['focus-management', 'visual-indicators', 'wcag-2.4.7']
            )
        
        # Check for focus trapping in modals
        if 'modal' in content.lower() or 'dialog' in content.lower():
            if 'focus' not in content.lower():
                self.create_finding(
                    title="Modal missing focus management",
                    description="Modals should trap focus and restore it when closed",
                    severity=Severity.HIGH,
                    category=IssueCategory.ACCESSIBILITY,
                    file_path=str(file_path),
                    recommendations=[
                        "Implement focus trapping within modal",
                        "Set initial focus to appropriate element",
                        "Restore focus when modal closes"
                    ],
                    tags=['focus-management', 'modals', 'keyboard-navigation']
                )
    
    def _check_color_accessibility(self, file_path: Path, content: str) -> None:
        """Check for color contrast and color-only information."""
        # Check for potential low contrast combinations
        for text_color, bg_color in self.low_contrast_combinations:
            if text_color in content and bg_color in content:
                self.create_finding(
                    title="Potential low color contrast detected",
                    description=f"Combination of {text_color} and {bg_color} may not meet WCAG AA contrast requirements",
                    severity=Severity.MEDIUM,
                    category=IssueCategory.ACCESSIBILITY,
                    file_path=str(file_path),
                    recommendations=[
                        "Test color combination with contrast checker",
                        "Ensure 4.5:1 contrast ratio for normal text",
                        "Use darker colors or add alternative indicators"
                    ],
                    tags=['color-contrast', 'wcag-1.4.3', 'visual-design']
                )
        
        # Check for color-only information
        color_indicators = re.findall(r'(text-red|text-green|text-yellow|text-blue|bg-red|bg-green)', content)
        if color_indicators and not re.search(r'(icon|symbol|✓|✗|!)', content):
            self.create_finding(
                title="Information conveyed by color only",
                description="Important information should not rely solely on color (WCAG 1.4.1)",
                severity=Severity.MEDIUM,
                category=IssueCategory.ACCESSIBILITY,
                file_path=str(file_path),
                recommendations=[
                    "Add icons or symbols alongside color",
                    "Use text labels for status information",
                    "Ensure information is accessible without color"
                ],
                tags=['color-accessibility', 'wcag-1.4.1', 'inclusive-design']
            )
    
    def is_action_relevant_to_expertise(self, action) -> bool:
        """Check if action is relevant to accessibility expertise."""
        accessibility_keywords = [
            'accessibility', 'wcag', 'aria', 'screen reader', 'keyboard',
            'focus', 'contrast', 'alt text', 'semantic', 'inclusive'
        ]
        
        description_lower = action.description.lower()
        return any(keyword in description_lower for keyword in accessibility_keywords)