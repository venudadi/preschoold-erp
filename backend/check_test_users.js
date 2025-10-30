import 'dotenv/config';
import pool from './db.js';

async function checkTestUsers() {
  console.log('\n🔍 Checking for test users in the database...\n');

  try {
    // Check for test users
    const [users] = await pool.query(`
      SELECT id, username, email, role, full_name, is_active, center_id
      FROM users
      WHERE email LIKE '%@vanisris.com'
      ORDER BY role, email
    `);

    if (users.length === 0) {
      console.log('❌ NO TEST USERS FOUND!');
      console.log('\nThe migration 044_create_test_data.sql is marked as applied,');
      console.log('but no test users exist in the database.');
      console.log('\nThis means the migration failed silently and needs to be re-run.');
    } else {
      console.log(`✅ Found ${users.length} users with @vanisris.com emails:\n`);
      users.forEach(user => {
        console.log(`  ${user.role.padEnd(20)} | ${user.email.padEnd(30)} | ${user.username || 'NULL'} | Active: ${user.is_active}`);
      });
    }

    // Check for test center
    const [centers] = await pool.query(`
      SELECT id, name, is_active
      FROM centers
      WHERE id = 'test-center-1'
    `);

    console.log(`\n🏢 Test Center: ${centers.length > 0 ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    if (centers.length > 0) {
      console.log(`   Name: ${centers[0].name}`);
      console.log(`   Active: ${centers[0].is_active}`);
    }

    // Check for test children
    const [children] = await pool.query(`
      SELECT COUNT(*) as count
      FROM children
      WHERE id LIKE 'test-child-%'
    `);

    console.log(`\n👶 Test Children: ${children[0].count > 0 ? `✅ ${children[0].count} found` : '❌ NOT FOUND'}`);

    // Check migration status
    const [migrations] = await pool.query(`
      SELECT filename, executed_at
      FROM migrations
      WHERE filename = '044_create_test_data.sql'
    `);

    console.log(`\n📝 Migration Record: ${migrations.length > 0 ? '✅ MARKED AS APPLIED' : '❌ NOT RECORDED'}`);
    if (migrations.length > 0) {
      console.log(`   Executed at: ${migrations[0].executed_at}`);
    }

    console.log('\n' + '='.repeat(80));

    if (users.length === 0 && migrations.length > 0) {
      console.log('\n⚠️  DIAGNOSIS: Migration record exists but test users do not.');
      console.log('\n💡 SOLUTION: Remove the migration record and re-run the migration:');
      console.log('\n   DELETE FROM migrations WHERE filename = \'044_create_test_data.sql\';');
      console.log('   Then trigger a new deployment or run: npm run migrate:deploy');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error checking test users:', error.message);
    process.exit(1);
  }
}

checkTestUsers();
