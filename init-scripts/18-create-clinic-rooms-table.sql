-- Create clinic_rooms table for dashboard
CREATE TABLE IF NOT EXISTS clinic_rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_name VARCHAR(100) NOT NULL,
  room_type ENUM('consultation', 'examination', 'treatment', 'emergency', 'surgery') DEFAULT 'consultation',
  room_status ENUM('available', 'occupied', 'maintenance', 'reserved') DEFAULT 'available',
  capacity INT DEFAULT 1,
  floor_number INT DEFAULT 1,
  building VARCHAR(50) DEFAULT 'Main Building',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample clinic rooms
INSERT INTO clinic_rooms (room_name, room_type, room_status, capacity, floor_number, building) VALUES
('Ruang Konsultasi 1', 'consultation', 'available', 1, 1, 'Main Building'),
('Ruang Konsultasi 2', 'consultation', 'available', 1, 1, 'Main Building'),
('Ruang Pemeriksaan 1', 'examination', 'available', 1, 1, 'Main Building'),
('Ruang Pemeriksaan 2', 'examination', 'available', 1, 1, 'Main Building'),
('Ruang Perawatan 1', 'treatment', 'available', 2, 2, 'Main Building'),
('Ruang Perawatan 2', 'treatment', 'available', 2, 2, 'Main Building'),
('Ruang Gawat Darurat', 'emergency', 'available', 3, 1, 'Emergency Wing'),
('Ruang Operasi Minor', 'surgery', 'available', 1, 3, 'Surgery Wing');

-- Add index for better performance
CREATE INDEX idx_clinic_rooms_active ON clinic_rooms(is_active);
CREATE INDEX idx_clinic_rooms_status ON clinic_rooms(room_status);
CREATE INDEX idx_clinic_rooms_type ON clinic_rooms(room_type); 