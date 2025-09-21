import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function setupSuperAdmin() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 1,
        queueLimit: 0
    });

    try {
        // Add super_admin role
        console.log('Adding super_admin role...');
        await pool.query(`ALTER TABLE users 
            MODIFY COLUMN role enum('super_admin','owner','admin','academic_coordinator','teacher','parent') NOT NULL;`);
        console.log('✅ Added super_admin role');

        // Create super admin user
        console.log('Creating super admin user...');
        await pool.query(`
            INSERT INTO users (
                id,
                full_name,
                email,
                password_hash,
                role,
                created_at,
                updated_at,
                is_active
            ) VALUES (
                UUID(),
                'Vani',
                'venudadi@outlook.com',
                '$2b$10$dcG8qaxvilxXWnfOr6tqK.apUnC655B3QYZ9C6k58ir814dp8T1D.',
                'super_admin',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP,
                1
            );
        `);
        console.log('✅ Created super admin user');
        
        console.log('Setup completed successfully!');
    } catch (error) {
        console.error('Error during setup:', error);
    } finally {
        await pool.end();
    }
}

setupSuperAdmin();