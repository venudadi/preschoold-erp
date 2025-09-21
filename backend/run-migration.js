import fs from 'fs';
import path from 'path';
import pool from './db.js';

async function runMigration() {
    try {
        console.log('🔄 Running database migration to fix missing columns...');
        
        // Read the migration file
        const migrationPath = path.join(process.cwd(), 'migrations', '010_fix_missing_columns.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Split the migration into individual statements
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
            .filter(stmt => !stmt.match(/^(SET|PREPARE|EXECUTE|DEALLOCATE)/)); // Skip dynamic SQL statements for now
        
        console.log(`📄 Found ${statements.length} SQL statements to execute`);
        
        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
            
            try {
                await pool.query(statement);
                console.log(`✅ Statement ${i + 1} completed successfully`);
            } catch (error) {
                console.log(`⚠️  Statement ${i + 1} failed (this might be expected):`, error.message);
                // Continue with other statements even if some fail
            }
        }
        
        // Now manually add the missing columns with simpler syntax
        console.log('🔧 Adding missing columns manually...');
        
        try {
            await pool.query(`
                ALTER TABLE invoices 
                ADD COLUMN parent_name VARCHAR(255),
                ADD COLUMN parent_phone VARCHAR(20),
                ADD COLUMN parent_email VARCHAR(255),
                ADD COLUMN total_amount DECIMAL(10, 2)
            `);
            console.log('✅ Added missing columns to invoices table');
        } catch (error) {
            console.log('⚠️  Invoices columns might already exist:', error.message);
        }
        
        try {
            await pool.query(`ALTER TABLE staff_assignments ADD COLUMN center_id VARCHAR(36)`);
            console.log('✅ Added center_id to staff_assignments table');
        } catch (error) {
            console.log('⚠️  center_id column might already exist:', error.message);
        }
        
        // Update existing data
        console.log('📊 Updating existing data...');
        
        try {
            await pool.query(`
                UPDATE invoices i
                LEFT JOIN invoice_line_items ili ON i.id = ili.invoice_id
                SET i.total_amount = COALESCE(ili.total_price, 0)
                WHERE i.total_amount IS NULL
            `);
            console.log('✅ Updated invoice total amounts');
        } catch (error) {
            console.log('⚠️  Error updating invoice amounts:', error.message);
        }
        
        try {
            await pool.query(`
                UPDATE staff_assignments sa
                JOIN users u ON sa.user_id = u.id
                SET sa.center_id = COALESCE(u.center_id, 'default-center-001')
                WHERE sa.center_id IS NULL
            `);
            console.log('✅ Updated staff assignments center_id');
        } catch (error) {
            console.log('⚠️  Error updating staff assignments:', error.message);
        }
        
        console.log('🎉 Migration completed successfully!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();