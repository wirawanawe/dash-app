-- Create user_permissions table to store menu access per user
USE phc_dashboard;

CREATE TABLE IF NOT EXISTS user_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  menu_key VARCHAR(50) NOT NULL,
  has_access BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_menu (user_id, menu_key),
  INDEX idx_user_id (user_id),
  INDEX idx_menu_key (menu_key)
);

-- Add description for menu keys:
-- Available menu_key values:
-- 'dashboard' - Dashboard
-- 'visits' - Kunjungan
-- 'examinations' - Pemeriksaan
-- 'chat' - Chat Konsultasi
-- 'patients' - Pasien
-- 'doctors' - Dokter
-- 'clinics' - Klinik
-- 'medicine' - Obat
-- 'mobile' - Mobile App
-- 'users' - Pengguna
-- 'settings' - Settings
-- 'laboratory' - Laboratorium

