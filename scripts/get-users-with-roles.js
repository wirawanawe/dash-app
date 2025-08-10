import mysql from 'mysql2/promise';
import fs from 'fs/promises';

// Database configuration
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "pr1k1t1w",
  database: "phc_dashboard",
  port: 3306
};

async function getUsersWithRoles() {
  let connection;
  
  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // Get users with complete role information
    console.log('\n👥 USERS WITH ROLES:');
    console.log('=' .repeat(60));
    
    const [usersWithRoles] = await connection.execute(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role as original_role,
        r.id as role_id,
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
      LEFT JOIN clinics c ON u.clinic_id = c.id
      ORDER BY r.level DESC, u.name
    `);

    if (usersWithRoles.length === 0) {
      console.log('❌ No users found');
    } else {
      console.log(`✅ Found ${usersWithRoles.length} users with roles:`);
      usersWithRoles.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.name} (${user.email})`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Original Role: ${user.original_role}`);
        console.log(`   Role ID: ${user.role_id}`);
        console.log(`   Role Name: ${user.role_name}`);
        console.log(`   Role Display: ${user.role_display_name}`);
        console.log(`   Role Level: ${user.role_level}`);
        console.log(`   Role Description: ${user.role_description}`);
        console.log(`   Clinic: ${user.clinic_name || 'N/A'}`);
        console.log(`   Active: ${user.is_active ? 'Yes' : 'No'}`);
        console.log(`   Created: ${user.created_at}`);
      });
    }

    // Get role statistics
    console.log('\n📊 ROLE STATISTICS:');
    console.log('=' .repeat(60));
    
    const [roleStats] = await connection.execute(`
      SELECT 
        r.id,
        r.name as role_name,
        r.display_name,
        r.description,
        r.level,
        r.permissions,
        COUNT(u.id) as user_count,
        GROUP_CONCAT(u.name SEPARATOR ', ') as users
      FROM roles r
      LEFT JOIN users u ON r.id = u.role_id
      GROUP BY r.id, r.name, r.display_name, r.description, r.level, r.permissions
      ORDER BY r.level DESC
    `);

    roleStats.forEach(stat => {
      console.log(`\n${stat.role_name} (${stat.display_name}) - Level ${stat.level}`);
      console.log(`   Description: ${stat.description}`);
      console.log(`   Permissions: ${stat.permissions}`);
      console.log(`   Users: ${stat.user_count}`);
      if (stat.users) {
        console.log(`   User List: ${stat.users}`);
      }
    });

    // Get users by clinic
    console.log('\n🏥 USERS BY CLINIC:');
    console.log('=' .repeat(60));
    
    const [usersByClinic] = await connection.execute(`
      SELECT 
        c.name as clinic_name,
        COUNT(u.id) as user_count,
        GROUP_CONCAT(
          CONCAT(u.name, ' (', r.display_name, ')') 
          SEPARATOR ', '
        ) as users_with_roles
      FROM clinics c
      LEFT JOIN users u ON c.id = u.clinic_id
      LEFT JOIN roles r ON u.role_id = r.id
      GROUP BY c.id, c.name
      ORDER BY user_count DESC
    `);

    usersByClinic.forEach(clinic => {
      console.log(`\n${clinic.clinic_name}: ${clinic.user_count} users`);
      if (clinic.users_with_roles) {
        console.log(`   Users: ${clinic.users_with_roles}`);
      }
    });

    // Export data
    const exportData = {
      users_with_roles: usersWithRoles,
      role_statistics: roleStats,
      users_by_clinic: usersByClinic,
      exported_at: new Date().toISOString()
    };

    const filename = `users-with-roles-${new Date().toISOString().split('T')[0]}.json`;
    await fs.writeFile(filename, JSON.stringify(exportData, null, 2));
    console.log(`\n💾 Data saved to ${filename}`);

    return exportData;

  } catch (error) {
    console.error('❌ Error getting users with roles:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the script
getUsersWithRoles().catch(console.error); 