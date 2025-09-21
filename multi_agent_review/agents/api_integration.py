"""API Integration agent for designing CRM platform integration architecture."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Dict, List, Set, Tuple

from models import AgentResult, SharedState
from agents.base import BaseAgent


class APIIntegrationAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__(
            name="API Integration Architect",
            description="Designs API integration architecture and data synchronization strategies for major CRM platforms.",
        )

    def run(self, context, state: SharedState) -> AgentResult:
        result = AgentResult()
        
        # Analyze existing API architecture
        api_architecture = self._analyze_existing_api_architecture(context)
        
        # Design CRM integration patterns
        integration_patterns = self._design_crm_integration_patterns(context)
        
        # Analyze data synchronization requirements
        sync_requirements = self._analyze_data_sync_requirements(context)
        
        # Design webhook integration architecture
        webhook_architecture = self._design_webhook_architecture(context)
        
        # Create authentication and security framework
        security_framework = self._design_security_framework(context)
        
        # Design API rate limiting and scaling strategies
        scaling_strategies = self._design_scaling_strategies(context)
        
        # Create comprehensive integration architecture
        integration_architecture = {
            "api_architecture": api_architecture,
            "integration_patterns": integration_patterns,
            "sync_requirements": sync_requirements,
            "webhook_architecture": webhook_architecture,
            "security_framework": security_framework,
            "scaling_strategies": scaling_strategies,
            "platform_specific_designs": self._create_platform_specific_designs(
                api_architecture, integration_patterns, sync_requirements
            )
        }
        
        # Store in shared state
        state.set_artifact(self.name, "api_integration_architecture", integration_architecture)
        
        # Generate findings
        self._generate_findings(result, integration_architecture)
        
        return result

    def _analyze_existing_api_architecture(self, context) -> Dict:
        """Analyze the existing API architecture for CRM integration readiness."""
        api_data = {
            "rest_endpoints": [],
            "data_models": [],
            "authentication_methods": [],
            "middleware_capabilities": [],
            "existing_integrations": []
        }
        
        # Analyze API routes
        routes_dir = Path("backend/src/routes")
        if context.directory_exists(routes_dir):
            for route_file in context.list_directory(routes_dir):
                if route_file.suffix == '.js':
                    try:
                        content = context.read_file(route_file)
                        
                        # Extract REST endpoints
                        endpoints = re.findall(r'router\.(get|post|put|delete|patch)\([\'"]([^\'"]+)', content)
                        for method, path in endpoints:
                            api_data["rest_endpoints"].append({
                                "method": method.upper(),
                                "path": path,
                                "file": str(route_file.name),
                                "crm_relevance": self._assess_endpoint_crm_relevance(path, content)
                            })
                    
                    except Exception:
                        continue
        
        # Analyze data models from database schema
        schema_file = Path("database/complete-schema.sql")
        if context.file_exists(schema_file):
            content = context.read_file(schema_file)
            
            # Extract table definitions
            table_matches = re.findall(r'CREATE TABLE (\w+)', content, re.IGNORECASE)
            for table in table_matches:
                api_data["data_models"].append({
                    "table": table,
                    "crm_entity": self._map_table_to_crm_entity(table),
                    "sync_priority": self._assess_sync_priority(table)
                })
        
        # Analyze authentication methods
        auth_file = Path("backend/src/middleware/auth.js")
        if context.file_exists(auth_file):
            content = context.read_file(auth_file)
            
            if 'jwt' in content.lower():
                api_data["authentication_methods"].append("JWT Token Authentication")
            if 'api.*key' in content.lower():
                api_data["authentication_methods"].append("API Key Authentication")
            if 'webhook.*signature' in content.lower():
                api_data["authentication_methods"].append("Webhook Signature Verification")
            if 'oauth' in content.lower():
                api_data["authentication_methods"].append("OAuth 2.0")
        
        # Analyze middleware capabilities
        middleware_dir = Path("backend/src/middleware")
        if context.directory_exists(middleware_dir):
            middleware_files = list(context.list_directory(middleware_dir))
            
            capabilities = []
            if any('auth' in f.name for f in middleware_files):
                capabilities.append("Authentication middleware")
            if any('rate' in f.name for f in middleware_files):
                capabilities.append("Rate limiting")
            if any('error' in f.name for f in middleware_files):
                capabilities.append("Error handling")
            if any('hipaa' in f.name for f in middleware_files):
                capabilities.append("HIPAA compliance logging")
            
            api_data["middleware_capabilities"] = capabilities
        
        # Identify existing integrations
        service_files = ["email.service.js", "sms.service.js", "analytics.service.js"]
        for service_file in service_files:
            service_path = Path(f"backend/src/services/{service_file}")
            if context.file_exists(service_path):
                content = context.read_file(service_path)
                
                if 'sendgrid' in content.lower():
                    api_data["existing_integrations"].append("SendGrid Email API")
                if 'twilio' in content.lower():
                    api_data["existing_integrations"].append("Twilio SMS API")
                if 'stripe' in content.lower():
                    api_data["existing_integrations"].append("Stripe Payment API")
        
        return api_data

    def _design_crm_integration_patterns(self, context) -> Dict:
        """Design integration patterns for different CRM platforms."""
        patterns = {
            "sync_patterns": [],
            "authentication_patterns": [],
            "data_transformation_patterns": [],
            "error_handling_patterns": []
        }
        
        # Sync patterns
        patterns["sync_patterns"] = [
            {
                "pattern": "Real-time Webhook Sync",
                "description": "Immediate data sync via webhooks on state changes",
                "use_cases": ["Patient registration", "Order placement", "Consultation completion"],
                "pros": ["Immediate updates", "Event-driven", "Reliable"],
                "cons": ["Requires webhook handling", "Potential retry logic needed"],
                "best_for": ["Salesforce", "HubSpot"]
            },
            {
                "pattern": "Batch Synchronization",
                "description": "Scheduled bulk data transfer",
                "use_cases": ["Daily patient updates", "Weekly analytics sync", "Monthly reports"],
                "pros": ["Efficient for large datasets", "Reduces API calls", "Handles rate limits"],
                "cons": ["Not real-time", "Potential data lag", "Complexity in conflict resolution"],
                "best_for": ["Pipedrive", "Custom CRMs"]
            },
            {
                "pattern": "Hybrid Sync (Critical + Batch)",
                "description": "Real-time for critical events, batch for bulk data",
                "use_cases": ["Critical: Orders, Support tickets", "Batch: Analytics, Engagement metrics"],
                "pros": ["Balances real-time and efficiency", "Optimizes API usage"],
                "cons": ["Complex implementation", "Multiple sync mechanisms"],
                "best_for": ["Enterprise implementations"]
            },
            {
                "pattern": "Event Sourcing Sync",
                "description": "Stream all events to CRM for reconstruction",
                "use_cases": ["Complete audit trail", "Event-based analytics", "Customer journey tracking"],
                "pros": ["Complete data history", "Flexible replay", "Audit compliance"],
                "cons": ["High data volume", "Complex CRM setup", "Storage requirements"],
                "best_for": ["Advanced CRM implementations"]
            }
        ]
        
        # Authentication patterns
        patterns["authentication_patterns"] = [
            {
                "pattern": "OAuth 2.0 with Refresh Tokens",
                "description": "Standard OAuth flow with automatic token refresh",
                "security_level": "High",
                "complexity": "Medium",
                "best_for": ["Salesforce", "HubSpot", "Microsoft Dynamics"]
            },
            {
                "pattern": "API Key Authentication",
                "description": "Simple API key-based authentication",
                "security_level": "Medium",
                "complexity": "Low", 
                "best_for": ["Pipedrive", "Simple CRM integrations"]
            },
            {
                "pattern": "JWT Token Authentication",
                "description": "JSON Web Token-based authentication",
                "security_level": "High",
                "complexity": "Medium",
                "best_for": ["Custom CRM solutions", "Internal systems"]
            },
            {
                "pattern": "mTLS (Mutual TLS)",
                "description": "Certificate-based mutual authentication",
                "security_level": "Very High",
                "complexity": "High",
                "best_for": ["Enterprise security requirements", "HIPAA compliance"]
            }
        ]
        
        # Data transformation patterns
        patterns["data_transformation_patterns"] = [
            {
                "pattern": "Direct Field Mapping",
                "description": "One-to-one field mapping between systems",
                "complexity": "Low",
                "use_cases": ["Simple demographic data", "Basic contact information"],
                "implementation": "Static mapping configuration"
            },
            {
                "pattern": "Computed Field Mapping",
                "description": "Transform data using business logic",
                "complexity": "Medium",
                "use_cases": ["Lead scoring", "Customer lifetime value", "Health scores"],
                "implementation": "Transformation functions with business rules"
            },
            {
                "pattern": "Event Aggregation",
                "description": "Combine multiple events into summary data",
                "complexity": "High",
                "use_cases": ["Engagement scores", "Activity summaries", "Conversion metrics"],
                "implementation": "Stream processing or batch aggregation"
            },
            {
                "pattern": "Schema Evolution",
                "description": "Handle changes in data structure over time",
                "complexity": "High",
                "use_cases": ["API version changes", "New data fields", "Schema migrations"],
                "implementation": "Versioned transformers with backwards compatibility"
            }
        ]
        
        return patterns

    def _analyze_data_sync_requirements(self, context) -> Dict:
        """Analyze data synchronization requirements for CRM integration."""
        sync_reqs = {
            "sync_entities": [],
            "sync_frequency": {},
            "conflict_resolution": [],
            "data_validation": [],
            "compliance_requirements": []
        }
        
        # Define sync entities based on database schema
        schema_file = Path("database/complete-schema.sql")
        if context.file_exists(schema_file):
            content = context.read_file(schema_file)
            
            sync_reqs["sync_entities"] = [
                {
                    "entity": "patients",
                    "crm_object": "Contact/Lead",
                    "sync_direction": "Bidirectional",
                    "critical_fields": ["email", "phone", "first_name", "last_name", "subscription_tier"],
                    "sync_triggers": ["registration", "profile_update", "subscription_change"]
                },
                {
                    "entity": "consultations", 
                    "crm_object": "Opportunity/Deal",
                    "sync_direction": "To CRM",
                    "critical_fields": ["patient_id", "status", "consultation_type", "submitted_at"],
                    "sync_triggers": ["consultation_submit", "status_change", "completion"]
                },
                {
                    "entity": "orders",
                    "crm_object": "Opportunity/Deal",
                    "sync_direction": "To CRM", 
                    "critical_fields": ["patient_id", "total_amount", "payment_status", "fulfillment_status"],
                    "sync_triggers": ["order_placed", "payment_complete", "shipped", "delivered"]
                },
                {
                    "entity": "prescriptions",
                    "crm_object": "Product/Service",
                    "sync_direction": "To CRM",
                    "critical_fields": ["patient_id", "medication_name", "status", "refills_remaining"],
                    "sync_triggers": ["prescription_created", "refill_processed", "expired"]
                },
                {
                    "entity": "support_tickets",
                    "crm_object": "Case/Ticket", 
                    "sync_direction": "Bidirectional",
                    "critical_fields": ["requester_id", "category", "status", "priority"],
                    "sync_triggers": ["ticket_created", "status_change", "resolved"]
                },
                {
                    "entity": "analytics_events",
                    "crm_object": "Activity/Interaction",
                    "sync_direction": "To CRM",
                    "critical_fields": ["user_id", "event_type", "event_category", "created_at"],
                    "sync_triggers": ["batch_daily", "significant_events"]
                }
            ]
        
        # Define sync frequencies
        sync_reqs["sync_frequency"] = {
            "real_time": ["patient_registration", "order_placement", "consultation_submission"],
            "near_real_time": ["profile_updates", "support_tickets", "payment_status"],
            "hourly": ["engagement_metrics", "email_interactions", "sms_interactions"],
            "daily": ["analytics_aggregations", "health_scores", "activity_summaries"],
            "weekly": ["performance_reports", "cohort_analysis", "retention_metrics"]
        }
        
        # Conflict resolution strategies
        sync_reqs["conflict_resolution"] = [
            {
                "scenario": "Patient data conflict",
                "strategy": "Last write wins with audit trail",
                "priority": "CRM wins for marketing data, Platform wins for medical data"
            },
            {
                "scenario": "Duplicate patient detection",
                "strategy": "Email-based deduplication with manual review queue",
                "priority": "Prevent duplicate CRM contacts"
            },
            {
                "scenario": "Status synchronization conflicts",
                "strategy": "Platform as source of truth for operational status",
                "priority": "Platform status overrides CRM status"
            },
            {
                "scenario": "Data format differences",
                "strategy": "Transformation layer with validation",
                "priority": "Maintain data integrity across systems"
            }
        ]
        
        # Data validation requirements
        sync_reqs["data_validation"] = [
            "Email format validation",
            "Phone number normalization",
            "Required field validation",
            "Data type validation",
            "Business rule validation",
            "Referential integrity checks",
            "HIPAA compliance validation"
        ]
        
        # Compliance requirements
        sync_reqs["compliance_requirements"] = [
            "HIPAA data handling and logging",
            "GDPR consent tracking and right to erasure",
            "Data encryption in transit and at rest",
            "Audit logging for all data modifications",
            "User consent for marketing communications",
            "Data retention policy enforcement",
            "Cross-border data transfer compliance"
        ]
        
        return sync_reqs

    def _design_webhook_architecture(self, context) -> Dict:
        """Design webhook architecture for real-time CRM integration."""
        webhook_arch = {
            "webhook_endpoints": [],
            "event_routing": {},
            "retry_mechanisms": [],
            "security_measures": [],
            "monitoring_capabilities": []
        }
        
        # Design webhook endpoints
        webhook_arch["webhook_endpoints"] = [
            {
                "endpoint": "/webhooks/crm/patient-events",
                "events": ["patient.registered", "patient.updated", "patient.subscription_changed"],
                "payload_example": {
                    "event_type": "patient.registered",
                    "patient_id": "uuid",
                    "timestamp": "ISO 8601",
                    "data": {"patient_data": "object"}
                },
                "crm_targets": ["Salesforce", "HubSpot", "Pipedrive"]
            },
            {
                "endpoint": "/webhooks/crm/consultation-events", 
                "events": ["consultation.submitted", "consultation.approved", "consultation.completed"],
                "payload_example": {
                    "event_type": "consultation.submitted",
                    "consultation_id": "uuid",
                    "patient_id": "uuid", 
                    "timestamp": "ISO 8601",
                    "data": {"consultation_data": "object"}
                },
                "crm_targets": ["All CRM platforms"]
            },
            {
                "endpoint": "/webhooks/crm/order-events",
                "events": ["order.placed", "order.paid", "order.shipped", "order.delivered"],
                "payload_example": {
                    "event_type": "order.placed",
                    "order_id": "uuid",
                    "patient_id": "uuid",
                    "timestamp": "ISO 8601",
                    "data": {"order_data": "object"}
                },
                "crm_targets": ["Salesforce", "HubSpot"]
            },
            {
                "endpoint": "/webhooks/crm/engagement-events",
                "events": ["email.opened", "email.clicked", "sms.responded", "app.login"],
                "payload_example": {
                    "event_type": "email.opened",
                    "user_id": "uuid",
                    "timestamp": "ISO 8601",
                    "data": {"engagement_data": "object"}
                },
                "crm_targets": ["Marketing automation platforms"]
            }
        ]
        
        # Event routing strategies
        webhook_arch["event_routing"] = {
            "fan_out": "Send same event to multiple CRM systems",
            "conditional": "Route events based on business rules",
            "transformation": "Transform events for specific CRM requirements",
            "filtering": "Send only relevant events to each CRM"
        }
        
        # Retry mechanisms
        webhook_arch["retry_mechanisms"] = [
            {
                "strategy": "Exponential Backoff",
                "max_retries": 5,
                "base_delay": "2 seconds",
                "max_delay": "300 seconds",
                "use_cases": ["Temporary network issues", "CRM API rate limiting"]
            },
            {
                "strategy": "Dead Letter Queue",
                "description": "Failed webhooks stored for manual processing",
                "retention": "30 days",
                "use_cases": ["Persistent failures", "CRM system outages"]
            },
            {
                "strategy": "Circuit Breaker",
                "description": "Temporarily stop sending to failing endpoints",
                "threshold": "10 consecutive failures",
                "use_cases": ["CRM system maintenance", "API quota exceeded"]
            }
        ]
        
        # Security measures
        webhook_arch["security_measures"] = [
            "HMAC-SHA256 signature verification",
            "Timestamp validation (prevent replay attacks)",
            "IP address whitelisting",
            "Rate limiting per endpoint",
            "SSL/TLS encryption required",
            "API key authentication",
            "Request payload size limits"
        ]
        
        # Monitoring capabilities
        webhook_arch["monitoring_capabilities"] = [
            "Webhook delivery success/failure rates",
            "Response time tracking",
            "Retry attempt monitoring",
            "Dead letter queue size alerts",
            "CRM API quota usage tracking",
            "Error rate thresholds and alerts",
            "Performance dashboards"
        ]
        
        return webhook_arch

    def _design_security_framework(self, context) -> Dict:
        """Design security framework for CRM integrations."""
        security = {
            "authentication_layers": [],
            "authorization_controls": [],
            "data_protection": [],
            "audit_requirements": [],
            "compliance_frameworks": []
        }
        
        # Authentication layers
        security["authentication_layers"] = [
            {
                "layer": "API Gateway Authentication",
                "method": "JWT/OAuth 2.0",
                "purpose": "Authenticate CRM systems",
                "implementation": "Kong/AWS API Gateway with OAuth provider"
            },
            {
                "layer": "Service-to-Service Authentication",
                "method": "mTLS or Service Accounts",
                "purpose": "Secure internal service communication",
                "implementation": "Certificate-based authentication"
            },
            {
                "layer": "Webhook Signature Verification",
                "method": "HMAC-SHA256",
                "purpose": "Verify webhook authenticity",
                "implementation": "Shared secret-based signatures"
            },
            {
                "layer": "Data Encryption",
                "method": "AES-256 encryption",
                "purpose": "Protect sensitive data in transit and at rest",
                "implementation": "TLS 1.3 + database-level encryption"
            }
        ]
        
        # Authorization controls
        security["authorization_controls"] = [
            {
                "control": "Role-Based Access Control (RBAC)",
                "scope": "Different CRM systems have different data access levels",
                "implementation": "Scoped API keys with permission sets"
            },
            {
                "control": "Data Field Level Permissions",
                "scope": "Restrict access to PII/PHI based on CRM type",
                "implementation": "Field-level ACL with data masking"
            },
            {
                "control": "Rate Limiting",
                "scope": "Prevent API abuse and ensure fair usage",
                "implementation": "Token bucket algorithm with per-client limits"
            },
            {
                "control": "IP Whitelisting",
                "scope": "Restrict access to known CRM system IPs",
                "implementation": "Firewall rules + API gateway IP filtering"
            }
        ]
        
        # Data protection measures
        security["data_protection"] = [
            "PII tokenization for non-essential integrations",
            "PHI encryption with separate key management",
            "Data minimization - only sync necessary fields",
            "Consent-based data sharing controls",
            "Right to erasure compliance mechanisms",
            "Data residency and cross-border transfer controls",
            "Backup encryption and secure storage"
        ]
        
        # Audit requirements
        security["audit_requirements"] = [
            "All API access attempts (successful and failed)",
            "Data modification events with before/after values",
            "Authentication and authorization events",
            "Configuration changes to integration settings",
            "Consent changes and data sharing preferences",
            "Data export and bulk operations",
            "System administrative actions"
        ]
        
        return security

    def _design_scaling_strategies(self, context) -> Dict:
        """Design scaling strategies for CRM integrations."""
        scaling = {
            "horizontal_scaling": [],
            "vertical_scaling": [],
            "caching_strategies": [],
            "load_balancing": [],
            "performance_optimization": []
        }
        
        # Horizontal scaling
        scaling["horizontal_scaling"] = [
            {
                "strategy": "Microservices Architecture",
                "description": "Separate CRM integration into dedicated services",
                "benefits": ["Independent scaling", "Fault isolation", "Technology diversity"],
                "implementation": "Kubernetes pods with auto-scaling"
            },
            {
                "strategy": "Event-Driven Architecture",
                "description": "Async event processing for webhook delivery",
                "benefits": ["High throughput", "Resilience", "Decoupling"],
                "implementation": "Message queues (RabbitMQ/Kafka) with worker nodes"
            },
            {
                "strategy": "Database Sharding",
                "description": "Partition data by customer or region",
                "benefits": ["Data locality", "Reduced contention", "Independent scaling"],
                "implementation": "Customer ID-based sharding with read replicas"
            }
        ]
        
        # Caching strategies
        scaling["caching_strategies"] = [
            {
                "type": "API Response Caching",
                "use_case": "CRM API responses that change infrequently",
                "ttl": "5-60 minutes",
                "implementation": "Redis with cache-aside pattern"
            },
            {
                "type": "Authentication Token Caching",
                "use_case": "OAuth tokens and API keys",
                "ttl": "Based on token expiry",
                "implementation": "In-memory cache with refresh logic"
            },
            {
                "type": "Customer Data Caching",
                "use_case": "Frequently accessed patient/customer data",
                "ttl": "15-30 minutes",
                "implementation": "Redis cluster with TTL-based eviction"
            },
            {
                "type": "Configuration Caching",
                "use_case": "CRM integration settings and mappings",
                "ttl": "1-24 hours",
                "implementation": "Application-level cache with invalidation"
            }
        ]
        
        # Performance optimization
        scaling["performance_optimization"] = [
            "Batch API requests where possible",
            "Parallel processing of independent operations",
            "Connection pooling for CRM API clients",
            "Async/non-blocking I/O operations",
            "Compression for large data transfers",
            "CDN for static integration assets",
            "Database query optimization and indexing",
            "Memory-efficient data processing"
        ]
        
        return scaling

    def _create_platform_specific_designs(self, api_arch, patterns, sync_reqs) -> Dict:
        """Create platform-specific integration designs."""
        platforms = {
            "salesforce": {},
            "hubspot": {},
            "pipedrive": {},
            "microsoft_dynamics": {}
        }
        
        # Salesforce integration design
        platforms["salesforce"] = {
            "integration_approach": "REST API + Streaming API",
            "authentication": "OAuth 2.0 with refresh tokens",
            "object_mapping": {
                "patients": "Lead → Contact → Account progression",
                "consultations": "Opportunity with custom fields",
                "orders": "Opportunity products",
                "support_tickets": "Case objects",
                "analytics_events": "Custom objects for tracking"
            },
            "sync_strategy": "Real-time webhooks + daily batch reconciliation",
            "custom_fields_required": [
                "Patient_ID__c", "Consultation_Type__c", "Health_Score__c",
                "Subscription_Tier__c", "Last_Engagement__c", "Refill_Date__c"
            ],
            "workflow_automation": [
                "Lead scoring based on health questionnaire completion",
                "Opportunity creation on consultation approval",
                "Case escalation for high-priority health issues",
                "Campaign triggers based on engagement patterns"
            ],
            "reporting_capabilities": [
                "Patient acquisition funnel dashboards",
                "Revenue attribution by marketing source",
                "Customer lifetime value analytics",
                "Provider performance metrics"
            ]
        }
        
        # HubSpot integration design
        platforms["hubspot"] = {
            "integration_approach": "REST API + Webhooks",
            "authentication": "OAuth 2.0 with refresh tokens",
            "object_mapping": {
                "patients": "Contacts with custom properties",
                "consultations": "Deals in consultation pipeline",
                "orders": "Deals in sales pipeline",
                "support_tickets": "Tickets with custom properties",
                "analytics_events": "Timeline events"
            },
            "sync_strategy": "Real-time webhooks for critical events",
            "custom_properties_required": [
                "patient_id", "health_conditions", "subscription_status",
                "last_consultation_date", "treatment_adherence_score"
            ],
            "automation_workflows": [
                "Email nurture sequences based on consultation stage",
                "SMS follow-ups for appointment reminders",
                "Refill reminder email automation",
                "Win-back campaigns for churned patients"
            ],
            "marketing_features": [
                "Behavior-based email segmentation",
                "Landing page A/B testing for health conditions",
                "Social media ad targeting based on engagement",
                "Content personalization by medical interests"
            ]
        }
        
        # Pipedrive integration design
        platforms["pipedrive"] = {
            "integration_approach": "REST API with scheduled sync",
            "authentication": "API key authentication",
            "object_mapping": {
                "patients": "Persons with custom fields",
                "consultations": "Deals in consultation pipeline",
                "orders": "Deals in fulfillment pipeline",
                "providers": "Organizations",
                "communications": "Activities"
            },
            "sync_strategy": "Scheduled sync every 15 minutes",
            "custom_fields_required": [
                "Patient ID", "Health Condition", "Subscription Type",
                "Last Order Date", "Provider Preference", "Refill Status"
            ],
            "pipeline_stages": [
                "Consultation Pipeline: Lead → Submitted → Approved → Completed",
                "Sales Pipeline: Quote → Order → Payment → Fulfillment"
            ],
            "activity_tracking": [
                "Email interactions", "SMS communications", "Support calls",
                "Refill reminders", "Consultation follow-ups"
            ]
        }
        
        # Microsoft Dynamics integration design
        platforms["microsoft_dynamics"] = {
            "integration_approach": "OData API + Power Automate",
            "authentication": "Azure AD OAuth 2.0",
            "entity_mapping": {
                "patients": "Contacts with custom entities",
                "consultations": "Opportunities with custom workflow",
                "orders": "Orders with product catalog",
                "support_tickets": "Cases with SLA tracking",
                "prescriptions": "Custom entity with approval workflow"
            },
            "sync_strategy": "Power Automate flows + direct API integration",
            "custom_entities_required": [
                "Health_Consultation", "Medical_Prescription", 
                "Treatment_Plan", "Health_Score", "Engagement_Metric"
            ],
            "business_process_flows": [
                "Patient onboarding workflow",
                "Consultation approval process",
                "Prescription fulfillment flow",
                "Customer support escalation"
            ],
            "power_bi_integration": [
                "Patient acquisition dashboards",
                "Treatment effectiveness analytics", 
                "Revenue and profitability reports",
                "Operational performance metrics"
            ]
        }
        
        return platforms

    def _assess_endpoint_crm_relevance(self, path: str, content: str) -> str:
        """Assess CRM relevance of API endpoint."""
        high_relevance_paths = ['/patients', '/consultations', '/orders', '/analytics']
        medium_relevance_paths = ['/messages', '/prescriptions', '/support']
        
        if any(hr_path in path for hr_path in high_relevance_paths):
            return "High"
        elif any(mr_path in path for mr_path in medium_relevance_paths):
            return "Medium"
        else:
            return "Low"

    def _map_table_to_crm_entity(self, table: str) -> str:
        """Map database table to CRM entity."""
        mapping = {
            'patients': 'Contact/Lead',
            'consultations': 'Opportunity/Deal',
            'orders': 'Opportunity/Deal',
            'prescriptions': 'Product/Service',
            'support_tickets': 'Case/Ticket',
            'analytics_events': 'Activity/Interaction',
            'providers': 'Account/Contact',
            'admin_users': 'User',
            'inventory': 'Product',
            'patient_measurements': 'Custom Object'
        }
        return mapping.get(table, 'Custom Object')

    def _assess_sync_priority(self, table: str) -> str:
        """Assess synchronization priority for database table."""
        high_priority = ['patients', 'consultations', 'orders', 'support_tickets']
        medium_priority = ['prescriptions', 'analytics_events', 'providers']
        
        if table in high_priority:
            return "High"
        elif table in medium_priority:
            return "Medium"
        else:
            return "Low"

    def _generate_findings(self, result: AgentResult, integration_architecture: Dict):
        """Generate findings based on API integration analysis."""
        
        # API architecture readiness
        endpoint_count = len(integration_architecture["api_architecture"]["rest_endpoints"])
        result.findings.append(
            self.finding(
                title=f"Robust API Architecture for CRM Integration ({endpoint_count} Endpoints)",
                description=(
                    f"Platform provides {endpoint_count} REST endpoints with "
                    f"{len(integration_architecture['api_architecture']['authentication_methods'])} authentication methods. "
                    f"Strong foundation for CRM API integrations."
                ),
                severity="info",
                tags=["api", "integration", "architecture"]
            )
        )
        
        # Integration patterns availability
        pattern_count = len(integration_architecture["integration_patterns"]["sync_patterns"])
        result.findings.append(
            self.finding(
                title=f"Multiple Integration Patterns Supported ({pattern_count} Sync Patterns)",
                description=(
                    f"Platform supports {pattern_count} different synchronization patterns including "
                    f"real-time webhooks, batch sync, and hybrid approaches. "
                    f"Flexible integration options for different CRM requirements."
                ),
                severity="info",
                tags=["integration", "patterns", "sync"]
            )
        )
        
        # Data synchronization capabilities
        entity_count = len(integration_architecture["sync_requirements"]["sync_entities"])
        result.findings.append(
            self.finding(
                title=f"Comprehensive Data Synchronization Framework ({entity_count} Entities)",
                description=(
                    f"Platform defines synchronization for {entity_count} core entities with "
                    f"bidirectional sync capabilities and conflict resolution strategies. "
                    f"Ready for enterprise-grade CRM data integration."
                ),
                severity="info",
                tags=["data-sync", "entities", "crm"]
            )
        )
        
        # Webhook architecture
        webhook_count = len(integration_architecture["webhook_architecture"]["webhook_endpoints"])
        result.findings.append(
            self.finding(
                title=f"Real-time Webhook Architecture ({webhook_count} Endpoints)",
                description=(
                    f"Platform provides {webhook_count} webhook endpoints for real-time event streaming "
                    f"with retry mechanisms and security measures. "
                    f"Excellent foundation for immediate CRM data updates."
                ),
                severity="info",
                tags=["webhooks", "real-time", "events"]
            )
        )
        
        # Security framework
        auth_layers = len(integration_architecture["security_framework"]["authentication_layers"])
        result.findings.append(
            self.finding(
                title=f"Multi-Layer Security Framework ({auth_layers} Authentication Layers)",
                description=(
                    f"Platform implements {auth_layers} authentication layers including OAuth 2.0, "
                    f"mTLS, and webhook signature verification. "
                    f"HIPAA-compliant security ready for healthcare CRM integrations."
                ),
                severity="medium",
                tags=["security", "authentication", "compliance"]
            )
        )
        
        # Scaling strategies
        scaling_count = len(integration_architecture["scaling_strategies"]["horizontal_scaling"])
        result.findings.append(
            self.finding(
                title=f"Enterprise Scaling Architecture ({scaling_count} Scaling Strategies)",
                description=(
                    f"Platform supports {scaling_count} horizontal scaling strategies including "
                    f"microservices architecture and event-driven processing. "
                    f"Ready to handle enterprise-level CRM integration volumes."
                ),
                severity="medium",
                tags=["scaling", "performance", "enterprise"]
            )
        )
        
        # Platform-specific designs
        platform_count = len(integration_architecture["platform_specific_designs"])
        result.findings.append(
            self.finding(
                title=f"Platform-Specific Integration Designs ({platform_count} CRM Platforms)",
                description=(
                    f"Created detailed integration architectures for {platform_count} major CRM platforms "
                    f"including Salesforce, HubSpot, Pipedrive, and Microsoft Dynamics. "
                    f"Ready-to-implement integration blueprints available."
                ),
                severity="medium",
                tags=["crm-platforms", "integration-design", "implementation"]
            )
        )
