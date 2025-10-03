/**
 * Password Reset Controller
 * Handles forgot password, challenge verification, and password reset
 */

import bcrypt from 'bcrypt';
import pool from '../db.js';
import emailService from '../services/emailService.js';
import challengeCodeGenerator from '../utils/challengeCodeGenerator.js';
import { validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

// Rate limiting for password reset requests
export const passwordResetRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 requests per hour per IP
    message: {
        error: 'Too many password reset attempts. Please try again in an hour.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Combine IP and email for more granular rate limiting
        const email = req.body.email || '';
        return `${req.ip}_${email}`;
    }
});

// Rate limiting for challenge code verification
export const challengeCodeRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // 3 attempts per challenge
    message: {
        error: 'Too many verification attempts. Please request a new code.',
        code: 'CHALLENGE_RATE_LIMIT_EXCEEDED'
    },
    keyGenerator: (req) => {
        const { email, challengeCode } = req.body;
        return `challenge_${email}_${challengeCode}`;
    }
});

class PasswordResetController {
    /**
     * Request password reset - Send challenge code to email
     */
    async requestPasswordReset(req, res) {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Invalid email format',
                    details: errors.array(),
                    code: 'VALIDATION_ERROR'
                });
            }

            const { email } = req.body;
            const clientIp = req.ip || req.connection.remoteAddress;
            const userAgent = req.get('User-Agent') || '';

            console.log(`🔐 Password reset requested for: ${challengeCodeGenerator.maskEmail(email)}`);

            // Check if user exists and is active
            const [users] = await pool.execute(
                `SELECT id, email, full_name, role, is_active, center_id
                 FROM users
                 WHERE email = ? AND is_active = 1`,
                [email]
            );

            if (users.length === 0) {
                console.log(`⚠️ Password reset attempted for non-existent email: ${challengeCodeGenerator.maskEmail(email)}`);

                // Return same success message for security (don't reveal if email exists)
                return res.status(200).json({
                    success: true,
                    message: 'If this email is registered with us, you will receive a password reset code shortly. If you don\'t receive an email, please contact your center administrator for assistance.',
                    action: 'check_email'
                });
            }

            const user = users[0];

            // For now, we'll skip the account lockout check since these columns don't exist yet
            // This can be added later if needed

            // Clean up any existing active reset tokens for this user
            await pool.execute(
                'UPDATE password_reset_tokens SET is_used = TRUE WHERE user_id = ? AND is_used = FALSE',
                [user.id]
            );

            // Generate challenge code and reset token
            const challengeCode = challengeCodeGenerator.generateChallengeCode();
            const resetToken = challengeCodeGenerator.generateResetToken();
            const resetId = challengeCodeGenerator.generateResetId();
            const expirationTime = challengeCodeGenerator.calculateExpiration(15); // 15 minutes

            // Hash the reset token for database storage
            const tokenHash = await bcrypt.hash(resetToken, 12);

            // Insert reset token record
            await pool.execute(
                `INSERT INTO password_reset_tokens
                 (id, user_id, email, challenge_code, token_hash, expires_at, ip_address, user_agent)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [resetId, user.id, email, challengeCode, tokenHash, expirationTime, clientIp, userAgent]
            );

            // Send email with challenge code
            const emailResult = await emailService.sendPasswordResetCode(
                email,
                user.full_name || user.email.split('@')[0],
                challengeCode,
                15
            );

            if (!emailResult.success) {
                console.error('❌ Failed to send password reset email:', emailResult.error);

                // Clean up the reset token since email failed
                await pool.execute('DELETE FROM password_reset_tokens WHERE id = ?', [resetId]);

                return res.status(500).json({
                    error: 'Unable to send password reset email. Please contact your center administrator.',
                    code: 'EMAIL_SEND_FAILED'
                });
            }

            console.log(`✅ Password reset code sent successfully to ${challengeCodeGenerator.maskEmail(email)}`);

            res.status(200).json({
                success: true,
                message: 'A verification code has been sent to your email address. Please check your inbox and spam folder.',
                action: 'verify_code',
                resetId: resetId,
                expiresIn: '15 minutes',
                maskedEmail: challengeCodeGenerator.maskEmail(email)
            });

        } catch (error) {
            console.error('❌ Password reset request error:', error);
            res.status(500).json({
                error: 'An unexpected error occurred. Please try again or contact support.',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    /**
     * Verify challenge code
     */
    async verifyResetCode(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Invalid input format',
                    details: errors.array(),
                    code: 'VALIDATION_ERROR'
                });
            }

            const { email, challengeCode, resetId } = req.body;

            console.log(`🔍 Verifying challenge code for: ${challengeCodeGenerator.maskEmail(email)}`);

            // Validate challenge code format
            if (!challengeCodeGenerator.validateChallengeCodeFormat(challengeCode)) {
                return res.status(400).json({
                    error: 'Invalid code format. Please enter a 6-character code.',
                    code: 'INVALID_CODE_FORMAT'
                });
            }

            // Find the reset token
            const [resetTokens] = await pool.execute(
                `SELECT prt.*, u.first_name, u.last_name
                 FROM password_reset_tokens prt
                 JOIN users u ON prt.user_id = u.id
                 WHERE prt.email = ? AND prt.challenge_code = ? AND prt.id = ?
                 AND prt.is_used = FALSE
                 ORDER BY prt.created_at DESC
                 LIMIT 1`,
                [email, challengeCode.toUpperCase(), resetId]
            );

            if (resetTokens.length === 0) {
                console.log(`❌ Invalid challenge code attempt for: ${challengeCodeGenerator.maskEmail(email)}`);
                return res.status(400).json({
                    error: 'Invalid or expired verification code. Please request a new code.',
                    code: 'INVALID_OR_EXPIRED_CODE'
                });
            }

            const resetToken = resetTokens[0];

            // Check if token has expired
            if (challengeCodeGenerator.isExpired(resetToken.expires_at)) {
                await pool.execute(
                    'UPDATE password_reset_tokens SET is_used = TRUE WHERE id = ?',
                    [resetToken.id]
                );

                return res.status(400).json({
                    error: 'Verification code has expired. Please request a new code.',
                    code: 'CODE_EXPIRED'
                });
            }

            // Check attempt limits
            if (resetToken.attempts_used >= resetToken.max_attempts) {
                await pool.execute(
                    'UPDATE password_reset_tokens SET is_used = TRUE WHERE id = ?',
                    [resetToken.id]
                );

                return res.status(400).json({
                    error: 'Maximum verification attempts exceeded. Please request a new code.',
                    code: 'MAX_ATTEMPTS_EXCEEDED'
                });
            }

            // Increment attempt counter
            await pool.execute(
                'UPDATE password_reset_tokens SET attempts_used = attempts_used + 1 WHERE id = ?',
                [resetToken.id]
            );

            console.log(`✅ Challenge code verified successfully for: ${challengeCodeGenerator.maskEmail(email)}`);

            // Generate a new secure token for the password reset step
            const passwordResetToken = challengeCodeGenerator.generateResetToken();
            const passwordTokenHash = await bcrypt.hash(passwordResetToken, 12);

            // Update the reset token with the password reset token
            await pool.execute(
                `UPDATE password_reset_tokens
                 SET token_hash = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [passwordTokenHash, resetToken.id]
            );

            res.status(200).json({
                success: true,
                message: 'Verification code confirmed. You can now reset your password.',
                action: 'reset_password',
                resetToken: passwordResetToken,
                resetId: resetToken.id,
                userName: resetToken.first_name || email.split('@')[0]
            });

        } catch (error) {
            console.error('❌ Challenge code verification error:', error);
            res.status(500).json({
                error: 'An unexpected error occurred during verification.',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    /**
     * Reset password with verified token
     */
    async resetPassword(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Password validation failed',
                    details: errors.array(),
                    code: 'VALIDATION_ERROR'
                });
            }

            const { email, newPassword, resetToken, resetId } = req.body;

            console.log(`🔄 Password reset attempt for: ${challengeCodeGenerator.maskEmail(email)}`);

            // Find and verify the reset token
            const [resetTokens] = await pool.execute(
                `SELECT prt.*, u.id as user_id, u.first_name, u.last_name
                 FROM password_reset_tokens prt
                 JOIN users u ON prt.user_id = u.id
                 WHERE prt.id = ? AND prt.email = ? AND prt.is_used = FALSE`,
                [resetId, email]
            );

            if (resetTokens.length === 0) {
                return res.status(400).json({
                    error: 'Invalid or expired reset session. Please start over.',
                    code: 'INVALID_RESET_SESSION'
                });
            }

            const tokenRecord = resetTokens[0];

            // Verify the reset token
            const isValidToken = await bcrypt.compare(resetToken, tokenRecord.token_hash);
            if (!isValidToken) {
                console.log(`❌ Invalid reset token for: ${challengeCodeGenerator.maskEmail(email)}`);
                return res.status(400).json({
                    error: 'Invalid reset token. Please start over.',
                    code: 'INVALID_TOKEN'
                });
            }

            // Check expiration
            if (challengeCodeGenerator.isExpired(tokenRecord.expires_at)) {
                await pool.execute(
                    'UPDATE password_reset_tokens SET is_used = TRUE WHERE id = ?',
                    [resetId]
                );

                return res.status(400).json({
                    error: 'Reset session has expired. Please start over.',
                    code: 'RESET_EXPIRED'
                });
            }

            // Hash new password
            const newPasswordHash = await bcrypt.hash(newPassword, 12);

            // Start transaction for password update
            const connection = await pool.getConnection();
            await connection.beginTransaction();

            try {
                // Update user password
                await connection.execute(
                    `UPDATE users
                     SET password = ?, last_password_reset = CURRENT_TIMESTAMP,
                         failed_reset_attempts = 0, reset_locked_until = NULL,
                         must_reset_password = FALSE,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE id = ?`,
                    [newPasswordHash, tokenRecord.user_id]
                );

                // Mark reset token as used
                await connection.execute(
                    'UPDATE password_reset_tokens SET is_used = TRUE WHERE id = ?',
                    [resetId]
                );

                // Clean up any other active reset tokens for this user
                await connection.execute(
                    'UPDATE password_reset_tokens SET is_used = TRUE WHERE user_id = ? AND id != ?',
                    [tokenRecord.user_id, resetId]
                );

                await connection.commit();
                connection.release();

                console.log(`✅ Password reset successful for: ${challengeCodeGenerator.maskEmail(email)}`);

                // Send confirmation email
                await emailService.sendPasswordResetConfirmation(
                    email,
                    tokenRecord.first_name || email.split('@')[0]
                );

                res.status(200).json({
                    success: true,
                    message: 'Password reset successful! You can now log in with your new password.',
                    action: 'login_redirect'
                });

            } catch (error) {
                await connection.rollback();
                connection.release();
                throw error;
            }

        } catch (error) {
            console.error('❌ Password reset error:', error);
            res.status(500).json({
                error: 'Failed to reset password. Please try again or contact support.',
                code: 'RESET_FAILED'
            });
        }
    }

    /**
     * Get reset status for debugging/admin purposes
     */
    async getResetStatus(req, res) {
        try {
            const { resetId } = req.params;

            const [tokens] = await pool.execute(
                `SELECT id, email, expires_at, attempts_used, max_attempts, is_used, created_at
                 FROM password_reset_tokens
                 WHERE id = ?`,
                [resetId]
            );

            if (tokens.length === 0) {
                return res.status(404).json({
                    error: 'Reset session not found',
                    code: 'RESET_NOT_FOUND'
                });
            }

            const token = tokens[0];
            const isExpired = challengeCodeGenerator.isExpired(token.expires_at);

            res.status(200).json({
                resetId: token.id,
                email: challengeCodeGenerator.maskEmail(token.email),
                isExpired: isExpired,
                isUsed: token.is_used,
                attemptsUsed: token.attempts_used,
                maxAttempts: token.max_attempts,
                createdAt: token.created_at,
                expiresAt: token.expires_at
            });

        } catch (error) {
            console.error('❌ Get reset status error:', error);
            res.status(500).json({
                error: 'Failed to get reset status',
                code: 'INTERNAL_ERROR'
            });
        }
    }
}

const passwordResetController = new PasswordResetController();
export default passwordResetController;