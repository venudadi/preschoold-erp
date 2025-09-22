// --- Rate Limiting Middleware ---
import rateLimit from 'express-rate-limit';

// General API rate limiter: 100 requests per 15 minutes per IP
const api = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.'
});

// Auth endpoints: stricter (10 requests per 15 minutes per IP)
const auth = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many login attempts, please try again later.'
});

// Invoice endpoints: moderate (30 requests per 15 minutes per IP)
const invoice = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many invoice actions, please try again later.'
});

// (Removed duplicate export of rateLimiters)
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';
import { checkRole } from '../authMiddleware.js';
// Role-based access middleware for route protection
export const requireRole = (roles) => checkRole(roles);

/**
 * Security middleware collection for enhanced protection
 */

// Rate limiting configurations
export const createRateLimiter = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: { error: message },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(429).json({
                error: message,
                retryAfter: Math.round(windowMs / 1000)
            });
        }
    });
};

// Different rate limits for different endpoints
export const rateLimiters = {
    // Strict rate limiting for authentication endpoints
    auth: createRateLimiter(
        15 * 60 * 1000, // 15 minutes
        5, // limit each IP to 5 requests per windowMs
        'Too many authentication attempts, please try again later'
    ),
    
    // General API rate limiting
    api: createRateLimiter(
        15 * 60 * 1000, // 15 minutes
        100, // limit each IP to 100 requests per windowMs
        'Too many requests, please try again later'
    ),
    
    // Strict rate limiting for parent registration
    parentRegistration: createRateLimiter(
        60 * 60 * 1000, // 1 hour
        3, // limit each IP to 3 registration attempts per hour
        'Too many registration attempts, please try again later'
    ),
    
    // File upload rate limiting
    fileUpload: createRateLimiter(
        15 * 60 * 1000, // 15 minutes
        10, // limit each IP to 10 file uploads per windowMs
        'Too many file upload attempts, please try again later'
    ),

    // Invoice endpoints: moderate (30 requests per 15 minutes per IP)
    invoice: createRateLimiter(
        15 * 60 * 1000, // 15 minutes
        30, // limit each IP to 30 invoice actions per windowMs
        'Too many invoice actions, please try again later.'
    )
};

// Helmet configuration for security headers
export const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
});

// Input validation middleware
export const validateInput = (validations) => {
    return async (req, res, next) => {
        // Run all validations
        await Promise.all(validations.map(validation => validation.run(req)));
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }
        
        next();
    };
};

// Common validation rules
export const validationRules = {
    email: body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    
    password: body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
    
    phone: body('phone')
        .isMobilePhone('en-IN')
        .withMessage('Please provide a valid Indian mobile number'),
    
    name: body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name can only contain letters and spaces'),
    
    childVerificationCode: body('childVerificationCode')
        .isLength({ min: 8, max: 8 })
        .withMessage('Child verification code must be exactly 8 characters')
        .isAlphanumeric()
        .withMessage('Child verification code can only contain letters and numbers')
};

// Audit logging middleware
export const auditLogger = (action, entity) => {
    return (req, res, next) => {
        const originalSend = res.send;
        
        res.send = function(data) {
            // Log the action after response is sent
            setImmediate(() => {
                const logData = {
                    timestamp: new Date().toISOString(),
                    action,
                    entity,
                    userId: req.user?.id || 'anonymous',
                    userRole: req.user?.role || 'unknown',
                    ip: req.ip || req.connection.remoteAddress,
                    userAgent: req.get('User-Agent'),
                    method: req.method,
                    url: req.originalUrl,
                    statusCode: res.statusCode,
                    responseTime: Date.now() - req.startTime
                };
                
                // In production, this should go to a secure logging service
                console.log('AUDIT LOG:', JSON.stringify(logData));
                
                // TODO: Implement secure logging to database or external service
                // await auditLogService.log(logData);
            });
            
            originalSend.call(this, data);
        };
        
        req.startTime = Date.now();
        next();
    };
};

// CORS configuration for parent portal
export const corsConfig = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
};

// Security headers middleware
export const securityHeaders = (req, res, next) => {
    // Remove server information
    res.removeHeader('X-Powered-By');
    
    // Add custom security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    next();
};

// Input sanitization middleware
export const sanitizeInput = (req, res, next) => {
    // Recursively sanitize all string inputs
    const sanitize = (obj) => {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                // Basic XSS protection - remove script tags and dangerous patterns
                obj[key] = obj[key]
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+="[^"]*"/gi, '')
                    .trim();
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitize(obj[key]);
            }
        }
    };
    
    if (req.body) sanitize(req.body);
    if (req.query) sanitize(req.query);
    if (req.params) sanitize(req.params);
    
    next();
};

export default {
    rateLimiters,
    helmetConfig,
    validateInput,
    validationRules,
    auditLogger,
    corsConfig,
    securityHeaders,
    sanitizeInput
    // Note: requireRole is exported above, not as part of default
};