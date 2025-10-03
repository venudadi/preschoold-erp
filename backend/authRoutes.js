// This file creates a ROUTER, not an 'app'


import express from 'express';
import bcrypt from 'bcrypt';
import pool from './db.js';
import { protect } from './authMiddleware.js';
import { v4 as uuidv4 } from 'uuid';
import { rateLimiters, sanitizeInput, validateInput, validationRules } from './middleware/security.js';
import { createSession, generateCSRFToken, verifyRefreshToken } from './utils/security.js';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';


const allowedRoles = ['parent', 'admin', 'owner', 'super_admin', 'teacher', 'financial_manager'];
const router = express.Router();
// Apply rate limiting and sanitization to all auth routes
router.use(rateLimiters.auth);
router.use(sanitizeInput);

// --- USER REGISTRATION ENDPOINT ---
router.post(
  '/register',
  validateInput([
    body('fullName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Full name must be 2-50 characters')
      .matches(/^[a-zA-Z\s.'-]+$/)
      .withMessage('Full name contains invalid characters'),
    validationRules.email,
    validationRules.password,
    body('role')
      .isString()
      .custom((value) => allowedRoles.includes(value))
      .withMessage('Invalid role')
  ]),
  async (req, res) => {
    try {
      const { fullName, email, password, role } = req.body;
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const userId = uuidv4();
      const sql = `
        INSERT INTO users (id, full_name, email, password_hash, role)
        VALUES (?, ?, ?, ?, ?)
      `;
      await pool.query(sql, [userId, fullName, email, passwordHash, role]);
      res.status(201).json({ message: 'User registered successfully!', userId });
    } catch (error) {
      if (error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ECONNREFUSED' || error.code === 'ER_CON_COUNT_ERROR') {
        return res.status(503).json({ message: 'Database connection error. Please try again later.' });
      }
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Email already exists.' });
      }
      if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({ message: 'Foreign key constraint error.' });
      }
      if (error.code === 'ER_LOCK_DEADLOCK') {
        return res.status(500).json({ message: 'Database deadlock. Please retry the operation.' });
      }
      if (error.fatal) {
        return res.status(500).json({ message: 'Fatal database error. Please contact support.' });
      }
      console.error('Registration Error:', error);
      res.status(500).json({ message: 'Server error during registration.' });
    }
  }
);

// --- USER LOGIN ENDPOINT ---
router.post(
  '/login',
  validateInput([
    validationRules.email,
    body('password').exists().withMessage('Password is required')
  ]),
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const findUserSql = `SELECT * FROM users WHERE email = ?`;
      const [users] = await pool.query(findUserSql, [email]);
      if (users.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }
      const user = users[0];
      const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordCorrect) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }
      // Check if user must reset password
      if (user.must_reset_password) {
        return res.status(403).json({
          message: 'Password reset required. Please change your password before continuing.',
          code: 'MUST_RESET_PASSWORD',
          user: {
            id: user.id,
            fullName: user.full_name,
            email: user.email,
            role: user.role
          }
        });
      }

      // Check if 2FA is enabled
      if (user.two_fa_enabled) {
        // Create a temporary 2FA session
        const sessionId = uuidv4();
        const twoFaSessionToken = uuidv4();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await pool.query(
          `INSERT INTO two_fa_sessions (id, user_id, session_token, expires_at, verified)
           VALUES (?, ?, ?, ?, FALSE)`,
          [sessionId, user.id, twoFaSessionToken, expiresAt]
        );

        return res.status(200).json({
          message: 'Two-factor authentication required',
          require2FA: true,
          sessionToken: twoFaSessionToken,
          expiresIn: 600 // seconds
        });
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      let refreshToken = null;
      if (process.env.JWT_REFRESH_SECRET) {
        refreshToken = jwt.sign(
          { id: user.id },
          process.env.JWT_REFRESH_SECRET,
          { expiresIn: '7d' }
        );
      }

      // Generate real session and CSRF tokens, store in DB
      const ipAddress = req.ip || req.connection?.remoteAddress || '';
      const userAgent = req.get('User-Agent') || '';
      const { sessionToken, csrfToken } = await createSession(user.id, ipAddress, userAgent);

      const resp = {
        message: 'Login successful!',
        token,
        sessionToken,
        csrfToken,
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: user.role
        }
      };
      if (refreshToken) resp.refreshToken = refreshToken;
      res.status(200).json(resp);
    } catch (error) {
      console.error('Login Error:', error);
      res.status(500).json({ message: 'Server error during login.' });
    }
  }
);

// --- TOKEN VERIFICATION ROUTE ---
router.get('/verify', protect, (req, res) => {
  res.status(200).json({
    valid: true,
    user: req.user
  });
});

// Quick identity check for debugging
router.get('/whoami', protect, (req, res) => {
  res.status(200).json({
    user: req.user,
    hasSessionToken: Boolean(req.headers['x-session-token']),
    hasCsrfToken: Boolean(req.headers['x-csrf-token'])
  });
});

// --- PROTECTED PROFILE ROUTE ---
router.get('/profile', protect, (req, res) => {
  res.status(200).json({
    message: 'You have accessed the protected profile route!',
    user: req.user
  });
});

// --- DEV-ONLY: AUTH DEBUG ENDPOINTS ---
if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_AUTH_DEBUG === 'true') {
  // Quick status check for a user by email
  router.get('/debug/user-status', async (req, res) => {
    try {
      const email = (req.query.email || '').toString().trim();
      if (!email) return res.status(400).json({ message: 'email query param is required' });
      const [rows] = await pool.query(
        `SELECT id, full_name, email, role, is_active, account_locked, lock_reason, must_reset_password
         FROM users WHERE email = ? LIMIT 1`,
        [email]
      );
      if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
      const user = rows[0];
      const [attempts] = await pool.query(
        `SELECT success, attempt_time, ip_address FROM login_attempts
         WHERE user_id = ?
         ORDER BY attempt_time DESC
         LIMIT 10`,
        [user.id]
      );
      res.json({ user, recentLoginAttempts: attempts });
    } catch (e) {
      console.error('Debug user-status error:', e);
      res.status(500).json({ message: 'Server error fetching user status' });
    }
  });

  // Unlock a user by email and clear recent failed attempts
  router.post('/debug/unlock', async (req, res) => {
    try {
      const email = (req.body?.email || '').toString().trim();
      if (!email) return res.status(400).json({ message: 'email is required' });
      const [rows] = await pool.query(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email]);
      if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
      const userId = rows[0].id;
      await pool.query(
        `UPDATE users SET account_locked = false, lock_reason = NULL WHERE id = ?`,
        [userId]
      );
      // Optionally clear recent failed attempts to prevent immediate relock
      await pool.query(
        `DELETE FROM login_attempts WHERE user_id = ? AND success = false AND attempt_time > DATE_SUB(NOW(), INTERVAL 30 MINUTE)`,
        [userId]
      );
      res.json({ message: 'User unlocked' });
    } catch (e) {
      console.error('Debug unlock error:', e);
      res.status(500).json({ message: 'Server error unlocking user' });
    }
  });
}

// --- TEST CLEANUP ENDPOINT (for automated tests only) ---
router.delete('/test/cleanup-user', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Valid email is required.' });
    }
    const sql = 'DELETE FROM users WHERE email = ?';
    const [result] = await pool.query(sql, [email]);
    if (result.affectedRows > 0) {
      return res.status(200).json({ message: 'Test user deleted.' });
    } else {
      return res.status(204).send(); // No Content if user not found
    }
  } catch (error) {
    console.error('Cleanup Error:', error);
    res.status(500).json({ message: 'Server error during cleanup.' });
  }
});

// --- SUPER ADMIN: FORCE PASSWORD RESET FOR ANY USER ---
router.post('/admin/reset-user-password', protect, async (req, res) => {
  try {
    // Only super_admin can reset other users' passwords
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Forbidden: Only super admins can reset user passwords.' });
    }

    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      return res.status(400).json({ message: 'userId and newPassword are required.' });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update user password and set must_reset_password flag
    await pool.query(
      `UPDATE users
       SET password_hash = ?,
           must_reset_password = 1,
           updated_at = NOW()
       WHERE id = ?`,
      [passwordHash, userId]
    );

    res.status(200).json({
      message: 'Password reset successfully. User will be required to change password on next login.',
      userId
    });
  } catch (error) {
    console.error('Admin password reset error:', error);
    res.status(500).json({ message: 'Server error during password reset.' });
  }
});

export default router;

// --- TOKEN REFRESH ENDPOINT ---
// Note: This should be defined before export in many setups, but with ESM it's fine here as code runs once on import.
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (e) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const sessionToken = req.headers['x-session-token'];
    if (!sessionToken) {
      return res.status(401).json({ message: 'Session token required' });
    }

    // Validate the session is still active (best-effort; if validateSession throws, respond 401)
    try {
      const [rows] = await pool.query(
        `SELECT user_id, csrf_token FROM user_sessions 
         WHERE session_token = ? AND is_active = true AND expires_at > CURRENT_TIMESTAMP`,
        [sessionToken]
      );
      if (rows.length === 0) {
        return res.status(401).json({ message: 'Invalid or expired session' });
      }

      const { user_id: userId, csrf_token: csrfToken } = rows[0];

      // Issue a new access token
      const token = jwt.sign(
        { userId, role: undefined },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(200).json({ token, sessionToken, csrfToken });
    } catch (e) {
      console.error('Refresh token error:', e);
      return res.status(500).json({ message: 'Server error during token refresh.' });
    }
  } catch (error) {
    console.error('Refresh token route error:', error);
    res.status(500).json({ message: 'Server error during token refresh.' });
  }
});