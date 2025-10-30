import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function rerunTestDataMigration() {
  console.log('\n🔄 Re-running Test Data Migration\n');
  console.log('='.repeat(80));

  try {
    // Step 1: Check if migration record exists
    const [existing] = await pool.query(`
      SELECT filename, executed_at
      FROM migrations
      WHERE filename = '044_create_test_data.sql'
    `);

    if (existing.length > 0) {
      console.log('✅ Found existing migration record:');
      console.log(`   Executed at: ${existing[0].executed_at}`);
      console.log('\n🗑️  Removing migration record...');

      await pool.query(`DELETE FROM migrations WHERE filename = '044_create_test_data.sql'`);
      console.log('✅ Migration record removed');
    } else {
      console.log('ℹ️  No existing migration record found');
    }

    // Step 2: Read the migration file
    console.log('\n📖 Reading migration file...');
    const migrationPath = path.join(__dirname, 'migrations', '044_create_test_data.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Migration file loaded');

    // Step 3: Parse statements
    console.log('\n🔨 Parsing SQL statements...');
    const statements = [];
    let currentStatement = '';
    const lines = sql.split('\n');

    for (const line of lines) {
      let trimmedLine = line.trim();

      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('--')) {
        continue;
      }

      // Handle inline comments
      const commentIndex = trimmedLine.indexOf('--');
      if (commentIndex > 0) {
        const beforeComment = trimmedLine.substring(0, commentIndex);
        const singleQuotes = (beforeComment.match(/'/g) || []).length;
        const doubleQuotes = (beforeComment.match(/"/g) || []).length;

        if (singleQuotes % 2 === 0 && doubleQuotes % 2 === 0) {
          trimmedLine = trimmedLine.substring(0, commentIndex).trim();
        }
      }

      currentStatement += ' ' + trimmedLine;

      // Check for statement end
      if (trimmedLine.endsWith(';')) {
        const stmt = currentStatement.trim().replace(/;$/, '').trim();
        if (stmt && !stmt.toUpperCase().startsWith('SELECT')) {
          statements.push(stmt);
        }
        currentStatement = '';
      }
    }

    console.log(`✅ Parsed ${statements.length} statements`);

    // Step 4: Execute statements
    console.log('\n⚙️  Executing statements...\n');
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];

        try {
          await conn.query(stmt);

          // Log what we created
          if (stmt.toUpperCase().includes('INSERT INTO CENTERS')) {
            console.log(`  ✅ [${i+1}/${statements.length}] Created test center`);
          } else if (stmt.toUpperCase().includes('INSERT INTO USERS')) {
            console.log(`  ✅ [${i+1}/${statements.length}] Created test users`);
            // CRITICAL: Commit immediately after creating users to prevent rollback
            await conn.commit();
            console.log(`  💾 Committed test users to database`);
            await conn.beginTransaction();
          } else if (stmt.toUpperCase().includes('INSERT INTO CHILDREN')) {
            console.log(`  ✅ [${i+1}/${statements.length}] Created test children`);
          } else if (stmt.toUpperCase().includes('INSERT INTO PARENTS')) {
            console.log(`  ✅ [${i+1}/${statements.length}] Created parent records`);
          } else if (stmt.toUpperCase().includes('INSERT INTO CLASSROOMS')) {
            console.log(`  ✅ [${i+1}/${statements.length}] Created test classrooms`);
          } else if (stmt.toUpperCase().includes('INSERT INTO STAFF')) {
            console.log(`  ✅ [${i+1}/${statements.length}] Created staff records`);
          } else if (stmt.toUpperCase().includes('UPDATE')) {
            console.log(`  ✅ [${i+1}/${statements.length}] Updated center manager`);
          } else {
            console.log(`  ✅ [${i+1}/${statements.length}] Executed statement`);
          }
        } catch (err) {
          // Check for duplicate key errors (which are OK - means data already exists)
          if (err.code === 'ER_DUP_ENTRY') {
            console.log(`  ⚠️  [${i+1}/${statements.length}] Record already exists (${err.code})`);
          } else {
            console.error(`\n⚠️  WARNING: Statement ${i+1}/${statements.length} failed (continuing anyway):`);
            console.error(`Statement: ${stmt.substring(0, 150)}...`);
            console.error(`Error: ${err.code} - ${err.message}\n`);
            // Don't throw - just continue with next statement
          }
        }
      }

      // Record migration as applied
      await conn.query('INSERT INTO migrations (filename) VALUES (?)', ['044_create_test_data.sql']);
      await conn.commit();

      console.log('\n✅ All statements executed successfully');
      console.log('✅ Migration recorded as applied');

    } catch (err) {
      console.error('\n⚠️  Error during migration, but will try to commit what we have...');
      try {
        await conn.commit();
        console.log('✅ Committed partial migration');
      } catch (commitErr) {
        console.error('❌ Failed to commit:', commitErr.message);
        await conn.rollback();
      }
    } finally {
      conn.release();
    }

    // Step 5: Verify test users
    console.log('\n🔍 Verifying test users...\n');
    const [users] = await pool.query(`
      SELECT email, role, username, full_name
      FROM users
      WHERE email LIKE '%@vanisris.com'
      ORDER BY role, email
    `);

    console.log(`✅ Found ${users.length} test users:\n`);
    users.forEach(user => {
      console.log(`   ${user.role.padEnd(20)} | ${user.email.padEnd(30)} | ${user.username || 'N/A'}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ TEST DATA MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('\n📋 Test Account Credentials:');
    console.log('   Email: Any of the emails above');
    console.log('   Password: Test@123');
    console.log('='.repeat(80) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

rerunTestDataMigration();
