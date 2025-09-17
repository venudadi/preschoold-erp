import express from 'express';
import pool from './db.js';
import { protect } from './authMiddleware.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// --- CONVERT ENQUIRY TO STUDENT (FINAL VERSION) ---
// This version uses the robust three-table model (parents, children, parent_child_links)
router.post('/convert/:enquiryId', protect, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
        return res.status(403).json({ message: 'Forbidden: Access restricted to administrators.' });
    }

    const { enquiryId } = req.params;
    const { child, parents, classroomId, probableJoiningDate } = req.body;
    const { centerId } = req.user;

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Get original enquiry data for audit trail (No change)
        const [enquiries] = await connection.query('SELECT * FROM enquiries WHERE id = ?', [enquiryId]);
        if (enquiries.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Enquiry not found.' });
        }
        const enquiry = enquiries[0];

        // 2. Generate unique Student ID (No change)
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const idPrefix = `NKD${year}${month}`;
        const lastIdSql = `SELECT student_id FROM children WHERE student_id LIKE ? ORDER BY student_id DESC LIMIT 1`;
        const [lastChildren] = await connection.query(lastIdSql, [`${idPrefix}%`]);
        let newSerial = 1;
        if (lastChildren.length > 0 && lastChildren[0].student_id) {
            const lastSerial = parseInt(lastChildren[0].student_id.slice(-3));
            newSerial = lastSerial + 1;
        }
        const studentId = `${idPrefix}${newSerial.toString().padStart(3, '0')}`;

        // 3. Create the new child record (No change)
        const childId = uuidv4();
        const insertChildSql = `
            INSERT INTO children (id, first_name, last_name, date_of_birth, gender, student_id, classroom_id, center_id, enrollment_date, probable_joining_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.query(insertChildSql, [
            childId, child.firstName, child.lastName, child.dateOfBirth, child.gender,
            studentId, classroomId, centerId, new Date(), probableJoiningDate
        ]);

        // 4. --- NEW, ADVANCED LOGIC: Process each parent ---
        for (const parent of parents) {
            if (parent.firstName && parent.phone) { // A first name and phone are required
                let parentId;

                // Step 4a: Check if a parent with this phone number already exists
                const [existingParents] = await connection.query('SELECT id FROM parents WHERE phone_number = ?', [parent.phone]);
                
                if (existingParents.length > 0) {
                    // If the parent exists, use their existing ID
                    parentId = existingParents[0].id;
                } else {
                    // If the parent does not exist, create a new record for them
                    parentId = uuidv4();
                    const insertParentSql = `
                        INSERT INTO parents (id, first_name, last_name, phone_number, email)
                        VALUES (?, ?, ?, ?, ?)
                    `;
                    await connection.query(insertParentSql, [
                        parentId, parent.firstName, parent.lastName, parent.phone, parent.email
                    ]);
                }

                // Step 4b: Create the link in the junction table
                const insertLinkSql = `
                    INSERT INTO parent_child_links (parent_id, child_id, relation_to_child)
                    VALUES (?, ?, ?)
                `;
                await connection.query(insertLinkSql, [parentId, childId, parent.relation]);
            }
        }

        // 5. Update original enquiry to 'Closed' for a clear audit trail (No change)
        const updatedRemarks = `${enquiry.remarks || ''}\nConverted to Student ID: ${studentId}`.trim();
        await connection.query(
            "UPDATE enquiries SET status = 'Closed', remarks = ? WHERE id = ?",
            [updatedRemarks, enquiryId]
        );
        
        await connection.commit();
        res.status(201).json({ message: 'Student admitted successfully!', studentId: studentId, childId: childId });

    } catch (error) {
        await connection.rollback();
        console.error('Conversion Error:', error);
        res.status(500).json({ message: 'Server error during admission process.' });
    } finally {
        connection.release();
    }
});

export default router;

