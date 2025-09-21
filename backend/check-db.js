import pool from './db.js';

async function checkDatabase() {
    try {
        console.log('=== Checking Database Tables ===');
        
        // Show all tables
        const [tables] = await pool.query('SHOW TABLES');
        console.log('Available tables:', tables);
        
        // Check centers table structure
        console.log('\n=== Centers Table Structure ===');
        const [centersColumns] = await pool.query('DESCRIBE centers');
        console.log('Centers columns:', centersColumns);
        
        // Check if there are any centers
        console.log('\n=== Centers Data ===');
        const [centersData] = await pool.query('SELECT * FROM centers LIMIT 5');
        console.log('Centers data:', centersData);
        
        // Check children table structure if it exists
        try {
            console.log('\n=== Children Table Structure ===');
            const [childrenColumns] = await pool.query('DESCRIBE children');
            console.log('Children columns:', childrenColumns);
        } catch (err) {
            console.log('Children table does not exist:', err.message);
        }
        
        // Check classrooms table structure if it exists
        try {
            console.log('\n=== Classrooms Table Structure ===');
            const [classroomsColumns] = await pool.query('DESCRIBE classrooms');
            console.log('Classrooms columns:', classroomsColumns);
        } catch (err) {
            console.log('Classrooms table does not exist:', err.message);
        }
        
        // Check staff_assignments table structure if it exists
        try {
            console.log('\n=== Staff Assignments Table Structure ===');
            const [staffColumns] = await pool.query('DESCRIBE staff_assignments');
            console.log('Staff assignments columns:', staffColumns);
        } catch (err) {
            console.log('Staff_assignments table does not exist:', err.message);
        }

        // Check invoices table structure
        try {
            console.log('\n=== Invoices Table Structure ===');
            const [invoicesColumns] = await pool.query('DESCRIBE invoices');
            console.log('Invoices columns:', invoicesColumns);
        } catch (err) {
            console.log('Invoices table does not exist:', err.message);
        }

        // Check invoice_items table structure
        try {
            console.log('\n=== Invoice Items Table Structure ===');
            const [invoiceItemsColumns] = await pool.query('DESCRIBE invoice_items');
            console.log('Invoice items columns:', invoiceItemsColumns);
        } catch (err) {
            console.log('Invoice_items table does not exist:', err.message);
        }

        // Check users table structure
        try {
            console.log('\n=== Users Table Structure ===');
            const [usersColumns] = await pool.query('DESCRIBE users');
            console.log('Users columns:', usersColumns);
        } catch (err) {
            console.log('Users table does not exist:', err.message);
        }

        // Check enquiries table structure
        try {
            console.log('\n=== Enquiries Table Structure ===');
            const [enquiriesColumns] = await pool.query('DESCRIBE enquiries');
            console.log('Enquiries columns:', enquiriesColumns);
        } catch (err) {
            console.log('Enquiries table does not exist:', err.message);
        }
        
    } catch (error) {
        console.error('Database check error:', error);
    } finally {
        await pool.end();
    }
}

checkDatabase();