import 'dotenv/config';
import pool from './db.js';

async function checkMigrations() {
  try {
    console.log('🔍 Checking migrations table...\n');

    const [rows] = await pool.query('SELECT filename, executed_at FROM migrations ORDER BY executed_at');

    console.log(`Found ${rows.length} applied migrations:\n`);
    rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.filename} - ${row.executed_at}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkMigrations();
