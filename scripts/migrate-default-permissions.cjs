/**
 * Script to set default permissions for existing users
 * Run this after creating the user_permissions table
 * 
 * Usage: node scripts/migrate-default-permissions.js
 */

const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'phc_dashboard',
};

// Default permissions based on old role system
const defaultPermissions = {
  superadmin: [
    'dashboard',
    'visits',
    'examinations',
    'chat',
    'patients',
    'doctors',
    'clinics',
    'medicine',
    'mobile',
    'users',
    'settings',
    'laboratory'
  ],
  admin: [
    'dashboard',
    'visits',
    'patients',
    'doctors',
    'clinics',
    'medicine',
    'mobile',
    'users',
    'settings',
    'laboratory'
  ],
  doctor: [
    'dashboard',
    'visits',
    'examinations',
    'chat',
    'laboratory'
  ],
  staff: [
    'dashboard',
    'visits',
    'patients'
  ]
};

async function migratePermissions() {
  let connection;

  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database successfully!\n');

    // Get all users
    const [users] = await connection.execute(
      'SELECT id, name, email, role FROM users'
    );

    console.log(`Found ${users.length} users\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        // Check if user already has permissions
        const [existingPerms] = await connection.execute(
          'SELECT COUNT(*) as count FROM user_permissions WHERE user_id = ?',
          [user.id]
        );

        if (existingPerms[0].count > 0) {
          console.log(`⏭️  Skipping user ${user.name} (${user.email}) - already has permissions`);
          skipCount++;
          continue;
        }

        // Get default permissions for user role
        const role = user.role?.toLowerCase();
        const permissions = defaultPermissions[role] || defaultPermissions['staff'];

        // Insert permissions
        for (const menuKey of permissions) {
          await connection.execute(
            'INSERT INTO user_permissions (user_id, menu_key, has_access) VALUES (?, ?, ?)',
            [user.id, menuKey, 1]
          );
        }

        console.log(`✅ Set permissions for user ${user.name} (${user.email}) - Role: ${role?.toUpperCase()} - ${permissions.length} menus`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error setting permissions for user ${user.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Migration completed!');
    console.log(`✅ Success: ${successCount} users`);
    console.log(`⏭️  Skipped: ${skipCount} users (already have permissions)`);
    console.log(`❌ Errors: ${errorCount} users`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed.');
    }
  }
}

// Run migration
migratePermissions();

