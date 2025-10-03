/**
 * Backend Optimization Package
 * Implements: Compression, Pagination, Rate Limiting, Performance Monitoring
 */

import compression from 'compression';
import rateLimit from 'express-rate-limit';

// 1. Response Compression (gzip)
export const compressionMiddleware = compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
    level: 6, // Balance between compression and speed
    threshold: 1024 // Only compress responses > 1KB
});

// 2. Rate Limiting
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // 5 login attempts per 15 minutes
    skipSuccessfulRequests: true,
    message: 'Too many login attempts, please try again later.'
});

// 3. Pagination Helper
export class PaginationHelper {
    static paginate(query, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        return {
            limit: parseInt(limit),
            offset: parseInt(offset)
        };
    }

    static formatResponse(data, total, page, limit) {
        const totalPages = Math.ceil(total / limit);
        return {
            data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(total),
                totalPages,
                hasMore: page < totalPages
            }
        };
    }
}

// 4. Performance Monitoring Middleware
export const performanceMonitor = (req, res, next) => {
    const startTime = Date.now();

    // Track response
    res.on('finish', () => {
        const duration = Date.now() - startTime;

        // Log slow requests
        if (duration > 1000) {
            console.warn(`⚠️  Slow request: ${req.method} ${req.path} took ${duration}ms`);
        }

        // Log to metrics (you can store this in DB or send to monitoring service)
        if (global.performanceMetrics) {
            global.performanceMetrics.push({
                method: req.method,
                path: req.path,
                duration,
                status: res.statusCode,
                timestamp: new Date()
            });
        }
    });

    next();
};

// 5. Request Logger with useful info
export const requestLogger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const { method, path, ip } = req;
    const userAgent = req.get('user-agent') || 'unknown';

    console.log(`[${timestamp}] ${method} ${path} - IP: ${ip.split(':').pop()} - ${userAgent.substring(0, 50)}`);
    next();
};

// 6. Error Tracking
export const errorTracker = (err, req, res, next) => {
    const errorLog = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        error: err.message,
        stack: err.stack,
        user: req.user?.id || 'anonymous'
    };

    // Log to console
    console.error('❌ Error:', errorLog);

    // In production, send to error tracking service (Sentry, etc.)
    // sentry.captureException(err);

    res.status(500).json({
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
};

// 7. Health Check Endpoint
export const healthCheck = (req, res) => {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    res.json({
        status: 'healthy',
        uptime: Math.floor(uptime),
        timestamp: new Date().toISOString(),
        memory: {
            heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
            rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`
        }
    });
};

// Initialize global metrics array
if (!global.performanceMetrics) {
    global.performanceMetrics = [];
}

export default {
    compressionMiddleware,
    apiLimiter,
    authLimiter,
    PaginationHelper,
    performanceMonitor,
    requestLogger,
    errorTracker,
    healthCheck
};
