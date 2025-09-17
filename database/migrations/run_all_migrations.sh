#!/bin/bash

# Cross-platform migration runner for Drizzle ORM + PostgreSQL
# Supports: up, down, status commands
# Usage: ./run_all_migrations.sh [up|down|status]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

# Default DATABASE_URL if not set
DATABASE_URL=${DATABASE_URL:-"postgresql://telehealth_user:secure_password@localhost:5432/telehealth_db"}

# Migration files in order
MIGRATIONS=(
    "001_consolidated_schema.sql"
    "002_communication_logs.sql"
    "003_treatment_plans.sql"
    "004_consolidate_admin_tables.sql"
    "005_analytics_events.sql"
    "006_admin_patient_management.sql"
)

# Function to print colored output
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

# Function to check if psql is available
check_psql() {
    if ! command -v psql &> /dev/null; then
        print_error "psql command not found. Please install PostgreSQL client tools."
        exit 1
    fi
}

# Function to test database connection
test_connection() {
    print_status "Testing database connection..."
    if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
        print_success "Database connection successful"
        return 0
    else
        print_error "Failed to connect to database: $DATABASE_URL"
        return 1
    fi
}

# Function to create migration tracking table
create_migration_table() {
    print_status "Creating migration tracking table..."
    psql "$DATABASE_URL" -c "
        CREATE TABLE IF NOT EXISTS migration_history (
            id SERIAL PRIMARY KEY,
            migration_name VARCHAR(255) UNIQUE NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            checksum VARCHAR(64)
        );
    " &> /dev/null
}

# Function to get migration checksum
get_checksum() {
    local file="$1"
    if command -v sha256sum &> /dev/null; then
        sha256sum "$file" | cut -d' ' -f1
    elif command -v shasum &> /dev/null; then
        shasum -a 256 "$file" | cut -d' ' -f1
    else
        # Fallback for systems without sha256sum or shasum
        echo "no-checksum"
    fi
}

# Function to check if migration was applied
is_migration_applied() {
    local migration_name="$1"
    local count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM migration_history WHERE migration_name = '$migration_name';" 2>/dev/null | tr -d ' ')
    [ "$count" = "1" ]
}

# Function to run migrations up
migrate_up() {
    print_status "Running migrations UP..."
    
    create_migration_table
    
    local applied_count=0
    local skipped_count=0
    
    for migration in "${MIGRATIONS[@]}"; do
        local migration_file="$MIGRATIONS_DIR/$migration"
        
        if [ ! -f "$migration_file" ]; then
            print_warning "Migration file not found: $migration"
            continue
        fi
        
        if is_migration_applied "$migration"; then
            print_status "Skipping already applied migration: $migration"
            ((skipped_count++))
            continue
        fi
        
        print_status "Applying migration: $migration"
        
        # Get checksum before applying
        local checksum=$(get_checksum "$migration_file")
        
        # Apply migration
        if psql "$DATABASE_URL" -f "$migration_file" &> /dev/null; then
            # Record successful migration
            psql "$DATABASE_URL" -c "
                INSERT INTO migration_history (migration_name, checksum) 
                VALUES ('$migration', '$checksum');
            " &> /dev/null
            
            print_success "Applied migration: $migration"
            ((applied_count++))
        else
            print_error "Failed to apply migration: $migration"
            exit 1
        fi
    done
    
    print_success "Migration complete! Applied: $applied_count, Skipped: $skipped_count"
}

# Function to run migrations down (rollback)
migrate_down() {
    print_warning "Rolling back last migration..."
    
    # Get the last applied migration
    local last_migration=$(psql "$DATABASE_URL" -t -c "
        SELECT migration_name FROM migration_history 
        ORDER BY applied_at DESC LIMIT 1;
    " 2>/dev/null | tr -d ' ')
    
    if [ -z "$last_migration" ]; then
        print_warning "No migrations to rollback"
        return 0
    fi
    
    print_status "Rolling back migration: $last_migration"
    
    # For now, we'll just remove from history (manual rollback required)
    # In production, you'd want proper down migrations
    psql "$DATABASE_URL" -c "
        DELETE FROM migration_history WHERE migration_name = '$last_migration';
    " &> /dev/null
    
    print_warning "Migration '$last_migration' removed from history."
    print_warning "Note: This does not automatically undo schema changes."
    print_warning "Manual rollback of schema changes may be required."
}

# Function to show migration status
show_status() {
    print_status "Migration Status:"
    echo
    
    create_migration_table
    
    printf "%-40s %-15s %-20s\n" "Migration" "Status" "Applied At"
    printf "%-40s %-15s %-20s\n" "----------------------------------------" "---------------" "--------------------"
    
    for migration in "${MIGRATIONS[@]}"; do
        if is_migration_applied "$migration"; then
            local applied_at=$(psql "$DATABASE_URL" -t -c "
                SELECT applied_at FROM migration_history 
                WHERE migration_name = '$migration';
            " 2>/dev/null | tr -d ' ')
            printf "%-40s ${GREEN}%-15s${NC} %-20s\n" "$migration" "APPLIED" "$applied_at"
        else
            printf "%-40s ${YELLOW}%-15s${NC} %-20s\n" "$migration" "PENDING" "-"
        fi
    done
    
    echo
    local total_migrations=${#MIGRATIONS[@]}
    local applied_migrations=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM migration_history;" 2>/dev/null | tr -d ' ')
    print_status "Total migrations: $total_migrations, Applied: $applied_migrations"
}

# Main script logic
main() {
    local command="${1:-up}"
    
    print_status "Drizzle Migration Runner"
    print_status "Database: $DATABASE_URL"
    print_status "Command: $command"
    echo
    
    check_psql
    
    if ! test_connection; then
        exit 1
    fi
    
    case "$command" in
        "up")
            migrate_up
            ;;
        "down")
            migrate_down
            ;;
        "status")
            show_status
            ;;
        *)
            print_error "Unknown command: $command"
            echo "Usage: $0 [up|down|status]"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"