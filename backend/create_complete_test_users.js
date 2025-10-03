import pool from './db.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const TEST_PASSWORD = 'Test@123';

const testUsers = [
    {
        role: 'super_admin',
        email: 'superadmin@preschool.com',
        full_name: 'Super Admin',
        phone_number: '+1-555-0100'
    },
    {
        role: 'owner',
        email: 'owner@preschool.com',
        full_name: 'John Owner',
        phone_number: '+1-555-0101'
    },
    {
        role: 'admin',
        email: 'admin@preschool.com',
        full_name: 'Jane Admin',
        phone_number: '+1-555-0102'
    },
    {
        role: 'center_director',
        email: 'director@preschool.com',
        full_name: 'Mike Director',
        phone_number: '+1-555-0103'
    },
    {
        role: 'financial_manager',
        email: 'finance@preschool.com',
        full_name: 'Sarah Finance',
        phone_number: '+1-555-0104'
    },
    {
        role: 'academic_coordinator',
        email: 'academic@preschool.com',
        full_name: 'Lisa Coordinator',
        phone_number: '+1-555-0105'
    },
    {
        role: 'teacher',
        email: 'teacher@preschool.com',
        full_name: 'Emily Teacher',
        phone_number: '+1-555-0106'
    },
    {
        role: 'parent',
        email: 'parent@preschool.com',
        full_name: 'Robert Parent',
        phone_number: '+1-555-0107'
    }
];

async function createTestUsers() {
    console.log('🔧 Creating comprehensive test users...\n');

    const credentials = [];

    try {
        const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 12);

        for (const user of testUsers) {
            try {
                // Check if user exists
                const [existing] = await pool.query(
                    'SELECT id, email, role FROM users WHERE email = ?',
                    [user.email]
                );

                if (existing.length > 0) {
                    console.log(`👤 User already exists: ${user.email} (${user.role})`);

                    // Update password to ensure it's consistent
                    await pool.query(
                        'UPDATE users SET password_hash = ?, must_reset_password = 0, account_locked = 0 WHERE email = ?',
                        [hashedPassword, user.email]
                    );

                    credentials.push({
                        role: user.role,
                        email: user.email,
                        password: TEST_PASSWORD,
                        name: user.full_name,
                        status: 'UPDATED'
                    });
                } else {
                    // Create new user
                    const userId = uuidv4();

                    await pool.query(
                        `INSERT INTO users (
                            id, email, password_hash, full_name, role,
                            phone_number, is_active, must_reset_password,
                            created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, 1, 0, NOW())`,
                        [
                            userId,
                            user.email,
                            hashedPassword,
                            user.full_name,
                            user.role,
                            user.phone_number
                        ]
                    );

                    console.log(`✅ Created new user: ${user.email} (${user.role})`);

                    credentials.push({
                        role: user.role,
                        email: user.email,
                        password: TEST_PASSWORD,
                        name: user.full_name,
                        status: 'CREATED'
                    });
                }
            } catch (error) {
                console.error(`❌ Error processing ${user.email}:`, error.message);
            }
        }

        // Generate credentials file content
        let credentialsContent = '=' .repeat(80) + '\n';
        credentialsContent += 'PRESCHOOL ERP - TEST USER CREDENTIALS\n';
        credentialsContent += '=' .repeat(80) + '\n\n';
        credentialsContent += 'Generated: ' + new Date().toISOString() + '\n';
        credentialsContent += 'Application: Preschool ERP System\n';
        credentialsContent += 'Environment: Development/Testing\n\n';
        credentialsContent += '⚠️  SECURITY WARNING: These are test credentials only!\n';
        credentialsContent += '   DO NOT use in production environment.\n\n';
        credentialsContent += '=' .repeat(80) + '\n\n';

        // Sort by role hierarchy
        const roleOrder = ['super_admin', 'owner', 'financial_manager', 'center_director', 'admin', 'academic_coordinator', 'teacher', 'parent'];
        credentials.sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role));

        credentials.forEach((cred, index) => {
            credentialsContent += `${index + 1}. ${cred.role.toUpperCase().replace('_', ' ')}\n`;
            credentialsContent += '-'.repeat(80) + '\n';
            credentialsContent += `   Name:     ${cred.name}\n`;
            credentialsContent += `   Email:    ${cred.email}\n`;
            credentialsContent += `   Password: ${cred.password}\n`;
            credentialsContent += `   Status:   ${cred.status}\n`;
            credentialsContent += `   Role:     ${cred.role}\n`;
            credentialsContent += '\n';
        });

        credentialsContent += '=' .repeat(80) + '\n';
        credentialsContent += 'ACCESS LEVELS\n';
        credentialsContent += '=' .repeat(80) + '\n\n';
        credentialsContent += 'SUPER ADMIN:\n';
        credentialsContent += '  ✓ Full system access\n';
        credentialsContent += '  ✓ User management (all roles)\n';
        credentialsContent += '  ✓ System configuration\n';
        credentialsContent += '  ✓ All financial operations\n';
        credentialsContent += '  ✓ Password reset for any user\n\n';

        credentialsContent += 'OWNER:\n';
        credentialsContent += '  ✓ Multi-center oversight\n';
        credentialsContent += '  ✓ Financial overview\n';
        credentialsContent += '  ✓ Staff management\n';
        credentialsContent += '  ✓ Reports and analytics\n\n';

        credentialsContent += 'FINANCIAL MANAGER:\n';
        credentialsContent += '  ✓ Invoice management\n';
        credentialsContent += '  ✓ Expense tracking\n';
        credentialsContent += '  ✓ Budget approvals\n';
        credentialsContent += '  ✓ Financial reports\n\n';

        credentialsContent += 'CENTER DIRECTOR:\n';
        credentialsContent += '  ✓ Center operations\n';
        credentialsContent += '  ✓ Staff scheduling\n';
        credentialsContent += '  ✓ Parent communication\n';
        credentialsContent += '  ✓ Emergency alerts\n\n';

        credentialsContent += 'ADMIN:\n';
        credentialsContent += '  ✓ Student management\n';
        credentialsContent += '  ✓ Classroom management\n';
        credentialsContent += '  ✓ Attendance tracking\n';
        credentialsContent += '  ✓ Document management\n\n';

        credentialsContent += 'ACADEMIC COORDINATOR:\n';
        credentialsContent += '  ✓ Curriculum planning\n';
        credentialsContent += '  ✓ Teacher coordination\n';
        credentialsContent += '  ✓ Academic reports\n\n';

        credentialsContent += 'TEACHER:\n';
        credentialsContent += '  ✓ Classroom management\n';
        credentialsContent += '  ✓ Lesson plans\n';
        credentialsContent += '  ✓ Assignments\n';
        credentialsContent += '  ✓ Student observations\n';
        credentialsContent += '  ✓ Digital portfolio\n';
        credentialsContent += '  ✓ Parent messaging\n\n';

        credentialsContent += 'PARENT:\n';
        credentialsContent += '  ✓ View child information\n';
        credentialsContent += '  ✓ Digital portfolio access\n';
        credentialsContent += '  ✓ Teacher messaging\n';
        credentialsContent += '  ✓ Invoice viewing\n';
        credentialsContent += '  ✓ Announcements\n\n';

        credentialsContent += '=' .repeat(80) + '\n';
        credentialsContent += 'LOGIN INSTRUCTIONS\n';
        credentialsContent += '=' .repeat(80) + '\n\n';
        credentialsContent += '1. Navigate to: http://localhost:5173\n';
        credentialsContent += '2. Enter the email and password from above\n';
        credentialsContent += '3. Click "Sign In"\n\n';
        credentialsContent += 'Note: All users share the same password for testing convenience.\n';
        credentialsContent += 'In production, each user should have a unique, strong password.\n\n';

        credentialsContent += '=' .repeat(80) + '\n';
        credentialsContent += 'DATABASE CONNECTION\n';
        credentialsContent += '=' .repeat(80) + '\n\n';
        credentialsContent += 'Host:     localhost\n';
        credentialsContent += 'Database: neldrac_admin\n';
        credentialsContent += 'User:     wsl_user\n\n';

        credentialsContent += '=' .repeat(80) + '\n';
        credentialsContent += 'SUPPORT\n';
        credentialsContent += '=' .repeat(80) + '\n\n';
        credentialsContent += 'For issues or questions:\n';
        credentialsContent += '  - Check console logs (F12 in browser)\n';
        credentialsContent += '  - Verify backend is running on port 5001\n';
        credentialsContent += '  - Verify frontend is running on port 5173\n';
        credentialsContent += '  - Check database connection\n\n';

        credentialsContent += '=' .repeat(80) + '\n';
        credentialsContent += 'END OF CREDENTIALS FILE\n';
        credentialsContent += '=' .repeat(80) + '\n';

        // Write to file
        const fs = await import('fs');
        fs.writeFileSync('../TEST_CREDENTIALS.txt', credentialsContent);

        console.log('\n' + '='.repeat(80));
        console.log('✅ Test users created/updated successfully!');
        console.log('='.repeat(80));
        console.log(`\n📄 Credentials file created: TEST_CREDENTIALS.txt`);
        console.log(`\n🔐 All users can login with password: ${TEST_PASSWORD}`);
        console.log('\n👥 User Summary:');
        credentials.forEach(cred => {
            console.log(`   ${cred.status === 'CREATED' ? '✨' : '🔄'} ${cred.role.padEnd(25)} ${cred.email}`);
        });
        console.log('\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createTestUsers();
