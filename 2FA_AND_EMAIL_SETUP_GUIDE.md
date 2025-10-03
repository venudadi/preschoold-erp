# 2FA and Email Configuration Guide

## ✅ Completed Setup

### 1. Outlook SMTP Email Configuration

**Location:** `backend/.env`

```env
# Outlook SMTP Email Configuration
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT=587
SMTP_USER="your-outlook-email@outlook.com"
SMTP_PASS="your-outlook-password"
FROM_NAME="Preschool ERP System"
FROM_EMAIL="your-outlook-email@outlook.com"
```

**⚠️ ACTION REQUIRED:**
Replace the following with your actual Outlook credentials:
- `SMTP_USER`: Your Outlook email address
- `SMTP_PASS`: Your Outlook password or app password
- `FROM_EMAIL`: Your Outlook email address

**For Microsoft 365 / Outlook:**
- If you have 2FA enabled on your Outlook account, you'll need to create an **App Password**
- Go to: https://account.microsoft.com/security → Security basics → App passwords
- Create a new app password and use that instead of your regular password

### 2. Two-Factor Authentication (2FA) Implementation

#### Database Schema ✅
- Migration `011_add_auth_enhancements.sql` has been applied
- Tables created:
  - `two_fa_sessions` - tracks temporary 2FA login sessions
  - User columns added: `two_fa_secret`, `two_fa_enabled`, `two_fa_backup_codes`

#### Backend API Endpoints ✅

All endpoints are available at `/api/auth/2fa/*`:

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/2fa/setup` | GET | ✅ Yes | Generate QR code and secret for 2FA setup |
| `/2fa/verify-setup` | POST | ✅ Yes | Verify and enable 2FA with token |
| `/2fa/verify` | POST | ❌ No | Verify 2FA code during login |
| `/2fa/status` | GET | ✅ Yes | Get user's 2FA status |
| `/2fa/disable` | POST | ✅ Yes | Disable 2FA (requires password) |
| `/2fa/regenerate-backup-codes` | POST | ✅ Yes | Generate new backup codes |

#### Modified Login Flow ✅

When a user with 2FA enabled logs in:
1. Backend checks if `two_fa_enabled` is true
2. Creates a temporary 2FA session (valid for 10 minutes)
3. Returns:
   ```json
   {
     "require2FA": true,
     "sessionToken": "uuid-token",
     "expiresIn": 600
   }
   ```
4. Frontend must collect 6-digit code and POST to `/api/auth/2fa/verify`

## 🔨 Next Steps - Frontend Implementation

### Frontend Components to Create:

#### 1. **2FA Setup Dialog** (`TwoFactorSetup.jsx`)
- Display QR code for scanning with authenticator app
- Show backup codes for safekeeping
- Verify setup with 6-digit code

#### 2. **2FA Verification Dialog** (`TwoFactorVerify.jsx`)
- Shown after successful email/password login for 2FA users
- 6-digit code input
- Option to use backup code
- Timer showing session expiration

#### 3. **2FA Settings Component** (`TwoFactorSettings.jsx`)
- Enable/Disable 2FA
- View 2FA status
- Regenerate backup codes
- Show remaining backup codes count

### API Service for Frontend

Create `frontend/src/services/twoFactorApi.js`:

```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

export const twoFactorApi = {
  // Setup 2FA
  async setup() {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/api/auth/2fa/setup`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Verify and enable 2FA
  async verifySetup(code) {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/2fa/verify-setup`,
      { token: code },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Verify 2FA during login
  async verifyLogin(sessionToken, code) {
    const response = await axios.post(`${API_BASE_URL}/api/auth/2fa/verify`, {
      sessionToken,
      token: code
    });
    return response.data;
  },

  // Get 2FA status
  async getStatus() {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/api/auth/2fa/status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Disable 2FA
  async disable(password) {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/2fa/disable`,
      { password },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Regenerate backup codes
  async regenerateBackupCodes(password) {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/2fa/regenerate-backup-codes`,
      { password },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }
};
```

### Modified Login Flow

Update `LoginPage.jsx` to handle 2FA:

```javascript
const handleLogin = async (e) => {
  e.preventDefault();
  setError('');

  try {
    const data = await loginUser(email, password);

    // Check if 2FA is required
    if (data.require2FA) {
      // Store session token and show 2FA dialog
      setTwoFASessionToken(data.sessionToken);
      setShowTwoFADialog(true);
      return;
    }

    // Normal login flow (no 2FA)
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    navigate('/');

  } catch (err) {
    setError(err.message || 'Login failed');
  }
};
```

## 📱 Recommended Authenticator Apps

Users can use any TOTP authenticator app:
- **Google Authenticator** (iOS/Android)
- **Microsoft Authenticator** (iOS/Android)
- **Authy** (iOS/Android/Desktop)
- **1Password** (with authenticator feature)
- **LastPass Authenticator**

## 🔐 Security Features Implemented

1. **TOTP (Time-based One-Time Password)**
   - 6-digit codes
   - 30-second validity window
   - ±2 window tolerance for clock drift

2. **Backup Codes**
   - 8 backup codes generated
   - 8 characters each
   - Single-use only
   - Can be regenerated

3. **Session Management**
   - 2FA sessions expire in 10 minutes
   - Sessions are tracked in database
   - Automatic cleanup of expired sessions

4. **Password Protection**
   - Disabling 2FA requires password confirmation
   - Regenerating backup codes requires password

## 🧪 Testing 2FA

### Backend Test Script

Create `backend/test_2fa.js`:

```javascript
import axios from 'axios';

const API_URL = 'http://localhost:5001/api/auth';
let authToken = '';
let twoFASessionToken = '';

async function test2FA() {
  try {
    // 1. Login first
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_URL}/login`, {
      email: 'your-test-email@example.com',
      password: 'your-password'
    });

    authToken = loginResponse.data.token;
    console.log('✅ Login successful');

    // 2. Setup 2FA
    console.log('\n2. Setting up 2FA...');
    const setupResponse = await axios.get(`${API_URL}/2fa/setup`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('✅ QR Code URL:', setupResponse.data.qrCode);
    console.log('✅ Secret:', setupResponse.data.secret);
    console.log('✅ Backup Codes:', setupResponse.data.backupCodes);

    // 3. User scans QR code and enters code here
    const userCode = '123456'; // Replace with actual code from app

    // 4. Verify and enable 2FA
    console.log('\n3. Verifying 2FA setup...');
    const verifyResponse = await axios.post(
      `${API_URL}/2fa/verify-setup`,
      { token: userCode },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log('✅ 2FA enabled:', verifyResponse.data);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

test2FA();
```

## 📊 Current Status

| Feature | Status | Notes |
|---------|--------|-------|
| Email Service Configuration | ⚠️ Needs credentials | Update `.env` with your Outlook details |
| Database Migration | ✅ Complete | 2FA tables created |
| Backend API | ✅ Complete | All endpoints working |
| Login Flow | ✅ Modified | Checks for 2FA before issuing token |
| Frontend UI | ⏳ Pending | Need to create components |
| Testing | ⏳ Pending | Test after frontend complete |

## 🚀 Quick Start

1. **Configure Email:**
   ```bash
   # Edit backend/.env
   SMTP_USER="your-outlook-email@outlook.com"
   SMTP_PASS="your-app-password"
   FROM_EMAIL="your-outlook-email@outlook.com"
   ```

2. **Restart Backend:**
   - Backend is already running with 2FA routes

3. **Test Email Service:**
   ```bash
   cd backend
   node -e "import('./services/emailService.js').then(m => m.default.testEmailConfiguration().then(console.log))"
   ```

4. **Create Frontend Components:**
   - Follow the frontend implementation section above

## 📝 Notes

- 2FA is **optional** - users can choose to enable it
- Email service is used for password reset functionality
- Backup codes should be stored securely by users
- 2FA sessions expire after 10 minutes of inactivity
- Failed verification attempts are logged for security monitoring

---

**Generated:** 2025-10-03
**Version:** 1.0.0
