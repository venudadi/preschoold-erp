/**
 * Challenge Code Generator for Password Reset
 * Generates secure, user-friendly verification codes
 */

import crypto from 'crypto';

class ChallengeCodeGenerator {
    constructor() {
        // Exclude confusing characters (0, O, I, 1, etc.)
        this.charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        this.codeLength = 6;
    }

    /**
     * Generate a 6-character challenge code
     * @returns {string} Challenge code (e.g., "A3B7K9")
     */
    generateChallengeCode() {
        let code = '';
        const bytes = crypto.randomBytes(this.codeLength * 2);

        for (let i = 0; i < this.codeLength; i++) {
            const randomIndex = bytes[i] % this.charset.length;
            code += this.charset[randomIndex];
        }

        return code;
    }

    /**
     * Generate a secure reset token
     * @returns {string} 64-character hex string
     */
    generateResetToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Generate a unique ID for the reset request
     * @returns {string} UUID-like string
     */
    generateResetId() {
        const timestamp = Date.now().toString(36);
        const randomPart = crypto.randomBytes(8).toString('hex');
        return `reset_${timestamp}_${randomPart}`;
    }

    /**
     * Validate challenge code format
     * @param {string} code - Code to validate
     * @returns {boolean} True if valid format
     */
    validateChallengeCodeFormat(code) {
        if (!code || typeof code !== 'string') {
            return false;
        }

        // Check length
        if (code.length !== this.codeLength) {
            return false;
        }

        // Check if all characters are in our charset
        for (let char of code.toUpperCase()) {
            if (!this.charset.includes(char)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Calculate expiration timestamp
     * @param {number} minutes - Minutes from now
     * @returns {Date} Expiration date
     */
    calculateExpiration(minutes = 15) {
        return new Date(Date.now() + (minutes * 60 * 1000));
    }

    /**
     * Check if a timestamp is expired
     * @param {Date} expirationDate - Date to check
     * @returns {boolean} True if expired
     */
    isExpired(expirationDate) {
        return new Date() > new Date(expirationDate);
    }

    /**
     * Generate a temporary password for emergency resets
     * @param {number} length - Password length
     * @returns {string} Temporary password
     */
    generateTemporaryPassword(length = 12) {
        const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
        let password = '';

        const bytes = crypto.randomBytes(length * 2);
        for (let i = 0; i < length; i++) {
            const randomIndex = bytes[i] % charset.length;
            password += charset[randomIndex];
        }

        return password;
    }

    /**
     * Mask email for security display
     * @param {string} email - Email to mask
     * @returns {string} Masked email (e.g., "j***@example.com")
     */
    maskEmail(email) {
        if (!email || !email.includes('@')) {
            return '***@***.***';
        }

        const [localPart, domain] = email.split('@');
        if (localPart.length <= 1) {
            return `*@${domain}`;
        }

        const maskedLocal = localPart[0] + '*'.repeat(localPart.length - 1);
        return `${maskedLocal}@${domain}`;
    }

    /**
     * Generate rate limiting key
     * @param {string} ip - IP address
     * @param {string} email - Email address
     * @returns {string} Rate limiting key
     */
    generateRateLimitKey(ip, email) {
        return `reset_rate_${ip}_${crypto.createHash('sha256').update(email).digest('hex').substring(0, 8)}`;
    }
}

// Export singleton instance
const challengeCodeGenerator = new ChallengeCodeGenerator();
export default challengeCodeGenerator;