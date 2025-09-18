import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from './db.js';
import { protect as authenticateToken, checkRole } from './authMiddleware.js';

const router = express.Router();

// Error handler middleware
const handleErrors = (res, error, operation) => {
    console.error(`Error ${operation}:`, error);
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'A record with this information already exists' });
    }
    if (error.code === 'ER_NO_REFERENCED_ROW') {
        return res.status(400).json({ error: 'Referenced record does not exist' });
    }
    res.status(500).json({ error: 'Internal server error' });
};

// Get all invoices
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { center_id, academic_year, program_type } = req.query;

        let query = `
            SELECT 
                fs.*,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', fc.id,
                        'name', fc.name,
                        'amount', fc.amount,
                        'component_type', fc.component_type,
                        'is_refundable', fc.is_refundable,
                        'is_optional', fc.is_optional,
                        'applicable_months', fc.applicable_months
                    )
                ) as components
            FROM fee_structures fs
            LEFT JOIN fee_components fc ON fs.id = fc.fee_structure_id
            WHERE 1=1
        `;
        
        const params = [];

        if (center_id) {
            query += ` AND fs.center_id = ?`;
            params.push(center_id);
        }

        if (academic_year) {
            query += ` AND fs.academic_year = ?`;
            params.push(academic_year);
        }

        if (program_type) {
            query += ` AND fs.program_type = ?`;
            params.push(program_type);
        }

        query += ` GROUP BY fs.id`;

        const [feeStructures] = await pool.query(query, params);
        res.json(feeStructures);
    } catch (error) {
        console.error('Error fetching fee structures:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new fee structure
router.post('/', authenticateToken, checkRole(['admin', 'super_admin']), async (req, res) => {
    const {
        center_id,
        classroom_id,
        program_name,
        service_hours,
        monthly_fee,
        registration_fee = 10000,
        security_deposit = 10000,
        material_fee,
        quarterly_discount_percent = 0,
        annual_discount_percent = 0,
        age_group,
        academic_year,
        components = []
    } = req.body;

    try {
        await pool.query('START TRANSACTION');

        // Create fee structure
        const feeStructureId = uuidv4();
        await pool.query(
            `INSERT INTO fee_structures (
                id, center_id, classroom_id, program_name, service_hours,
                monthly_fee, registration_fee, security_deposit, material_fee,
                quarterly_discount_percent, annual_discount_percent,
                age_group, academic_year
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                feeStructureId, center_id, classroom_id, program_name, service_hours,
                monthly_fee, registration_fee, security_deposit, material_fee,
                quarterly_discount_percent, annual_discount_percent,
                age_group, academic_year
            ]
        );

        // Add fee components
        for (const component of components) {
            await pool.query(
                `INSERT INTO fee_components (
                    id, fee_structure_id, name, amount, component_type,
                    is_refundable, is_optional, applicable_months, description
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    uuidv4(), feeStructureId, component.name, component.amount,
                    component.component_type, component.is_refundable || false,
                    component.is_optional || false,
                    JSON.stringify(component.applicable_months || null),
                    component.description || null
                ]
            );
        }

        await pool.query('COMMIT');
        
        res.status(201).json({
            id: feeStructureId,
            message: 'Fee structure created successfully'
        });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error creating fee structure:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Calculate fees for a student
router.post('/calculate', authenticateToken, async (req, res) => {
    const {
        student_id,
        fee_structure_id,
        payment_frequency = 'Monthly',
        include_one_time_fees = false
    } = req.body;

    try {
        // Get fee structure and components
        const [feeStructure] = await pool.query(
            `SELECT * FROM fee_structures WHERE id = ?`,
            [fee_structure_id]
        );

        if (!feeStructure.length) {
            return res.status(404).json({ error: 'Fee structure not found' });
        }

        const structure = feeStructure[0];
        
        // Calculate recurring fees
        let totalFee = structure.monthly_fee;
        if (payment_frequency === 'Quarterly') {
            totalFee = (totalFee * 3) * (1 - (structure.quarterly_discount_percent / 100));
        } else if (payment_frequency === 'Annually') {
            totalFee = (totalFee * 12) * (1 - (structure.annual_discount_percent / 100));
        }

        // Add one-time fees if requested
        let oneTimeFees = [];
        if (include_one_time_fees) {
            const [components] = await pool.query(
                `SELECT * FROM fee_components 
                WHERE fee_structure_id = ? AND component_type = 'one_time'`,
                [fee_structure_id]
            );
            
            oneTimeFees = components;
            totalFee += components.reduce((sum, comp) => sum + comp.amount, 0);
        }

        res.json({
            base_fee: structure.monthly_fee,
            payment_frequency,
            discount_percent: payment_frequency === 'Quarterly' ? 
                structure.quarterly_discount_percent : 
                payment_frequency === 'Annually' ? 
                    structure.annual_discount_percent : 0,
            one_time_fees: oneTimeFees,
            total_fee: totalFee
        });
    } catch (error) {
        console.error('Error calculating fees:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;