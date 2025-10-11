import 'dotenv/config';
import pool from './db.js';

async function resetMigrations() {
  try {
    console.log('⚠️  WARNING: This will clear the migrations table and allow re-running all migrations.');
    console.log('           Use this only if migrations failed and left the database in an inconsistent state.\n');

    // Check what's in migrations table
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM migrations');
    console.log(`Found ${rows[0].count} migration records in database.\n`);

    // Clear the migrations table
    await pool.query('DELETE FROM migrations');
    console.log('✅ Cleared migrations table\n');

    console.log('You can now run: npm run migrate:full\n');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

resetMigrations();
