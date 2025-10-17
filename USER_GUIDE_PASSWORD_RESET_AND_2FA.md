# User Guide: Password Reset & Two-Factor Authentication

## Table of Contents
1. [Password Reset Guide](#password-reset-guide)
2. [Two-Factor Authentication Setup](#two-factor-authentication-setup)
3. [Logging In with 2FA](#logging-in-with-2fa)
4. [Managing Your 2FA Settings](#managing-your-2fa-settings)
5. [Troubleshooting](#troubleshooting)

---

## Password Reset Guide

### When to Use
- Forgot your password
- Need to reset your password for security reasons
- Locked out of your account

### Step 1: Request Password Reset

1. Go to the login page
2. Click **"Forgot your password?"** link below the Sign In button
3. Enter your **email address** registered with the system
4. Click **"Send Verification Code"**

**What happens next:**
- You'll receive an email with a 6-character verification code
- The code is valid for **15 minutes**
- Check your spam/junk folder if you don't see the email

### Step 2: Verify Your Code

1. Check your email inbox for the verification code
2. The code will look like: **ABC123** (6 alphanumeric characters)
3. Enter the code exactly as shown (not case-sensitive)
4. Click **"Verify & Continue"**

**Important:**
- You have only **3 attempts** to enter the correct code
- After 3 failed attempts, you'll need to request a new code

### Step 3: Create New Password

1. Enter your new password (must meet these requirements):
   - At least 8 characters long
   - Contains at least one lowercase letter (a-z)
   - Contains at least one uppercase letter (A-Z)
   - Contains at least one number (0-9)
   - Example: `MyNewPass123!`

2. Re-enter the password to confirm
3. Click **"Reset Password"**

**Success!**
- You'll receive a confirmation email
- You can now log in with your new password

---

## Two-Factor Authentication Setup

### What is 2FA?
Two-Factor Authentication (2FA) adds an extra layer of security to your account. Even if someone knows your password, they won't be able to log in without the second factor (a code from your phone).

### Benefits
- ✅ Protects your account from unauthorized access
- ✅ Keeps student and staff data secure
- ✅ Meets security compliance requirements
- ✅ Easy to set up and use

### Requirements
You'll need:
- A smartphone or tablet
- An authenticator app (choose one):
  - **Google Authenticator** (iOS/Android)
  - **Microsoft Authenticator** (iOS/Android)
  - **Authy** (iOS/Android/Desktop)
  - **1Password** (if you use it)
  - **Bitwarden** (if you use it)

### Setup Steps

#### Step 1: Install Authenticator App

1. Open your phone's app store
2. Search for one of these apps:
   - "Google Authenticator"
   - "Microsoft Authenticator"
   - "Authy"
3. Download and install the app
4. Open the app and complete initial setup

#### Step 2: Start 2FA Setup

1. Log in to Preschool ERP
2. Go to **Settings** (⚙️ icon in sidebar)
3. Find the **Security** section
4. Click **"Enable Two-Factor Authentication"**

#### Step 3: Scan QR Code

1. You'll see a QR code on your screen
2. Open your authenticator app
3. Tap the **"+"** or **"Add"** button in the app
4. Choose **"Scan QR Code"**
5. Point your camera at the QR code on the screen
6. Wait for the app to add the account

**Can't scan the code?**
- Click **"Can't scan? Enter manually"**
- Copy the secret key shown
- In your authenticator app, choose "Enter key manually"
- Paste the key and save

#### Step 4: Verify Setup

1. Your authenticator app will now show a 6-digit code
2. The code changes every 30 seconds
3. Enter the current code in the verification box
4. Click **"Verify & Enable 2FA"**

#### Step 5: Save Backup Codes

**IMPORTANT - DO NOT SKIP THIS STEP!**

1. You'll see 8 backup codes displayed
2. Click **"Download Backup Codes"** to save them
3. Store the file in a secure location:
   - Password manager
   - Encrypted drive
   - Printed and locked in a safe
4. **Never share these codes with anyone**

**What are backup codes for?**
- If you lose your phone
- If you get a new phone
- If your authenticator app is deleted
- Emergency access to your account

Each backup code can only be used **once**.

---

## Logging In with 2FA

### Normal Login Process

1. Go to the login page
2. Enter your **email** and **password**
3. Click **"Sign In"**

**If 2FA is enabled:**
4. You'll be redirected to the 2FA verification page
5. Open your authenticator app
6. Find the "Preschool ERP" entry
7. Enter the 6-digit code shown (you have 30 seconds before it changes)
8. Click **"Verify & Log In"**

**Success!** You're now logged in securely.

### Using a Backup Code

**If you don't have access to your authenticator app:**

1. On the 2FA verification page, click **"Use Backup Code"**
2. Enter one of your 8-character backup codes
3. Click **"Verify & Log In"**

**Remember:**
- Each backup code works only once
- Cross out used codes from your saved list
- Generate new codes in Settings when running low

---

## Managing Your 2FA Settings

### Check 2FA Status

1. Go to **Settings** → **Security**
2. You'll see:
   - Whether 2FA is enabled
   - Number of backup codes remaining
   - Last setup date

### Regenerate Backup Codes

**When to regenerate:**
- You've used several codes
- You lost your backup codes
- You want fresh codes for security

**How to regenerate:**
1. Go to **Settings** → **Security**
2. Click **"Regenerate Backup Codes"**
3. Enter your **password** to confirm
4. Download and save the new codes
5. **Old codes will stop working!**

### Disable 2FA

**Only do this if absolutely necessary!**

1. Go to **Settings** → **Security**
2. Click **"Disable Two-Factor Authentication"**
3. Enter your **password** to confirm
4. Click **"Disable 2FA"**

**Warning:** Your account will be less secure without 2FA.

---

## Troubleshooting

### Password Reset Issues

#### "I didn't receive the verification email"
1. Check your spam/junk folder
2. Wait a few minutes (emails can be delayed)
3. Check that you entered the correct email address
4. Try requesting a new code
5. Contact your system administrator if still not received

#### "My verification code doesn't work"
1. Make sure you're entering all 6 characters
2. Check for typos
3. The code might have expired (15-minute limit)
4. Request a new code if expired

#### "I'm locked out after too many attempts"
1. Wait 15 minutes for the lockout to reset
2. Request a fresh verification code
3. Be careful entering the code

### 2FA Issues

#### "The QR code won't scan"
1. Make sure your camera has permission
2. Try better lighting
3. Hold your phone steady
4. Use the "Enter manually" option instead

#### "My codes don't work"
1. **Check the time on your phone** - It must be accurate!
2. Make sure you're entering the code quickly (30-second window)
3. Try the next code that appears
4. Verify you're looking at the correct account in your app

#### "I lost my phone"
1. Use a backup code to log in
2. Go to Settings immediately
3. Disable 2FA
4. Set up 2FA again with your new device

#### "I lost my backup codes"
1. If you can still log in with your authenticator:
   - Log in normally
   - Go to Settings → Security
   - Regenerate backup codes

2. If you can't log in:
   - Contact your system administrator
   - They can disable 2FA for your account
   - You'll need to set it up again

#### "My authenticator app was deleted"
1. If you have backup codes: Use one to log in
2. If you don't have backup codes:
   - Contact your system administrator
   - They can reset 2FA for your account
3. Set up 2FA again after logging in

### Getting Help

**For immediate assistance:**
- Contact your center administrator
- Email: admin@your-center.com
- Phone: [Your support number]

**For technical support:**
- Email: support@preschool-erp.com
- Include your user email and a description of the issue
- Screenshots are helpful (but don't include passwords or codes!)

---

## Security Best Practices

### Passwords
- ✅ Use unique passwords for each account
- ✅ Use a password manager
- ✅ Change passwords periodically
- ❌ Don't share your password
- ❌ Don't write passwords on sticky notes
- ❌ Don't use simple passwords like "Password123"

### Two-Factor Authentication
- ✅ Enable 2FA on your account
- ✅ Save backup codes securely
- ✅ Keep your authenticator app updated
- ✅ Use a secure lock screen on your phone
- ❌ Don't share your backup codes
- ❌ Don't screenshot 2FA codes
- ❌ Don't disable 2FA unless necessary

### General Security
- ✅ Log out when finished
- ✅ Don't leave your computer unattended while logged in
- ✅ Use a strong device password/PIN
- ✅ Keep your software updated
- ❌ Don't access the system on public Wi-Fi without VPN
- ❌ Don't click on suspicious emails
- ❌ Don't share your login details

---

## Quick Reference Card

### Password Reset
1. Click "Forgot password?"
2. Enter email → Get code
3. Enter 6-character code
4. Create new password
5. Done!

### 2FA Setup
1. Settings → Security
2. Enable 2FA
3. Scan QR code
4. Enter verification code
5. Save backup codes
6. Done!

### 2FA Login
1. Enter email + password
2. Open authenticator app
3. Enter 6-digit code
4. Done!

### Emergency Access
- Lost phone? → Use backup code
- Lost backup codes? → Contact admin
- Forgot password? → Use password reset

---

**Need More Help?**
Contact your system administrator or visit our support portal.

**Last Updated:** 2025-10-17
**Version:** 1.0
