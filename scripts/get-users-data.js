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

async function getUsersData() {
  let connection;
  
  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // 1. Get dashboard users
    console.log('\n📊 DASHBOARD USERS:');
    console.log('=' .repeat(50));
    
    const [dashboardUsers] = await connection.execute(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.clinic_id,
        u.is_active,
        u.created_at,
        u.updated_at,
        c.name as clinic_name
      FROM users u
      LEFT JOIN clinics c ON u.clinic_id = c.id
      ORDER BY u.created_at DESC
    `);

    if (dashboardUsers.length === 0) {
      console.log('❌ No dashboard users found');
    } else {
      console.log(`✅ Found ${dashboardUsers.length} dashboard users:`);
      dashboardUsers.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Clinic: ${user.clinic_name || 'N/A'}`);
        console.log(`   Active: ${user.is_active ? 'Yes' : 'No'}`);
        console.log(`   Created: ${user.created_at}`);
        console.log('');
      });
    }

    // 2. Get mobile users
    console.log('\n📱 MOBILE USERS:');
    console.log('=' .repeat(50));
    
    const [mobileUsers] = await connection.execute(`
      SELECT 
        id,
        name,
        email,
        phone,
        date_of_birth,
        gender,
        height,
        weight,
        is_active,
        created_at,
        updated_at
      FROM mobile_users
      ORDER BY created_at DESC
    `);

    if (mobileUsers.length === 0) {
      console.log('❌ No mobile users found');
    } else {
      console.log(`✅ Found ${mobileUsers.length} mobile users:`);
      mobileUsers.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Phone: ${user.phone || 'N/A'}`);
        console.log(`   Gender: ${user.gender || 'N/A'}`);
        console.log(`   Height: ${user.height || 'N/A'} cm`);
        console.log(`   Weight: ${user.weight || 'N/A'} kg`);
        console.log(`   Active: ${user.is_active ? 'Yes' : 'No'}`);
        console.log(`   Created: ${user.created_at}`);
        console.log('');
      });
    }

    // 3. Get statistics
    console.log('\n📈 USER STATISTICS:');
    console.log('=' .repeat(50));
    
    const [stats] = await connection.execute(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_dashboard_users,
        (SELECT COUNT(*) FROM mobile_users) as total_mobile_users,
        (SELECT COUNT(*) FROM users WHERE role = 'SUPERADMIN') as superadmin_count,
        (SELECT COUNT(*) FROM users WHERE role = 'ADMIN') as admin_count,
        (SELECT COUNT(*) FROM users WHERE role = 'DOCTOR') as doctor_count,
        (SELECT COUNT(*) FROM users WHERE role = 'STAFF') as staff_count,
        (SELECT COUNT(*) FROM users WHERE is_active = 1) as active_dashboard_users,
        (SELECT COUNT(*) FROM mobile_users WHERE is_active = 1) as active_mobile_users
    `);

    const statsData = stats[0];
    console.log(`Dashboard Users: ${statsData.total_dashboard_users}`);
    console.log(`Mobile Users: ${statsData.total_mobile_users}`);
    console.log(`Total Users: ${statsData.total_dashboard_users + statsData.total_mobile_users}`);
    console.log('');
    console.log('Dashboard User Roles:');
    console.log(`  Superadmin: ${statsData.superadmin_count}`);
    console.log(`  Admin: ${statsData.admin_count}`);
    console.log(`  Doctor: ${statsData.doctor_count}`);
    console.log(`  Staff: ${statsData.staff_count}`);
    console.log('');
    console.log('Active Users:');
    console.log(`  Dashboard: ${statsData.active_dashboard_users}`);
    console.log(`  Mobile: ${statsData.active_mobile_users}`);

    // 4. Export data to JSON
    const exportData = {
      dashboard_users: dashboardUsers,
      mobile_users: mobileUsers,
      statistics: statsData,
      exported_at: new Date().toISOString()
    };

    // Save to file
    const filename = `users-data-${new Date().toISOString().split('T')[0]}.json`;
    await fs.writeFile(filename, JSON.stringify(exportData, null, 2));
    console.log(`\n💾 Data saved to ${filename}`);

    return exportData;

  } catch (error) {
    console.error('❌ Error getting users data:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the script
getUsersData().catch(console.error); 