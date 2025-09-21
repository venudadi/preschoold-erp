import fs from 'fs';
import path from 'path';
import pool from '../db.js';

async function main() {
  const migrationsDir = path.join(process.cwd(), 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  const conn = await pool.getConnection();
  try {
    await conn.query(`CREATE TABLE IF NOT EXISTS migrations (id INT AUTO_INCREMENT PRIMARY KEY, filename VARCHAR(255) UNIQUE, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    const [rows] = await conn.query('SELECT filename FROM migrations');
    const applied = new Set(rows.map(r => r.filename));
    const appliedList = files.filter(f => applied.has(f));
    const pendingList = files.filter(f => !applied.has(f));
    console.log('Applied migrations (' + appliedList.length + '):');
    appliedList.forEach(f => console.log('  - ' + f));
    console.log('Pending migrations (' + pendingList.length + '):');
    pendingList.forEach(f => console.log('  - ' + f));
  } finally {
    conn.release();
    process.exit(0);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
