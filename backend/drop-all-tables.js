import 'dotenv/config';
import pool from './db.js';

async function dropAllTables() {
  const conn = await pool.getConnection();

  try {
    console.log('⚠️  WARNING: This will drop ALL tables in the database!');
    console.log('           This is a destructive operation and CANNOT be undone.\n');

    // Disable foreign key checks to allow dropping tables with FK constraints
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    // Get all tables in the database
    const [tables] = await conn.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_TYPE = 'BASE TABLE'
    `);

    if (tables.length === 0) {
      console.log('✅ No tables found in database');
      await conn.query('SET FOREIGN_KEY_CHECKS = 1');
      process.exit(0);
      return;
    }

    console.log(`Found ${tables.length} tables to drop:`);
    tables.forEach((table, i) => {
      console.log(`  ${i + 1}. ${table.TABLE_NAME}`);
    });
    console.log();

    // Drop each table
    for (const table of tables) {
      try {
        await conn.query(`DROP TABLE IF EXISTS \`${table.TABLE_NAME}\``);
        console.log(`✅ Dropped table: ${table.TABLE_NAME}`);
      } catch (err) {
        console.error(`❌ Failed to drop table ${table.TABLE_NAME}:`, err.message);
      }
    }

    // Drop all views
    const [views] = await conn.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_TYPE = 'VIEW'
    `);

    if (views.length > 0) {
      console.log(`\nFound ${views.length} views to drop:`);
      for (const view of views) {
        try {
          await conn.query(`DROP VIEW IF EXISTS \`${view.TABLE_NAME}\``);
          console.log(`✅ Dropped view: ${view.TABLE_NAME}`);
        } catch (err) {
          console.error(`❌ Failed to drop view ${view.TABLE_NAME}:`, err.message);
        }
      }
    }

    // Re-enable foreign key checks
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n✅ All tables and views dropped successfully!');
    console.log('You can now run: npm run migrate:full\n');

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    await conn.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
    process.exit(1);
  } finally {
    conn.release();
  }
}

dropAllTables();
