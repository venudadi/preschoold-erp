import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_CONFIG = {
    host: 'localhost',
    user: 'wsl_user',
    password: 'Delta@4599',
    database: 'neldrac_admin',
    multipleStatements: true
};

// Tables that should exist
const REQUIRED_TABLES = [
    'invoice_requests',
    'expenses',
    'lesson_plans',
    'assignments',
    'messages',
    'message_threads',
    'observation_logs',
    'digital_portfolio',
    'classroom_announcements',
    'emergency_alerts',
    'password_reset_tokens',
    'claude_context_cache'
];

async function checkMissingTables() {
    const connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected to database\n');

    const missingTables = [];

    for (const tableName of REQUIRED_TABLES) {
        try {
            const [rows] = await connection.query(`SHOW TABLES LIKE '${tableName}'`);
            if (rows.length === 0) {
                console.log(`❌ Missing table: ${tableName}`);
                missingTables.push(tableName);
            } else {
                console.log(`✅ Table exists: ${tableName}`);
            }
        } catch (error) {
            console.error(`Error checking ${tableName}:`, error.message);
        }
    }

    await connection.end();
    return missingTables;
}

async function runMigration(migrationFile) {
    const connection = await mysql.createConnection(DB_CONFIG);
    const sql = fs.readFileSync(path.join(__dirname, 'migrations', migrationFile), 'utf8');

    try {
        await connection.query(sql);
        console.log(`✅ Executed: ${migrationFile}`);
        await connection.end();
        return true;
    } catch (error) {
        console.error(`❌ Failed to execute ${migrationFile}:`, error.message);
        await connection.end();
        return false;
    }
}

async function main() {
    console.log('🔍 Checking for missing tables...\n');

    const missingTables = await checkMissingTables();

    if (missingTables.length === 0) {
        console.log('\n✅ All required tables exist!');
        return;
    }

    console.log(`\n⚠️  Found ${missingTables.length} missing tables`);
    console.log('\n📝 Running necessary migrations...\n');

    // Map of table names to their migration files
    const tableMigrations = {
        'invoice_requests': '015_create_invoice_requests.sql',
        'expenses': '016_create_expenses_module.sql',
        'lesson_plans': '017_create_lesson_plans.sql',
        'assignments': '018_create_assignments_module.sql',
        'messages': '019_create_messaging_module.sql',
        'message_threads': '019_create_messaging_module.sql',
        'observation_logs': '020_create_observation_logs.sql',
        'digital_portfolio': '021_create_digital_portfolio.sql',
        'classroom_announcements': '022_create_classroom_announcements.sql',
        'emergency_alerts': '032_emergency_alert_system.sql',
        'password_reset_tokens': '033_forgot_password_system.sql',
        'claude_context_cache': '034_claude_context_cache.sql'
    };

    const migrationsToRun = new Set();
    for (const table of missingTables) {
        if (tableMigrations[table]) {
            migrationsToRun.add(tableMigrations[table]);
        }
    }

    for (const migration of migrationsToRun) {
        await runMigration(migration);
    }

    console.log('\n🎉 Migration check complete!');
}

main().catch(console.error);
