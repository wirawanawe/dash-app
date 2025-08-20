import { query } from '../lib/db.js';

async function fixIncompleteWellnessData() {
  try {
    console.log('🔧 Fixing incomplete wellness data...');
    
    // 1. Find users with incomplete wellness data
    const usersIncomplete = await query(`
      SELECT 
        id, name, email, 
        wellness_program_joined,
        activity_level,
        fitness_goal,
        date_of_birth,
        gender
      FROM mobile_users 
      WHERE wellness_program_joined = FALSE 
         OR activity_level IS NULL 
         OR fitness_goal IS NULL
    `);
    
    if (usersIncomplete.length === 0) {
      console.log('✅ All users have complete wellness data');
      return;
    }
    
    console.log(`📊 Found ${usersIncomplete.length} users with incomplete wellness data:`);
    usersIncomplete.forEach(user => {
      console.log(`   - ID: ${user.id}, Name: ${user.name}`);
      console.log(`     Wellness joined: ${user.wellness_program_joined}`);
      console.log(`     Activity level: ${user.activity_level || 'NULL'}`);
      console.log(`     Fitness goal: ${user.fitness_goal || 'NULL'}`);
      console.log(`     Date of birth: ${user.date_of_birth || 'NULL'}`);
      console.log(`     Gender: ${user.gender || 'NULL'}`);
      console.log('');
    });
    
    // 2. Update users with default values
    console.log('\n🔧 Updating users with default wellness data...');
    
    for (const user of usersIncomplete) {
      try {
        const updateFields = [];
        const updateValues = [];
        
        // Set default activity_level if missing
        if (!user.activity_level) {
          updateFields.push('activity_level = ?');
          updateValues.push('moderately_active');
        }
        
        // Set default fitness_goal if missing
        if (!user.fitness_goal) {
          updateFields.push('fitness_goal = ?');
          updateValues.push('weight_loss');
        }
        
        // Set wellness_program_joined to false if not set
        if (user.wellness_program_joined === null) {
          updateFields.push('wellness_program_joined = ?');
          updateValues.push(false);
        }
        
        if (updateFields.length > 0) {
          updateValues.push(user.id);
          await query(`
            UPDATE mobile_users 
            SET ${updateFields.join(', ')} 
            WHERE id = ?
          `, updateValues);
          
          console.log(`✅ Updated user ID ${user.id} (${user.name}) with default wellness data`);
        } else {
          console.log(`ℹ️ User ID ${user.id} (${user.name}) already has complete data`);
        }
      } catch (error) {
        console.error(`❌ Failed to update user ID ${user.id}:`, error.message);
      }
    }
    
    // 3. Verify the fix
    console.log('\n🔍 Verifying the fix...');
    const remainingIncomplete = await query(`
      SELECT 
        id, name, email, 
        wellness_program_joined,
        activity_level,
        fitness_goal
      FROM mobile_users 
      WHERE wellness_program_joined IS NULL 
         OR activity_level IS NULL 
         OR fitness_goal IS NULL
    `);
    
    if (remainingIncomplete.length === 0) {
      console.log('✅ All users now have complete wellness data');
    } else {
      console.log(`❌ ${remainingIncomplete.length} users still have incomplete data:`);
      remainingIncomplete.forEach(user => {
        console.log(`   - ID: ${user.id}, Name: ${user.name}`);
        console.log(`     Wellness joined: ${user.wellness_program_joined}`);
        console.log(`     Activity level: ${user.activity_level || 'NULL'}`);
        console.log(`     Fitness goal: ${user.fitness_goal || 'NULL'}`);
        console.log('');
      });
    }
    
    // 4. Show summary
    console.log('\n📊 Summary:');
    const totalUsers = await query('SELECT COUNT(*) as total FROM mobile_users');
    const usersWithCompleteData = await query(`
      SELECT COUNT(*) as count 
      FROM mobile_users 
      WHERE wellness_program_joined IS NOT NULL 
         AND activity_level IS NOT NULL 
         AND fitness_goal IS NOT NULL
    `);
    
    console.log(`   Total users: ${totalUsers[0].total}`);
    console.log(`   Users with complete wellness data: ${usersWithCompleteData[0].count}`);
    console.log(`   Users with incomplete wellness data: ${totalUsers[0].total - usersWithCompleteData[0].count}`);
    
  } catch (error) {
    console.error('❌ Error fixing incomplete wellness data:', error);
  } finally {
    process.exit(0);
  }
}

fixIncompleteWellnessData();
