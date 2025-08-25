import { query } from '../lib/db.js';

async function fixMealFoodNames() {
  console.log('🔧 Fixing food names in meal_logging table...\n');

  try {
    // Get all meal_logging records with null food names
    console.log('📊 Getting records with null food names...');
    const nullFoodNames = await query(`
      SELECT id, food_id, food_name, food_name_indonesian
      FROM meal_logging 
      WHERE food_id IS NOT NULL 
      AND (food_name IS NULL OR food_name_indonesian IS NULL)
      ORDER BY id
    `);

    console.log(`📊 Found ${nullFoodNames.length} records with null food names`);

    if (nullFoodNames.length === 0) {
      console.log('✅ No records need fixing');
      return;
    }

    // Update each record
    console.log('\n🔄 Updating food names...');
    let updatedCount = 0;

    for (const record of nullFoodNames) {
      try {
        // Get food data from food_database
        const foodData = await query(
          'SELECT name, name_indonesian FROM food_database WHERE id = ?',
          [record.food_id]
        );

        if (foodData.length > 0) {
          const food = foodData[0];
          
          // Update meal_logging record
          await query(`
            UPDATE meal_logging 
            SET food_name = ?, food_name_indonesian = ?
            WHERE id = ?
          `, [
            food.name,
            food.name_indonesian,
            record.id
          ]);

          updatedCount++;
          console.log(`   ✅ Updated record ${record.id} (food_id: ${record.food_id}) with "${food.name}" / "${food.name_indonesian}"`);
        } else {
          console.log(`   ⚠️  Food ID ${record.food_id} not found in food_database for record ${record.id}`);
        }
      } catch (error) {
        console.error(`   ❌ Error updating record ${record.id}:`, error.message);
      }
    }

    console.log(`\n✅ Updated ${updatedCount} records`);

    // Verify the fix
    console.log('\n🔍 Verifying the fix...');
    const remainingNulls = await query(`
      SELECT COUNT(*) as count
      FROM meal_logging 
      WHERE food_id IS NOT NULL 
      AND (food_name IS NULL OR food_name_indonesian IS NULL)
    `);

    console.log(`📊 Records with null food names remaining: ${remainingNulls[0].count}`);

    // Show sample updated data
    console.log('\n📊 Sample updated data:');
    const sampleData = await query(`
      SELECT id, food_id, food_name, food_name_indonesian
      FROM meal_logging 
      WHERE food_id IS NOT NULL 
      ORDER BY id 
      LIMIT 5
    `);
    
    console.table(sampleData);

  } catch (error) {
    console.error('❌ Error fixing food names:', error);
    throw error;
  }
}

fixMealFoodNames()
  .then(() => {
    console.log('\n✅ Food names fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Food names fix failed:', error);
    process.exit(1);
  });
