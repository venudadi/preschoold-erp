import pool from '../db.js';

const TABLES = [
  'centers','users','classrooms','children','enquiries','invoices','invoice_items','user_centers','roles','user_roles','fee_structures','attendance_records','attendance_settings','attendance_summaries','documents','document_entities','exit_records','sessions'
];

async function getColumns(conn, table) {
  const [rows] = await conn.query(
    `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY, EXTRA
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
     ORDER BY ORDINAL_POSITION`, [table]
  );
  return rows;
}

async function getFKs(conn, table) {
  const [rows] = await conn.query(
    `SELECT
       k.CONSTRAINT_NAME,
       k.COLUMN_NAME,
       k.REFERENCED_TABLE_NAME,
       k.REFERENCED_COLUMN_NAME
     FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
     JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS c
       ON k.CONSTRAINT_NAME = c.CONSTRAINT_NAME
      AND k.TABLE_SCHEMA = c.TABLE_SCHEMA
      AND k.TABLE_NAME = c.TABLE_NAME
     WHERE k.TABLE_SCHEMA = DATABASE()
       AND k.TABLE_NAME = ?
       AND c.CONSTRAINT_TYPE = 'FOREIGN KEY'
     ORDER BY k.CONSTRAINT_NAME, k.ORDINAL_POSITION`, [table]
  );
  return rows;
}

async function main() {
  const conn = await pool.getConnection();
  try {
    console.log(`Schema for DB: ${(await conn.query('SELECT DATABASE() as db'))[0][0].db}`);
    for (const table of TABLES) {
      const [[{count}]] = await conn.query('SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?', [table]);
      if (!count) { console.log(`- ${table}: (missing)`); continue; }
      console.log(`- ${table}:`);
      const cols = await getColumns(conn, table);
      cols.forEach(c => console.log(`  col ${c.COLUMN_NAME} ${c.DATA_TYPE} ${c.IS_NULLABLE==='YES'?'NULL':'NOT NULL'}${c.COLUMN_DEFAULT!==null?` DEFAULT ${c.COLUMN_DEFAULT}`:''}${c.EXTRA?` ${c.EXTRA}`:''}${c.COLUMN_KEY?` KEY(${c.COLUMN_KEY})`:''}`));
      const fks = await getFKs(conn, table);
      fks.forEach(f => console.log(`  fk  ${f.COLUMN_NAME} -> ${f.REFERENCED_TABLE_NAME}(${f.REFERENCED_COLUMN_NAME})`));
    }
  } finally {
    conn.release();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
