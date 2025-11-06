import express from 'express';
import pool from './db.js';
import { protect } from './authMiddleware.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// --- CALCULATE ADMISSION PREVIEW (NEW) ---
// Real-time fee calculation for admission modal
router.post('/calculate-preview', protect, async (req, res) => {
    const {
        originalFeePerMonth,
        studentKitAmount,
        annualFeeWaiveOff,
        paymentMode,
        billingFrequency,
        hasTieUp,
        companyId,
        discountPercentage
    } = req.body;

    if (!originalFeePerMonth) {
        return res.status(400).json({ message: 'Original fee per month is required.' });
    }

    try {
        const GST_RATE = 18.0;
        let calculationResult = {
            originalFeePerMonth: parseFloat(originalFeePerMonth),
            studentKitAmount: parseFloat(studentKitAmount) || 0,
            annualFeeWaiveOff: annualFeeWaiveOff || false,
            paymentMode: paymentMode || 'Online',
            billingFrequency: billingFrequency || 'Monthly',
            hasTieUp: hasTieUp || false,
            gstRate: GST_RATE
        };

        // Get company contribution if tie-up
        if (hasTieUp && companyId) {
            const [companies] = await pool.query(
                'SELECT parent_contribution_percent, company_contribution_percent, company_name FROM companies WHERE id = ?',
                [companyId]
            );

            if (companies.length > 0) {
                calculationResult.companyName = companies[0].company_name;
                calculationResult.parentContributionPercent = parseFloat(companies[0].parent_contribution_percent);
                calculationResult.companyContributionPercent = parseFloat(companies[0].company_contribution_percent);

                // Calculate split amounts
                const monthlyFee = parseFloat(originalFeePerMonth);
                calculationResult.parentAmountBeforeGst = (monthlyFee * calculationResult.parentContributionPercent) / 100;
                calculationResult.companyAmountBeforeGst = (monthlyFee * calculationResult.companyContributionPercent) / 100;

                // Add student kit to parent portion
                calculationResult.parentSubtotal = calculationResult.parentAmountBeforeGst + calculationResult.studentKitAmount;

                // Calculate GST only if payment mode is Online
                if (paymentMode === 'Online') {
                    calculationResult.parentGstAmount = (calculationResult.parentSubtotal * GST_RATE) / 100;
                    calculationResult.companyGstAmount = (calculationResult.companyAmountBeforeGst * GST_RATE) / 100;
                } else {
                    calculationResult.parentGstAmount = 0;
                    calculationResult.companyGstAmount = 0;
                }

                calculationResult.parentTotalWithGst = calculationResult.parentSubtotal + calculationResult.parentGstAmount;
                calculationResult.companyTotalWithGst = calculationResult.companyAmountBeforeGst + calculationResult.companyGstAmount;
                calculationResult.finalFeePerMonth = calculationResult.parentAmountBeforeGst; // Final fee for parent

            } else {
                return res.status(404).json({ message: 'Company not found.' });
            }
        } else {
            // Non-tie-up: Apply discount
            const discount = parseFloat(discountPercentage) || 0;
            const discountAmount = (parseFloat(originalFeePerMonth) * discount) / 100;
            calculationResult.discountPercentage = discount;
            calculationResult.discountAmount = discountAmount;
            calculationResult.finalFeePerMonth = parseFloat(originalFeePerMonth) - discountAmount;

            // Parent pays 100%
            calculationResult.parentContributionPercent = 100;
            calculationResult.companyContributionPercent = 0;
            calculationResult.parentAmountBeforeGst = calculationResult.finalFeePerMonth;
            calculationResult.parentSubtotal = calculationResult.parentAmountBeforeGst + calculationResult.studentKitAmount;

            // Calculate GST only if payment mode is Online
            if (paymentMode === 'Online') {
                calculationResult.parentGstAmount = (calculationResult.parentSubtotal * GST_RATE) / 100;
            } else {
                calculationResult.parentGstAmount = 0;
            }

            calculationResult.parentTotalWithGst = calculationResult.parentSubtotal + calculationResult.parentGstAmount;
        }

        // Calculate total based on billing frequency
        const monthlyDue = calculationResult.parentTotalWithGst;

        if (billingFrequency === 'Term') {
            // Term: 4 months + 3 months + 3 months
            calculationResult.term1Total = monthlyDue * 4;
            calculationResult.term2Total = monthlyDue * 3;
            calculationResult.term3Total = monthlyDue * 3;
            calculationResult.annualTotal = calculationResult.term1Total + calculationResult.term2Total + calculationResult.term3Total;
        } else if (billingFrequency === 'Annual') {
            // Annual: 10 months upfront
            calculationResult.annualTotal = monthlyDue * 10;
        } else {
            // Monthly
            calculationResult.monthlyTotal = monthlyDue;
        }

        res.status(200).json({ calculation: calculationResult });

    } catch (error) {
        console.error('Error calculating preview:', error);
        res.status(500).json({ message: 'Server error calculating preview.' });
    }
});

// --- SUBMIT ADMISSION FOR APPROVAL (NEW) ---
// Submits admission with fee details for center director approval
router.post('/submit-for-approval/:enquiryId', protect, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
        return res.status(403).json({ message: 'Forbidden: Access restricted to administrators.' });
    }

    const { enquiryId } = req.params;
    const { child, parents, classroomId, probableJoiningDate, feeDetails, companyId } = req.body;
    const { centerId, userId } = req.user;

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Validate enquiry exists
        const [enquiries] = await connection.query('SELECT * FROM enquiries WHERE id = ?', [enquiryId]);
        if (enquiries.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Enquiry not found.' });
        }
        const enquiry = enquiries[0];

        // 2. Validate fee details
        if (!feeDetails || !feeDetails.originalFeePerMonth || !feeDetails.finalFeePerMonth) {
            await connection.rollback();
            return res.status(400).json({ message: 'Fee details are required.' });
        }

        // 3. Validate tie-up billing restrictions
        if (enquiry.has_tie_up && feeDetails.billingFrequency !== 'Monthly') {
            await connection.rollback();
            return res.status(400).json({
                message: 'Tie-up students must use Monthly billing frequency only.'
            });
        }

        // 3. Create admission_fee_details record with enhanced fields
        const feeDetailsId = uuidv4();
        const insertFeeDetailsSql = `
            INSERT INTO admission_fee_details (
                id, enquiry_id, original_fee_per_month, final_fee_per_month,
                annual_fee_waive_off, student_kit_amount, discount_percentage,
                payment_mode, billing_frequency,
                parent_contribution_percent, company_contribution_percent,
                parent_amount_before_gst, company_amount_before_gst,
                parent_gst_amount, company_gst_amount,
                parent_total_with_gst, company_total_with_gst
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.query(insertFeeDetailsSql, [
            feeDetailsId,
            enquiryId,
            feeDetails.originalFeePerMonth,
            feeDetails.finalFeePerMonth,
            feeDetails.annualFeeWaiveOff || false,
            feeDetails.studentKitAmount || 0,
            feeDetails.discountPercentage || 0,
            feeDetails.paymentMode || 'Online',
            feeDetails.billingFrequency || 'Monthly',
            feeDetails.parentContributionPercent || 100,
            feeDetails.companyContributionPercent || 0,
            feeDetails.parentAmountBeforeGst || feeDetails.finalFeePerMonth,
            feeDetails.companyAmountBeforeGst || 0,
            feeDetails.parentGstAmount || 0,
            feeDetails.companyGstAmount || 0,
            feeDetails.parentTotalWithGst || feeDetails.finalFeePerMonth,
            feeDetails.companyTotalWithGst || 0
        ]);

        // 4. Create admission_approvals record
        const approvalId = uuidv4();
        const insertApprovalSql = `
            INSERT INTO admission_approvals (
                id, enquiry_id, fee_details_id, approval_status, submitted_by
            ) VALUES (?, ?, ?, 'pending', ?)
        `;
        await connection.query(insertApprovalSql, [approvalId, enquiryId, feeDetailsId, userId]);

        // 5. Store admission data as JSON in approval notes for later processing
        const admissionData = JSON.stringify({
            child,
            parents,
            classroomId,
            probableJoiningDate,
            companyId: companyId || null,
            paymentMode: feeDetails.paymentMode || 'Online',
            billingFrequency: feeDetails.billingFrequency || 'Monthly',
            lockedMonthlyFee: feeDetails.finalFeePerMonth
        });
        await connection.query(
            'UPDATE admission_approvals SET approval_notes = ? WHERE id = ?',
            [admissionData, approvalId]
        );

        // 6. Update enquiry status to show it's pending approval
        await connection.query(
            `UPDATE enquiries SET approval_required = TRUE, approval_status = 'pending' WHERE id = ?`,
            [enquiryId]
        );

        await connection.commit();
        res.status(201).json({
            message: 'Admission submitted for approval successfully!',
            approvalId,
            feeDetailsId
        });

    } catch (error) {
        await connection.rollback();
        console.error('Submission Error:', error);
        res.status(500).json({ message: 'Server error during submission.' });
    } finally {
        connection.release();
    }
});

// --- GET PENDING APPROVALS (NEW) ---
// Lists all pending admission approvals for center directors
router.get('/approvals/pending', protect, async (req, res) => {
    if (req.user.role !== 'center_director' && req.user.role !== 'owner') {
        return res.status(403).json({ message: 'Forbidden: Access restricted to center directors.' });
    }

    const { centerId } = req.user;

    try {
        const query = `
            SELECT
                aa.id as approval_id,
                aa.enquiry_id,
                aa.fee_details_id,
                aa.approval_status,
                aa.submitted_by,
                aa.submitted_at,
                e.child_name,
                e.parent_name,
                e.mobile_number,
                afd.original_fee_per_month,
                afd.final_fee_per_month,
                afd.annual_fee_waive_off,
                afd.student_kit_amount,
                afd.discount_percentage,
                u.username as submitted_by_name
            FROM admission_approvals aa
            INNER JOIN enquiries e ON aa.enquiry_id = e.id
            INNER JOIN admission_fee_details afd ON aa.fee_details_id = afd.id
            LEFT JOIN users u ON aa.submitted_by = u.id
            WHERE aa.approval_status = 'pending'
            AND e.center_id = ?
            ORDER BY aa.submitted_at DESC
        `;

        const [approvals] = await pool.query(query, [centerId]);
        res.status(200).json({ approvals });

    } catch (error) {
        console.error('Error fetching approvals:', error);
        res.status(500).json({ message: 'Server error fetching approvals.' });
    }
});

// --- APPROVE ADMISSION (NEW) ---
// Center director approves admission and completes the conversion
router.post('/approvals/:approvalId/approve', protect, async (req, res) => {
    if (req.user.role !== 'center_director' && req.user.role !== 'owner') {
        return res.status(403).json({ message: 'Forbidden: Access restricted to center directors.' });
    }

    const { approvalId } = req.params;
    const { notes } = req.body;
    const { centerId, userId } = req.user;

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Get approval record
        const [approvals] = await connection.query(
            'SELECT * FROM admission_approvals WHERE id = ?',
            [approvalId]
        );
        if (approvals.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Approval not found.' });
        }
        const approval = approvals[0];

        if (approval.approval_status !== 'pending') {
            await connection.rollback();
            return res.status(400).json({ message: 'Approval already processed.' });
        }

        // 2. Get enquiry and validate center
        const [enquiries] = await connection.query('SELECT * FROM enquiries WHERE id = ?', [approval.enquiry_id]);
        if (enquiries.length === 0 || enquiries[0].center_id !== centerId) {
            await connection.rollback();
            return res.status(403).json({ message: 'Access denied to this enquiry.' });
        }
        const enquiry = enquiries[0];

        // 3. Parse admission data from approval notes
        let admissionData;
        try {
            admissionData = JSON.parse(approval.approval_notes);
        } catch (e) {
            await connection.rollback();
            return res.status(400).json({ message: 'Invalid admission data.' });
        }

        const {
            child,
            parents,
            classroomId,
            companyId = null,
            paymentMode = 'Online',
            billingFrequency = 'Monthly',
            lockedMonthlyFee = null
        } = admissionData;

        // 4. Generate unique Student ID
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

        // 5. Create the new child record
        const childId = uuidv4();
        const insertChildSql = `
            INSERT INTO children (
                id, first_name, last_name, date_of_birth, gender, student_id, classroom_id, center_id,
                payment_mode, billing_frequency, locked_monthly_fee, company_id, has_tie_up
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.query(insertChildSql, [
            childId,
            child.firstName,
            child.lastName,
            child.dateOfBirth,
            child.gender,
            studentId,
            classroomId,
            centerId,
            paymentMode,
            billingFrequency,
            lockedMonthlyFee,
            companyId,
            companyId ? true : false  // has_tie_up is true if companyId exists
        ]);

        // 6. Update fee_details with child_id
        await connection.query(
            'UPDATE admission_fee_details SET child_id = ? WHERE id = ?',
            [childId, approval.fee_details_id]
        );

        // 7. Process each parent
        for (const parent of parents) {
            if (parent.firstName && parent.phone) {
                let parentId;

                const [existingParents] = await connection.query(
                    'SELECT id FROM parents WHERE phone_number = ?',
                    [parent.phone]
                );

                if (existingParents.length > 0) {
                    parentId = existingParents[0].id;
                } else {
                    parentId = uuidv4();
                    const insertParentSql = `
                        INSERT INTO parents (id, first_name, last_name, phone_number, email)
                        VALUES (?, ?, ?, ?, ?)
                    `;
                    await connection.query(insertParentSql, [
                        parentId, parent.firstName, parent.lastName, parent.phone, parent.email
                    ]);
                }

                const linkId = uuidv4();
                const insertLinkSql = `
                    INSERT INTO parent_children (id, parent_id, child_id, relationship_type, is_primary)
                    VALUES (?, ?, ?, ?, ?)
                `;
                await connection.query(insertLinkSql, [
                    linkId, parentId, childId, parent.relation || 'Guardian', parent.isPrimary || false
                ]);
            }
        }

        // 8. Update approval record
        await connection.query(
            `UPDATE admission_approvals
             SET approval_status = 'approved', approved_by = ?, reviewed_at = NOW()
             WHERE id = ?`,
            [userId, approvalId]
        );

        // 9. Update enquiry status
        const updatedRemarks = `${enquiry.remarks || ''}\nApproved and converted to Student ID: ${studentId}`.trim();
        await connection.query(
            `UPDATE enquiries SET status = 'Closed', approval_status = 'approved', remarks = ? WHERE id = ?`,
            [updatedRemarks, approval.enquiry_id]
        );

        await connection.commit();
        res.status(200).json({
            message: 'Admission approved and student created successfully!',
            studentId,
            childId
        });

    } catch (error) {
        await connection.rollback();
        console.error('Approval Error:', error);
        res.status(500).json({ message: 'Server error during approval process.' });
    } finally {
        connection.release();
    }
});

// --- REJECT ADMISSION (NEW) ---
// Center director rejects admission
router.post('/approvals/:approvalId/reject', protect, async (req, res) => {
    if (req.user.role !== 'center_director' && req.user.role !== 'owner') {
        return res.status(403).json({ message: 'Forbidden: Access restricted to center directors.' });
    }

    const { approvalId } = req.params;
    const { notes } = req.body;
    const { userId } = req.user;

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Get approval record
        const [approvals] = await connection.query(
            'SELECT * FROM admission_approvals WHERE id = ?',
            [approvalId]
        );
        if (approvals.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Approval not found.' });
        }
        const approval = approvals[0];

        if (approval.approval_status !== 'pending') {
            await connection.rollback();
            return res.status(400).json({ message: 'Approval already processed.' });
        }

        // 2. Update approval record
        await connection.query(
            `UPDATE admission_approvals
             SET approval_status = 'rejected', approved_by = ?, reviewed_at = NOW()
             WHERE id = ?`,
            [userId, approvalId]
        );

        // 3. Update enquiry status
        await connection.query(
            `UPDATE enquiries SET approval_status = 'rejected' WHERE id = ?`,
            [approval.enquiry_id]
        );

        await connection.commit();
        res.status(200).json({ message: 'Admission rejected successfully.' });

    } catch (error) {
        await connection.rollback();
        console.error('Rejection Error:', error);
        res.status(500).json({ message: 'Server error during rejection process.' });
    } finally {
        connection.release();
    }
});

// --- CONVERT ENQUIRY TO STUDENT (ORIGINAL - KEPT FOR BACKWARD COMPATIBILITY) ---
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

        // 3. Create the new child record
        const childId = uuidv4();
        const insertChildSql = `
            INSERT INTO children (id, first_name, last_name, date_of_birth, gender, student_id, classroom_id, center_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.query(insertChildSql, [
            childId, child.firstName, child.lastName, child.dateOfBirth, child.gender,
            studentId, classroomId, centerId
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

                // Step 4b: Create the link in the parent_children table
                const linkId = uuidv4();
                const insertLinkSql = `
                    INSERT INTO parent_children (id, parent_id, child_id, relationship_type, is_primary)
                    VALUES (?, ?, ?, ?, ?)
                `;
                await connection.query(insertLinkSql, [linkId, parentId, childId, parent.relation || 'Guardian', parent.isPrimary || false]);
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

