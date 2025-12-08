import express from 'express';
import { protect } from './authMiddleware.js';
import pool from './db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get week start and end dates for a given date
 */
const getWeekDates = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(d.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
        weekStart: monday.toISOString().split('T')[0],
        weekEnd: sunday.toISOString().split('T')[0]
    };
};

/**
 * Get week number for a given date
 */
const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

/**
 * Record workflow action
 */
const recordWorkflowAction = async (connection, lessonPlanId, action, performedBy, role, forwardedTo = null, notes = null) => {
    const workflowId = uuidv4();
    await connection.query(
        `INSERT INTO lesson_plan_workflow
         (id, lesson_plan_id, action, performed_by, performed_by_role, forwarded_to, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [workflowId, lessonPlanId, action, performedBy, role, forwardedTo, notes]
    );
};

// ============================================================================
// ACADEMIC COORDINATOR ROUTES
// ============================================================================

/**
 * GET /api/lesson-plans/coordinator/children
 * Get all active children for creating lesson plans
 */
router.get('/coordinator/children', protect, async (req, res) => {
    try {
        if (req.user.role !== 'academic_coordinator') {
            return res.status(403).json({ message: 'Access denied. Academic coordinator only.' });
        }

        const { centerId } = req.query;

        let query = `
            SELECT
                c.id,
                c.first_name,
                c.last_name,
                c.date_of_birth,
                c.admission_date,
                cl.id as classroom_id,
                cl.name as classroom_name,
                ct.name as center_name,
                ct.id as center_id,
                TIMESTAMPDIFF(YEAR, c.date_of_birth, CURDATE()) as age_years,
                TIMESTAMPDIFF(MONTH, c.date_of_birth, CURDATE()) % 12 as age_months
            FROM children c
            LEFT JOIN classrooms cl ON c.classroom_id = cl.id
            LEFT JOIN centers ct ON cl.center_id = ct.id
            WHERE c.is_active = true
        `;

        const params = [];
        if (centerId) {
            query += ' AND ct.id = ?';
            params.push(centerId);
        }

        query += ' ORDER BY c.first_name, c.last_name';

        const [children] = await pool.query(query, params);

        res.json({ children });
    } catch (error) {
        console.error('Get children error:', error);
        res.status(500).json({ message: 'Server error fetching children' });
    }
});

/**
 * POST /api/lesson-plans/coordinator/create
 * Create a new lesson plan for a child
 */
router.post('/coordinator/create', protect, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        if (req.user.role !== 'academic_coordinator') {
            return res.status(403).json({ message: 'Access denied. Academic coordinator only.' });
        }

        const {
            childId,
            centerId,
            classroomId,
            weekStartDate,
            overallObjectives,
            specialNotes,
            activities // Array of activity objects
        } = req.body;

        // Validation
        if (!childId || !centerId || !weekStartDate) {
            return res.status(400).json({ message: 'Child ID, Center ID, and week start date are required' });
        }

        await connection.beginTransaction();

        // Calculate week details
        const { weekStart, weekEnd } = getWeekDates(weekStartDate);
        const weekNumber = getWeekNumber(weekStartDate);
        const academicYear = new Date(weekStartDate).getFullYear().toString();

        // Check if lesson plan already exists for this child and week
        const [existing] = await connection.query(
            'SELECT id FROM lesson_plans WHERE child_id = ? AND week_start_date = ?',
            [childId, weekStart]
        );

        if (existing.length > 0) {
            await connection.rollback();
            return res.status(409).json({
                message: 'Lesson plan already exists for this child and week',
                existingPlanId: existing[0].id
            });
        }

        // Create lesson plan
        const lessonPlanId = uuidv4();
        await connection.query(
            `INSERT INTO lesson_plans
             (id, child_id, center_id, classroom_id, week_number, week_start_date, week_end_date,
              academic_year, created_by, overall_objectives, special_notes, status, version)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', 1)`,
            [lessonPlanId, childId, centerId, classroomId, weekNumber, weekStart, weekEnd,
             academicYear, req.user.userId, overallObjectives, specialNotes]
        );

        // Insert activities if provided
        if (activities && activities.length > 0) {
            for (const activity of activities) {
                const activityId = uuidv4();
                await connection.query(
                    `INSERT INTO lesson_plan_activities
                     (id, lesson_plan_id, category, day_of_week, activity_title, activity_description,
                      learning_outcomes, materials_needed, duration_minutes, instructions, adaptations)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [activityId, lessonPlanId, activity.category, activity.dayOfWeek, activity.title,
                     activity.description, activity.learningOutcomes, activity.materialsNeeded,
                     activity.durationMinutes, activity.instructions, activity.adaptations]
                );
            }
        }

        // Record workflow action
        await recordWorkflowAction(connection, lessonPlanId, 'created', req.user.userId, 'academic_coordinator');

        await connection.commit();

        res.status(201).json({
            message: 'Lesson plan created successfully',
            lessonPlanId,
            weekStart,
            weekEnd
        });
    } catch (error) {
        await connection.rollback();
        console.error('Create lesson plan error:', error);
        res.status(500).json({ message: 'Server error creating lesson plan' });
    } finally {
        connection.release();
    }
});

/**
 * GET /api/lesson-plans/coordinator/plans
 * Get all lesson plans created by academic coordinator
 */
router.get('/coordinator/plans', protect, async (req, res) => {
    try {
        if (req.user.role !== 'academic_coordinator') {
            return res.status(403).json({ message: 'Access denied. Academic coordinator only.' });
        }

        const { status, centerId, weekStart, childId } = req.query;

        let query = `
            SELECT
                lp.*,
                c.first_name,
                c.last_name,
                c.date_of_birth,
                cl.name as classroom_name,
                ct.name as center_name,
                u.full_name as created_by_name,
                (SELECT COUNT(*) FROM lesson_plan_activities WHERE lesson_plan_id = lp.id) as activity_count,
                (SELECT COUNT(*) FROM lesson_plan_feedback WHERE lesson_plan_id = lp.id) as feedback_count
            FROM lesson_plans lp
            JOIN children c ON lp.child_id = c.id
            LEFT JOIN classrooms cl ON lp.classroom_id = cl.id
            LEFT JOIN centers ct ON lp.center_id = ct.id
            LEFT JOIN users u ON lp.created_by = u.id
            WHERE lp.created_by = ?
        `;

        const params = [req.user.userId];

        if (status) {
            query += ' AND lp.status = ?';
            params.push(status);
        }

        if (centerId) {
            query += ' AND lp.center_id = ?';
            params.push(centerId);
        }

        if (weekStart) {
            query += ' AND lp.week_start_date = ?';
            params.push(weekStart);
        }

        if (childId) {
            query += ' AND lp.child_id = ?';
            params.push(childId);
        }

        query += ' ORDER BY lp.week_start_date DESC, c.first_name, c.last_name';

        const [plans] = await pool.query(query, params);

        res.json({ plans });
    } catch (error) {
        console.error('Get coordinator plans error:', error);
        res.status(500).json({ message: 'Server error fetching lesson plans' });
    }
});

/**
 * PUT /api/lesson-plans/coordinator/:id/submit
 * Submit lesson plan (changes status from draft to submitted)
 */
router.put('/coordinator/:id/submit', protect, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        if (req.user.role !== 'academic_coordinator') {
            return res.status(403).json({ message: 'Access denied. Academic coordinator only.' });
        }

        const { id } = req.params;

        await connection.beginTransaction();

        // Verify ownership
        const [plans] = await connection.query(
            'SELECT * FROM lesson_plans WHERE id = ? AND created_by = ?',
            [id, req.user.userId]
        );

        if (plans.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Lesson plan not found or access denied' });
        }

        // Check if plan has activities
        const [activities] = await connection.query(
            'SELECT COUNT(*) as count FROM lesson_plan_activities WHERE lesson_plan_id = ?',
            [id]
        );

        if (activities[0].count === 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Cannot submit lesson plan without activities' });
        }

        // Update status
        await connection.query(
            'UPDATE lesson_plans SET status = ?, updated_at = NOW() WHERE id = ?',
            ['submitted', id]
        );

        // Record workflow action
        await recordWorkflowAction(connection, id, 'submitted_by_coordinator', req.user.userId, 'academic_coordinator');

        await connection.commit();

        res.json({ message: 'Lesson plan submitted successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Submit lesson plan error:', error);
        res.status(500).json({ message: 'Server error submitting lesson plan' });
    } finally {
        connection.release();
    }
});

/**
 * GET /api/lesson-plans/coordinator/:id/feedback
 * Get all feedback for a specific lesson plan
 */
router.get('/coordinator/:id/feedback', protect, async (req, res) => {
    try {
        if (req.user.role !== 'academic_coordinator') {
            return res.status(403).json({ message: 'Access denied. Academic coordinator only.' });
        }

        const { id } = req.params;

        // Verify ownership
        const [plans] = await pool.query(
            'SELECT * FROM lesson_plans WHERE id = ? AND created_by = ?',
            [id, req.user.userId]
        );

        if (plans.length === 0) {
            return res.status(404).json({ message: 'Lesson plan not found or access denied' });
        }

        const [feedback] = await pool.query(
            `SELECT
                f.*,
                t.full_name as teacher_name,
                t.email as teacher_email,
                a.activity_title,
                a.category,
                a.day_of_week
            FROM lesson_plan_feedback f
            JOIN users t ON f.teacher_id = t.id
            LEFT JOIN lesson_plan_activities a ON f.activity_id = a.id
            WHERE f.lesson_plan_id = ?
            ORDER BY f.created_at DESC`,
            [id]
        );

        res.json({ feedback });
    } catch (error) {
        console.error('Get feedback error:', error);
        res.status(500).json({ message: 'Server error fetching feedback' });
    }
});

// ============================================================================
// ADMIN / CENTER DIRECTOR ROUTES
// ============================================================================

/**
 * GET /api/lesson-plans/admin/pending
 * Get all submitted lesson plans pending forwarding to teachers
 */
router.get('/admin/pending', protect, async (req, res) => {
    try {
        if (!['admin', 'center_director', 'super_admin', 'owner'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied. Admin or Center Director only.' });
        }

        const { centerId } = req.query;

        let query = `
            SELECT
                lp.*,
                c.first_name,
                c.last_name,
                cl.name as classroom_name,
                ct.name as center_name,
                u.full_name as coordinator_name,
                (SELECT COUNT(*) FROM lesson_plan_activities WHERE lesson_plan_id = lp.id) as activity_count
            FROM lesson_plans lp
            JOIN children c ON lp.child_id = c.id
            LEFT JOIN classrooms cl ON lp.classroom_id = cl.id
            LEFT JOIN centers ct ON lp.center_id = ct.id
            LEFT JOIN users u ON lp.created_by = u.id
            WHERE lp.status = 'submitted'
        `;

        const params = [];
        if (centerId) {
            query += ' AND lp.center_id = ?';
            params.push(centerId);
        }

        query += ' ORDER BY lp.week_start_date, c.first_name';

        const [plans] = await pool.query(query, params);

        res.json({ plans });
    } catch (error) {
        console.error('Get pending plans error:', error);
        res.status(500).json({ message: 'Server error fetching pending plans' });
    }
});

/**
 * POST /api/lesson-plans/admin/:id/forward-to-teacher
 * Forward lesson plan to teacher
 */
router.post('/admin/:id/forward-to-teacher', protect, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        if (!['admin', 'center_director', 'super_admin', 'owner'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied. Admin or Center Director only.' });
        }

        const { id } = req.params;
        const { teacherId, notes } = req.body;

        if (!teacherId) {
            return res.status(400).json({ message: 'Teacher ID is required' });
        }

        await connection.beginTransaction();

        // Verify lesson plan exists and is submitted
        const [plans] = await connection.query(
            'SELECT * FROM lesson_plans WHERE id = ? AND status = ?',
            [id, 'submitted']
        );

        if (plans.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Lesson plan not found or not in submitted status' });
        }

        // Update status
        await connection.query(
            'UPDATE lesson_plans SET status = ?, updated_at = NOW() WHERE id = ?',
            ['forwarded_to_teacher', id]
        );

        // Create assignment
        const assignmentId = uuidv4();
        await connection.query(
            `INSERT INTO lesson_plan_assignments
             (id, lesson_plan_id, teacher_id, assigned_by, status)
             VALUES (?, ?, ?, ?, 'pending')`,
            [assignmentId, id, teacherId, req.user.userId]
        );

        // Record workflow actions
        await recordWorkflowAction(connection, id, 'forwarded_to_teacher', req.user.userId, req.user.role, teacherId, notes);
        await recordWorkflowAction(connection, id, 'assigned_to_teacher', req.user.userId, req.user.role, teacherId);

        await connection.commit();

        res.json({
            message: 'Lesson plan forwarded to teacher successfully',
            assignmentId
        });
    } catch (error) {
        await connection.rollback();
        console.error('Forward to teacher error:', error);
        res.status(500).json({ message: 'Server error forwarding lesson plan' });
    } finally {
        connection.release();
    }
});

/**
 * GET /api/lesson-plans/admin/feedback-received
 * Get all lesson plans with feedback pending forwarding to coordinator
 */
router.get('/admin/feedback-received', protect, async (req, res) => {
    try {
        if (!['admin', 'center_director', 'super_admin', 'owner'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied. Admin or Center Director only.' });
        }

        const { centerId } = req.query;

        let query = `
            SELECT
                lp.*,
                c.first_name,
                c.last_name,
                cl.name as classroom_name,
                ct.name as center_name,
                u.full_name as coordinator_name,
                (SELECT COUNT(*) FROM lesson_plan_feedback WHERE lesson_plan_id = lp.id) as feedback_count
            FROM lesson_plans lp
            JOIN children c ON lp.child_id = c.id
            LEFT JOIN classrooms cl ON lp.classroom_id = cl.id
            LEFT JOIN centers ct ON lp.center_id = ct.id
            LEFT JOIN users u ON lp.created_by = u.id
            WHERE lp.status = 'feedback_received'
        `;

        const params = [];
        if (centerId) {
            query += ' AND lp.center_id = ?';
            params.push(centerId);
        }

        query += ' ORDER BY lp.updated_at DESC';

        const [plans] = await pool.query(query, params);

        res.json({ plans });
    } catch (error) {
        console.error('Get feedback received error:', error);
        res.status(500).json({ message: 'Server error fetching plans with feedback' });
    }
});

/**
 * POST /api/lesson-plans/admin/:id/forward-feedback
 * Forward feedback to academic coordinator
 */
router.post('/admin/:id/forward-feedback', protect, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        if (!['admin', 'center_director', 'super_admin', 'owner'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied. Admin or Center Director only.' });
        }

        const { id } = req.params;
        const { notes } = req.body;

        await connection.beginTransaction();

        // Verify lesson plan has feedback
        const [plans] = await connection.query(
            'SELECT created_by FROM lesson_plans WHERE id = ? AND status = ?',
            [id, 'feedback_received']
        );

        if (plans.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Lesson plan not found or no feedback received' });
        }

        const coordinatorId = plans[0].created_by;

        // Update status
        await connection.query(
            'UPDATE lesson_plans SET status = ?, updated_at = NOW() WHERE id = ?',
            ['completed', id]
        );

        // Record workflow action
        await recordWorkflowAction(
            connection,
            id,
            'feedback_forwarded_to_coordinator',
            req.user.userId,
            req.user.role,
            coordinatorId,
            notes
        );

        await connection.commit();

        res.json({ message: 'Feedback forwarded to academic coordinator successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Forward feedback error:', error);
        res.status(500).json({ message: 'Server error forwarding feedback' });
    } finally {
        connection.release();
    }
});

// ============================================================================
// TEACHER ROUTES
// ============================================================================

/**
 * GET /api/lesson-plans/teacher/assigned
 * Get all lesson plans assigned to teacher
 */
router.get('/teacher/assigned', protect, async (req, res) => {
    try {
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ message: 'Access denied. Teacher only.' });
        }

        const { status } = req.query;

        let query = `
            SELECT
                lp.*,
                c.first_name,
                c.last_name,
                c.date_of_birth,
                cl.name as classroom_name,
                ct.name as center_name,
                lpa.status as assignment_status,
                lpa.assigned_at,
                lpa.acknowledged_at,
                u.full_name as assigned_by_name,
                (SELECT COUNT(*) FROM lesson_plan_activities WHERE lesson_plan_id = lp.id) as activity_count,
                (SELECT COUNT(*) FROM lesson_plan_feedback WHERE lesson_plan_id = lp.id AND teacher_id = ?) as my_feedback_count
            FROM lesson_plan_assignments lpa
            JOIN lesson_plans lp ON lpa.lesson_plan_id = lp.id
            JOIN children c ON lp.child_id = c.id
            LEFT JOIN classrooms cl ON lp.classroom_id = cl.id
            LEFT JOIN centers ct ON lp.center_id = ct.id
            LEFT JOIN users u ON lpa.assigned_by = u.id
            WHERE lpa.teacher_id = ?
        `;

        const params = [req.user.userId, req.user.userId];

        if (status) {
            query += ' AND lpa.status = ?';
            params.push(status);
        }

        query += ' ORDER BY lp.week_start_date DESC';

        const [plans] = await pool.query(query, params);

        res.json({ plans });
    } catch (error) {
        console.error('Get teacher assigned plans error:', error);
        res.status(500).json({ message: 'Server error fetching assigned plans' });
    }
});

/**
 * GET /api/lesson-plans/teacher/:id/details
 * Get detailed lesson plan with all activities
 */
router.get('/teacher/:id/details', protect, async (req, res) => {
    try {
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ message: 'Access denied. Teacher only.' });
        }

        const { id } = req.params;

        // Verify assignment
        const [assignments] = await pool.query(
            'SELECT * FROM lesson_plan_assignments WHERE lesson_plan_id = ? AND teacher_id = ?',
            [id, req.user.userId]
        );

        if (assignments.length === 0) {
            return res.status(404).json({ message: 'Lesson plan not found or not assigned to you' });
        }

        // Get lesson plan
        const [plans] = await pool.query(
            `SELECT
                lp.*,
                c.first_name,
                c.last_name,
                c.date_of_birth,
                cl.name as classroom_name,
                ct.name as center_name
            FROM lesson_plans lp
            JOIN children c ON lp.child_id = c.id
            LEFT JOIN classrooms cl ON lp.classroom_id = cl.id
            LEFT JOIN centers ct ON lp.center_id = ct.id
            WHERE lp.id = ?`,
            [id]
        );

        if (plans.length === 0) {
            return res.status(404).json({ message: 'Lesson plan not found' });
        }

        // Get activities
        const [activities] = await pool.query(
            `SELECT * FROM lesson_plan_activities
             WHERE lesson_plan_id = ?
             ORDER BY
                FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'),
                category`,
            [id]
        );

        res.json({
            plan: plans[0],
            activities,
            assignment: assignments[0]
        });
    } catch (error) {
        console.error('Get lesson plan details error:', error);
        res.status(500).json({ message: 'Server error fetching lesson plan details' });
    }
});

/**
 * PUT /api/lesson-plans/teacher/:id/acknowledge
 * Acknowledge receipt of lesson plan
 */
router.put('/teacher/:id/acknowledge', protect, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ message: 'Access denied. Teacher only.' });
        }

        const { id } = req.params;

        await connection.beginTransaction();

        // Update assignment
        const [result] = await connection.query(
            `UPDATE lesson_plan_assignments
             SET status = 'acknowledged', acknowledged_at = NOW()
             WHERE lesson_plan_id = ? AND teacher_id = ?`,
            [id, req.user.userId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Update lesson plan status
        await connection.query(
            `UPDATE lesson_plans SET status = 'in_progress' WHERE id = ?`,
            [id]
        );

        // Record workflow action
        await recordWorkflowAction(connection, id, 'viewed_by_teacher', req.user.userId, 'teacher');

        await connection.commit();

        res.json({ message: 'Lesson plan acknowledged successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Acknowledge lesson plan error:', error);
        res.status(500).json({ message: 'Server error acknowledging lesson plan' });
    } finally {
        connection.release();
    }
});

/**
 * POST /api/lesson-plans/teacher/:id/feedback
 * Submit feedback for lesson plan or specific activity
 */
router.post('/teacher/:id/feedback', protect, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ message: 'Access denied. Teacher only.' });
        }

        const { id } = req.params;
        const {
            activityId,
            feedbackType,
            rating,
            childEngagement,
            completionStatus,
            observations,
            challengesFaced,
            childResponse,
            suggestedModifications,
            achievements,
            attachments
        } = req.body;

        // Validation
        if (!observations) {
            return res.status(400).json({ message: 'Observations are required' });
        }

        await connection.beginTransaction();

        // Verify assignment
        const [assignments] = await connection.query(
            'SELECT * FROM lesson_plan_assignments WHERE lesson_plan_id = ? AND teacher_id = ?',
            [id, req.user.userId]
        );

        if (assignments.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Lesson plan not assigned to you' });
        }

        // Create feedback
        const feedbackId = uuidv4();
        await connection.query(
            `INSERT INTO lesson_plan_feedback
             (id, lesson_plan_id, activity_id, teacher_id, feedback_type, rating, child_engagement,
              completion_status, observations, challenges_faced, child_response, suggested_modifications,
              achievements, attachments, submitted_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [feedbackId, id, activityId || null, req.user.userId, feedbackType || 'activity',
             rating, childEngagement, completionStatus, observations, challengesFaced,
             childResponse, suggestedModifications, achievements,
             attachments ? JSON.stringify(attachments) : null]
        );

        // Check if this is the final feedback (all activities have feedback)
        const [activityCount] = await connection.query(
            'SELECT COUNT(*) as total FROM lesson_plan_activities WHERE lesson_plan_id = ?',
            [id]
        );

        const [feedbackCount] = await connection.query(
            'SELECT COUNT(DISTINCT activity_id) as total FROM lesson_plan_feedback WHERE lesson_plan_id = ? AND teacher_id = ?',
            [id, req.user.userId]
        );

        // If all activities have feedback, mark assignment as completed
        if (feedbackCount[0].total >= activityCount[0].total) {
            await connection.query(
                `UPDATE lesson_plan_assignments
                 SET status = 'completed', completed_at = NOW()
                 WHERE lesson_plan_id = ? AND teacher_id = ?`,
                [id, req.user.userId]
            );

            // Update lesson plan status
            await connection.query(
                `UPDATE lesson_plans SET status = 'feedback_received' WHERE id = ?`,
                [id]
            );

            // Record workflow action
            await recordWorkflowAction(connection, id, 'feedback_submitted', req.user.userId, 'teacher');
        }

        await connection.commit();

        res.status(201).json({
            message: 'Feedback submitted successfully',
            feedbackId,
            allActivitiesComplete: feedbackCount[0].total >= activityCount[0].total
        });
    } catch (error) {
        await connection.rollback();
        console.error('Submit feedback error:', error);
        res.status(500).json({ message: 'Server error submitting feedback' });
    } finally {
        connection.release();
    }
});

// ============================================================================
// SHARED ROUTES (Multiple Roles)
// ============================================================================

/**
 * GET /api/lesson-plans/:id
 * Get lesson plan by ID (accessible by multiple roles)
 */
router.get('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;

        // Get lesson plan with full details
        const [plans] = await pool.query(
            `SELECT
                lp.*,
                c.first_name,
                c.last_name,
                c.date_of_birth,
                cl.name as classroom_name,
                ct.name as center_name,
                u.full_name as created_by_name
            FROM lesson_plans lp
            JOIN children c ON lp.child_id = c.id
            LEFT JOIN classrooms cl ON lp.classroom_id = cl.id
            LEFT JOIN centers ct ON lp.center_id = ct.id
            LEFT JOIN users u ON lp.created_by = u.id
            WHERE lp.id = ?`,
            [id]
        );

        if (plans.length === 0) {
            return res.status(404).json({ message: 'Lesson plan not found' });
        }

        const plan = plans[0];

        // Authorization check
        const isAuthorized =
            req.user.role === 'academic_coordinator' && plan.created_by === req.user.userId ||
            ['admin', 'center_director', 'super_admin', 'owner'].includes(req.user.role) ||
            req.user.role === 'teacher'; // Teachers need separate assignment check

        if (req.user.role === 'teacher') {
            const [assignments] = await pool.query(
                'SELECT * FROM lesson_plan_assignments WHERE lesson_plan_id = ? AND teacher_id = ?',
                [id, req.user.userId]
            );
            if (assignments.length === 0) {
                return res.status(403).json({ message: 'Access denied' });
            }
        } else if (!isAuthorized) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Get activities
        const [activities] = await pool.query(
            `SELECT * FROM lesson_plan_activities
             WHERE lesson_plan_id = ?
             ORDER BY
                FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'),
                category`,
            [id]
        );

        // Get feedback
        const [feedback] = await pool.query(
            `SELECT
                f.*,
                u.full_name as teacher_name
            FROM lesson_plan_feedback f
            JOIN users u ON f.teacher_id = u.id
            WHERE f.lesson_plan_id = ?
            ORDER BY f.created_at DESC`,
            [id]
        );

        // Get workflow history
        const [workflow] = await pool.query(
            `SELECT
                w.*,
                u.full_name as performed_by_name,
                u2.full_name as forwarded_to_name
            FROM lesson_plan_workflow w
            JOIN users u ON w.performed_by = u.id
            LEFT JOIN users u2 ON w.forwarded_to = u2.id
            WHERE w.lesson_plan_id = ?
            ORDER BY w.created_at DESC`,
            [id]
        );

        res.json({
            plan,
            activities,
            feedback,
            workflow
        });
    } catch (error) {
        console.error('Get lesson plan error:', error);
        res.status(500).json({ message: 'Server error fetching lesson plan' });
    }
});

/**
 * GET /api/lesson-plans/child/:childId
 * Get all lesson plans for a specific child
 */
router.get('/child/:childId', protect, async (req, res) => {
    try {
        const { childId } = req.params;

        const [plans] = await pool.query(
            `SELECT
                lp.*,
                c.first_name,
                c.last_name,
                u.full_name as created_by_name,
                (SELECT COUNT(*) FROM lesson_plan_activities WHERE lesson_plan_id = lp.id) as activity_count,
                (SELECT COUNT(*) FROM lesson_plan_feedback WHERE lesson_plan_id = lp.id) as feedback_count
            FROM lesson_plans lp
            JOIN children c ON lp.child_id = c.id
            LEFT JOIN users u ON lp.created_by = u.id
            WHERE lp.child_id = ?
            ORDER BY lp.week_start_date DESC`,
            [childId]
        );

        res.json({ plans });
    } catch (error) {
        console.error('Get child lesson plans error:', error);
        res.status(500).json({ message: 'Server error fetching child lesson plans' });
    }
});

export default router;
