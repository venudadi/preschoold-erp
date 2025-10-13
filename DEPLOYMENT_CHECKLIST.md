# 🚀 Digital Ocean Deployment Checklist

Use this checklist when deploying to Digital Ocean to ensure both successful migration AND full functionality.

## Pre-Deployment

- [ ] Staging branch is up to date with all changes
- [ ] All tests pass locally
- [ ] Environment variables configured in Digital Ocean
- [ ] Database backup created (if updating existing deployment)

## Deployment Steps

### 1. Deploy Application

```bash
# Digital Ocean will automatically:
# - Pull latest code from staging branch
# - Build Docker containers
# - Run migrations
# - Start services
```

⏱️ **Expected time:** 5-10 minutes

### 2. Verify Basic Functionality

- [ ] Application is accessible
- [ ] Login works
- [ ] Can navigate main pages

### 3. Run Integrity Check ⚠️ CRITICAL

```bash
# Connect to your Digital Ocean app console or SSH to droplet
cd backend
npm run check:integrity
```

**Expected outcomes:**

✅ **Best case:** All constraints OK
```
✅ Working constraints: 22
🔧 Repaired constraints: 0  
⚠️  Type mismatches: 0
❌ Failed repairs: 0

🎉 Database integrity is perfect!
```

⚠️ **Common case:** Some repairs needed
```
✅ Working constraints: 18
🔧 Repaired constraints: 3
⚠️  Type mismatches: 1
❌ Failed repairs: 0

⚠️  Database has integrity issues that require manual intervention.
📄 Manual repair script saved to: database_repair_script.sql
```

### 4A. If No Issues Found

- [ ] Proceed to functional testing
- [ ] Mark deployment as successful

### 4B. If Issues Found (Type Mismatches)

**⚠️ This requires a maintenance window**

1. **Download repair script**
   ```bash
   # Copy the generated database_repair_script.sql
   cat database_repair_script.sql
   ```

2. **Review the script**
   - [ ] Understand what changes will be made
   - [ ] Verify it only affects schema, not data
   - [ ] Check for potential breaking changes

3. **Schedule maintenance window**
   - [ ] Announce to users (recommended: 30 min window)
   - [ ] Pick low-traffic time

4. **Apply repair script**
   ```bash
   # Stop the application (to prevent data modifications during repair)
   # Apply via Digital Ocean console or:
   mysql -h [DB_HOST] -u [DB_USER] -p [DB_NAME] < database_repair_script.sql
   
   # Restart application
   ```

5. **Re-run integrity check**
   ```bash
   npm run check:integrity
   ```
   - [ ] Confirm all issues resolved

6. **Announce completion**

## Functional Testing

Test these critical features to ensure FK constraints are working:

### Student Management
- [ ] Create new student
- [ ] Pause student (requires FK to users table)
- [ ] Resume student
- [ ] Delete student (should cascade to pause history)

### Center Operations
- [ ] Switch between centers
- [ ] Add item to center (classroom, student, etc.)
- [ ] Verify center filtering works correctly

### Teacher Modules
- [ ] Create lesson plan (requires FK to center)
- [ ] Create assignment (requires FK to center)
- [ ] Upload to digital portfolio (requires FK to center and child)
- [ ] Add observation log (requires FK to center and child)

### Parent Features
- [ ] View child's portfolio
- [ ] View messages (requires FK to center)
- [ ] View announcements

### Data Integrity
- [ ] Try to create record with invalid center_id (should fail)
- [ ] Delete a center with data (should cascade or prevent based on schema)

## Post-Deployment Monitoring

### Day 1
- [ ] Monitor error logs for FK-related errors
- [ ] Check for orphaned record errors
- [ ] Monitor query performance

### Week 1
- [ ] Re-run integrity check
- [ ] Review any data integrity issues reported by users
- [ ] Check cascade deletes are working correctly

## Rollback Plan

If critical issues are discovered:

1. **Identify the issue**
   - Check logs: `docker-compose logs backend`
   - Check integrity: `npm run check:integrity`

2. **Quick fixes**
   - If just FK constraints: Apply repair script
   - If data corruption: Restore from backup

3. **Full rollback** (last resort)
   ```bash
   # Restore database backup
   mysql -h [DB_HOST] -u [DB_USER] -p [DB_NAME] < backup.sql
   
   # Deploy previous version
   git checkout [previous-commit]
   # Trigger Digital Ocean redeploy
   ```

## Common Issues & Solutions

### Issue: "Cannot add foreign key constraint"

**Cause:** Column types don't match

**Solution:**
1. Run `npm run check:integrity`
2. Apply generated repair script
3. This will fix column types

### Issue: "Orphaned records found"

**Cause:** Missing FK constraints allowed invalid data

**Solution:**
1. Run integrity check
2. Identify orphaned records
3. Either delete orphaned records or fix references
4. Apply FK constraints

### Issue: "Cascade delete not working"

**Cause:** FK constraint missing or incorrect

**Solution:**
1. Check current constraints: `SHOW CREATE TABLE [table_name]`
2. Run integrity checker
3. Apply missing FK constraints

## Success Criteria

✅ Migration completed successfully
✅ Integrity check shows 0 type mismatches OR repair script applied successfully
✅ All functional tests pass
✅ No FK-related errors in logs
✅ Cascade operations work correctly
✅ Application performance is acceptable

## Documentation

- 📖 Full guide: [DATABASE_INTEGRITY_GUIDE.md](DATABASE_INTEGRITY_GUIDE.md)
- 📖 General deployment: [DEPLOYMENT.md](DEPLOYMENT.md)
- 📖 Quick start: [DEPLOYMENT_QUICK_START.md](DEPLOYMENT_QUICK_START.md)

## Support Contacts

If you encounter issues during deployment:

1. Check the documentation above
2. Review generated repair script
3. Check application logs
4. Contact dev team with:
   - Integrity check output
   - Error logs
   - Steps that failed

---

**Remember:** The two-phase approach (migration + integrity check) ensures both successful deployment AND full functionality. Don't skip the integrity check! 🔍
