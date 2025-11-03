import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const testParents = [
    {
        first_name: 'Priya',
        last_name: 'Sharma',
        email: 'priya.sharma@vanisris.com',
        phone_number: '+91-9876543210',
        relationship_to_child: 'Mother'
    },
    {
        first_name: 'Raj',
        last_name: 'Sharma',
        email: 'raj.sharma@vanisris.com',
        phone_number: '+91-9876543211',
        relationship_to_child: 'Father'
    },
    {
        first_name: 'Anita',
        last_name: 'Kumar',
        email: 'anita.kumar@vanisris.com',
        phone_number: '+91-9876543212',
        relationship_to_child: 'Mother'
    },
    {
        first_name: 'Amit',
        last_name: 'Kumar',
        email: 'amit.kumar@vanisris.com',
        phone_number: '+91-9876543213',
        relationship_to_child: 'Father'
    },
    {
        first_name: 'Sunita',
        last_name: 'Reddy',
        email: 'sunita.reddy@vanisris.com',
        phone_number: '+91-9876543214',
        relationship_to_child: 'Guardian'
    },
    {
        first_name: 'Meera',
        last_name: 'Patel',
        email: 'meera.patel@vanisris.com',
        phone_number: '+91-9876543215',
        relationship_to_child: 'Mother'
    },
    {
        first_name: 'Vikram',
        last_name: 'Patel',
        email: 'vikram.patel@vanisris.com',
        phone_number: '+91-9876543216',
        relationship_to_child: 'Father'
    }
];

async function seedTestParents() {
    console.log('🌱 Seeding test parents and linking to children...\n');

    try {
        // Step 1: Create test parents if they don't exist
        console.log('1️⃣ Creating test parents...');
        const createdParents = [];

        for (const parent of testParents) {
            // Check if parent already exists
            const [existing] = await pool.query(
                'SELECT id FROM parents WHERE email = ?',
                [parent.email]
            );

            let parentId;
            if (existing.length > 0) {
                parentId = existing[0].id;
                console.log(`   ✓ Parent already exists: ${parent.first_name} ${parent.last_name} (${parent.email})`);
            } else {
                parentId = uuidv4();
                await pool.query(
                    `INSERT INTO parents (id, first_name, last_name, email, phone_number, relationship_to_child, is_primary_contact)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        parentId,
                        parent.first_name,
                        parent.last_name,
                        parent.email,
                        parent.phone_number,
                        parent.relationship_to_child,
                        parent.relationship_to_child === 'Mother' || parent.relationship_to_child === 'Guardian'
                    ]
                );
                console.log(`   ✅ Created parent: ${parent.first_name} ${parent.last_name} (${parent.email})`);
            }

            createdParents.push({
                ...parent,
                id: parentId
            });
        }

        console.log(`\n   Total parents available: ${createdParents.length}\n`);

        // Step 2: Find children without parents
        console.log('2️⃣ Finding children without parents...');
        const [orphans] = await pool.query(`
            SELECT c.id, c.first_name, c.last_name, c.student_id
            FROM children c
            LEFT JOIN parent_children pc ON c.id = pc.child_id
            WHERE pc.id IS NULL
        `);

        console.log(`   Found ${orphans.length} children without parents\n`);

        if (orphans.length === 0) {
            console.log('   ✅ All children already have parents!\n');
        } else {
            // Step 3: Link orphaned children to test parents
            console.log('3️⃣ Linking children to test parents...');

            // Group parents by family
            const sharmaFamily = createdParents.filter(p => p.last_name === 'Sharma');
            const kumarFamily = createdParents.filter(p => p.last_name === 'Kumar');
            const patelFamily = createdParents.filter(p => p.last_name === 'Patel');
            const reddyGuardian = createdParents.filter(p => p.last_name === 'Reddy');

            for (let i = 0; i < orphans.length; i++) {
                const child = orphans[i];
                let familyParents;

                // Round-robin assignment
                if (i % 4 === 0) {
                    familyParents = sharmaFamily;
                } else if (i % 4 === 1) {
                    familyParents = kumarFamily;
                } else if (i % 4 === 2) {
                    familyParents = reddyGuardian;
                } else {
                    familyParents = patelFamily;
                }

                // Link child to parent(s)
                for (let j = 0; j < familyParents.length; j++) {
                    const parent = familyParents[j];
                    const isPrimary = j === 0; // First parent is primary

                    // Check if relationship already exists
                    const [existingLink] = await pool.query(
                        'SELECT id FROM parent_children WHERE parent_id = ? AND child_id = ?',
                        [parent.id, child.id]
                    );

                    if (existingLink.length === 0) {
                        await pool.query(
                            `INSERT INTO parent_children (id, parent_id, child_id, relationship_type, is_primary)
                             VALUES (?, ?, ?, ?, ?)`,
                            [
                                uuidv4(),
                                parent.id,
                                child.id,
                                parent.relationship_to_child,
                                isPrimary
                            ]
                        );
                    }
                }

                console.log(`   ✅ Linked: ${child.first_name} ${child.last_name} → ${familyParents.map(p => p.first_name).join(' & ')}`);
            }
        }

        // Step 4: Verification
        console.log('\n4️⃣ Verification - Children with parent counts:');
        const [verification] = await pool.query(`
            SELECT
                c.id,
                c.first_name,
                c.last_name,
                c.student_id,
                COUNT(pc.id) as parent_count,
                GROUP_CONCAT(CONCAT(p.first_name, ' ', p.last_name, ' (', pc.relationship_type, ')') SEPARATOR ', ') as parents
            FROM children c
            LEFT JOIN parent_children pc ON c.id = pc.child_id
            LEFT JOIN parents p ON pc.parent_id = p.id
            GROUP BY c.id, c.first_name, c.last_name, c.student_id
            ORDER BY parent_count ASC, c.created_at DESC
            LIMIT 20
        `);

        verification.forEach(child => {
            const emoji = child.parent_count === 0 ? '❌' : '✅';
            console.log(`   ${emoji} ${child.first_name} ${child.last_name} (${child.student_id || 'No ID'}): ${child.parent_count} parent(s)`);
            if (child.parents) {
                console.log(`      └─ ${child.parents}`);
            }
        });

        // Step 5: Check for any remaining orphans
        console.log('\n5️⃣ Final check for children without parents:');
        const [remainingOrphans] = await pool.query(`
            SELECT c.id, c.first_name, c.last_name, c.student_id
            FROM children c
            LEFT JOIN parent_children pc ON c.id = pc.child_id
            WHERE pc.id IS NULL
        `);

        if (remainingOrphans.length > 0) {
            console.log(`   ❌ CRITICAL: ${remainingOrphans.length} children still have NO parents!`);
            remainingOrphans.forEach(child => {
                console.log(`      - ${child.first_name} ${child.last_name} (ID: ${child.id})`);
            });
        } else {
            console.log('   ✅ SUCCESS: All children have at least ONE parent!\n');
        }

        console.log('✅ Test parent seeding complete!\n');

    } catch (error) {
        console.error('❌ Error seeding test parents:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

seedTestParents();
