# Patient Portal UX Review System

A comprehensive multi-agent cooperative system for reviewing the UI/UX of patient portals, ensuring usability, simplicity, and completed user flows.

## 🎯 Purpose

This system provides automated, thorough UX analysis of patient portal interfaces using specialized AI agents that work cooperatively to identify issues and propose improvements while strictly enforcing safety constraints.

## 🛡️ Safety Constraints

The system is designed with strict safety measures:

- **Never modifies backend code** - All agents are hardcoded to reject backend modifications
- **Never creates new pages** - Only existing pages can be analyzed and improved
- **Frontend-only focus** - Only `frontend/src/` files are analyzed
- **Consensus-based actions** - Multiple agents must agree before any action is approved
- **Safety validation** - Multiple layers of safety checks prevent unauthorized changes

## 🤖 Agents

### 1. UX Flow Agent
- **Purpose**: Validates user journeys and interaction patterns
- **Focus**: Task completion rates, navigation clarity, form usability
- **Expertise**: Loading states, error handling, user feedback

### 2. Accessibility Agent  
- **Purpose**: Ensures WCAG 2.1 AA compliance
- **Focus**: Screen reader compatibility, keyboard navigation, color contrast
- **Expertise**: ARIA attributes, semantic HTML, inclusive design

### 3. Mobile Responsiveness Agent
- **Purpose**: Validates mobile-first design and cross-device consistency
- **Focus**: Touch targets, responsive breakpoints, mobile navigation
- **Expertise**: Mobile UX patterns, viewport optimization

### 4. Patient Journey Agent
- **Purpose**: Ensures seamless end-to-end patient experiences  
- **Focus**: Login → Dashboard → Task completion flows
- **Expertise**: Multi-step processes, progress indication, error recovery

### 5. Interface Consistency Agent
- **Purpose**: Maintains design system coherence
- **Focus**: Component reuse, visual consistency, brand alignment
- **Expertise**: Design tokens, component patterns, visual hierarchy

## 🚀 Usage

### Command Line Interface

```bash
# Basic review of current repository
python -m patient_portal_ux_review

# Review specific repository  
python -m patient_portal_ux_review --repo /path/to/repo

# Save detailed report
python -m patient_portal_ux_review --output ux_review_report.md

# Run specific agents only
python -m patient_portal_ux_review --agents accessibility,mobile

# Adjust consensus threshold
python -m patient_portal_ux_review --consensus-threshold 0.8

# Verbose output
python -m patient_portal_ux_review --verbose
```

### Programmatic Usage

```python
from patient_portal_ux_review import PatientPortalUXOrchestrator
from pathlib import Path

# Create orchestrator
orchestrator = PatientPortalUXOrchestrator(Path("/path/to/repo"))

# Run review
result = orchestrator.run_review()

# Access results
print(f"Found {result.total_findings} issues")
print(f"Approved {len(result.approved_actions)} improvements")

# Save detailed report
orchestrator.save_detailed_report(Path("report.md"))
```

## 🔄 Review Process

### Phase 1: Independent Analysis
- Each agent analyzes patient portal files independently
- Agents identify issues within their area of expertise
- Findings are categorized by severity (Critical, High, Medium, Low)

### Phase 2: Cross-Agent Validation
- Agents review and validate each other's findings
- Overlapping issues are identified and consolidated
- Critical issues are flagged for immediate attention

### Phase 3: Consensus Building  
- Agents vote on proposed improvement actions
- Consensus threshold (default 60%) determines action approval
- Safety constraints are enforced throughout voting

### Phase 4: Action Coordination
- Final safety validation of all approved actions
- Coordination to prevent conflicting changes
- Implementation guidance provided

## 📊 Output

### Console Output
- Real-time progress during analysis
- Summary of findings by severity
- List of approved/rejected actions
- Performance metrics

### Detailed Report (Markdown)
- Agent-by-agent analysis results
- Categorized findings with recommendations
- Approved actions with implementation details
- Cross-references and impact assessments

### Exit Codes
- `0`: No critical or high-priority issues
- `1`: High-priority issues found  
- `2`: Critical issues found
- `130`: User interrupted
- `1`: System error

## 🎯 Target Files

The system focuses on patient portal files:

```
frontend/src/
├── app/patient/              # Patient portal pages
│   ├── dashboard/
│   ├── new-consultation/
│   ├── orders/
│   ├── messages/
│   └── profile/
├── components/patient/       # Patient-specific components  
└── components/PatientLayout.tsx
```

## 📝 Example Findings

### Critical Issues
- Missing alt text on medical images
- Form inputs without accessible labels  
- Broken navigation preventing task completion

### High Priority Issues
- Touch targets too small for mobile
- Missing error recovery mechanisms
- Inconsistent loading states

### Medium Priority Issues
- Inconsistent spacing and typography
- Missing progress indicators in multi-step flows
- Hardcoded colors instead of design tokens

### Low Priority Issues  
- Import organization could be improved
- Brand name inconsistencies
- Minor accessibility improvements

## 🔧 Configuration

### Agent Selection
Run specific agents based on your needs:

```bash
# Accessibility-focused review
python -m patient_portal_ux_review --agents accessibility

# Mobile and journey focus
python -m patient_portal_ux_review --agents mobile,journey

# Full review (default)
python -m patient_portal_ux_review
```

### Consensus Threshold
Adjust how many agents must agree for action approval:

```bash
# Stricter consensus (80% agreement required)
python -m patient_portal_ux_review --consensus-threshold 0.8

# More permissive (40% agreement required)  
python -m patient_portal_ux_review --consensus-threshold 0.4
```

## 🛠️ Development

### Adding New Agents

1. Create new agent class extending `BaseUXAgent`
2. Implement required methods:
   - `analyze_file_content()`
   - `is_action_relevant_to_expertise()`
3. Add to orchestrator's default agents list
4. Update CLI agent mapping

### Safety Guidelines

- All agents inherit safety constraints from `BaseUXAgent`
- File path validation prevents backend access
- Action validation ensures only UI improvements
- Multiple safety check layers prevent unauthorized changes

## 📋 Requirements

- Python 3.7+
- Repository with `frontend/src/` structure
- Patient portal files in expected locations

## 🏆 Benefits

- **Comprehensive Coverage**: 5 specialized agents cover all UX aspects
- **Safety First**: Multiple layers prevent unauthorized changes  
- **Cooperative Intelligence**: Agents validate each other's work
- **Actionable Results**: Specific improvement recommendations
- **Consistent Quality**: Enforces design system adherence
- **Accessibility Focus**: WCAG 2.1 AA compliance validation
- **Mobile-First**: Validates responsive design patterns

## 🎉 Success Metrics

After running improvements:
- ✅ Clear task completion paths (≤3 clicks for primary actions)
- ✅ 100% WCAG 2.1 AA compliance
- ✅ Consistent experience across all devices
- ✅ Unified design language across patient portal
- ✅ Fast loading states and smooth interactions
- ✅ No broken user flows