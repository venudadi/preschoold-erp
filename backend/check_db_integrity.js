/**
 * Post-Migration Database Integrity Checker and Repair Tool
 * 
 * This script:
 * 1. Checks for missing FK constraints
 * 2. Validates column type compatibility
 * 3. Attempts to repair missing constraints
 * 4. Provides detailed report of database integrity issues
 * 
 * Run this after migration deployment to ensure full database integrity
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
};

// Expected FK constraints based on our schema
const EXPECTED_CONSTRAINTS = [
  // Core relationships
  { table: 'classrooms', column: 'center_id', refTable: 'centers', refColumn: 'id', name: 'fk_classrooms_center', onDelete: 'CASCADE' },
  { table: 'classrooms', column: 'teacher_id', refTable: 'users', refColumn: 'id', name: 'fk_classrooms_teacher', onDelete: 'SET NULL' },
  { table: 'children', column: 'center_id', refTable: 'centers', refColumn: 'id', name: 'fk_children_center', onDelete: 'CASCADE' },
  { table: 'children', column: 'classroom_id', refTable: 'classrooms', refColumn: 'id', name: 'fk_children_classroom', onDelete: 'SET NULL' },
  { table: 'children', column: 'paused_by', refTable: 'users', refColumn: 'id', name: 'fk_children_paused_by', onDelete: 'SET NULL' },
  { table: 'users', column: 'center_id', refTable: 'centers', refColumn: 'id', name: 'fk_users_center', onDelete: 'SET NULL' },
  
  // Portfolio and observation
  { table: 'digital_portfolios', column: 'center_id', refTable: 'centers', refColumn: 'id', name: 'fk_digital_portfolios_center', onDelete: 'CASCADE' },
  { table: 'digital_portfolios', column: 'child_id', refTable: 'children', refColumn: 'id', name: 'fk_digital_portfolios_child', onDelete: 'CASCADE' },
  { table: 'observation_logs', column: 'center_id', refTable: 'centers', refColumn: 'id', name: 'fk_observation_logs_center', onDelete: 'CASCADE' },
  { table: 'observation_logs', column: 'child_id', refTable: 'children', refColumn: 'id', name: 'fk_observation_logs_child', onDelete: 'CASCADE' },
  
  // Teacher modules
  { table: 'lesson_plans', column: 'center_id', refTable: 'centers', refColumn: 'id', name: 'fk_lesson_plans_center', onDelete: 'CASCADE' },
  { table: 'assignments', column: 'center_id', refTable: 'centers', refColumn: 'id', name: 'fk_assignments_center', onDelete: 'CASCADE' },
  { table: 'assignment_submissions', column: 'center_id', refTable: 'centers', refColumn: 'id', name: 'fk_assignment_submissions_center', onDelete: 'CASCADE' },
  
  // Messaging
  { table: 'messages', column: 'center_id', refTable: 'centers', refColumn: 'id', name: 'fk_messages_center', onDelete: 'CASCADE' },
  { table: 'message_threads', column: 'center_id', refTable: 'centers', refColumn: 'id', name: 'fk_message_threads_center', onDelete: 'CASCADE' },
  
  // Student pause history
  { table: 'student_pause_history', column: 'student_id', refTable: 'children', refColumn: 'id', name: 'fk_student_pause_history_student', onDelete: 'CASCADE' },
  { table: 'student_pause_history', column: 'paused_by', refTable: 'users', refColumn: 'id', name: 'fk_student_pause_history_paused_by', onDelete: 'SET NULL' },
  { table: 'student_pause_history', column: 'resumed_by', refTable: 'users', refColumn: 'id', name: 'fk_student_pause_history_resumed_by', onDelete: 'SET NULL' },
  { table: 'student_pause_history', column: 'center_id', refTable: 'centers', refColumn: 'id', name: 'fk_student_pause_history_center', onDelete: 'CASCADE' }
];

async function getColumnType(conn, table, column) {
  try {
    const [rows] = await conn.query(
      `SELECT DATA_TYPE, COLUMN_TYPE, CHARACTER_MAXIMUM_LENGTH 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [dbConfig.database, table, column]
    );
    return rows[0] || null;
  } catch (err) {
    return null;
  }
}

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [dbConfig.database, table]
  );
  return rows[0].count > 0;
}

async function constraintExists(conn, table, constraintName) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?`,
    [dbConfig.database, table, constraintName]
  );
  return rows[0].count > 0;
}

async function checkConstraints(conn) {
  console.log('\n📊 Checking Foreign Key Constraints...\n');
  
  const missing = [];
  const typeMismatches = [];
  const working = [];
  
  for (const constraint of EXPECTED_CONSTRAINTS) {
    const { table, column, refTable, refColumn, name } = constraint;
    
    // Check if table exists
    if (!await tableExists(conn, table)) {
      console.log(`⏭️  Skipping ${table}.${column} - table doesn't exist`);
      continue;
    }
    
    // Check if referenced table exists
    if (!await tableExists(conn, refTable)) {
      console.log(`⏭️  Skipping ${table}.${column} - referenced table ${refTable} doesn't exist`);
      continue;
    }
    
    // Get column types
    const colType = await getColumnType(conn, table, column);
    const refColType = await getColumnType(conn, refTable, refColumn);
    
    if (!colType) {
      console.log(`⏭️  Skipping ${table}.${column} - column doesn't exist`);
      continue;
    }
    
    if (!refColType) {
      console.log(`⏭️  Skipping ${table}.${column} - referenced column ${refTable}.${refColumn} doesn't exist`);
      continue;
    }
    
    // Check type compatibility
    const typesMatch = colType.COLUMN_TYPE === refColType.COLUMN_TYPE;
    
    // Check if constraint exists
    const exists = await constraintExists(conn, table, name);
    
    if (!typesMatch) {
      typeMismatches.push({
        ...constraint,
        sourceType: colType.COLUMN_TYPE,
        targetType: refColType.COLUMN_TYPE,
        constraintExists: exists
      });
      console.log(`⚠️  ${table}.${column} (${colType.COLUMN_TYPE}) -> ${refTable}.${refColumn} (${refColType.COLUMN_TYPE}) - TYPE MISMATCH`);
    } else if (!exists) {
      missing.push(constraint);
      console.log(`❌ ${table}.${column} -> ${refTable}.${refColumn} - CONSTRAINT MISSING`);
    } else {
      working.push(constraint);
      console.log(`✅ ${table}.${column} -> ${refTable}.${refColumn} - OK`);
    }
  }
  
  return { missing, typeMismatches, working };
}

async function repairConstraints(conn, missing) {
  console.log('\n🔧 Attempting to repair missing constraints...\n');
  
  const repaired = [];
  const failed = [];
  
  for (const constraint of missing) {
    const { table, column, refTable, refColumn, name, onDelete } = constraint;
    
    try {
      const sql = `ALTER TABLE ${table} ADD CONSTRAINT ${name} 
                   FOREIGN KEY (${column}) REFERENCES ${refTable}(${refColumn}) 
                   ON DELETE ${onDelete}`;
      await conn.query(sql);
      repaired.push(constraint);
      console.log(`✅ Repaired: ${table}.${column} -> ${refTable}.${refColumn}`);
    } catch (err) {
      failed.push({ ...constraint, error: err.message });
      console.log(`❌ Failed to repair ${table}.${column}: ${err.message}`);
    }
  }
  
  return { repaired, failed };
}

async function generateRepairScript(typeMismatches, failedConstraints) {
  console.log('\n📝 Generating manual repair script...\n');
  
  const script = [];
  
  script.push('-- ================================================================');
  script.push('-- MANUAL DATABASE REPAIR SCRIPT');
  script.push('-- Generated: ' + new Date().toISOString());
  script.push('-- ================================================================');
  script.push('-- IMPORTANT: Review and test this script in a staging environment first!');
  script.push('-- This script requires a maintenance window as it modifies data types');
  script.push('-- ================================================================\n');
  
  if (typeMismatches.length > 0) {
    script.push('-- ================================================================');
    script.push('-- SECTION 1: Fix Column Type Mismatches');
    script.push('-- ================================================================');
    script.push('-- These foreign key columns have incompatible types with their');
    script.push('-- referenced columns. This typically happens when upgrading from');
    script.push('-- an older schema where IDs were INT instead of VARCHAR(36).\n');
    
    for (const mismatch of typeMismatches) {
      script.push(`-- Fix: ${mismatch.table}.${mismatch.column}`);
      script.push(`--   Current: ${mismatch.sourceType}`);
      script.push(`--   Expected: ${mismatch.targetType}`);
      
      // Drop existing constraint if it exists
      if (mismatch.constraintExists) {
        script.push(`ALTER TABLE ${mismatch.table} DROP FOREIGN KEY ${mismatch.name};`);
      }
      
      // Modify column type
      script.push(`ALTER TABLE ${mismatch.table} MODIFY COLUMN ${mismatch.column} ${mismatch.targetType};`);
      
      // Recreate constraint
      script.push(`ALTER TABLE ${mismatch.table} ADD CONSTRAINT ${mismatch.name}`);
      script.push(`  FOREIGN KEY (${mismatch.column}) REFERENCES ${mismatch.refTable}(${mismatch.refColumn})`);
      script.push(`  ON DELETE ${mismatch.onDelete};\n`);
    }
  }
  
  if (failedConstraints.length > 0) {
    script.push('\n-- ================================================================');
    script.push('-- SECTION 2: Failed Constraint Repairs');
    script.push('-- ================================================================');
    script.push('-- These constraints could not be automatically repaired.\n');
    
    for (const failed of failedConstraints) {
      script.push(`-- Failed: ${failed.table}.${failed.column} -> ${failed.refTable}.${failed.refColumn}`);
      script.push(`-- Error: ${failed.error}`);
      script.push(`ALTER TABLE ${failed.table} ADD CONSTRAINT ${failed.name}`);
      script.push(`  FOREIGN KEY (${failed.column}) REFERENCES ${failed.refTable}(${failed.refColumn})`);
      script.push(`  ON DELETE ${failed.onDelete};\n`);
    }
  }
  
  return script.join('\n');
}

async function main() {
  console.log('🔍 Database Integrity Checker and Repair Tool\n');
  console.log('Database:', dbConfig.database);
  console.log('Host:', dbConfig.host);
  console.log('Port:', dbConfig.port);
  console.log('SSL:', dbConfig.ssl ? 'Enabled' : 'Disabled');
  
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database\n');
    
    // Step 1: Check constraints
    const { missing, typeMismatches, working } = await checkConstraints(conn);
    
    // Step 2: Attempt to repair missing constraints (only those without type mismatches)
    let repaired = [];
    let failed = [];
    if (missing.length > 0) {
      const result = await repairConstraints(conn, missing);
      repaired = result.repaired;
      failed = result.failed;
    }
    
    // Step 3: Generate repair script for manual fixes
    const allFailed = [...failed, ...typeMismatches.filter(m => !m.constraintExists)];
    if (typeMismatches.length > 0 || allFailed.length > 0) {
      const script = await generateRepairScript(typeMismatches, allFailed);
      
      // Write to file
      const fs = await import('fs');
      const path = await import('path');
      const scriptPath = path.join(process.cwd(), 'database_repair_script.sql');
      fs.writeFileSync(scriptPath, script);
      console.log(`\n📄 Manual repair script saved to: ${scriptPath}`);
    }
    
    // Step 4: Print summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Working constraints: ${working.length}`);
    console.log(`🔧 Repaired constraints: ${repaired.length}`);
    console.log(`⚠️  Type mismatches: ${typeMismatches.length}`);
    console.log(`❌ Failed repairs: ${failed.length}`);
    console.log('='.repeat(60));
    
    if (typeMismatches.length === 0 && failed.length === 0) {
      console.log('\n🎉 Database integrity is perfect! All constraints are in place.');
      process.exit(0);
    } else {
      console.log('\n⚠️  Database has integrity issues that require manual intervention.');
      console.log('Review the generated repair script and apply it during a maintenance window.');
      process.exit(1);
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

main();
