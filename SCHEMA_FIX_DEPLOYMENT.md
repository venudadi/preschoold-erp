# Schema Fix Deployment Guide

## 🚨 Critical Issue

Your production database is missing several columns that the application code expects. This causes these errors:

1. **Invoice Error**: `Unknown column 'c.student_id' in 'field list'`
2. **Enquiry Error**: `Unknown column 'source' in 'field list'`

These must be fixed immediately to restore full functionality.

---

## 📋 Missing Columns Summary

### children table
- `student_id` - Auto-generated student ID (e.g., NKD2511001)
- `status` - Student status (active, paused, left)
- `pause_start_date`, `pause_end_date`, `pause_reason`, `pause_notes`, `paused_by`
- `service_hours`, `program_start_time`, `program_end_time`

### enquiries table
- `source` - Enquiry source (Walk-in, Phone, Email, etc.)
- `enquiry_date` - Date of enquiry
- `child_dob` - Child date of birth
- `mobile_number` - Mobile contact number
- `company`, `has_tie_up` - Company tie-up information
- `parent_location` - Parent location/address
- `major_program`, `specific_program` - Program details
- `service_hours` - Required service hours
- `reason_for_closure` - Closure reason
- `follow_up_flag`, `follow_up_date`, `assigned_to`, `remarks`, `visited` - Follow-up tracking

---

## 🚀 Quick Fix (Recommended)

Run this command on your DigitalOcean backend container:

```bash
cd backend
node scripts/apply_schema_fixes.js
```

This will:
- ✅ Add all missing columns with appropriate defaults
- ✅ Migrate existing data (e.g., admission_number → student_id)
- ✅ Create necessary indexes for performance
- ✅ Verify all changes completed successfully
- ✅ Test the queries that were failing

**Output you should see:**
```
🔧 Applying schema fixes to match application code...

✅ Add student_id to children table
✅ Migrate admission_number to student_id
✅ Add index on student_id
✅ Add source column to enquiries
✅ Add enquiry_date column to enquiries
... (30+ more fixes)

📊 Summary:
   ✅ Applied: 33
   ⏭️  Skipped: 0
   ❌ Errors: 0

🔍 Verifying schema changes...

Children table - Key columns:
   ✓ student_id (varchar)
   ✓ status (enum)
   ✓ pause_start_date (date)
   ✓ service_hours (decimal)
   ✓ program_start_time (time)

Enquiries table - Key columns:
   ✓ source (varchar)
   ✓ enquiry_date (date)
   ✓ mobile_number (varchar)
   ✓ company (varchar)
   ✓ follow_up_flag (tinyint)
   ✓ remarks (text)

🧪 Testing invoice query...
   ✅ Invoice query works!

🧪 Testing enquiry columns...
   ✅ Enquiry query works!

✅ Schema fixes complete!
```

---

## 🔒 Forced Migration (Failsafe Method)

**Use this if the normal migration system skips migrations 045 and 046.**

This script will force-apply migrations 045 and 046 even if the migration tracking system thinks they're already applied. It's completely safe to run multiple times.

### On DigitalOcean Console:

```bash
cd /app/backend
node scripts/force_migrations_045_046.js
```

Or using the shell script:

```bash
cd /app/backend
chmod +x force_migrations.sh
./force_migrations.sh
```

### What This Does:

1. ✅ **Bypasses migration tracking** - Runs migrations directly regardless of tracking status
2. ✅ **Safe to repeat** - Handles "column already exists" errors gracefully
3. ✅ **Detailed output** - Shows exactly what was applied
4. ✅ **Updates tracking** - Records migrations in the tracking table after execution
5. ✅ **Verifies results** - Checks that all columns exist and ENUM values are correct

### Expected Output:

```
======================================================================
🚀 FORCED MIGRATION SCRIPT - Migrations 045 & 046
======================================================================

This script will force-apply migrations 045 and 046
regardless of the migration tracking system.

It is SAFE to run multiple times - uses IF NOT EXISTS patterns.

✅ Database connected successfully

📋 Current Migration Status:
   045_fix_schema_mismatches.sql: ❌ Not recorded
   046_fix_enquiries_status_enum.sql: ❌ Not recorded

======================================================================
🔧 FORCING MIGRATION: 045_fix_schema_mismatches.sql
   Adds missing columns to children and enquiries tables
======================================================================

  ✅ Statement 1: ALTER TABLE children ADD COLUMN student_id VARCHAR(50)...
  ✅ Statement 2: UPDATE children SET student_id = admission_number...
  ✅ Statement 3: CREATE INDEX idx_student_id ON children(student_id)...
  ... (30+ more statements)

✅ Migration record updated in tracking table

======================================================================
🔧 FORCING MIGRATION: 046_fix_enquiries_status_enum.sql
   Fixes enquiries.status ENUM to include Open and Closed
======================================================================

  ✅ Statement 1: ALTER TABLE enquiries MODIFY COLUMN status ENUM(...)...
  ✅ Statement 2: UPDATE enquiries SET status = 'Open' WHERE status = 'New'

✅ Migration record updated in tracking table

======================================================================
🔍 FINAL VERIFICATION
======================================================================

✅ Children table columns:
   • student_id
   • status
   • pause_start_date
   • service_hours

✅ Enquiries table columns:
   • source
   • enquiry_date
   • mobile_number
   • company
   • follow_up_flag

✅ Enquiries status ENUM values:
   enum('Open','New','Contacted','Visit Scheduled','Enrolled','Declined','Closed')
   ✅ "Open" status is available

======================================================================
📊 OVERALL SUMMARY
======================================================================
✅ Both migrations applied successfully!
✅ Database schema is now up to date.

💡 Next Steps:
   1. Test enquiry submission with "Open" status
   2. Test invoice viewing (uses student_id column)
   3. Check application logs for any remaining issues
```

### When to Use This:

- ✅ After auto-deploy if migrations 045/046 were skipped
- ✅ If you see "Unknown column" errors after deployment
- ✅ If migration logs show "already applied" but columns are missing
- ✅ As a safety check to ensure schema is up to date

### Why This Works:

The normal migration system tracks applied migrations in the `migrations` table by filename. If the system incorrectly thinks a migration was already applied, it will skip it. This forced migration script:

1. Reads the migration SQL files directly
2. Executes each statement individually
3. Handles "already exists" errors gracefully
4. Ensures the migration is recorded in tracking table
5. Verifies the final schema state

**Bottom line**: This is the nuclear option that guarantees migrations 045 and 046 are applied, no matter what the tracking system says.

---

## 📝 Alternative: Manual SQL Execution

If you prefer to run SQL directly:

```bash
mysql -h YOUR_DB_HOST -u YOUR_DB_USER -p YOUR_DB_NAME < backend/scripts/fix_schema_mismatches.sql
```

Or from MySQL client:

```sql
USE your_database_name;
SOURCE backend/scripts/fix_schema_mismatches.sql;
```

---

## 🔍 Verification

After running the fixes, verify with:

```sql
-- Check children table columns
DESCRIBE children;

-- Check enquiries table columns
DESCRIBE enquiries;

-- Test the queries that were failing
SELECT c.student_id, c.first_name, c.last_name
FROM children c
LIMIT 5;

SELECT source, enquiry_date, mobile_number
FROM enquiries
LIMIT 5;
```

---

## 🎯 What Gets Fixed

### 1. Invoice Module (invoiceRoutes.js)
**Before**: ❌ Error when trying to view invoices
```
Error: Unknown column 'c.student_id' in 'field list'
```

**After**: ✅ Invoices display correctly with student IDs

### 2. Enquiry Module (enquiryRoutes.js)
**Before**: ❌ Error when trying to add enquiries
```
Error: Unknown column 'source' in 'field list'
```

**After**: ✅ Enquiries can be submitted with all fields

### 3. Child Profile System (adminRoutes.js)
**Before**: ⚠️ Some fields missing in profile view
**After**: ✅ Complete profile with:
- Student ID displayed
- Status tracking (active/paused/left)
- Pause information
- Service hours and program timing

---

## ⚠️ Important Notes

### Safe to Run Multiple Times
All ALTER TABLE statements use `IF NOT EXISTS` or similar logic, so running the script multiple times won't cause errors or duplicate data.

### Data Migration
The script automatically migrates existing data:
- `admission_number` → `student_id` (preserves existing IDs)
- `phone_number` → `mobile_number` (copies for backwards compatibility)
- `created_at` → `enquiry_date` (for existing enquiries)

### No Data Loss
- Adds columns only (never removes)
- Preserves all existing data
- Uses NULL defaults for historical records

### Performance
- Creates indexes on frequently queried columns
- Total execution time: ~5-10 seconds

---

## 🧪 Testing After Fix

1. **Test Invoice Viewing**:
   - Login as admin
   - Go to Invoice Management
   - Should load without errors

2. **Test Enquiry Submission**:
   - Go to Enquiry Form
   - Fill out all fields
   - Submit
   - Should succeed without schema errors

3. **Test Child Profile**:
   - Go to Children Management
   - Click eye icon on any student
   - Profile modal should show:
     - Student ID
     - Status
     - All parent information
     - Billing details

---

## 🔄 Rollback (If Needed)

If you need to rollback (not recommended), you can remove the columns:

```sql
-- Rollback children table changes
ALTER TABLE children
DROP COLUMN student_id,
DROP COLUMN status,
DROP COLUMN pause_start_date,
DROP COLUMN pause_end_date,
DROP COLUMN pause_reason,
DROP COLUMN pause_notes,
DROP COLUMN paused_by,
DROP COLUMN service_hours,
DROP COLUMN program_start_time,
DROP COLUMN program_end_time;

-- Rollback enquiries table changes
ALTER TABLE enquiries
DROP COLUMN source,
DROP COLUMN enquiry_date,
DROP COLUMN child_dob,
DROP COLUMN mobile_number,
DROP COLUMN company,
DROP COLUMN has_tie_up,
DROP COLUMN parent_location,
DROP COLUMN major_program,
DROP COLUMN specific_program,
DROP COLUMN service_hours,
DROP COLUMN reason_for_closure,
DROP COLUMN follow_up_flag,
DROP COLUMN assigned_to,
DROP COLUMN remarks,
DROP COLUMN follow_up_date,
DROP COLUMN visited;
```

**⚠️ Warning**: This will lose any data entered in these fields!

---

## 📞 Support

If the script fails:

1. **Check database connection**:
   ```bash
   node -e "import('./backend/db.js').then(m => console.log('Connected!'))"
   ```

2. **Check database credentials** in `.env`:
   ```
   DB_HOST=your-db-host
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   DB_NAME=your-db-name
   ```

3. **Check for permission errors**:
   Ensure database user has ALTER TABLE permissions

4. **Check error logs**:
   The script will show specific error messages for any failed operations

---

## ✅ Completion Checklist

After running the fix, verify:

- [ ] Script completed without fatal errors
- [ ] Verification queries show all new columns exist
- [ ] Invoice page loads without errors
- [ ] Enquiry form submits successfully
- [ ] Child profile modal displays student ID
- [ ] No errors in DigitalOcean runtime logs

---

## 🎉 Benefits After Fix

1. **Full Feature Availability**
   - ✅ All CRUD operations work
   - ✅ No schema mismatch errors
   - ✅ Complete data capture

2. **Better Data Quality**
   - ✅ Standardized student IDs
   - ✅ Comprehensive enquiry tracking
   - ✅ Detailed student status management

3. **Enhanced Reporting**
   - ✅ Filter by enquiry source
   - ✅ Track follow-ups
   - ✅ Monitor student status changes

---

**Status**: 🚨 CRITICAL - Must be applied before using enquiry and invoice modules

**Time Required**: ~10 minutes

**Risk Level**: 🟢 LOW - Safe, reversible, no data loss
