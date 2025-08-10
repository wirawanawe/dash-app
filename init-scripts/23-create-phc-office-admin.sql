-- Create PHC Office Admin table
CREATE TABLE IF NOT EXISTS phc_office_admin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  office_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100),
  postal_code VARCHAR(10),
  contact_person VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_office_name (office_name),
  INDEX idx_is_active (is_active)
);

-- Insert default PHC office admin data
INSERT INTO phc_office_admin (office_name, phone, email, address, city, postal_code, contact_person, is_active) VALUES 
('Kantor Pusat PHC', '+62-21-12345678', 'admin@phc.com', 'Jl. Sudirman No. 123, Jakarta Pusat', 'Jakarta Pusat', '12190', 'Admin PHC', TRUE)
ON DUPLICATE KEY UPDATE 
  phone = VALUES(phone),
  email = VALUES(email),
  address = VALUES(address);
