#!/usr/bin/env python3
"""
Validate the feedback recommendations for the Zappy Scratch project.

This script uses the multi-agent validation system to analyze the specific
recommendations provided in the feedback and determines if they make sense
for a pre-production telehealth project.
"""

from pathlib import Path
from recommendation_validation_system import (
    PreProductionValidationOrchestrator,
    ConstraintProfile,
    OriginalRecommendation,
    ModernizationLevel
)


def main():
    """Run validation on the feedback recommendations"""
    
    # Initialize orchestrator with current codebase
    codebase_root = Path.cwd()
    orchestrator = PreProductionValidationOrchestrator(codebase_root)
    
    # Set up constraint profile (pre-production environment)
    constraints = ConstraintProfile(
        available_developer_weeks=12,  # Assume 3 months timeline
        budget_constraints=50000,  # Reasonable budget for small team
        skill_gap_tolerance="medium",  # Some learning curve acceptable
        business_deadline_pressure="medium",
        risk_tolerance="medium",
        learning_curve_acceptance="medium",
        is_pre_production=True,  # KEY: We're not in production yet
        can_afford_breaking_changes=True,  # No users to migrate
        technology_ambition_level="high"  # Can be ambitious pre-production
    )
    orchestrator.set_constraint_profile(constraints)
    
    # Set business context for telehealth
    business_context = {
        "industry": "telehealth",
        "stage": "pre-production",
        "revenue_pressure": "medium",
        "hipaa_audit_timeline": "6_months",
        "monthly_user_growth": 0,  # No users yet
        "feature_backlog_pressure": "high",
        "team_size": 3,
        "monthly_burn_rate": 15000,
        "runway_months": 12,
        "funding_stage": "seed",
        "competition_level": "high",
        "expected_scale": "medium",
        "team_nestjs_experience": "none",
        "team_typescript_experience": "basic",
        "developer_hourly_cost": 100
    }
    orchestrator.set_business_context(business_context)
    
    # Add the specific recommendations from the feedback
    
    # 1. TypeScript + NestJS + ORM
    orchestrator.add_recommendation(
        "nestjs_migration",
        OriginalRecommendation(
            title="Adopt TypeScript + NestJS with ORM",
            description="Adopt TypeScript + NestJS with an ORM (like Prisma or TypeORM) for a structured and maintainable backend",
            estimated_effort_weeks=6,
            business_impact_score=7.5,
            technical_necessity_score=8.0,
            original_rationale="Provides structure, type safety, and maintainability for backend",
            modernization_level=ModernizationLevel.MODERN
        )
    )
    
    # 2. API Documentation with Swagger
    orchestrator.add_recommendation(
        "api_documentation",
        OriginalRecommendation(
            title="Document APIs using Swagger",
            description="Document APIs using swagger clearly, so any future developer can onboard without confusion",
            estimated_effort_weeks=1,
            business_impact_score=8.0,
            technical_necessity_score=7.0,
            original_rationale="Clear API documentation reduces onboarding time and prevents miscommunication",
            modernization_level=ModernizationLevel.STANDARD
        )
    )
    
    # 3. Frontend Refactor
    orchestrator.add_recommendation(
        "frontend_refactor",
        OriginalRecommendation(
            title="Refactor Frontend with Typed API Contracts",
            description="Refactor the frontend after backend cleanup, aligning it with well-defined API contracts and typed responses",
            estimated_effort_weeks=4,
            business_impact_score=7.0,
            technical_necessity_score=7.5,
            original_rationale="Ensures frontend-backend consistency and reduces bugs",
            modernization_level=ModernizationLevel.MODERN
        )
    )
    
    # 4. Planning and Task Breakdown Process
    orchestrator.add_recommendation(
        "planning_process",
        OriginalRecommendation(
            title="Implement Planning and Task Breakdown",
            description="Planning and task breakdown before coding. If tasks aren't clearly defined, developers should have space to define them",
            estimated_effort_weeks=0.5,
            business_impact_score=9.0,
            technical_necessity_score=8.0,
            original_rationale="Reduces wasted effort and improves development velocity",
            modernization_level=ModernizationLevel.STANDARD
        )
    )
    
    # 5. Structured Development Process
    orchestrator.add_recommendation(
        "structured_development",
        OriginalRecommendation(
            title="Avoid 'Vibe Coding' - Use Structured Approach",
            description="Avoid relying solely on 'vibe coding'. AI-assisted development works best when built on solid architecture and processes",
            estimated_effort_weeks=0.5,
            business_impact_score=8.5,
            technical_necessity_score=8.5,
            original_rationale="Structured approach ensures scalability and maintainability",
            modernization_level=ModernizationLevel.MODERN
        )
    )
    
    # Run validation
    print("\n" + "="*60)
    print("VALIDATING FEEDBACK RECOMMENDATIONS")
    print("="*60)
    print("\nProject Context:")
    print(f"  • Industry: Telehealth")
    print(f"  • Stage: Pre-production")
    print(f"  • Team Size: 3 developers")
    print(f"  • Timeline: 12 weeks available")
    print(f"  • Can afford breaking changes: Yes")
    print("\nRecommendations to validate:")
    print("  1. TypeScript + NestJS with ORM (6 weeks)")
    print("  2. API Documentation with Swagger (1 week)")
    print("  3. Frontend Refactor with Typed Contracts (4 weeks)")
    print("  4. Planning and Task Breakdown Process (0.5 weeks)")
    print("  5. Structured Development Approach (0.5 weeks)")
    print(f"\nTotal effort: 12 weeks")
    
    # Execute validation
    results = orchestrator.validate()
    
    # Print executive summary
    orchestrator.print_executive_summary(results['executive_summary'])
    
    # Save detailed results
    output_path = Path("validation_results.json")
    orchestrator.save_results(results, output_path)
    
    # Print specific insights about the feedback
    print("\n" + "="*60)
    print("SPECIFIC FEEDBACK ANALYSIS")
    print("="*60)
    
    # Analyze NestJS recommendation specifically
    if "nestjs_migration" in results.get("validation_results", {}):
        nestjs_validation = results["validation_results"]["nestjs_migration"]
        print(f"\n1. NestJS Migration:")
        print(f"   Validation Level: {nestjs_validation['validation_level']}")
        print(f"   Confidence: {nestjs_validation['confidence_score']:.1f}/10")
        print(f"   Technical Necessity: {nestjs_validation['technical_necessity']:.1f}/10")
        print(f"   Business Impact: {nestjs_validation['business_necessity']:.1f}/10")
        
        if nestjs_validation['challenges_raised']:
            print("   Challenges:")
            for challenge in nestjs_validation['challenges_raised'][:3]:
                print(f"     • {challenge}")
        
        if nestjs_validation['alternatives_identified']:
            print("   Alternatives to consider:")
            for alt in nestjs_validation['alternatives_identified'][:2]:
                print(f"     • {alt}")
    
    # Check for better alternatives
    print("\n2. Alternative Approaches Found:")
    alternatives = results.get("alternatives_summary", [])
    if alternatives:
        # Sort by ROI
        sorted_alts = sorted(
            alternatives, 
            key=lambda x: x['business_impact'] / max(x['effort_weeks'], 0.1),
            reverse=True
        )
        for alt in sorted_alts[:3]:
            roi = alt['business_impact'] / max(alt['effort_weeks'], 0.1)
            print(f"   • {alt['name']}")
            print(f"     Effort: {alt['effort_weeks']} weeks, ROI: {roi:.1f}")
            print(f"     Risk: {alt['risk_level']}, Modernization: {alt['modernization_level']}")
    
    # Pre-production specific insights
    print("\n3. Pre-Production Opportunities:")
    exec_summary = results.get('executive_summary', {})
    if exec_summary.get('pre_production_advantages'):
        for advantage in exec_summary['pre_production_advantages']:
            print(f"   • {advantage}")
    
    # Final verdict
    print("\n" + "="*60)
    print("FINAL ASSESSMENT")
    print("="*60)
    print(f"\nDoes the feedback make sense? {exec_summary['verdict']}")
    print(f"Recommended action: {exec_summary['recommended_action']}")
    
    # Highlight any critical concerns
    if exec_summary['critical_issues_count'] > 0:
        print(f"\n⚠️  Critical Issues Found: {exec_summary['critical_issues_count']}")
        for action in exec_summary.get('critical_actions', []):
            print(f"   • {action}")
    
    # Quick wins
    if exec_summary['quick_wins_available'] > 0:
        print(f"\n✨ Quick Wins Available: {exec_summary['quick_wins_available']}")
        print("   Consider starting with these for immediate value")
    
    print("\n" + "="*60)
    print("Full details saved to: validation_results.json")
    print("="*60)


if __name__ == "__main__":
    main()
