import pool from '../db.js';

async function main() {
  const conn = await pool.getConnection();
  try {
    const [[{ dbname }]] = await conn.query('SELECT DATABASE() AS dbname');
    console.log(`Using database: ${dbname}`);
    const tables = ['user_centers','roles','user_roles'];
    const present = {};
    for (const t of tables) {
      const [[{cnt}]] = await conn.query(
        'SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?', [t]
      );
      present[t] = !!cnt;
      console.log(`${t}: ${cnt ? 'OK' : 'MISSING'}`);
    }
    if (present.user_centers) {
      const [[{assignments}]] = await conn.query('SELECT COUNT(*) AS assignments FROM user_centers');
      console.log(`user_centers rows: ${assignments}`);
    }
    if (present.roles) {
      const [[{rolesCount}]] = await conn.query('SELECT COUNT(*) AS rolesCount FROM roles');
      console.log(`roles rows: ${rolesCount}`);
    }
    if (present.user_roles) {
      const [[{userRoles}]] = await conn.query('SELECT COUNT(*) AS userRoles FROM user_roles');
      console.log(`user_roles rows: ${userRoles}`);
    }
  } finally {
    conn.release();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
