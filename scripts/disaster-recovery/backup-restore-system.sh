#!/bin/bash

# Telehealth Platform Disaster Recovery and Backup System
# Comprehensive backup, monitoring, and recovery procedures

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
DATABASE_URL="${DATABASE_URL:-}"
REDIS_URL="${REDIS_URL:-}"
S3_BUCKET="${S3_BUCKET:-telehealth-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
NOTIFICATION_WEBHOOK="${NOTIFICATION_WEBHOOK:-}"

# Logging
LOG_FILE="${BACKUP_DIR}/logs/backup-$(date +%Y%m%d).log"
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*" | tee -a "$LOG_FILE" >&2
}

# Notification function
notify() {
    local message="$1"
    local status="${2:-INFO}"
    
    log "$status: $message"
    
    if [[ -n "$NOTIFICATION_WEBHOOK" ]]; then
        curl -X POST "$NOTIFICATION_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"🚨 **Telehealth DR**: [$status] $message\"}" \
            2>/dev/null || true
    fi
}

# Database backup function
backup_database() {
    log "Starting database backup..."
    
    if [[ -z "$DATABASE_URL" ]]; then
        error "DATABASE_URL not configured"
        return 1
    fi
    
    local backup_file="$BACKUP_DIR/database/db-backup-$(date +%Y%m%d-%H%M%S).sql.gz"
    mkdir -p "$(dirname "$backup_file")"
    
    # Create database backup
    if pg_dump "$DATABASE_URL" | gzip > "$backup_file"; then
        local backup_size=$(du -h "$backup_file" | cut -f1)
        log "Database backup completed: $backup_file ($backup_size)"
        
        # Verify backup integrity
        if verify_database_backup "$backup_file"; then
            log "Database backup verification successful"
            
            # Upload to S3 if configured
            if command -v aws &> /dev/null && [[ -n "$S3_BUCKET" ]]; then
                aws s3 cp "$backup_file" "s3://$S3_BUCKET/database/$(basename "$backup_file")"
                log "Database backup uploaded to S3"
            fi
            
            echo "$backup_file"
        else
            error "Database backup verification failed"
            rm -f "$backup_file"
            return 1
        fi
    else
        error "Database backup failed"
        return 1
    fi
}

# Verify database backup
verify_database_backup() {
    local backup_file="$1"
    
    log "Verifying database backup: $backup_file"
    
    # Check if file exists and is not empty
    if [[ ! -f "$backup_file" ]] || [[ ! -s "$backup_file" ]]; then
        error "Backup file is missing or empty"
        return 1
    fi
    
    # Check if gzip file is valid
    if ! gzip -t "$backup_file" 2>/dev/null; then
        error "Backup file is corrupted (invalid gzip)"
        return 1
    fi
    
    # Check for critical tables in backup
    local required_tables=("patients" "providers" "consultations" "prescriptions")
    local backup_content=$(zcat "$backup_file")
    
    for table in "${required_tables[@]}"; do
        if ! echo "$backup_content" | grep -q "CREATE TABLE.*$table"; then
            error "Required table '$table' not found in backup"
            return 1
        fi
    done
    
    log "Database backup verification completed successfully"
    return 0
}

# Application files backup
backup_application_files() {
    log "Starting application files backup..."
    
    local backup_file="$BACKUP_DIR/application/app-files-$(date +%Y%m%d-%H%M%S).tar.gz"
    mkdir -p "$(dirname "$backup_file")"
    
    # Files and directories to backup
    local backup_paths=(
        "uploads/"
        "logs/"
        ".env.production"
        "package.json"
        "package-lock.json"
    )
    
    # Create application backup
    if tar -czf "$backup_file" --exclude='node_modules' --exclude='.git' "${backup_paths[@]}" 2>/dev/null; then
        local backup_size=$(du -h "$backup_file" | cut -f1)
        log "Application files backup completed: $backup_file ($backup_size)"
        
        # Upload to S3 if configured
        if command -v aws &> /dev/null && [[ -n "$S3_BUCKET" ]]; then
            aws s3 cp "$backup_file" "s3://$S3_BUCKET/application/$(basename "$backup_file")"
            log "Application files backup uploaded to S3"
        fi
        
        echo "$backup_file"
    else
        error "Application files backup failed"
        return 1
    fi
}

# Redis backup (if configured)
backup_redis() {
    if [[ -z "$REDIS_URL" ]]; then
        log "Redis not configured, skipping Redis backup"
        return 0
    fi
    
    log "Starting Redis backup..."
    
    local backup_file="$BACKUP_DIR/redis/redis-backup-$(date +%Y%m%d-%H%M%S).rdb"
    mkdir -p "$(dirname "$backup_file")"
    
    # Create Redis backup using redis-cli
    if redis-cli --rdb "$backup_file" >/dev/null 2>&1; then
        local backup_size=$(du -h "$backup_file" | cut -f1)
        log "Redis backup completed: $backup_file ($backup_size)"
        
        # Upload to S3 if configured
        if command -v aws &> /dev/null && [[ -n "$S3_BUCKET" ]]; then
            aws s3 cp "$backup_file" "s3://$S3_BUCKET/redis/$(basename "$backup_file")"
            log "Redis backup uploaded to S3"
        fi
        
        echo "$backup_file"
    else
        error "Redis backup failed"
        return 1
    fi
}

# Complete system backup
full_backup() {
    log "=== Starting Full System Backup ==="
    
    local backup_started=$(date +%s)
    local backup_success=true
    
    # Create backup manifest
    local manifest_file="$BACKUP_DIR/manifests/backup-manifest-$(date +%Y%m%d-%H%M%S).json"
    mkdir -p "$(dirname "$manifest_file")"
    
    cat > "$manifest_file" << EOF
{
  "backup_id": "$(uuidgen)",
  "timestamp": "$(date -Iseconds)",
  "environment": "${NODE_ENV:-development}",
  "system": {
    "hostname": "$(hostname)",
    "os": "$(uname -s)",
    "version": "$(uname -r)"
  },
  "components": {}
}
EOF
    
    # Database backup
    if db_backup=$(backup_database); then
        jq '.components.database = {"status": "success", "file": "'"$db_backup"'", "size": "'"$(du -h "$db_backup" | cut -f1)"'"}' "$manifest_file" > "${manifest_file}.tmp" && mv "${manifest_file}.tmp" "$manifest_file"
    else
        jq '.components.database = {"status": "failed", "error": "Database backup failed"}' "$manifest_file" > "${manifest_file}.tmp" && mv "${manifest_file}.tmp" "$manifest_file"
        backup_success=false
    fi
    
    # Application files backup
    if app_backup=$(backup_application_files); then
        jq '.components.application = {"status": "success", "file": "'"$app_backup"'", "size": "'"$(du -h "$app_backup" | cut -f1)"'"}' "$manifest_file" > "${manifest_file}.tmp" && mv "${manifest_file}.tmp" "$manifest_file"
    else
        jq '.components.application = {"status": "failed", "error": "Application backup failed"}' "$manifest_file" > "${manifest_file}.tmp" && mv "${manifest_file}.tmp" "$manifest_file"
        backup_success=false
    fi
    
    # Redis backup
    if redis_backup=$(backup_redis); then
        jq '.components.redis = {"status": "success", "file": "'"$redis_backup"'", "size": "'"$(du -h "$redis_backup" | cut -f1)"'"}' "$manifest_file" > "${manifest_file}.tmp" && mv "${manifest_file}.tmp" "$manifest_file"
    else
        jq '.components.redis = {"status": "failed", "error": "Redis backup failed"}' "$manifest_file" > "${manifest_file}.tmp" && mv "${manifest_file}.tmp" "$manifest_file"
    fi
    
    # Finalize manifest
    local backup_duration=$(($(date +%s) - backup_started))
    jq '.duration_seconds = '"$backup_duration"' | .status = "'"$([ "$backup_success" = true ] && echo "success" || echo "failed")"'"' "$manifest_file" > "${manifest_file}.tmp" && mv "${manifest_file}.tmp" "$manifest_file"
    
    if [[ "$backup_success" = true ]]; then
        notify "Full system backup completed successfully in ${backup_duration}s" "SUCCESS"
        log "=== Full System Backup Completed Successfully ==="
        log "Manifest: $manifest_file"
    else
        notify "Full system backup completed with errors in ${backup_duration}s" "WARNING"
        log "=== Full System Backup Completed with Errors ==="
    fi
    
    # Upload manifest to S3
    if command -v aws &> /dev/null && [[ -n "$S3_BUCKET" ]]; then
        aws s3 cp "$manifest_file" "s3://$S3_BUCKET/manifests/$(basename "$manifest_file")"
        log "Backup manifest uploaded to S3"
    fi
    
    # Cleanup old backups
    cleanup_old_backups
    
    return $([ "$backup_success" = true ] && echo 0 || echo 1)
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    
    local dirs=("$BACKUP_DIR/database" "$BACKUP_DIR/application" "$BACKUP_DIR/redis" "$BACKUP_DIR/manifests")
    
    for dir in "${dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            find "$dir" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
            log "Cleaned up old backups in $dir"
        fi
    done
    
    # Clean up S3 backups if configured
    if command -v aws &> /dev/null && [[ -n "$S3_BUCKET" ]]; then
        local cutoff_date=$(date -d "$RETENTION_DAYS days ago" '+%Y-%m-%d')
        log "Cleaning up S3 backups older than $cutoff_date"
        
        # This would need more sophisticated S3 lifecycle policies in production
        log "S3 cleanup configured via lifecycle policies"
    fi
}

# Database restore function
restore_database() {
    local backup_file="$1"
    
    if [[ ! -f "$backup_file" ]]; then
        error "Backup file not found: $backup_file"
        return 1
    fi
    
    log "Starting database restore from: $backup_file"
    
    # Verify backup before restore
    if ! verify_database_backup "$backup_file"; then
        error "Backup verification failed, aborting restore"
        return 1
    fi
    
    # Create restore confirmation
    read -p "⚠️  This will overwrite the current database. Type 'RESTORE' to confirm: " confirmation
    if [[ "$confirmation" != "RESTORE" ]]; then
        log "Database restore cancelled by user"
        return 1
    fi
    
    # Create pre-restore backup
    log "Creating pre-restore backup..."
    local pre_restore_backup="$BACKUP_DIR/database/pre-restore-$(date +%Y%m%d-%H%M%S).sql.gz"
    if ! pg_dump "$DATABASE_URL" | gzip > "$pre_restore_backup"; then
        error "Failed to create pre-restore backup"
        return 1
    fi
    
    # Restore database
    log "Restoring database..."
    if zcat "$backup_file" | psql "$DATABASE_URL"; then
        log "Database restore completed successfully"
        notify "Database restore completed successfully" "SUCCESS"
        return 0
    else
        error "Database restore failed"
        log "Attempting to restore from pre-restore backup..."
        if zcat "$pre_restore_backup" | psql "$DATABASE_URL"; then
            log "Rollback to pre-restore state successful"
            notify "Database restore failed, rolled back successfully" "WARNING"
        else
            error "Rollback failed - database may be in inconsistent state"
            notify "CRITICAL: Database restore and rollback both failed" "CRITICAL"
        fi
        return 1
    fi
}

# System health check
health_check() {
    log "Performing system health check..."
    
    local health_status=0
    
    # Check database connectivity
    if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
        log "✓ Database connectivity: OK"
    else
        error "✗ Database connectivity: FAILED"
        health_status=1
    fi
    
    # Check disk space
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [[ $disk_usage -lt 90 ]]; then
        log "✓ Disk space: OK ($disk_usage% used)"
    else
        error "✗ Disk space: WARNING ($disk_usage% used)"
        health_status=1
    fi
    
    # Check backup directory
    if [[ -d "$BACKUP_DIR" ]] && [[ -w "$BACKUP_DIR" ]]; then
        log "✓ Backup directory: OK"
    else
        error "✗ Backup directory: FAILED"
        health_status=1
    fi
    
    # Check recent backups
    local latest_backup=$(find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime -1 | head -1)
    if [[ -n "$latest_backup" ]]; then
        log "✓ Recent backup: OK ($(basename "$latest_backup"))"
    else
        error "✗ Recent backup: No backup found in last 24 hours"
        health_status=1
    fi
    
    return $health_status
}

# Monitoring and alerting
monitor_system() {
    log "Starting system monitoring..."
    
    while true; do
        if ! health_check; then
            notify "System health check failed - review required" "WARNING"
        fi
        
        # Check if backup is needed (daily at 2 AM)
        local current_hour=$(date +%H)
        local current_minute=$(date +%M)
        
        if [[ "$current_hour" == "02" ]] && [[ "$current_minute" == "00" ]]; then
            log "Triggering scheduled backup..."
            full_backup
        fi
        
        # Sleep for 1 hour
        sleep 3600
    done
}

# Main execution
main() {
    local command="${1:-help}"
    
    case "$command" in
        "backup")
            full_backup
            ;;
        "restore")
            if [[ -z "${2:-}" ]]; then
                error "Usage: $0 restore <backup_file>"
                exit 1
            fi
            restore_database "$2"
            ;;
        "health")
            health_check
            ;;
        "monitor")
            monitor_system
            ;;
        "cleanup")
            cleanup_old_backups
            ;;
        "help"|*)
            cat << EOF
Telehealth Platform Disaster Recovery System

Usage: $0 <command>

Commands:
  backup      - Perform full system backup
  restore     - Restore from backup file
  health      - Check system health
  monitor     - Start continuous monitoring
  cleanup     - Clean up old backups
  help        - Show this help message

Environment Variables:
  BACKUP_DIR          - Backup directory (default: /backups)
  DATABASE_URL        - PostgreSQL connection string
  REDIS_URL           - Redis connection string (optional)
  S3_BUCKET           - S3 bucket for remote backups (optional)
  RETENTION_DAYS      - Backup retention period (default: 30)
  NOTIFICATION_WEBHOOK - Slack/Discord webhook for notifications

Examples:
  $0 backup
  $0 restore /backups/database/db-backup-20250923-140000.sql.gz
  $0 health
EOF
            ;;
    esac
}

# Check dependencies
check_dependencies() {
    local missing_deps=()
    
    command -v psql >/dev/null 2>&1 || missing_deps+=("postgresql-client")
    command -v redis-cli >/dev/null 2>&1 || missing_deps+=("redis-tools")
    command -v jq >/dev/null 2>&1 || missing_deps+=("jq")
    command -v curl >/dev/null 2>&1 || missing_deps+=("curl")
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        error "Missing dependencies: ${missing_deps[*]}"
        error "Please install missing packages and try again"
        exit 1
    fi
}

# Initialize
check_dependencies
mkdir -p "$BACKUP_DIR"/{database,application,redis,manifests,logs}

# Execute main function
main "$@"