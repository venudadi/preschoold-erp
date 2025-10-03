import pool from './db.js';
import fs from 'fs';

async function runFinancialMigration() {
    try {
        console.log('=== Running Financial Manager Budget Control Migration ===');

        const migrationSQL = fs.readFileSync('migrations/031_financial_manager_budget_control.sql', 'utf8');

        // Split by semicolons but be careful with complex statements
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && stmt !== '\n' && !stmt.includes('DELIMITER'));

        for (const statement of statements) {
            if (statement.trim() && !statement.includes('//')) {
                try {
                    await pool.query(statement);
                    console.log(`✅ Executed: ${statement.substring(0, 80)}...`);
                } catch (error) {
                    // Some statements might fail if they already exist, which is okay
                    if (error.code === 'ER_DUP_FIELDNAME' ||
                        error.code === 'ER_TABLE_EXISTS_ERROR' ||
                        error.code === 'ER_DUP_ENTRY' ||
                        error.code === 'ER_DUP_KEYNAME') {
                        console.log(`⚠️  Already exists: ${statement.substring(0, 60)}...`);
                    } else {
                        console.error(`❌ Error in: ${statement.substring(0, 60)}...`);
                        console.error(error.message);
                    }
                }
            }
        }

        // Handle the trigger separately
        try {
            await pool.query('DROP TRIGGER IF EXISTS check_budget_approval_limits');

            const triggerSQL = `
            CREATE TRIGGER check_budget_approval_limits
                BEFORE UPDATE ON budget_approvals
                FOR EACH ROW
            BEGIN
                DECLARE user_limit DECIMAL(12,2) DEFAULT 0;
                DECLARE requires_fm BOOLEAN DEFAULT FALSE;

                IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
                    SELECT
                        COALESCE(bal.approval_limit, u.budget_approval_limit, 0) INTO user_limit
                    FROM users u
                    LEFT JOIN budget_approval_limits bal ON (
                        bal.center_id = (SELECT center_id FROM users WHERE id = NEW.approved_by)
                        AND bal.role = (SELECT role FROM users WHERE id = NEW.approved_by)
                        AND bal.is_active = TRUE
                        AND bal.fiscal_year = YEAR(CURDATE())
                    )
                    WHERE u.id = NEW.approved_by;

                    SELECT COALESCE(requires_fm_approval, FALSE) INTO requires_fm
                    FROM budget_categories
                    WHERE name = NEW.category;

                    IF NEW.amount > user_limit OR requires_fm = TRUE THEN
                        SET NEW.fm_review_required = TRUE;
                        SET NEW.escalated_to_fm = TRUE;

                        INSERT INTO financial_oversight (
                            id, center_id, oversight_type, severity, title, description,
                            amount, related_request_id, related_user_id, action_required
                        ) VALUES (
                            UUID(),
                            (SELECT center_id FROM users WHERE id = NEW.approved_by),
                            'approval_required',
                            CASE WHEN NEW.amount > user_limit * 2 THEN 'critical'
                                 WHEN NEW.amount > user_limit * 1.5 THEN 'warning'
                                 ELSE 'info' END,
                            CONCAT('Budget approval exceeds authority: ', NEW.description),
                            CONCAT('Amount: $', NEW.amount, ' exceeds approval limit of $', user_limit),
                            NEW.amount,
                            NEW.id,
                            NEW.approved_by,
                            TRUE
                        );
                    END IF;

                    SET NEW.actual_approver_role = (SELECT role FROM users WHERE id = NEW.approved_by);
                END IF;
            END
            `;

            await pool.query(triggerSQL);
            console.log('✅ Created budget approval trigger');
        } catch (error) {
            console.log('⚠️  Trigger creation may have failed:', error.message);
        }

        // Verify the changes
        const [tables] = await pool.query(`
            SELECT TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME IN ('budget_approval_limits', 'financial_oversight', 'budget_categories')
            ORDER BY TABLE_NAME
        `);
        console.log('Financial Manager tables created:', tables.map(t => t.TABLE_NAME));

        const [roleColumn] = await pool.query(`
            SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'role'
        `);
        console.log('Updated role enum:', roleColumn[0]?.COLUMN_TYPE);

        console.log('✅ Financial Manager budget control migration completed successfully');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        await pool.end();
    }
}

runFinancialMigration();