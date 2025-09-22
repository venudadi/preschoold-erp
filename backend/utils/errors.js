/**
 * Centralized Error Handling System for School ERP
 * Compliant with educational data protection standards
 */

import { logSecurityEvent } from './security.js';

// Custom Error Classes for Educational System
export class SchoolERPError extends Error {
    constructor(message, statusCode, code, details = {}) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.timestamp = new Date().toISOString();
        this.isOperational = true; // Distinguishes from programming errors

        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends SchoolERPError {
    constructor(message, field, value = null) {
        super(message, 400, 'VALIDATION_ERROR', {
            field,
            value: value ? '[REDACTED]' : null // Never log sensitive data
        });
    }
}

export class AuthenticationError extends SchoolERPError {
    constructor(message, code = 'AUTH_FAILED') {
        super(message, 401, code);
    }
}

export class AuthorizationError extends SchoolERPError {
    constructor(message, requiredRole = null, action = null) {
        super(message, 403, 'AUTHORIZATION_ERROR', {
            requiredRole,
            action
        });
    }
}

export class DatabaseError extends SchoolERPError {
    constructor(message, originalError = null) {
        super(message, 500, 'DATABASE_ERROR', {
            originalError: originalError?.code || 'Unknown'
        });
    }
}

export class StudentDataError extends SchoolERPError {
    constructor(message, studentId = null, action = null) {
        super(message, 400, 'STUDENT_DATA_ERROR', {
            studentId,
            action
        });
    }
}

export class COPPAViolationError extends SchoolERPError {
    constructor(message, childAge = null) {
        super(message, 403, 'COPPA_VIOLATION', {
            childAge,
            regulation: 'COPPA'
        });
    }
}

export class FERPAViolationError extends SchoolERPError {
    constructor(message, recordType = null) {
        super(message, 403, 'FERPA_VIOLATION', {
            recordType,
            regulation: 'FERPA'
        });
    }
}

// Async error wrapper for route handlers
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Database error handler with specific error type detection
export const handleDatabaseError = (error, operation = 'unknown') => {
    const commonErrors = {
        'ER_DUP_ENTRY': {
            message: 'A record with this information already exists',
            statusCode: 409,
            code: 'DUPLICATE_ENTRY'
        },
        'ER_NO_REFERENCED_ROW_2': {
            message: 'Referenced record does not exist',
            statusCode: 400,
            code: 'INVALID_REFERENCE'
        },
        'ER_ROW_IS_REFERENCED_2': {
            message: 'Cannot delete record as it is referenced by other records',
            statusCode: 409,
            code: 'REFERENCE_CONSTRAINT'
        },
        'ER_BAD_NULL_ERROR': {
            message: 'Required field cannot be empty',
            statusCode: 400,
            code: 'REQUIRED_FIELD_MISSING'
        },
        'ER_DATA_TOO_LONG': {
            message: 'Data exceeds maximum allowed length',
            statusCode: 400,
            code: 'DATA_TOO_LONG'
        },
        'ER_ACCESS_DENIED_ERROR': {
            message: 'Database access denied',
            statusCode: 500,
            code: 'DATABASE_ACCESS_ERROR'
        },
        'ECONNREFUSED': {
            message: 'Database connection failed',
            statusCode: 503,
            code: 'DATABASE_UNAVAILABLE'
        }
    };

    const errorInfo = commonErrors[error.code] || {
        message: 'Database operation failed',
        statusCode: 500,
        code: 'DATABASE_ERROR'
    };

    throw new DatabaseError(errorInfo.message, error);
};

// Validation error aggregator
export const createValidationError = (errors) => {
    const formattedErrors = errors.map(error => ({
        field: error.path || error.param,
        message: error.msg || error.message,
        value: '[REDACTED]' // Never expose actual values
    }));

    const error = new ValidationError('Validation failed');
    error.details.fields = formattedErrors;
    return error;
};

// Age validation for COPPA compliance
export const validateChildAge = (dateOfBirth, minAge = 0, maxAge = 18) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    if (age < minAge || age > maxAge) {
        throw new StudentDataError(
            `Student age must be between ${minAge} and ${maxAge} years`,
            null,
            'age_validation'
        );
    }

    // COPPA compliance check for children under 13
    if (age < 13) {
        throw new COPPAViolationError(
            'Special parental consent required for children under 13',
            age
        );
    }

    return age;
};

// Educational record access validation for FERPA compliance
export const validateEducationalRecordAccess = (userRole, studentData, requestedData) => {
    const sensitiveFields = [
        'social_security_number',
        'medical_information',
        'disciplinary_records',
        'family_income',
        'psychological_evaluations'
    ];

    const authorizedRoles = ['super_admin', 'admin', 'teacher', 'academic_coordinator'];

    if (!authorizedRoles.includes(userRole)) {
        throw new FERPAViolationError(
            'Unauthorized access to educational records',
            'student_record'
        );
    }

    // Check if requesting sensitive data
    const requestedSensitiveFields = Object.keys(requestedData)
        .filter(field => sensitiveFields.includes(field));

    if (requestedSensitiveFields.length > 0 && !['super_admin', 'admin'].includes(userRole)) {
        throw new FERPAViolationError(
            'Insufficient privileges to access sensitive educational records',
            'sensitive_record'
        );
    }
};

// Global error handler middleware
export const globalErrorHandler = async (error, req, res, next) => {
    // Log error for monitoring
    console.error('Error occurred:', {
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        user: req.user?.id || 'anonymous',
        ip: req.ip
    });

    // Log security events for audit trail
    try {
        await logSecurityEvent(
            req.user?.id || 'system',
            'ERROR_OCCURRED',
            req.ip,
            req.get('User-Agent'),
            {
                errorCode: error.code || 'UNKNOWN_ERROR',
                errorMessage: error.message,
                endpoint: req.originalUrl,
                method: req.method
            },
            'error'
        );
    } catch (logError) {
        console.error('Failed to log security event:', logError);
    }

    // Handle different error types
    if (error instanceof SchoolERPError) {
        // Custom application errors
        return res.status(error.statusCode).json({
            success: false,
            error: {
                message: error.message,
                code: error.code,
                timestamp: error.timestamp,
                ...(process.env.NODE_ENV === 'development' && { details: error.details })
            }
        });
    }

    // Handle validation errors from express-validator
    if (error.type === 'validation') {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                fields: error.details
            }
        });
    }

    // Handle JWT errors
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Authentication failed',
                code: 'TOKEN_ERROR'
            }
        });
    }

    // Handle database connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return res.status(503).json({
            success: false,
            error: {
                message: 'Service temporarily unavailable',
                code: 'SERVICE_UNAVAILABLE'
            }
        });
    }

    // Default server error
    res.status(500).json({
        success: false,
        error: {
            message: 'Internal server error',
            code: 'INTERNAL_SERVER_ERROR',
            ...(process.env.NODE_ENV === 'development' && {
                details: error.message,
                stack: error.stack
            })
        }
    });
};

// 404 handler for undefined routes
export const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            message: 'Route not found',
            code: 'ROUTE_NOT_FOUND',
            path: req.originalUrl
        }
    });
};

export default {
    SchoolERPError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    DatabaseError,
    StudentDataError,
    COPPAViolationError,
    FERPAViolationError,
    asyncHandler,
    handleDatabaseError,
    createValidationError,
    validateChildAge,
    validateEducationalRecordAccess,
    globalErrorHandler,
    notFoundHandler
};