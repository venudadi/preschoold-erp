import jwt from 'jsonwebtoken';
import { validateSession, validateCSRFToken } from './utils/security.js';

export const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
            
            // Verify JWT token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            
            // For now, skip session validation to keep authentication simple
            // TODO: Implement proper session management later
            
            // Skip session validation for super_admin and basic auth for now
            if (decoded.role === 'super_admin' || true) { // Temporarily allow all roles
                return next();
            }

            // Optional: Validate session (currently disabled)
            // const session = await validateSession(req.headers['x-session-token']);
            // if (!session) {
            //     throw new Error('Invalid session');
            // }

            // Optional: Validate CSRF token for non-GET requests (currently disabled)
            // if (req.method !== 'GET') {
            //     const csrfToken = req.headers['x-csrf-token'];
            //     if (!csrfToken || !(await validateCSRFToken(csrfToken, decoded.id))) {
            //         throw new Error('Invalid CSRF token');
            //     }
            // }

            next();
        } else {
            throw new Error('No token provided');
        }
    } catch (error) {
        console.error('Auth Error:', error.message);
        res.status(401).json({ message: 'Not authorized - ' + error.message });
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
