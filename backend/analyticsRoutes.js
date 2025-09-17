import express from 'express';
import pool from './db.js';
import { protect } from './authMiddleware.js';

const router = express.Router();

// Middleware to ensure only owners and superadmins can access analytics
const analyticsAccess = (req, res, next) => {
    if (!['owner', 'superadmin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden: Access restricted to owners and superadmins.' });
    }
    next();
};

// Validate center access
const validateCenterAccess = (req, res, next) => {
    const requestedCenterId = req.query.centerId;
    const { role, center_id } = req.user;

    if (role === 'superadmin') {
        next(); // Superadmin can access any center
    } else if (!requestedCenterId || requestedCenterId === center_id) {
        next(); // Owner accessing their own center
    } else {
        return res.status(403).json({ message: 'Access denied to this center.' });
    }
};

// Apply middleware to all routes
router.use(protect);
router.use(analyticsAccess);
router.use(validateCenterAccess);

// GET /api/analytics/overview - Main dashboard overview
router.get('/overview', async (req, res) => {
    try {
        const { centerId } = req.query;
        const { role, center_id } = req.user;
        
        // Use user's center if not specified (for owners)
        const targetCenterId = role === 'superadmin' ? centerId : center_id;
        
        let whereClause = '';
        let queryParams = [];
        
        if (targetCenterId) {
            whereClause = 'WHERE center_id = ?';
            queryParams.push(targetCenterId);
        }

        // Get overview metrics
        const [overview] = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM children ${whereClause}) as total_students,
                (SELECT COUNT(*) FROM users WHERE role IN ('admin', 'teacher') ${targetCenterId ? 'AND center_id = ?' : ''}) as total_staff,
                (SELECT COUNT(*) FROM invoices WHERE status = 'Pending' ${targetCenterId ? 'AND center_id = ?' : ''}) as pending_invoices,
                (SELECT COUNT(*) FROM enquiries WHERE status = 'Open' ${targetCenterId ? 'AND center_id = ?' : ''}) as open_enquiries,
                (SELECT COUNT(*) FROM classrooms ${whereClause}) as total_classrooms,
                (SELECT SUM(total_amount) FROM invoices WHERE status = 'Paid' AND MONTH(issue_date) = MONTH(CURRENT_DATE()) ${targetCenterId ? 'AND center_id = ?' : ''}) as monthly_revenue
        `, targetCenterId ? [targetCenterId, targetCenterId, targetCenterId, targetCenterId, targetCenterId, targetCenterId] : []);

        res.status(200).json(overview[0]);
        
    } catch (error) {
        console.error('Error fetching overview:', error);
        res.status(500).json({ message: 'Server error while fetching overview.' });
    }
});

// GET /api/analytics/demographics - Student demographics
router.get('/demographics', async (req, res) => {
    try {
        const { centerId } = req.query;
        const { role, center_id } = req.user;
        const targetCenterId = role === 'superadmin' ? centerId : center_id;
        
        let whereClause = targetCenterId ? 'WHERE c.center_id = ?' : '';
        let queryParams = targetCenterId ? [targetCenterId] : [];

        // Age groups distribution
        const [ageGroups] = await pool.query(`
            SELECT 
                CASE 
                    WHEN TIMESTAMPDIFF(MONTH, date_of_birth, CURDATE()) < 18 THEN 'Infants (0-18 months)'
                    WHEN TIMESTAMPDIFF(MONTH, date_of_birth, CURDATE()) < 36 THEN 'Toddlers (18-36 months)'
                    WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) < 5 THEN 'Preschoolers (3-5 years)'
                    ELSE 'School Age (5+ years)'
                END as age_group,
                COUNT(*) as count
            FROM children c ${whereClause}
            GROUP BY age_group
            ORDER BY count DESC
        `, queryParams);

        // Gender distribution
        const [genderDistribution] = await pool.query(`
            SELECT gender, COUNT(*) as count
            FROM children c ${whereClause}
            GROUP BY gender
        `, queryParams);

        // Students by classroom
        const [classroomDistribution] = await pool.query(`
            SELECT 
                cl.name as classroom_name,
                COUNT(c.id) as student_count,
                cl.id as classroom_id
            FROM classrooms cl
            LEFT JOIN children c ON cl.id = c.classroom_id
            ${targetCenterId ? 'WHERE cl.center_id = ?' : ''}
            GROUP BY cl.id, cl.name
            ORDER BY student_count DESC
        `, queryParams);

        res.status(200).json({
            age_groups: ageGroups,
            gender_distribution: genderDistribution,
            classroom_distribution: classroomDistribution
        });
        
    } catch (error) {
        console.error('Error fetching demographics:', error);
        res.status(500).json({ message: 'Server error while fetching demographics.' });
    }
});

// GET /api/analytics/enrollment-trends - Enrollment trends over time
router.get('/enrollment-trends', async (req, res) => {
    try {
        const { centerId } = req.query;
        const { role, center_id } = req.user;
        const targetCenterId = role === 'superadmin' ? centerId : center_id;
        
        let whereClause = targetCenterId ? 'WHERE center_id = ?' : '';
        let queryParams = targetCenterId ? [targetCenterId, targetCenterId] : [];

        // Monthly enrollment trends (last 12 months)
        const [monthlyEnrollments] = await pool.query(`
            SELECT 
                DATE_FORMAT(enrollment_date, '%Y-%m') as month,
                COUNT(*) as enrollments
            FROM children 
            ${whereClause} 
            AND enrollment_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(enrollment_date, '%Y-%m')
            ORDER BY month
        `, queryParams);

        // Enquiry vs Enrollment comparison (last 6 months)
        const [conversionData] = await pool.query(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COUNT(*) as enquiries,
                SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed_enquiries
            FROM enquiries 
            ${whereClause}
            AND created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month
        `, queryParams);

        res.status(200).json({
            monthly_enrollments: monthlyEnrollments,
            conversion_data: conversionData
        });
        
    } catch (error) {
        console.error('Error fetching enrollment trends:', error);
        res.status(500).json({ message: 'Server error while fetching enrollment trends.' });
    }
});

// GET /api/analytics/conversion-metrics - Enquiry conversion analysis
router.get('/conversion-metrics', async (req, res) => {
    try {
        const { centerId } = req.query;
        const { role, center_id } = req.user;
        const targetCenterId = role === 'superadmin' ? centerId : center_id;
        
        let whereClause = targetCenterId ? 'WHERE center_id = ?' : '';
        let queryParams = targetCenterId ? [targetCenterId, targetCenterId, targetCenterId] : [];

        // Conversion funnel
        const [funnelData] = await pool.query(`
            SELECT 
                status,
                COUNT(*) as count
            FROM enquiries ${whereClause}
            GROUP BY status
            ORDER BY 
                CASE status 
                    WHEN 'Open' THEN 1 
                    WHEN 'Follow-up' THEN 2 
                    WHEN 'Closed' THEN 3 
                    WHEN 'Lost' THEN 4 
                END
        `, queryParams);

        // Conversion by source
        const [sourceConversion] = await pool.query(`
            SELECT 
                source,
                COUNT(*) as total_enquiries,
                SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as converted,
                ROUND((SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as conversion_rate
            FROM enquiries ${whereClause}
            GROUP BY source
            ORDER BY conversion_rate DESC
        `, queryParams);

        // Average days to conversion
        const [avgDays] = await pool.query(`
            SELECT 
                AVG(DATEDIFF(updated_at, created_at)) as avg_days_to_close
            FROM enquiries 
            ${whereClause}
            AND status = 'Closed'
            AND updated_at IS NOT NULL
        `, queryParams);

        res.status(200).json({
            funnel_data: funnelData,
            source_conversion: sourceConversion,
            avg_conversion_days: avgDays[0]?.avg_days_to_close || 0
        });
        
    } catch (error) {
        console.error('Error fetching conversion metrics:', error);
        res.status(500).json({ message: 'Server error while fetching conversion metrics.' });
    }
});

// GET /api/analytics/financial-overview - Financial analytics
router.get('/financial-overview', async (req, res) => {
    try {
        const { centerId } = req.query;
        const { role, center_id } = req.user;
        const targetCenterId = role === 'superadmin' ? centerId : center_id;
        
        let whereClause = targetCenterId ? 'WHERE center_id = ?' : '';
        let queryParams = targetCenterId ? Array(6).fill(targetCenterId) : [];

        // Revenue trends (last 12 months)
        const [revenueData] = await pool.query(`
            SELECT 
                DATE_FORMAT(issue_date, '%Y-%m') as month,
                SUM(CASE WHEN status = 'Paid' THEN total_amount ELSE 0 END) as paid_amount,
                SUM(CASE WHEN status = 'Pending' THEN total_amount ELSE 0 END) as pending_amount,
                SUM(CASE WHEN status = 'Overdue' THEN total_amount ELSE 0 END) as overdue_amount
            FROM invoices 
            ${whereClause}
            AND issue_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(issue_date, '%Y-%m')
            ORDER BY month
        `, queryParams);

        // Invoice status distribution
        const [invoiceStatus] = await pool.query(`
            SELECT 
                status,
                COUNT(*) as count,
                SUM(total_amount) as total_amount
            FROM invoices ${whereClause}
            GROUP BY status
        `, queryParams);

        // Revenue by program (through fee structures)
        const [programRevenue] = await pool.query(`
            SELECT 
                fs.program_name,
                SUM(ili.total_price) as total_revenue,
                COUNT(DISTINCT i.id) as invoice_count
            FROM invoice_line_items ili
            JOIN invoices i ON ili.invoice_id = i.id
            JOIN fee_structures fs ON ili.fee_structure_id = fs.id
            ${targetCenterId ? 'WHERE i.center_id = ?' : ''}
            AND i.status = 'Paid'
            GROUP BY fs.program_name
            ORDER BY total_revenue DESC
        `, queryParams);

        // Collection efficiency
        const [collectionData] = await pool.query(`
            SELECT 
                COUNT(*) as total_invoices,
                SUM(total_amount) as total_amount,
                SUM(CASE WHEN status = 'Paid' THEN total_amount ELSE 0 END) as collected_amount,
                ROUND((SUM(CASE WHEN status = 'Paid' THEN total_amount ELSE 0 END) / SUM(total_amount)) * 100, 2) as collection_rate
            FROM invoices 
            ${whereClause}
            AND issue_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 MONTH)
        `, queryParams);

        res.status(200).json({
            revenue_trends: revenueData,
            invoice_status: invoiceStatus,
            program_revenue: programRevenue,
            collection_efficiency: collectionData[0]
        });
        
    } catch (error) {
        console.error('Error fetching financial overview:', error);
        res.status(500).json({ message: 'Server error while fetching financial data.' });
    }
});

// GET /api/analytics/center-comparison - Compare centers (superadmin only)
router.get('/center-comparison', async (req, res) => {
    if (req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Access restricted to superadmins.' });
    }
    
    try {
        const [centerComparison] = await pool.query(`
            SELECT 
                c.center_name,
                c.id as center_id,
                COUNT(DISTINCT ch.id) as total_students,
                COUNT(DISTINCT cl.id) as total_classrooms,
                COUNT(DISTINCT u.id) as total_staff,
                COALESCE(SUM(CASE WHEN i.status = 'Paid' AND MONTH(i.issue_date) = MONTH(CURRENT_DATE()) THEN i.total_amount ELSE 0 END), 0) as monthly_revenue,
                COALESCE(COUNT(CASE WHEN e.status = 'Closed' AND MONTH(e.created_at) = MONTH(CURRENT_DATE()) THEN 1 END), 0) as monthly_conversions
            FROM centers c
            LEFT JOIN children ch ON c.id = ch.center_id
            LEFT JOIN classrooms cl ON c.id = cl.center_id
            LEFT JOIN users u ON c.id = u.center_id AND u.role IN ('admin', 'teacher')
            LEFT JOIN invoices i ON c.id = i.center_id
            LEFT JOIN enquiries e ON c.id = e.center_id
            WHERE c.is_active = 1
            GROUP BY c.id, c.center_name
            ORDER BY monthly_revenue DESC
        `);

        res.status(200).json(centerComparison);
        
    } catch (error) {
        console.error('Error fetching center comparison:', error);
        res.status(500).json({ message: 'Server error while fetching center comparison.' });
    }
});

export default router;