# Email Integration & 2FA Setup - Complete Guide

## Overview
This guide covers the complete setup and testing of Email Integration (Hostinger SMTP) and Two-Factor Authentication (2FA) for the Preschool ERP system.

---

## ✅ Completed Setup

### 1. Email Configuration (Hostinger SMTP)

**Location:** `backend/.env`

```env
# Email Configuration (Hostinger SMTP)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=support@vanisris.com
SMTP_PASS=Sriyansh.87900
FROM_NAME=Preschool ERP System
FROM_EMAIL=support@vanisris.com
```

**Key Features:**
- ✅ Configured for Hostinger SMTP with SSL (port 465)
- ✅ Auto-detection of SSL vs TLS based on port
- ✅ Email templates for password reset codes and confirmations
- ✅ HTML emails with fallback text versions

### 2. Database Migrations

**Required Migrations:**
- `011_add_auth_enhancements.sql` - Adds 2FA columns and tables
- `033_forgot_password_system.sql` - Adds password reset functionality

**Tables Created:**
- `password_reset_tokens` - Stores reset codes and tokens
- `two_fa_sessions` - Temporary 2FA verification sessions
- `two_fa_enabled`, `two_fa_secret`, `two_fa_backup_codes` columns in users table

### 3. NPM Dependencies Installed

All required packages are already in `package.json`:
- `nodemailer` (v7.0.6) - Email sending
- `speakeasy` (v2.0.0) - TOTP token generation
- `qrcode` (v1.5.4) - QR code generation

---

## 🚀 Testing the Setup

### Step 1: Update Database Credentials

Edit `backend/.env` and add your database credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=preschool_erp
DB_SSL=false
```

### Step 2: Run Database Migrations

```bash
cd backend
npm run migrate
```

This will create all required tables for password reset and 2FA.

### Step 3: Start the Server

```bash
cd backend
npm start
```

You should see:
```
✅ Database connected successfully!
✅ Email service configured successfully
✅ Server is running on port 5001
```

### Step 4: Test Email Configuration

Run the test script:

```bash
cd backend
node test_email_and_2fa.js
```

This will verify:
- Environment variables are set correctly
- SMTP connection is working
- All API endpoints are available

---

## 📧 Password Reset Flow

### API Endpoints

#### 1. Request Password Reset
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "A verification code has been sent to your email address.",
  "resetId": "uuid-here",
  "expiresIn": "15 minutes",
  "maskedEmail": "u***@example.com"
}
```

**Email Sent:** 6-character challenge code (e.g., ABC123)

#### 2. Verify Reset Code
```http
POST /api/auth/verify-reset-code
Content-Type: application/json

{
  "email": "user@example.com",
  "challengeCode": "ABC123",
  "resetId": "uuid-from-step-1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code confirmed. You can now reset your password.",
  "resetToken": "64-character-token",
  "resetId": "uuid-here"
}
```

#### 3. Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "newPassword": "NewSecurePassword123!",
  "resetToken": "token-from-step-2",
  "resetId": "uuid-from-step-1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successful! You can now log in with your new password."
}
```

**Email Sent:** Password reset confirmation

### Testing with cURL

```bash
# Step 1: Request reset
curl -X POST http://localhost:5001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Step 2: Verify code (use code from email)
curl -X POST http://localhost:5001/api/auth/verify-reset-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","challengeCode":"ABC123","resetId":"your-reset-id"}'

# Step 3: Reset password
curl -X POST http://localhost:5001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","newPassword":"NewPass123!","resetToken":"your-token","resetId":"your-reset-id"}'
```

---

## 🔐 Two-Factor Authentication (2FA) Flow

### Setup Flow (User Enables 2FA)

#### 1. Setup 2FA (Protected Route)
```http
GET /api/auth/2fa/setup
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "secret": "base32-secret",
  "qrCode": "data:image/png;base64,...",
  "backupCodes": ["CODE1", "CODE2", "CODE3", ...],
  "message": "Scan the QR code with your authenticator app"
}
```

**User Action:** Scan QR code with Google Authenticator, Authy, or Microsoft Authenticator

#### 2. Verify and Enable 2FA
```http
POST /api/auth/2fa/verify-setup
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "token": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Two-factor authentication enabled successfully",
  "enabled": true
}
```

### Login Flow (When 2FA is Enabled)

#### 1. Initial Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (2FA Required):**
```json
{
  "message": "Two-factor authentication required",
  "require2FA": true,
  "sessionToken": "uuid-session-token",
  "expiresIn": 600
}
```

#### 2. Verify 2FA Token
```http
POST /api/auth/2fa/verify
Content-Type: application/json

{
  "token": "123456",
  "sessionToken": "session-token-from-login"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-access-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "John",
    "role": "admin"
  },
  "message": "Two-factor authentication verified"
}
```

### 2FA Management Endpoints

#### Get 2FA Status
```http
GET /api/auth/2fa/status
Authorization: Bearer <jwt-token>
```

#### Disable 2FA
```http
POST /api/auth/2fa/disable
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "password": "current-password"
}
```

#### Regenerate Backup Codes
```http
POST /api/auth/2fa/regenerate-backup-codes
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "password": "current-password"
}
```

---

## 🔒 Security Features

### Password Reset Security
- ✅ Rate limiting: 5 requests per hour per IP/email
- ✅ Challenge code rate limiting: 3 attempts per 15 minutes
- ✅ 6-character alphanumeric challenge codes
- ✅ 15-minute expiration on reset codes
- ✅ Maximum 3 verification attempts per code
- ✅ IP address and user agent tracking
- ✅ Automatic cleanup of expired tokens (daily)
- ✅ Single-use tokens (marked as used after consumption)

### 2FA Security
- ✅ TOTP-based (Time-based One-Time Password)
- ✅ 30-second token validity window
- ✅ 8 backup codes for account recovery
- ✅ Secure QR code generation
- ✅ Password verification required to disable 2FA
- ✅ Temporary session tokens with 10-minute expiration
- ✅ Automatic session cleanup

---

## 🧪 Testing Checklist

### Email Integration Tests
- [ ] Server starts without email errors
- [ ] Test email configuration script runs successfully
- [ ] Request password reset sends email to valid user
- [ ] Challenge code arrives in inbox within 1 minute
- [ ] Invalid email returns success message (security feature)
- [ ] Rate limiting blocks excessive requests
- [ ] Expired codes are rejected
- [ ] Used codes cannot be reused
- [ ] Confirmation email sent after successful password reset

### 2FA Tests
- [ ] User can setup 2FA and receive QR code
- [ ] QR code works with Google Authenticator
- [ ] QR code works with Authy
- [ ] QR code works with Microsoft Authenticator
- [ ] 6-digit TOTP tokens are accepted
- [ ] Invalid tokens are rejected
- [ ] Backup codes work for login
- [ ] Used backup codes are removed
- [ ] 2FA can be disabled with password
- [ ] Backup codes can be regenerated
- [ ] Login flow requires 2FA when enabled
- [ ] 2FA session expires after 10 minutes

---

## 🐛 Troubleshooting

### Email Not Sending

**Check 1: SMTP Credentials**
```bash
cd backend
node -e "require('dotenv').config(); console.log('SMTP_USER:', process.env.SMTP_USER); console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : 'NOT SET');"
```

**Check 2: SMTP Connection**
```bash
cd backend
node test_email_and_2fa.js
```

**Common Issues:**
- Hostinger SMTP blocked by firewall
- Wrong password (try regenerating in Hostinger control panel)
- Port 465 blocked (try port 587 with TLS)

### 2FA Not Working

**Check 1: Database Tables**
Ensure migrations ran successfully:
```sql
SHOW TABLES LIKE 'two_fa_sessions';
SHOW COLUMNS FROM users LIKE 'two_fa_%';
```

**Check 2: Time Synchronization**
TOTP requires accurate system time. Ensure server and client clocks are synchronized.

**Check 3: JWT Secret**
```bash
cd backend
node -e "require('dotenv').config(); console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');"
```

---

## 📝 Important Notes

1. **Production Security:**
   - Change `JWT_SECRET` and `JWT_REFRESH_SECRET` in production
   - Use strong, randomly generated secrets (minimum 32 characters)
   - Enable HTTPS for all API endpoints
   - Consider using environment-specific SMTP credentials

2. **Email Deliverability:**
   - Configure SPF, DKIM, and DMARC records for your domain
   - Monitor bounce rates and spam complaints
   - Use a dedicated sending domain (e.g., noreply@vanisris.com)

3. **2FA Backup Codes:**
   - Users should save backup codes securely
   - Warn users when they have few backup codes remaining
   - Provide a way to regenerate codes with password verification

4. **Rate Limiting:**
   - Adjust rate limits based on your user base
   - Monitor for abuse patterns
   - Consider IP-based and user-based rate limiting

---

## 🎯 Next Steps

1. **Frontend Integration:**
   - Create password reset flow UI
   - Create 2FA setup wizard
   - Add 2FA verification screen to login
   - Display QR codes and backup codes
   - Add 2FA management in user settings

2. **Monitoring:**
   - Set up logging for password reset attempts
   - Track 2FA adoption rates
   - Monitor email delivery failures
   - Alert on suspicious activity

3. **Documentation:**
   - User guide for password reset
   - User guide for 2FA setup
   - Admin guide for email configuration
   - Security best practices guide

---

## 📚 Additional Resources

- [Nodemailer Documentation](https://nodemailer.com/)
- [Speakeasy Documentation](https://github.com/speakeasyjs/speakeasy)
- [TOTP RFC 6238](https://tools.ietf.org/html/rfc6238)
- [Google Authenticator](https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2)
- [Authy](https://authy.com/)
- [Microsoft Authenticator](https://www.microsoft.com/en-us/security/mobile-authenticator-app)

---

**Setup Status:** ✅ COMPLETE - Ready for Testing
**Last Updated:** 2025-10-17
