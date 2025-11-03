import pool from '../db.js';

async function verifyProfileSystem() {
    console.log('🔍 Verifying Child Profile System...\n');

    try {
        // 1. Check if parent_children table exists and its structure
        console.log('1️⃣ Checking parent_children table structure:');
        const [pcColumns] = await pool.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'parent_children'
            ORDER BY ORDINAL_POSITION
        `);

        if (pcColumns.length === 0) {
            console.log('❌ parent_children table does NOT exist!\n');
        } else {
            console.log('✅ parent_children table exists:');
            pcColumns.forEach(col => {
                console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.COLUMN_KEY ? `[${col.COLUMN_KEY}]` : ''}`);
            });
            console.log('');
        }

        // 2. Check parents table structure
        console.log('2️⃣ Checking parents table structure:');
        const [pColumns] = await pool.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'parents'
            ORDER BY ORDINAL_POSITION
        `);

        if (pColumns.length === 0) {
            console.log('❌ parents table does NOT exist!\n');
        } else {
            console.log('✅ parents table exists:');
            pColumns.forEach(col => {
                console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.COLUMN_KEY ? `[${col.COLUMN_KEY}]` : ''}`);
            });
            console.log('');
        }

        // 3. Check children table structure
        console.log('3️⃣ Checking children table structure:');
        const [cColumns] = await pool.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'children'
            ORDER BY ORDINAL_POSITION
        `);

        if (cColumns.length === 0) {
            console.log('❌ children table does NOT exist!\n');
        } else {
            console.log('✅ children table exists with columns:');
            const essentialColumns = ['id', 'first_name', 'last_name', 'student_id', 'date_of_birth',
                'gender', 'status', 'center_id', 'classroom_id', 'company_id', 'has_tie_up',
                'allergies', 'medical_info', 'emergency_contact_name', 'emergency_contact_phone'];

            essentialColumns.forEach(col => {
                const found = cColumns.find(c => c.COLUMN_NAME === col);
                if (found) {
                    console.log(`   ✅ ${col} (${found.DATA_TYPE})`);
                } else {
                    console.log(`   ❌ ${col} - MISSING!`);
                }
            });
            console.log('');
        }

        // 4. Check if there are any children
        console.log('4️⃣ Checking existing children:');
        const [children] = await pool.query('SELECT id, first_name, last_name, student_id FROM children LIMIT 5');
        console.log(`   Found ${children.length} children in database`);
        if (children.length > 0) {
            children.forEach(child => {
                console.log(`   - ${child.first_name} ${child.last_name} (${child.student_id || 'No ID'})`);
            });
        }
        console.log('');

        // 5. Check if there are any parents
        console.log('5️⃣ Checking existing parents:');
        const [parents] = await pool.query('SELECT id, first_name, last_name, email, phone_number FROM parents LIMIT 10');
        console.log(`   Found ${parents.length} parents in database`);
        if (parents.length > 0) {
            parents.forEach(parent => {
                console.log(`   - ${parent.first_name} ${parent.last_name} (${parent.email || 'No email'})`);
            });
        }
        console.log('');

        // 6. Check parent-child relationships
        console.log('6️⃣ Checking parent-child relationships:');
        const [relationships] = await pool.query(`
            SELECT
                c.first_name as child_first,
                c.last_name as child_last,
                p.first_name as parent_first,
                p.last_name as parent_last,
                p.email,
                pc.relationship_type,
                pc.is_primary
            FROM parent_children pc
            JOIN children c ON pc.child_id = c.id
            JOIN parents p ON pc.parent_id = p.id
            LIMIT 10
        `);
        console.log(`   Found ${relationships.length} parent-child relationships`);
        if (relationships.length > 0) {
            relationships.forEach(rel => {
                console.log(`   - ${rel.child_first} ${rel.child_last} ← ${rel.relationship_type || 'Guardian'} → ${rel.parent_first} ${rel.parent_last} ${rel.is_primary ? '(PRIMARY)' : ''}`);
            });
        }
        console.log('');

        // 7. Test the actual profile query
        if (children.length > 0) {
            console.log('7️⃣ Testing profile query with first child:');
            const testChildId = children[0].id;

            // Get child basic information
            const childSql = `
                SELECT
                    c.id,
                    c.first_name,
                    c.last_name,
                    c.date_of_birth,
                    c.gender,
                    c.student_id,
                    c.status,
                    c.center_id,
                    c.classroom_id,
                    c.company_id,
                    c.has_tie_up,
                    c.allergies,
                    c.emergency_contact_name,
                    c.emergency_contact_phone,
                    c.medical_info,
                    c.created_at as enrollment_date,
                    cl.name as classroom_name,
                    ce.name as center_name,
                    co.company_name,
                    co.discount_percentage as company_discount
                FROM children c
                LEFT JOIN classrooms cl ON c.classroom_id = cl.id
                LEFT JOIN centers ce ON c.center_id = ce.id
                LEFT JOIN companies co ON c.company_id = co.id
                WHERE c.id = ?
            `;

            const [childRows] = await pool.query(childSql, [testChildId]);

            if (childRows.length > 0) {
                console.log(`   ✅ Child query successful for: ${childRows[0].first_name} ${childRows[0].last_name}`);
                console.log(`      - Student ID: ${childRows[0].student_id || 'N/A'}`);
                console.log(`      - Center: ${childRows[0].center_name || 'N/A'}`);
                console.log(`      - Classroom: ${childRows[0].classroom_name || 'N/A'}`);
            }

            // Get parents
            const parentsSql = `
                SELECT
                    p.id,
                    p.first_name,
                    p.last_name,
                    p.email,
                    p.phone_number,
                    p.relationship_to_child,
                    pc.relationship_type,
                    pc.is_primary
                FROM parent_children pc
                JOIN parents p ON pc.parent_id = p.id
                WHERE pc.child_id = ?
                ORDER BY pc.is_primary DESC, p.created_at ASC
            `;

            const [parentsRows] = await pool.query(parentsSql, [testChildId]);
            console.log(`   ✅ Parents query successful: Found ${parentsRows.length} parent(s)`);
            parentsRows.forEach(p => {
                console.log(`      - ${p.first_name} ${p.last_name} (${p.email || 'No email'}) [${p.relationship_type || 'Guardian'}]`);
            });

            // Get billing
            const billingSql = `
                SELECT
                    SUM(CASE WHEN status IN ('Sent', 'Partial', 'Overdue') THEN balance ELSE 0 END) as outstanding_balance,
                    SUM(amount_paid) as total_paid,
                    COUNT(*) as total_invoices
                FROM invoices
                WHERE child_id = ?
            `;

            const [billingRows] = await pool.query(billingSql, [testChildId]);
            console.log(`   ✅ Billing query successful: ${billingRows[0].total_invoices} invoice(s)`);
            console.log('');
        }

        // 8. Identify children without parents
        console.log('8️⃣ Finding children without parents:');
        const [orphans] = await pool.query(`
            SELECT c.id, c.first_name, c.last_name, c.student_id
            FROM children c
            LEFT JOIN parent_children pc ON c.id = pc.child_id
            WHERE pc.id IS NULL
            LIMIT 10
        `);

        if (orphans.length > 0) {
            console.log(`   ⚠️  Found ${orphans.length} children without parents:`);
            orphans.forEach(child => {
                console.log(`      - ${child.first_name} ${child.last_name} (ID: ${child.id})`);
            });
            console.log('');
        } else {
            console.log('   ✅ All children have at least one parent linked\n');
        }

        console.log('✅ Verification complete!\n');

    } catch (error) {
        console.error('❌ Error during verification:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

verifyProfileSystem();
