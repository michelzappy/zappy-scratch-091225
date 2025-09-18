"""Patient Journey Agent for end-to-end user flow validation."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional

from ..base_agent import BaseUXAgent
from ..models import ActionType, IssueCategory, Severity
from ..repository import RepositoryContext


class PatientJourneyAgent(BaseUXAgent):
    """Agent that validates end-to-end patient flows from login to task completion."""
    
    def __init__(self):
        super().__init__(
            name="Patient Journey Agent", 
            description="Validates complete patient journeys ensuring seamless experience from login to task completion"
        )
        
        # Critical patient journeys to validate
        self.patient_journeys = {
            'onboarding': {
                'steps': ['/patient/login', '/patient/dashboard', '/patient/profile'],
                'description': 'New patient registration and first-time setup',
                'critical': True
            },
            'consultation_flow': {
                'steps': ['/patient/dashboard', '/patient/new-consultation', '/patient/checkout'],
                'description': 'Booking and completing a medical consultation',
                'critical': True
            },
            'medication_management': {
                'steps': ['/patient/dashboard', '/patient/orders', '/patient/refill-checkin'],
                'description': 'Managing prescriptions and refills',
                'critical': True
            },
            'communication_flow': {
                'steps': ['/patient/dashboard', '/patient/messages'],
                'description': 'Patient-provider communication',
                'critical': False
            },
            'health_tracking': {
                'steps': ['/patient/dashboard', '/patient/health-quiz', '/patient/medical-records'],
                'description': 'Health assessment and record management',
                'critical': False
            }
        }
        
        # Navigation patterns to look for
        self.navigation_patterns = {
            'links': [r'<Link.*?href=', r'<a.*?href=', r'router\.push\(', r'navigate\('],
            'buttons': [r'<button.*?onClick=', r'onClick=.*?router'],
            'forms': [r'<form.*?onSubmit=', r'onSubmit=.*?handleSubmit'],
            'redirects': [r'redirect\(', r'window\.location', r'history\.push']
        }
        
        # Flow completion indicators
        self.completion_indicators = {
            'success_messages': [r'success', r'complete', r'confirmed', r'submitted'],
            'progress_indicators': [r'step', r'progress', r'stepper', r'wizard'],
            'confirmation_pages': [r'thank you', r'confirmation', r'receipt', r'summary'],
            'error_recovery': [r'error', r'retry', r'try again', r'back']
        }
        
        # Problematic flow patterns
        self.flow_issues = [
            r'TODO.*flow|TODO.*navigation',  # Incomplete flows
            r'disabled.*true',  # Permanently disabled elements
            r'href="#"',  # Dead links
            r'onClick=\{\}',  # Empty click handlers
        ]
    
    def analyze_file_content(
        self, 
        context: RepositoryContext, 
        file_path: Path, 
        content: str
    ) -> None:
        """Analyze file content for patient journey issues."""
        file_str = str(file_path)
        
        # Analyze different file types
        if 'page.tsx' in file_str:
            self._analyze_page_journey(file_path, content, context)
        elif file_path.suffix == '.tsx':
            self._analyze_component_journey(file_path, content)
        
        # Common journey analysis
        self._check_navigation_completeness(file_path, content)
        self._check_progress_indicators(file_path, content)
        self._check_error_recovery(file_path, content)
        self._validate_form_flows(file_path, content)
    
    def _analyze_page_journey(
        self, 
        file_path: Path, 
        content: str, 
        context: RepositoryContext
    ) -> None:
        """Analyze page-level journey patterns."""
        page_path = self._extract_page_path(file_path)
        
        # Check if this page is part of critical journeys
        critical_journeys = self._find_journeys_containing_page(page_path)
        
        for journey_name, journey_info in critical_journeys.items():
            current_step_index = journey_info['steps'].index(page_path)
            
            # Check for navigation to next step
            if current_step_index < len(journey_info['steps']) - 1:
                next_step = journey_info['steps'][current_step_index + 1]
                if not self._has_navigation_to(content, next_step):
                    severity = Severity.HIGH if journey_info['critical'] else Severity.MEDIUM
                    
                    self.create_finding(
                        title=f"Missing navigation in critical journey: {journey_name}",
                        description=f"Page should provide clear path to next step: {next_step}",
                        severity=severity,
                        category=IssueCategory.USER_FLOW,
                        file_path=str(file_path),
                        recommendations=[
                            f"Add navigation button/link to {next_step}",
                            "Ensure journey flow is intuitive and complete",
                            "Test the complete user journey"
                        ],
                        tags=['critical-journey', 'navigation', 'flow-completion']
                    )
            
            # Check for back navigation (except for first step)
            if current_step_index > 0:
                if not self._has_back_navigation(content):
                    self.create_finding(
                        title="Missing back navigation in journey",
                        description="Users should be able to navigate back in multi-step flows",
                        severity=Severity.MEDIUM,
                        category=IssueCategory.USER_FLOW,
                        file_path=str(file_path),
                        recommendations=[
                            "Add back button or navigation",
                            "Ensure users can correct previous steps",
                            "Maintain journey context"
                        ],
                        tags=['back-navigation', 'user-control', 'flow-navigation']
                    )
    
    def _analyze_component_journey(self, file_path: Path, content: str) -> None:
        """Analyze component-level journey patterns."""
        # Check for multi-step components (wizards, steppers)
        if any(indicator in content.lower() for indicator in ['step', 'wizard', 'stepper']):
            self._validate_multi_step_component(file_path, content)
        
        # Check for form components in journeys
        if '<form' in content or 'onSubmit' in content:
            self._validate_form_journey_integration(file_path, content)
        
        # Check for modal/dialog journey integration
        if any(modal_indicator in content.lower() for modal_indicator in ['modal', 'dialog', 'popup']):
            self._validate_modal_journey_flow(file_path, content)
    
    def _validate_multi_step_component(self, file_path: Path, content: str) -> None:
        """Validate multi-step component journey patterns."""
        # Check for step navigation
        has_next = any(pattern in content.lower() for pattern in ['next', 'continue', 'forward'])
        has_previous = any(pattern in content.lower() for pattern in ['previous', 'back', 'prev'])
        
        if not has_next:
            self.create_finding(
                title="Multi-step component missing forward navigation",
                description="Stepper/wizard components should provide clear next step navigation",
                severity=Severity.HIGH,
                category=IssueCategory.USER_FLOW,
                file_path=str(file_path),
                recommendations=[
                    "Add Next/Continue button",
                    "Ensure progressive disclosure of steps",
                    "Validate step completion before advancing"
                ],
                tags=['multi-step', 'navigation', 'progressive-disclosure']
            )
        
        if not has_previous:
            self.create_finding(
                title="Multi-step component missing backward navigation",
                description="Users should be able to go back to previous steps",
                severity=Severity.MEDIUM,
                category=IssueCategory.USER_FLOW,
                file_path=str(file_path),
                recommendations=[
                    "Add Previous/Back button",
                    "Preserve user input when navigating back",
                    "Maintain step state"
                ],
                tags=['multi-step', 'back-navigation', 'state-management']
            )
        
        # Check for progress indication
        progress_indicators = ['progress', 'step.*of', r'\d+/\d+', 'breadcrumb']
        has_progress = any(re.search(indicator, content, re.IGNORECASE) for indicator in progress_indicators)
        
        if not has_progress:
            self.create_finding(
                title="Multi-step component lacks progress indication",
                description="Users should know their progress through multi-step flows",
                severity=Severity.MEDIUM,
                category=IssueCategory.USER_FLOW,
                file_path=str(file_path),
                recommendations=[
                    "Add progress bar or step indicator",
                    "Show current step and total steps",
                    "Provide visual journey context"
                ],
                tags=['progress-indication', 'user-orientation', 'multi-step']
            )
    
    def _validate_form_journey_integration(self, file_path: Path, content: str) -> None:
        """Validate form integration within patient journeys."""
        # Check for form validation
        has_validation = any(
            pattern in content.lower() 
            for pattern in ['validation', 'error', 'required', 'validate']
        )
        
        if not has_validation:
            self.create_finding(
                title="Form lacks validation in patient journey",
                description="Forms in patient journeys should have proper validation to prevent errors",
                severity=Severity.HIGH,
                category=IssueCategory.USER_FLOW,
                file_path=str(file_path),
                recommendations=[
                    "Add form validation rules",
                    "Provide real-time feedback",
                    "Prevent invalid form submission"
                ],
                tags=['form-validation', 'error-prevention', 'user-feedback']
            )
        
        # Check for submission feedback
        submission_patterns = ['loading', 'submitting', 'success', 'submitted']
        has_feedback = any(pattern in content.lower() for pattern in submission_patterns)
        
        if not has_feedback:
            self.create_finding(
                title="Form lacks submission feedback",
                description="Users need clear feedback during and after form submission",
                severity=Severity.MEDIUM,
                category=IssueCategory.USER_FLOW,
                file_path=str(file_path),
                recommendations=[
                    "Add loading state during submission",
                    "Show success confirmation",
                    "Provide error recovery options"
                ],
                tags=['submission-feedback', 'user-feedback', 'form-ux']
            )
    
    def _validate_modal_journey_flow(self, file_path: Path, content: str) -> None:
        """Validate modal integration within patient journeys."""
        # Check for modal close handling
        close_patterns = ['close', 'cancel', 'dismiss', 'onClose']
        has_close = any(pattern in content.lower() for pattern in close_patterns)
        
        if not has_close:
            self.create_finding(
                title="Modal lacks clear close/cancel options",
                description="Users should always be able to cancel or close modal dialogs",
                severity=Severity.HIGH,
                category=IssueCategory.USER_FLOW,
                file_path=str(file_path),
                recommendations=[
                    "Add close button or cancel action",
                    "Allow ESC key to close modal",
                    "Provide clear exit path"
                ],
                tags=['modal-ux', 'user-control', 'escape-hatch']
            )
        
        # Check for data preservation
        if any(pattern in content.lower() for pattern in ['input', 'form', 'text']):
            preservation_patterns = ['save', 'draft', 'preserve', 'restore']
            has_preservation = any(pattern in content.lower() for pattern in preservation_patterns)
            
            if not has_preservation:
                self.create_finding(
                    title="Modal may lose user data on close",
                    description="Modals with forms should preserve or warn about data loss",
                    severity=Severity.MEDIUM,
                    category=IssueCategory.USER_FLOW,
                    file_path=str(file_path),
                    recommendations=[
                        "Auto-save draft data",
                        "Warn before data loss",
                        "Provide save options"
                    ],
                    tags=['data-preservation', 'modal-ux', 'user-safety']
                )
    
    def _check_navigation_completeness(self, file_path: Path, content: str) -> None:
        """Check for complete navigation patterns."""
        # Check for broken navigation
        broken_nav_patterns = [r'href="#"', r'onClick=\{\}', r'disabled.*true']
        
        for i, line in enumerate(content.split('\n'), 1):
            for pattern in broken_nav_patterns:
                if re.search(pattern, line):
                    self.create_finding(
                        title="Broken navigation element detected",
                        description="Navigation element appears to be non-functional",
                        severity=Severity.HIGH,
                        category=IssueCategory.USER_FLOW,
                        file_path=str(file_path),
                        line_number=i,
                        code_snippet=line.strip(),
                        recommendations=[
                            "Implement proper navigation handler",
                            "Remove disabled state or add conditional logic",
                            "Ensure all navigation is functional"
                        ],
                        tags=['broken-navigation', 'functionality', 'user-flow']
                    )
    
    def _check_progress_indicators(self, file_path: Path, content: str) -> None:
        """Check for progress indication in multi-step flows."""
        # If page seems to be part of a multi-step flow
        step_indicators = ['step', 'of', 'progress', 'wizard', 'part']
        has_step_context = any(indicator in content.lower() for indicator in step_indicators)
        
        if has_step_context:
            visual_progress = ['progress-bar', 'stepper', 'breadcrumb', r'\d+\s*of\s*\d+']
            has_visual_progress = any(
                re.search(pattern, content, re.IGNORECASE) 
                for pattern in visual_progress
            )
            
            if not has_visual_progress:
                self.create_finding(
                    title="Multi-step flow lacks visual progress indication",
                    description="Users need to see their progress through multi-step processes",
                    severity=Severity.MEDIUM,
                    category=IssueCategory.USER_FLOW,
                    file_path=str(file_path),
                    recommendations=[
                        "Add progress bar or step indicator",
                        "Show completed, current, and upcoming steps",
                        "Provide visual journey context"
                    ],
                    tags=['progress-indication', 'visual-feedback', 'user-orientation']
                )
    
    def _check_error_recovery(self, file_path: Path, content: str) -> None:
        """Check for error recovery mechanisms."""
        # Check for error handling
        has_errors = any(pattern in content.lower() for pattern in ['error', 'catch', 'fail'])
        
        if has_errors:
            recovery_patterns = ['retry', 'try again', 'back', 'refresh', 'reload']
            has_recovery = any(pattern in content.lower() for pattern in recovery_patterns)
            
            if not has_recovery:
                self.create_finding(
                    title="Error states lack recovery options",
                    description="Users should have clear ways to recover from errors",
                    severity=Severity.MEDIUM,
                    category=IssueCategory.USER_FLOW,
                    file_path=str(file_path),
                    recommendations=[
                        "Add retry mechanisms for failed operations",
                        "Provide clear recovery instructions",
                        "Include fallback navigation options"
                    ],
                    tags=['error-recovery', 'user-assistance', 'resilience']
                )
    
    def _validate_form_flows(self, file_path: Path, content: str) -> None:
        """Validate form completion flows."""
        if '<form' in content or 'onSubmit' in content:
            # Check for form completion feedback
            completion_patterns = ['success', 'submitted', 'complete', 'thank you']
            has_completion = any(pattern in content.lower() for pattern in completion_patterns)
            
            # Check for navigation after form submission
            post_submit_nav = ['redirect', 'router.push', 'navigate', 'href']
            has_post_submit_nav = any(pattern in content.lower() for pattern in post_submit_nav)
            
            if not (has_completion or has_post_submit_nav):
                self.create_finding(
                    title="Form lacks completion flow",
                    description="Users need clear indication of successful form submission and next steps",
                    severity=Severity.HIGH,
                    category=IssueCategory.USER_FLOW,
                    file_path=str(file_path),
                    recommendations=[
                        "Add success message after form submission",
                        "Redirect to appropriate next page",
                        "Provide clear next steps for users"
                    ],
                    tags=['form-completion', 'user-feedback', 'journey-continuation']
                )
    
    def _extract_page_path(self, file_path: Path) -> str:
        """Extract the URL path from a file path."""
        # Convert file path to URL path
        path_parts = file_path.parts
        if 'app' in path_parts:
            app_index = path_parts.index('app')
            url_parts = path_parts[app_index + 1:]
            
            # Remove 'page.tsx' and join
            if url_parts and url_parts[-1] == 'page.tsx':
                url_parts = url_parts[:-1]
            
            return '/' + '/'.join(url_parts) if url_parts else '/'
        
        return str(file_path)
    
    def _find_journeys_containing_page(self, page_path: str) -> Dict:
        """Find journeys that contain the given page."""
        matching_journeys = {}
        
        for journey_name, journey_info in self.patient_journeys.items():
            if page_path in journey_info['steps']:
                matching_journeys[journey_name] = journey_info
        
        return matching_journeys
    
    def _has_navigation_to(self, content: str, target_path: str) -> bool:
        """Check if content has navigation to target path."""
        # Clean target path for matching
        clean_target = target_path.replace('/patient/', '').replace('/', '')
        
        nav_patterns = [
            rf'href=.*{clean_target}',
            rf'router\.push.*{clean_target}',
            rf'navigate.*{clean_target}',
            rf'Link.*to=.*{clean_target}'
        ]
        
        return any(re.search(pattern, content, re.IGNORECASE) for pattern in nav_patterns)
    
    def _has_back_navigation(self, content: str) -> bool:
        """Check if content has back navigation."""
        back_patterns = [
            r'back', r'previous', r'prev', r'router\.back', 
            r'history\.back', r'go\(-1\)', r'<.*back'
        ]
        
        return any(re.search(pattern, content, re.IGNORECASE) for pattern in back_patterns)
    
    def is_action_relevant_to_expertise(self, action) -> bool:
        """Check if action is relevant to patient journey expertise."""
        journey_keywords = [
            'journey', 'flow', 'navigation', 'step', 'process', 'completion',
            'progress', 'user path', 'workflow', 'sequence', 'continuity'
        ]
        
        description_lower = action.description.lower()
        return any(keyword in description_lower for keyword in journey_keywords)