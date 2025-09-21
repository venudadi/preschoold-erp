import fs from 'fs';
import path from 'path';
import pool from '../db.js';

async function main() {
  const migrationsDir = path.join(process.cwd(), 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  const legacy = files.filter(f => {
    const n = parseInt(f.split('_')[0], 10);
    return n >= 3 && n <= 11; // 003 to 011
  });
  const conn = await pool.getConnection();
  try {
    await conn.query(`CREATE TABLE IF NOT EXISTS migrations (id INT AUTO_INCREMENT PRIMARY KEY, filename VARCHAR(255) UNIQUE, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    for (const f of legacy) {
      try {
        await conn.query('INSERT IGNORE INTO migrations (filename) VALUES (?)', [f]);
        console.log('Marked as applied:', f);
      } catch (e) {
        console.warn('Skip marking', f, e.message);
      }
    }
  } finally {
    conn.release();
    process.exit(0);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
