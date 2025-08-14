-- Populate clinic-polyclinic relationships and update doctors
-- This script ensures all clinics have services (polyclinics) and doctors are properly assigned

USE phc_dashboard;

-- First, make sure we have polyclinics with proper status column
UPDATE polyclinics SET status = 'Aktif' WHERE status IS NULL;

-- Insert clinic-polyclinic relationships for all clinics
-- Each clinic will have basic services available

-- Jakarta Pusat (clinic_id = 1) - Full service hospital
INSERT IGNORE INTO clinic_polyclinics (clinic_id, polyclinic_id, is_active) VALUES
(1, 1, TRUE), -- Poli Umum
(1, 2, TRUE), -- Poli Gigi  
(1, 3, TRUE), -- Poli Anak
(1, 4, TRUE), -- Poli Kebidanan
(1, 5, TRUE), -- Poli Bedah
(1, 6, TRUE), -- Poli Jantung
(1, 7, TRUE), -- Poli Saraf
(1, 8, TRUE), -- Poli Kulit
(1, 9, TRUE); -- Poli Mata

-- Bandung (clinic_id = 2) - Medium hospital
INSERT IGNORE INTO clinic_polyclinics (clinic_id, polyclinic_id, is_active) VALUES
(2, 1, TRUE), -- Poli Umum
(2, 2, TRUE), -- Poli Gigi
(2, 3, TRUE), -- Poli Anak
(2, 5, TRUE), -- Poli Bedah
(2, 8, TRUE); -- Poli Kulit

-- Surabaya (clinic_id = 3) - Full service hospital  
INSERT IGNORE INTO clinic_polyclinics (clinic_id, polyclinic_id, is_active) VALUES
(3, 1, TRUE), -- Poli Umum
(3, 2, TRUE), -- Poli Gigi
(3, 3, TRUE), -- Poli Anak
(3, 4, TRUE), -- Poli Kebidanan
(3, 5, TRUE), -- Poli Bedah
(3, 6, TRUE), -- Poli Jantung
(3, 7, TRUE), -- Poli Saraf
(3, 9, TRUE); -- Poli Mata

-- Medan (clinic_id = 4) - Basic hospital
INSERT IGNORE INTO clinic_polyclinics (clinic_id, polyclinic_id, is_active) VALUES
(4, 1, TRUE), -- Poli Umum
(4, 2, TRUE), -- Poli Gigi
(4, 3, TRUE), -- Poli Anak
(4, 7, TRUE); -- Poli Saraf

-- Makassar (clinic_id = 5) - Medium hospital
INSERT IGNORE INTO clinic_polyclinics (clinic_id, polyclinic_id, is_active) VALUES
(5, 1, TRUE), -- Poli Umum
(5, 2, TRUE), -- Poli Gigi
(5, 8, TRUE), -- Poli Kulit
(5, 5, TRUE); -- Poli Bedah

-- Update doctors to have polyclinic_id based on their specialization
-- This maps doctors to the appropriate polyclinics

-- Dr. Sarah Johnson - Kardiologi -> Poli Jantung
UPDATE doctors SET polyclinic_id = 6 WHERE name = 'Dr. Sarah Johnson' AND specialist = 'Kardiologi';

-- Dr. Ahmad Rahman - Bedah Umum -> Poli Bedah  
UPDATE doctors SET polyclinic_id = 5 WHERE name = 'Dr. Ahmad Rahman' AND specialist = 'Bedah Umum';

-- Dr. Maria Garcia - Pediatri -> Poli Anak
UPDATE doctors SET polyclinic_id = 3 WHERE name = 'Dr. Maria Garcia' AND specialist = 'Pediatri';

-- Dr. Budi Santoso - Neurologi -> Poli Saraf
UPDATE doctors SET polyclinic_id = 7 WHERE name = 'Dr. Budi Santoso' AND specialist = 'Neurologi';

-- Dr. Lisa Chen - Dermatologi -> Poli Kulit
UPDATE doctors SET polyclinic_id = 8 WHERE name = 'Dr. Lisa Chen' AND specialist = 'Dermatologi';

-- Dr. Rudi Hartono - Ortopedi -> Poli Umum (since we don't have orthopedi poli)
UPDATE doctors SET polyclinic_id = 1 WHERE name = 'Dr. Rudi Hartono' AND specialist = 'Ortopedi';

-- Dr. Siti Aminah - Ginekologi -> Poli Kebidanan
UPDATE doctors SET polyclinic_id = 4 WHERE name = 'Dr. Siti Aminah' AND specialist = 'Ginekologi';

-- Dr. John Smith - Pulmonologi -> Poli Umum
UPDATE doctors SET polyclinic_id = 1 WHERE name = 'Dr. John Smith' AND specialist = 'Pulmonologi';

-- Add some additional doctors for better coverage
INSERT IGNORE INTO doctors (name, specialist, license_number, phone, email, address, clinic_id, polyclinic_id) VALUES
-- Jakarta Pusat additional doctors
('Dr. Andi Prasetyo', 'Dokter Umum', 'SP.U-009', '081234567898', 'andi.prasetyo@phc.com', 'Jakarta Pusat', 1, 1),
('Dr. Nina Sari', 'Dokter Gigi', 'SP.KG-010', '081234567899', 'nina.sari@phc.com', 'Jakarta Pusat', 1, 2),
('Dr. Irfan Hakim', 'Dokter Umum', 'SP.U-011', '081234567900', 'irfan.hakim@phc.com', 'Jakarta Pusat', 1, 1),

-- Bandung additional doctors  
('Dr. Sari Dewi', 'Dokter Umum', 'SP.U-012', '081234567901', 'sari.dewi@phc.com', 'Bandung', 2, 1),
('Dr. Yuni Safitri', 'Dokter Gigi', 'SP.KG-013', '081234567902', 'yuni.safitri@phc.com', 'Bandung', 2, 2),

-- Surabaya additional doctors
('Dr. Bambang Wijaya', 'Dokter Umum', 'SP.U-014', '081234567903', 'bambang.wijaya@phc.com', 'Surabaya', 3, 1),
('Dr. Ratna Sari', 'Dokter Anak', 'SP.A-015', '081234567904', 'ratna.sari@phc.com', 'Surabaya', 3, 3),

-- Medan additional doctors
('Dr. Hendra Gunawan', 'Dokter Umum', 'SP.U-016', '081234567905', 'hendra.gunawan@phc.com', 'Medan', 4, 1),
('Dr. Maya Sari', 'Dokter Gigi', 'SP.KG-017', '081234567906', 'maya.sari@phc.com', 'Medan', 4, 2),

-- Makassar additional doctors
('Dr. Agus Santoso', 'Dokter Umum', 'SP.U-018', '081234567907', 'agus.santoso@phc.com', 'Makassar', 5, 1),
('Dr. Fitri Handayani', 'Dokter Gigi', 'SP.KG-019', '081234567908', 'fitri.handayani@phc.com', 'Makassar', 5, 2);

-- Update all doctors to have a default rating if they don't have one
UPDATE doctors SET rating = 4.5 WHERE rating IS NULL OR rating = 0;

-- Verify the relationships are properly set up
SELECT 'Clinic-Polyclinic relationships created:' as message;
SELECT 
    c.name as clinic_name,
    p.name as polyclinic_name,
    cp.is_active
FROM clinic_polyclinics cp
JOIN clinics c ON cp.clinic_id = c.id  
JOIN polyclinics p ON cp.polyclinic_id = p.id
ORDER BY c.name, p.name;

SELECT 'Doctors with polyclinic assignments:' as message;
SELECT 
    d.name as doctor_name,
    d.specialist,
    c.name as clinic_name,
    p.name as polyclinic_name
FROM doctors d
JOIN clinics c ON d.clinic_id = c.id
LEFT JOIN polyclinics p ON d.polyclinic_id = p.id
ORDER BY c.name, d.name;
