-- Create tables for caching external API data
-- This enables faster loading and reduces API calls

USE phc_dashboard;

-- ========================================
-- VISITS CACHE TABLE
-- ========================================
-- Table to cache visits data from external API
CREATE TABLE IF NOT EXISTS visits_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  external_id VARCHAR(50) NOT NULL COMMENT 'ID from external API',
  visit_number VARCHAR(50) COMMENT 'No_Kunjungan from external API',
  unique_id VARCHAR(50) COMMENT 'Unique ID from external API',
  
  -- Patient Information
  patient_nik VARCHAR(50),
  patient_name VARCHAR(255),
  patient_nip VARCHAR(50),
  patient_no_peserta VARCHAR(50),
  patient_nama_peserta VARCHAR(255),
  patient_gender VARCHAR(20),
  patient_birth_date DATE,
  patient_department VARCHAR(100),
  
  -- Visit Information
  diagnosis TEXT,
  complaint TEXT,
  treatment TEXT,
  notes TEXT,
  assessment TEXT,
  status VARCHAR(50) DEFAULT 'Selesai',
  clinic VARCHAR(255),
  room VARCHAR(255),
  visit_date DATE,
  
  -- Doctor Information
  doctor_name VARCHAR(255),
  
  -- Facility Information
  facility_code VARCHAR(50),
  facility_name VARCHAR(255),
  
  -- Physical Exam Data (stored as JSON for flexibility)
  physical_exam JSON,
  
  -- Audit Trail
  external_created_at TIMESTAMP NULL,
  external_updated_at TIMESTAMP NULL,
  
  -- Local timestamps
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  UNIQUE KEY unique_external_id (external_id),
  INDEX idx_visit_number (visit_number),
  INDEX idx_patient_nik (patient_nik),
  INDEX idx_patient_name (patient_name),
  INDEX idx_visit_date (visit_date),
  INDEX idx_doctor_name (doctor_name),
  INDEX idx_clinic (clinic),
  INDEX idx_status (status),
  INDEX idx_synced_at (synced_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- PATIENTS CACHE TABLE
-- ========================================
-- Table to cache patients data from external API
CREATE TABLE IF NOT EXISTS patients_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  external_id VARCHAR(50) NOT NULL COMMENT 'ID from external API',
  
  -- Basic Information
  mrn VARCHAR(50),
  nik VARCHAR(50),
  name VARCHAR(255),
  nip VARCHAR(50),
  birth_date DATE,
  gender VARCHAR(20),
  
  -- Contact Information
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(100),
  
  -- Medical Information
  blood_type VARCHAR(10),
  religion VARCHAR(50),
  marital_status VARCHAR(50),
  occupation VARCHAR(100),
  insurance VARCHAR(100),
  emergency_contact VARCHAR(255),
  
  -- Additional Information
  status VARCHAR(50),
  clinic_id INT,
  
  -- Audit Trail
  external_created_at TIMESTAMP NULL,
  external_updated_at TIMESTAMP NULL,
  
  -- Local timestamps
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  UNIQUE KEY unique_external_id (external_id),
  INDEX idx_mrn (mrn),
  INDEX idx_nik (nik),
  INDEX idx_name (name),
  INDEX idx_nip (nip),
  INDEX idx_status (status),
  INDEX idx_clinic_id (clinic_id),
  INDEX idx_synced_at (synced_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- SYNC LOG TABLE
-- ========================================
-- Table to track sync operations
CREATE TABLE IF NOT EXISTS sync_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('visits', 'patients', 'doctors', 'clinics', 'all') NOT NULL,
  status ENUM('started', 'in_progress', 'completed', 'failed') NOT NULL DEFAULT 'started',
  records_fetched INT DEFAULT 0,
  records_updated INT DEFAULT 0,
  records_inserted INT DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  duration_seconds INT,
  
  INDEX idx_entity_type (entity_type),
  INDEX idx_status (status),
  INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- SYNC SCHEDULE TABLE
-- ========================================
-- Table to configure automatic sync schedules
CREATE TABLE IF NOT EXISTS sync_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('visits', 'patients', 'doctors', 'clinics', 'all') NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  interval_minutes INT DEFAULT 60 COMMENT 'Sync interval in minutes',
  last_sync_at TIMESTAMP NULL,
  next_sync_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_entity_type (entity_type),
  INDEX idx_next_sync (next_sync_at, is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default sync schedules
INSERT INTO sync_schedules (entity_type, is_enabled, interval_minutes) VALUES
  ('visits', TRUE, 30),      -- Sync visits every 30 minutes
  ('patients', TRUE, 60),    -- Sync patients every hour
  ('doctors', TRUE, 120),    -- Sync doctors every 2 hours
  ('clinics', TRUE, 120),    -- Sync clinics every 2 hours
  ('all', FALSE, 240)        -- Full sync every 4 hours (disabled by default)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

