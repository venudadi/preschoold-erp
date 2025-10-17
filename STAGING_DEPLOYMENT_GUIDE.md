# Staging Deployment Guide - Email & 2FA Features

## 🎯 Deployment Overview

This guide covers deploying the Email Integration and Two-Factor Authentication features to the DigitalOcean staging environment.

---

## ✅ Pre-Deployment Checklist

### Database Verification
- ✅ Connection to DigitalOcean database successful
- ✅ Database: `defaultdb`
- ✅ Host: `preschool-db-staging-do-user-27294876-0.f.db.ondigitalocean.com`
- ✅ Port: `25060`
- ✅ SSL: REQUIRED
- ✅ Tables verified: `password_reset_tokens`, `two_fa_sessions` exist
- ✅ User table columns verified: `two_fa_enabled`, `two_fa_secret`, `two_fa_backup_codes`, `last_password_reset`

### Code Status
- ✅ Backend: Email service configured and tested
- ✅ Backend: Password reset API complete
- ✅ Backend: 2FA API complete
- ✅ Frontend: Password reset pages complete
- ✅ Frontend: 2FA setup page complete
- ✅ Frontend: 2FA login page complete
- ✅ Frontend: Login flow updated for 2FA
- ✅ Routes: All 2FA routes added to App.jsx

---

## 📁 Files to Commit to Staging

### Backend Files (New/Modified)
```
backend/
├── .env.staging                          ✅ NEW - Staging configuration
├── .env.example                          ✅ NEW - Template
├── .env.production                       ✅ NEW - Production config
├── services/
│   └── emailService.js                   ✅ MODIFIED - SSL auto-detection
├── test_email_and_2fa.js                ✅ NEW - Test script
└── test_smtp_detailed.js                ✅ NEW - Detailed test script
```

### Frontend Files (New/Modified)
```
frontend/src/
├── pages/
│   ├── Setup2FAPage.jsx                 ✅ NEW - 2FA setup wizard
│   ├── Verify2FAPage.jsx                ✅ NEW - 2FA login page
│   └── LoginPage.jsx                    ✅ MODIFIED - 2FA integration
├── services/
│   └── twoFactorApi.js                  ✅ NEW - 2FA API service
└── App.jsx                              ✅ MODIFIED - 2FA routes
```

### Documentation Files (New)
```
├── EMAIL_2FA_SETUP_COMPLETE_GUIDE.md    ✅ NEW
├── EMAIL_2FA_READY_FOR_PRODUCTION.md    ✅ NEW
├── IMPLEMENTATION_COMPLETE_STATUS.md     ✅ NEW
├── USER_GUIDE_PASSWORD_RESET_AND_2FA.md ✅ NEW
├── FINAL_IMPLEMENTATION_COMPLETE.md      ✅ NEW
└── STAGING_DEPLOYMENT_GUIDE.md          ✅ NEW (this file)
```

---

## 🚀 Deployment Steps

### Step 1: Prepare Staging Branch

```bash
# Ensure you're on the staging branch
git checkout staging

# Check current branch
git branch

# Pull latest changes (if any)
git pull origin staging
```

### Step 2: Stage New and Modified Files

```bash
# Backend files
git add backend/.env.staging
git add backend/.env.example
git add backend/.env.production
git add backend/services/emailService.js
git add backend/test_email_and_2fa.js
git add backend/test_smtp_detailed.js

# Frontend files
git add frontend/src/pages/Setup2FAPage.jsx
git add frontend/src/pages/Verify2FAPage.jsx
git add frontend/src/pages/LoginPage.jsx
git add frontend/src/services/twoFactorApi.js
git add frontend/src/App.jsx

# Documentation
git add EMAIL_2FA_SETUP_COMPLETE_GUIDE.md
git add EMAIL_2FA_READY_FOR_PRODUCTION.md
git add IMPLEMENTATION_COMPLETE_STATUS.md
git add USER_GUIDE_PASSWORD_RESET_AND_2FA.md
git add FINAL_IMPLEMENTATION_COMPLETE.md
git add STAGING_DEPLOYMENT_GUIDE.md
```

### Step 3: Verify Staged Changes

```bash
# Check what's staged
git status

# Review changes
git diff --staged
```

### Step 4: Commit Changes

```bash
git commit -m "feat: Add email integration and two-factor authentication

- Add email service with Hostinger SMTP (SSL/TLS auto-detection)
- Implement password reset flow (3-step: request → verify → reset)
- Add 6-character challenge codes with 15-minute expiration
- Implement rate limiting (5 requests/hour, 3 attempts per code)
- Add TOTP-based 2FA with QR code generation
- Create 2FA setup wizard with backup codes
- Add 2FA login verification page
- Update login flow to handle 2FA requirement
- Add 2FA management endpoints (enable/disable/regenerate)
- Generate secure production JWT secrets
- Add comprehensive user and technical documentation
- Configure staging environment with DigitalOcean database

Backend Features:
- Email templates for password reset
- Challenge code generation and validation
- TOTP token generation and verification
- 8 backup codes per user
- Session management for 2FA
- Audit logging and IP tracking

Frontend Features:
- Password reset UI (3 pages)
- 2FA setup wizard with QR code
- 2FA login verification page
- Backup code support
- Real-time validation
- User-friendly error messages

Security:
- SSL/TLS email encryption
- bcrypt password hashing (12 rounds)
- Rate limiting on all sensitive endpoints
- Single-use tokens
- 256-bit JWT secrets
- CSRF protection

Database:
- DigitalOcean managed database configured
- SSL required for connections
- All migrations verified in staging

🎉 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Step 5: Push to Staging

```bash
# Push to staging branch
git push origin staging

# Verify push was successful
git log --oneline -1
```

---

## 🔧 Post-Deployment Configuration

### On Staging Server

#### 1. Update Environment Variables

```bash
# SSH into staging server
ssh your-staging-server

# Navigate to backend directory
cd /path/to/preschool-erp/backend

# Copy staging environment file
cp .env.staging .env

# Verify configuration
cat .env | grep -E "DB_HOST|SMTP_HOST|NODE_ENV"
```

#### 2. Install Dependencies (if needed)

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

#### 3. Build Frontend

```bash
cd frontend
npm run build
```

#### 4. Test Email Service

```bash
cd backend
node test_email_and_2fa.js
```

Expected output:
```
✅ Email service configured successfully
✅ SMTP connection is working
```

#### 5. Restart Backend Service

```bash
# Using PM2 (recommended)
pm2 restart preschool-erp-backend

# Or using systemd
sudo systemctl restart preschool-erp

# Or manual restart
npm start
```

#### 6. Deploy Frontend

```bash
# Copy built files to web server
cp -r frontend/dist/* /var/www/html/

# Or if using nginx
sudo cp -r frontend/dist/* /usr/share/nginx/html/

# Reload nginx
sudo nginx -s reload
```

---

## 🧪 Post-Deployment Testing

### 1. Test Email Service

```bash
# From your local machine
curl -X POST https://your-staging-domain.com/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### 2. Test Password Reset Flow

**Step 1: Request Reset**
```bash
curl -X POST https://your-staging-domain.com/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com"}'
```

**Step 2: Check email for 6-digit code**

**Step 3: Verify Code**
```bash
curl -X POST https://your-staging-domain.com/api/auth/verify-reset-code \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin@example.com",
    "challengeCode":"ABC123",
    "resetId":"<from-step-1>"
  }'
```

**Step 4: Reset Password**
```bash
curl -X POST https://your-staging-domain.com/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin@example.com",
    "newPassword":"NewTestPass123!",
    "resetToken":"<from-step-3>",
    "resetId":"<from-step-1>"
  }'
```

### 3. Test 2FA Setup

**Step 1: Login to get token**
```bash
curl -X POST https://your-staging-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

**Step 2: Setup 2FA**
```bash
curl -X GET https://your-staging-domain.com/api/auth/2fa/setup \
  -H "Authorization: Bearer <jwt-token>"
```

**Step 3: Verify in browser**
- Navigate to: `https://your-staging-domain.com/setup-2fa`
- Complete the 2FA setup wizard

### 4. Test 2FA Login

1. Navigate to: `https://your-staging-domain.com/login`
2. Enter credentials for a user with 2FA enabled
3. Verify redirect to 2FA verification page
4. Enter TOTP code or backup code
5. Verify successful login

---

## 🔍 Monitoring & Verification

### Check Application Logs

```bash
# PM2 logs
pm2 logs preschool-erp-backend

# System logs
journalctl -u preschool-erp -f

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Monitor Database Activity

```bash
# Connect to database
mysql -h preschool-db-staging-do-user-27294876-0.f.db.ondigitalocean.com \
      -P 25060 \
      -u doadmin \
      -p \
      --ssl-mode=REQUIRED \
      defaultdb

# Check recent password resets
SELECT COUNT(*) as count, DATE(created_at) as date
FROM password_reset_tokens
WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(created_at);

# Check 2FA adoption
SELECT
  COUNT(*) as total_users,
  SUM(CASE WHEN two_fa_enabled = 1 THEN 1 ELSE 0 END) as users_with_2fa
FROM users;
```

### Check Email Delivery

1. Monitor email service logs in backend
2. Check spam folder for test emails
3. Verify email templates render correctly
4. Test on different email providers (Gmail, Outlook, etc.)

---

## 🐛 Troubleshooting

### Email Not Sending

1. **Check SMTP credentials:**
   ```bash
   cd backend
   node -e "require('dotenv').config(); console.log('SMTP_USER:', process.env.SMTP_USER);"
   ```

2. **Test SMTP connection:**
   ```bash
   node test_smtp_detailed.js
   ```

3. **Check firewall rules:**
   - Ensure port 465 (SSL) is open
   - Verify no IP restrictions in Hostinger

### Database Connection Issues

1. **Test SSL connection:**
   ```bash
   mysql -h preschool-db-staging-do-user-27294876-0.f.db.ondigitalocean.com \
         -P 25060 \
         -u doadmin \
         -p \
         --ssl-mode=REQUIRED \
         defaultdb
   ```

2. **Check SSL certificate:**
   ```bash
   openssl s_client -connect preschool-db-staging-do-user-27294876-0.f.db.ondigitalocean.com:25060
   ```

3. **Verify firewall rules:**
   - Check DigitalOcean firewall settings
   - Ensure your server IP is whitelisted

### 2FA Not Working

1. **Check time synchronization:**
   ```bash
   date
   ntpdate -q pool.ntp.org
   ```

2. **Verify JWT secret is set:**
   ```bash
   cd backend
   node -e "require('dotenv').config(); console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'MISSING');"
   ```

3. **Check 2FA tables exist:**
   ```sql
   SHOW TABLES LIKE 'two_fa%';
   ```

---

## 📊 Success Criteria

- [ ] Backend server starts without errors
- [ ] Email service shows as configured
- [ ] Test email sent successfully
- [ ] Password reset flow works end-to-end
- [ ] 2FA setup generates QR codes
- [ ] 2FA login accepts TOTP codes
- [ ] Backup codes work for login
- [ ] Frontend loads without errors
- [ ] All routes accessible
- [ ] Database queries working
- [ ] SSL connections verified

---

## 🔐 Security Checklist

- [x] SSL/TLS enabled for database
- [x] Strong JWT secrets generated
- [x] SMTP uses SSL (port 465)
- [x] Rate limiting active
- [x] Password hashing (bcrypt 12 rounds)
- [x] Input validation on all endpoints
- [x] CSRF protection enabled
- [x] Session tokens implemented
- [x] Audit logging active
- [ ] HTTPS enabled on staging domain
- [ ] Security headers configured in nginx
- [ ] Content Security Policy set

---

## 📋 Rollback Plan

If issues occur after deployment:

### Option 1: Revert Git Commit

```bash
git checkout staging
git revert HEAD
git push origin staging
```

### Option 2: Disable New Features

**Temporarily disable 2FA:**
```sql
UPDATE users SET two_fa_enabled = FALSE;
```

**Temporarily disable password reset:**
Comment out routes in `backend/index.js`:
```javascript
// app.use('/api/auth', passwordResetRoutes);
```

### Option 3: Restore Previous Environment

```bash
# Restore previous .env
cp .env.backup .env

# Restart services
pm2 restart all
```

---

## 📞 Support Contacts

### Technical Issues
- **Backend:** Check application logs
- **Frontend:** Check browser console
- **Database:** Contact DigitalOcean support
- **Email:** Check Hostinger control panel

### Emergency Contacts
- **System Administrator:** [Your contact]
- **Database Administrator:** [Your contact]
- **DigitalOcean Support:** https://cloud.digitalocean.com/support

---

## 📈 Performance Monitoring

### Metrics to Track

1. **Email Delivery Rate**
   - Track successful/failed email sends
   - Monitor delivery times
   - Check bounce rates

2. **2FA Adoption**
   - Track percentage of users with 2FA enabled
   - Monitor setup completion rate
   - Track backup code usage

3. **Password Resets**
   - Monitor reset request frequency
   - Track completion rate
   - Watch for abuse patterns

4. **API Performance**
   - Response times for auth endpoints
   - Error rates
   - Rate limit triggers

---

## ✅ Deployment Complete Checklist

- [ ] Code committed to staging branch
- [ ] Code pushed to remote repository
- [ ] Environment variables updated on server
- [ ] Dependencies installed
- [ ] Frontend built and deployed
- [ ] Backend service restarted
- [ ] Email service tested
- [ ] Password reset tested
- [ ] 2FA setup tested
- [ ] 2FA login tested
- [ ] Logs monitored for errors
- [ ] Documentation updated
- [ ] Team notified of deployment

---

## 🎯 Next Steps After Successful Deployment

1. **Monitor for 24-48 hours**
   - Watch logs for errors
   - Monitor user feedback
   - Check email delivery

2. **User Communication**
   - Announce new password reset feature
   - Promote 2FA adoption
   - Share user guide

3. **Training**
   - Train support staff on new features
   - Prepare FAQs
   - Create video tutorials

4. **Production Deployment**
   - After successful staging testing
   - Follow similar process
   - Update production domain in .env

---

**Deployment Status:** Ready for Staging ✅
**Last Updated:** 2025-10-17
**Version:** 1.0.0

**For questions or issues, refer to technical documentation or contact the development team.**
