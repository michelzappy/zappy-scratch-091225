"""Mobile Responsiveness Agent for mobile-first validation and cross-device consistency."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Dict, List, Set, Tuple

from ..base_agent import BaseUXAgent
from ..models import ActionType, IssueCategory, Severity
from ..repository import RepositoryContext


class MobileResponsivenessAgent(BaseUXAgent):
    """Agent that validates mobile-first design and cross-device consistency."""
    
    def __init__(self):
        super().__init__(
            name="Mobile Responsiveness Agent",
            description="Validates mobile-first design, touch targets, and cross-device consistency"
        )
        
        # Responsive breakpoints to check
        self.breakpoints = {
            'sm': '640px',
            'md': '768px', 
            'lg': '1024px',
            'xl': '1280px',
            '2xl': '1536px'
        }
        
        # Mobile-first patterns
        self.mobile_patterns = {
            'touch_targets': {
                'min_size': '44px',  # iOS/Android minimum touch target
                'patterns': [r'p-[0-2]', r'py-[0-2]', r'px-[0-2]']  # Too small padding
            },
            'responsive_text': {
                'patterns': [r'text-xs', r'text-sm', r'text-base', r'text-lg'],
                'mobile_variants': [r'sm:text-', r'md:text-', r'lg:text-']
            },
            'responsive_spacing': {
                'patterns': [r'p-\d+', r'm-\d+', r'space-\d+'],
                'mobile_variants': [r'sm:', r'md:', r'lg:']
            }
        }
        
        # Problematic mobile patterns
        self.mobile_issues = [
            r'overflow-x-auto',  # Horizontal scroll on mobile
            r'min-w-\[\d+px\]',  # Fixed minimum widths
            r'w-\[\d+px\]',      # Fixed widths
            r'h-screen',         # May cause issues on mobile
            r'fixed.*top-0',     # Fixed positioning issues
        ]
        
        # Touch-friendly requirements
        self.touch_requirements = {
            'buttons': {'min_height': 44, 'min_width': 44},
            'links': {'min_height': 44, 'spacing': 8},
            'form_inputs': {'min_height': 44, 'touch_spacing': 16}
        }
    
    def analyze_file_content(
        self, 
        context: RepositoryContext, 
        file_path: Path, 
        content: str
    ) -> None:
        """Analyze file content for mobile responsiveness issues."""
        if file_path.suffix in ['.tsx', '.css', '.scss']:
            self._check_mobile_first_design(file_path, content)
            self._check_touch_targets(file_path, content)
            self._check_responsive_breakpoints(file_path, content)
            self._check_mobile_navigation(file_path, content)
            self._check_viewport_meta(file_path, content)
            self._check_mobile_performance(file_path, content)
    
    def _check_mobile_first_design(self, file_path: Path, content: str) -> None:
        """Check for mobile-first design patterns."""
        lines = content.split('\n')
        
        # Check for desktop-first classes without mobile variants
        desktop_first_patterns = [
            r'hidden\s',  # Hidden without mobile variant
            r'flex\s',    # Flex without responsive variants
            r'grid\s',    # Grid without responsive variants
            r'text-\w+\s' # Text sizes without responsive variants
        ]
        
        for i, line in enumerate(lines, 1):
            for pattern in desktop_first_patterns:
                matches = re.findall(pattern, line)
                if matches:
                    # Check if there are responsive variants in the same line
                    has_responsive = any(bp in line for bp in self.breakpoints.keys())
                    
                    if not has_responsive and 'className' in line:
                        self.create_finding(
                            title="Missing mobile-first responsive design",
                            description="Classes should include responsive variants for mobile-first design",
                            severity=Severity.MEDIUM,
                            category=IssueCategory.RESPONSIVENESS,
                            file_path=str(file_path),
                            line_number=i,
                            code_snippet=line.strip(),
                            recommendations=[
                                "Add mobile-first responsive variants (sm:, md:, lg:)",
                                "Start with mobile styles, then enhance for larger screens",
                                "Test layout on mobile devices"
                            ],
                            tags=['mobile-first', 'responsive-design', 'breakpoints']
                        )
        
        # Check for fixed widths that may cause issues on mobile
        fixed_width_patterns = [r'w-\[(\d+)px\]', r'min-w-\[(\d+)px\]', r'max-w-\[(\d+)px\]']
        for pattern in fixed_width_patterns:
            matches = re.finditer(pattern, content)
            for match in matches:
                width_value = int(match.group(1))
                if width_value > 400:  # Likely too wide for mobile
                    line_num = content[:match.start()].count('\n') + 1
                    self.create_finding(
                        title="Fixed width may cause mobile overflow",
                        description=f"Fixed width of {width_value}px may be too wide for mobile screens",
                        severity=Severity.MEDIUM,
                        category=IssueCategory.RESPONSIVENESS,
                        file_path=str(file_path),
                        line_number=line_num,
                        recommendations=[
                            "Use responsive width classes instead of fixed pixels",
                            "Consider max-width with percentage-based widths",
                            "Test on various mobile screen sizes"
                        ],
                        tags=['fixed-width', 'mobile-overflow', 'responsive-design']
                    )
    
    def _check_touch_targets(self, file_path: Path, content: str) -> None:
        """Check for adequate touch target sizes."""
        lines = content.split('\n')
        
        for i, line in enumerate(lines, 1):
            # Check buttons and interactive elements
            if re.search(r'<(button|a)', line, re.IGNORECASE):
                # Look for padding classes
                padding_matches = re.findall(r'p-(\d+)|py-(\d+)|px-(\d+)', line)
                
                has_adequate_padding = False
                for match in padding_matches:
                    padding_value = int([x for x in match if x][0])
                    if padding_value >= 3:  # p-3 = 12px, close to minimum 44px target
                        has_adequate_padding = True
                        break
                
                if not has_adequate_padding and 'p-' in line:
                    self.create_finding(
                        title="Touch target may be too small",
                        description="Interactive elements should have minimum 44x44px touch targets for mobile",
                        severity=Severity.HIGH,
                        category=IssueCategory.RESPONSIVENESS,
                        file_path=str(file_path),
                        line_number=i,
                        code_snippet=line.strip(),
                        recommendations=[
                            "Increase padding to at least p-3 or py-3 px-4",
                            "Ensure minimum 44x44px touch target area",
                            "Test touch targets on actual mobile devices"
                        ],
                        tags=['touch-targets', 'mobile-usability', 'accessibility']
                    )
            
            # Check for elements that are too close together
            if 'space-x-1' in line or 'space-y-1' in line or 'gap-1' in line:
                if re.search(r'<(button|a)', line, re.IGNORECASE):
                    self.create_finding(
                        title="Interactive elements too close for touch",
                        description="Interactive elements need adequate spacing for touch interaction",
                        severity=Severity.MEDIUM,
                        category=IssueCategory.RESPONSIVENESS,
                        file_path=str(file_path),
                        line_number=i,
                        code_snippet=line.strip(),
                        recommendations=[
                            "Increase spacing to at least space-x-2 or gap-2",
                            "Ensure 8px minimum spacing between touch targets",
                            "Consider larger spacing on mobile"
                        ],
                        tags=['touch-spacing', 'mobile-usability', 'interactive-elements']
                    )
    
    def _check_responsive_breakpoints(self, file_path: Path, content: str) -> None:
        """Check for proper responsive breakpoint usage."""
        # Check if file uses responsive classes
        has_responsive_classes = any(f'{bp}:' in content for bp in self.breakpoints.keys())
        has_layout_classes = any(
            pattern in content 
            for pattern in ['grid', 'flex', 'hidden', 'block', 'w-', 'h-']
        )
        
        if has_layout_classes and not has_responsive_classes:
            self.create_finding(
                title="Layout lacks responsive breakpoints",
                description="Components with layout classes should include responsive variants",
                severity=Severity.MEDIUM,
                category=IssueCategory.RESPONSIVENESS,
                file_path=str(file_path),
                recommendations=[
                    "Add responsive variants (sm:, md:, lg:) for layout changes",
                    "Design for mobile-first, then enhance for larger screens", 
                    "Test layout across different screen sizes"
                ],
                tags=['responsive-breakpoints', 'layout', 'mobile-design']
            )
        
        # Check for proper breakpoint progression
        breakpoint_usage = {}
        for bp in self.breakpoints.keys():
            breakpoint_usage[bp] = content.count(f'{bp}:')
        
        # Should generally use more sm: than lg: (mobile-first)
        if breakpoint_usage.get('lg', 0) > breakpoint_usage.get('sm', 0) * 2:
            self.create_finding(
                title="Potential desktop-first design approach",
                description="Consider mobile-first approach with progressive enhancement",
                severity=Severity.LOW,
                category=IssueCategory.RESPONSIVENESS,
                file_path=str(file_path),
                recommendations=[
                    "Start with mobile styles as base",
                    "Add larger breakpoints for enhancement",
                    "Review mobile user experience"
                ],
                tags=['mobile-first', 'design-philosophy', 'breakpoint-strategy']
            )
    
    def _check_mobile_navigation(self, file_path: Path, content: str) -> None:
        """Check for mobile-friendly navigation patterns."""
        # Check for hamburger menu or mobile navigation
        if 'nav' in content.lower() or 'menu' in content.lower():
            has_mobile_menu = any(
                pattern in content.lower() 
                for pattern in ['hamburger', 'mobile', 'drawer', 'sidebar', 'toggle']
            )
            
            # Check if navigation has many items but no mobile pattern
            nav_items = content.count('<a') + content.count('<Link')
            if nav_items > 5 and not has_mobile_menu:
                self.create_finding(
                    title="Navigation may need mobile optimization",
                    description="Navigation with many items should have mobile-friendly pattern",
                    severity=Severity.MEDIUM,
                    category=IssueCategory.RESPONSIVENESS,
                    file_path=str(file_path),
                    recommendations=[
                        "Implement hamburger menu for mobile",
                        "Consider collapsible navigation",
                        "Ensure navigation is touch-friendly"
                    ],
                    tags=['mobile-navigation', 'hamburger-menu', 'touch-navigation']
                )
        
        # Check for horizontal scrolling elements
        if 'overflow-x-auto' in content:
            self.create_finding(
                title="Horizontal scrolling detected",
                description="Horizontal scrolling can be problematic on mobile devices",
                severity=Severity.LOW,
                category=IssueCategory.RESPONSIVENESS,
                file_path=str(file_path),
                recommendations=[
                    "Consider vertical stacking on mobile",
                    "Ensure horizontal scroll is intentional and user-friendly",
                    "Add visual indicators for scrollable content"
                ],
                tags=['horizontal-scroll', 'mobile-interaction', 'usability']
            )
    
    def _check_viewport_meta(self, file_path: Path, content: str) -> None:
        """Check for viewport meta tag in layout files."""
        if 'layout' in str(file_path).lower() or '_document' in str(file_path):
            if 'viewport' not in content.lower():
                self.create_finding(
                    title="Missing viewport meta tag",
                    description="Layout files should include proper viewport meta tag for mobile",
                    severity=Severity.HIGH,
                    category=IssueCategory.RESPONSIVENESS,
                    file_path=str(file_path),
                    recommendations=[
                        "Add <meta name='viewport' content='width=device-width, initial-scale=1'>",
                        "Ensure proper mobile rendering",
                        "Test mobile viewport behavior"
                    ],
                    tags=['viewport', 'mobile-setup', 'meta-tags']
                )
    
    def _check_mobile_performance(self, file_path: Path, content: str) -> None:
        """Check for mobile performance considerations."""
        # Check for large images without responsive variants
        if re.search(r'<(img|Image)', content, re.IGNORECASE):
            if not re.search(r'(sizes|srcset|responsive)', content, re.IGNORECASE):
                self.create_finding(
                    title="Images may not be optimized for mobile",
                    description="Images should use responsive techniques for better mobile performance",
                    severity=Severity.MEDIUM,
                    category=IssueCategory.RESPONSIVENESS,
                    file_path=str(file_path),
                    recommendations=[
                        "Use Next.js Image component with sizes prop",
                        "Implement responsive images with srcset",
                        "Consider mobile-specific image optimization"
                    ],
                    tags=['image-optimization', 'mobile-performance', 'responsive-images']
                )
        
        # Check for performance-heavy animations
        animation_patterns = [r'animate-\w+', r'transition-all', r'duration-\d+']
        animation_count = sum(len(re.findall(pattern, content)) for pattern in animation_patterns)
        
        if animation_count > 10:  # Arbitrary threshold
            self.create_finding(
                title="Heavy animation usage may impact mobile performance",
                description="Consider reducing animations or using prefers-reduced-motion",
                severity=Severity.LOW,
                category=IssueCategory.RESPONSIVENESS,
                file_path=str(file_path),
                recommendations=[
                    "Implement prefers-reduced-motion media query",
                    "Optimize animations for mobile performance",
                    "Consider disabling non-essential animations on mobile"
                ],
                tags=['mobile-performance', 'animations', 'accessibility']
            )
    
    def is_action_relevant_to_expertise(self, action) -> bool:
        """Check if action is relevant to mobile responsiveness expertise."""
        mobile_keywords = [
            'mobile', 'responsive', 'touch', 'breakpoint', 'viewport',
            'tablet', 'phone', 'screen size', 'media query', 'device'
        ]
        
        description_lower = action.description.lower()
        return any(keyword in description_lower for keyword in mobile_keywords)