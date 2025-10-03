/**
 * Global error handler for API responses
 * Provides consistent error formatting and logging
 */

export class APIError extends Error {
  constructor(message, statusCode = 500, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends APIError {
  constructor(message, field = null) {
    super(message, 400, 'VALIDATION_ERROR', { field });
  }
}

export class NotFoundError extends APIError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends APIError {
  constructor(message = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends APIError {
  constructor(message = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends APIError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

export class DatabaseError extends APIError {
  constructor(message = 'Database operation failed', originalError = null) {
    super(message, 500, 'DATABASE_ERROR', { originalError: originalError?.message });
  }
}

/**
 * Format error response for API
 */
export function formatErrorResponse(error, req = null) {
  const timestamp = new Date().toISOString();
  
  // Development vs Production error details
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const response = {
    success: false,
    error: {
      message: error.message || 'Internal server error',
      code: error.code || 'INTERNAL_ERROR',
      timestamp
    }
  };

  // Add additional details in development
  if (isDevelopment) {
    response.error.stack = error.stack;
    response.error.details = error.details;
    if (req) {
      response.error.request = {
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
        body: req.body
      };
    }
  }

  // Add details for operational errors
  if (error.isOperational && error.details) {
    response.error.details = error.details;
  }

  return response;
}

/**
 * Log error with context
 */
export function logError(error, req = null, additional = {}) {
  const timestamp = new Date().toISOString();
  const errorLog = {
    timestamp,
    message: error.message,
    code: error.code,
    stack: error.stack,
    statusCode: error.statusCode,
    ...additional
  };

  if (req) {
    errorLog.request = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      user: req.user?.id || 'anonymous'
    };
  }

  console.error('🚨 API Error:', JSON.stringify(errorLog, null, 2));
}

/**
 * Express error handler middleware
 */
export function globalErrorHandler(error, req, res, next) {
  // Log the error
  logError(error, req);

  // Set default error
  let apiError = error;

  // Convert non-API errors to API errors
  if (!(error instanceof APIError)) {
    // Handle specific error types
    if (error.name === 'ValidationError') {
      apiError = new ValidationError(error.message);
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      apiError = new DatabaseError(`Database table is missing: ${error.message}`);
    } else if (error.code === 'ER_DUP_ENTRY') {
      apiError = new ConflictError('Duplicate entry detected');
    } else if (error.code === 'ECONNREFUSED') {
      apiError = new DatabaseError('Database connection failed');
    } else {
      apiError = new APIError(error.message || 'Internal server error');
    }
  }

  // Format and send response
  const response = formatErrorResponse(apiError, req);
  res.status(apiError.statusCode || 500).json(response);
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validation helper
 */
export function validateRequired(obj, requiredFields) {
  const missing = [];
  
  for (const field of requiredFields) {
    if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
      missing.push(field);
    }
  }
  
  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
  }
}

/**
 * Database operation wrapper with error handling
 */
export async function handleDbOperation(operation, context = 'Database operation') {
  try {
    return await operation();
  } catch (error) {
    // Log the original database error
    console.error(`Database Error in ${context}:`, error);
    
    // Transform database errors to API errors
    if (error.code === 'ER_NO_SUCH_TABLE') {
      throw new DatabaseError(`Required database table is missing`);
    } else if (error.code === 'ER_DUP_ENTRY') {
      throw new ConflictError('This record already exists');
    } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      throw new ValidationError('Referenced record does not exist');
    } else if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      throw new ConflictError('Cannot delete record - it is referenced by other records');
    } else if (error.code === 'ECONNREFUSED') {
      throw new DatabaseError('Database connection failed');
    } else {
      throw new DatabaseError(`${context} failed`);
    }
  }
}

/**
 * Success response helper
 */
export function successResponse(data = null, message = 'Success', meta = {}) {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString(),
    ...meta
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return response;
}