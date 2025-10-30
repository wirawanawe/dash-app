-- Final role mapping fix

-- Clear all role_id first
UPDATE users SET role_id = NULL;

-- Map roles correctly based on the old role field
UPDATE users SET role_id = 4 WHERE role = 'SUPERADMIN';
UPDATE users SET role_id = 3 WHERE role = 'ADMIN';
UPDATE users SET role_id = 2 WHERE role = 'DOCTOR';
UPDATE users SET role_id = 1 WHERE role = 'STAFF';

-- Show the final correct mapping
SELECT 
  u.id,
  u.name,
  u.email,
  u.role as original_role,
  r.name as mapped_role_name,
  r.display_name as role_display_name,
  r.level as role_level
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
ORDER BY r.level DESC, u.name;

-- Show summary
SELECT 'Final role mapping completed!' as status;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as users_with_roles FROM users WHERE role_id IS NOT NULL; 