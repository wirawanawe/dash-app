import { query } from '../lib/db.js';

async function checkMealData() {
  console.log('🔍 Checking meal_logging data...\n');

  try {
    // Check meal_logging data
    console.log('📊 Meal Logging Data:');
    const mealData = await query(`
      SELECT id, user_id, meal_type, food_id, food_name, food_name_indonesian, 
             quantity, calories, protein, carbs, fat, notes
      FROM meal_logging 
      WHERE user_id = 1 
      ORDER BY id
    `);

    console.table(mealData);

    // Check food_database for the food_ids
    console.log('\n📊 Food Database Data:');
    const foodIds = mealData.map(meal => meal.food_id).filter(id => id !== null);
    
    if (foodIds.length > 0) {
      const foodData = await query(`
        SELECT id, name, name_indonesian 
        FROM food_database 
        WHERE id IN (${foodIds.join(',')})
        ORDER BY id
      `);
      
      console.table(foodData);
    } else {
      console.log('No food_ids found in meal_logging');
    }

    // Check if there are any food_database records
    console.log('\n📊 Total Food Database Records:');
    const totalFoods = await query('SELECT COUNT(*) as count FROM food_database');
    console.log(`Total foods in database: ${totalFoods[0].count}`);

    // Check sample food_database records
    console.log('\n📊 Sample Food Database Records:');
    const sampleFoods = await query('SELECT id, name, name_indonesian FROM food_database LIMIT 5');
    console.table(sampleFoods);

  } catch (error) {
    console.error('❌ Error checking data:', error);
  }
}

checkMealData()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });
