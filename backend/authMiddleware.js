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

            // Validate session
            const session = await validateSession(req.headers['x-session-token']);
            if (!session) {
                throw new Error('Invalid session');
            }

            // Validate CSRF token for non-GET requests
            if (req.method !== 'GET') {
                const csrfToken = req.headers['x-csrf-token'];
                if (!csrfToken || !(await validateCSRFToken(csrfToken, decoded.id))) {
                    throw new Error('Invalid CSRF token');
                }
            }

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
    if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as admin' });
    }
};

export const superAdminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'superadmin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as superadmin' });
    }
};
