import crypto from 'crypto';
import CryptoJS from 'crypto-js';

// Encryption configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here!'; // Should be 32 characters
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Field-level encryption for sensitive PII data
 */
class DataEncryption {
    constructor() {
        this.secretKey = ENCRYPTION_KEY;
        if (this.secretKey.length !== 32) {
            throw new Error('ENCRYPTION_KEY must be exactly 32 characters long');
        }
    }

    /**
     * Encrypt sensitive data
     * @param {string} text - The text to encrypt
     * @returns {string} - Encrypted text with IV and auth tag
     */
    encrypt(text) {
        if (!text || typeof text !== 'string') return text;
        
        try {
            const iv = crypto.randomBytes(IV_LENGTH);
            const cipher = crypto.createCipher(ALGORITHM, this.secretKey);
            cipher.setAAD(Buffer.from('additional-auth-data')); // Additional authenticated data
            
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const authTag = cipher.getAuthTag();
            
            // Combine IV, auth tag, and encrypted data
            return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Failed to encrypt data');
        }
    }

    /**
     * Decrypt sensitive data
     * @param {string} encryptedData - The encrypted data string
     * @returns {string} - Decrypted text
     */
    decrypt(encryptedData) {
        if (!encryptedData || typeof encryptedData !== 'string') return encryptedData;
        
        try {
            const parts = encryptedData.split(':');
            if (parts.length !== 3) {
                throw new Error('Invalid encrypted data format');
            }
            
            const iv = Buffer.from(parts[0], 'hex');
            const authTag = Buffer.from(parts[1], 'hex');
            const encrypted = parts[2];
            
            const decipher = crypto.createDecipher(ALGORITHM, this.secretKey);
            decipher.setAuthTag(authTag);
            decipher.setAAD(Buffer.from('additional-auth-data'));
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Failed to decrypt data');
        }
    }

    /**
     * Hash passwords securely
     * @param {string} password - Plain text password
     * @returns {string} - Hashed password
     */
    hashPassword(password) {
        const salt = crypto.randomBytes(32).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
        return `${salt}:${hash}`;
    }

    /**
     * Verify password against hash
     * @param {string} password - Plain text password
     * @param {string} hashedPassword - Stored hash
     * @returns {boolean} - True if password matches
     */
    verifyPassword(password, hashedPassword) {
        try {
            const [salt, hash] = hashedPassword.split(':');
            const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
            return hash === verifyHash;
        } catch (error) {
            console.error('Password verification error:', error);
            return false;
        }
    }

    /**
     * Generate secure random tokens
     * @param {number} length - Token length
     * @returns {string} - Random token
     */
    generateSecureToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Encrypt object with sensitive fields
     * @param {object} data - Object to encrypt
     * @param {array} sensitiveFields - Fields to encrypt
     * @returns {object} - Object with encrypted fields
     */
    encryptSensitiveFields(data, sensitiveFields = []) {
        const encryptedData = { ...data };
        
        sensitiveFields.forEach(field => {
            if (encryptedData[field]) {
                encryptedData[field] = this.encrypt(encryptedData[field]);
            }
        });
        
        return encryptedData;
    }

    /**
     * Decrypt object with sensitive fields
     * @param {object} data - Object to decrypt
     * @param {array} sensitiveFields - Fields to decrypt
     * @returns {object} - Object with decrypted fields
     */
    decryptSensitiveFields(data, sensitiveFields = []) {
        const decryptedData = { ...data };
        
        sensitiveFields.forEach(field => {
            if (decryptedData[field]) {
                try {
                    decryptedData[field] = this.decrypt(decryptedData[field]);
                } catch (error) {
                    console.warn(`Failed to decrypt field ${field}:`, error.message);
                    // Keep original value if decryption fails (for backward compatibility)
                }
            }
        });
        
        return decryptedData;
    }
}

// Sensitive field definitions for different entities
export const SENSITIVE_FIELDS = {
    PARENT: ['first_name', 'last_name', 'email', 'phone_number', 'address'],
    CHILD: ['first_name', 'last_name', 'medical_info', 'emergency_contact'],
    USER: ['first_name', 'last_name', 'email', 'phone_number'],
    ENQUIRY: ['parent_name', 'mobile_number', 'email', 'child_name']
};

// Create singleton instance
const encryption = new DataEncryption();

export default encryption;

// Helper functions for common operations
export const encryptPII = (data, entityType) => {
    const fields = SENSITIVE_FIELDS[entityType] || [];
    return encryption.encryptSensitiveFields(data, fields);
};

export const decryptPII = (data, entityType) => {
    const fields = SENSITIVE_FIELDS[entityType] || [];
    return encryption.decryptSensitiveFields(data, fields);
};

export const hashPassword = (password) => encryption.hashPassword(password);
export const verifyPassword = (password, hash) => encryption.verifyPassword(password, hash);
export const generateToken = (length) => encryption.generateSecureToken(length);