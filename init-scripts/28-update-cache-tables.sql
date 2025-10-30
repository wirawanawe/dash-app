-- Update cache tables untuk memastikan kompatibilitas penuh dengan API eksternal
-- Run this after 27-create-api-cache-tables.sql

USE phc_dashboard;

-- Drop existing tables jika perlu start fresh
-- DROP TABLE IF EXISTS visits_cache;
-- DROP TABLE IF EXISTS patients_cache;

-- ========================================
-- VISITS CACHE TABLE (Updated)
-- ========================================
CREATE TABLE IF NOT EXISTS visits_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- External IDs
  external_id VARCHAR(100) NOT NULL COMMENT 'ID from external API',
  visit_number VARCHAR(100) COMMENT 'No_Kunjungan from external API',
  unique_id VARCHAR(100) COMMENT 'Unique ID from external API',
  
  -- Patient Information
  patient_nik VARCHAR(100),
  patient_name VARCHAR(255),
  patient_nip VARCHAR(100),
  patient_no_peserta VARCHAR(100),
  patient_nama_peserta VARCHAR(255),
  patient_gender VARCHAR(50),
  patient_birth_date DATE,
  patient_department VARCHAR(255),
  
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
  visit_time TIME,
  
  -- Doctor Information
  doctor_name VARCHAR(255),
  doctor_id VARCHAR(100),
  
  -- Facility Information
  facility_code VARCHAR(100),
  facility_name VARCHAR(255),
  
  -- Physical Exam Data (stored as JSON for flexibility)
  physical_exam JSON,
  
  -- Additional fields dari API
  kode_poli VARCHAR(100),
  nama_poli VARCHAR(255),
  no_antrian VARCHAR(50),
  jenis_kunjungan VARCHAR(100),
  cara_bayar VARCHAR(100),
  
  -- Audit Trail dari external API
  external_created_at TIMESTAMP NULL,
  external_updated_at TIMESTAMP NULL,
  
  -- Local timestamps
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  UNIQUE KEY unique_external_id (external_id),
  INDEX idx_visit_number (visit_number),
  INDEX idx_unique_id (unique_id),
  INDEX idx_patient_nik (patient_nik),
  INDEX idx_patient_nip (patient_nip),
  INDEX idx_patient_name (patient_name),
  INDEX idx_visit_date (visit_date),
  INDEX idx_doctor_name (doctor_name),
  INDEX idx_clinic (clinic),
  INDEX idx_status (status),
  INDEX idx_synced_at (synced_at),
  INDEX idx_external_created (external_created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- PATIENTS CACHE TABLE (Updated)
-- ========================================
CREATE TABLE IF NOT EXISTS patients_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- External ID
  external_id VARCHAR(100) NOT NULL COMMENT 'ID from external API',
  
  -- Basic Information
  mrn VARCHAR(100),
  nik VARCHAR(100),
  nip VARCHAR(100),
  name VARCHAR(255),
  birth_date DATE,
  birth_place VARCHAR(255),
  gender VARCHAR(50),
  age INT,
  
  -- Contact Information
  address TEXT,
  rt VARCHAR(10),
  rw VARCHAR(10),
  kelurahan VARCHAR(100),
  kecamatan VARCHAR(100),
  kota VARCHAR(100),
  provinsi VARCHAR(100),
  kode_pos VARCHAR(20),
  phone VARCHAR(50),
  email VARCHAR(100),
  
  -- Medical Information
  blood_type VARCHAR(10),
  rhesus VARCHAR(10),
  religion VARCHAR(50),
  marital_status VARCHAR(50),
  occupation VARCHAR(100),
  education VARCHAR(100),
  
  -- Insurance Information
  insurance VARCHAR(100),
  insurance_number VARCHAR(100),
  no_peserta VARCHAR(100),
  nama_peserta VARCHAR(255),
  jenis_peserta VARCHAR(100),
  
  -- Emergency Contact
  emergency_contact VARCHAR(255),
  emergency_phone VARCHAR(50),
  emergency_relation VARCHAR(100),
  
  -- Additional Information
  status VARCHAR(50),
  clinic_id INT,
  bagian VARCHAR(255),
  foto_url VARCHAR(500),
  
  -- BPJS/Asuransi specific
  faskes_tingkat_1 VARCHAR(255),
  kelas_rawat VARCHAR(50),
  
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
  INDEX idx_nip (nip),
  INDEX idx_name (name),
  INDEX idx_no_peserta (no_peserta),
  INDEX idx_status (status),
  INDEX idx_clinic_id (clinic_id),
  INDEX idx_synced_at (synced_at),
  INDEX idx_birth_date (birth_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Update existing sync_schedules if needed
-- ========================================
-- Set more reasonable intervals
UPDATE sync_schedules SET 
  interval_minutes = 30,
  is_enabled = TRUE
WHERE entity_type = 'visits';

UPDATE sync_schedules SET 
  interval_minutes = 60,
  is_enabled = TRUE
WHERE entity_type = 'patients';

-- ========================================
-- Add helpful views for reporting
-- ========================================

-- View untuk visits dengan info lengkap
CREATE OR REPLACE VIEW v_visits_summary AS
SELECT 
  v.id,
  v.external_id,
  v.visit_number,
  v.visit_date,
  v.patient_nik,
  v.patient_name,
  v.patient_nip,
  v.diagnosis,
  v.clinic,
  v.doctor_name,
  v.facility_name,
  v.status,
  v.synced_at,
  DATE(v.visit_date) as visit_date_only,
  YEAR(v.visit_date) as visit_year,
  MONTH(v.visit_date) as visit_month,
  DAY(v.visit_date) as visit_day
FROM visits_cache v
ORDER BY v.visit_date DESC, v.id DESC;

-- View untuk statistics visits
CREATE OR REPLACE VIEW v_visits_stats AS
SELECT 
  DATE(visit_date) as date,
  COUNT(*) as total_visits,
  COUNT(DISTINCT patient_nik) as unique_patients,
  COUNT(DISTINCT doctor_name) as unique_doctors,
  COUNT(DISTINCT clinic) as unique_clinics
FROM visits_cache
WHERE visit_date IS NOT NULL
GROUP BY DATE(visit_date)
ORDER BY date DESC;

-- View untuk patients dengan info lengkap
CREATE OR REPLACE VIEW v_patients_summary AS
SELECT 
  p.id,
  p.external_id,
  p.nik,
  p.nip,
  p.mrn,
  p.name,
  p.birth_date,
  p.gender,
  p.phone,
  p.address,
  p.kota,
  p.insurance,
  p.no_peserta,
  p.status,
  p.synced_at,
  TIMESTAMPDIFF(YEAR, p.birth_date, CURDATE()) as age_calculated
FROM patients_cache p
ORDER BY p.synced_at DESC;

-- ========================================
-- Cleanup old/invalid data (optional)
-- ========================================

-- Remove visits with invalid dates (optional)
-- DELETE FROM visits_cache WHERE visit_date IS NULL OR visit_date < '1900-01-01' OR visit_date > CURDATE() + INTERVAL 1 YEAR;

-- Remove duplicate visits based on external_id (keep newest)
-- DELETE v1 FROM visits_cache v1
-- INNER JOIN visits_cache v2 
-- WHERE v1.external_id = v2.external_id 
-- AND v1.synced_at < v2.synced_at;

-- ========================================
-- Add stored procedures for common operations
-- ========================================

DELIMITER $$

-- Procedure untuk mendapatkan visits by patient NIK
CREATE PROCEDURE IF NOT EXISTS sp_get_visits_by_nik(IN p_nik VARCHAR(100))
BEGIN
  SELECT 
    v.*,
    DATE_FORMAT(v.visit_date, '%d-%m-%Y') as visit_date_formatted,
    DATE_FORMAT(v.synced_at, '%d-%m-%Y %H:%i:%s') as synced_at_formatted
  FROM visits_cache v
  WHERE v.patient_nik = p_nik
  ORDER BY v.visit_date DESC, v.id DESC;
END$$

-- Procedure untuk mendapatkan statistics
CREATE PROCEDURE IF NOT EXISTS sp_get_sync_statistics()
BEGIN
  SELECT 
    'visits' as entity,
    COUNT(*) as total_records,
    MIN(visit_date) as oldest_date,
    MAX(visit_date) as newest_date,
    MAX(synced_at) as last_synced,
    COUNT(DISTINCT patient_nik) as unique_patients
  FROM visits_cache
  UNION ALL
  SELECT 
    'patients' as entity,
    COUNT(*) as total_records,
    NULL as oldest_date,
    NULL as newest_date,
    MAX(synced_at) as last_synced,
    COUNT(*) as unique_patients
  FROM patients_cache;
END$$

-- Procedure untuk cleanup old sync logs
CREATE PROCEDURE IF NOT EXISTS sp_cleanup_old_logs(IN days_to_keep INT)
BEGIN
  DELETE FROM sync_logs 
  WHERE started_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY)
  AND status IN ('completed', 'failed');
  
  SELECT CONCAT('Cleaned up logs older than ', days_to_keep, ' days') as message;
END$$

DELIMITER ;

-- ========================================
-- Grant permissions (adjust as needed)
-- ========================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON phc_dashboard.visits_cache TO 'your_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON phc_dashboard.patients_cache TO 'your_user'@'localhost';
-- GRANT EXECUTE ON PROCEDURE phc_dashboard.sp_get_visits_by_nik TO 'your_user'@'localhost';

-- ========================================
-- Display summary
-- ========================================

SELECT '✅ Cache tables updated successfully!' as status;

SELECT 
  TABLE_NAME,
  TABLE_ROWS,
  ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'phc_dashboard'
  AND TABLE_NAME IN ('visits_cache', 'patients_cache', 'sync_logs', 'sync_schedules')
ORDER BY TABLE_NAME;

SELECT 'Next steps:' as info, '1. Run initial sync: node scripts/auto-sync-data.js all' as action
UNION ALL
SELECT 'Next steps:' as info, '2. Check data: SELECT COUNT(*) FROM visits_cache;' as action
UNION ALL
SELECT 'Next steps:' as info, '3. Test API: curl http://localhost:3000/api/visits' as action;

