"""CRM Integration agent for identifying all CRM touchpoints and data flows."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Dict, List, Set

from models import AgentResult, SharedState
from agents.base import BaseAgent


class CRMIntegrationAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__(
            name="CRM Integration Mapper",
            description="Maps all CRM touchpoints, data flows, and integration opportunities.",
        )

    def run(self, context, state: SharedState) -> AgentResult:
        result = AgentResult()
        
        # Analyze database schema for CRM-relevant data points
        crm_data_points = self._analyze_database_schema(context)
        
        # Analyze communication services for CRM integration
        communication_integrations = self._analyze_communication_services(context)
        
        # Analyze API endpoints for CRM consumption
        api_endpoints = self._analyze_api_endpoints(context)
        
        # Analyze webhook infrastructure
        webhook_opportunities = self._analyze_webhook_infrastructure(context)
        
        # Analyze analytics events for CRM insights
        analytics_insights = self._analyze_analytics_events(context)
        
        # Create comprehensive CRM integration map
        integration_map = {
            "crm_data_points": crm_data_points,
            "communication_integrations": communication_integrations,
            "api_endpoints": api_endpoints,
            "webhook_opportunities": webhook_opportunities,
            "analytics_insights": analytics_insights,
            "integration_recommendations": self._generate_integration_recommendations(
                crm_data_points, communication_integrations, api_endpoints, webhook_opportunities
            )
        }
        
        # Store the integration map in shared state
        state.set_artifact(self.name, "crm_integration_map", integration_map)
        
        # Generate findings
        self._generate_findings(result, integration_map)
        
        return result

    def _analyze_database_schema(self, context) -> Dict:
        """Analyze database schema for CRM-relevant data points."""
        crm_data = {
            "patient_data": [],
            "interaction_history": [],
            "conversion_events": [],
            "lifecycle_stages": []
        }
        
        # Look for database schema files
        schema_files = []
        for file_path in context.all_files():
            if any(x in str(file_path).lower() for x in ['schema', 'migration', 'database']):
                if file_path.suffix in ['.sql', '.js']:
                    schema_files.append(file_path)
        
        for schema_file in schema_files:
            try:
                content = context.read_file(schema_file)
                
                # Analyze patient-related tables
                if 'patients' in content.lower():
                    crm_data["patient_data"].extend([
                        "Demographics (name, email, phone, address)",
                        "Medical information (allergies, conditions, medications)",
                        "Subscription data (tier, status, dates)",
                        "Financial data (total_spent, stripe_customer_id)",
                        "Profile data (emergency contacts, insurance)"
                    ])
                
                # Analyze interaction tables
                if any(x in content.lower() for x in ['consultations', 'messages', 'orders']):
                    crm_data["interaction_history"].extend([
                        "Consultation history and outcomes",
                        "Message exchanges between patient/provider",
                        "Order history and fulfillment status",
                        "Support ticket interactions"
                    ])
                
                # Analyze conversion tracking
                if 'analytics_events' in content.lower():
                    crm_data["conversion_events"].extend([
                        "Funnel progression tracking",
                        "Form completion metrics",
                        "Conversion rate data",
                        "User journey mapping"
                    ])
                
                # Identify lifecycle stages
                crm_data["lifecycle_stages"].extend([
                    "New visitor → Lead",
                    "Lead → Consultation submitted",
                    "Consultation → Treatment plan",
                    "Treatment plan → Order placed",
                    "Order → Subscription",
                    "Subscription → Renewal/Churn"
                ])
                
            except Exception:
                continue
        
        return crm_data

    def _analyze_communication_services(self, context) -> Dict:
        """Analyze email and SMS services for CRM integration opportunities."""
        communications = {
            "email_integrations": [],
            "sms_integrations": [],
            "automation_triggers": [],
            "engagement_tracking": []
        }
        
        # Analyze email service
        email_service_path = Path("backend/src/services/email.service.js")
        if context.file_exists(email_service_path):
            content = context.read_file(email_service_path)
            
            # Extract email templates
            template_matches = re.findall(r'(\w+):\s*{[^}]*subject.*?html:', content, re.DOTALL)
            for template in template_matches:
                communications["email_integrations"].append(f"Email template: {template}")
            
            # Check for SendGrid integration
            if 'sendgrid' in content.lower():
                communications["email_integrations"].append("SendGrid API integration")
                communications["engagement_tracking"].append("Email open/click tracking")
            
            # Check for email logging
            if 'email_logs' in content:
                communications["engagement_tracking"].append("Email delivery status logging")
        
        # Analyze SMS service
        sms_service_path = Path("backend/src/services/sms.service.js")
        if context.file_exists(sms_service_path):
            content = context.read_file(sms_service_path)
            
            # Extract SMS templates
            template_matches = re.findall(r'(\w+):\s*\([^)]*\)\s*=>', content)
            for template in template_matches:
                communications["sms_integrations"].append(f"SMS template: {template}")
            
            # Check for Twilio integration
            if 'twilio' in content.lower():
                communications["sms_integrations"].append("Twilio API integration")
                communications["engagement_tracking"].append("SMS delivery status tracking")
            
            # Check for opt-out management
            if 'opt_out' in content:
                communications["sms_integrations"].append("SMS opt-out management")
        
        # Identify automation triggers
        communications["automation_triggers"].extend([
            "New patient registration",
            "Consultation status changes",
            "Order status updates",
            "Refill reminders",
            "Subscription renewals",
            "Support ticket creation"
        ])
        
        return communications

    def _analyze_api_endpoints(self, context) -> Dict:
        """Analyze API endpoints that CRMs could consume."""
        endpoints = {
            "patient_endpoints": [],
            "consultation_endpoints": [],
            "analytics_endpoints": [],
            "webhook_endpoints": []
        }
        
        # Analyze route files
        routes_dir = Path("backend/src/routes")
        if context.directory_exists(routes_dir):
            for route_file in context.list_directory(routes_dir):
                if route_file.suffix == '.js':
                    try:
                        content = context.read_file(route_file)
                        
                        # Extract API endpoints
                        route_matches = re.findall(r'router\.(get|post|put|delete)\([\'"]([^\'"]+)', content)
                        
                        for method, path in route_matches:
                            endpoint = f"{method.upper()} {path}"
                            
                            # Categorize endpoints
                            if 'patient' in str(route_file).lower():
                                endpoints["patient_endpoints"].append(endpoint)
                            elif 'consultation' in str(route_file).lower():
                                endpoints["consultation_endpoints"].append(endpoint)
                            elif 'webhook' in str(route_file).lower():
                                endpoints["webhook_endpoints"].append(endpoint)
                            elif any(x in str(route_file).lower() for x in ['analytics', 'admin']):
                                endpoints["analytics_endpoints"].append(endpoint)
                    
                    except Exception:
                        continue
        
        return endpoints

    def _analyze_webhook_infrastructure(self, context) -> Dict:
        """Analyze existing webhook infrastructure for CRM integration."""
        webhooks = {
            "existing_webhooks": [],
            "crm_webhook_opportunities": [],
            "data_sync_points": []
        }
        
        # Check webhook routes file
        webhook_file = Path("backend/src/routes/webhooks.js")
        if context.file_exists(webhook_file):
            content = context.read_file(webhook_file)
            
            # Extract existing webhook endpoints
            webhook_matches = re.findall(r'router\.post\([\'"]([^\'"]+)', content)
            webhooks["existing_webhooks"] = [f"POST {path}" for path in webhook_matches]
        
        # Identify CRM webhook opportunities
        webhooks["crm_webhook_opportunities"].extend([
            "Patient registration webhook for lead creation",
            "Consultation completion webhook for opportunity tracking",
            "Order placement webhook for revenue tracking",
            "Subscription changes webhook for customer lifecycle",
            "Support ticket webhook for service tracking"
        ])
        
        # Identify data synchronization points
        webhooks["data_sync_points"].extend([
            "Real-time patient data updates",
            "Consultation status changes",
            "Payment and subscription status",
            "Communication preferences",
            "Engagement metrics"
        ])
        
        return webhooks

    def _analyze_analytics_events(self, context) -> Dict:
        """Analyze analytics service for CRM insights."""
        analytics = {
            "tracked_events": [],
            "conversion_funnels": [],
            "crm_insights": []
        }
        
        # Analyze analytics service
        analytics_file = Path("backend/src/services/analytics.service.js")
        if context.file_exists(analytics_file):
            content = context.read_file(analytics_file)
            
            # Extract tracked event types
            if 'trackEvent' in content:
                analytics["tracked_events"].extend([
                    "Form interactions and completion",
                    "Funnel step progression",
                    "Conversion events",
                    "User journey paths"
                ])
            
            # Extract funnel definitions
            funnel_matches = re.findall(r'track(\w+)Funnel', content)
            analytics["conversion_funnels"] = [f"{funnel} funnel" for funnel in funnel_matches]
        
        # Identify CRM insights opportunities
        analytics["crm_insights"].extend([
            "Lead scoring based on funnel progression",
            "Customer lifetime value prediction",
            "Churn risk identification",
            "Engagement scoring",
            "Conversion optimization insights"
        ])
        
        return analytics

    def _generate_integration_recommendations(self, crm_data, communications, endpoints, webhooks) -> List[Dict]:
        """Generate specific CRM integration recommendations."""
        recommendations = []
        
        # Salesforce integration recommendations
        recommendations.append({
            "crm_platform": "Salesforce",
            "integration_type": "REST API + Webhooks",
            "recommended_objects": [
                "Lead (new visitors/consultations)",
                "Account (patient records)",
                "Contact (patient contact info)",
                "Opportunity (consultation → order conversion)",
                "Case (support tickets)",
                "Custom Objects (prescriptions, orders)"
            ],
            "data_sync_strategy": "Bi-directional real-time sync",
            "automation_opportunities": [
                "Lead nurturing campaigns",
                "Consultation follow-up sequences",
                "Refill reminder automation",
                "Customer health scores"
            ]
        })
        
        # HubSpot integration recommendations
        recommendations.append({
            "crm_platform": "HubSpot",
            "integration_type": "REST API + Webhooks",
            "recommended_objects": [
                "Contacts (patient database)",
                "Companies (healthcare providers)",
                "Deals (consultation pipeline)",
                "Tickets (support system)",
                "Custom Objects (medical records)"
            ],
            "data_sync_strategy": "Real-time webhook-based sync",
            "automation_opportunities": [
                "Email marketing campaigns",
                "Lead scoring automation",
                "Customer journey tracking",
                "Health engagement scoring"
            ]
        })
        
        # Pipedrive integration recommendations
        recommendations.append({
            "crm_platform": "Pipedrive",
            "integration_type": "REST API",
            "recommended_objects": [
                "Persons (patients)",
                "Deals (consultations)",
                "Organizations (pharmacy partners)",
                "Activities (communications)",
                "Notes (consultation notes)"
            ],
            "data_sync_strategy": "Scheduled sync with real-time triggers",
            "automation_opportunities": [
                "Sales pipeline management",
                "Consultation outcome tracking",
                "Revenue forecasting",
                "Customer retention campaigns"
            ]
        })
        
        return recommendations

    def _generate_findings(self, result: AgentResult, integration_map: Dict):
        """Generate findings based on CRM integration analysis."""
        
        # High-impact CRM integration opportunities
        result.findings.append(
            self.finding(
                title="Comprehensive CRM Integration Infrastructure Ready",
                description=(
                    f"Platform has robust infrastructure for CRM integration including: "
                    f"{len(integration_map['communication_integrations']['email_integrations'])} email integrations, "
                    f"{len(integration_map['communication_integrations']['sms_integrations'])} SMS integrations, "
                    f"{len(integration_map['api_endpoints']['patient_endpoints'])} patient API endpoints, "
                    f"and {len(integration_map['webhook_opportunities']['existing_webhooks'])} webhook endpoints."
                ),
                severity="info",
                tags=["crm", "integration", "infrastructure"]
            )
        )
        
        # Data richness assessment
        result.findings.append(
            self.finding(
                title="Rich Patient Data Available for CRM Synchronization",
                description=(
                    "Platform captures comprehensive patient data including demographics, medical history, "
                    "consultation records, order history, subscription data, and engagement metrics - "
                    "ideal for advanced CRM segmentation and automation."
                ),
                severity="info",
                tags=["crm", "data", "segmentation"]
            )
        )
        
        # Communication automation opportunities
        result.findings.append(
            self.finding(
                title="Advanced Communication Automation Ready for CRM Integration",
                description=(
                    f"Existing communication infrastructure includes "
                    f"{len(integration_map['communication_integrations']['automation_triggers'])} automation triggers "
                    f"and comprehensive engagement tracking - ready for CRM workflow automation."
                ),
                severity="info", 
                tags=["crm", "automation", "communication"]
            )
        )
        
        # Conversion tracking capabilities
        result.findings.append(
            self.finding(
                title="Sophisticated Analytics for CRM Lead Scoring",
                description=(
                    "Platform tracks detailed conversion funnels, form interactions, and user journeys - "
                    "providing rich data for CRM lead scoring and customer lifecycle management."
                ),
                severity="info",
                tags=["crm", "analytics", "lead-scoring"]
            )
        )
        
        # Integration recommendations
        for rec in integration_map["integration_recommendations"]:
            result.findings.append(
                self.finding(
                    title=f"{rec['crm_platform']} Integration Architecture Recommended",
                    description=(
                        f"Recommended {rec['integration_type']} integration with "
                        f"{len(rec['recommended_objects'])} CRM objects and "
                        f"{len(rec['automation_opportunities'])} automation opportunities. "
                        f"Sync strategy: {rec['data_sync_strategy']}"
                    ),
                    severity="medium",
                    tags=["crm", rec['crm_platform'].lower(), "recommendation"]
                )
            )
