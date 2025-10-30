-- Alter patients table to accept data from external API
USE phc_dashboard;

-- Add columns for API data to patients table
ALTER TABLE patients ADD COLUMN external_id VARCHAR(100) UNIQUE COMMENT 'ID from external API';
ALTER TABLE patients ADD COLUMN nip VARCHAR(100);
ALTER TABLE patients ADD COLUMN mrn VARCHAR(100);
ALTER TABLE patients ADD COLUMN nik VARCHAR(100);
ALTER TABLE patients ADD COLUMN birth_place VARCHAR(255);
ALTER TABLE patients ADD COLUMN age INT;
ALTER TABLE patients ADD COLUMN rt VARCHAR(10);
ALTER TABLE patients ADD COLUMN rw VARCHAR(10);
ALTER TABLE patients ADD COLUMN kelurahan VARCHAR(100);
ALTER TABLE patients ADD COLUMN kecamatan VARCHAR(100);
ALTER TABLE patients ADD COLUMN kota VARCHAR(100);
ALTER TABLE patients ADD COLUMN provinsi VARCHAR(100);
ALTER TABLE patients ADD COLUMN kode_pos VARCHAR(20);
ALTER TABLE patients ADD COLUMN blood_type VARCHAR(10);
ALTER TABLE patients ADD COLUMN rhesus VARCHAR(10);
ALTER TABLE patients ADD COLUMN marital_status VARCHAR(50);
ALTER TABLE patients ADD COLUMN occupation VARCHAR(100);
ALTER TABLE patients ADD COLUMN education VARCHAR(100);
ALTER TABLE patients ADD COLUMN insurance_number VARCHAR(100);
ALTER TABLE patients ADD COLUMN no_peserta VARCHAR(100);
ALTER TABLE patients ADD COLUMN nama_peserta VARCHAR(255);
ALTER TABLE patients ADD COLUMN jenis_peserta VARCHAR(100);
ALTER TABLE patients ADD COLUMN emergency_phone VARCHAR(50);
ALTER TABLE patients ADD COLUMN emergency_relation VARCHAR(100);
ALTER TABLE patients ADD COLUMN bagian VARCHAR(255);
ALTER TABLE patients ADD COLUMN foto_url VARCHAR(500);
ALTER TABLE patients ADD COLUMN faskes_tingkat_1 VARCHAR(255);
ALTER TABLE patients ADD COLUMN kelas_rawat VARCHAR(50);
ALTER TABLE patients ADD COLUMN external_created_at TIMESTAMP NULL;
ALTER TABLE patients ADD COLUMN external_updated_at TIMESTAMP NULL;
ALTER TABLE patients ADD COLUMN synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Modify existing columns to accept NULL
ALTER TABLE patients MODIFY COLUMN clinic_id INT NULL;

-- Add indexes
CREATE INDEX idx_external_id_patient ON patients(external_id);
CREATE INDEX idx_nik ON patients(nik);
CREATE INDEX idx_nip ON patients(nip);
CREATE INDEX idx_mrn ON patients(mrn);
CREATE INDEX idx_no_peserta ON patients(no_peserta);
CREATE INDEX idx_synced_at_patient ON patients(synced_at);

SELECT '✅ Table patients updated!' as status;

