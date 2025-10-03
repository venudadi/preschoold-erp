import bcrypt from 'bcrypt';
import pool from './db.js';
import { v4 as uuidv4 } from 'uuid';

async function createTestUsers() {
  try {
    const testPassword = 'test123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(testPassword, salt);

    console.log('=== CREATING TEST USERS FOR INTEGRATION TESTING ===');
    console.log('Password for all test users: test123');
    console.log('');

    const testUsers = [
      { name: 'Super Admin Test', email: 'superadmin@test.com', role: 'super_admin' },
      { name: 'Owner Test', email: 'owner@test.com', role: 'owner' },
      { name: 'Financial Manager Test', email: 'finance@test.com', role: 'financial_manager' },
      { name: 'Center Director Test', email: 'director@test.com', role: 'center_director' },
      { name: 'Admin Test User', email: 'admintest@test.com', role: 'admin' },
      { name: 'Academic Coordinator Test', email: 'academic@test.com', role: 'academic_coordinator' },
      { name: 'Teacher Test User', email: 'teachertest@test.com', role: 'teacher' },
      { name: 'Parent Test User', email: 'parenttest@test.com', role: 'parent' }
    ];

    for (const user of testUsers) {
      try {
        const userId = uuidv4();
        await pool.query(
          `INSERT INTO users (id, full_name, email, password_hash, role, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON DUPLICATE KEY UPDATE
           password_hash = VALUES(password_hash),
           updated_at = CURRENT_TIMESTAMP`,
          [userId, user.name, user.email, passwordHash, user.role]
        );
        console.log('✅ Created/Updated:', user.email, '(' + user.role + ')');
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log('ℹ️  User exists:', user.email, '(' + user.role + ')');
        } else {
          console.error('Error creating user:', user.email, err.message);
        }
      }
    }

    console.log('');
    console.log('=== TEST USER CREDENTIALS ===');
    testUsers.forEach(user => {
      console.log(`${user.role}: ${user.email} / test123`);
    });

    // Verify the super admin password from the existing user
    console.log('');
    console.log('=== TESTING EXISTING SUPER ADMIN PASSWORD ===');
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', ['venudadi@outlook.com']);
    if (existingUsers.length > 0) {
      const testPasswords = ['test123', 'password', 'admin', '123456', 'password123'];
      for (const testPwd of testPasswords) {
        const isValid = await bcrypt.compare(testPwd, existingUsers[0].password_hash);
        if (isValid) {
          console.log(`✅ Existing super admin password is: ${testPwd}`);
          break;
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

createTestUsers();