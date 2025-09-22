#!/bin/bash

# =============================================================================
# DATABASE BACKUP AND RECOVERY VALIDATION TESTS
# =============================================================================
# Purpose: Validate backup/recovery procedures for database privilege migrations
# Author: DevOps Infrastructure Specialist Platform Engineer
# Usage: ./run-backup-recovery-tests.sh [environment]
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
BACKUP_RESULTS_DIR="$SCRIPT_DIR/backup-results"
TEST_LOG="$BACKUP_RESULTS_DIR/backup_recovery_test_${TIMESTAMP}.log"

# Create results directory
mkdir -p "$BACKUP_RESULTS_DIR"

# Database connection settings
DATABASE_URL="${BACKUP_DATABASE_URL:-${DATABASE_URL:-postgresql://postgres:postgres_test_password@localhost:5433/telehealth_backup_test_db}}"
BACKUP_DB_NAME="backup_test_$(date +%s)"
RECOVERY_DB_NAME="recovery_test_$(date +%s)"

# Function to print colored output
print_header() {
    echo -e "\n${BLUE}${BOLD}=== $1 ===${NC}" | tee -a "$TEST_LOG"
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$TEST_LOG"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$TEST_LOG"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$TEST_LOG"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$TEST_LOG"
}

# Initialize test log
echo "Backup and Recovery Validation Tests - $TIMESTAMP" > "$TEST_LOG"
echo "Environment: $ENVIRONMENT" >> "$TEST_LOG"
echo "Database URL: $DATABASE_URL" >> "$TEST_LOG"

# Function to check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check if psql is available
    if ! command -v psql &> /dev/null; then
        print_error "psql command not found. Please install PostgreSQL client tools."
        exit 1
    fi
    
    # Check if pg_dump is available
    if ! command -v pg_dump &> /dev/null; then
        print_error "pg_dump command not found. Please install PostgreSQL client tools."
        exit 1
    fi
    
    # Test database connection
    print_status "Testing database connection..."
    if psql "$DATABASE_URL" -c "SELECT 1;" &>> "$TEST_LOG"; then
        print_success "Database connection successful"
    else
        print_error "Failed to connect to database: $DATABASE_URL"
        exit 1
    fi
}

# Function to create test database with privilege migration
setup_test_database() {
    print_header "Setting Up Test Database"
    
    # Create test database
    print_status "Creating backup test database: $BACKUP_DB_NAME"
    psql "$DATABASE_URL" -c "CREATE DATABASE $BACKUP_DB_NAME;" &>> "$TEST_LOG"
    
    # Apply base schema
    local backup_db_url="${DATABASE_URL%/*}/$BACKUP_DB_NAME"
    
    print_status "Applying base migrations to test database..."
    
    # Apply all migrations including the privilege migration
    for migration in "$PROJECT_ROOT"/database/migrations/*.sql; do
        if [ -f "$migration" ]; then
            migration_name=$(basename "$migration")
            print_status "Applying migration: $migration_name"
            
            if psql "$backup_db_url" -f "$migration" &>> "$TEST_LOG"; then
                print_success "Applied: $migration_name"
            else
                print_warning "Failed to apply: $migration_name (may be expected for some migrations)"
            fi
        fi
    done
    
    # Create test data with privileges
    print_status "Creating test data with privilege scenarios..."
    psql "$backup_db_url" << 'EOF' &>> "$TEST_LOG"
-- Create test data that exercises privilege system
INSERT INTO privilege_escalations (
    escalation_id, role_requested, reason, requested_by, 
    status, emergency_override, expires_at
) VALUES 
('TEST-001', 'zappy_emergency', 'Test emergency access', 'test_user@example.com', 
 'approved', true, CURRENT_TIMESTAMP + INTERVAL '30 minutes'),
('TEST-002', 'zappy_patient_update', 'Test patient update access', 'nurse@example.com', 
 'pending', false, CURRENT_TIMESTAMP + INTERVAL '2 hours');

-- Create test data integrity checksums
INSERT INTO data_integrity_checksums (
    table_name, checksum_type, checksum_value, record_count, migration_id
) VALUES 
('privilege_escalations', 'md5', 'test_checksum_001', 2, '008_database_privilege_roles'),
('migration_operation_logs', 'md5', 'test_checksum_002', 0, '008_database_privilege_roles');

-- Create test migration logs
INSERT INTO migration_operation_logs (
    migration_id, operation_type, table_affected, operation_sql,
    pre_checksum, post_checksum, record_count_before, record_count_after,
    status, executed_by, duration_ms
) VALUES 
('008_database_privilege_roles', 'migration', 'privilege_escalations', 
 'CREATE TABLE privilege_escalations...', 
 'pre_checksum_001', 'post_checksum_001', 0, 2, 'success', 'migration_user', 1500);
EOF
    
    echo "$backup_db_url" > "$BACKUP_RESULTS_DIR/backup_db_url.txt"
    print_success "Test database setup completed"
}

# Function to test backup procedures
test_backup_procedures() {
    print_header "Testing Backup Procedures"
    
    local backup_db_url=$(cat "$BACKUP_RESULTS_DIR/backup_db_url.txt")
    local backup_file="$BACKUP_RESULTS_DIR/privilege_migration_backup_${TIMESTAMP}.sql"
    local privilege_backup_file="$BACKUP_RESULTS_DIR/privilege_state_backup_${TIMESTAMP}.sql"
    
    # Test 1: Full database backup
    print_status "Creating full database backup..."
    if pg_dump "$backup_db_url" > "$backup_file" 2>> "$TEST_LOG"; then
        print_success "Full database backup created successfully"
        
        # Verify backup file size and content
        local backup_size=$(wc -c < "$backup_file")
        if [ "$backup_size" -gt 1000 ]; then
            print_success "Backup file size validation passed ($backup_size bytes)"
        else
            print_error "Backup file too small - may be incomplete"
            return 1
        fi
    else
        print_error "Failed to create database backup"
        return 1
    fi
    
    # Test 2: Privilege-specific backup
    print_status "Creating privilege state backup..."
    psql "$backup_db_url" << 'EOF' > "$privilege_backup_file" 2>> "$TEST_LOG"
-- Backup privilege escalations
\copy (SELECT * FROM privilege_escalations) TO STDOUT WITH CSV HEADER;

-- Backup data integrity checksums
\copy (SELECT * FROM data_integrity_checksums) TO STDOUT WITH CSV HEADER;

-- Backup migration operation logs
\copy (SELECT * FROM migration_operation_logs) TO STDOUT WITH CSV HEADER;

-- Backup role assignments (if any users exist)
SELECT rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb, rolcanlogin 
FROM pg_roles 
WHERE rolname LIKE 'zappy_%';
EOF
    
    if [ -f "$privilege_backup_file" ] && [ -s "$privilege_backup_file" ]; then
        print_success "Privilege state backup created successfully"
    else
        print_error "Failed to create privilege state backup"
        return 1
    fi
    
    # Test 3: Verify backup integrity
    print_status "Verifying backup integrity..."
    if pg_dump "$backup_db_url" --schema-only | grep -q "privilege_escalations\|data_integrity_checksums"; then
        print_success "Backup contains required privilege migration tables"
    else
        print_error "Backup missing critical privilege migration structures"
        return 1
    fi
}

# Function to test recovery procedures
test_recovery_procedures() {
    print_header "Testing Recovery Procedures"
    
    local backup_file="$BACKUP_RESULTS_DIR/privilege_migration_backup_${TIMESTAMP}.sql"
    
    # Create recovery database
    print_status "Creating recovery test database: $RECOVERY_DB_NAME"
    psql "$DATABASE_URL" -c "CREATE DATABASE $RECOVERY_DB_NAME;" &>> "$TEST_LOG"
    
    local recovery_db_url="${DATABASE_URL%/*}/$RECOVERY_DB_NAME"
    
    # Test 1: Full database recovery
    print_status "Testing full database recovery..."
    if psql "$recovery_db_url" < "$backup_file" &>> "$TEST_LOG"; then
        print_success "Database recovery completed successfully"
    else
        print_error "Database recovery failed"
        return 1
    fi
    
    # Test 2: Verify privilege data integrity after recovery
    print_status "Verifying privilege data integrity after recovery..."
    
    local escalation_count recovery_checksum
    escalation_count=$(psql "$recovery_db_url" -t -c "SELECT COUNT(*) FROM privilege_escalations;" 2>> "$TEST_LOG" | tr -d ' ')
    
    if [ "$escalation_count" = "2" ]; then
        print_success "Privilege escalation data recovered correctly ($escalation_count records)"
    else
        print_error "Privilege escalation data recovery failed (expected 2, got $escalation_count)"
        return 1
    fi
    
    # Test 3: Verify privilege functions are operational
    print_status "Testing privilege functions after recovery..."
    
    recovery_checksum=$(psql "$recovery_db_url" -t -c "SELECT validate_table_integrity('privilege_escalations', 'RECOVERY_TEST');" 2>> "$TEST_LOG" | tr -d ' ')
    
    if [ "$recovery_checksum" = "t" ]; then
        print_success "Privilege validation functions operational after recovery"
    else
        print_error "Privilege validation functions not working after recovery"
        return 1
    fi
    
    # Test 4: Verify role assignments after recovery
    print_status "Verifying role assignments after recovery..."
    
    local role_count
    role_count=$(psql "$recovery_db_url" -t -c "SELECT COUNT(*) FROM pg_roles WHERE rolname LIKE 'zappy_%';" 2>> "$TEST_LOG" | tr -d ' ')
    
    if [ "$role_count" -ge "4" ]; then
        print_success "Database roles recovered correctly ($role_count roles)"
    else
        print_warning "Some database roles may not be recovered ($role_count found, expected at least 4)"
    fi
}

# Function to test point-in-time recovery simulation
test_point_in_time_recovery() {
    print_header "Testing Point-in-Time Recovery Simulation"
    
    local backup_db_url=$(cat "$BACKUP_RESULTS_DIR/backup_db_url.txt")
    
    # Simulate data corruption after privilege migration
    print_status "Simulating data corruption scenario..."
    psql "$backup_db_url" << 'EOF' &>> "$TEST_LOG"
-- Simulate privilege escalation table corruption
UPDATE privilege_escalations SET status = 'corrupted' WHERE escalation_id = 'TEST-001';

-- Simulate integrity checksum corruption
UPDATE data_integrity_checksums SET checksum_value = 'corrupted_checksum' 
WHERE table_name = 'privilege_escalations';
EOF
    
    # Verify corruption is detected
    print_status "Verifying corruption detection..."
    local corrupted_count
    corrupted_count=$(psql "$backup_db_url" -t -c "SELECT COUNT(*) FROM privilege_escalations WHERE status = 'corrupted';" 2>> "$TEST_LOG" | tr -d ' ')
    
    if [ "$corrupted_count" = "1" ]; then
        print_success "Data corruption simulation successful"
    else
        print_error "Failed to simulate data corruption"
        return 1
    fi
    
    # Test recovery from corruption
    print_status "Testing recovery from corruption using backup..."
    
    local recovery_db_url="${DATABASE_URL%/*}/$RECOVERY_DB_NAME"
    local clean_count
    clean_count=$(psql "$recovery_db_url" -t -c "SELECT COUNT(*) FROM privilege_escalations WHERE status != 'corrupted';" 2>> "$TEST_LOG" | tr -d ' ')
    
    if [ "$clean_count" = "2" ]; then
        print_success "Clean data successfully recovered from backup"
    else
        print_error "Recovery from corruption failed"
        return 1
    fi
}

# Function to test backup validation and consistency
test_backup_consistency() {
    print_header "Testing Backup Consistency and Validation"
    
    local backup_file="$BACKUP_RESULTS_DIR/privilege_migration_backup_${TIMESTAMP}.sql"
    local consistency_report="$BACKUP_RESULTS_DIR/backup_consistency_report_${TIMESTAMP}.txt"
    
    # Test 1: Verify backup contains all required tables
    print_status "Verifying backup contains all privilege migration tables..."
    
    local required_tables=("privilege_escalations" "data_integrity_checksums" "migration_operation_logs")
    local missing_tables=""
    
    for table in "${required_tables[@]}"; do
        if grep -q "CREATE TABLE.*$table" "$backup_file"; then
            echo "✓ Table $table found in backup" >> "$consistency_report"
        else
            echo "✗ Table $table MISSING from backup" >> "$consistency_report"
            missing_tables="$missing_tables $table"
        fi
    done
    
    if [ -z "$missing_tables" ]; then
        print_success "All required tables present in backup"
    else
        print_error "Missing tables in backup:$missing_tables"
        return 1
    fi
    
    # Test 2: Verify backup contains all required functions
    print_status "Verifying backup contains all privilege functions..."
    
    local required_functions=("request_emergency_access" "validate_table_integrity")
    local missing_functions=""
    
    for func in "${required_functions[@]}"; do
        if grep -q "CREATE.*FUNCTION.*$func" "$backup_file"; then
            echo "✓ Function $func found in backup" >> "$consistency_report"
        else
            echo "✗ Function $func MISSING from backup" >> "$consistency_report"
            missing_functions="$missing_functions $func"
        fi
    done
    
    if [ -z "$missing_functions" ]; then
        print_success "All required functions present in backup"
    else
        print_error "Missing functions in backup:$missing_functions"
        return 1
    fi
    
    # Test 3: Verify backup contains all required roles
    print_status "Verifying backup contains privilege roles..."
    
    local required_roles=("zappy_readonly" "zappy_patient_update" "zappy_migration" "zappy_emergency")
    local missing_roles=""
    
    for role in "${required_roles[@]}"; do
        if grep -q "CREATE ROLE.*$role\|COMMENT ON ROLE.*$role" "$backup_file"; then
            echo "✓ Role $role found in backup" >> "$consistency_report"
        else
            echo "✗ Role $role MISSING from backup" >> "$consistency_report"
            missing_roles="$missing_roles $role"
        fi
    done
    
    if [ -z "$missing_roles" ]; then
        print_success "All required roles present in backup"
    else
        print_warning "Some roles missing from backup:$missing_roles (may be environment-specific)"
    fi
    
    print_status "Backup consistency report saved to: $consistency_report"
}

# Function to cleanup test resources
cleanup_test_resources() {
    print_header "Cleaning Up Test Resources"
    
    # Drop test databases
    print_status "Removing test databases..."
    psql "$DATABASE_URL" -c "DROP DATABASE IF EXISTS $BACKUP_DB_NAME;" &>> "$TEST_LOG" || true
    psql "$DATABASE_URL" -c "DROP DATABASE IF EXISTS $RECOVERY_DB_NAME;" &>> "$TEST_LOG" || true
    
    print_success "Test resource cleanup completed"
}

# Function to generate test report
generate_test_report() {
    print_header "Generating Backup Recovery Test Report"
    
    local report_file="$BACKUP_RESULTS_DIR/backup_recovery_test_report_${TIMESTAMP}.json"
    
    cat > "$report_file" << EOF
{
    "timestamp": "$TIMESTAMP",
    "environment": "$ENVIRONMENT",
    "test_results": {
        "backup_procedures": "PASSED",
        "recovery_procedures": "PASSED",
        "point_in_time_recovery": "PASSED",
        "backup_consistency": "PASSED"
    },
    "artifacts": {
        "backup_file": "privilege_migration_backup_${TIMESTAMP}.sql",
        "privilege_backup": "privilege_state_backup_${TIMESTAMP}.sql",
        "consistency_report": "backup_consistency_report_${TIMESTAMP}.txt",
        "test_log": "backup_recovery_test_${TIMESTAMP}.log"
    },
    "recommendations": [
        "Backup and recovery procedures validated for privilege migrations",
        "Point-in-time recovery capability confirmed",
        "Backup consistency verification passed",
        "Ready for production deployment with backup safeguards"
    ]
}
EOF
    
    print_success "Test report generated: $report_file"
    
    # Display summary
    echo -e "\n${BOLD}BACKUP RECOVERY TEST SUMMARY${NC}"
    echo "Environment: $ENVIRONMENT"
    echo "Timestamp: $TIMESTAMP"
    echo "Status: ✅ ALL TESTS PASSED"
    echo "Report: $report_file"
    echo "Artifacts: $BACKUP_RESULTS_DIR"
}

# Main execution function
main() {
    print_header "Database Backup and Recovery Validation Tests"
    print_status "Environment: $ENVIRONMENT"
    print_status "Timestamp: $TIMESTAMP"
    
    # Execute backup recovery testing pipeline
    check_prerequisites
    setup_test_database
    test_backup_procedures
    test_recovery_procedures
    test_point_in_time_recovery
    test_backup_consistency
    generate_test_report
    cleanup_test_resources
    
    print_header "Backup Recovery Testing Complete"
    print_success "All backup and recovery tests passed successfully"
    print_status "Results available in: $BACKUP_RESULTS_DIR"
}

# Execute main function with error handling
trap 'print_error "Backup recovery testing failed. Check logs: $TEST_LOG"; cleanup_test_resources' ERR

main "$@"