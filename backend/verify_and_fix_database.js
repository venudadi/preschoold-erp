import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'neldrac_admin',
  multipleStatements: true
};

// All required tables for all user roles
const REQUIRED_TABLES = [
  // Core tables
  'users', 'centers', 'classrooms', 'children', 'attendance',
  // Staff and management
  'staff', 'staff_schedules', 'teacher_classes',
  // Financial tables
  'invoice_requests', 'expenses', 'fee_structures', 'invoices', 'payments',
  'budget_limits', 'budget_approvals',
  // Academic tables
  'lesson_plans', 'assignments', 'observation_logs',
  // Communication tables
  'messages', 'message_threads', 'classroom_announcements',
  // Portfolio and media
  'digital_portfolio', 'portfolio_media',
  // Security and sessions
  'sessions', 'audit_logs', 'password_reset_tokens',
  // Emergency and alerts
  'emergency_alerts', 'emergency_contacts',
  // System tables
  'roles', 'user_roles', 'user_centers', 'permissions', 'role_permissions',
  // Claude context cache
  'claude_context_cache'
];

async function checkTableExists(connection, tableName) {
  try {
    const [rows] = await connection.query(
      'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?',
      [dbConfig.database, tableName]
    );
    return rows[0].count > 0;
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error.message);
    return false;
  }
}

async function runMigration(connection, migrationFile) {
  const migrationPath = path.join(__dirname, 'migrations', migrationFile);

  if (!fs.existsSync(migrationPath)) {
    console.log(`⚠️  Migration file not found: ${migrationFile}`);
    return false;
  }

  try {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolon and filter empty statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await connection.query(statement);
      } catch (err) {
        // Ignore "already exists" errors
        if (err.code !== 'ER_TABLE_EXISTS_ERROR' && err.code !== 'ER_DUP_KEYNAME') {
          throw err;
        }
      }
    }

    console.log(`✅ Ran migration: ${migrationFile}`);
    return true;
  } catch (error) {
    console.error(`❌ Error running migration ${migrationFile}:`, error.message);
    return false;
  }
}

async function verifyAndFixDatabase() {
  let connection;

  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database\n');

    console.log('📊 Checking existing tables...');
    const [tables] = await connection.query('SHOW TABLES');
    const existingTables = tables.map(row => Object.values(row)[0]);
    console.log(`Found ${existingTables.length} existing tables\n`);

    console.log('🔍 Checking required tables...');
    const missingTables = [];

    for (const tableName of REQUIRED_TABLES) {
      const exists = await checkTableExists(connection, tableName);
      if (!exists) {
        console.log(`❌ Missing table: ${tableName}`);
        missingTables.push(tableName);
      } else {
        console.log(`✅ Table exists: ${tableName}`);
      }
    }

    if (missingTables.length === 0) {
      console.log('\n✅ All required tables exist!');
      return;
    }

    console.log(`\n⚠️  Found ${missingTables.length} missing tables. Running migrations...\n`);

    // Run migrations in order
    const migrations = [
      '015_create_invoice_requests.sql',
      '016_create_expenses_module.sql',
      '017_create_lesson_plans.sql',
      '018_create_assignments_module.sql',
      '019_create_messaging_module.sql',
      '020_create_observation_logs.sql',
      '021_create_digital_portfolio.sql',
      '022_create_classroom_announcements.sql',
      '023_add_class_promotion_and_assignment.sql',
      '024_add_center_id_to_portfolio_and_observation.sql',
      '025_add_center_id_to_teacher_and_messaging_tables.sql',
      '029_fix_digital_portfolio_schema.sql',
      '031_financial_manager_budget_control.sql',
      '032_emergency_alert_system.sql',
      '033_forgot_password_system.sql',
      '034_claude_context_cache.sql'
    ];

    for (const migration of migrations) {
      await runMigration(connection, migration);
    }

    // Verify again after migrations
    console.log('\n🔍 Verifying tables after migrations...');
    const stillMissing = [];

    for (const tableName of REQUIRED_TABLES) {
      const exists = await checkTableExists(connection, tableName);
      if (!exists) {
        stillMissing.push(tableName);
      }
    }

    if (stillMissing.length === 0) {
      console.log('\n✅ All required tables now exist! Database is up to date.');
    } else {
      console.log(`\n⚠️  Still missing ${stillMissing.length} tables:`);
      stillMissing.forEach(table => console.log(`   - ${table}`));
      console.log('\nThese tables may need manual creation or additional migrations.');
    }

  } catch (error) {
    console.error('❌ Database verification error:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

// Run the verification
console.log('='.repeat(60));
console.log('DATABASE VERIFICATION AND REPAIR TOOL');
console.log('='.repeat(60));
console.log();

verifyAndFixDatabase()
  .then(() => {
    console.log('\n✅ Database verification complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Database verification failed:', error.message);
    process.exit(1);
  });
