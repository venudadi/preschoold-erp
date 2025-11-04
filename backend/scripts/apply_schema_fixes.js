import pool from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applySchemaFixes() {
    console.log('🔧 Applying schema fixes to match application code...\n');

    const fixes = [
        {
            name: 'Add student_id to children table',
            sql: `ALTER TABLE children ADD COLUMN IF NOT EXISTS student_id VARCHAR(50) UNIQUE NULL COMMENT 'Auto-generated student ID'`
        },
        {
            name: 'Migrate admission_number to student_id',
            sql: `UPDATE children SET student_id = admission_number WHERE student_id IS NULL AND admission_number IS NOT NULL`
        },
        {
            name: 'Add index on student_id',
            sql: `CREATE INDEX IF NOT EXISTS idx_student_id ON children(student_id)`
        },
        {
            name: 'Add source column to enquiries',
            sql: `ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'Walk-in'`
        },
        {
            name: 'Add enquiry_date column to enquiries',
            sql: `ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS enquiry_date DATE NULL`
        },
        {
            name: 'Add child_dob column to enquiries',
            sql: `ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS child_dob DATE NULL`
        },
        {
            name: 'Add mobile_number column to enquiries',
            sql: `ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(20) NULL`
        },
        {
            name: 'Add company column to enquiries',
            sql: `ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS company VARCHAR(255) NULL`
        },
        {
            name: 'Add has_tie_up column to enquiries',
            sql: `ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS has_tie_up BOOLEAN DEFAULT FALSE`
        },
        {
            name: 'Add parent_location column to enquiries',
            sql: `ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS parent_location VARCHAR(255) NULL`
        },
        {
            name: 'Add major_program column to enquiries',
            sql: `ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS major_program VARCHAR(100) NULL`
        },
        {
            name: 'Add specific_program column to enquiries',
            sql: `ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS specific_program VARCHAR(100) NULL`
        },
        {
            name: 'Add service_hours column to enquiries',
            sql: `ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS service_hours DECIMAL(4,2) NULL`
        },
        {
            name: 'Add reason_for_closure column to enquiries',
            sql: `ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS reason_for_closure TEXT NULL`
        },
        {
            name: 'Add follow_up_flag column to enquiries',
            sql: `ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS follow_up_flag BOOLEAN DEFAULT FALSE`
        },
        {
            name: 'Add assigned_to column to enquiries',
            sql: `ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(255) NULL`
        },
        {
            name: 'Add remarks column to enquiries',
            sql: `ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS remarks TEXT NULL`
        },
        {
            name: 'Add follow_up_date column to enquiries',
            sql: `ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS follow_up_date DATE NULL`
        },
        {
            name: 'Add visited column to enquiries',
            sql: `ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS visited BOOLEAN DEFAULT FALSE`
        },
        {
            name: 'Update existing enquiries with defaults',
            sql: `UPDATE enquiries SET enquiry_date = DATE(created_at) WHERE enquiry_date IS NULL`
        },
        {
            name: 'Copy phone_number to mobile_number',
            sql: `UPDATE enquiries SET mobile_number = phone_number WHERE mobile_number IS NULL AND phone_number IS NOT NULL`
        },
        {
            name: 'Add status column to children',
            sql: `ALTER TABLE children ADD COLUMN IF NOT EXISTS status ENUM('active', 'paused', 'left') NOT NULL DEFAULT 'active'`
        },
        {
            name: 'Add pause_start_date column to children',
            sql: `ALTER TABLE children ADD COLUMN IF NOT EXISTS pause_start_date DATE NULL`
        },
        {
            name: 'Add pause_end_date column to children',
            sql: `ALTER TABLE children ADD COLUMN IF NOT EXISTS pause_end_date DATE NULL`
        },
        {
            name: 'Add pause_reason column to children',
            sql: `ALTER TABLE children ADD COLUMN IF NOT EXISTS pause_reason TEXT NULL`
        },
        {
            name: 'Add pause_notes column to children',
            sql: `ALTER TABLE children ADD COLUMN IF NOT EXISTS pause_notes TEXT NULL`
        },
        {
            name: 'Add paused_by column to children',
            sql: `ALTER TABLE children ADD COLUMN IF NOT EXISTS paused_by VARCHAR(36) NULL`
        },
        {
            name: 'Add service_hours column to children',
            sql: `ALTER TABLE children ADD COLUMN IF NOT EXISTS service_hours DECIMAL(4,2) NULL`
        },
        {
            name: 'Add program_start_time column to children',
            sql: `ALTER TABLE children ADD COLUMN IF NOT EXISTS program_start_time TIME NULL`
        },
        {
            name: 'Add program_end_time column to children',
            sql: `ALTER TABLE children ADD COLUMN IF NOT EXISTS program_end_time TIME NULL`
        },
        {
            name: 'Add index on children.status',
            sql: `CREATE INDEX IF NOT EXISTS idx_status ON children(status)`
        },
        {
            name: 'Add index on enquiries.enquiry_date',
            sql: `CREATE INDEX IF NOT EXISTS idx_enquiry_date ON enquiries(enquiry_date)`
        },
        {
            name: 'Add index on enquiries.follow_up_date',
            sql: `CREATE INDEX IF NOT EXISTS idx_follow_up_date ON enquiries(follow_up_date)`
        }
    ];

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const fix of fixes) {
        try {
            await pool.query(fix.sql);
            console.log(`✅ ${fix.name}`);
            successCount++;
        } catch (error) {
            // Check if error is because column/index already exists
            if (error.code === 'ER_DUP_FIELDNAME' ||
                error.code === 'ER_DUP_KEYNAME' ||
                error.message.includes('Duplicate column name') ||
                error.message.includes('Duplicate key name')) {
                console.log(`⏭️  ${fix.name} (already exists)`);
                skipCount++;
            } else {
                console.error(`❌ ${fix.name}`);
                console.error(`   Error: ${error.message}`);
                errorCount++;
            }
        }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Applied: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

    // Verification
    console.log('\n🔍 Verifying schema changes...\n');

    try {
        // Check children table
        const [childrenCols] = await pool.query(`
            SELECT COLUMN_NAME, DATA_TYPE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'children'
            AND COLUMN_NAME IN ('student_id', 'status', 'pause_start_date', 'service_hours', 'program_start_time')
            ORDER BY ORDINAL_POSITION
        `);

        console.log('Children table - Key columns:');
        childrenCols.forEach(col => {
            console.log(`   ✓ ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
        });

        // Check enquiries table
        const [enquiryCols] = await pool.query(`
            SELECT COLUMN_NAME, DATA_TYPE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'enquiries'
            AND COLUMN_NAME IN ('source', 'enquiry_date', 'mobile_number', 'company', 'follow_up_flag', 'remarks')
            ORDER BY ORDINAL_POSITION
        `);

        console.log('\nEnquiries table - Key columns:');
        enquiryCols.forEach(col => {
            console.log(`   ✓ ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
        });

        // Test the invoice query that was failing
        console.log('\n🧪 Testing invoice query...');
        const [testInvoice] = await pool.query(`
            SELECT c.student_id, c.first_name, c.last_name
            FROM children c
            LIMIT 1
        `);

        if (testInvoice.length > 0) {
            console.log(`   ✅ Invoice query works! Test result: ${testInvoice[0].first_name} (ID: ${testInvoice[0].student_id || 'NULL'})`);
        }

        // Test enquiry insert columns
        console.log('\n🧪 Testing enquiry columns...');
        const [testEnquiry] = await pool.query(`
            SELECT source, enquiry_date, mobile_number, company, has_tie_up
            FROM enquiries
            LIMIT 1
        `);
        console.log('   ✅ Enquiry query works!');

    } catch (error) {
        console.error('❌ Verification failed:', error.message);
    }

    console.log('\n✅ Schema fixes complete!\n');
    console.log('You can now:');
    console.log('1. Add enquiries without schema errors');
    console.log('2. View invoices without student_id errors');
    console.log('3. View child profiles with all details\n');
}

// Run the fixes
applySchemaFixes()
    .then(() => {
        console.log('Done!');
        process.exit(0);
    })
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    })
    .finally(() => {
        pool.end();
    });
