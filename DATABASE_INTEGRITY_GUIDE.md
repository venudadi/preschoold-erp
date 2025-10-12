# Database Migration and Integrity Validation Guide

## Overview

This guide explains how to ensure successful database migration AND maintain full functionality when deploying to Digital Ocean or other production environments.

## Problem Statement

When migrating to Digital Ocean, existing databases may have schema inconsistencies:
- Column type mismatches (e.g., `centers.id` as `INT` instead of `VARCHAR(36)`)
- Missing foreign key constraints
- These issues can cause:
  - Migration failures
  - Data integrity problems
  - Application errors due to missing referential integrity

## Solution Approach

We use a **two-phase approach**:

### Phase 1: Migration (Permissive)
- Migrations run with error tolerance
- FK constraint failures are logged but don't stop the process
- Tables and columns are created successfully
- System becomes operational

### Phase 2: Integrity Validation & Repair (Strict)
- After migration, run integrity checker
- Identifies missing constraints and type mismatches
- Repairs what it can automatically
- Generates manual repair script for complex issues

## Deployment Steps

### Step 1: Run Migrations

```bash
cd backend
npm run migrate
```

**What happens:**
- All table structures are created/updated
- Indexes are added
- Some FK constraints may fail (logged as warnings)
- Migration completes successfully

### Step 2: Check Database Integrity

```bash
npm run check:integrity
```

**What happens:**
- Scans all expected foreign key constraints
- Checks column type compatibility
- Attempts automatic repairs
- Generates `database_repair_script.sql` if manual fixes are needed

**Output example:**
```
📊 Checking Foreign Key Constraints...

✅ classrooms.center_id -> centers.id - OK
❌ student_pause_history.center_id -> centers.id - CONSTRAINT MISSING
⚠️  observation_logs.center_id (varchar(36)) -> centers.id (int) - TYPE MISMATCH

🔧 Attempting to repair missing constraints...
✅ Repaired: student_pause_history.center_id -> centers.id

====================================================
SUMMARY
====================================================
✅ Working constraints: 15
🔧 Repaired constraints: 3
⚠️  Type mismatches: 2
❌ Failed repairs: 0
====================================================
```

### Step 3: Apply Manual Repairs (if needed)

If type mismatches are detected:

```bash
# Review the generated script
cat database_repair_script.sql

# Apply during maintenance window (requires app downtime)
mysql -h [host] -u [user] -p [database] < database_repair_script.sql
```

**IMPORTANT:** Manual repairs require:
- Application downtime (5-15 minutes)
- Backup before running
- Testing in staging first

## What Gets Validated

The integrity checker validates these critical relationships:

### Core Relationships
- `classrooms.center_id` → `centers.id`
- `children.center_id` → `centers.id`
- `users.center_id` → `centers.id`

### Student Pause Functionality
- `student_pause_history.student_id` → `children.id`
- `student_pause_history.paused_by` → `users.id`
- `student_pause_history.resumed_by` → `users.id`
- `student_pause_history.center_id` → `centers.id`

### Digital Portfolio & Observations
- `digital_portfolios.center_id` → `centers.id`
- `digital_portfolios.child_id` → `children.id`
- `observation_logs.center_id` → `centers.id`
- `observation_logs.child_id` → `children.id`

### Teacher Modules
- `lesson_plans.center_id` → `centers.id`
- `assignments.center_id` → `centers.id`
- `assignment_submissions.center_id` → `centers.id`

### Messaging
- `messages.center_id` → `centers.id`
- `message_threads.center_id` → `centers.id`

## Why Two Phases?

### Why Not Fix Everything in Migration?

**Problem:** We can't know the existing database state at migration time:
- Some deployments have `centers.id` as `INT` (old schema)
- Others have `centers.id` as `VARCHAR(36)` (new schema)
- Changing column types with data requires careful planning

**Solution:** Migrations are permissive, then we validate and repair

### What Happens Without FK Constraints?

Without proper FK constraints, the application can experience:

1. **Data Integrity Issues:**
   - Orphaned records (e.g., students with non-existent center_id)
   - Cascade delete failures

2. **Performance Problems:**
   - Missing indexes on FK columns slow queries
   - Inefficient JOIN operations

3. **Application Errors:**
   - 404 errors when fetching related data
   - Failed deletions due to orphaned references
   - Inconsistent data in reports

## Monitoring & Maintenance

### Regular Integrity Checks

Run integrity checker monthly:
```bash
npm run check:integrity
```

### Automated Monitoring

Add to your CI/CD pipeline:
```yaml
# .github/workflows/deploy.yml
- name: Check Database Integrity
  run: |
    cd backend
    npm run check:integrity
  continue-on-error: true  # Don't fail deployment, but alert team
```

### Alert on Issues

Set up monitoring to alert when:
- Integrity check fails
- Orphaned records detected
- Query performance degrades on FK-related JOINs

## Troubleshooting

### Migration Fails Completely

```bash
# Check MySQL version
mysql --version

# Check database exists
mysql -h [host] -u [user] -p -e "SHOW DATABASES LIKE '${DB_NAME}'"

# Check user permissions
mysql -h [host] -u [user] -p -e "SHOW GRANTS"
```

### Integrity Check Shows Many Issues

1. **Don't panic** - Application still works, just without full integrity protection
2. **Schedule maintenance window** - 30 minutes should be enough
3. **Test repair script in staging first**
4. **Backup before applying**

### Type Mismatch for centers.id

This is the most common issue. The repair script will:
1. Drop all FK constraints referencing `centers.id`
2. Convert column types to match
3. Recreate all FK constraints

**Downtime:** 5-15 minutes depending on data volume

## Testing the Solution

### In Staging

1. Deploy with current migration approach
2. Run integrity checker
3. Apply repairs
4. Test all major features:
   - Student pause/resume
   - Digital portfolio uploads
   - Teacher assignments
   - Parent messaging
   - Center switching (if multi-center)

### Validation Tests

```bash
# Test student pause functionality
curl -X POST http://localhost:3000/api/students/pause \
  -H "Content-Type: application/json" \
  -d '{"studentId": "...", "pauseDate": "2025-01-01"}'

# Test cascade delete (in staging only!)
# Delete a center and verify related records are handled properly
```

## Files Changed

- `backend/migrations/028_add_student_pause_functionality.sql` - FK constraints separated
- `backend/migrations/025_add_center_id_to_teacher_and_messaging_tables.sql` - Statements split
- `backend/migrations/022_create_classroom_announcements.sql` - Added DROP TABLE
- `backend/check_db_integrity.js` - New integrity checker tool
- `backend/package.json` - Added `check:integrity` script

## Support

If you encounter issues:
1. Check the migration logs for specific errors
2. Run integrity checker for detailed diagnosis
3. Review generated repair script
4. Contact dev team with full error output

## Success Criteria

✅ Migration completes without fatal errors
✅ Integrity checker shows 0 type mismatches OR
✅ Manual repair script successfully applied
✅ All application features working correctly
✅ No orphaned records in database
