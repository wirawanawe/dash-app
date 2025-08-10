import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "pr1k1t1w",
  database: "phc_dashboard",
  port: 3306
};

async function checkAndFixRoles() {
  let connection;
  
  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // First, let's see what we have
    console.log('\n📋 Current roles table:');
    const [roles] = await connection.execute('SELECT * FROM roles ORDER BY level DESC');
    roles.forEach(role => {
      console.log(`  ID: ${role.id}, Name: ${role.name}, Display: ${role.display_name}, Level: ${role.level}`);
    });

    console.log('\n👥 Current users with their roles:');
    const [users] = await connection.execute('SELECT id, name, email, role, role_id FROM users ORDER BY id');
    users.forEach(user => {
      console.log(`  ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}, Role_ID: ${user.role_id}`);
    });

    // Now let's fix the mapping correctly
    console.log('\n🔧 Fixing role mapping...');
    
    // Clear all role_id
    await connection.execute('UPDATE users SET role_id = NULL');
    console.log('✅ Cleared all role_id');

    // Map correctly
    const mappings = [
      { role: 'SUPERADMIN', role_id: 1 },
      { role: 'ADMIN', role_id: 2 },
      { role: 'DOCTOR', role_id: 3 },
      { role: 'STAFF', role_id: 4 }
    ];

    for (const mapping of mappings) {
      const [result] = await connection.execute(
        'UPDATE users SET role_id = ? WHERE role = ?',
        [mapping.role_id, mapping.role]
      );
      console.log(`✅ Mapped ${mapping.role} to role_id ${mapping.role_id}: ${result.affectedRows} users`);
    }

    // Show the final result
    console.log('\n👥 Final users with roles:');
    const [finalUsers] = await connection.execute(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role as original_role,
        r.name as role_name,
        r.display_name as role_display_name,
        r.level as role_level
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY r.level DESC, u.name
    `);

    finalUsers.forEach(user => {
      console.log(`  ${user.id}. ${user.name} (${user.email})`);
      console.log(`     Original: ${user.original_role} -> Mapped: ${user.role_display_name} (${user.role_name}) - Level ${user.role_level}`);
      console.log('');
    });

    // Show statistics
    console.log('\n📊 Final Statistics:');
    const [stats] = await connection.execute(`
      SELECT 
        r.name as role_name,
        r.display_name,
        r.level,
        COUNT(u.id) as user_count
      FROM roles r
      LEFT JOIN users u ON r.id = u.role_id
      GROUP BY r.id, r.name, r.display_name, r.level
      ORDER BY r.level DESC
    `);

    stats.forEach(stat => {
      console.log(`  ${stat.role_name} (${stat.display_name}) - Level ${stat.level}: ${stat.user_count} users`);
    });

    console.log('\n🎉 Role mapping completed successfully!');

  } catch (error) {
    console.error('❌ Role mapping failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the check and fix
checkAndFixRoles().catch(console.error); 