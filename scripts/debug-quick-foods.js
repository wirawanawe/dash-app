import { query } from '../lib/db.js';

async function debugQuickFoods() {
  try {
    console.log('🔍 Debugging Quick Foods Database...\n');

    // Check food database
    console.log('📋 Food Database:');
    const foods = await query('SELECT id, name FROM food_database ORDER BY id');
    console.log('Available food IDs:', foods.map(f => f.id).join(', '));
    console.log('Total foods:', foods.length);
    console.log('');

    // Check all quick foods
    console.log('📋 All Quick Foods:');
    const allQuickFoods = await query(`
      SELECT uqf.id, uqf.user_id, uqf.food_id, uqf.custom_name, fd.name as food_name
      FROM user_quick_foods uqf
      LEFT JOIN food_database fd ON uqf.food_id = fd.id
      ORDER BY uqf.user_id, uqf.food_id
    `);
    
    if (allQuickFoods.length === 0) {
      console.log('No quick foods found in database');
    } else {
      console.log('Quick foods by user:');
      const byUser = {};
      allQuickFoods.forEach(qf => {
        if (!byUser[qf.user_id]) byUser[qf.user_id] = [];
        byUser[qf.user_id].push({
          quick_food_id: qf.id,
          food_id: qf.food_id,
          food_name: qf.food_name,
          custom_name: qf.custom_name
        });
      });
      
      Object.keys(byUser).forEach(userId => {
        console.log(`User ${userId}:`);
        byUser[userId].forEach(qf => {
          const status = qf.food_name ? '✅' : '❌';
          console.log(`  ${status} Quick Food ID: ${qf.quick_food_id}, Food ID: ${qf.food_id}, Name: ${qf.food_name || 'NOT FOUND'}, Custom: ${qf.custom_name || 'N/A'}`);
        });
      });
    }
    console.log('');

    // Check for orphaned quick foods (food_id not in food_database)
    console.log('🔍 Checking for orphaned quick foods...');
    const orphaned = await query(`
      SELECT uqf.id, uqf.user_id, uqf.food_id, uqf.custom_name
      FROM user_quick_foods uqf
      LEFT JOIN food_database fd ON uqf.food_id = fd.id
      WHERE fd.id IS NULL
    `);
    
    if (orphaned.length > 0) {
      console.log('❌ Found orphaned quick foods:');
      orphaned.forEach(o => {
        console.log(`  User ${o.user_id}: Quick Food ID ${o.id}, Food ID ${o.food_id} (not in database)`);
      });
      
      console.log('\n💡 Recommendation: Clean up orphaned quick foods');
      console.log('Run: DELETE FROM user_quick_foods WHERE food_id NOT IN (SELECT id FROM food_database)');
    } else {
      console.log('✅ No orphaned quick foods found');
    }
    console.log('');

    // Check specific food ID 25
    console.log('🔍 Checking Food ID 25 specifically...');
    const food25 = await query('SELECT id, name FROM food_database WHERE id = 25');
    if (food25.length === 0) {
      console.log('❌ Food ID 25 does not exist in database');
    } else {
      console.log('✅ Food ID 25 exists:', food25[0]);
    }
    
    const quickFood25 = await query('SELECT * FROM user_quick_foods WHERE food_id = 25');
    if (quickFood25.length === 0) {
      console.log('❌ No quick foods found with food_id = 25');
    } else {
      console.log('⚠️ Found quick foods with food_id = 25:', quickFood25);
    }

  } catch (error) {
    console.error('❌ Error debugging quick foods:', error);
  } finally {
    process.exit(0);
  }
}

debugQuickFoods();
