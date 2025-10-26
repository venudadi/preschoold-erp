import 'dotenv/config';
import pool from './db.js';

async function cleanDatabase() {
  console.log('🧹 Cleaning DigitalOcean staging database...\n');

  try {
    // Disable foreign key checks
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('✅ Disabled foreign key checks');

    // Get all tables
    const [tables] = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_type = 'BASE TABLE'
    `);

    console.log(`Found ${tables.length} tables to drop\n`);

    // Drop each table
    for (const table of tables) {
      const tableName = table.table_name || table.TABLE_NAME;
      try {
        await pool.query(`DROP TABLE IF EXISTS \`${tableName}\``);
        console.log(`✅ Dropped table: ${tableName}`);
      } catch (err) {
        console.error(`❌ Failed to drop table ${tableName}:`, err.message);
      }
    }

    // Also drop views
    const [views] = await pool.query(`
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = DATABASE()
    `);

    if (views.length > 0) {
      console.log(`\nFound ${views.length} views to drop\n`);
      for (const view of views) {
        const viewName = view.table_name || view.TABLE_NAME;
        try {
          await pool.query(`DROP VIEW IF EXISTS \`${viewName}\``);
          console.log(`✅ Dropped view: ${viewName}`);
        } catch (err) {
          console.error(`❌ Failed to drop view ${viewName}:`, err.message);
        }
      }
    }

    // Drop events
    const [events] = await pool.query(`
      SELECT event_name
      FROM information_schema.events
      WHERE event_schema = DATABASE()
    `);

    if (events.length > 0) {
      console.log(`\nFound ${events.length} events to drop\n`);
      for (const event of events) {
        const eventName = event.event_name || event.EVENT_NAME;
        try {
          await pool.query(`DROP EVENT IF EXISTS \`${eventName}\``);
          console.log(`✅ Dropped event: ${eventName}`);
        } catch (err) {
          console.error(`❌ Failed to drop event ${eventName}:`, err.message);
        }
      }
    }

    // Re-enable foreign key checks
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('\n✅ Re-enabled foreign key checks');

    // Final verification
    const [remainingTables] = await pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_type = 'BASE TABLE'
    `);

    console.log(`\n✅ Database cleanup complete!`);
    console.log(`   Remaining tables: ${remainingTables[0].count}`);
    console.log(`   Ready for fresh migration deployment`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database cleanup failed:', error.message);
    process.exit(1);
  }
}

cleanDatabase();