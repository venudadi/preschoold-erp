-- Migration: Create Daily Activity Tracking Tables
-- Food, Sleep, and Potty tracking for children

-- Daily Food Tracking Table
CREATE TABLE IF NOT EXISTS daily_food_tracking (
  id INT PRIMARY KEY AUTO_INCREMENT,
  child_id INT NOT NULL,
  date DATE NOT NULL,
  meal_type VARCHAR(50) CHECK (role IN ('breakfast', 'lunch', 'snack')) NOT NULL COMMENT 'breakfast=Morning Snack, lunch=Lunch, snack=Evening Snack',
  food_consumed INT NOT NULL COMMENT 'Percentage of food consumed (0-100)',
  notes TEXT,
  recorded_by INT NOT NULL COMMENT 'Teacher ID who recorded this entry',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_child_date (child_id, date),
  INDEX idx_date (date)
)   ;

-- Daily Sleep Tracking Table
CREATE TABLE IF NOT EXISTS daily_sleep_tracking (
  id INT PRIMARY KEY AUTO_INCREMENT,
  child_id INT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL COMMENT 'Sleep start time',
  end_time TIME NOT NULL COMMENT 'Sleep end time',
  duration_hours DECIMAL(4,2) COMMENT 'Total sleep duration in hours',
  notes TEXT,
  recorded_by INT NOT NULL COMMENT 'Teacher ID who recorded this entry',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_child_date (child_id, date),
  INDEX idx_date (date)
)   ;

-- Daily Potty Tracking Table
CREATE TABLE IF NOT EXISTS daily_potty_tracking (
  id INT PRIMARY KEY AUTO_INCREMENT,
  child_id INT NOT NULL,
  date DATE NOT NULL,
  type VARCHAR(50) CHECK (role IN ('bathroom', 'diaper_change')) NOT NULL,
  diaper_status VARCHAR(50) CHECK (role IN ('wet', 'dry', 'soiled')) COMMENT 'Status for diaper changes',
  notes TEXT,
  recorded_by INT NOT NULL COMMENT 'Teacher ID who recorded this entry',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_child_date (child_id, date),
  INDEX idx_date (date),
  INDEX idx_type (type)
)   ;
