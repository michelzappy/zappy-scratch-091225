# Database Setup Instructions

## Option 1: Docker with Adminer (Recommended)

**Step 1: Start PostgreSQL + Adminer**
```bash
docker-compose -f database/docker-adminer-setup.yml up -d
```

**Step 2: Access Adminer Web Interface**
- URL: http://localhost:8080
- System: PostgreSQL
- Server: postgres
- Username: telehealth_user
- Password: secure_password
- Database: telehealth_db

**Step 3: Test Backend Connection**
```bash
cd backend && node test-connection.js
```

## Option 2: Manual Setup (Database Reset + Schema)

**Step 1: Reset Database with Fresh Credentials**
```bash
psql -U postgres -f database/reset-database.sql
```

**Step 2: Apply Complete Schema**
```bash
psql -U telehealth_user -d telehealth_db -f database/apply-schema.sql
```

**Step 3: Test Connection**
```bash
cd backend && node test-connection.js
```

## Expected Output

After Step 1:
```
Database reset completed successfully!
User: telehealth_user
Database: telehealth_db
Ready for schema migrations!
```

After Step 2:
```
Schema applied successfully!
```

After Step 3:
```
🔍 Testing database connection...
DATABASE_URL: Set ✅
✅ Database connected successfully!
✅ Database query test successful: [ { test: 1 } ]
✅ Connection closed gracefully
```

## What's Created

- **Database**: `telehealth_db`
- **User**: `telehealth_user` (password: `secure_password`)
- **Tables**: 15 core tables for telehealth platform
- **Extensions**: uuid-ossp, pgcrypto
- **Indexes**: Optimized for common queries
- **Triggers**: Auto-update timestamps

## Troubleshooting

**Permission Denied**: Run as postgres superuser
```bash
sudo -u postgres psql -f database/reset-database.sql
```

**Connection Issues**: Verify PostgreSQL is running
```bash
pg_ctl status
```

**Port Issues**: Check if PostgreSQL is on port 5432
```bash
netstat -an | grep 5432