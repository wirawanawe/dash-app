-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSON,
  level INT NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_level (level),
  INDEX idx_is_active (is_active)
);

-- Insert default roles
INSERT INTO roles (name, display_name, description, level, permissions) VALUES
('SUPERADMIN', 'Super Administrator', 'Full system access with all privileges', 4, '["*"]'),
('ADMIN', 'Administrator', 'Administrative access to manage clinics and users', 3, '["users.read", "users.write", "clinics.read", "clinics.write", "doctors.read", "doctors.write", "patients.read", "patients.write", "visits.read", "visits.write"]'),
('DOCTOR', 'Doctor', 'Medical professional access to patient data and examinations', 2, '["patients.read", "patients.write", "visits.read", "visits.write", "examinations.read", "examinations.write", "chat.read", "chat.write"]'),
('STAFF', 'Staff', 'Basic access for clinic staff', 1, '["patients.read", "visits.read", "visits.write"]');

-- Add role_id column to users table
ALTER TABLE users ADD COLUMN role_id INT NULL AFTER role;

-- Add foreign key constraint
ALTER TABLE users ADD CONSTRAINT fk_users_role_id 
FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;

-- Update existing users to use role_id
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = users.role);

-- Make role_id NOT NULL after updating
ALTER TABLE users MODIFY COLUMN role_id INT NOT NULL;

-- Add index for role_id
ALTER TABLE users ADD INDEX idx_role_id (role_id);

-- Create view for users with role information
CREATE OR REPLACE VIEW users_with_roles AS
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  u.role_id,
  r.name as role_name,
  r.display_name as role_display_name,
  r.description as role_description,
  r.level as role_level,
  r.permissions as role_permissions,
  u.clinic_id,
  u.is_active,
  u.created_at,
  u.updated_at,
  c.name as clinic_name
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN clinics c ON u.clinic_id = c.id;

-- Show the results
SELECT 'Roles table created successfully!' as status;
SELECT COUNT(*) as total_roles FROM roles;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as users_with_roles FROM users WHERE role_id IS NOT NULL; 