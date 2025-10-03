-- 032_emergency_alert_system.sql
-- Add emergency alert system tables and functionality

-- 1. Create emergency_alerts table for tracking emergency situations
CREATE TABLE IF NOT EXISTS emergency_alerts (
    id VARCHAR(36) PRIMARY KEY,
    center_id VARCHAR(36) NOT NULL,
    alert_type ENUM(
        'fire',
        'medical_emergency',
        'severe_weather',
        'lockdown',
        'evacuation',
        'power_outage',
        'gas_leak',
        'intruder',
        'natural_disaster',
        'other'
    ) NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    message TEXT NOT NULL,
    location VARCHAR(200),
    requires_evacuation BOOLEAN DEFAULT FALSE,
    affected_areas JSON COMMENT 'Areas/rooms affected by the emergency',
    instructions TEXT COMMENT 'Emergency response instructions',
    triggered_by VARCHAR(36) NOT NULL,
    triggered_at TIMESTAMP NOT NULL,
    status ENUM('active', 'resolved', 'cancelled') DEFAULT 'active',
    resolved_by VARCHAR(36),
    resolved_at TIMESTAMP NULL,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_emergency_center (center_id),
    INDEX idx_emergency_status (status),
    INDEX idx_emergency_triggered (triggered_at),
    INDEX idx_emergency_severity (severity),
    INDEX idx_emergency_type (alert_type),

    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
    FOREIGN KEY (triggered_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create emergency_contacts table for center-specific emergency contacts
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id VARCHAR(36) PRIMARY KEY,
    center_id VARCHAR(36) NOT NULL,
    contact_type ENUM(
        'fire_department',
        'police',
        'medical',
        'poison_control',
        'gas_company',
        'electric_company',
        'water_department',
        'local_emergency',
        'corporate_security',
        'maintenance',
        'other'
    ) NOT NULL,
    name VARCHAR(200) NOT NULL,
    phone_primary VARCHAR(20) NOT NULL,
    phone_secondary VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    priority_order INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_emergency_contact_center (center_id),
    INDEX idx_emergency_contact_type (contact_type),
    INDEX idx_emergency_contact_priority (priority_order),

    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create emergency_procedures table for center emergency protocols
CREATE TABLE IF NOT EXISTS emergency_procedures (
    id VARCHAR(36) PRIMARY KEY,
    center_id VARCHAR(36) NOT NULL,
    procedure_type ENUM(
        'fire_drill',
        'lockdown',
        'severe_weather',
        'medical_emergency',
        'evacuation',
        'shelter_in_place',
        'power_outage',
        'gas_leak',
        'intruder_alert',
        'general'
    ) NOT NULL,
    title VARCHAR(200) NOT NULL,
    procedure_content TEXT NOT NULL,
    required_frequency ENUM('weekly', 'monthly', 'quarterly', 'semi_annual', 'annual', 'as_needed') DEFAULT 'as_needed',
    last_practiced_date DATE,
    next_practice_date DATE,
    staff_training_required BOOLEAN DEFAULT TRUE,
    parent_notification_required BOOLEAN DEFAULT FALSE,
    version VARCHAR(10) DEFAULT '1.0',
    effective_date DATE NOT NULL,
    approved_by VARCHAR(36),
    approval_date TIMESTAMP,
    status ENUM('draft', 'active', 'archived') DEFAULT 'active',
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_emergency_procedure_center (center_id),
    INDEX idx_emergency_procedure_type (procedure_type),
    INDEX idx_emergency_procedure_status (status),
    INDEX idx_emergency_procedure_next_practice (next_practice_date),

    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create emergency_drill_logs table for tracking emergency drills
CREATE TABLE IF NOT EXISTS emergency_drill_logs (
    id VARCHAR(36) PRIMARY KEY,
    center_id VARCHAR(36) NOT NULL,
    procedure_id VARCHAR(36) NOT NULL,
    drill_type ENUM('scheduled', 'surprise', 'actual_emergency') NOT NULL,
    drill_date DATETIME NOT NULL,
    duration_minutes INT,
    participants_count INT,
    evacuation_time_seconds INT COMMENT 'Time taken for full evacuation',
    issues_identified TEXT,
    improvements_needed TEXT,
    overall_rating ENUM('excellent', 'good', 'satisfactory', 'needs_improvement') DEFAULT 'satisfactory',
    conducted_by VARCHAR(36) NOT NULL,
    witnessed_by VARCHAR(36),
    weather_conditions VARCHAR(100),
    notes TEXT,
    next_drill_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_drill_log_center (center_id),
    INDEX idx_drill_log_procedure (procedure_id),
    INDEX idx_drill_log_date (drill_date),
    INDEX idx_drill_log_conductor (conducted_by),

    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
    FOREIGN KEY (procedure_id) REFERENCES emergency_procedures(id) ON DELETE CASCADE,
    FOREIGN KEY (conducted_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (witnessed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Insert default emergency contacts for all centers
INSERT IGNORE INTO emergency_contacts (id, center_id, contact_type, name, phone_primary, priority_order)
SELECT
    UUID() as id,
    c.id as center_id,
    '911' as contact_type,
    'Emergency Services' as name,
    '911' as phone_primary,
    1 as priority_order
FROM centers c;

-- 6. Insert default emergency contacts for poison control
INSERT IGNORE INTO emergency_contacts (id, center_id, contact_type, name, phone_primary, priority_order)
SELECT
    UUID() as id,
    c.id as center_id,
    'poison_control' as contact_type,
    'Poison Control Center' as name,
    '1-800-222-1222' as phone_primary,
    2 as priority_order
FROM centers c;

-- 7. Insert default emergency procedures for all centers
INSERT IGNORE INTO emergency_procedures (
    id, center_id, procedure_type, title, procedure_content,
    required_frequency, effective_date, created_by, status
)
SELECT
    UUID() as id,
    c.id as center_id,
    'fire_drill' as procedure_type,
    'Fire Evacuation Procedure' as title,
    'Fire Drill Procedure:
1. Sound fire alarm immediately
2. Staff guide children to nearest emergency exit
3. Account for all children at designated assembly point
4. Call 911 if actual fire
5. Remain outside until all-clear given
6. Return to building only when safe

Assembly Point: Parking lot far corner
Evacuation Time Target: Under 3 minutes' as procedure_content,
    'monthly' as required_frequency,
    CURDATE() as effective_date,
    'system' as created_by,
    'active' as status
FROM centers c;

-- 8. Insert lockdown procedure
INSERT IGNORE INTO emergency_procedures (
    id, center_id, procedure_type, title, procedure_content,
    required_frequency, effective_date, created_by, status
)
SELECT
    UUID() as id,
    c.id as center_id,
    'lockdown' as procedure_type,
    'Lockdown Security Procedure' as title,
    'Lockdown Procedure:
1. Lock all exterior doors immediately
2. Move children away from windows and doors
3. Turn off lights and remain quiet
4. Staff check all rooms are secure
5. Call 911 if threat confirmed
6. Wait for all-clear from authorities
7. Account for all children and staff

Safe Areas: Interior classrooms, away from windows
Communication: Text updates to parents when safe' as procedure_content,
    'quarterly' as required_frequency,
    CURDATE() as effective_date,
    'system' as created_by,
    'active' as status
FROM centers c;