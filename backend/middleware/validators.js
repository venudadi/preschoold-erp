const validateFeeStructure = (req, res, next) => {
    const {
        program_name,
        service_hours,
        monthly_fee,
        center_id,
        academic_year
    } = req.body;

    const errors = [];

    if (!program_name) errors.push('Program name is required');
    if (!center_id) errors.push('Center ID is required');
    if (!academic_year) errors.push('Academic year is required');
    
    if (typeof service_hours !== 'number' || service_hours <= 0) {
        errors.push('Service hours must be a positive number');
    }
    
    if (typeof monthly_fee !== 'number' || monthly_fee < 0) {
        errors.push('Monthly fee must be a non-negative number');
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    next();
};

const validateStudentTiming = (req, res, next) => {
    const { program_start_time, program_end_time } = req.body;

    const errors = [];

    if (!program_start_time) errors.push('Start time is required');
    if (!program_end_time) errors.push('End time is required');

    // Validate time format (HH:mm:ss)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    if (!timeRegex.test(program_start_time)) {
        errors.push('Invalid start time format');
    }
    if (!timeRegex.test(program_end_time)) {
        errors.push('Invalid end time format');
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    next();
};

const validateFeeComponent = (req, res, next) => {
    const { name, amount, component_type } = req.body;

    const errors = [];

    if (!name) errors.push('Component name is required');
    if (!component_type) errors.push('Component type is required');
    
    if (typeof amount !== 'number' || amount < 0) {
        errors.push('Amount must be a non-negative number');
    }

    if (!['one_time', 'recurring', 'annual'].includes(component_type)) {
        errors.push('Invalid component type');
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    next();
};

export {
    validateFeeStructure,
    validateStudentTiming,
    validateFeeComponent
};