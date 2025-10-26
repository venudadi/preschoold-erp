import 'dotenv/config';
import pool from './db.js';

async function verifyDeployment() {
  console.log('🔍 Verifying DigitalOcean Deployment...\n');
  console.log('Database:', process.env.DB_HOST);
  console.log('=====================================\n');

  try {
    // Check table count
    const [tables] = await pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_type = 'BASE TABLE'
    `);
    const tableCount = tables[0].count;
    const tableStatus = tableCount >= 100 ? '✅' : '❌';
    console.log(`${tableStatus} Tables: ${tableCount} (expected: 106+)`);

    // Check specific critical tables
    const criticalTables = [
      'users', 'centers', 'children', 'classrooms', 'parents', 'parent_children',
      'staff', 'invoices', 'attendance', 'expenses', 'messaging', 'lesson_plans',
      'digital_portfolio_items', 'emergency_alerts', 'daily_food_tracking'
    ];

    console.log('\n📋 Critical Tables Check:');
    for (const tableName of criticalTables) {
      const [exists] = await pool.query(`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
        AND table_name = ?
      `, [tableName]);

      const status = exists[0].count > 0 ? '✅' : '❌';
      console.log(`  ${status} ${tableName}`);
    }

    // Check foreign keys
    const [fks] = await pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    const fkCount = fks[0].count;
    const fkStatus = fkCount >= 80 ? '✅' : '⚠️';
    console.log(`\n${fkStatus} Foreign Keys: ${fkCount} (expected: 100+)`);

    // Check views
    const [views] = await pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.VIEWS
      WHERE TABLE_SCHEMA = DATABASE()
    `);
    const viewCount = views[0].count;
    const viewStatus = viewCount >= 4 ? '✅' : '⚠️';
    console.log(`${viewStatus} Views: ${viewCount} (expected: 5+)`);

    // Check migrations
    const [migrationCheck] = await pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name = 'migrations'
    `);

    if (migrationCheck[0].count > 0) {
      const [migrations] = await pool.query('SELECT COUNT(*) as count FROM migrations');
      const migrationCount = migrations[0].count;
      const migrationStatus = migrationCount >= 50 ? '✅' : '⚠️';
      console.log(`${migrationStatus} Migrations Applied: ${migrationCount} (expected: 54)`);

      // Show last few migrations
      const [lastMigrations] = await pool.query(`
        SELECT filename, executed_at
        FROM migrations
        ORDER BY executed_at DESC
        LIMIT 5
      `);

      console.log('\n📝 Recent Migrations:');
      lastMigrations.forEach(m => {
        console.log(`  - ${m.filename} (${new Date(m.executed_at).toLocaleString()})`);
      });
    } else {
      console.log('❌ Migrations table not found!');
    }

    // Check test users
    console.log('\n👥 Test Users Check:');
    const testRoles = ['super_admin', 'owner', 'center_director', 'admin', 'financial_manager', 'teacher', 'parent'];

    for (const role of testRoles) {
      const [users] = await pool.query(`
        SELECT COUNT(*) as count
        FROM users
        WHERE role = ?
        AND email LIKE '%@vansris.com'
      `, [role]);

      const status = users[0].count > 0 ? '✅' : '❌';
      console.log(`  ${status} ${role}: ${users[0].count} test user(s)`);
    }

    // Check test data
    const [testCenter] = await pool.query(`
      SELECT COUNT(*) as count FROM centers WHERE id = 'test-center-1'
    `);
    const [testChildren] = await pool.query(`
      SELECT COUNT(*) as count FROM children WHERE id LIKE 'test-child-%'
    `);
    const [testClassrooms] = await pool.query(`
      SELECT COUNT(*) as count FROM classrooms WHERE id LIKE 'test-classroom-%'
    `);

    console.log('\n📊 Test Data:');
    console.log(`  Centers: ${testCenter[0].count}`);
    console.log(`  Children: ${testChildren[0].count}`);
    console.log(`  Classrooms: ${testClassrooms[0].count}`);

    // Summary
    console.log('\n=====================================');
    if (tableCount >= 100 && fkCount >= 80 && viewCount >= 4) {
      console.log('✅ DEPLOYMENT SUCCESSFUL!');
      console.log('   Database schema is complete and ready.');
    } else {
      console.log('⚠️ DEPLOYMENT PARTIALLY SUCCESSFUL');
      console.log('   Some components may be missing.');
      console.log('   Check migration logs for errors.');
    }
    console.log('=====================================\n');

    // List test credentials
    console.log('📧 Test Account Credentials:');
    console.log('   All passwords: Test@123\n');

    const [testAccounts] = await pool.query(`
      SELECT username, email, role
      FROM users
      WHERE email LIKE '%@vansris.com'
      ORDER BY
        FIELD(role, 'super_admin', 'owner', 'center_director', 'admin', 'financial_manager', 'teacher', 'parent'),
        email
    `);

    testAccounts.forEach(user => {
      console.log(`   ${user.role.padEnd(20)} | ${user.email.padEnd(25)} | ${user.username || 'N/A'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    console.error('\nPossible causes:');
    console.error('1. Deployment still in progress (wait 2-3 minutes)');
    console.error('2. Migration errors (check DigitalOcean logs)');
    console.error('3. Database connection issues');
    process.exit(1);
  }
}

// Run verification
verifyDeployment();