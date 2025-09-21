import mysql from 'mysql2/promise';
import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function runMigrations() {
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
        // Read and execute migration files
        const superAdminRoleMigration = await fs.readFile(
            path.join(process.cwd(), 'migrations', '003_add_super_admin_role.sql'),
            'utf8'
        );
        const createSuperAdminMigration = await fs.readFile(
            path.join(process.cwd(), 'migrations', '004_create_super_admin.sql'),
            'utf8'
        );

        console.log('Applying migrations...');
        
        // Execute migrations in sequence
        await pool.query(superAdminRoleMigration);
        console.log('✅ Added super_admin role to users table');
        
        await pool.query(createSuperAdminMigration);
        console.log('✅ Created super admin user');

        console.log('All migrations completed successfully!');
    } catch (error) {
        console.error('Error running migrations:', error);
    } finally {
        await pool.end();
    }
}

runMigrations();