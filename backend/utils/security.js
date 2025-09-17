import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

// Password validation based on policy
export const validatePassword = async (password, centerId) => {
    try {
        const [center] = await pool.query(
            'SELECT password_policy FROM centers WHERE id = ?',
            [centerId]
        );

        if (!center.length || !center[0].password_policy) {
            throw new Error('Password policy not found');
        }

        const policy = JSON.parse(center[0].password_policy);

        const validations = [
            {
                test: password.length >= policy.minLength,
                message: `Password must be at least ${policy.minLength} characters long`
            },
            {
                test: !policy.requireUppercase || /[A-Z]/.test(password),
                message: 'Password must contain at least one uppercase letter'
            },
            {
                test: !policy.requireLowercase || /[a-z]/.test(password),
                message: 'Password must contain at least one lowercase letter'
            },
            {
                test: !policy.requireNumbers || /\d/.test(password),
                message: 'Password must contain at least one number'
            },
            {
                test: !policy.requireSpecialChars || /[!@#$%^&*(),.?":{}|<>]/.test(password),
                message: 'Password must contain at least one special character'
            }
        ];

        const failures = validations
            .filter(v => !v.test)
            .map(v => v.message);

        if (failures.length > 0) {
            throw new Error(failures.join('. '));
        }

        return true;
    } catch (error) {
        throw error;
    }
};

// CSRF token generation and validation
export const generateCSRFToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

export const validateCSRFToken = async (token, userId) => {
    try {
        const [session] = await pool.query(
            'SELECT * FROM user_sessions WHERE user_id = ? AND csrf_token = ? AND is_active = true',
            [userId, token]
        );

        return session.length > 0;
    } catch (error) {
        throw error;
    }
};

// Session management
export const createSession = async (userId, ipAddress, userAgent) => {
    try {
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const csrfToken = generateCSRFToken();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour session

        await pool.query(
            `INSERT INTO user_sessions 
             (id, user_id, session_token, csrf_token, ip_address, user_agent, expires_at)
             VALUES (UUID(), ?, ?, ?, ?, ?, ?)`,
            [userId, sessionToken, csrfToken, ipAddress, userAgent, expiresAt]
        );

        return { sessionToken, csrfToken };
    } catch (error) {
        throw error;
    }
};

export const validateSession = async (sessionToken) => {
    try {
        const [session] = await pool.query(
            `SELECT * FROM user_sessions 
             WHERE session_token = ? 
             AND is_active = true 
             AND expires_at > CURRENT_TIMESTAMP`,
            [sessionToken]
        );

        if (session.length === 0) {
            throw new Error('Invalid or expired session');
        }

        // Update last activity
        await pool.query(
            'UPDATE user_sessions SET last_activity = CURRENT_TIMESTAMP WHERE session_token = ?',
            [sessionToken]
        );

        return session[0];
    } catch (error) {
        throw error;
    }
};

// Login attempt tracking
export const trackLoginAttempt = async (userId, ipAddress, userAgent, success) => {
    try {
        await pool.query(
            `INSERT INTO login_attempts 
             (id, user_id, ip_address, user_agent, success)
             VALUES (UUID(), ?, ?, ?, ?)`,
            [userId, ipAddress, userAgent, success]
        );

        if (!success) {
            // Check if account should be locked
            const [attempts] = await pool.query(
                `SELECT COUNT(*) as count 
                 FROM login_attempts 
                 WHERE user_id = ? 
                 AND success = false 
                 AND attempt_time > DATE_SUB(NOW(), INTERVAL 30 MINUTE)`,
                [userId]
            );

            if (attempts[0].count >= 5) {
                // Lock the account
                await pool.query(
                    `UPDATE users 
                     SET account_locked = true,
                         lock_reason = 'Too many failed login attempts'
                     WHERE id = ?`,
                    [userId]
                );
            }
        }
    } catch (error) {
        throw error;
    }
};

// Security audit logging
export const logSecurityEvent = async (userId, action, ipAddress, userAgent, details, severity = 'info') => {
    try {
        await pool.query(
            `INSERT INTO security_audit_log 
             (id, user_id, action, ip_address, user_agent, details, severity)
             VALUES (UUID(), ?, ?, ?, ?, ?, ?)`,
            [userId, action, ipAddress, userAgent, JSON.stringify(details), severity]
        );
    } catch (error) {
        throw error;
    }
};

// Password history management
export const checkPasswordHistory = async (userId, newPassword) => {
    try {
        const [user] = await pool.query(
            'SELECT password_history FROM users WHERE id = ?',
            [userId]
        );

        if (!user.length || !user[0].password_history) {
            return true;
        }

        const history = JSON.parse(user[0].password_history);
        
        // Check if the new password matches any of the previous passwords
        for (const oldHash of history) {
            if (await bcrypt.compare(newPassword, oldHash)) {
                throw new Error('Password has been used recently. Please choose a different password.');
            }
        }

        return true;
    } catch (error) {
        throw error;
    }
};

export const updatePasswordHistory = async (userId, newPasswordHash) => {
    try {
        const [user] = await pool.query(
            'SELECT password_history FROM users WHERE id = ?',
            [userId]
        );

        let history = user[0]?.password_history ? 
            JSON.parse(user[0].password_history) : 
            [];

        // Keep only the last 5 passwords
        history = [newPasswordHash, ...history.slice(0, 4)];

        await pool.query(
            'UPDATE users SET password_history = ? WHERE id = ?',
            [JSON.stringify(history), userId]
        );
    } catch (error) {
        throw error;
    }
};

// JWT token management with refresh tokens
export const generateTokens = (userId, role) => {
    const accessToken = jwt.sign(
        { id: userId, role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
        { id: userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        throw new Error('Invalid refresh token');
    }
};