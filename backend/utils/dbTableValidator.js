import pool from '../db.js';
import { DatabaseError } from './errorHandler.js';

/**
 * Database table validator and error handler
 * Checks if tables exist and creates them if missing
 */

const REQUIRED_TABLES = {
  invoice_requests: `
    CREATE TABLE IF NOT EXISTS invoice_requests (
      id VARCHAR(36) PRIMARY KEY,
      child_id INT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      due_date DATE NOT NULL,
      description TEXT,
      status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
      requested_by INT NOT NULL,
      reviewed_by INT,
      reviewed_at TIMESTAMP NULL,
      rejection_reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
      FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_invoice_requests_child (child_id),
      INDEX idx_invoice_requests_status (status),
      INDEX idx_invoice_requests_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  
  attendance: `
    CREATE TABLE IF NOT EXISTS attendance (
      id INT PRIMARY KEY AUTO_INCREMENT,
      child_id INT NOT NULL,
      center_id INT NOT NULL,
      date DATE NOT NULL,
      status ENUM('present', 'absent', 'late', 'excused') DEFAULT 'present',
      check_in_time TIME,
      check_out_time TIME,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
      FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
      INDEX idx_attendance_child (child_id),
      INDEX idx_attendance_center (center_id),
      INDEX idx_attendance_date (date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  teacher_classes: `
    CREATE TABLE IF NOT EXISTS teacher_classes (
      id INT PRIMARY KEY AUTO_INCREMENT,
      teacher_id INT NOT NULL,
      classroom_id INT NOT NULL,
      center_id INT NOT NULL,
      is_primary BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
      FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
      UNIQUE KEY unique_teacher_class (teacher_id, classroom_id),
      INDEX idx_teacher (teacher_id),
      INDEX idx_classroom (classroom_id),
      INDEX idx_center (center_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  digital_portfolio_items: `
    CREATE TABLE IF NOT EXISTS digital_portfolio_items (
      id VARCHAR(36) PRIMARY KEY,
      child_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      file_path VARCHAR(500),
      file_type ENUM('image', 'video', 'document', 'audio') NOT NULL,
      category VARCHAR(100),
      tags JSON,
      created_by INT NOT NULL,
      visibility ENUM('private', 'parents', 'teachers', 'public') DEFAULT 'parents',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_portfolio_child (child_id),
      INDEX idx_portfolio_category (category),
      INDEX idx_portfolio_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  lesson_plans: `
    CREATE TABLE IF NOT EXISTS lesson_plans (
      id VARCHAR(36) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      classroom_id INT NOT NULL,
      teacher_id INT NOT NULL,
      subject VARCHAR(100),
      objectives TEXT,
      materials TEXT,
      activities TEXT,
      assessment TEXT,
      planned_date DATE NOT NULL,
      duration_minutes INT DEFAULT 60,
      status ENUM('draft', 'published', 'completed') DEFAULT 'draft',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_lesson_plans_classroom (classroom_id),
      INDEX idx_lesson_plans_teacher (teacher_id),
      INDEX idx_lesson_plans_date (planned_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  observation_logs: `
    CREATE TABLE IF NOT EXISTS observation_logs (
      id VARCHAR(36) PRIMARY KEY,
      child_id INT NOT NULL,
      observer_id INT NOT NULL,
      observation_date DATE NOT NULL,
      observation_time TIME NOT NULL,
      category VARCHAR(100),
      observation TEXT NOT NULL,
      developmental_area VARCHAR(100),
      notes TEXT,
      is_significant BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
      FOREIGN KEY (observer_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_observation_child (child_id),
      INDEX idx_observation_observer (observer_id),
      INDEX idx_observation_date (observation_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  classroom_announcements: `
    CREATE TABLE IF NOT EXISTS classroom_announcements (
      id VARCHAR(36) PRIMARY KEY,
      classroom_id INT NOT NULL,
      teacher_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
      is_active BOOLEAN DEFAULT TRUE,
      scheduled_date DATE,
      expires_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_announcements_classroom (classroom_id),
      INDEX idx_announcements_teacher (teacher_id),
      INDEX idx_announcements_date (scheduled_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  assignments: `
    CREATE TABLE IF NOT EXISTS assignments (
      id VARCHAR(36) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      classroom_id INT NOT NULL,
      teacher_id INT NOT NULL,
      subject VARCHAR(100),
      instructions TEXT,
      due_date DATE,
      points_possible INT DEFAULT 100,
      is_published BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_assignments_classroom (classroom_id),
      INDEX idx_assignments_teacher (teacher_id),
      INDEX idx_assignments_due_date (due_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  messaging: `
    CREATE TABLE IF NOT EXISTS messaging (
      id VARCHAR(36) PRIMARY KEY,
      sender_id INT NOT NULL,
      recipient_id INT NOT NULL,
      subject VARCHAR(255),
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      reply_to VARCHAR(36),
      priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
      message_type ENUM('personal', 'announcement', 'alert') DEFAULT 'personal',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      read_at TIMESTAMP NULL,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reply_to) REFERENCES messaging(id) ON DELETE SET NULL,
      INDEX idx_messaging_sender (sender_id),
      INDEX idx_messaging_recipient (recipient_id),
      INDEX idx_messaging_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `

  ,expenses: `
    CREATE TABLE IF NOT EXISTS expenses (
      expense_id VARCHAR(36) PRIMARY KEY,
      invoice_number VARCHAR(100) UNIQUE,
      date DATE NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      subcategory VARCHAR(100),
      payment_mode ENUM('cash','online','card','bank_transfer','other') DEFAULT 'online',
      vendor VARCHAR(255),
      receipt_image_url VARCHAR(1000),
      created_by INT,
      raised_by_role VARCHAR(50),
      recurring ENUM('Yes','No') DEFAULT 'No',
      recurring_type VARCHAR(50),
      next_due_date DATE,
      GST DECIMAL(10,2) DEFAULT 0,
      proforma_invoice_number VARCHAR(100),
      status ENUM('pending','approved','rejected') DEFAULT 'pending',
      approved_by INT,
      approval_notes TEXT,
      recurring_remove_reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_expenses_status (status),
      INDEX idx_expenses_category (category),
      INDEX idx_expenses_created (created_at),
      INDEX idx_expenses_invoice (invoice_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `

  ,expense_audit_logs: `
    CREATE TABLE IF NOT EXISTS expense_audit_logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      expense_id VARCHAR(36) NOT NULL,
      action VARCHAR(100) NOT NULL,
      performed_by INT,
      details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (expense_id) REFERENCES expenses(expense_id) ON DELETE CASCADE,
      INDEX idx_audit_expense (expense_id),
      INDEX idx_audit_performed_by (performed_by)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `

  ,expense_notifications: `
    CREATE TABLE IF NOT EXISTS expense_notifications (
      notification_id VARCHAR(36) PRIMARY KEY,
      user_id INT NOT NULL,
      expense_id VARCHAR(36),
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (expense_id) REFERENCES expenses(expense_id) ON DELETE SET NULL,
      INDEX idx_notif_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `

  ,expense_sequences: `
    CREATE TABLE IF NOT EXISTS expense_sequences (
      type VARCHAR(50) PRIMARY KEY,
      last_seq INT DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `
};

/**
 * Check if a table exists in the database
 */
export async function tableExists(tableName) {
  try {
    const [result] = await pool.query(
      `SELECT COUNT(*) as count FROM information_schema.tables 
       WHERE table_schema = DATABASE() AND table_name = ?`,
      [tableName]
    );
    return result[0].count > 0;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

/**
 * Create a missing table
 */
export async function createTable(tableName) {
  if (!REQUIRED_TABLES[tableName]) {
    throw new Error(`No schema defined for table: ${tableName}`);
  }

  try {
    await pool.query(REQUIRED_TABLES[tableName]);
    console.log(`✅ Table '${tableName}' created successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Error creating table '${tableName}':`, error);

    // If creation failed due to FK references (dependent tables not created yet),
    // attempt a simplified table creation without FOREIGN KEY clauses and add
    // FK constraints later. This helps bootstrap the database when tables are
    // created in arbitrary order.
    const simplifiedSql = createSimplifiedDDL(REQUIRED_TABLES[tableName]);
    if (simplifiedSql) {
      try {
        console.log(`Attempting simplified CREATE TABLE for '${tableName}' (no FK)...`);
        await pool.query(simplifiedSql);
        console.log(`✅ Simplified table '${tableName}' created successfully`);
        return true;
      } catch (innerError) {
        console.error(`❌ Simplified CREATE TABLE also failed for '${tableName}':`, innerError);
        throw innerError;
      }
    }

    throw error;
  }
}

/**
 * Create a simplified DDL by removing FOREIGN KEY and CONSTRAINT lines
 * This is a heuristic and intended only for bootstrapping when FK targets
 * may not yet exist. The full DDL should be applied later when dependencies
 * are satisfied.
 */
export function createSimplifiedDDL(fullDDL) {
  try {
    // Remove lines that start with FOREIGN KEY or CONSTRAINT or REFERENCES
    const lines = fullDDL.split('\n');
    const filtered = lines.filter(line => {
      const l = line.trim().toUpperCase();
      if (l.startsWith('FOREIGN KEY') || l.startsWith('CONSTRAINT') || l.includes('REFERENCES')) return false;
      return true;
    });

    // Ensure we still have a CREATE TABLE ... statement
    const simplified = filtered.join('\n');
    if (/CREATE\s+TABLE/i.test(simplified)) return simplified;
    return null;
  } catch (e) {
    console.error('Error generating simplified DDL:', e);
    return null;
  }
}

/**
 * Ensure a table exists, create it if it doesn't
 */
export async function ensureTableExists(tableName) {
  try {
    const exists = await tableExists(tableName);
    if (!exists) {
      console.log(`⚠️  Table '${tableName}' does not exist, creating...`);
      await createTable(tableName);
    }
    return true;
  } catch (error) {
    console.error(`❌ Failed to ensure table '${tableName}' exists:`, error);
    return false;
  }
}

/**
 * Initialize all required tables
 */
export async function initializeAllTables() {
  console.log('🔧 Initializing database tables...');
  
  const results = {};
  for (const tableName of Object.keys(REQUIRED_TABLES)) {
    try {
      results[tableName] = await ensureTableExists(tableName);
    } catch (error) {
      console.error(`❌ Failed to initialize table '${tableName}':`, error);
      results[tableName] = false;
    }
  }
  
  const successful = Object.values(results).filter(Boolean).length;
  const total = Object.keys(REQUIRED_TABLES).length;
  
  console.log(`✅ Database initialization complete: ${successful}/${total} tables ready`);
  // Second pass: try to apply full DDL for any tables that used simplified creation
  console.log('🔁 Running second pass to apply full DDL for tables created without FK constraints...');
  for (const tableName of Object.keys(REQUIRED_TABLES)) {
    try {
      const exists = await tableExists(tableName);
      if (exists) {
        // Try to apply full DDL - this will be a no-op if the table already
        // has the required columns, but it will add FK constraints if possible.
        try {
          await pool.query(REQUIRED_TABLES[tableName]);
          console.log(`🔧 Applied full DDL for table '${tableName}'`);
        } catch (applyErr) {
          // Ignore failures here; they will be logged as warnings
          console.warn(`⚠️ Could not apply full DDL for '${tableName}':`, applyErr.message.split('\n')[0]);
        }
      }
    } catch (e) {
      console.warn(`⚠️ Second-pass check failed for '${tableName}':`, e.message);
    }
  }

  return results;
}

/**
 * Handle database errors with intelligent fallbacks
 */
export function handleDatabaseError(error, tableName = null) {
  const errorInfo = {
    code: error.code,
    errno: error.errno,
    sqlState: error.sqlState,
    message: error.message,
    tableName
  };

  // Handle specific MySQL error codes
  switch (error.code) {
    case 'ER_NO_SUCH_TABLE':
      return {
        status: 503,
        message: `Database table '${tableName}' is not available. Please contact the administrator.`,
        action: 'TABLE_MISSING',
        details: errorInfo
      };
    
    case 'ER_DUP_ENTRY':
      return {
        status: 409,
        message: 'This record already exists.',
        action: 'DUPLICATE_ENTRY',
        details: errorInfo
      };
    
    case 'ER_NO_REFERENCED_ROW_2':
      return {
        status: 400,
        message: 'Referenced record does not exist.',
        action: 'FOREIGN_KEY_CONSTRAINT',
        details: errorInfo
      };
    
    case 'ER_ROW_IS_REFERENCED_2':
      return {
        status: 400,
        message: 'Cannot delete record as it is referenced by other records.',
        action: 'FOREIGN_KEY_CONSTRAINT',
        details: errorInfo
      };
    
    case 'ER_DATA_TOO_LONG':
      return {
        status: 400,
        message: 'Data too long for field.',
        action: 'VALIDATION_ERROR',
        details: errorInfo
      };
    
    case 'ER_BAD_NULL_ERROR':
      return {
        status: 400,
        message: 'Required field cannot be empty.',
        action: 'VALIDATION_ERROR',
        details: errorInfo
      };
    
    case 'ECONNREFUSED':
      return {
        status: 503,
        message: 'Database connection failed. Please try again later.',
        action: 'CONNECTION_ERROR',
        details: errorInfo
      };
    
    default:
      return {
        status: 500,
        message: 'An unexpected database error occurred.',
        action: 'UNKNOWN_ERROR',
        details: errorInfo
      };
  }
}

/**
 * Database operation wrapper with automatic error handling and table creation
 */
export async function safeDbOperation(operation, tableName = null) {
  try {
    // If tableName is provided, ensure it exists first
    if (tableName) {
      await ensureTableExists(tableName);
    }
    
    return await operation();
  } catch (error) {
    const errorResponse = handleDatabaseError(error, tableName);

    // If it's a missing table error, try to create it and retry once
    if (errorResponse.action === 'TABLE_MISSING' && tableName) {
      try {
        console.log(`Attempting to create missing table: ${tableName}`);
        await createTable(tableName);
        return await operation();
      } catch (retryError) {
        console.error(`Failed to create table and retry operation:`, retryError);
        // Wrap and throw API-friendly error
        throw new DatabaseError(errorResponse.message, retryError);
      }
    }

    // Wrap and throw API-friendly error for the global handler
    throw new DatabaseError(errorResponse.message, error);
  }
}