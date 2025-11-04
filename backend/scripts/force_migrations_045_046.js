import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = '') {
  console.log(color + message + colors.reset);
}

/**
 * FORCE APPLY MIGRATIONS 045 AND 046
 *
 * This script will execute migrations 045 and 046 directly,
 * bypassing the normal migration tracking system.
 *
 * Safe to run multiple times - uses IF NOT EXISTS patterns.
 */

async function forceMigration(filename, description) {
  log(`\n${'='.repeat(70)}`, colors.bright);
  log(`🔧 FORCING MIGRATION: ${filename}`, colors.bright + colors.cyan);
  log(`   ${description}`, colors.cyan);
  log('='.repeat(70), colors.bright);

  const migrationPath = path.resolve(__dirname, '..', 'migrations', filename);

  if (!fs.existsSync(migrationPath)) {
    log(`❌ Migration file not found: ${migrationPath}`, colors.red);
    return false;
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && s.toUpperCase() !== 'SELECT');

  log(`\n📝 Found ${statements.length} SQL statements\n`, colors.blue);

  let successCount = 0;
  let warningCount = 0;
  let errorCount = 0;

  const conn = await pool.getConnection();

  try {
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];

      // Skip empty statements and comment-only lines
      if (!stmt || stmt.length < 10) continue;

      try {
        await conn.query(stmt);
        successCount++;

        // Log what was executed
        const firstLine = stmt.split('\n')[0].substring(0, 80);
        log(`  ✅ Statement ${i+1}: ${firstLine}${stmt.length > 80 ? '...' : ''}`, colors.green);

      } catch (err) {
        // These error codes are expected when columns/indexes already exist
        const benignErrors = [
          'ER_DUP_FIELDNAME',     // Column already exists
          'ER_DUP_KEYNAME',       // Index already exists
          'ER_CANT_DROP_FIELD_OR_KEY', // Column doesn't exist to drop
          'ER_TABLE_EXISTS_ERROR', // Table already exists
          'ER_DUP_ENTRY'          // Duplicate entry (for migration record)
        ];

        if (benignErrors.includes(err.code)) {
          warningCount++;
          const firstLine = stmt.split('\n')[0].substring(0, 80);
          log(`  ⚠️  Statement ${i+1} (already applied): ${firstLine}${stmt.length > 80 ? '...' : ''}`, colors.yellow);
          log(`     ${err.code}: ${err.message.split('\n')[0]}`, colors.yellow);
        } else {
          errorCount++;
          const firstLine = stmt.split('\n')[0].substring(0, 80);
          log(`  ❌ Statement ${i+1} failed: ${firstLine}${stmt.length > 80 ? '...' : ''}`, colors.red);
          log(`     ${err.code}: ${err.message}`, colors.red);
        }
      }
    }

    // Record migration in tracking table (if not already recorded)
    try {
      await conn.query(
        'INSERT IGNORE INTO migrations (filename, executed_at) VALUES (?, NOW())',
        [filename]
      );
      log(`\n✅ Migration record updated in tracking table`, colors.green);
    } catch (err) {
      log(`\n⚠️  Could not update migration tracking: ${err.message}`, colors.yellow);
    }

  } finally {
    conn.release();
  }

  // Summary for this migration
  log(`\n${'─'.repeat(70)}`, colors.bright);
  log(`📊 MIGRATION RESULTS:`, colors.bright);
  log(`   ✅ Successful: ${successCount}`, colors.green);
  if (warningCount > 0) {
    log(`   ⚠️  Already applied: ${warningCount}`, colors.yellow);
  }
  if (errorCount > 0) {
    log(`   ❌ Errors: ${errorCount}`, colors.red);
  }
  log('─'.repeat(70), colors.bright);

  return errorCount === 0;
}

async function main() {
  log('\n' + '='.repeat(70), colors.bright + colors.cyan);
  log('🚀 FORCED MIGRATION SCRIPT - Migrations 045 & 046', colors.bright + colors.cyan);
  log('='.repeat(70), colors.bright + colors.cyan);
  log('\nThis script will force-apply migrations 045 and 046', colors.cyan);
  log('regardless of the migration tracking system.', colors.cyan);
  log('\nIt is SAFE to run multiple times - uses IF NOT EXISTS patterns.\n', colors.green);

  try {
    // Test database connection
    const conn = await pool.getConnection();
    log('✅ Database connected successfully\n', colors.green);
    conn.release();

    // Ensure migrations table exists
    await pool.query(`CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Check current migration status
    const [currentMigrations] = await pool.query(
      'SELECT filename FROM migrations WHERE filename IN (?, ?)',
      ['045_fix_schema_mismatches.sql', '046_fix_enquiries_status_enum.sql']
    );

    log('📋 Current Migration Status:', colors.blue);
    const has045 = currentMigrations.some(m => m.filename === '045_fix_schema_mismatches.sql');
    const has046 = currentMigrations.some(m => m.filename === '046_fix_enquiries_status_enum.sql');

    log(`   045_fix_schema_mismatches.sql: ${has045 ? '✅ Recorded' : '❌ Not recorded'}`,
        has045 ? colors.green : colors.yellow);
    log(`   046_fix_enquiries_status_enum.sql: ${has046 ? '✅ Recorded' : '❌ Not recorded'}`,
        has046 ? colors.green : colors.yellow);

    // Force apply migration 045
    const success045 = await forceMigration(
      '045_fix_schema_mismatches.sql',
      'Adds missing columns to children and enquiries tables'
    );

    // Force apply migration 046
    const success046 = await forceMigration(
      '046_fix_enquiries_status_enum.sql',
      'Fixes enquiries.status ENUM to include Open and Closed'
    );

    // Final verification
    log('\n' + '='.repeat(70), colors.bright);
    log('🔍 FINAL VERIFICATION', colors.bright + colors.cyan);
    log('='.repeat(70), colors.bright);

    // Check children table columns
    const [childrenCols] = await pool.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'children'
      AND COLUMN_NAME IN ('student_id', 'status', 'pause_start_date', 'service_hours')
    `);

    log('\n✅ Children table columns:', colors.green);
    childrenCols.forEach(col => {
      log(`   • ${col.COLUMN_NAME}`, colors.green);
    });

    // Check enquiries table columns
    const [enquiriesCols] = await pool.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'enquiries'
      AND COLUMN_NAME IN ('source', 'enquiry_date', 'mobile_number', 'company', 'follow_up_flag')
    `);

    log('\n✅ Enquiries table columns:', colors.green);
    enquiriesCols.forEach(col => {
      log(`   • ${col.COLUMN_NAME}`, colors.green);
    });

    // Check enquiries status ENUM
    const [statusEnum] = await pool.query(`
      SELECT COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'enquiries'
      AND COLUMN_NAME = 'status'
    `);

    if (statusEnum.length > 0) {
      log('\n✅ Enquiries status ENUM values:', colors.green);
      log(`   ${statusEnum[0].COLUMN_TYPE}`, colors.cyan);

      if (statusEnum[0].COLUMN_TYPE.includes('Open')) {
        log('   ✅ "Open" status is available', colors.green);
      } else {
        log('   ❌ "Open" status is MISSING', colors.red);
      }
    }

    // Final summary
    log('\n' + '='.repeat(70), colors.bright);
    log('📊 OVERALL SUMMARY', colors.bright + colors.cyan);
    log('='.repeat(70), colors.bright);

    if (success045 && success046) {
      log('✅ Both migrations applied successfully!', colors.bright + colors.green);
      log('✅ Database schema is now up to date.', colors.green);
    } else {
      log('⚠️  One or more migrations had issues', colors.yellow);
      log('   Review the error messages above for details.', colors.yellow);
    }

    log('\n💡 Next Steps:', colors.cyan);
    log('   1. Test enquiry submission with "Open" status', colors.cyan);
    log('   2. Test invoice viewing (uses student_id column)', colors.cyan);
    log('   3. Check application logs for any remaining issues', colors.cyan);
    log('');

  } catch (error) {
    log(`\n❌ FATAL ERROR: ${error.message}`, colors.bright + colors.red);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the forced migration
main();
