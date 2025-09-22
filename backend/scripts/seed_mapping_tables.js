import pool from '../db.js';
import { randomUUID } from 'crypto';

async function seedTables() {
  const conn = await pool.getConnection();
  try {
    // First check current roles and update if needed
    console.log('Checking roles...');
    const [existingRoles] = await conn.query('SELECT name FROM roles');
    const roleNames = existingRoles.map(r => r.name);
    console.log('Existing roles:', roleNames);

    // Update users with missing roles
    const [users] = await conn.query('SELECT DISTINCT role FROM users');
    const userRoles = users.map(u => u.role);
    console.log('User roles in users table:', userRoles);

    // Insert missing roles
    const missingRoles = userRoles.filter(role => !roleNames.includes(role));
    for (const role of missingRoles) {
      if (role) {
        try {
          await conn.query('INSERT IGNORE INTO roles (name) VALUES (?)', [role]);
          console.log(`✅ Added role: ${role}`);
        } catch (e) {
          console.log(`⚠️ Role ${role}:`, e.message);
        }
      }
    }

    // Now add the role foreign key constraint
    try {
      await conn.query('ALTER TABLE user_roles ADD CONSTRAINT fk_ur_role FOREIGN KEY (role) REFERENCES roles(name) ON DELETE CASCADE');
      console.log('✅ user_roles -> roles FK added');
    } catch (e) {
      console.log('⚠️ user_roles -> roles FK:', e.message);
    }

    // Seed user_roles from users table
    console.log('Seeding user_roles...');
    const [usersWithRoles] = await conn.query('SELECT id, role FROM users WHERE role IS NOT NULL');

    for (const user of usersWithRoles) {
      const newId = randomUUID();
      try {
        await conn.query(
          'INSERT IGNORE INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
          [newId, user.id, user.role]
        );
      } catch (e) {
        console.log(`⚠️ Seeding user_role for ${user.id}:`, e.message);
      }
    }
    console.log(`✅ Seeded ${usersWithRoles.length} user_roles`);

    // Seed user_centers from users table
    console.log('Seeding user_centers...');
    const [usersWithCenters] = await conn.query('SELECT id, center_id FROM users WHERE center_id IS NOT NULL');

    for (const user of usersWithCenters) {
      const newId = randomUUID();
      try {
        await conn.query(
          'INSERT IGNORE INTO user_centers (id, user_id, center_id) VALUES (?, ?, ?)',
          [newId, user.id, user.center_id]
        );
      } catch (e) {
        console.log(`⚠️ Seeding user_center for ${user.id}:`, e.message);
      }
    }
    console.log(`✅ Seeded ${usersWithCenters.length} user_centers`);

  } finally {
    conn.release();
    process.exit(0);
  }
}

seedTables().catch(e => {
  console.error(e);
  process.exit(1);
});