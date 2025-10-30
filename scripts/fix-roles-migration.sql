-- Fix roles migration with proper collation handling

-- First, let's check the current state
SELECT 'Current state check' as status;

-- Update existing users to use role_id with proper collation handling
UPDATE users u 
JOIN roles r ON UPPER(u.role) = UPPER(r.name)
SET u.role_id = r.id;

-- Make role_id NOT NULL after updating (only if all users have role_id)
UPDATE users SET role_id = 4 WHERE role_id IS NULL AND UPPER(role) = 'SUPERADMIN';
UPDATE users SET role_id = 3 WHERE role_id IS NULL AND UPPER(role) = 'ADMIN';
UPDATE users SET role_id = 2 WHERE role_id IS NULL AND UPPER(role) = 'DOCTOR';
UPDATE users SET role_id = 1 WHERE role_id IS NULL AND UPPER(role) = 'STAFF';

-- Now make role_id NOT NULL
ALTER TABLE users MODIFY COLUMN role_id INT NOT NULL;

-- Show the results
SELECT 'Roles migration fixed successfully!' as status;
SELECT COUNT(*) as total_roles FROM roles;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as users_with_roles FROM users WHERE role_id IS NOT NULL;

-- Show users with their roles
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  u.role_id,
  r.name as role_name,
  r.display_name as role_display_name
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
ORDER BY r.level DESC, u.name; 