-- Seed Test Parents and Link to Children
-- This script ensures all children have at least one parent linked
-- MySQL-compatible syntax

-- Create test parents with @vanisris.com email addresses
-- Check if test parents already exist first

-- Test Mother 1
INSERT IGNORE INTO parents (id, first_name, last_name, email, phone_number, relationship_to_child, is_primary_contact)
VALUES (
    UUID(),
    'Priya',
    'Sharma',
    'priya.sharma@vanisris.com',
    '+91-9876543210',
    'Mother',
    TRUE
);

-- Test Father 1
INSERT IGNORE INTO parents (id, first_name, last_name, email, phone_number, relationship_to_child, is_primary_contact)
VALUES (
    UUID(),
    'Raj',
    'Sharma',
    'raj.sharma@vanisris.com',
    '+91-9876543211',
    'Father',
    FALSE
);

-- Test Mother 2
INSERT IGNORE INTO parents (id, first_name, last_name, email, phone_number, relationship_to_child, is_primary_contact)
VALUES (
    UUID(),
    'Anita',
    'Kumar',
    'anita.kumar@vanisris.com',
    '+91-9876543212',
    'Mother',
    TRUE
);

-- Test Father 2
INSERT IGNORE INTO parents (id, first_name, last_name, email, phone_number, relationship_to_child, is_primary_contact)
VALUES (
    UUID(),
    'Amit',
    'Kumar',
    'amit.kumar@vanisris.com',
    '+91-9876543213',
    'Father',
    FALSE
);

-- Test Guardian 1
INSERT IGNORE INTO parents (id, first_name, last_name, email, phone_number, relationship_to_child, is_primary_contact)
VALUES (
    UUID(),
    'Sunita',
    'Reddy',
    'sunita.reddy@vanisris.com',
    '+91-9876543214',
    'Guardian',
    TRUE
);

-- Test Mother 3
INSERT IGNORE INTO parents (id, first_name, last_name, email, phone_number, relationship_to_child, is_primary_contact)
VALUES (
    UUID(),
    'Meera',
    'Patel',
    'meera.patel@vanisris.com',
    '+91-9876543215',
    'Mother',
    TRUE
);

-- Test Father 3
INSERT IGNORE INTO parents (id, first_name, last_name, email, phone_number, relationship_to_child, is_primary_contact)
VALUES (
    UUID(),
    'Vikram',
    'Patel',
    'vikram.patel@vanisris.com',
    '+91-9876543216',
    'Father',
    FALSE
);

-- Link children without parents to test parents
-- This ensures every child has at least ONE parent (non-negotiable requirement)

-- Get the IDs of test parents for linking
SET @test_mother_1 = (SELECT id FROM parents WHERE email = 'priya.sharma@vanisris.com' LIMIT 1);
SET @test_father_1 = (SELECT id FROM parents WHERE email = 'raj.sharma@vanisris.com' LIMIT 1);
SET @test_mother_2 = (SELECT id FROM parents WHERE email = 'anita.kumar@vanisris.com' LIMIT 1);
SET @test_father_2 = (SELECT id FROM parents WHERE email = 'amit.kumar@vanisris.com' LIMIT 1);
SET @test_guardian = (SELECT id FROM parents WHERE email = 'sunita.reddy@vanisris.com' LIMIT 1);
SET @test_mother_3 = (SELECT id FROM parents WHERE email = 'meera.patel@vanisris.com' LIMIT 1);
SET @test_father_3 = (SELECT id FROM parents WHERE email = 'vikram.patel@vanisris.com' LIMIT 1);

-- Link orphaned children (children without any parent) to test parents
-- We'll use a round-robin approach to distribute children among parent pairs

-- Find all children without parents and link them
-- First, create a temporary table to track orphans with row numbers
CREATE TEMPORARY TABLE IF NOT EXISTS temp_orphans AS
SELECT
    c.id as child_id,
    ROW_NUMBER() OVER (ORDER BY c.created_at) as rn
FROM children c
LEFT JOIN parent_children pc ON c.id = pc.child_id
WHERE pc.id IS NULL;

-- Link first group to Sharma family (Mother + Father)
INSERT INTO parent_children (id, parent_id, child_id, relationship_type, is_primary)
SELECT
    UUID(),
    @test_mother_1,
    child_id,
    'Mother',
    TRUE
FROM temp_orphans
WHERE MOD(rn, 3) = 1
ON DUPLICATE KEY UPDATE parent_id = parent_id;

INSERT INTO parent_children (id, parent_id, child_id, relationship_type, is_primary)
SELECT
    UUID(),
    @test_father_1,
    child_id,
    'Father',
    FALSE
FROM temp_orphans
WHERE MOD(rn, 3) = 1
ON DUPLICATE KEY UPDATE parent_id = parent_id;

-- Link second group to Kumar family (Mother + Father)
INSERT INTO parent_children (id, parent_id, child_id, relationship_type, is_primary)
SELECT
    UUID(),
    @test_mother_2,
    child_id,
    'Mother',
    TRUE
FROM temp_orphans
WHERE MOD(rn, 3) = 2
ON DUPLICATE KEY UPDATE parent_id = parent_id;

INSERT INTO parent_children (id, parent_id, child_id, relationship_type, is_primary)
SELECT
    UUID(),
    @test_father_2,
    child_id,
    'Father',
    FALSE
FROM temp_orphans
WHERE MOD(rn, 3) = 2
ON DUPLICATE KEY UPDATE parent_id = parent_id;

-- Link third group to Patel family or single Guardian
INSERT INTO parent_children (id, parent_id, child_id, relationship_type, is_primary)
SELECT
    UUID(),
    @test_guardian,
    child_id,
    'Guardian',
    TRUE
FROM temp_orphans
WHERE MOD(rn, 3) = 0
ON DUPLICATE KEY UPDATE parent_id = parent_id;

-- Cleanup
DROP TEMPORARY TABLE IF EXISTS temp_orphans;

-- Verification query - show children with their parent count
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
LIMIT 20;

-- Show any children still without parents (should be ZERO!)
SELECT
    c.id,
    c.first_name,
    c.last_name,
    c.student_id,
    'NO PARENTS - CRITICAL!' as warning
FROM children c
LEFT JOIN parent_children pc ON c.id = pc.child_id
WHERE pc.id IS NULL;
