"""Communication Analytics agent for analyzing messaging effectiveness for CRM integration."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Dict, List, Set

from models import AgentResult, SharedState
from agents.base import BaseAgent


class CommunicationAnalyticsAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__(
            name="Communication Analytics Agent",
            description="Analyzes email/SMS effectiveness, engagement patterns, and CRM communication opportunities.",
        )

    def run(self, context, state: SharedState) -> AgentResult:
        result = AgentResult()
        
        # Analyze email communication patterns
        email_analytics = self._analyze_email_communications(context)
        
        # Analyze SMS communication patterns
        sms_analytics = self._analyze_sms_communications(context)
        
        # Analyze communication triggers and automation
        automation_analytics = self._analyze_communication_automation(context)
        
        # Analyze engagement tracking capabilities
        engagement_analytics = self._analyze_engagement_tracking(context)
        
        # Analyze message personalization opportunities
        personalization_analytics = self._analyze_personalization_opportunities(context)
        
        # Create comprehensive communication analytics map
        communication_map = {
            "email_analytics": email_analytics,
            "sms_analytics": sms_analytics,
            "automation_analytics": automation_analytics,
            "engagement_analytics": engagement_analytics,
            "personalization_analytics": personalization_analytics,
            "crm_communication_recommendations": self._generate_crm_communication_recommendations(
                email_analytics, sms_analytics, automation_analytics, engagement_analytics
            )
        }
        
        # Store in shared state
        state.set_artifact(self.name, "communication_analytics_map", communication_map)
        
        # Generate findings
        self._generate_findings(result, communication_map)
        
        return result

    def _analyze_email_communications(self, context) -> Dict:
        """Analyze email communication patterns and templates."""
        email_data = {
            "templates": [],
            "channels": [],
            "triggers": [],
            "tracking_capabilities": [],
            "content_analysis": {}
        }
        
        # Analyze email service
        email_service_path = Path("backend/src/services/email.service.js")
        if context.file_exists(email_service_path):
            content = context.read_file(email_service_path)
            
            # Extract email templates with detailed analysis
            template_blocks = re.findall(r'(\w+):\s*{[^}]*subject:\s*[\'"]([^\'"]+)[\'"][^}]*html:\s*\([^)]*\)\s*=>\s*`([^`]+)`', content, re.DOTALL)
            
            for template_name, subject, html_content in template_blocks:
                template_analysis = {
                    "name": template_name,
                    "subject": subject,
                    "type": self._classify_email_type(template_name, subject),
                    "personalization_tokens": self._extract_personalization_tokens(html_content),
                    "cta_count": len(re.findall(r'<a[^>]*href=', html_content)),
                    "content_length": len(html_content),
                    "crm_relevance": self._assess_crm_relevance(template_name, subject)
                }
                email_data["templates"].append(template_analysis)
            
            # Identify email channels
            if 'sendgrid' in content.lower():
                email_data["channels"].append("SendGrid (Transactional)")
            if 'nodemailer' in content.lower():
                email_data["channels"].append("Nodemailer (Development)")
            
            # Extract tracking capabilities
            if 'email_logs' in content:
                email_data["tracking_capabilities"].append("Email delivery logging")
            if 'trackingSettings' in content:
                email_data["tracking_capabilities"].append("Open/click tracking")
            if 'message_id' in content:
                email_data["tracking_capabilities"].append("Message ID tracking")
            
            # Identify triggers
            trigger_methods = re.findall(r'async\s+(\w+)\([^)]*\)\s*{[^}]*sendEmail', content)
            email_data["triggers"] = trigger_methods
        
        return email_data

    def _analyze_sms_communications(self, context) -> Dict:
        """Analyze SMS communication patterns and templates."""
        sms_data = {
            "templates": [],
            "channels": [],
            "triggers": [],
            "tracking_capabilities": [],
            "opt_management": []
        }
        
        # Analyze SMS service
        sms_service_path = Path("backend/src/services/sms.service.js")
        if context.file_exists(sms_service_path):
            content = context.read_file(sms_service_path)
            
            # Extract SMS templates
            template_blocks = re.findall(r'(\w+):\s*\([^)]*\)\s*=>\s*`([^`]+)`', content)
            
            for template_name, message_content in template_blocks:
                template_analysis = {
                    "name": template_name,
                    "message": message_content[:100] + "..." if len(message_content) > 100 else message_content,
                    "type": self._classify_sms_type(template_name),
                    "personalization_tokens": self._extract_personalization_tokens(message_content),
                    "character_count": len(message_content),
                    "url_count": len(re.findall(r'http[s]?://\S+', message_content)),
                    "crm_relevance": self._assess_crm_relevance(template_name, message_content)
                }
                sms_data["templates"].append(template_analysis)
            
            # Identify SMS channels
            if 'twilio' in content.lower():
                sms_data["channels"].append("Twilio")
            
            # Extract tracking capabilities
            if 'sms_logs' in content:
                sms_data["tracking_capabilities"].append("SMS delivery logging")
            if 'statusCallback' in content:
                sms_data["tracking_capabilities"].append("Delivery status tracking")
            if 'message_sid' in content:
                sms_data["tracking_capabilities"].append("Message ID tracking")
            
            # Opt-out management
            if 'opt_out' in content.lower():
                sms_data["opt_management"].append("Opt-out handling")
            if 'opt_in' in content.lower():
                sms_data["opt_management"].append("Opt-in management")
            
            # Identify triggers
            trigger_methods = re.findall(r'async\s+(\w+)\([^)]*\)\s*{[^}]*sendSMS', content)
            sms_data["triggers"] = trigger_methods
        
        return sms_data

    def _analyze_communication_automation(self, context) -> Dict:
        """Analyze communication automation workflows and triggers."""
        automation_data = {
            "automated_sequences": [],
            "trigger_events": [],
            "workflow_opportunities": [],
            "scheduling_capabilities": []
        }
        
        # Analyze service files for automation patterns
        service_files = ["email.service.js", "sms.service.js"]
        
        for service_file in service_files:
            service_path = Path(f"backend/src/services/{service_file}")
            if context.file_exists(service_path):
                content = context.read_file(service_path)
                
                # Identify automated sequences
                if 'batch' in content.lower():
                    automation_data["automated_sequences"].append(f"Batch messaging ({service_file})")
                if 'queue' in content.lower():
                    automation_data["automated_sequences"].append(f"Queued messaging ({service_file})")
                if 'schedule' in content.lower():
                    automation_data["automated_sequences"].append(f"Scheduled messaging ({service_file})")
                
                # Extract trigger events
                trigger_patterns = [
                    r'send\w*Email.*consultation',
                    r'send\w*SMS.*order',
                    r'send\w*.*reminder',
                    r'send\w*.*registration',
                    r'send\w*.*subscription'
                ]
                
                for pattern in trigger_patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    automation_data["trigger_events"].extend(matches)
                
                # Identify scheduling capabilities
                if 'sendAt' in content:
                    automation_data["scheduling_capabilities"].append("Future message scheduling")
                if 'processQueue' in content:
                    automation_data["scheduling_capabilities"].append("Queue processing")
                if 'cron' in content.lower():
                    automation_data["scheduling_capabilities"].append("Cron-based automation")
        
        # Identify CRM workflow opportunities
        automation_data["workflow_opportunities"] = [
            "Lead nurturing email sequences",
            "Consultation follow-up automation",
            "Order status update workflows",
            "Refill reminder campaigns",
            "Subscription lifecycle messaging",
            "Win-back campaigns for churned customers",
            "Appointment reminder sequences",
            "Survey and feedback collection"
        ]
        
        return automation_data

    def _analyze_engagement_tracking(self, context) -> Dict:
        """Analyze engagement tracking capabilities for CRM insights."""
        engagement_data = {
            "tracking_methods": [],
            "metrics_available": [],
            "crm_integration_points": [],
            "analytics_opportunities": []
        }
        
        # Check for webhook tracking
        webhook_file = Path("backend/src/routes/webhooks.js")
        if context.file_exists(webhook_file):
            content = context.read_file(webhook_file)
            
            if 'sendgrid' in content.lower():
                engagement_data["tracking_methods"].append("SendGrid webhook tracking")
                engagement_data["metrics_available"].extend([
                    "Email delivered", "Email opened", "Email clicked", 
                    "Email bounced", "Email unsubscribed"
                ])
            
            if 'twilio' in content.lower():
                engagement_data["tracking_methods"].append("Twilio webhook tracking")
                engagement_data["metrics_available"].extend([
                    "SMS delivered", "SMS failed", "SMS status updates"
                ])
        
        # Check for analytics integration
        analytics_file = Path("backend/src/services/analytics.service.js")
        if context.file_exists(analytics_file):
            content = context.read_file(analytics_file)
            
            if 'trackEvent' in content:
                engagement_data["tracking_methods"].append("Custom analytics tracking")
                engagement_data["metrics_available"].extend([
                    "User interactions", "Conversion events", "Funnel progression"
                ])
        
        # Identify CRM integration points
        engagement_data["crm_integration_points"] = [
            "Email engagement scores for lead scoring",
            "SMS response rates for customer segmentation",
            "Communication preferences for personalization",
            "Engagement history for customer lifecycle mapping",
            "Unsubscribe/opt-out data for compliance"
        ]
        
        # Analytics opportunities
        engagement_data["analytics_opportunities"] = [
            "Communication effectiveness scoring",
            "Channel preference analysis",
            "Engagement-based customer segmentation",
            "Communication ROI measurement",
            "Churn prediction based on engagement decline"
        ]
        
        return engagement_data

    def _analyze_personalization_opportunities(self, context) -> Dict:
        """Analyze personalization capabilities and CRM data integration opportunities."""
        personalization_data = {
            "current_personalization": [],
            "available_data_points": [],
            "crm_enhancement_opportunities": [],
            "dynamic_content_capabilities": []
        }
        
        # Analyze database schema for personalization data
        schema_file = Path("database/complete-schema.sql")
        if context.file_exists(schema_file):
            content = context.read_file(schema_file)
            
            # Extract available data points for personalization
            if 'patients' in content.lower():
                personalization_data["available_data_points"].extend([
                    "Patient name and demographics",
                    "Medical conditions and allergies",
                    "Subscription tier and status",
                    "Order history and preferences",
                    "Geographic location",
                    "Communication preferences"
                ])
            
            if 'consultations' in content.lower():
                personalization_data["available_data_points"].extend([
                    "Consultation history and outcomes",
                    "Provider relationships",
                    "Treatment preferences",
                    "Urgency and severity patterns"
                ])
        
        # Analyze current personalization in templates
        for service_file in ["email.service.js", "sms.service.js"]:
            service_path = Path(f"backend/src/services/{service_file}")
            if context.file_exists(service_path):
                content = context.read_file(service_path)
                
                # Look for personalization tokens
                tokens = re.findall(r'\$\{([^}]+)\}', content)
                personalization_data["current_personalization"].extend(tokens)
        
        # Identify CRM enhancement opportunities
        personalization_data["crm_enhancement_opportunities"] = [
            "Behavioral segmentation based on engagement",
            "Lifecycle stage-based messaging",
            "Medical condition-specific content",
            "Geographic and timezone personalization",
            "Provider relationship-based messaging",
            "Purchase history-based recommendations",
            "Subscription tier-based offers",
            "Engagement level-based frequency"
        ]
        
        # Dynamic content capabilities
        personalization_data["dynamic_content_capabilities"] = [
            "Conditional content blocks",
            "Personalized medication reminders",
            "Location-based pharmacy information",
            "Subscription-specific messaging",
            "Treatment history references",
            "Provider-specific communications"
        ]
        
        return personalization_data

    def _classify_email_type(self, template_name: str, subject: str) -> str:
        """Classify email type for CRM categorization."""
        template_lower = template_name.lower()
        subject_lower = subject.lower()
        
        if any(x in template_lower for x in ['welcome', 'registration']):
            return "Onboarding"
        elif any(x in template_lower for x in ['consultation', 'treatment', 'plan']):
            return "Clinical"
        elif any(x in template_lower for x in ['order', 'shipped', 'delivery']):
            return "Transactional"
        elif any(x in template_lower for x in ['refill', 'reminder', 'subscription']):
            return "Retention"
        elif any(x in template_lower for x in ['reset', 'password', 'security']):
            return "Security"
        else:
            return "General"

    def _classify_sms_type(self, template_name: str) -> str:
        """Classify SMS type for CRM categorization."""
        template_lower = template_name.lower()
        
        if any(x in template_lower for x in ['welcome', 'registration']):
            return "Onboarding"
        elif any(x in template_lower for x in ['order', 'shipped', 'delivery']):
            return "Transactional"
        elif any(x in template_lower for x in ['refill', 'reminder', 'prescription']):
            return "Retention"
        elif any(x in template_lower for x in ['appointment', 'consultation']):
            return "Clinical"
        elif any(x in template_lower for x in ['code', 'verification', 'reset']):
            return "Security"
        else:
            return "General"

    def _extract_personalization_tokens(self, content: str) -> List[str]:
        """Extract personalization tokens from message content."""
        # Look for various personalization patterns
        tokens = []
        
        # ${variable} pattern
        tokens.extend(re.findall(r'\$\{([^}]+)\}', content))
        
        # {{variable}} pattern
        tokens.extend(re.findall(r'\{\{([^}]+)\}\}', content))
        
        # data.variable pattern
        tokens.extend(re.findall(r'data\.(\w+)', content))
        
        return list(set(tokens))  # Remove duplicates

    def _assess_crm_relevance(self, template_name: str, content: str) -> str:
        """Assess CRM relevance of communication template."""
        high_relevance_keywords = ['conversion', 'sales', 'subscription', 'revenue', 'upgrade']
        medium_relevance_keywords = ['engagement', 'retention', 'reminder', 'follow-up']
        
        content_lower = (template_name + " " + content).lower()
        
        if any(keyword in content_lower for keyword in high_relevance_keywords):
            return "High"
        elif any(keyword in content_lower for keyword in medium_relevance_keywords):
            return "Medium"
        else:
            return "Low"

    def _generate_crm_communication_recommendations(self, email_analytics, sms_analytics, automation_analytics, engagement_analytics) -> List[Dict]:
        """Generate CRM-specific communication recommendations."""
        recommendations = []
        
        # Email marketing automation recommendations
        recommendations.append({
            "category": "Email Marketing Automation",
            "recommendations": [
                "Integrate email engagement data for lead scoring",
                "Create drip campaigns based on consultation stages",
                "Implement behavioral triggers for personalized follow-ups",
                "Set up win-back campaigns for inactive patients",
                "Create segmented newsletters based on medical conditions"
            ],
            "crm_benefits": [
                "Improved lead qualification",
                "Higher conversion rates",
                "Better customer retention",
                "Enhanced customer lifetime value"
            ]
        })
        
        # SMS engagement recommendations
        recommendations.append({
            "category": "SMS Engagement Optimization",
            "recommendations": [
                "Use SMS for high-urgency communications",
                "Implement SMS surveys for immediate feedback",
                "Create SMS-based appointment confirmations",
                "Set up SMS alerts for critical health reminders",
                "Optimize SMS timing based on patient preferences"
            ],
            "crm_benefits": [
                "Higher engagement rates",
                "Immediate response tracking",
                "Better appointment attendance",
                "Improved patient compliance"
            ]
        })
        
        # Cross-channel orchestration
        recommendations.append({
            "category": "Cross-Channel Orchestration",
            "recommendations": [
                "Create unified customer journeys across email and SMS",
                "Implement preference-based channel selection",
                "Set up escalation sequences (email → SMS → call)",
                "Create consistent messaging across all channels",
                "Implement channel performance tracking"
            ],
            "crm_benefits": [
                "Consistent customer experience",
                "Optimized communication effectiveness",
                "Reduced communication fatigue",
                "Better customer satisfaction"
            ]
        })
        
        # Personalization and segmentation
        recommendations.append({
            "category": "Advanced Personalization",
            "recommendations": [
                "Implement dynamic content based on medical conditions",
                "Create personalized medication reminders",
                "Use geographic data for localized messaging",
                "Implement engagement-based message frequency",
                "Create provider-specific communication templates"
            ],
            "crm_benefits": [
                "Higher engagement rates",
                "Improved patient satisfaction",
                "Better treatment compliance",
                "Stronger patient-provider relationships"
            ]
        })
        
        return recommendations

    def _generate_findings(self, result: AgentResult, communication_map: Dict):
        """Generate findings based on communication analytics analysis."""
        
        # Email template analysis
        email_count = len(communication_map["email_analytics"]["templates"])
        result.findings.append(
            self.finding(
                title=f"Comprehensive Email Communication Infrastructure ({email_count} Templates)",
                description=(
                    f"Platform has {email_count} email templates covering the full patient lifecycle "
                    f"with {len(communication_map['email_analytics']['tracking_capabilities'])} tracking capabilities. "
                    f"Ready for CRM integration with advanced personalization and automation."
                ),
                severity="info",
                tags=["communication", "email", "crm"]
            )
        )
        
        # SMS template analysis
        sms_count = len(communication_map["sms_analytics"]["templates"])
        result.findings.append(
            self.finding(
                title=f"Robust SMS Communication System ({sms_count} Templates)",
                description=(
                    f"Platform includes {sms_count} SMS templates with delivery tracking and opt-out management. "
                    f"High CRM integration potential for real-time engagement and immediate response tracking."
                ),
                severity="info",
                tags=["communication", "sms", "crm"]
            )
        )
        
        # Automation capabilities
        automation_count = len(communication_map["automation_analytics"]["automated_sequences"])
        result.findings.append(
            self.finding(
                title=f"Advanced Communication Automation Ready ({automation_count} Sequences)",
                description=(
                    f"Platform supports {automation_count} automated communication sequences with scheduling "
                    f"and queue processing. Ideal foundation for CRM-driven communication workflows."
                ),
                severity="info",
                tags=["communication", "automation", "crm"]
            )
        )
        
        # Engagement tracking
        tracking_count = len(communication_map["engagement_analytics"]["tracking_methods"])
        result.findings.append(
            self.finding(
                title=f"Comprehensive Engagement Tracking ({tracking_count} Methods)",
                description=(
                    f"Platform tracks engagement through {tracking_count} methods providing "
                    f"{len(communication_map['engagement_analytics']['metrics_available'])} metrics. "
                    f"Excellent data foundation for CRM lead scoring and customer insights."
                ),
                severity="info",
                tags=["communication", "engagement", "analytics"]
            )
        )
        
        # Personalization opportunities
        data_points_count = len(communication_map["personalization_analytics"]["available_data_points"])
        result.findings.append(
            self.finding(
                title=f"Rich Personalization Data Available ({data_points_count} Data Points)",
                description=(
                    f"Platform captures {data_points_count} data points for personalization including "
                    f"medical conditions, subscription status, and engagement history. "
                    f"High potential for CRM-driven personalized communication campaigns."
                ),
                severity="medium",
                tags=["communication", "personalization", "crm"]
            )
        )
        
        # Integration recommendations
        rec_count = len(communication_map["crm_communication_recommendations"])
        result.findings.append(
            self.finding(
                title=f"CRM Communication Integration Strategy ({rec_count} Recommendations)",
                description=(
                    f"Generated {rec_count} specific recommendation categories for CRM communication integration "
                    f"covering email automation, SMS optimization, cross-channel orchestration, and personalization."
                ),
                severity="medium",
                tags=["crm", "communication", "strategy"]
            )
        )
