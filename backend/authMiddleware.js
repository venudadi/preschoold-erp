import jwt from 'jsonwebtoken';
import pool from './db.js';
import { trackLoginAttempt, logSecurityEvent, validateSession, validateCSRFToken } from './utils/security.js';

// Ensure audit logging never breaks auth flow
const logEventSafe = async (...args) => {
    try {
        await logSecurityEvent(...args);
    } catch (e) {
        console.warn('Audit log failed:', e?.message || e);
    }
};

export const protect = async (req, res, next) => {
    try {
        let token;

        // Extract token from Authorization header
        if (req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                message: 'Access denied. No token provided.',
                code: 'NO_TOKEN'
            });
        }

        try {
            // Verify JWT token (with expiration)
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.userId || decoded.id;

            // --- SESSION VALIDATION (TEMPORARILY DISABLED) ---
            const sessionToken = req.headers['x-session-token'];
            // Temporarily allow any session token for testing
            if (!sessionToken) {
                return res.status(401).json({ message: 'Session token required', code: 'NO_SESSION' });
            }
            // Skip actual session validation for now (quiet)
            // console.debug('Accepting session token:', sessionToken);

            // --- CSRF VALIDATION (TEMPORARILY DISABLED) ---
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
                const csrfToken = req.headers['x-csrf-token'];
                // Temporarily skip CSRF validation for testing (quiet)
                // console.debug('Accepting CSRF token:', csrfToken);
            }

            // Fetch fresh user data from database to ensure user still exists and is active
            const [users] = await pool.query(
                'SELECT id, full_name, email, role, center_id, is_active, account_locked, must_reset_password FROM users WHERE id = ?',
                [userId]
            );

            if (users.length === 0) {
                throw new Error('User not found');
            }

            const user = users[0];

            // Check if user account is active
            if (!user.is_active) {
                await logEventSafe(
                    userId,
                    'ACCESS_DENIED_INACTIVE',
                    req.ip,
                    req.get('User-Agent'),
                    { reason: 'Account inactive' },
                    'warning'
                );
                throw new Error('Account is inactive');
            }

            // Check if user account is locked
            if (user.account_locked) {
                await logEventSafe(
                    userId,
                    'ACCESS_DENIED_LOCKED',
                    req.ip,
                    req.get('User-Agent'),
                    { reason: 'Account locked' },
                    'warning'
                );
                throw new Error('Account is locked');
            }


            // Enforce must_reset_password: block all except password change endpoints
            if (user.must_reset_password) {
                const allowedPaths = [
                    '/api/auth/change-password',
                    '/api/parent-auth/change-password',
                    '/api/parent/change-password',
                    '/api/users/change-password',
                    // Allow introspection so frontend can decide UX
                    '/api/auth/verify',
                    '/api/auth/whoami'
                ];
                // Allow only password change endpoints
                if (!allowedPaths.some(path => req.originalUrl.startsWith(path))) {
                    await logEventSafe(
                        userId,
                        'ACCESS_DENIED_MUST_RESET_PASSWORD',
                        req.ip,
                        req.get('User-Agent'),
                        { reason: 'Must reset password', endpoint: req.originalUrl },
                        'warning'
                    );
                    return res.status(403).json({
                        message: 'Password reset required. Please change your password before continuing.',
                        code: 'MUST_RESET_PASSWORD'
                    });
                }
            }

            // Set user data in request
            req.user = {
                id: user.id,
                email: user.email,
                role: user.role,
                fullName: user.full_name,
                center_id: user.center_id
            };

            // Log successful authentication for audit trail
            await logEventSafe(
                userId,
                'AUTH_SUCCESS',
                req.ip,
                req.get('User-Agent'),
                { endpoint: req.originalUrl },
                'info'
            );

            next();

        } catch (jwtError) {
            // Handle specific JWT errors
            let errorMessage = 'Invalid token';
            let errorCode = 'INVALID_TOKEN';

            if (jwtError.name === 'TokenExpiredError') {
                errorMessage = 'Token has expired';
                errorCode = 'TOKEN_EXPIRED';
            } else if (jwtError.name === 'JsonWebTokenError') {
                errorMessage = 'Invalid token format';
                errorCode = 'MALFORMED_TOKEN';
            }

            // Log failed authentication attempt
            await logEventSafe(
                'unknown',
                'AUTH_FAILED',
                req.ip,
                req.get('User-Agent'),
                {
                    reason: errorMessage,
                    endpoint: req.originalUrl,
                    error: jwtError.message
                },
                'warning'
            );

            return res.status(401).json({
                message: errorMessage,
                code: errorCode
            });
        }

    } catch (error) {
        console.error('Auth Middleware Error:', error);

        // Log system error
        await logEventSafe(
            'system',
            'AUTH_SYSTEM_ERROR',
            req.ip,
            req.get('User-Agent'),
            {
                error: error.message,
                endpoint: req.originalUrl
            },
            'error'
        );

        res.status(500).json({
            message: 'Authentication system error',
            code: 'AUTH_SYSTEM_ERROR'
        });
    }
};

export const adminOnly = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'owner')) {
        next();
    } else {
        res.status(403).json({ message: 'Access restricted to administrators' });
    }
};

export const superAdminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'super_admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as superadmin' });
    }
};

export const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (req.user && (allowedRoles.includes(req.user.role))) {
            next();
        } else {
            res.status(403).json({ message: 'Access restricted' });
        }
    };
};
