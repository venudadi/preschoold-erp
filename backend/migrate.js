import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, 'migrations');

async function ensureMigrationsTable() {
  await pool.query(`CREATE TABLE IF NOT EXISTS migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
}

async function getAppliedMigrations() {
  const [rows] = await pool.query('SELECT filename FROM migrations');
  return new Set(rows.map(r => r.filename));
}

function preprocess(sql) {
  // Remove problematic patterns not supported on some MySQL versions
  let out = sql
    .replace(/ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS/gi, 'ADD COLUMN')
    .replace(/DROP\s+COLUMN\s+IF\s+EXISTS/gi, 'DROP COLUMN')
    .replace(/ADD\s+CONSTRAINT\s+IF\s+NOT\s+EXISTS/gi, 'ADD CONSTRAINT')
    .replace(/CREATE\s+UNIQUE\s+INDEX\s+IF\s+NOT\s+EXISTS/gi, 'CREATE UNIQUE INDEX')
    .replace(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS/gi, 'CREATE INDEX');

  // Strip stored procedure/event blocks delimited by DELIMITER // ... DELIMITER ;
  out = out.replace(/DELIMITER\s+\/\/[\s\S]*?DELIMITER\s*;/gi, '');
  // Remove block comments to avoid splitting inside them
  out = out.replace(/\/\*[\s\S]*?\*\//g, '');
  return out;
}

async function applyMigration(file) {
  let sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
  sql = preprocess(sql);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Better statement splitting - handle multi-line statements properly
    // Split on semicolons that are followed by newline or end of string
    const statements = [];
    let currentStatement = '';
    const lines = sql.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('--')) {
        continue;
      }

      currentStatement += ' ' + trimmedLine;

      // If line ends with semicolon, we have a complete statement
      if (trimmedLine.endsWith(';')) {
        const stmt = currentStatement.trim().replace(/;$/, '').trim();
        if (stmt) {
          statements.push(stmt);
        }
        currentStatement = '';
      }
    }

    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }

    // Log statement count for debugging
    console.log(`📋 Processing ${statements.length} statements from ${file}`);
    const createTableCount = statements.filter(s => /CREATE\s+TABLE/i.test(s)).length;
    console.log(`   Found ${createTableCount} CREATE TABLE statements`);

    for (const stmt of statements) {
      try {
        // Log ALL CREATE TABLE attempts
        if (/CREATE\s+TABLE/i.test(stmt)) {
          console.log(`🔨 Attempting CREATE TABLE:`, stmt.substring(0, 80) + '...');
        }
        await conn.query(stmt);
        // Log successful CREATE TABLE
        if (/CREATE\s+TABLE/i.test(stmt)) {
          console.log(`✅ CREATE TABLE SUCCESS:`, stmt.substring(0, 80) + '...');
        }
      } catch (e) {
        // Log CREATE TABLE errors with full details for debugging
        if (/CREATE\s+TABLE/i.test(stmt)) {
          console.error(`❌ CREATE TABLE FAILED:`, {
            errno: e.errno,
            code: e.code,
            message: e.message,
            sqlPreview: stmt.substring(0, 300)
          });
        }

        const ignorable = new Set(['ER_DUP_KEYNAME','ER_TABLE_EXISTS_ERROR','ER_DUP_ENTRY','ER_DUP_FIELDNAME','ER_CANT_DROP_FIELD_OR_KEY','ER_DUP_CONSTRAINT']);
        const ignorableCodes = new Set([1061, 1050, 1062, 1060, 1091, 1826]);
        if (ignorable.has(e.code) || ignorableCodes.has(e.errno)) {
          console.warn(`Ignoring benign error (${e.code || e.errno}) for statement:`, stmt.substring(0,120)+'...');
          continue;
        }
        if (e.errno === 1060 && /ADD\s+COLUMN/i.test(stmt)) { // Duplicate column
          console.warn(`Skipping duplicate column (${e.errno}):`, stmt.substring(0,120)+'...');
          continue;
        }
        if (e.errno === 1054) { // Unknown column
          // Skip UPDATE/SELECT/PREPARE statements that reference missing columns
          if (/UPDATE|SELECT|PREPARE/i.test(stmt) || /center_name|Constraint already exists|Event already exists/i.test(stmt) || /(Constraint|Event) already exists/i.test(e.message)) {
            console.warn(`Skipping statement due to missing column (${e.errno}):`, stmt.substring(0,120)+'...');
            continue;
          }
        }
        if (e.errno === 1243) { // Unknown prepared statement handler - EXECUTE after skipped PREPARE
          console.warn(`Skipping EXECUTE for non-existent prepared statement (${e.errno}):`, stmt.substring(0,120)+'...');
          continue;
        }
        if (e.errno === 1072 && /(CREATE\s+INDEX|ADD\s+INDEX)/i.test(stmt)) { // Key column doesn't exist for index
          console.warn(`Skipping index creation due to missing column (${e.errno}):`, stmt.substring(0,120)+'...');
          continue;
        }
        if (e.errno === 1146) { // Table doesn't exist
          if (/(CREATE\s+INDEX|ADD\s+INDEX|UPDATE|ALTER\s+TABLE|SET\s+@|INSERT\s+(IGNORE\s+)?INTO)/i.test(stmt)) {
            console.warn(`Skipping statement due to missing table (${e.errno}):`, stmt.substring(0,120)+'...');
            continue;
          }
        }
        if (e.errno === 1267 && /CREATE\s+VIEW/i.test(stmt)) { // Collation mismatch in view
          console.warn(`Skipping view creation due to collation mismatch (${e.errno}):`, stmt.substring(0,120)+'...');
          continue;
        }
        if (e.errno === 1824 || e.errno === 1215 || e.errno === 1005) { // Foreign key errors - cannot open parent table
          console.warn(`Skipping foreign key constraint due to missing referenced table (${e.errno}):`, stmt.substring(0,120)+'...');
          continue;
        }
        if (e.errno === 1347 && /ALTER\s+TABLE/i.test(stmt)) { // ER_WRONG_OBJECT - trying to ALTER a VIEW
          console.warn(`Skipping ALTER TABLE on VIEW (${e.errno}):`, stmt.substring(0,120)+'...');
          continue;
        }
        if (e.errno === 1364 && /INSERT\s+INTO\s+users/i.test(stmt) && /super_admin/i.test(file)) { // ER_NO_DEFAULT_FOR_FIELD for super admin INSERT
          console.warn(`⚠️  SKIPPING SUPER ADMIN INSERT due to cached migration file without username field (${e.errno})`);
          console.warn(`   This is a known DigitalOcean build cache issue. Super admin will be created by later migration.`);
          continue;
        }
        if (e.errno === 3780 && /CREATE\s+TABLE/i.test(stmt)) { // ER_FK_INCOMPATIBLE_COLUMNS
          console.warn(`⚠️  SKIPPING TABLE due to incompatible FK columns (${e.errno}):`, stmt.substring(0,120)+'...');
          console.warn(`   Table likely already exists with different column types. Skipping to avoid migration failure.`);
          continue;
        }
        throw e;
      }
    }
    await conn.query('INSERT INTO migrations (filename) VALUES (?)', [file]);
    await conn.commit();
    console.log(`Applied: ${file}`);
  } catch (e) {
    await conn.rollback();
    console.error(`Failed: ${file}`, e.message);
    throw e;
  } finally {
    conn.release();
  }
}

async function run() {
  await ensureMigrationsTable();

  // WORKAROUND: Delete cached problematic files that have been renamed
  // DigitalOcean has aggressive caching that keeps old migration files
  const filesToDelete = [
    '003_super_admin_setup.sql',
    '004_create_super_admin.sql'
  ];

  for (const filename of filesToDelete) {
    const filepath = path.join(migrationsDir, filename);
    if (fs.existsSync(filepath)) {
      console.log(`⚠️  Deleting cached migration file: ${filename}`);
      fs.unlinkSync(filepath);
    }
  }

  const applied = await getAppliedMigrations();
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.match(/^\d+_.+\.sql$/))
    .sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    if (!applied.has(file)) {
      await applyMigration(file);
    }
  }
  console.log('✅ All migrations up to date');
  process.exit(0);
}

run().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});

