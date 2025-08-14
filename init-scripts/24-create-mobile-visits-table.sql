-- Create mobile_visits table for medical history
CREATE TABLE IF NOT EXISTS mobile_visits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  visit_date DATE NOT NULL,
  visit_time TIME NULL,
  visit_type VARCHAR(100) DEFAULT 'Konsultasi Umum',
  clinic_name VARCHAR(255) NOT NULL,
  doctor_name VARCHAR(255) NOT NULL,
  diagnosis TEXT NULL,
  treatment TEXT NULL,
  prescription JSON NULL,
  notes TEXT NULL,
  status ENUM('completed', 'scheduled', 'cancelled') DEFAULT 'completed',
  cost DECIMAL(10,2) DEFAULT 0.00,
  payment_status ENUM('paid', 'pending', 'unpaid') DEFAULT 'paid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_visit_date (visit_date),
  INDEX idx_status (status),
  FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE
);

-- Insert sample data for testing
INSERT INTO mobile_visits (
  user_id, visit_date, visit_time, visit_type, clinic_name, doctor_name, 
  diagnosis, treatment, prescription, notes, status, cost, payment_status
) VALUES 
(1, '2024-03-15', '09:00:00', 'Konsultasi Umum', 'Klinik Sehat Jaya', 'Dr. Sarah Johnson', 
 'Hipertensi ringan', 'Pemantauan tekanan darah dan perubahan gaya hidup', 
 '["Amlodipine 5mg", "Lifestyle modification"]', 
 'Pasien disarankan untuk mengurangi konsumsi garam dan olahraga teratur', 
 'completed', 150000.00, 'paid'),

(1, '2024-02-28', '14:30:00', 'Pemeriksaan Rutin', 'Puskesmas Kota', 'Dr. Ahmad Rahman', 
 'Kolesterol tinggi', 'Diet rendah lemak dan olahraga', 
 '["Simvastatin 20mg", "Omega-3 supplement"]', 
 'Kontrol dalam 3 bulan untuk evaluasi', 
 'completed', 120000.00, 'paid'),

(1, '2024-04-10', '10:15:00', 'Pemeriksaan Gigi', 'Klinik Gigi Sejahtera', 'Dr. Maria Santos', 
 'Karies gigi', 'Penambalan gigi dan pembersihan karang', 
 '["Antibiotik (jika diperlukan)", "Pasta gigi khusus"]', 
 'Kontrol 6 bulan untuk pembersihan rutin', 
 'scheduled', 200000.00, 'pending'),

(1, '2024-01-20', '08:45:00', 'Pemeriksaan Darah', 'Rumah Sakit Umum', 'Dr. Budi Santoso', 
 'Anemia ringan', 'Suplemen zat besi', 
 '["Ferrous sulfate 200mg", "Vitamin C"]', 
 'Kontrol dalam 1 bulan untuk evaluasi Hb', 
 'completed', 180000.00, 'paid');
