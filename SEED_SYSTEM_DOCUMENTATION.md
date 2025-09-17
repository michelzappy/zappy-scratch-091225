# Idempotent Seed System Documentation

## Overview

This document describes the comprehensive, idempotent seed system created for the telehealth platform. The system is designed to safely initialize the database with essential operational data and can be run multiple times without creating duplicates.

## Architecture

### Core Components

1. **Seed Utilities Framework** (`backend/scripts/seed-utils.js`)
   - Provides helper functions for idempotent database operations
   - Handles password hashing, environment variables, and database checks
   - Includes transaction support and error handling

2. **Core Seeds** (`backend/seeds/00_core.js`)
   - System configuration and essential settings
   - Consultation settings with default pricing
   - Database extensions and core table verification

3. **Admin Seeds** (`backend/seeds/10_admin.js`)
   - Creates initial admin user(s)
   - Supports both Supabase auth and local auth fallback
   - Optional provider stub for system testing

4. **Reference Data Seeds** (`backend/seeds/20_reference.js`)
   - Essential medications catalog
   - Partner pharmacies for fulfillment
   - Basic treatment plans (if table exists)

5. **Main Seed Script** (`backend/scripts/seed.js`)
   - Orchestrates all seeding operations
   - Uses Drizzle ORM with proper connection management
   - Provides comprehensive logging and error handling

## Features

### Idempotency
- **Safe to re-run**: All operations check for existing data before inserting
- **No duplicates**: Uses `ON CONFLICT DO NOTHING` and existence checks
- **Consistent state**: System reaches the same end state regardless of how many times it's run

### Environment Configuration
- **Flexible admin setup**: Configure admin credentials via environment variables
- **Optional components**: Provider stubs and additional admins can be enabled/disabled
- **Secure defaults**: Generates secure passwords when not provided

### Error Handling
- **Graceful failures**: Continues operation when non-critical components fail
- **Detailed logging**: Comprehensive logging with timestamps and operation details
- **Transaction support**: Critical operations can be wrapped in transactions

## Usage

### Basic Seeding
```bash
# Run all seeds
npm run db:seed

# Initialize fresh database
npm run db:init

# Reset database completely
npm run db:reset

# Fresh start (drop schema and rebuild)
npm run db:fresh
```

### Individual Seed Modules
```bash
# Run only core seeds
npm run db:seed:core

# Run only admin seeds
npm run db:seed:admin

# Run only reference data seeds
npm run db:seed:reference
```

### Environment Variables

#### Admin Configuration
```bash
# Primary admin user
SEED_ADMIN_EMAIL=admin@yourcompany.com
SEED_ADMIN_PASSWORD=your-secure-password
SEED_ADMIN_FIRST_NAME=System
SEED_ADMIN_LAST_NAME=Administrator
SEED_ADMIN_ROLE=admin

# Additional admins (optional)
SEED_ADDITIONAL_ADMINS=support@company.com:support,manager@company.com:admin

# Provider stub (optional)
SEED_CREATE_PROVIDER_STUB=true
SEED_PROVIDER_EMAIL=provider@company.com
```

## Data Seeded

### Core System Data
- **Consultation Settings**: Default pricing and card-on-file requirements
- **System Extensions**: PostgreSQL extensions (uuid-ossp, pgcrypto)
- **Table Verification**: Ensures all required tables exist

### Admin Users
- **Primary Admin**: System administrator with full permissions
- **Additional Admins**: Optional additional admin users
- **Provider Stub**: Optional test provider account

### Reference Data
- **Medications**: Essential telehealth medications
  - Semaglutide (Weight Loss)
  - Sildenafil (ED)
  - Finasteride (Hair Loss)
  - Minoxidil (Hair Loss)
  - Metformin (Longevity)

- **Pharmacies**: Partner pharmacies for fulfillment
  - TeleHealth Pharmacy Partners (Primary)
  - National Compounding Pharmacy (Secondary)

- **Treatment Plans**: Basic plans for core conditions
  - Weight Loss Starter
  - Hair Loss Essential
  - ED Essential

## Security Considerations

### Password Security
- **Bcrypt Hashing**: All passwords are hashed with bcrypt (12 rounds)
- **Secure Generation**: Auto-generated passwords use cryptographically secure random generation
- **No Plain Text**: Passwords are never stored in plain text

### Environment Security
- **Credential Management**: Sensitive data configured via environment variables
- **Production Safety**: Different configurations for development vs production
- **Audit Trail**: All operations are logged for compliance

## Database Compatibility

### Supported Databases
- **PostgreSQL**: Primary database (required)
- **Drizzle ORM**: Uses Drizzle ORM with postgres-js driver
- **Connection Pooling**: Proper connection management and cleanup

### Migration Dependencies
- **Requires Migrations**: All database tables must exist before seeding
- **Schema Validation**: Verifies required tables exist before proceeding
- **Extension Dependencies**: Requires uuid-ossp and pgcrypto extensions

## Error Scenarios

### Common Issues and Solutions

1. **Database Connection Failed**
   - Verify `DATABASE_URL` environment variable
   - Ensure PostgreSQL is running and accessible
   - Check network connectivity and credentials

2. **Table Does Not Exist**
   - Run migrations first: `npm run db:migrate`
   - Verify migration scripts executed successfully
   - Check database schema matches expected structure

3. **Permission Denied**
   - Verify database user has CREATE, INSERT, UPDATE permissions
   - Check if user can create extensions (for system setup)
   - Ensure proper role assignments in PostgreSQL

4. **Duplicate Key Errors**
   - Should not occur due to idempotent design
   - If occurring, check for race conditions in concurrent runs
   - Verify unique constraints match seed logic

## Maintenance

### Adding New Seeds
1. Create new seed file in `backend/seeds/` with appropriate prefix (e.g., `30_new_data.js`)
2. Import and call from main seed script
3. Follow idempotent patterns from existing seeds
4. Add corresponding npm script if needed

### Updating Existing Data
- Modify seed files to include new data
- Use upsert patterns for data that might change
- Consider migration scripts for structural changes
- Test thoroughly in development environment

### Monitoring
- Check seed execution logs for errors
- Monitor database for expected data presence
- Verify admin user access after seeding
- Test system functionality with seeded data

## Testing

### Validation
- **Syntax Testing**: `node scripts/test-seed.js`
- **Dry Run**: Review logs before database operations
- **Idempotency Testing**: Run seeds multiple times to verify no duplicates
- **Integration Testing**: Verify seeded data works with application

### Best Practices
- Always test in development environment first
- Backup production database before running seeds
- Monitor logs during execution
- Verify expected data exists after completion

## Integration with CI/CD

### Deployment Pipeline
```bash
# In deployment script
npm run db:migrate  # Run migrations first
npm run db:seed     # Then seed essential data
```

### Environment-Specific Configuration
- Use different environment variables per environment
- Consider separate seed data for staging vs production
- Implement proper secret management for credentials

## Conclusion

This seed system provides a robust, secure, and maintainable way to initialize the telehealth platform database. Its idempotent design ensures safe operation in all environments, while the modular structure allows for easy maintenance and extension.

The system handles the most critical operational data needed for the platform to function, including admin access, essential medications, and basic system configuration. All operations are logged and can be safely repeated, making it suitable for both initial setup and ongoing maintenance.