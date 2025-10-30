-- Fix role mapping issues

-- First, let's see the current state
SELECT 'Current role mapping state:' as status;

-- Fix the role mapping correctly
UPDATE users SET role_id = 1 WHERE UPPER(role) = 'STAFF';
UPDATE users SET role_id = 2 WHERE UPPER(role) = 'DOCTOR';
UPDATE users SET role_id = 3 WHERE UPPER(role) = 'ADMIN';
UPDATE users SET role_id = 4 WHERE UPPER(role) = 'SUPERADMIN';

-- Show the corrected mapping
SELECT 
  u.id,
  u.name,
  u.email,
  u.role as old_role,
  r.name as new_role_name,
  r.display_name as role_display_name,
  r.level as role_level
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
ORDER BY r.level DESC, u.name;

-- Show summary
SELECT 'Role mapping corrected!' as status;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as users_with_correct_roles FROM users WHERE role_id IS NOT NULL; 