/**
 * Frontend API Error Handling Utilities
 * Provides consistent error handling for API calls
 */

export class APIError extends Error {
  constructor(message, statusCode = 500, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Handle API response and extract errors
 */
export async function handleApiResponse(response) {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = {
        error: {
          message: `HTTP ${response.status}: ${response.statusText}`,
          code: 'HTTP_ERROR'
        }
      };
    }

    const error = new APIError(
      errorData.error?.message || 'An unexpected error occurred',
      response.status,
      errorData.error?.code || 'API_ERROR',
      errorData.error?.details
    );

    throw error;
  }

  try {
    return await response.json();
  } catch (e) {
    // If response is not JSON, return the response object
    return { success: true, data: response };
  }
}

/**
 * Enhanced fetch wrapper with error handling
 */
export async function apiCall(url, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  // Add auth token if available
  const token = localStorage.getItem('token');
  if (token) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`;
  }

  const finalOptions = { ...defaultOptions, ...options };

  try {
    const response = await fetch(url, finalOptions);
    return await handleApiResponse(response);
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new APIError(
        'Network error. Please check your internet connection.',
        0,
        'NETWORK_ERROR'
      );
    }

    throw new APIError(
      error.message || 'An unexpected error occurred',
      500,
      'UNKNOWN_ERROR'
    );
  }
}

/**
 * Display user-friendly error messages
 */
export function getErrorMessage(error) {
  if (error instanceof APIError) {
    switch (error.code) {
      case 'VALIDATION_ERROR':
        return error.message || 'Please check your input and try again.';
      
      case 'UNAUTHORIZED':
        return 'You are not authorized to perform this action. Please log in.';
      
      case 'FORBIDDEN':
        return 'You do not have permission to access this resource.';
      
      case 'NOT_FOUND':
        return 'The requested resource was not found.';
      
      case 'CONFLICT':
        return error.message || 'This action conflicts with existing data.';
      
      case 'DATABASE_ERROR':
        return 'A database error occurred. Please try again later.';
      
      case 'NETWORK_ERROR':
        return 'Network connection failed. Please check your internet connection.';
      
      case 'TABLE_MISSING':
        return 'System configuration error. Please contact the administrator.';
      
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }

  return error.message || 'An unexpected error occurred. Please try again.';
}

/**
 * Toast notification helper
 */
export function showErrorToast(error, toastFunction = console.error) {
  const message = getErrorMessage(error);
  
  if (typeof toastFunction === 'function') {
    toastFunction(message, {
      type: 'error',
      duration: 5000,
      position: 'top-right'
    });
  } else {
    console.error('Error:', message, error);
  }
}

/**
 * Retry mechanism for failed API calls
 */
export async function retryApiCall(apiFunction, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiFunction();
    } catch (error) {
      lastError = error;
      
      // Don't retry for certain error types
      if (error instanceof APIError) {
        if ([400, 401, 403, 404, 422].includes(error.statusCode)) {
          throw error;
        }
      }
      
      if (attempt < maxRetries) {
        console.warn(`API call failed (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  
  throw lastError;
}

/**
 * Form validation helper
 */
export function validateForm(data, rules) {
  const errors = {};
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field];
    
    if (fieldRules.required && (!value || value.toString().trim() === '')) {
      errors[field] = `${fieldRules.label || field} is required`;
      continue;
    }
    
    if (value && fieldRules.type) {
      switch (fieldRules.type) {
        case 'email':
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors[field] = 'Please enter a valid email address';
          }
          break;
          
        case 'number':
          if (isNaN(value) || value < 0) {
            errors[field] = `${fieldRules.label || field} must be a valid positive number`;
          }
          break;
          
        case 'phone':
          if (!/^\+?[\d\s-()]+$/.test(value) || value.replace(/\D/g, '').length < 10) {
            errors[field] = 'Please enter a valid phone number';
          }
          break;
      }
    }
    
    if (value && fieldRules.minLength && value.toString().length < fieldRules.minLength) {
      errors[field] = `${fieldRules.label || field} must be at least ${fieldRules.minLength} characters`;
    }
    
    if (value && fieldRules.maxLength && value.toString().length > fieldRules.maxLength) {
      errors[field] = `${fieldRules.label || field} must not exceed ${fieldRules.maxLength} characters`;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Loading state manager
 */
export class LoadingManager {
  constructor() {
    this.loadingStates = new Map();
    this.listeners = new Set();
  }
  
  setLoading(key, isLoading) {
    this.loadingStates.set(key, isLoading);
    this.notifyListeners();
  }
  
  isLoading(key) {
    return this.loadingStates.get(key) || false;
  }
  
  isAnyLoading() {
    return Array.from(this.loadingStates.values()).some(Boolean);
  }
  
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.loadingStates));
  }
}

// Global loading manager instance
export const globalLoadingManager = new LoadingManager();

/**
 * React hook for API calls with error handling (if using React)
 */
export function useApiCall() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  
  const execute = React.useCallback(async (apiFunction, options = {}) => {
    const { 
      showErrorToast: showToast = true, 
      toastFunction = null,
      loadingKey = null 
    } = options;
    
    try {
      setLoading(true);
      setError(null);
      
      if (loadingKey) {
        globalLoadingManager.setLoading(loadingKey, true);
      }
      
      const result = await apiFunction();
      return result;
      
    } catch (err) {
      setError(err);
      
      if (showToast) {
        showErrorToast(err, toastFunction);
      }
      
      throw err;
      
    } finally {
      setLoading(false);
      
      if (loadingKey) {
        globalLoadingManager.setLoading(loadingKey, false);
      }
    }
  }, []);
  
  return { execute, loading, error };
}