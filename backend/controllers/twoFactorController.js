/**
 * Two-Factor Authentication Controller
 * Handles TOTP-based 2FA setup, verification, and management
 */

import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db.js';

class TwoFactorController {
    /**
     * Generate 2FA secret and QR code for user
     * GET /api/auth/2fa/setup
     */
    async setupTwoFactor(req, res) {
        try {
            const userId = req.user.id;

            // Get user info
            const [users] = await pool.query(
                'SELECT email, first_name FROM users WHERE id = ?',
                [userId]
            );

            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const user = users[0];

            // Generate secret
            const secret = speakeasy.generateSecret({
                name: `Preschool ERP (${user.email})`,
                issuer: 'Preschool ERP',
                length: 32
            });

            // Generate QR code
            const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

            // Generate backup codes (8 codes, 8 characters each)
            const backupCodes = Array.from({ length: 8 }, () =>
                Math.random().toString(36).substring(2, 10).toUpperCase()
            );

            // Store secret temporarily (not enabled yet)
            await pool.query(
                `UPDATE users
                 SET two_fa_secret = ?,
                     two_fa_backup_codes = ?,
                     two_fa_enabled = FALSE
                 WHERE id = ?`,
                [secret.base32, JSON.stringify(backupCodes), userId]
            );

            res.json({
                success: true,
                secret: secret.base32,
                qrCode: qrCodeUrl,
                backupCodes: backupCodes,
                message: 'Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)'
            });

        } catch (error) {
            console.error('❌ 2FA setup error:', error);
            res.status(500).json({
                error: 'Failed to setup two-factor authentication',
                details: error.message
            });
        }
    }

    /**
     * Verify and enable 2FA
     * POST /api/auth/2fa/verify-setup
     * Body: { token }
     */
    async verifyAndEnableTwoFactor(req, res) {
        try {
            const userId = req.user.id;
            const { token } = req.body;

            if (!token || token.length !== 6) {
                return res.status(400).json({ error: 'Invalid verification code' });
            }

            // Get user's secret
            const [users] = await pool.query(
                'SELECT two_fa_secret, two_fa_enabled FROM users WHERE id = ?',
                [userId]
            );

            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const user = users[0];

            if (!user.two_fa_secret) {
                return res.status(400).json({ error: 'Two-factor authentication not set up' });
            }

            // Verify token
            const verified = speakeasy.totp.verify({
                secret: user.two_fa_secret,
                encoding: 'base32',
                token: token,
                window: 2 // Allow 2 steps before and after
            });

            if (!verified) {
                return res.status(400).json({
                    error: 'Invalid verification code',
                    message: 'Please check your authenticator app and try again'
                });
            }

            // Enable 2FA
            await pool.query(
                'UPDATE users SET two_fa_enabled = TRUE WHERE id = ?',
                [userId]
            );

            res.json({
                success: true,
                message: 'Two-factor authentication enabled successfully',
                enabled: true
            });

        } catch (error) {
            console.error('❌ 2FA verification error:', error);
            res.status(500).json({
                error: 'Failed to verify two-factor authentication',
                details: error.message
            });
        }
    }

    /**
     * Verify 2FA token during login
     * POST /api/auth/2fa/verify
     * Body: { token, sessionToken }
     */
    async verifyTwoFactorLogin(req, res) {
        try {
            const { token, sessionToken } = req.body;

            if (!token || !sessionToken) {
                return res.status(400).json({ error: 'Token and session token required' });
            }

            // Get 2FA session
            const [sessions] = await pool.query(
                `SELECT tfs.*, u.two_fa_secret, u.two_fa_backup_codes, u.email, u.first_name, u.role
                 FROM two_fa_sessions tfs
                 JOIN users u ON tfs.user_id = u.id
                 WHERE tfs.session_token = ?
                 AND tfs.expires_at > NOW()
                 AND tfs.verified = FALSE`,
                [sessionToken]
            );

            if (sessions.length === 0) {
                return res.status(400).json({
                    error: 'Invalid or expired session',
                    message: 'Please login again'
                });
            }

            const session = sessions[0];
            let verified = false;
            let usedBackupCode = false;

            // Try to verify with TOTP token
            if (token.length === 6 && /^\d+$/.test(token)) {
                verified = speakeasy.totp.verify({
                    secret: session.two_fa_secret,
                    encoding: 'base32',
                    token: token,
                    window: 2
                });
            }

            // If TOTP failed, try backup codes
            if (!verified && session.two_fa_backup_codes) {
                const backupCodes = JSON.parse(session.two_fa_backup_codes);
                const codeIndex = backupCodes.indexOf(token.toUpperCase());

                if (codeIndex !== -1) {
                    verified = true;
                    usedBackupCode = true;

                    // Remove used backup code
                    backupCodes.splice(codeIndex, 1);
                    await pool.query(
                        'UPDATE users SET two_fa_backup_codes = ? WHERE id = ?',
                        [JSON.stringify(backupCodes), session.user_id]
                    );
                }
            }

            if (!verified) {
                return res.status(400).json({
                    error: 'Invalid verification code',
                    message: 'Please check your authenticator app and try again'
                });
            }

            // Mark session as verified
            await pool.query(
                'UPDATE two_fa_sessions SET verified = TRUE WHERE id = ?',
                [session.id]
            );

            // Generate JWT token (same as regular login)
            const jwt = require('jsonwebtoken');
            const token_jwt = jwt.sign(
                {
                    id: session.user_id,
                    email: session.email,
                    role: session.role
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Update last login
            await pool.query(
                'UPDATE users SET last_login_at = NOW() WHERE id = ?',
                [session.user_id]
            );

            res.json({
                success: true,
                token: token_jwt,
                user: {
                    id: session.user_id,
                    email: session.email,
                    firstName: session.first_name,
                    role: session.role
                },
                message: usedBackupCode
                    ? 'Login successful (backup code used)'
                    : 'Two-factor authentication verified'
            });

        } catch (error) {
            console.error('❌ 2FA login verification error:', error);
            res.status(500).json({
                error: 'Failed to verify two-factor authentication',
                details: error.message
            });
        }
    }

    /**
     * Disable 2FA
     * POST /api/auth/2fa/disable
     * Body: { password }
     */
    async disableTwoFactor(req, res) {
        try {
            const userId = req.user.id;
            const { password } = req.body;

            if (!password) {
                return res.status(400).json({ error: 'Password required to disable 2FA' });
            }

            // Verify password
            const bcrypt = require('bcryptjs');
            const [users] = await pool.query(
                'SELECT password FROM users WHERE id = ?',
                [userId]
            );

            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const validPassword = await bcrypt.compare(password, users[0].password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid password' });
            }

            // Disable 2FA
            await pool.query(
                `UPDATE users
                 SET two_fa_enabled = FALSE,
                     two_fa_secret = NULL,
                     two_fa_backup_codes = NULL
                 WHERE id = ?`,
                [userId]
            );

            // Delete any active 2FA sessions
            await pool.query(
                'DELETE FROM two_fa_sessions WHERE user_id = ?',
                [userId]
            );

            res.json({
                success: true,
                message: 'Two-factor authentication disabled successfully'
            });

        } catch (error) {
            console.error('❌ 2FA disable error:', error);
            res.status(500).json({
                error: 'Failed to disable two-factor authentication',
                details: error.message
            });
        }
    }

    /**
     * Get 2FA status
     * GET /api/auth/2fa/status
     */
    async getTwoFactorStatus(req, res) {
        try {
            const userId = req.user.id;

            const [users] = await pool.query(
                `SELECT two_fa_enabled,
                        two_fa_backup_codes,
                        JSON_LENGTH(two_fa_backup_codes) as remaining_backup_codes
                 FROM users WHERE id = ?`,
                [userId]
            );

            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const user = users[0];

            res.json({
                success: true,
                enabled: user.two_fa_enabled === 1,
                backupCodesRemaining: user.remaining_backup_codes || 0
            });

        } catch (error) {
            console.error('❌ 2FA status error:', error);
            res.status(500).json({
                error: 'Failed to get two-factor authentication status',
                details: error.message
            });
        }
    }

    /**
     * Regenerate backup codes
     * POST /api/auth/2fa/regenerate-backup-codes
     * Body: { password }
     */
    async regenerateBackupCodes(req, res) {
        try {
            const userId = req.user.id;
            const { password } = req.body;

            if (!password) {
                return res.status(400).json({ error: 'Password required' });
            }

            // Verify password
            const bcrypt = require('bcryptjs');
            const [users] = await pool.query(
                'SELECT password, two_fa_enabled FROM users WHERE id = ?',
                [userId]
            );

            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            if (!users[0].two_fa_enabled) {
                return res.status(400).json({ error: '2FA not enabled' });
            }

            const validPassword = await bcrypt.compare(password, users[0].password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid password' });
            }

            // Generate new backup codes
            const backupCodes = Array.from({ length: 8 }, () =>
                Math.random().toString(36).substring(2, 10).toUpperCase()
            );

            await pool.query(
                'UPDATE users SET two_fa_backup_codes = ? WHERE id = ?',
                [JSON.stringify(backupCodes), userId]
            );

            res.json({
                success: true,
                backupCodes: backupCodes,
                message: 'Backup codes regenerated successfully. Save these codes in a secure location.'
            });

        } catch (error) {
            console.error('❌ Backup codes regeneration error:', error);
            res.status(500).json({
                error: 'Failed to regenerate backup codes',
                details: error.message
            });
        }
    }
}

export default new TwoFactorController();
