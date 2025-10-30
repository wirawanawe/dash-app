# User Permissions Migration Scripts

## Overview

Scripts untuk membantu migrasi dan manajemen user permissions.

## Scripts Available

### 1. migrate-default-permissions.cjs

Script untuk set default permissions untuk user existing berdasarkan role mereka.

**Default Permissions by Role:**

- **Superadmin**: Semua menu (12 menu)
  - dashboard, visits, examinations, chat, patients, doctors, clinics, medicine, mobile, users, settings, laboratory

- **Admin**: 10 menu
  - dashboard, visits, patients, doctors, clinics, medicine, mobile, users, settings, laboratory

- **Doctor**: 5 menu
  - dashboard, visits, examinations, chat, laboratory

- **Staff**: 3 menu
  - dashboard, visits, patients

**Usage:**

```bash
# Set environment variables (optional, defaults to localhost)
export DB_HOST=localhost
export DB_USER=root
export DB_PASSWORD=root
export DB_NAME=phc_dashboard

# Run the script
node scripts/migrate-default-permissions.cjs
```

**What it does:**
1. Connects to database
2. Gets all users
3. For each user without permissions:
   - Gets their role
   - Sets default permissions based on role
   - Inserts to user_permissions table
4. Shows summary of migration

**Output Example:**
```
Connecting to database...
Connected to database successfully!

Found 10 users

✅ Set permissions for user John Doe (john@example.com) - Role: ADMIN - 10 menus
✅ Set permissions for user Jane Smith (jane@example.com) - Role: STAFF - 3 menus
⏭️  Skipping user Bob Wilson (bob@example.com) - already has permissions
...

============================================================
Migration completed!
✅ Success: 8 users
⏭️  Skipped: 2 users (already have permissions)
❌ Errors: 0 users
============================================================
```

## Manual Permission Management

Jika Anda ingin set permission secara manual via SQL:

### Set Permission untuk User Tertentu

```sql
-- Get user ID
SELECT id, name, email FROM users WHERE email = 'user@example.com';

-- Set permissions
INSERT INTO user_permissions (user_id, menu_key, has_access) VALUES
(1, 'dashboard', 1),
(1, 'visits', 1),
(1, 'patients', 1);
```

### View User Permissions

```sql
SELECT 
  u.name, 
  u.email, 
  u.role,
  up.menu_key,
  up.has_access
FROM users u
LEFT JOIN user_permissions up ON u.id = up.user_id
WHERE u.id = 1;
```

### Delete All Permissions for a User

```sql
DELETE FROM user_permissions WHERE user_id = 1;
```

### Update Permission

```sql
UPDATE user_permissions 
SET has_access = 0 
WHERE user_id = 1 AND menu_key = 'settings';
```

## Troubleshooting

### Error: Cannot add or update a child row

**Cause:** Foreign key constraint - user_id tidak valid

**Solution:** Pastikan user_id ada di tabel users

```sql
SELECT id FROM users WHERE id = [user_id];
```

### Error: Duplicate entry

**Cause:** Permission sudah ada untuk user dan menu_key tersebut

**Solution:** Update instead of insert, atau delete existing permission first

```sql
-- Check existing
SELECT * FROM user_permissions WHERE user_id = 1 AND menu_key = 'dashboard';

-- Delete if exists
DELETE FROM user_permissions WHERE user_id = 1 AND menu_key = 'dashboard';

-- Then insert new
INSERT INTO user_permissions (user_id, menu_key, has_access) VALUES (1, 'dashboard', 1);
```

## Best Practices

1. **Always backup database before migration**
   ```bash
   mysqldump -u root -p phc_dashboard > backup_before_permission_migration.sql
   ```

2. **Test on staging first**
   - Run migration script on staging environment
   - Test with different user roles
   - Verify sidebar shows correct menus

3. **Communication**
   - Inform users about the change
   - Provide documentation about new permission system
   - Train admins on how to manage permissions

4. **Monitor after deployment**
   - Check error logs
   - Monitor user feedback
   - Be ready to rollback if needed

## Rollback Plan

If something goes wrong:

```sql
-- 1. Drop user_permissions table
DROP TABLE IF EXISTS user_permissions;

-- 2. Restore from backup
mysql -u root -p phc_dashboard < backup_before_permission_migration.sql

-- 3. Revert code changes (git revert or restore from backup)
```

