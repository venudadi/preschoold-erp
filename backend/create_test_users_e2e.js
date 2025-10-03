import pool from './db.js';
import bcrypt from 'bcrypt';

async function createTestUsers() {
    console.log('🔧 Creating test users for E2E testing...');

    const testUsers = [
        {
            role: 'super_admin',
            username: 'superadmin@preschool.com',
            password: 'SuperAdmin@123',
            first_name: 'Super',
            last_name: 'Admin',
            email: 'superadmin@preschool.com'
        },
        {
            role: 'owner',
            username: 'owner@preschool.com',
            password: 'Owner@123',
            first_name: 'Owner',
            last_name: 'User',
            email: 'owner@preschool.com'
        },
        {
            role: 'financial_manager',
            username: 'finance@preschool.com',
            password: 'Finance@123',
            first_name: 'Finance',
            last_name: 'Manager',
            email: 'finance@preschool.com'
        },
        {
            role: 'center_director',
            username: 'director@preschool.com',
            password: 'Director@123',
            first_name: 'Center',
            last_name: 'Director',
            email: 'director@preschool.com'
        },
        {
            role: 'admin',
            username: 'admin@preschool.com',
            password: 'Admin@123',
            first_name: 'Admin',
            last_name: 'User',
            email: 'admin@preschool.com'
        },
        {
            role: 'academic_coordinator',
            username: 'academic@preschool.com',
            password: 'Academic@123',
            first_name: 'Academic',
            last_name: 'Coordinator',
            email: 'academic@preschool.com'
        },
        {
            role: 'teacher',
            username: 'teacher@preschool.com',
            password: 'Teacher@123',
            first_name: 'Test',
            last_name: 'Teacher',
            email: 'teacher@preschool.com'
        },
        {
            role: 'parent',
            username: 'parent@preschool.com',
            password: 'Parent@123',
            first_name: 'Test',
            last_name: 'Parent',
            email: 'parent@preschool.com'
        }
    ];

    try {
        // Get a connection
        const connection = await pool.getConnection();

        for (const user of testUsers) {
            try {
                // Check if user already exists
                const [existingUser] = await connection.execute(
                    'SELECT id FROM users WHERE username = ? OR email = ?',
                    [user.username, user.email]
                );

                if (existingUser.length > 0) {
                    console.log(`👤 User ${user.username} already exists, skipping...`);
                    continue;
                }

                // Hash password
                const hashedPassword = await bcrypt.hash(user.password, 12);

                // Create user
                const [result] = await connection.execute(
                    `INSERT INTO users (username, password, email, first_name, last_name, role, status, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, 'active', NOW())`,
                    [
                        user.username,
                        hashedPassword,
                        user.email,
                        user.first_name,
                        user.last_name,
                        user.role
                    ]
                );

                console.log(`✅ Created test user: ${user.username} (${user.role})`);

                // For parent users, create associated parent record
                if (user.role === 'parent') {
                    await connection.execute(
                        `INSERT INTO parents (user_id, first_name, last_name, email, phone, created_at)
                         VALUES (?, ?, ?, ?, '555-0123', NOW())`,
                        [result.insertId, user.first_name, user.last_name, user.email]
                    );
                    console.log(`👨‍👩‍👧‍👦 Created parent record for: ${user.username}`);
                }

                // For staff roles, create associated staff record
                if (['teacher', 'admin', 'center_director', 'academic_coordinator'].includes(user.role)) {
                    await connection.execute(
                        `INSERT INTO staff (user_id, first_name, last_name, email, role, phone, status, hire_date, created_at)
                         VALUES (?, ?, ?, ?, ?, '555-0123', 'active', CURDATE(), NOW())`,
                        [result.insertId, user.first_name, user.last_name, user.email, user.role]
                    );
                    console.log(`👨‍🏫 Created staff record for: ${user.username}`);
                }

            } catch (error) {
                console.error(`❌ Failed to create user ${user.username}:`, error.message);
            }
        }

        connection.release();
        console.log('✅ Test user creation completed');
        return true;

    } catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    createTestUsers()
        .then(() => {
            console.log('🎉 Test users setup complete');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Failed to setup test users:', error);
            process.exit(1);
        });
}

export default createTestUsers;