
import pool from '../db.js';
import CryptoJS from 'crypto-js';

// Secret key for encryption/decryption (should be in .env, fallback for safety)
const ENCRYPTION_KEY = process.env.JWT_SECRET || 'fallback-secret-key-do-not-use-in-prod';

export const getSystemSettings = async () => {
    try {
        const [rows] = await pool.query('SELECT * FROM system_settings');
        const settings = {};
        
        rows.forEach(row => {
            let value = row.setting_value;
            
            // Decrypt if marked as encrypted
            if (row.is_encrypted && value) {
                try {
                    const bytes = CryptoJS.AES.decrypt(value, ENCRYPTION_KEY);
                    value = bytes.toString(CryptoJS.enc.Utf8);
                } catch (e) {
                    console.error(`Failed to decrypt setting ${row.setting_key}`, e);
                    value = ''; // Fail safe
                }
            }
            
            settings[row.setting_key] = value;
        });
        
        return settings;
    } catch (error) {
        console.error('Failed to fetch system settings:', error);
        return null;
    }
};

export const updateSystemSetting = async (key, value, isEncrypted = false, updatedBy = null) => {
    let storedValue = value;
    
    if (isEncrypted && value) {
        storedValue = CryptoJS.AES.encrypt(value, ENCRYPTION_KEY).toString();
    }
    
    await pool.query(
        `INSERT INTO system_settings (setting_key, setting_value, is_encrypted, updated_by)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         setting_value = VALUES(setting_value),
         is_encrypted = VALUES(is_encrypted),
         updated_by = VALUES(updated_by)`,
        [key, storedValue, isEncrypted, updatedBy]
    );
};
