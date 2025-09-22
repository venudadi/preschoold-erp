import pool from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function executeSQLFile(filename) {
  console.log(`Executing SQL file: ${filename}`);
  const sql = fs.readFileSync(path.join(__dirname, filename), 'utf8');
  
  // Split SQL by semicolons (but not inside string literals)
  const statements = sql.split(/;\s*\n|;\s*$/)
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));
  
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    for (const stmt of statements) {
      try {
        if (stmt) {
          await conn.query(stmt);
          console.log(`✓ Executed: ${stmt.substring(0, 50)}...`);
        }
      } catch (err) {
        // Handle duplicate key errors as non-fatal
        if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
          console.warn(`⚠️ Duplicate entry (continuing): ${err.message}`);
          continue;
        }
        throw err;
      }
    }
    
    await conn.commit();
    console.log(`✅ Successfully executed ${filename}`);
    return true;
  } catch (err) {
    await conn.rollback();
    console.error(`❌ Error executing ${filename}:`, err);
    return false;
  } finally {
    conn.release();
  }
}

async function main() {
  try {
    // Create tables first
    const createSuccess = await executeSQLFile('create_tables.sql');
    if (!createSuccess) {
      console.error('Failed to create tables. Aborting.');
      process.exit(1);
    }
    
    // Then seed data
    const seedSuccess = await executeSQLFile('seed_tables.sql');
    if (!seedSuccess) {
      console.error('Failed to seed data. Tables may be incomplete.');
      process.exit(1);
    }
    
    console.log('✅ All database operations completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Unhandled error:', err);
    process.exit(1);
  }
}

main();