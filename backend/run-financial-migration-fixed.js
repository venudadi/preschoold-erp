import pool from './db.js';

async function runFinancialMigration() {
    try {
        console.log('=== Running Financial Manager Budget Control Migration (Fixed) ===');

        // Create budget_approval_limits table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS budget_approval_limits (
                id VARCHAR(36) PRIMARY KEY,
                center_id VARCHAR(36) NOT NULL,
                role ENUM('center_director', 'admin', 'academic_coordinator') NOT NULL,
                user_id VARCHAR(36), -- Specific user override, NULL for role-based
                approval_limit DECIMAL(12,2) NOT NULL DEFAULT 0,
                category_limits JSON COMMENT 'Category-specific limits',
                fiscal_year INT NOT NULL,
                effective_date DATE NOT NULL,
                expiry_date DATE,
                created_by VARCHAR(36) NOT NULL COMMENT 'Financial Manager who set this limit',
                approved_by VARCHAR(36) COMMENT 'Higher authority approval if needed',
                notes TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                UNIQUE KEY unique_role_center_year (center_id, role, fiscal_year, user_id),
                INDEX idx_budget_limits_center (center_id),
                INDEX idx_budget_limits_role (role),
                INDEX idx_budget_limits_active (is_active),
                INDEX idx_budget_limits_fiscal (fiscal_year)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Created budget_approval_limits table');

        // Create financial_oversight table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS financial_oversight (
                id VARCHAR(36) PRIMARY KEY,
                center_id VARCHAR(36) NOT NULL,
                oversight_type ENUM('budget_alert', 'limit_exceeded', 'unusual_spending', 'approval_required') NOT NULL,
                severity ENUM('info', 'warning', 'critical') NOT NULL DEFAULT 'info',
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                amount DECIMAL(12,2),
                related_request_id VARCHAR(36), -- Link to budget_approvals
                related_user_id VARCHAR(36), -- User who triggered this oversight
                action_required BOOLEAN DEFAULT FALSE,
                action_taken TEXT,
                handled_by VARCHAR(36), -- Financial Manager who handled it
                handled_at TIMESTAMP NULL,
                status ENUM('open', 'reviewing', 'resolved', 'dismissed') DEFAULT 'open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                INDEX idx_oversight_center (center_id),
                INDEX idx_oversight_type (oversight_type),
                INDEX idx_oversight_status (status),
                INDEX idx_oversight_severity (severity),
                INDEX idx_oversight_date (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Created financial_oversight table');

        // Create budget_categories table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS budget_categories (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                parent_category VARCHAR(36), -- For subcategories
                default_limit DECIMAL(12,2) DEFAULT 0,
                requires_justification BOOLEAN DEFAULT FALSE,
                requires_fm_approval BOOLEAN DEFAULT FALSE, -- Always requires FM approval regardless of amount
                is_active BOOLEAN DEFAULT TRUE,
                display_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                INDEX idx_categories_active (is_active),
                INDEX idx_categories_parent (parent_category)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Created budget_categories table');

        // Update users table role enum to include financial_manager
        await pool.query(`
            ALTER TABLE users MODIFY COLUMN role ENUM(
                'super_admin',
                'owner',
                'financial_manager',
                'center_director',
                'admin',
                'academic_coordinator',
                'teacher',
                'parent'
            ) NOT NULL
        `);
        console.log('✅ Updated users role enum');

        // Add financial management columns to users table
        try {
            await pool.query(`
                ALTER TABLE users
                ADD COLUMN financial_authority_level ENUM('none', 'center', 'multi_center', 'corporate') DEFAULT 'none',
                ADD COLUMN can_set_budget_limits BOOLEAN DEFAULT FALSE,
                ADD COLUMN max_budget_authority DECIMAL(12,2) DEFAULT 0,
                ADD COLUMN assigned_centers JSON COMMENT 'Centers this Financial Manager oversees'
            `);
            console.log('✅ Added financial management columns to users table');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  Financial management columns already exist');
            } else {
                throw error;
            }
        }

        // Update budget_approvals table to track financial oversight
        try {
            await pool.query(`
                ALTER TABLE budget_approvals
                ADD COLUMN fm_review_required BOOLEAN DEFAULT FALSE,
                ADD COLUMN fm_reviewed_by VARCHAR(36),
                ADD COLUMN fm_review_date TIMESTAMP NULL,
                ADD COLUMN fm_review_notes TEXT,
                ADD COLUMN escalated_to_fm BOOLEAN DEFAULT FALSE,
                ADD COLUMN actual_approver_role ENUM('center_director', 'admin', 'financial_manager', 'owner', 'super_admin')
            `);
            console.log('✅ Added financial oversight columns to budget_approvals');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  Financial oversight columns already exist');
            } else {
                throw error;
            }
        }

        // Insert default budget categories
        const categories = [
            ['operations', 'General operational expenses', 5000, false, false],
            ['staff', 'Staff-related expenses including overtime, bonuses', 3000, true, false],
            ['maintenance', 'Facility maintenance and repairs', 2000, false, false],
            ['supplies', 'Educational and office supplies', 1500, false, false],
            ['marketing', 'Marketing and promotional activities', 2500, true, false],
            ['technology', 'Technology equipment and software', 5000, true, true],
            ['emergency', 'Emergency and urgent expenses', 10000, true, true],
            ['other', 'Miscellaneous expenses', 1000, true, false]
        ];

        for (const [name, description, defaultLimit, requiresJustification, requiresFmApproval] of categories) {
            try {
                await pool.query(`
                    INSERT INTO budget_categories (id, name, description, default_limit, requires_justification, requires_fm_approval)
                    VALUES (UUID(), ?, ?, ?, ?, ?)
                `, [name, description, defaultLimit, requiresJustification, requiresFmApproval]);
                console.log(`✅ Added category: ${name}`);
            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    console.log(`⚠️  Category already exists: ${name}`);
                } else {
                    console.error(`❌ Error adding category ${name}:`, error.message);
                }
            }
        }

        // Get all centers and set default approval limits
        const [centers] = await pool.query('SELECT id FROM centers');

        for (const center of centers) {
            // Set default limits for center directors
            try {
                await pool.query(`
                    INSERT INTO budget_approval_limits (id, center_id, role, approval_limit, fiscal_year, effective_date, created_by)
                    VALUES (UUID(), ?, 'center_director', 50000.00, YEAR(CURDATE()), CURDATE(), 'system')
                `, [center.id]);
                console.log(`✅ Set center_director limit for center ${center.id}`);
            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    console.log(`⚠️  Center director limit already exists for center ${center.id}`);
                }
            }

            // Set default limits for admins
            try {
                await pool.query(`
                    INSERT INTO budget_approval_limits (id, center_id, role, approval_limit, fiscal_year, effective_date, created_by)
                    VALUES (UUID(), ?, 'admin', 15000.00, YEAR(CURDATE()), CURDATE(), 'system')
                `, [center.id]);
                console.log(`✅ Set admin limit for center ${center.id}`);
            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    console.log(`⚠️  Admin limit already exists for center ${center.id}`);
                }
            }
        }

        // Update existing financial managers
        const [fmUpdateResult] = await pool.query(`
            UPDATE users
            SET financial_authority_level = 'corporate',
                can_set_budget_limits = TRUE,
                max_budget_authority = 500000.00
            WHERE role = 'financial_manager'
        `);
        console.log(`✅ Updated ${fmUpdateResult.affectedRows} financial managers`);

        // Update existing center directors
        const [cdUpdateResult] = await pool.query(`
            UPDATE users
            SET financial_authority_level = 'center',
                max_budget_authority = 100000.00
            WHERE role = 'center_director'
        `);
        console.log(`✅ Updated ${cdUpdateResult.affectedRows} center directors`);

        console.log('✅ Financial Manager budget control migration completed successfully');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

runFinancialMigration();