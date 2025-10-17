/**
 * Two-Factor Authentication (2FA) API Service
 * Handles all 2FA-related API calls
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

class TwoFactorAPI {
    constructor() {
        this.apiClient = axios.create({
            baseURL: `${API_BASE_URL}/api/auth`,
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Request interceptor - add auth token
        this.apiClient.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers['Authorization'] = `Bearer ${token}`;
                }

                console.log(`🔄 2FA API Request: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                console.error('❌ 2FA Request error:', error);
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.apiClient.interceptors.response.use(
            (response) => {
                console.log(`✅ 2FA API Response: ${response.status} ${response.config.url}`);
                return response;
            },
            (error) => {
                const errorMessage = error.response?.data?.error || error.message;
                console.error(`❌ 2FA API Error: ${error.response?.status || 'Network'} - ${errorMessage}`);
                return Promise.reject(error);
            }
        );
    }

    /**
     * Setup 2FA - Generate QR code and secret
     * @returns {Promise<Object>} QR code, secret, and backup codes
     */
    async setup2FA() {
        try {
            const response = await this.apiClient.get('/2fa/setup');
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return this.handleError(error, 'Failed to setup 2FA');
        }
    }

    /**
     * Verify and enable 2FA with TOTP token
     * @param {string} token - 6-digit TOTP token from authenticator app
     * @returns {Promise<Object>} Success status
     */
    async verifyAndEnable2FA(token) {
        try {
            const response = await this.apiClient.post('/2fa/verify-setup', { token });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return this.handleError(error, 'Failed to verify 2FA token');
        }
    }

    /**
     * Verify 2FA token during login
     * @param {string} token - 6-digit TOTP token or 8-character backup code
     * @param {string} sessionToken - Temporary session token from login
     * @returns {Promise<Object>} JWT token and user data
     */
    async verify2FALogin(token, sessionToken) {
        try {
            const response = await this.apiClient.post('/2fa/verify', {
                token,
                sessionToken
            });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return this.handleError(error, 'Failed to verify 2FA token');
        }
    }

    /**
     * Get 2FA status for current user
     * @returns {Promise<Object>} 2FA status and backup codes remaining
     */
    async get2FAStatus() {
        try {
            const response = await this.apiClient.get('/2fa/status');
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return this.handleError(error, 'Failed to get 2FA status');
        }
    }

    /**
     * Disable 2FA (requires password)
     * @param {string} password - Current password
     * @returns {Promise<Object>} Success status
     */
    async disable2FA(password) {
        try {
            const response = await this.apiClient.post('/2fa/disable', { password });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return this.handleError(error, 'Failed to disable 2FA');
        }
    }

    /**
     * Regenerate backup codes (requires password)
     * @param {string} password - Current password
     * @returns {Promise<Object>} New backup codes
     */
    async regenerateBackupCodes(password) {
        try {
            const response = await this.apiClient.post('/2fa/regenerate-backup-codes', { password });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return this.handleError(error, 'Failed to regenerate backup codes');
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

        const errorCode = data?.code || 'UNKNOWN_ERROR';
        const errorMessage = data?.error || data?.message || error.message || defaultMessage;
        const statusCode = response?.status || 0;

        console.error(`❌ 2FA API Error:`, {
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
     * Validate TOTP token format
     * @param {string} token - Token to validate
     * @returns {Object} Validation result
     */
    validateTOTPToken(token) {
        if (!token) {
            return { valid: false, error: 'Verification code is required' };
        }

        if (token.length !== 6) {
            return { valid: false, error: 'Verification code must be 6 digits' };
        }

        if (!/^\d{6}$/.test(token)) {
            return { valid: false, error: 'Verification code must contain only numbers' };
        }

        return { valid: true };
    }

    /**
     * Validate backup code format
     * @param {string} code - Backup code to validate
     * @returns {Object} Validation result
     */
    validateBackupCode(code) {
        if (!code) {
            return { valid: false, error: 'Backup code is required' };
        }

        if (code.length !== 8) {
            return { valid: false, error: 'Backup code must be 8 characters' };
        }

        if (!/^[A-Z0-9]{8}$/i.test(code)) {
            return { valid: false, error: 'Invalid backup code format' };
        }

        return { valid: true };
    }

    /**
     * Check if input is TOTP token or backup code
     * @param {string} input - User input
     * @returns {string} 'totp', 'backup', or 'invalid'
     */
    detectInputType(input) {
        if (!input) return 'invalid';

        const cleaned = input.replace(/\s+/g, '').toUpperCase();

        if (/^\d{6}$/.test(cleaned)) {
            return 'totp';
        }

        if (/^[A-Z0-9]{8}$/.test(cleaned)) {
            return 'backup';
        }

        return 'invalid';
    }
}

// Export singleton instance
const twoFactorAPI = new TwoFactorAPI();
export default twoFactorAPI;
