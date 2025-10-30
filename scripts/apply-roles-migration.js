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

async function applyRolesMigration() {
  let connection;
  
  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // Read SQL file
    console.log('\n📖 Reading SQL migration file...');
    const sqlFile = await fs.readFile('scripts/create-roles-table.sql', 'utf8');
    const statements = sqlFile.split(';').filter(stmt => stmt.trim());

    console.log(`✅ Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          console.log(`\n🔧 Executing statement ${i + 1}/${statements.length}...`);
          console.log(`SQL: ${statement.substring(0, 100)}...`);
          
          const [result] = await connection.execute(statement);
          
          if (result.affectedRows !== undefined) {
            console.log(`✅ Affected rows: ${result.affectedRows}`);
          } else if (result.length > 0) {
            console.log(`✅ Result: ${JSON.stringify(result[0])}`);
          } else {
            console.log('✅ Statement executed successfully');
          }
        } catch (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message);
          // Continue with next statement
        }
      }
    }

    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    
    // Check roles table
    const [roles] = await connection.execute('SELECT COUNT(*) as count FROM roles');
    console.log(`✅ Roles table: ${roles[0].count} roles`);

    // Check users with role_id
    const [usersWithRoles] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE role_id IS NOT NULL');
    console.log(`✅ Users with role_id: ${usersWithRoles[0].count} users`);

    // Show roles
    const [allRoles] = await connection.execute('SELECT id, name, display_name, level FROM roles ORDER BY level DESC');
    console.log('\n📋 Available roles:');
    allRoles.forEach(role => {
      console.log(`  ${role.id}. ${role.name} (${role.display_name}) - Level ${role.level}`);
    });

    // Show users with their new roles
    const [usersWithRoleInfo] = await connection.execute(`
      SELECT 
        u.id,
        u.name,
        u.email,
        r.name as role_name,
        r.display_name as role_display_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY r.level DESC, u.name
    `);

    console.log('\n👥 Users with roles:');
    usersWithRoleInfo.forEach(user => {
      console.log(`  ${user.id}. ${user.name} (${user.email}) - ${user.role_display_name}`);
    });

    console.log('\n🎉 Roles migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the migration
applyRolesMigration().catch(console.error); 