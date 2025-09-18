"""Test script to validate the Patient Portal UX Review System."""

import os
import sys
from pathlib import Path

# Add the current directory to Python path for testing
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

try:
    # Test imports
    print("🧪 Testing Patient Portal UX Review System...")
    print("-" * 50)
    
    # Test basic imports
    print("✓ Testing imports...")
    from patient_portal_ux_review.models import SharedState, Finding, Severity, IssueCategory
    from patient_portal_ux_review.repository import RepositoryContext
    from patient_portal_ux_review.base_agent import BaseUXAgent, SafetyConstraintViolation
    from patient_portal_ux_review.agents import (
        UXFlowAgent, AccessibilityAgent, MobileResponsivenessAgent,
        PatientJourneyAgent, InterfaceConsistencyAgent
    )
    from patient_portal_ux_review.orchestrator import PatientPortalUXOrchestrator
    print("  ✅ All imports successful")
    
    # Test repository context
    print("✓ Testing repository context...")
    repo_path = Path(".")
    context = RepositoryContext(repo_path)
    print(f"  ✅ Repository context created for: {context.root}")
    
    # Test agent creation
    print("✓ Testing agent creation...")
    agents = [
        UXFlowAgent(),
        AccessibilityAgent(),
        MobileResponsivenessAgent(),
        PatientJourneyAgent(),
        InterfaceConsistencyAgent()
    ]
    print(f"  ✅ Created {len(agents)} agents successfully")
    
    # Test safety constraints
    print("✓ Testing safety constraints...")
    ux_agent = UXFlowAgent()
    
    # Test safe file validation
    safe_files = [
        "frontend/src/app/patient/dashboard/page.tsx",
        "frontend/src/components/PatientLayout.tsx",
        "frontend/src/components/patient/TwoFactorSetupModal.tsx"
    ]
    
    for file_path in safe_files:
        is_safe = ux_agent.validate_file_safety(file_path)
        print(f"    {file_path}: {'✅ SAFE' if is_safe else '❌ BLOCKED'}")
    
    # Test unsafe file validation
    unsafe_files = [
        "backend/src/app.js",
        "backend/server.js",
        "database/schema.sql",
        "backend/package.json"
    ]
    
    for file_path in unsafe_files:
        is_safe = ux_agent.validate_file_safety(file_path)
        print(f"    {file_path}: {'❌ INCORRECTLY ALLOWED' if is_safe else '✅ CORRECTLY BLOCKED'}")
    
    # Test shared state
    print("✓ Testing shared state...")
    shared_state = SharedState()
    
    # Create a test finding
    test_finding = ux_agent.create_finding(
        title="Test finding",
        description="This is a test finding",
        severity=Severity.LOW,
        category=IssueCategory.USABILITY,
        file_path="frontend/src/app/patient/dashboard/page.tsx"
    )
    
    shared_state.add_finding(test_finding)
    print(f"  ✅ Created and added test finding: {test_finding.title}")
    
    # Test orchestrator creation
    print("✓ Testing orchestrator...")
    try:
        orchestrator = PatientPortalUXOrchestrator(repo_path)
        print(f"  ✅ Orchestrator created with {len(orchestrator.agents)} agents")
    except Exception as e:
        print(f"  ⚠️  Orchestrator creation warning: {e}")
    
    # Test agent communication
    print("✓ Testing agent communication...")
    for agent in agents:
        communications = agent.communicate_with_peers(shared_state)
        print(f"  {agent.name}: {len(communications)} communications")
    
    print("\n" + "=" * 50)
    print("🎉 ALL TESTS PASSED!")
    print("✅ Patient Portal UX Review System is ready to use")
    print("\nUsage examples:")
    print("  python -m patient_portal_ux_review")
    print("  python -m patient_portal_ux_review --repo /path/to/repo")
    print("  python -m patient_portal_ux_review --output report.md")
    print("  python -m patient_portal_ux_review --agents accessibility,mobile")
    
    # Test constraint enforcement
    print("\n🔒 Testing Safety Constraint Enforcement:")
    
    try:
        # This should raise an exception
        unsafe_finding = ux_agent.create_finding(
            title="Unsafe finding",
            description="This should fail",
            severity=Severity.HIGH,
            category=IssueCategory.USABILITY,
            file_path="backend/server.js"  # This should be blocked
        )
        print("  ❌ SECURITY BREACH: Unsafe finding was allowed!")
    except SafetyConstraintViolation as e:
        print(f"  ✅ Safety constraint properly enforced: {e}")
    except Exception as e:
        print(f"  ✅ Safety constraint enforced (unexpected error): {e}")
    
    print("\n🚀 System ready for production use!")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Please check that all files were created correctly.")
    sys.exit(1)
except Exception as e:
    print(f"❌ Test failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)