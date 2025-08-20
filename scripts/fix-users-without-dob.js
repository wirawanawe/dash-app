import { query } from '../lib/db.js';

async function fixUsersWithoutDOB() {
  try {
    console.log('🔧 Fixing users without date_of_birth...');
    
    // 1. Find users without date_of_birth
    const usersWithoutDOB = await query(`
      SELECT id, name, email, date_of_birth 
      FROM mobile_users 
      WHERE date_of_birth IS NULL
    `);
    
    if (usersWithoutDOB.length === 0) {
      console.log('✅ All users already have date_of_birth');
      return;
    }
    
    console.log(`📊 Found ${usersWithoutDOB.length} users without date_of_birth:`);
    usersWithoutDOB.forEach(user => {
      console.log(`   - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
    });
    
    // 2. Update users with a default date_of_birth (1990-01-01)
    console.log('\n🔧 Updating users with default date_of_birth...');
    
    for (const user of usersWithoutDOB) {
      try {
        await query(`
          UPDATE mobile_users 
          SET date_of_birth = '1990-01-01' 
          WHERE id = ?
        `, [user.id]);
        
        console.log(`✅ Updated user ID ${user.id} (${user.name}) with default date_of_birth`);
      } catch (error) {
        console.error(`❌ Failed to update user ID ${user.id}:`, error.message);
      }
    }
    
    // 3. Verify the fix
    console.log('\n🔍 Verifying the fix...');
    const remainingUsersWithoutDOB = await query(`
      SELECT id, name, email 
      FROM mobile_users 
      WHERE date_of_birth IS NULL
    `);
    
    if (remainingUsersWithoutDOB.length === 0) {
      console.log('✅ All users now have date_of_birth');
    } else {
      console.log(`❌ ${remainingUsersWithoutDOB.length} users still don't have date_of_birth:`);
      remainingUsersWithoutDOB.forEach(user => {
        console.log(`   - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
      });
    }
    
    // 4. Show summary
    console.log('\n📊 Summary:');
    const totalUsers = await query('SELECT COUNT(*) as total FROM mobile_users');
    const usersWithDOB = await query('SELECT COUNT(*) as count FROM mobile_users WHERE date_of_birth IS NOT NULL');
    
    console.log(`   Total users: ${totalUsers[0].total}`);
    console.log(`   Users with date_of_birth: ${usersWithDOB[0].count}`);
    console.log(`   Users without date_of_birth: ${totalUsers[0].total - usersWithDOB[0].count}`);
    
  } catch (error) {
    console.error('❌ Error fixing users without date_of_birth:', error);
  } finally {
    process.exit(0);
  }
}

fixUsersWithoutDOB();
