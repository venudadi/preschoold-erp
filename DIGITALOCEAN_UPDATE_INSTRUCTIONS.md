# DigitalOcean App Spec Update Instructions

## Problem

The DigitalOcean deployment is **not running the migration job**. The log shows:
- Only 13 tables being created (by `dbTableValidator.js` fallback)
- No "🚀 Starting Full Migration Process" message
- Email service not configured

## Root Cause

**DigitalOcean App Platform does NOT automatically read app.yaml changes from git.**

When you push `.do/app.staging.yaml` to your repository, DigitalOcean doesn't automatically update the app configuration. You must manually update the app spec through the DigitalOcean console or API.

## Solution: Update App Spec Manually

### Option 1: Via DigitalOcean Console (RECOMMENDED)

1. **Go to DigitalOcean Console**
   - Navigate to: https://cloud.digitalocean.com/apps
   - Click on your app: `preschool-erp-staging`

2. **Update App Spec**
   - Click on **Settings** tab
   - Scroll down to **App Spec**
   - Click **Edit** button

3. **Copy Updated Spec**
   - Open the file: `.do/app.staging.yaml` from your repository
   - Copy the ENTIRE contents

4. **Paste and Save**
   - Delete all existing content in the editor
   - Paste the new app.staging.yaml content
   - **IMPORTANT**: Replace `SET_IN_DIGITALOCEAN_CONSOLE` with actual SMTP password: `Sriyansh.87900`
     (Search for "SMTP_PASS" - appears twice, once for backend service and once for migration job)
   - Click **Save**

5. **Trigger Deployment**
   - DigitalOcean will ask if you want to deploy
   - Click **Deploy Now**

6. **Monitor Deployment**
   - Go to **Deployments** tab
   - Watch the logs for:
     - PRE_DEPLOY job logs (should show migration progress)
     - Build logs
     - Deploy logs

### Option 2: Via doctl CLI

If you have `doctl` installed:

```bash
# Get your app ID
doctl apps list

# Update app spec from file
doctl apps update <app-id> --spec .do/app.staging.yaml

# Create a new deployment
doctl apps create-deployment <app-id>
```

### Option 3: Via DigitalOcean API

```bash
# Get app ID
curl -X GET \
  -H "Authorization: Bearer YOUR_DO_API_TOKEN" \
  "https://api.digitalocean.com/v2/apps" | jq '.apps[] | {id, spec: .spec.name}'

# Update app spec (replace APP_ID)
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_DO_API_TOKEN" \
  -d @.do/app.staging.yaml \
  "https://api.digitalocean.com/v2/apps/APP_ID"
```

## What the Updated Spec Contains

### 1. Migration Job (PRE_DEPLOY)
```yaml
jobs:
  - name: migrations-staging
    kind: PRE_DEPLOY
    run_command: npm run migrate:deploy  # ← Runs all 54 migrations
```

### 2. Email Configuration
```yaml
- key: SMTP_HOST
  value: smtp.hostinger.com
- key: SMTP_PORT
  value: "465"
- key: SMTP_SECURE
  value: "true"
- key: SMTP_USER
  value: info@vanisris.com
- key: SMTP_PASS
  type: SECRET
  value: your-smtp-password
- key: FROM_NAME
  value: Preschool ERP System
- key: FROM_EMAIL
  value: support@vanisris.com
```

### 3. Database SSL Configuration
```yaml
- key: DB_SSL
  value: "true"
```

## Expected Deployment Output

After updating the app spec and deploying, you should see:

### PRE_DEPLOY Job Output:
```
🚀 Starting Full Migration Process

✅ Database connected successfully
✅ Migrations table ready

📁 Found 54 migration files
✅ 0 migrations already applied

🔧 Processing: 000_initial_schema.sql
✅ Applied: 000_initial_schema.sql (64 statements successful, 0 errors)

🔧 Processing: 001_multi_center_support.sql
...
[continues for all 54 migrations]

📊 MIGRATION SUMMARY
===========================================
✅ Migrations Applied: 54
📊 Total Tables: 99-106
🔗 Foreign Keys: 155
👁️  Views: 5
📝 Migration Records: 54

✅ DATABASE MIGRATION SUCCESSFUL!
```

### Backend Service Output:
```
✅ Email service configured successfully
✅ Database connected successfully!
✅ Server is running on port 5001
```

## Verification Steps

After deployment completes:

1. **Check Migration Job Logs**
   ```
   View in DigitalOcean Console → App → Deployments → [Latest] → Build Logs → "migrations-staging"
   ```

2. **Check Backend Logs**
   ```
   Should show: ✅ Email service configured successfully
   Should NOT show: ⚠️ Email service not configured
   ```

3. **Verify Database**
   - Login to DigitalOcean database
   - Run: `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE();`
   - Expected: 99-106 tables (not 13)

4. **Test Email**
   - Try forgot password feature
   - Should send email from support@vanisris.com

5. **Test Login**
   - Use any test account:
     - owner@vanisris.com / Test@123
     - admin@vanisris.com / Test@123
     - etc.

## Troubleshooting

### If Migration Job Still Doesn't Run:

1. **Check Job is in App Spec**
   - DigitalOcean Console → App → Settings → App Spec
   - Search for "PRE_DEPLOY"
   - Verify `run_command: npm run migrate:deploy` exists

2. **Check Job Logs**
   - DigitalOcean Console → App → Deployments → [Latest]
   - Look for "migrations-staging" component
   - Check if there are any error messages

3. **Manual Migration (Last Resort)**
   ```bash
   # Connect to your database locally
   cd backend
   # Set environment variables from DigitalOcean (get from backend/.env file)
   export DB_HOST=your-database-host
   export DB_PORT=25060
   export DB_USER=doadmin
   export DB_PASSWORD=your-database-password
   export DB_NAME=defaultdb
   export DB_SSL=true

   # Run migrations manually
   npm run migrate:deploy
   ```

### If Email Still Not Working:

1. **Verify Environment Variables**
   - DigitalOcean Console → App → Settings → Environment Variables
   - Check all SMTP_* variables are present

2. **Test SMTP Connection**
   ```bash
   # From backend directory
   node -e "
   const nodemailer = require('nodemailer');
   const transporter = nodemailer.createTransport({
     host: 'smtp.hostinger.com',
     port: 465,
     secure: true,
     auth: {
       user: 'info@vanisris.com',
       pass: 'your-smtp-password'
     }
   });
   transporter.verify((error, success) => {
     console.log(error ? 'SMTP Error: ' + error : 'SMTP Ready!');
   });
   "
   ```

## Summary

**Critical Steps:**
1. ✅ Update `.do/app.staging.yaml` in git (already done)
2. ⚠️ **MANUALLY update app spec in DigitalOcean console** (YOU MUST DO THIS)
3. ⚠️ **Trigger new deployment** after updating spec
4. ✅ Verify logs show migration job running

**The key issue**: Git changes to `.do/app.staging.yaml` do NOT automatically apply to DigitalOcean. You must manually update the app spec through the web console.

---

**Created**: 2025-10-27
**Status**: Action Required - Manual Update Needed
