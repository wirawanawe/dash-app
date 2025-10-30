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

async function finalRoleFix() {
  let connection;
  
  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // Read SQL file
    console.log('\n📖 Reading SQL fix file...');
    const sqlFile = await fs.readFile('scripts/final-role-fix.sql', 'utf8');
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

    // Verify the final fix
    console.log('\n🔍 Verifying the final role mapping...');
    
    // Show users with their final corrected roles
    const [usersWithRoleInfo] = await connection.execute(`
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
      ORDER BY r.level DESC, u.name
    `);

    console.log('\n👥 Users with final corrected roles:');
    usersWithRoleInfo.forEach(user => {
      console.log(`  ${user.id}. ${user.name} (${user.email})`);
      console.log(`     Original role: ${user.original_role}`);
      console.log(`     Mapped role: ${user.role_display_name} (${user.mapped_role_name}) - Level ${user.role_level}`);
      console.log('');
    });

    // Show final role statistics
    const [roleStats] = await connection.execute(`
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

    console.log('\n📊 Final Role Statistics:');
    roleStats.forEach(stat => {
      console.log(`  ${stat.role_name} (${stat.display_name}) - Level ${stat.level}: ${stat.user_count} users`);
    });

    console.log('\n🎉 Final role mapping completed successfully!');

  } catch (error) {
    console.error('❌ Final role mapping failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the final role fix
finalRoleFix().catch(console.error); 