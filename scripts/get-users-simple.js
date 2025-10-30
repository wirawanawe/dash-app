import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import readline from 'readline';

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "pr1k1t1w",
  database: process.env.DB_NAME || "phc_dashboard",
  port: process.env.DB_PORT || 3306
};

async function getUsers(options = {}) {
  const {
    type = 'all', // 'dashboard', 'mobile', 'all'
    role = null, // filter by role
    active = null, // filter by active status
    limit = 100,
    saveToFile = false
  } = options;

  let connection;
  
  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    const results = {};

    // Get dashboard users
    if (type === 'all' || type === 'dashboard') {
      console.log('\n📊 Getting dashboard users...');
      
      let dashboardQuery = `
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
      `;

      const dashboardParams = [];
      
      // Add filters
      const whereConditions = [];
      if (role) {
        whereConditions.push('u.role = ?');
        dashboardParams.push(role);
      }
      if (active !== null) {
        whereConditions.push('u.is_active = ?');
        dashboardParams.push(active);
      }
      
      if (whereConditions.length > 0) {
        dashboardQuery += ' WHERE ' + whereConditions.join(' AND ');
      }
      
      dashboardQuery += ' ORDER BY u.created_at DESC LIMIT ?';
      dashboardParams.push(limit);

      const dashboardUsers = await connection.execute(dashboardQuery, dashboardParams);
      results.dashboard_users = dashboardUsers[0];
      
      console.log(`✅ Found ${dashboardUsers[0].length} dashboard users`);
    }

    // Get mobile users
    if (type === 'all' || type === 'mobile') {
      console.log('\n📱 Getting mobile users...');
      
      let mobileQuery = `
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
      `;

      const mobileParams = [];
      
      // Add filters
      const whereConditions = [];
      if (active !== null) {
        whereConditions.push('is_active = ?');
        mobileParams.push(active);
      }
      
      if (whereConditions.length > 0) {
        mobileQuery += ' WHERE ' + whereConditions.join(' AND ');
      }
      
      mobileQuery += ' ORDER BY created_at DESC LIMIT ?';
      mobileParams.push(limit);

      const mobileUsers = await connection.execute(mobileQuery, mobileParams);
      results.mobile_users = mobileUsers[0];
      
      console.log(`✅ Found ${mobileUsers[0].length} mobile users`);
    }

    // Get statistics
    console.log('\n📈 Getting statistics...');
    const stats = await connection.execute(`
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
    
    results.statistics = stats[0][0];
    results.exported_at = new Date().toISOString();

    // Display results
    console.log('\n📋 RESULTS SUMMARY:');
    console.log('=' .repeat(40));
    
    if (results.dashboard_users) {
      console.log(`Dashboard Users: ${results.dashboard_users.length}`);
      results.dashboard_users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
      });
    }
    
    if (results.mobile_users) {
      console.log(`\nMobile Users: ${results.mobile_users.length}`);
      results.mobile_users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
      });
    }

    console.log('\n📊 STATISTICS:');
    console.log(`Total Dashboard Users: ${results.statistics.total_dashboard_users}`);
    console.log(`Total Mobile Users: ${results.statistics.total_mobile_users}`);
    console.log(`Active Dashboard Users: ${results.statistics.active_dashboard_users}`);
    console.log(`Active Mobile Users: ${results.statistics.active_mobile_users}`);

    // Save to file if requested
    if (saveToFile) {
      const filename = `users-data-${new Date().toISOString().split('T')[0]}.json`;
      await fs.writeFile(filename, JSON.stringify(results, null, 2));
      console.log(`\n💾 Data saved to ${filename}`);
    }

    return results;

  } catch (error) {
    console.error('❌ Error getting users:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Example usage functions
async function getAllUsers() {
  return await getUsers({ type: 'all' });
}

async function getDashboardUsers() {
  return await getUsers({ type: 'dashboard' });
}

async function getMobileUsers() {
  return await getUsers({ type: 'mobile' });
}

async function getActiveUsers() {
  return await getUsers({ type: 'all', active: true });
}

async function getUsersByRole(role) {
  return await getUsers({ type: 'dashboard', role: role });
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  try {
    let options = { type: 'all' };
    
    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
      switch (args[i]) {
        case '--type':
          options.type = args[++i];
          break;
        case '--role':
          options.role = args[++i];
          break;
        case '--active':
          options.active = args[++i] === 'true';
          break;
        case '--limit':
          options.limit = parseInt(args[++i]);
          break;
        case '--save':
          options.saveToFile = true;
          break;
        case '--help':
          console.log(`
Usage: node get-users-simple.js [options]

Options:
  --type <type>     Type of users to get: 'dashboard', 'mobile', 'all' (default: 'all')
  --role <role>     Filter by role: 'SUPERADMIN', 'ADMIN', 'DOCTOR', 'STAFF'
  --active <bool>   Filter by active status: 'true' or 'false'
  --limit <number>  Limit number of results (default: 100)
  --save           Save results to JSON file
  --help           Show this help message

Examples:
  node get-users-simple.js --type dashboard --role ADMIN
  node get-users-simple.js --type mobile --active true --save
  node get-users-simple.js --type all --limit 50
          `);
          return;
      }
    }
    
    await getUsers(options);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { 
  getUsers, 
  getAllUsers, 
  getDashboardUsers, 
  getMobileUsers, 
  getActiveUsers, 
  getUsersByRole 
}; 