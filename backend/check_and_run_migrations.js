import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load database config from environment
const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'preschool_erp',
    multipleStatements: true
};

// Add SSL support for DigitalOcean managed databases
if (process.env.DB_SSL === 'true') {
    DB_CONFIG.ssl = {
        rejectUnauthorized: false
    };
}

// Core tables that should exist for basic functionality
const CORE_TABLES = [
    'users',
    'centers',
    'children',
    'classrooms'
];

/**
 * Database Health Check Migration Runner
 *
 * This script only runs the health check migration (001_database_health_check.sql)
 * It does NOT create, alter, or drop any tables
 *
 * Purpose: Verify database connection and basic schema readiness
 *
 * Note: All schema changes should be applied directly to the database
 * by the database administrator using the provided credentials
 */

async function runHealthCheckMigration() {
    let connection;

    try {
        console.log('🔍 Starting Database Health Check...\n');
        console.log('📋 Database Configuration:');
        console.log(`   Host: ${DB_CONFIG.host}`);
        console.log(`   Port: ${DB_CONFIG.port}`);
        console.log(`   Database: ${DB_CONFIG.database}`);
        console.log(`   SSL: ${DB_CONFIG.ssl ? 'Enabled' : 'Disabled'}\n`);

        // Connect to database
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Database connection established\n');

        // Run health check migration
        const migrationFile = '001_database_health_check.sql';
        const migrationPath = path.join(__dirname, 'migrations', migrationFile);

        if (!fs.existsSync(migrationPath)) {
            throw new Error(`Migration file not found: ${migrationFile}`);
        }

        const sql = fs.readFileSync(migrationPath, 'utf8');
        console.log(`📄 Running: ${migrationFile}\n`);

        // Execute health check queries
        const results = await connection.query(sql);
        console.log('✅ Health check queries executed successfully\n');

        // Check core tables
        console.log('🔍 Verifying core tables existence...\n');
        let allTablesExist = true;

        for (const tableName of CORE_TABLES) {
            try {
                const [rows] = await connection.query(`SHOW TABLES LIKE '${tableName}'`);
                if (rows.length === 0) {
                    console.log(`   ❌ Missing table: ${tableName}`);
                    allTablesExist = false;
                } else {
                    console.log(`   ✅ Table exists: ${tableName}`);
                }
            } catch (error) {
                console.error(`   ⚠️  Error checking ${tableName}:`, error.message);
                allTablesExist = false;
            }
        }

        console.log('\n' + '='.repeat(65));

        if (allTablesExist) {
            console.log('✅ DATABASE HEALTH CHECK PASSED');
            console.log('   All core tables exist and database is ready');
        } else {
            console.log('⚠️  DATABASE HEALTH CHECK WARNING');
            console.log('   Some core tables are missing');
            console.log('   Please contact database administrator to create required tables');
        }

        console.log('='.repeat(65) + '\n');

        await connection.end();
        return allTablesExist;

    } catch (error) {
        console.error('\n❌ DATABASE HEALTH CHECK FAILED\n');
        console.error('Error:', error.message);
        console.error('\nPlease verify:');
        console.error('1. Database credentials in .env file are correct');
        console.error('2. Database server is running and accessible');
        console.error('3. Database exists and user has proper permissions');
        console.error('4. For DigitalOcean: SSL is properly configured\n');

        if (connection) {
            await connection.end();
        }

        throw error;
    }
}

// Run the health check
runHealthCheckMigration()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
