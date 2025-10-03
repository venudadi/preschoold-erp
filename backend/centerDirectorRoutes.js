// centerDirectorRoutes.js
// API routes for Center Director operations and management

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from './db.js';
import { protect, checkRole, centerDirectorOrAbove } from './authMiddleware.js';

const router = express.Router();

// GET /dashboard - Get center director dashboard data
router.get('/dashboard', protect, checkRole(['center_director', 'owner', 'super_admin']), async (req, res) => {
    try {
        const centerId = req.user.center_id;

        // Get center basic info
        const [centerInfo] = await db.query(`
            SELECT id, name, director_budget_limit, monthly_budget, emergency_fund
            FROM centers WHERE id = ?
        `, [centerId]);

        // Get enrollment stats
        const [enrollmentStats] = await db.query(`
            SELECT
                COUNT(*) as current_enrollment,
                COUNT(CASE WHEN is_on_recurring_billing = 1 THEN 1 END) as active_students
            FROM children WHERE center_id = ?
        `, [centerId]);

        // Get staff stats
        const [staffStats] = await db.query(`
            SELECT
                COUNT(*) as total_staff,
                COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_staff
            FROM users WHERE center_id = ? AND role IN ('teacher', 'admin', 'academic_coordinator')
        `, [centerId]);

        // Get operational KPIs
        const [kpis] = await db.query(`
            SELECT metric_name, metric_value, target_value, metric_unit, category
            FROM operational_kpis
            WHERE center_id = ? AND measurement_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            ORDER BY measurement_date DESC
        `, [centerId]);

        // Get budget summary and dynamic approval limits
        const [budgetStats] = await db.query(`
            SELECT
                SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_approvals,
                SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approved_amount
            FROM budget_approvals
            WHERE center_id = ? AND fiscal_year = YEAR(CURDATE())
        `, [centerId]);

        // Get dynamic approval limit from Financial Manager system
        const [approvalLimits] = await db.query(`
            SELECT approval_limit
            FROM budget_approval_limits
            WHERE center_id = ? AND role = ? AND fiscal_year = YEAR(CURDATE()) AND is_active = TRUE
            ORDER BY created_at DESC
            LIMIT 1
        `, [centerId, req.user.role]);

        // Get recent incidents
        const [recentIncidents] = await db.query(`
            SELECT incident_type, severity, incident_date, status, description
            FROM incident_reports
            WHERE center_id = ?
            ORDER BY incident_date DESC
            LIMIT 5
        `, [centerId]);

        // Get parent feedback stats
        const [feedbackStats] = await db.query(`
            SELECT
                COUNT(*) as total_feedback,
                COUNT(CASE WHEN status = 'new' OR status = 'acknowledged' THEN 1 END) as pending_feedback,
                AVG(satisfaction_rating) as avg_rating
            FROM parent_feedback
            WHERE center_id = ? AND submission_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        `, [centerId]);

        // Get staff performance summary
        const [performanceStats] = await db.query(`
            SELECT
                overall_rating,
                COUNT(*) as count
            FROM staff_performance
            WHERE center_id = ?
            AND evaluation_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
            GROUP BY overall_rating
        `, [centerId]);

        res.json({
            success: true,
            data: {
                centerInfo: centerInfo[0],
                enrollment: enrollmentStats[0],
                staff: staffStats[0],
                kpis: kpis,
                budget: {
                    ...budgetStats[0],
                    approval_limit: centerInfo[0]?.director_budget_limit || 25000,
                    dynamic_approval_limit: approvalLimits[0]?.approval_limit || centerInfo[0]?.director_budget_limit || 25000
                },
                incidents: recentIncidents,
                feedback: feedbackStats[0],
                performance: performanceStats
            }
        });

    } catch (error) {
        console.error('Center director dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load dashboard data',
            error: error.message
        });
    }
});

// GET /budget/requests - Get budget requests for approval
router.get('/budget/requests', protect, centerDirectorOrAbove, async (req, res) => {
    try {
        const centerId = req.user.center_id;
        const { status = 'pending', page = 1, limit = 20 } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const [requests] = await db.query(`
            SELECT
                ba.id, ba.amount, ba.category, ba.description, ba.justification,
                ba.requested_date, ba.status, ba.priority, ba.budget_code,
                u.full_name as requested_by_name
            FROM budget_approvals ba
            LEFT JOIN users u ON ba.requested_by = u.id
            WHERE ba.center_id = ?
            ${status !== 'all' ? 'AND ba.status = ?' : ''}
            ORDER BY ba.requested_date DESC, ba.priority DESC
            LIMIT ? OFFSET ?
        `, status !== 'all' ? [centerId, status, parseInt(limit), offset] : [centerId, parseInt(limit), offset]);

        const [totalCount] = await db.query(`
            SELECT COUNT(*) as total
            FROM budget_approvals
            WHERE center_id = ?
            ${status !== 'all' ? 'AND status = ?' : ''}
        `, status !== 'all' ? [centerId, status] : [centerId]);

        res.json({
            success: true,
            data: requests,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount[0].total,
                pages: Math.ceil(totalCount[0].total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Budget requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load budget requests',
            error: error.message
        });
    }
});

// POST /budget/approve/:id - Approve/reject budget request
router.post('/budget/approve/:id', protect, centerDirectorOrAbove, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, approval_notes } = req.body;
        const approverId = req.user.id;

        // Validate status
        if (!['approved', 'rejected', 'revision_required'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid approval status'
            });
        }

        // Get request details and check approval limit
        const [request] = await db.query(`
            SELECT amount, center_id, status as current_status
            FROM budget_approvals
            WHERE id = ?
        `, [id]);

        if (!request.length) {
            return res.status(404).json({
                success: false,
                message: 'Budget request not found'
            });
        }

        // Get dynamic approval limit from Financial Manager system
        const [dynamicLimits] = await db.query(`
            SELECT approval_limit
            FROM budget_approval_limits
            WHERE center_id = ? AND role = ? AND fiscal_year = YEAR(CURDATE()) AND is_active = TRUE
            ORDER BY created_at DESC
            LIMIT 1
        `, [request[0].center_id, req.user.role]);

        // Fall back to user's budget_approval_limit if no dynamic limit set
        const [userInfo] = await db.query(`
            SELECT budget_approval_limit
            FROM users
            WHERE id = ?
        `, [approverId]);

        const dynamicLimit = dynamicLimits[0]?.approval_limit;
        const fallbackLimit = userInfo[0]?.budget_approval_limit || 25000;
        const approvalLimit = dynamicLimit || fallbackLimit;

        // Check if category requires FM approval
        const [categoryInfo] = await db.query(`
            SELECT requires_fm_approval
            FROM budget_categories bc
            JOIN budget_approvals ba ON ba.category = bc.name
            WHERE ba.id = ?
        `, [id]);

        const requiresFMApproval = categoryInfo[0]?.requires_fm_approval || false;

        if (status === 'approved' && (request[0].amount > approvalLimit || requiresFMApproval)) {
            // Escalate to Financial Manager instead of rejecting
            await db.query(`
                UPDATE budget_approvals
                SET fm_review_required = TRUE,
                    escalated_to_fm = TRUE,
                    actual_approver_role = ?
                WHERE id = ?
            `, [req.user.role, id]);

            // Create oversight record
            await db.query(`
                INSERT INTO financial_oversight (
                    id, center_id, oversight_type, severity, title, description,
                    amount, related_request_id, related_user_id, action_required
                ) VALUES (
                    UUID(), ?, 'approval_required',
                    CASE WHEN ? > ? * 2 THEN 'critical'
                         WHEN ? > ? * 1.5 THEN 'warning'
                         ELSE 'info' END,
                    'Budget approval exceeds authority',
                    CONCAT('Amount: $', ?, ' exceeds approval limit of $', ?),
                    ?, ?, ?, TRUE
                )
            `, [
                request[0].center_id,
                request[0].amount, approvalLimit,
                request[0].amount, approvalLimit,
                request[0].amount, approvalLimit,
                request[0].amount, id, approverId
            ]);

            return res.json({
                success: true,
                message: `Budget request escalated to Financial Manager for review. Amount exceeds your approval limit of $${approvalLimit.toLocaleString()}`,
                escalated: true
            });
        }

        // Update the request
        await db.query(`
            UPDATE budget_approvals
            SET status = ?, approved_by = ?, approved_date = NOW(), approval_notes = ?
            WHERE id = ?
        `, [status, approverId, approval_notes, id]);

        res.json({
            success: true,
            message: `Budget request ${status} successfully`
        });

    } catch (error) {
        console.error('Budget approval error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process budget approval',
            error: error.message
        });
    }
});

// GET /staff/schedules - Get staff schedules
router.get('/staff/schedules', protect, centerDirectorOrAbove, async (req, res) => {
    try {
        const centerId = req.user.center_id;
        const { date = new Date().toISOString().split('T')[0] } = req.query;

        const [schedules] = await db.query(`
            SELECT
                ss.id, ss.schedule_date, ss.shift_start, ss.shift_end,
                ss.break_start, ss.break_end, ss.role_assignment, ss.status, ss.notes,
                u.full_name as staff_name, u.role,
                c.name as classroom_name
            FROM staff_schedules ss
            LEFT JOIN users u ON ss.staff_id = u.id
            LEFT JOIN classrooms c ON ss.classroom_assignment = c.id
            WHERE ss.center_id = ? AND ss.schedule_date = ?
            ORDER BY ss.shift_start
        `, [centerId, date]);

        res.json({
            success: true,
            data: schedules,
            date: date
        });

    } catch (error) {
        console.error('Staff schedules error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load staff schedules',
            error: error.message
        });
    }
});

// POST /staff/schedules - Create/update staff schedule
router.post('/staff/schedules', protect, centerDirectorOrAbove, async (req, res) => {
    try {
        const centerId = req.user.center_id;
        const {
            staff_id,
            schedule_date,
            shift_start,
            shift_end,
            break_start,
            break_end,
            role_assignment,
            classroom_assignment,
            notes
        } = req.body;

        const scheduleId = uuidv4();

        await db.query(`
            INSERT INTO staff_schedules (
                id, center_id, staff_id, schedule_date, shift_start, shift_end,
                break_start, break_end, role_assignment, classroom_assignment,
                notes, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                shift_start = VALUES(shift_start),
                shift_end = VALUES(shift_end),
                break_start = VALUES(break_start),
                break_end = VALUES(break_end),
                role_assignment = VALUES(role_assignment),
                classroom_assignment = VALUES(classroom_assignment),
                notes = VALUES(notes)
        `, [
            scheduleId, centerId, staff_id, schedule_date, shift_start, shift_end,
            break_start, break_end, role_assignment, classroom_assignment,
            notes, req.user.id
        ]);

        res.json({
            success: true,
            message: 'Staff schedule saved successfully',
            id: scheduleId
        });

    } catch (error) {
        console.error('Staff schedule save error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save staff schedule',
            error: error.message
        });
    }
});

// GET /incidents - Get incident reports
router.get('/incidents', protect, centerDirectorOrAbove, async (req, res) => {
    try {
        const centerId = req.user.center_id;
        const { status = 'all', severity = 'all', page = 1, limit = 20 } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereClause = 'WHERE ir.center_id = ?';
        let params = [centerId];

        if (status !== 'all') {
            whereClause += ' AND ir.status = ?';
            params.push(status);
        }

        if (severity !== 'all') {
            whereClause += ' AND ir.severity = ?';
            params.push(severity);
        }

        const [incidents] = await db.query(`
            SELECT
                ir.id, ir.incident_type, ir.severity, ir.incident_date,
                ir.location, ir.description, ir.status, ir.medical_attention,
                ir.parents_notified, ir.authorities_contacted,
                u.full_name as reported_by_name,
                ur.full_name as reviewed_by_name
            FROM incident_reports ir
            LEFT JOIN users u ON ir.reported_by = u.id
            LEFT JOIN users ur ON ir.reviewed_by = ur.id
            ${whereClause}
            ORDER BY ir.incident_date DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), offset]);

        const [totalCount] = await db.query(`
            SELECT COUNT(*) as total
            FROM incident_reports ir
            ${whereClause}
        `, params);

        res.json({
            success: true,
            data: incidents,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount[0].total,
                pages: Math.ceil(totalCount[0].total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Incidents error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load incidents',
            error: error.message
        });
    }
});

// POST /incidents - Create incident report
router.post('/incidents', protect, centerDirectorOrAbove, async (req, res) => {
    try {
        const centerId = req.user.center_id;
        const {
            incident_type,
            severity,
            incident_date,
            location,
            description,
            immediate_actions,
            people_involved,
            witnesses,
            injuries_sustained,
            medical_attention,
            medical_provider
        } = req.body;

        const incidentId = uuidv4();

        await db.query(`
            INSERT INTO incident_reports (
                id, center_id, incident_type, severity, incident_date,
                location, description, immediate_actions, people_involved,
                witnesses, injuries_sustained, medical_attention, medical_provider,
                reported_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            incidentId, centerId, incident_type, severity, incident_date,
            location, description, immediate_actions,
            people_involved ? JSON.stringify(people_involved) : null,
            witnesses ? JSON.stringify(witnesses) : null,
            injuries_sustained, medical_attention, medical_provider,
            req.user.id
        ]);

        res.json({
            success: true,
            message: 'Incident report created successfully',
            id: incidentId
        });

    } catch (error) {
        console.error('Create incident error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create incident report',
            error: error.message
        });
    }
});

// GET /parent-feedback - Get parent feedback
router.get('/parent-feedback', protect, centerDirectorOrAbove, async (req, res) => {
    try {
        const centerId = req.user.center_id;
        const { status = 'all', category = 'all', page = 1, limit = 20 } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereClause = 'WHERE pf.center_id = ?';
        let params = [centerId];

        if (status !== 'all') {
            whereClause += ' AND pf.status = ?';
            params.push(status);
        }

        if (category !== 'all') {
            whereClause += ' AND pf.category = ?';
            params.push(category);
        }

        const [feedback] = await db.query(`
            SELECT
                pf.id, pf.feedback_type, pf.category, pf.priority,
                pf.subject, pf.message, pf.submission_date, pf.status,
                pf.response, pf.response_date, pf.satisfaction_rating,
                CONCAT(c.first_name, ' ', c.last_name) as child_name,
                u.full_name as assigned_to_name
            FROM parent_feedback pf
            LEFT JOIN children c ON pf.child_id = c.id
            LEFT JOIN users u ON pf.assigned_to = u.id
            ${whereClause}
            ORDER BY pf.submission_date DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), offset]);

        const [totalCount] = await db.query(`
            SELECT COUNT(*) as total
            FROM parent_feedback pf
            ${whereClause}
        `, params);

        res.json({
            success: true,
            data: feedback,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount[0].total,
                pages: Math.ceil(totalCount[0].total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Parent feedback error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load parent feedback',
            error: error.message
        });
    }
});

// POST /parent-feedback/:id/response - Respond to parent feedback
router.post('/parent-feedback/:id/response', protect, centerDirectorOrAbove, async (req, res) => {
    try {
        const { id } = req.params;
        const { response, status = 'resolved' } = req.body;

        await db.query(`
            UPDATE parent_feedback
            SET response = ?, response_date = NOW(), status = ?, assigned_to = ?
            WHERE id = ?
        `, [response, status, req.user.id, id]);

        res.json({
            success: true,
            message: 'Response sent successfully'
        });

    } catch (error) {
        console.error('Parent feedback response error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send response',
            error: error.message
        });
    }
});

// GET /kpis - Get operational KPIs
router.get('/kpis', protect, centerDirectorOrAbove, async (req, res) => {
    try {
        const centerId = req.user.center_id;
        const { category = 'all', period = 'monthly' } = req.query;

        let whereClause = 'WHERE center_id = ?';
        let params = [centerId];

        if (category !== 'all') {
            whereClause += ' AND category = ?';
            params.push(category);
        }

        const [kpis] = await db.query(`
            SELECT
                metric_name, metric_value, target_value, metric_unit,
                measurement_date, category, subcategory, notes
            FROM operational_kpis
            ${whereClause}
            AND measurement_period = ?
            ORDER BY measurement_date DESC, category, metric_name
        `, [...params, period]);

        res.json({
            success: true,
            data: kpis
        });

    } catch (error) {
        console.error('KPIs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load KPIs',
            error: error.message
        });
    }
});

// POST /kpis - Create/update KPI
router.post('/kpis', protect, centerDirectorOrAbove, async (req, res) => {
    try {
        const centerId = req.user.center_id;
        const {
            metric_name,
            metric_value,
            target_value,
            metric_unit,
            measurement_date,
            measurement_period,
            category,
            subcategory,
            notes
        } = req.body;

        const kpiId = uuidv4();

        await db.query(`
            INSERT INTO operational_kpis (
                id, center_id, metric_name, metric_value, target_value,
                metric_unit, measurement_date, measurement_period,
                category, subcategory, notes, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            kpiId, centerId, metric_name, metric_value, target_value,
            metric_unit, measurement_date, measurement_period,
            category, subcategory, notes, req.user.id
        ]);

        res.json({
            success: true,
            message: 'KPI saved successfully',
            id: kpiId
        });

    } catch (error) {
        console.error('KPI save error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save KPI',
            error: error.message
        });
    }
});

// POST /emergency/alert - Trigger emergency alert
router.post('/emergency/alert', protect, centerDirectorOrAbove, async (req, res) => {
    try {
        const centerId = req.user.center_id;
        const {
            alert_type,
            severity,
            message,
            location,
            requires_evacuation,
            affected_areas,
            instructions
        } = req.body;

        const alertId = uuidv4();

        // Create emergency alert record
        await db.query(`
            INSERT INTO emergency_alerts (
                id, center_id, alert_type, severity, message, location,
                requires_evacuation, affected_areas, instructions,
                triggered_by, triggered_at, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'active')
        `, [
            alertId, centerId, alert_type, severity, message, location,
            requires_evacuation, affected_areas ? JSON.stringify(affected_areas) : null,
            instructions, req.user.id
        ]);

        // Broadcast emergency alert via WebSocket
        if (global.io) {
            const alertData = {
                id: alertId,
                type: alert_type,
                severity: severity,
                message: message,
                location: location,
                requires_evacuation: requires_evacuation,
                instructions: instructions,
                triggered_by: req.user.full_name,
                triggered_at: new Date().toISOString()
            };

            // Send to all users in the center
            global.io.to(`center-${centerId}`).emit('emergency-alert', alertData);

            // Send to all connected dashboards for this center
            global.io.to(`dashboard-${centerId}`).emit('emergency-alert', alertData);

            console.log(`Emergency alert broadcasted to center ${centerId}:`, alertData);
        }

        // Create incident report for the emergency
        const incidentId = uuidv4();
        await db.query(`
            INSERT INTO incident_reports (
                id, center_id, incident_type, severity, incident_date,
                location, description, reported_by, status
            ) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, 'reported')
        `, [
            incidentId, centerId, 'emergency', severity,
            location, `Emergency Alert: ${message}`, req.user.id
        ]);

        res.json({
            success: true,
            message: 'Emergency alert triggered successfully',
            alert_id: alertId,
            incident_id: incidentId
        });

    } catch (error) {
        console.error('Emergency alert error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to trigger emergency alert',
            error: error.message
        });
    }
});

// PUT /emergency/alert/:id/resolve - Resolve emergency alert
router.put('/emergency/alert/:id/resolve', protect, centerDirectorOrAbove, async (req, res) => {
    try {
        const { id } = req.params;
        const { resolution_notes } = req.body;
        const centerId = req.user.center_id;

        await db.query(`
            UPDATE emergency_alerts
            SET status = 'resolved', resolved_by = ?, resolved_at = NOW(), resolution_notes = ?
            WHERE id = ? AND center_id = ?
        `, [req.user.id, resolution_notes, id, centerId]);

        // Broadcast resolution via WebSocket
        if (global.io) {
            const resolutionData = {
                alert_id: id,
                status: 'resolved',
                resolved_by: req.user.full_name,
                resolved_at: new Date().toISOString(),
                resolution_notes: resolution_notes
            };

            global.io.to(`center-${centerId}`).emit('emergency-resolved', resolutionData);
            global.io.to(`dashboard-${centerId}`).emit('emergency-resolved', resolutionData);
        }

        res.json({
            success: true,
            message: 'Emergency alert resolved successfully'
        });

    } catch (error) {
        console.error('Emergency resolution error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resolve emergency alert',
            error: error.message
        });
    }
});

// GET /emergency/alerts - Get emergency alerts
router.get('/emergency/alerts', protect, centerDirectorOrAbove, async (req, res) => {
    try {
        const centerId = req.user.center_id;
        const { status = 'all', limit = 20 } = req.query;

        let whereClause = 'WHERE center_id = ?';
        let params = [centerId];

        if (status !== 'all') {
            whereClause += ' AND status = ?';
            params.push(status);
        }

        const [alerts] = await db.query(`
            SELECT
                ea.id, ea.alert_type, ea.severity, ea.message, ea.location,
                ea.requires_evacuation, ea.affected_areas, ea.instructions,
                ea.triggered_at, ea.status, ea.resolved_at, ea.resolution_notes,
                u1.full_name as triggered_by_name,
                u2.full_name as resolved_by_name
            FROM emergency_alerts ea
            LEFT JOIN users u1 ON ea.triggered_by = u1.id
            LEFT JOIN users u2 ON ea.resolved_by = u2.id
            ${whereClause}
            ORDER BY ea.triggered_at DESC
            LIMIT ?
        `, [...params, parseInt(limit)]);

        res.json({
            success: true,
            data: alerts
        });

    } catch (error) {
        console.error('Emergency alerts error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load emergency alerts',
            error: error.message
        });
    }
});

export default router;