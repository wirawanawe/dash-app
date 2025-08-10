-- Migration to add clinic-polyclinic relationships and doctor specializations
-- This creates the necessary tables and relationships for the poli system

USE phc_dashboard;

-- Add polyclinic_id to doctors table for specialization
ALTER TABLE doctors 
ADD COLUMN polyclinic_id INT,
ADD FOREIGN KEY (polyclinic_id) REFERENCES polyclinics(id) ON DELETE SET NULL;

-- Create clinic_polyclinics junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS clinic_polyclinics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id INT NOT NULL,
  polyclinic_id INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  FOREIGN KEY (polyclinic_id) REFERENCES polyclinics(id) ON DELETE CASCADE,
  UNIQUE KEY unique_clinic_polyclinic (clinic_id, polyclinic_id),
  INDEX idx_clinic_id (clinic_id),
  INDEX idx_polyclinic_id (polyclinic_id),
  INDEX idx_is_active (is_active)
);

-- Add status column to polyclinics table if not exists
ALTER TABLE polyclinics 
ADD COLUMN status VARCHAR(20) DEFAULT 'Aktif' AFTER description;

-- Insert some sample polyclinics if they don't exist
INSERT IGNORE INTO polyclinics (name, code, description, status) VALUES
('Poli Umum', 'POLI-UMUM', 'Pelayanan kesehatan umum untuk berbagai keluhan', 'Aktif'),
('Poli Gigi', 'POLI-GIGI', 'Pelayanan kesehatan gigi dan mulut', 'Aktif'),
('Poli Anak', 'POLI-ANAK', 'Pelayanan kesehatan khusus anak-anak', 'Aktif'),
('Poli Kebidanan', 'POLI-KBIDANAN', 'Pelayanan kesehatan ibu hamil dan kandungan', 'Aktif'),
('Poli Bedah', 'POLI-BEDAH', 'Pelayanan kesehatan bedah umum', 'Aktif'),
('Poli Jantung', 'POLI-JANTUNG', 'Pelayanan kesehatan jantung dan pembuluh darah', 'Aktif'),
('Poli Saraf', 'POLI-SARAF', 'Pelayanan kesehatan saraf dan otak', 'Aktif'),
('Poli Kulit', 'POLI-KULIT', 'Pelayanan kesehatan kulit dan kelamin', 'Aktif'),
('Poli Mata', 'POLI-MATA', 'Pelayanan kesehatan mata', 'Aktif'),
('Poli THT', 'POLI-THT', 'Pelayanan kesehatan telinga, hidung, dan tenggorokan', 'Aktif'),
('Poli Ortopedi', 'POLI-ORTOPEDI', 'Pelayanan kesehatan tulang dan sendi', 'Aktif'),
('Poli Psikiatri', 'POLI-PSIKIATRI', 'Pelayanan kesehatan jiwa', 'Aktif');

-- Create indexes for better performance
CREATE INDEX idx_doctors_polyclinic ON doctors(polyclinic_id);
CREATE INDEX idx_doctors_clinic_polyclinic ON doctors(clinic_id, polyclinic_id); 