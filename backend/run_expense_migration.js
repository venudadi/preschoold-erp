// run_expense_migration.js
// Script to run the expense management migration using the existing MySQL pool
import fs from 'fs';
import path from 'path';
import pool from './db.js';

async function runMigration() {
  const migrationPath = path.resolve('migrations', '016_create_expenses_module.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  try {
    const statements = sql.split(/;\s*\n/).filter(Boolean);
    for (const stmt of statements) {
      if (stmt.trim()) {
        await pool.query(stmt);
      }
    }
    console.log('✅ Expense management migration applied successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
