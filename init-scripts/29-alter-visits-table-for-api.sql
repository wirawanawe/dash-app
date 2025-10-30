-- Alter visits table to accept data from external API
-- This allows direct insertion from API without needing patient_id/doctor_id mapping

USE phc_dashboard;

-- Add columns for API data to visits table (one by one to handle existing columns gracefully)
-- External API identifiers
ALTER TABLE visits ADD COLUMN external_id VARCHAR(100) UNIQUE COMMENT 'ID from external API';
ALTER TABLE visits ADD COLUMN visit_number VARCHAR(100) COMMENT 'No_Kunjungan from API';
ALTER TABLE visits ADD COLUMN unique_id VARCHAR(100) COMMENT 'Unique ID from API';

-- Patient information (from API, no foreign key needed)
ALTER TABLE visits ADD COLUMN patient_nik VARCHAR(100);
ALTER TABLE visits ADD COLUMN patient_name VARCHAR(255);
ALTER TABLE visits ADD COLUMN patient_nip VARCHAR(100);
ALTER TABLE visits ADD COLUMN patient_no_peserta VARCHAR(100);
ALTER TABLE visits ADD COLUMN patient_nama_peserta VARCHAR(255);
ALTER TABLE visits ADD COLUMN patient_gender VARCHAR(50);
ALTER TABLE visits ADD COLUMN patient_birth_date DATE;
ALTER TABLE visits ADD COLUMN patient_department VARCHAR(255);

-- Visit information (additional fields)
ALTER TABLE visits ADD COLUMN complaint TEXT;
ALTER TABLE visits ADD COLUMN assessment TEXT;
ALTER TABLE visits ADD COLUMN clinic VARCHAR(255);
ALTER TABLE visits ADD COLUMN room VARCHAR(255);

-- Doctor information (from API, string instead of foreign key)
ALTER TABLE visits ADD COLUMN doctor_name VARCHAR(255);

-- Facility information
ALTER TABLE visits ADD COLUMN facility_code VARCHAR(100);
ALTER TABLE visits ADD COLUMN facility_name VARCHAR(255);

-- Physical exam data (JSON)
ALTER TABLE visits ADD COLUMN physical_exam JSON;

-- Additional API fields
ALTER TABLE visits ADD COLUMN kode_poli VARCHAR(100);
ALTER TABLE visits ADD COLUMN nama_poli VARCHAR(255);
ALTER TABLE visits ADD COLUMN no_antrian VARCHAR(50);
ALTER TABLE visits ADD COLUMN jenis_kunjungan VARCHAR(100);
ALTER TABLE visits ADD COLUMN cara_bayar VARCHAR(100);

-- External API audit trail
ALTER TABLE visits ADD COLUMN external_created_at TIMESTAMP NULL;
ALTER TABLE visits ADD COLUMN external_updated_at TIMESTAMP NULL;
ALTER TABLE visits ADD COLUMN synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Modify existing columns to accept NULL (for backwards compatibility)
ALTER TABLE visits
  MODIFY COLUMN patient_id INT NULL,
  MODIFY COLUMN doctor_id INT NULL,
  MODIFY COLUMN visit_date DATE NULL;

-- Update status enum to match API statuses
ALTER TABLE visits
  MODIFY COLUMN status VARCHAR(50) DEFAULT 'completed';

-- Add indexes for performance
CREATE INDEX idx_external_id ON visits(external_id);
CREATE INDEX idx_visit_number ON visits(visit_number);
CREATE INDEX idx_patient_nik ON visits(patient_nik);
CREATE INDEX idx_patient_name ON visits(patient_name);
CREATE INDEX idx_doctor_name ON visits(doctor_name);
CREATE INDEX idx_clinic ON visits(clinic);
CREATE INDEX idx_synced_at ON visits(synced_at);

SELECT '✅ Table visits updated to accept API data!' as status;
SELECT 'Next step: Run sync to populate visits table' as info;

