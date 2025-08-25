import { query } from '../lib/db.js';

async function migrateToMealLogging() {
  console.log('🔄 Starting migration to meal_logging table...\n');

  try {
    // Check if meal_logging table exists, if not create it
    console.log('📋 Checking meal_logging table...');
    const tables = await query("SHOW TABLES LIKE 'meal_logging'");
    
    if (tables.length === 0) {
      console.log('📋 Creating meal_logging table...');
      await query(`
        CREATE TABLE IF NOT EXISTS meal_logging (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
          recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          food_id INT,
          food_name VARCHAR(255),
          food_name_indonesian VARCHAR(255),
          quantity DECIMAL(6,2) NOT NULL DEFAULT 1,
          unit VARCHAR(50) NOT NULL DEFAULT 'serving',
          calories DECIMAL(8,2) NOT NULL DEFAULT 0,
          protein DECIMAL(6,2) NOT NULL DEFAULT 0,
          carbs DECIMAL(6,2) NOT NULL DEFAULT 0,
          fat DECIMAL(6,2) NOT NULL DEFAULT 0,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          INDEX idx_user_id (user_id),
          INDEX idx_meal_type (meal_type),
          INDEX idx_recorded_at (recorded_at),
          INDEX idx_food_id (food_id),
          INDEX idx_user_date (user_id, recorded_at)
        )
      `);
      console.log('✅ meal_logging table created');
    } else {
      console.log('✅ meal_logging table already exists');
    }

    // Check if old tables exist
    console.log('\n📋 Checking old tables...');
    const mealTrackingTable = await query("SHOW TABLES LIKE 'meal_tracking'");
    const mealFoodsTable = await query("SHOW TABLES LIKE 'meal_foods'");

    if (mealTrackingTable.length === 0 && mealFoodsTable.length === 0) {
      console.log('ℹ️  No old tables found. Migration not needed.');
      return;
    }

    // Get existing data from old tables
    console.log('\n📊 Getting existing data...');
    const existingMeals = await query(`
      SELECT 
        mt.id, mt.user_id, mt.meal_type, mt.recorded_at, mt.notes, mt.created_at,
        mf.food_id, mf.quantity, mf.unit, mf.calories, mf.protein, mf.carbs, mf.fat,
        fd.name as food_name, fd.name_indonesian as food_name_indonesian
      FROM meal_tracking mt
      LEFT JOIN meal_foods mf ON mt.id = mf.meal_id
      LEFT JOIN food_database fd ON mf.food_id = fd.id
      ORDER BY mt.recorded_at DESC
    `);

    console.log(`📊 Found ${existingMeals.length} records to migrate`);

    if (existingMeals.length === 0) {
      console.log('ℹ️  No data to migrate.');
      return;
    }

    // Migrate data to meal_logging
    console.log('\n🔄 Migrating data...');
    let migratedCount = 0;

    for (const meal of existingMeals) {
      try {
        await query(`
          INSERT INTO meal_logging (
            user_id, meal_type, recorded_at, food_id, food_name, food_name_indonesian,
            quantity, unit, calories, protein, carbs, fat, notes, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          meal.user_id,
          meal.meal_type,
          meal.recorded_at,
          meal.food_id || null,
          meal.food_name || null,
          meal.food_name_indonesian || null,
          meal.quantity || 1,
          meal.unit || 'serving',
          meal.calories || 0,
          meal.protein || 0,
          meal.carbs || 0,
          meal.fat || 0,
          meal.notes || null,
          meal.created_at
        ]);

        migratedCount++;
        if (migratedCount % 10 === 0) {
          console.log(`   Migrated ${migratedCount} records...`);
        }
      } catch (error) {
        console.error(`❌ Error migrating meal ID ${meal.id}:`, error.message);
      }
    }

    console.log(`\n✅ Migration completed! Migrated ${migratedCount} records`);

    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const newCount = await query('SELECT COUNT(*) as count FROM meal_logging');
    console.log(`📊 Total records in meal_logging: ${newCount[0].count}`);

    // Optional: Drop old tables (commented out for safety)
    /*
    console.log('\n🗑️  Dropping old tables...');
    await query('DROP TABLE IF EXISTS meal_foods');
    await query('DROP TABLE IF EXISTS meal_tracking');
    console.log('✅ Old tables dropped');
    */

    console.log('\n🎉 Migration completed successfully!');
    console.log('⚠️  Old tables are preserved. You can drop them manually if needed.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if this script is executed directly
migrateToMealLogging()
  .then(() => {
    console.log('\n✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });

export { migrateToMealLogging };
