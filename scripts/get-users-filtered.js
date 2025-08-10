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

async function getUsersWithFilters() {
  let connection;
  
  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // 1. Get Superadmin users
    console.log('\n👑 SUPERADMIN USERS:');
    console.log('=' .repeat(50));
    
    const [superadmins] = await connection.execute(`
      SELECT id, name, email, role, is_active, created_at
      FROM users 
      WHERE role = 'SUPERADMIN'
      ORDER BY created_at DESC
    `);

    if (superadmins.length === 0) {
      console.log('❌ No superadmin users found');
    } else {
      console.log(`✅ Found ${superadmins.length} superadmin users:`);
      superadmins.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
      });
    }

    // 2. Get Admin users
    console.log('\n👨‍💼 ADMIN USERS:');
    console.log('=' .repeat(50));
    
    const [admins] = await connection.execute(`
      SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at, c.name as clinic_name
      FROM users u
      LEFT JOIN clinics c ON u.clinic_id = c.id
      WHERE u.role = 'ADMIN'
      ORDER BY u.created_at DESC
    `);

    if (admins.length === 0) {
      console.log('❌ No admin users found');
    } else {
      console.log(`✅ Found ${admins.length} admin users:`);
      admins.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - Clinic: ${user.clinic_name || 'N/A'}`);
      });
    }

    // 3. Get Doctor users
    console.log('\n👨‍⚕️ DOCTOR USERS:');
    console.log('=' .repeat(50));
    
    const [doctors] = await connection.execute(`
      SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at, c.name as clinic_name
      FROM users u
      LEFT JOIN clinics c ON u.clinic_id = c.id
      WHERE u.role = 'DOCTOR'
      ORDER BY u.created_at DESC
    `);

    if (doctors.length === 0) {
      console.log('❌ No doctor users found');
    } else {
      console.log(`✅ Found ${doctors.length} doctor users:`);
      doctors.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - Clinic: ${user.clinic_name || 'N/A'}`);
      });
    }

    // 4. Get Staff users
    console.log('\n👷 STAFF USERS:');
    console.log('=' .repeat(50));
    
    const [staff] = await connection.execute(`
      SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at, c.name as clinic_name
      FROM users u
      LEFT JOIN clinics c ON u.clinic_id = c.id
      WHERE u.role = 'STAFF'
      ORDER BY u.created_at DESC
    `);

    if (staff.length === 0) {
      console.log('❌ No staff users found');
    } else {
      console.log(`✅ Found ${staff.length} staff users:`);
      staff.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - Clinic: ${user.clinic_name || 'N/A'}`);
      });
    }

    // 5. Get Mobile users by gender
    console.log('\n📱 MOBILE USERS BY GENDER:');
    console.log('=' .repeat(50));
    
    const [maleUsers] = await connection.execute(`
      SELECT id, name, email, gender, height, weight, created_at
      FROM mobile_users 
      WHERE gender = 'male'
      ORDER BY created_at DESC
    `);

    const [femaleUsers] = await connection.execute(`
      SELECT id, name, email, gender, height, weight, created_at
      FROM mobile_users 
      WHERE gender = 'female'
      ORDER BY created_at DESC
    `);

    console.log(`Male Users: ${maleUsers.length}`);
    maleUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.height}cm, ${user.weight}kg`);
    });

    console.log(`\nFemale Users: ${femaleUsers.length}`);
    femaleUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.height}cm, ${user.weight}kg`);
    });

    // 6. Get users by clinic
    console.log('\n🏥 USERS BY CLINIC:');
    console.log('=' .repeat(50));
    
    const [usersByClinic] = await connection.execute(`
      SELECT 
        c.name as clinic_name,
        COUNT(u.id) as user_count,
        GROUP_CONCAT(u.name SEPARATOR ', ') as users
      FROM clinics c
      LEFT JOIN users u ON c.id = u.clinic_id
      GROUP BY c.id, c.name
      ORDER BY user_count DESC
    `);

    usersByClinic.forEach((clinic, index) => {
      console.log(`${index + 1}. ${clinic.clinic_name}: ${clinic.user_count} users`);
      if (clinic.users) {
        console.log(`   Users: ${clinic.users}`);
      }
      console.log('');
    });

    // 7. Export filtered data
    const exportData = {
      superadmins,
      admins,
      doctors,
      staff,
      mobile_users: {
        male: maleUsers,
        female: femaleUsers
      },
      users_by_clinic: usersByClinic,
      exported_at: new Date().toISOString()
    };

    const filename = `users-filtered-${new Date().toISOString().split('T')[0]}.json`;
    await fs.writeFile(filename, JSON.stringify(exportData, null, 2));
    console.log(`\n💾 Filtered data saved to ${filename}`);

    return exportData;

  } catch (error) {
    console.error('❌ Error getting filtered users:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the script
getUsersWithFilters().catch(console.error); 