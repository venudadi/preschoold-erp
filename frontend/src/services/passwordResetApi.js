/**
 * Password Reset API Service
 * Handles forgot password API calls
 */

import axios from 'axios';
import { apiCall, handleApiResponse, APIError } from '../utils/errorHandler.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

class PasswordResetAPI {
    constructor() {
        this.apiClient = axios.create({
            baseURL: `${API_BASE_URL}/api/auth`,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Request interceptor
        this.apiClient.interceptors.request.use(
            (config) => {
                console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                console.error('❌ Request interceptor error:', error);
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.apiClient.interceptors.response.use(
            (response) => {
                console.log(`✅ API Response: ${response.status} ${response.config.url}`);
                return response;
            },
            (error) => {
                const errorMessage = error.response?.data?.error || error.message;
                console.error(`❌ API Error: ${error.response?.status || 'Network'} - ${errorMessage}`);
                return Promise.reject(error);
            }
        );
    }

    /**
     * Request password reset - sends challenge code to email
     * @param {string} email - User's email address
     * @returns {Promise<Object>} API response
     */
    async requestPasswordReset(email) {
        try {
            const response = await this.apiClient.post('/forgot-password', { email });
            return {
                success: true,
                data: response.data,
                resetId: response.data.resetId,
                maskedEmail: response.data.maskedEmail
            };
        } catch (error) {
            return this.handleError(error, 'Failed to request password reset');
        }
    }

    /**
     * Verify challenge code from email
     * @param {string} email - User's email address
     * @param {string} challengeCode - 6-character challenge code
     * @param {string} resetId - Reset session ID
     * @returns {Promise<Object>} API response
     */
    async verifyResetCode(email, challengeCode, resetId) {
        try {
            const response = await this.apiClient.post('/verify-reset-code', {
                email,
                challengeCode: challengeCode.toUpperCase(),
                resetId
            });
            return {
                success: true,
                data: response.data,
                resetToken: response.data.resetToken,
                userName: response.data.userName
            };
        } catch (error) {
            return this.handleError(error, 'Failed to verify challenge code');
        }
    }

    /**
     * Reset password with verified token
     * @param {string} email - User's email address
     * @param {string} newPassword - New password
     * @param {string} resetToken - Verified reset token
     * @param {string} resetId - Reset session ID
     * @returns {Promise<Object>} API response
     */
    async resetPassword(email, newPassword, resetToken, resetId) {
        try {
            const response = await this.apiClient.post('/reset-password', {
                email,
                newPassword,
                resetToken,
                resetId
            });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return this.handleError(error, 'Failed to reset password');
        }
    }

    /**
     * Get reset session status
     * @param {string} resetId - Reset session ID
     * @returns {Promise<Object>} API response
     */
    async getResetStatus(resetId) {
        try {
            const response = await this.apiClient.get(`/reset-status/${resetId}`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return this.handleError(error, 'Failed to get reset status');
        }
    }

    /**
     * Test email configuration (development only)
     * @param {string} email - Test email address
     * @returns {Promise<Object>} API response
     */
    async testEmail(email) {
        if (import.meta.env.MODE === 'production') {
            return {
                success: false,
                error: 'Test email not available in production'
            };
        }

        try {
            const response = await this.apiClient.post('/test-email', { email });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return this.handleError(error, 'Failed to send test email');
        }
    }

    /**
     * Handle API errors consistently
     * @param {Error} error - Axios error object
     * @param {string} defaultMessage - Default error message
     * @returns {Object} Standardized error response
     */
    handleError(error, defaultMessage) {
        const response = error.response;
        const data = response?.data;

        // Extract error information
        const errorCode = data?.code || 'UNKNOWN_ERROR';
        const errorMessage = data?.error || error.message || defaultMessage;
        const statusCode = response?.status || 0;

        // Log error for debugging
        console.error(`❌ Password Reset API Error:`, {
            code: errorCode,
            message: errorMessage,
            status: statusCode,
            url: error.config?.url
        });

        return {
            success: false,
            error: errorMessage,
            code: errorCode,
            status: statusCode,
            details: data?.details || null
        };
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {Object} Validation result
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            return { valid: false, error: 'Email address is required' };
        }

        if (!emailRegex.test(email)) {
            return { valid: false, error: 'Please enter a valid email address' };
        }

        if (email.length > 255) {
            return { valid: false, error: 'Email address is too long' };
        }

        return { valid: true };
    }

    /**
     * Validate challenge code format
     * @param {string} code - Challenge code to validate
     * @returns {Object} Validation result
     */
    validateChallengeCode(code) {
        if (!code) {
            return { valid: false, error: 'Verification code is required' };
        }

        if (code.length !== 6) {
            return { valid: false, error: 'Verification code must be 6 characters' };
        }

        if (!/^[A-Z0-9]{6}$/.test(code.toUpperCase())) {
            return { valid: false, error: 'Verification code must contain only letters and numbers' };
        }

        return { valid: true };
    }

    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {Object} Validation result with strength score
     */
    validatePassword(password) {
        if (!password) {
            return { valid: false, error: 'Password is required', strength: 0 };
        }

        if (password.length < 8) {
            return { valid: false, error: 'Password must be at least 8 characters long', strength: 0 };
        }

        if (password.length > 128) {
            return { valid: false, error: 'Password must be less than 128 characters', strength: 0 };
        }

        // Check password strength
        let strength = 0;
        let strengthText = 'Weak';

        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;
        if (password.length >= 12) strength++;

        switch (strength) {
            case 0:
            case 1:
                strengthText = 'Very Weak';
                break;
            case 2:
                strengthText = 'Weak';
                break;
            case 3:
                strengthText = 'Fair';
                break;
            case 4:
                strengthText = 'Good';
                break;
            case 5:
                strengthText = 'Strong';
                break;
        }

        const isValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);

        return {
            valid: isValid,
            error: isValid ? null : 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
            strength: strength,
            strengthText: strengthText
        };
    }
}

// Export singleton instance
const passwordResetAPI = new PasswordResetAPI();
export default passwordResetAPI;