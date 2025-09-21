#!/usr/bin/env python3
"""
CRM Integration Analysis CLI
Run comprehensive CRM integration analysis using multi-agent system
"""

import sys
from pathlib import Path

# Add the current directory to Python path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

from crm_orchestrator import CRMOrchestrator


def main():
    """Run CRM integration analysis and generate comprehensive report."""
    
    print("🔍 Starting CRM Integration Analysis...")
    print("=" * 60)
    
    # Initialize CRM orchestrator with current directory as root
    root_path = Path(".").resolve()
    orchestrator = CRMOrchestrator(root_path)
    
    print(f"📁 Analyzing codebase at: {root_path}")
    print(f"🤖 Using {len(orchestrator.agents)} specialized agents:")
    
    for i, agent_name in enumerate(orchestrator.agent_names(), 1):
        print(f"   {i}. {agent_name}")
    
    print("\n🚀 Running analysis...")
    print("-" * 40)
    
    try:
        # Run the analysis
        report, state = orchestrator.run()
        
        # Save the report to file
        report_file = Path("CRM_INTEGRATION_ANALYSIS_REPORT.md")
        report_file.write_text(report, encoding='utf-8')
        
        print(f"✅ Analysis completed successfully!")
        print(f"📄 Report saved to: {report_file.name}")
        
        # Print summary statistics
        print(f"\n📊 Analysis Summary:")
        print(f"   • Total agents executed: {len(orchestrator.agents)}")
        
        # Count total findings across all agents
        total_findings = 0
        for agent in orchestrator.agents:
            findings = state.get_agent_results(agent.name)
            if findings:
                agent_findings = len(findings.findings)
                total_findings += agent_findings
                print(f"   • {agent.name}: {agent_findings} findings")
        
        print(f"   • Total integration opportunities: {total_findings}")
        print(f"   • Report length: {len(report):,} characters")
        
        print(f"\n🎯 Key Integration Points Identified:")
        
        # Get key metrics from shared state
        crm_map = state.get_artifact("CRM Integration Mapper", "crm_integration_map", {})
        comm_map = state.get_artifact("Communication Analytics Agent", "communication_analytics_map", {})
        journey_map = state.get_artifact("Customer Journey Mapper", "customer_journey_map", {})
        api_arch = state.get_artifact("API Integration Architect", "api_integration_architecture", {})
        
        patient_data_points = len(crm_map.get('crm_data_points', {}).get('patient_data', []))
        email_templates = len(comm_map.get('email_analytics', {}).get('templates', []))
        sms_templates = len(comm_map.get('sms_analytics', {}).get('templates', []))
        lifecycle_stages = len(journey_map.get('lifecycle_stages', {}).get('stages', []))
        api_endpoints = len(api_arch.get('api_architecture', {}).get('rest_endpoints', []))
        platforms = len(api_arch.get('platform_specific_designs', {}))
        
        print(f"   • Patient data points: {patient_data_points}")
        print(f"   • Email templates: {email_templates}")  
        print(f"   • SMS templates: {sms_templates}")
        print(f"   • Customer lifecycle stages: {lifecycle_stages}")
        print(f"   • API endpoints: {api_endpoints}")
        print(f"   • CRM platform integrations: {platforms}")
        
        print(f"\n📋 Next Steps:")
        print(f"   1. Review the detailed report: {report_file.name}")
        print(f"   2. Select your primary CRM platform")
        print(f"   3. Follow the platform-specific implementation plan")
        print(f"   4. Begin with Phase 1 integrations (patient data sync)")
        
        print(f"\n✨ CRM Integration Analysis Complete!")
        
    except Exception as e:
        print(f"❌ Error during analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
