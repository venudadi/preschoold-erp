import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'neldrac_admin',
  multipleStatements: true
};

const CREATE_TABLE_QUERIES = {
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

  payments: `
    CREATE TABLE IF NOT EXISTS payments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      invoice_id INT NOT NULL,
      parent_id INT NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      payment_method ENUM('cash', 'card', 'bank_transfer', 'online') NOT NULL,
      payment_date DATE NOT NULL,
      transaction_id VARCHAR(255),
      status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_payment_invoice (invoice_id),
      INDEX idx_payment_parent (parent_id),
      INDEX idx_payment_date (payment_date),
      INDEX idx_payment_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  budget_limits: `
    CREATE TABLE IF NOT EXISTS budget_limits (
      id INT PRIMARY KEY AUTO_INCREMENT,
      center_id INT NOT NULL,
      category VARCHAR(100) NOT NULL,
      monthly_limit DECIMAL(12, 2) NOT NULL,
      quarterly_limit DECIMAL(12, 2),
      annual_limit DECIMAL(12, 2),
      requires_approval_above DECIMAL(12, 2),
      created_by INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id),
      INDEX idx_budget_center (center_id),
      INDEX idx_budget_category (category)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  portfolio_media: `
    CREATE TABLE IF NOT EXISTS portfolio_media (
      id INT PRIMARY KEY AUTO_INCREMENT,
      portfolio_id INT NOT NULL,
      media_type ENUM('image', 'video', 'document') NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_size INT,
      caption TEXT,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (portfolio_id) REFERENCES digital_portfolio(id) ON DELETE CASCADE,
      INDEX idx_portfolio_media (portfolio_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  sessions: `
    CREATE TABLE IF NOT EXISTS sessions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      session_token VARCHAR(255) NOT NULL UNIQUE,
      csrf_token VARCHAR(255) NOT NULL,
      ip_address VARCHAR(45),
      user_agent TEXT,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_session_token (session_token),
      INDEX idx_session_user (user_id),
      INDEX idx_session_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  audit_logs: `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT,
      action VARCHAR(255) NOT NULL,
      entity_type VARCHAR(100),
      entity_id INT,
      details JSON,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_audit_user (user_id),
      INDEX idx_audit_entity (entity_type, entity_id),
      INDEX idx_audit_action (action),
      INDEX idx_audit_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  emergency_contacts: `
    CREATE TABLE IF NOT EXISTS emergency_contacts (
      id INT PRIMARY KEY AUTO_INCREMENT,
      child_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      relationship VARCHAR(100),
      phone_number VARCHAR(20) NOT NULL,
      email VARCHAR(255),
      priority INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
      INDEX idx_emergency_child (child_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  permissions: `
    CREATE TABLE IF NOT EXISTS permissions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      module VARCHAR(100),
      action VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_permission_module (module)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  role_permissions: `
    CREATE TABLE IF NOT EXISTS role_permissions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      role_id INT NOT NULL,
      permission_id INT NOT NULL,
      granted BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
      UNIQUE KEY unique_role_permission (role_id, permission_id),
      INDEX idx_role (role_id),
      INDEX idx_permission (permission_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `
};

async function createMissingTables() {
  let connection;

  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database\n');

    console.log('🔧 Creating missing tables...\n');

    for (const [tableName, createQuery] of Object.entries(CREATE_TABLE_QUERIES)) {
      try {
        await connection.query(createQuery);
        console.log(`✅ Created/verified table: ${tableName}`);
      } catch (error) {
        console.error(`❌ Error creating table ${tableName}:`, error.message);
      }
    }

    console.log('\n✅ All missing tables have been created!');

  } catch (error) {
    console.error('❌ Database error:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

console.log('='.repeat(60));
console.log('CREATE MISSING DATABASE TABLES');
console.log('='.repeat(60));
console.log();

createMissingTables()
  .then(() => {
    console.log('\n✅ Table creation complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Table creation failed:', error.message);
    process.exit(1);
  });
