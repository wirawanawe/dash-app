import { query } from '../lib/db.js';

async function debugSetupWellness() {
  try {
    console.log('🔍 Debugging setup-wellness API endpoint...');
    
    // 1. Check if there are any users without date_of_birth
    console.log('\n📊 Checking users without date_of_birth:');
    const usersWithoutDOB = await query(`
      SELECT id, name, email, date_of_birth, gender, height, weight 
      FROM mobile_users 
      WHERE date_of_birth IS NULL
    `);
    
    if (usersWithoutDOB.length > 0) {
      console.log(`❌ Found ${usersWithoutDOB.length} users without date_of_birth:`);
      usersWithoutDOB.forEach(user => {
        console.log(`   - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
      });
    } else {
      console.log('✅ All users have date_of_birth');
    }
    
    // 2. Check users with incomplete wellness data
    console.log('\n📊 Checking users with incomplete wellness data:');
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
    
    if (usersIncomplete.length > 0) {
      console.log(`⚠️ Found ${usersIncomplete.length} users with incomplete wellness data:`);
      usersIncomplete.forEach(user => {
        console.log(`   - ID: ${user.id}, Name: ${user.name}`);
        console.log(`     Wellness joined: ${user.wellness_program_joined}`);
        console.log(`     Activity level: ${user.activity_level || 'NULL'}`);
        console.log(`     Fitness goal: ${user.fitness_goal || 'NULL'}`);
        console.log(`     Date of birth: ${user.date_of_birth || 'NULL'}`);
        console.log(`     Gender: ${user.gender || 'NULL'}`);
        console.log('');
      });
    } else {
      console.log('✅ All users have complete wellness data');
    }
    
    // 3. Check health_data table for weight/height entries
    console.log('\n📊 Checking health_data entries:');
    const healthData = await query(`
      SELECT 
        user_id,
        data_type,
        value,
        unit,
        measured_at,
        source
      FROM health_data 
      WHERE data_type IN ('weight', 'height')
      ORDER BY user_id, data_type, measured_at DESC
    `);
    
    if (healthData.length > 0) {
      console.log(`✅ Found ${healthData.length} health data entries:`);
      healthData.forEach(entry => {
        console.log(`   - User ID: ${entry.user_id}, Type: ${entry.data_type}, Value: ${entry.value} ${entry.unit}`);
      });
    } else {
      console.log('❌ No health data entries found');
    }
    
    // 4. Test the API validation logic
    console.log('\n🧪 Testing API validation logic:');
    
    // Test case 1: Missing required fields
    const testData1 = {
      weight: 70,
      height: 170
      // Missing: gender, activity_level, fitness_goal
    };
    
    console.log('Test 1 - Missing fields:', testData1);
    const missingFields = !testData1.weight || !testData1.height || !testData1.gender || !testData1.activity_level || !testData1.fitness_goal;
    console.log(`   Missing fields: ${missingFields ? 'YES (would cause 400 error)' : 'NO'}`);
    
    // Test case 2: Invalid values
    const testData2 = {
      weight: 0,
      height: -5,
      gender: 'male',
      activity_level: 'moderately_active',
      fitness_goal: 'weight_loss'
    };
    
    console.log('Test 2 - Invalid values:', testData2);
    const invalidValues = testData2.weight <= 0 || testData2.height <= 0;
    console.log(`   Invalid values: ${invalidValues ? 'YES (would cause 400 error)' : 'NO'}`);
    
    // Test case 3: Valid data
    const testData3 = {
      weight: 70,
      height: 170,
      gender: 'male',
      activity_level: 'moderately_active',
      fitness_goal: 'weight_loss'
    };
    
    console.log('Test 3 - Valid data:', testData3);
    const validData = testData3.weight && testData3.height && testData3.gender && testData3.activity_level && testData3.fitness_goal && testData3.weight > 0 && testData3.height > 0;
    console.log(`   Valid data: ${validData ? 'YES' : 'NO'}`);
    
  } catch (error) {
    console.error('❌ Error debugging setup-wellness:', error);
  } finally {
    process.exit(0);
  }
}

debugSetupWellness();
