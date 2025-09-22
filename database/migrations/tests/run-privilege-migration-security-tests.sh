#!/bin/bash

# =============================================================================
# DATABASE PRIVILEGE MIGRATION SECURITY TEST RUNNER
# =============================================================================
# Purpose: Automated security validation for database privilege migrations
# Author: DevOps Infrastructure Specialist Platform Engineer
# Usage: ./run-privilege-migration-security-tests.sh [environment]
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
ENVIRONMENT="${1:-development}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEST_RESULTS_DIR="$SCRIPT_DIR/results"
REPORT_FILE="$TEST_RESULTS_DIR/security_test_report_${ENVIRONMENT}_${TIMESTAMP}.json"
LOG_FILE="$TEST_RESULTS_DIR/security_test_log_${ENVIRONMENT}_${TIMESTAMP}.log"

# Create results directory
mkdir -p "$TEST_RESULTS_DIR"

# Database connection settings based on environment
case "$ENVIRONMENT" in
    "production")
        echo -e "${RED}${BOLD}ERROR: Security tests cannot be run on production environment${NC}"
        echo "Use staging environment for pre-production validation"
        exit 1
        ;;
    "staging")
        DATABASE_URL="${STAGING_DATABASE_URL:-$DATABASE_URL}"
        ;;
    "development"|*)
        DATABASE_URL="${DATABASE_URL:-postgresql://telehealth_user:secure_password@localhost:5432/telehealth_db}"
        ;;
esac

# Function to print colored output
print_header() {
    echo -e "\n${BLUE}${BOLD}=== $1 ===${NC}"
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_critical() {
    echo -e "${RED}${BOLD}[CRITICAL]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check if psql is available
    if ! command -v psql &> /dev/null; then
        print_error "psql command not found. Please install PostgreSQL client tools."
        exit 1
    fi
    
    # Check if jq is available for JSON processing
    if ! command -v jq &> /dev/null; then
        print_warning "jq not found. JSON report formatting may be limited."
    fi
    
    # Test database connection
    print_status "Testing database connection to $ENVIRONMENT environment..."
    if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
        print_success "Database connection successful"
    else
        print_error "Failed to connect to database: $DATABASE_URL"
        exit 1
    fi
}

# Function to load security test framework
load_security_framework() {
    print_header "Loading Security Test Framework"
    
    local test_framework_file="$SCRIPT_DIR/database-privilege-migration-security-tests.sql"
    
    if [ ! -f "$test_framework_file" ]; then
        print_error "Security test framework not found: $test_framework_file"
        exit 1
    fi
    
    print_status "Loading security test functions..."
    if psql "$DATABASE_URL" -f "$test_framework_file" &> "$LOG_FILE"; then
        print_success "Security test framework loaded successfully"
    else
        print_error "Failed to load security test framework"
        cat "$LOG_FILE"
        exit 1
    fi
}

# Function to run security tests
run_security_tests() {
    print_header "Running Database Privilege Migration Security Tests"
    
    # Run all security tests and capture results
    print_status "Executing comprehensive security test suite..."
    
    local test_query="
    WITH test_results AS (
        SELECT * FROM run_all_privilege_migration_security_tests()
    ),
    security_report AS (
        SELECT * FROM generate_security_test_report()
    )
    SELECT json_build_object(
        'timestamp', '${TIMESTAMP}',
        'environment', '${ENVIRONMENT}',
        'test_results', (
            SELECT json_agg(
                json_build_object(
                    'category', test_category,
                    'test_name', test_name,
                    'status', status,
                    'risk_level', risk_level,
                    'finding', finding
                )
            ) FROM test_results
        ),
        'summary', (
            SELECT json_build_object(
                'critical_issues', critical_issues,
                'high_issues', high_issues,
                'passed_tests', passed_tests,
                'total_tests', total_tests,
                'security_score', security_score,
                'recommendations', recommendations
            ) FROM security_report
        )
    ) as security_report;
    "
    
    if psql "$DATABASE_URL" -t -c "$test_query" > "$REPORT_FILE" 2> "$LOG_FILE"; then
        print_success "Security tests completed successfully"
    else
        print_error "Security tests failed to execute"
        cat "$LOG_FILE"
        exit 1
    fi
}

# Function to analyze test results
analyze_results() {
    print_header "Analyzing Security Test Results"
    
    if [ ! -f "$REPORT_FILE" ]; then
        print_error "Test results file not found: $REPORT_FILE"
        exit 1
    fi
    
    # Extract key metrics from results
    local critical_issues high_issues security_score recommendations
    
    if command -v jq &> /dev/null; then
        critical_issues=$(jq -r '.summary.critical_issues' "$REPORT_FILE")
        high_issues=$(jq -r '.summary.high_issues' "$REPORT_FILE")
        security_score=$(jq -r '.summary.security_score' "$REPORT_FILE")
        recommendations=$(jq -r '.summary.recommendations' "$REPORT_FILE")
        
        # Display summary
        echo -e "\n${BOLD}SECURITY TEST SUMMARY${NC}"
        echo "Environment: $ENVIRONMENT"
        echo "Timestamp: $TIMESTAMP"
        echo "Security Score: $security_score/100"
        echo "Critical Issues: $critical_issues"
        echo "High Risk Issues: $high_issues"
        echo -e "\nRecommendations: $recommendations"
        
        # Display detailed results
        echo -e "\n${BOLD}DETAILED TEST RESULTS${NC}"
        jq -r '.test_results[] | "\(.category) - \(.test_name): \(.status) (\(.risk_level)) - \(.finding)"' "$REPORT_FILE"
        
    else
        # Fallback without jq
        print_warning "Displaying raw JSON results (install jq for formatted output):"
        cat "$REPORT_FILE"
    fi
}

# Function to determine exit code based on results
determine_exit_code() {
    local exit_code=0
    
    if command -v jq &> /dev/null; then
        local critical_issues high_issues
        critical_issues=$(jq -r '.summary.critical_issues' "$REPORT_FILE")
        high_issues=$(jq -r '.summary.high_issues' "$REPORT_FILE")
        
        if [ "$critical_issues" != "0" ]; then
            print_critical "CRITICAL SECURITY VULNERABILITIES DETECTED - BLOCKING DEPLOYMENT"
            exit_code=2
        elif [ "$high_issues" != "0" ]; then
            print_warning "HIGH-RISK SECURITY ISSUES DETECTED - REVIEW REQUIRED"
            exit_code=1
        else
            print_success "ALL SECURITY TESTS PASSED - DEPLOYMENT APPROVED"
            exit_code=0
        fi
    else
        print_warning "Cannot determine security status without jq - manual review required"
        exit_code=1
    fi
    
    return $exit_code
}

# Function to generate CI/CD artifacts
generate_ci_artifacts() {
    print_header "Generating CI/CD Integration Artifacts"
    
    # Create JUnit-style XML report for CI/CD integration
    local junit_file="$TEST_RESULTS_DIR/security_tests_junit_${ENVIRONMENT}_${TIMESTAMP}.xml"
    
    cat > "$junit_file" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="Database Privilege Migration Security Tests" 
           environment="$ENVIRONMENT" 
           timestamp="$TIMESTAMP">
EOF
    
    if command -v jq &> /dev/null; then
        jq -r '.test_results[] | 
        "<testcase classname=\"\(.category)\" name=\"\(.test_name)\">" +
        (if .status == "FAILED" then 
            "<failure type=\"\(.risk_level)\">\(.finding)</failure>" 
         else 
            "" 
         end) +
        "</testcase>"' "$REPORT_FILE" >> "$junit_file"
    fi
    
    echo "</testsuite>" >> "$junit_file"
    
    # Create deployment gate status file
    local gate_file="$TEST_RESULTS_DIR/deployment_gate_${ENVIRONMENT}_${TIMESTAMP}.txt"
    
    if command -v jq &> /dev/null; then
        local critical_issues
        critical_issues=$(jq -r '.summary.critical_issues' "$REPORT_FILE")
        
        if [ "$critical_issues" = "0" ]; then
            echo "DEPLOYMENT_APPROVED" > "$gate_file"
        else
            echo "DEPLOYMENT_BLOCKED" > "$gate_file"
        fi
    else
        echo "MANUAL_REVIEW_REQUIRED" > "$gate_file"
    fi
    
    print_success "CI/CD artifacts generated:"
    print_status "  - JUnit Report: $junit_file"
    print_status "  - Deployment Gate: $gate_file"
    print_status "  - Security Report: $REPORT_FILE"
    print_status "  - Test Log: $LOG_FILE"
}

# Function to cleanup test artifacts (optional)
cleanup_test_data() {
    print_header "Cleaning Up Test Data"
    
    # Remove test schema and temporary data
    psql "$DATABASE_URL" -c "DROP SCHEMA IF EXISTS migration_security_tests CASCADE;" &> /dev/null || true
    
    print_success "Test cleanup completed"
}

# Main execution function
main() {
    print_header "Database Privilege Migration Security Validation"
    print_status "Environment: $ENVIRONMENT"
    print_status "Timestamp: $TIMESTAMP"
    
    # Execute security testing pipeline
    check_prerequisites
    load_security_framework
    run_security_tests
    analyze_results
    generate_ci_artifacts
    cleanup_test_data
    
    # Determine final result
    determine_exit_code
    local result=$?
    
    print_header "Security Testing Complete"
    print_status "Results available in: $TEST_RESULTS_DIR"
    
    exit $result
}

# Execute main function with error handling
trap 'print_error "Security testing failed unexpectedly. Check logs: $LOG_FILE"' ERR

main "$@"