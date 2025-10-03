import fs from 'fs';
import pool from './db.js';

async function runMigration() {
  try {
    console.log('Running migration 028_add_student_pause_functionality.sql...');

    // Add the missing columns to children table
    const alterStatements = [
      `ALTER TABLE children ADD COLUMN status ENUM('active', 'paused', 'left') NOT NULL DEFAULT 'active'`,
      `ALTER TABLE children ADD COLUMN pause_start_date DATE NULL`,
      `ALTER TABLE children ADD COLUMN pause_end_date DATE NULL`,
      `ALTER TABLE children ADD COLUMN pause_reason TEXT NULL`
    ];

    for (const statement of alterStatements) {
      try {
        await pool.query(statement);
        console.log('✅ Added column:', statement.split('ADD COLUMN ')[1]?.split(' ')[0] || 'column');
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log('ℹ️  Column already exists:', statement.split('ADD COLUMN ')[1]?.split(' ')[0] || 'column');
        } else {
          console.error('❌ Error adding column:', err.message);
        }
      }
    }

    // Update existing records to have 'active' status
    try {
      const result = await pool.query(`UPDATE children SET status = 'active' WHERE status IS NULL`);
      console.log('✅ Updated existing records to active status');
    } catch (err) {
      console.log('ℹ️  Status update:', err.message);
    }

    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('Migration Error:', error);
  } finally {
    await pool.end();
  }
}

runMigration();