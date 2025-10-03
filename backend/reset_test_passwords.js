import pool from './db.js';
import bcrypt from 'bcrypt';

const TEST_PASSWORD = 'Test@123';

const testUsers = [
    'venudadi@outlook.com',
    'owner@test.com',
    'admintest@test.com',
    'director@test.com',
    'finance@test.com',
    'teachertest@test.com',
    'parenttest@test.com',
    'academic@test.com'
];

async function resetPasswords() {
    console.log('🔐 Resetting test user passwords...\n');

    try {
        const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 12);

        for (const email of testUsers) {
            try {
                const [result] = await pool.query(
                    'UPDATE users SET password_hash = ?, must_reset_password = 0, account_locked = 0, failed_login_attempts = 0 WHERE email = ?',
                    [hashedPassword, email]
                );

                if (result.affectedRows > 0) {
                    console.log(`✅ Reset password for: ${email}`);
                } else {
                    console.log(`⚠️  User not found: ${email}`);
                }
            } catch (error) {
                console.error(`❌ Error resetting ${email}:`, error.message);
            }
        }

        console.log(`\n✅ All passwords reset to: ${TEST_PASSWORD}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

resetPasswords();
