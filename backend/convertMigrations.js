import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.resolve(__dirname, 'migrations');
const pgMigrationsDir = path.resolve(__dirname, 'migrations-pg');

// Create output directory
if (!fs.existsSync(pgMigrationsDir)) {
  fs.mkdirSync(pgMigrationsDir);
}

function convertMySQLToPostgreSQL(sql) {
  let converted = sql;

  // 1. AUTO_INCREMENT → SERIAL
  converted = converted.replace(/INT\s+AUTO_INCREMENT/gi, 'SERIAL');
  converted = converted.replace(/BIGINT\s+AUTO_INCREMENT/gi, 'BIGSERIAL');

  // 2. Remove ON UPDATE CURRENT_TIMESTAMP (PostgreSQL doesn't support this directly)
  converted = converted.replace(/ON\s+UPDATE\s+CURRENT_TIMESTAMP/gi, '');

  // 3. ENUM types → VARCHAR with CHECK constraints (simple approach)
  // This is a simplified conversion - for production you might want custom types
  converted = converted.replace(
    /ENUM\s*\((.*?)\)/gi,
    (match, values) => `VARCHAR(50) CHECK (role IN (${values}))`
  );

  // 4. MODIFY COLUMN → ALTER COLUMN TYPE
  converted = converted.replace(
    /ALTER\s+TABLE\s+(\w+)\s+MODIFY\s+COLUMN\s+(\w+)\s+([^,;]+)/gi,
    'ALTER TABLE $1 ALTER COLUMN $2 TYPE $3'
  );

  // 5. BOOLEAN DEFAULT 1 → BOOLEAN DEFAULT TRUE
  converted = converted.replace(/BOOLEAN\s+DEFAULT\s+1/gi, 'BOOLEAN DEFAULT TRUE');
  converted = converted.replace(/BOOLEAN\s+DEFAULT\s+0/gi, 'BOOLEAN DEFAULT FALSE');

  // 6. TINYINT(1) → BOOLEAN
  converted = converted.replace(/TINYINT\(\d+\)/gi, 'BOOLEAN');

  // 7. DATETIME → TIMESTAMP
  converted = converted.replace(/DATETIME/gi, 'TIMESTAMP');

  // 8. TEXT → TEXT (same, but remove MySQL-specific options)
  converted = converted.replace(/TEXT\s+COLLATE\s+\w+/gi, 'TEXT');

  // 9. IF NOT EXISTS in ADD COLUMN (not supported in all PostgreSQL versions for ALTER)
  // We'll keep it as-is and handle errors in migrate.js

  // 10. Multiple ADD COLUMN in single ALTER (PostgreSQL supports this)
  // No change needed

  // 11. UNSIGNED → Remove (PostgreSQL doesn't have UNSIGNED)
  converted = converted.replace(/\s+UNSIGNED/gi, '');

  // 12. DECIMAL precision
  // Same syntax, no change needed

  // 13. ENGINE=InnoDB → Remove
  converted = converted.replace(/ENGINE\s*=\s*InnoDB/gi, '');

  // 14. CHARSET and COLLATE → Remove
  converted = converted.replace(/DEFAULT\s+CHARSET\s*=\s*\w+/gi, '');
  converted = converted.replace(/COLLATE\s*=\s*\w+/gi, '');
  converted = converted.replace(/CHARACTER\s+SET\s+\w+/gi, '');

  // 15. Backticks → Double quotes (for identifiers if needed)
  // PostgreSQL prefers lowercase unquoted, but we'll keep as-is
  converted = converted.replace(/`/g, '');

  return converted;
}

// Process all migration files
const files = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`Converting ${files.length} migration files...`);

for (const file of files) {
  const inputPath = path.join(migrationsDir, file);
  const outputPath = path.join(pgMigrationsDir, file);

  const mysqlSql = fs.readFileSync(inputPath, 'utf8');
  const pgSql = convertMySQLToPostgreSQL(mysqlSql);

  fs.writeFileSync(outputPath, pgSql, 'utf8');
  console.log(`✓ Converted: ${file}`);
}

console.log(`\n✅ Converted ${files.length} files to ${pgMigrationsDir}`);
console.log('⚠️  Note: Review converted files for complex syntax that may need manual adjustment');
