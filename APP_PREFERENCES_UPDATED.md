# Updated App Preferences Configuration

**Date:** 2025-10-17
**Migration Strategy Change:** Health Check Only (No Destructive Migrations)

---

## Overview

The migration system has been updated to use a **health-check-only approach**. This means:

✅ **What migrations DO:**
- Verify database connection
- Check if core tables exist
- Report database health status

❌ **What migrations DO NOT do:**
- Create tables
- Alter schemas
- Drop or modify data
- Run any destructive operations

---

## App Preferences Section (Updated)

### For DigitalOcean App Platform Configuration

When deploying to DigitalOcean App Platform, update your app configuration with the following settings:

```yaml
name: preschool-erp-backend
region: nyc

services:
  - name: backend
    environment_slug: node-js
    github:
      repo: your-org/preschool-erp
      branch: staging
      deploy_on_push: true

    # Environment Variables
    envs:
      # Database Configuration
      - key: DB_HOST
        value: ${db.HOSTNAME}
        type: SECRET
      - key: DB_PORT
        value: ${db.PORT}
        type: SECRET
      - key: DB_USER
        value: ${db.USERNAME}
        type: SECRET
      - key: DB_PASSWORD
        value: ${db.PASSWORD}
        type: SECRET
      - key: DB_NAME
        value: ${db.DATABASE}
        type: SECRET
      - key: DB_SSL
        value: "true"

      # JWT Configuration
      - key: JWT_SECRET
        value: "<your-jwt-secret-256-bit-hex>"
        type: SECRET
      - key: JWT_REFRESH_SECRET
        value: "<your-refresh-secret-256-bit-hex>"
        type: SECRET

      # Email Configuration (Hostinger SMTP)
      - key: SMTP_HOST
        value: "smtp.hostinger.com"
      - key: SMTP_PORT
        value: "465"
      - key: SMTP_SECURE
        value: "true"
      - key: SMTP_USER
        value: "<your-smtp-username>"
        type: SECRET
      - key: SMTP_PASS
        value: "<your-smtp-password>"
        type: SECRET
      - key: FROM_NAME
        value: "Preschool ERP System"
      - key: FROM_EMAIL
        value: "support@vanisris.com"

      # Server Configuration
      - key: PORT
        value: "8080"
      - key: NODE_ENV
        value: "production"
      - key: FRONTEND_URL
        value: "https://your-frontend-app.ondigitalocean.app"
      - key: ALLOWED_ORIGINS
        value: "https://your-frontend-app.ondigitalocean.app"

      # Session Configuration
      - key: SESSION_SECRET
        value: "<your-session-secret-256-bit-hex>"
        type: SECRET

      # Security
      - key: ALLOW_AUTH_DEBUG
        value: "false"

      # File Upload
      - key: MAX_FILE_SIZE
        value: "10485760"

    # Health Check Configuration
    health_check:
      http_path: /api/health
      initial_delay_seconds: 30
      period_seconds: 10
      timeout_seconds: 5
      success_threshold: 1
      failure_threshold: 3

    # Build Configuration
    build_command: npm install && npm run build

    # Run Configuration
    run_command: node index.js

    # HTTP Configuration
    http_port: 8080

    # Instance Configuration
    instance_count: 1
    instance_size_slug: basic-xxs

    # REMOVED: PRE-DEPLOY JOB FOR MIGRATIONS
    # The migration job has been removed as database schema changes
    # are now managed directly by the database administrator

databases:
  - name: preschool-db-staging
    engine: MYSQL
    version: "8"
    production: false
```

---

## Key Changes from Previous Configuration

### ❌ REMOVED: Pre-Deploy Migration Job

**OLD Configuration (DO NOT USE):**
```yaml
jobs:
  - name: run-migrations
    kind: PRE_DEPLOY
    run_command: node backend/check_and_run_migrations.js
```

**Why removed:**
- Migrations no longer create/alter tables
- Schema changes are managed manually by DBA
- Reduces deployment risk and complexity
- Prevents accidental schema modifications

### ✅ NEW: Health Check Only

**What happens on deployment:**
1. App pulls latest code from staging branch
2. Runs `npm install && npm run build`
3. Starts backend with `node index.js`
4. On server startup, `initializeAllTables()` runs health check
5. Backend connects to existing database schema
6. Health endpoint reports database status

---

## Manual Database Management Process

### For Database Administrators

When database schema changes are needed:

#### 1. Connect to DigitalOcean Database

```bash
mysql -h <STAGING_HOST> \
      -P <PORT> \
      -u <DB_USER> \
      -p<DB_PASSWORD> \
      --ssl-mode=REQUIRED \
      <DB_NAME>
```
(Use credentials from .env.staging file)

#### 2. Run SQL Commands Directly

```sql
-- Example: Add a new table
CREATE TABLE IF NOT EXISTS new_feature (
    id VARCHAR(36) PRIMARY KEY,
    center_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (center_id) REFERENCES centers(id)
);

-- Example: Add a column
ALTER TABLE users
ADD COLUMN new_field VARCHAR(255) NULL;

-- Example: Create an index
CREATE INDEX idx_users_email ON users(email);
```

#### 3. Document Changes

Create a migration file in `backend/migrations_backup/` for reference:

```sql
-- YYYY-MM-DD_description.sql
-- Applied manually on YYYY-MM-DD by [DBA Name]
-- [Description of changes]

-- Your SQL here
```

#### 4. Update Local Development Database

Apply the same changes to local database:

```bash
mysql -u python -pDelta.4599 preschool_erp < migration_file.sql
```

---

## Health Check Migration

The only migration that runs is `001_database_health_check.sql`:

```sql
-- Verify database connection
SELECT 1 AS health_check;

-- Check core tables exist
SELECT
    COUNT(*) as table_count,
    'Database schema check passed' as status
FROM information_schema.tables
WHERE table_schema = DATABASE()
AND table_name IN ('users', 'centers', 'children', 'classrooms')
HAVING COUNT(*) >= 4;
```

**This migration:**
- ✅ Reads from database only
- ✅ Safe to run multiple times
- ✅ No side effects
- ✅ Reports status without modifying data
- ❌ Does NOT create tables
- ❌ Does NOT alter schemas
- ❌ Does NOT delete data

---

## Deployment Workflow

### 1. Code Changes (Developers)

```bash
# Make code changes
git add .
git commit -m "feat: Add new feature"
git push origin staging
```

### 2. Automatic Deployment (DigitalOcean)

```
✅ Detect push to staging branch
✅ Pull latest code
✅ Run npm install
✅ Run npm run build (if configured)
✅ Start backend server
✅ Health check passes
✅ Deployment complete
```

### 3. Database Changes (DBA Only)

```bash
# Connect to database
mysql -h <staging-host> -P 25060 -u doadmin -p --ssl-mode=REQUIRED defaultdb

# Run SQL commands
CREATE TABLE ...;
ALTER TABLE ...;
CREATE INDEX ...;

# Test changes
SELECT * FROM new_table LIMIT 1;

# Document in migration file
echo "-- Applied: $(date)" > backend/migrations_backup/manual_YYYY-MM-DD.sql
```

---

## Testing the Health Check

### Local Testing

```bash
cd backend
node check_and_run_migrations.js
```

**Expected Output:**
```
🔍 Starting Database Health Check...

📋 Database Configuration:
   Host: localhost
   Port: 3306
   Database: preschool_erp
   SSL: Disabled

✅ Database connection established

📄 Running: 001_database_health_check.sql

✅ Health check queries executed successfully

🔍 Verifying core tables existence...

   ✅ Table exists: users
   ✅ Table exists: centers
   ✅ Table exists: children
   ✅ Table exists: classrooms

=================================================================
✅ DATABASE HEALTH CHECK PASSED
   All core tables exist and database is ready
=================================================================
```

### Staging Testing

```bash
# Test health endpoint
curl https://your-backend-app.ondigitalocean.app/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-10-17T10:30:00.000Z",
  "database": "connected",
  "environment": "production"
}
```

---

## Rollback Procedure

If deployment fails:

### 1. Check Health Endpoint

```bash
curl https://your-backend-app.ondigitalocean.app/api/health
```

### 2. View Logs in DigitalOcean

```
App Settings → Runtime Logs → View Logs
```

### 3. Rollback Code (if needed)

```bash
# In DigitalOcean App Platform
Components → backend → Settings → Redeploy Previous Version
```

### 4. Database Rollback (if needed)

```sql
-- Connect to database
-- Restore from backup or reverse changes manually
DROP TABLE new_table;
ALTER TABLE users DROP COLUMN new_field;
```

---

## Security Best Practices

### Environment Variables

✅ **Store as SECRETS in DigitalOcean:**
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `SESSION_SECRET`
- `SMTP_PASS`

✅ **Never commit to git:**
- `.env` files
- Database credentials
- API keys
- Passwords

### Database Access

✅ **Only grant access to:**
- Database administrators
- Senior developers (read-only)

❌ **Never:**
- Share database credentials in chat/email
- Commit credentials to git
- Use production credentials locally

---

## Monitoring and Alerts

### DigitalOcean Monitoring

**Set up alerts for:**
- Health check failures
- High CPU usage (> 80%)
- High memory usage (> 80%)
- Request error rate (> 5%)

### Health Check Endpoint

Monitor `/api/health` endpoint:

```bash
# Add to uptime monitoring service (e.g., UptimeRobot, Pingdom)
URL: https://your-backend-app.ondigitalocean.app/api/health
Interval: Every 5 minutes
Expected: HTTP 200 with {"status": "ok"}
```

---

## FAQ

### Q: What happens if I need to add a new table?

**A:** Connect directly to the database and run `CREATE TABLE` commands. Document the changes in `backend/migrations_backup/`.

### Q: Can I still use migration files for documentation?

**A:** Yes! Store SQL files in `backend/migrations_backup/` as documentation. Just don't expect them to run automatically.

### Q: What if health check fails on staging?

**A:** Check:
1. Database credentials in environment variables
2. Database server is running
3. SSL is enabled (`DB_SSL=true`)
4. Network connectivity between app and database

### Q: How do I sync local database with staging?

**A:** Export staging schema and import to local:

```bash
# Export from staging
mysqldump -h <staging-host> -P 25060 -u doadmin -p \
  --ssl-mode=REQUIRED --no-data defaultdb > staging_schema.sql

# Import to local
mysql -u python -pDelta.4599 preschool_erp < staging_schema.sql
```

### Q: Can I revert to the old migration system?

**A:** Yes, restore files from `backend/migrations_backup/` and update app preferences. However, this is **not recommended** as it introduces deployment risks.

---

## Summary of Changes

| Aspect | Old Approach | New Approach |
|--------|-------------|-------------|
| **Migrations** | Create/alter tables automatically | Health check only |
| **Schema Changes** | Via migration files | Manual by DBA |
| **Pre-Deploy Job** | Runs migrations | Removed |
| **Deployment Risk** | Medium (schema changes) | Low (code only) |
| **Database Control** | Automated | Manual |
| **Rollback** | Complex | Simple |
| **Documentation** | Migration files | Manual SQL + docs |

---

## Next Steps

1. **Update DigitalOcean App Platform:**
   - Remove pre-deploy migration job
   - Verify environment variables
   - Test deployment

2. **Database Administrator:**
   - Review current staging schema
   - Document any manual changes needed
   - Set up backup schedule

3. **Development Team:**
   - Test health check locally
   - Update deployment documentation
   - Coordinate schema changes with DBA

---

**Document Version:** 2.0
**Last Updated:** 2025-10-17
**Maintained By:** DevOps Team
