import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

import { query } from '../lib/db.js';

async function clearMealData() {
  try {
    console.log('🗑️ Clearing meal tracking data...');

    // First, delete meal_foods records
    const mealFoodsResult = await query('DELETE FROM meal_foods');
    console.log(`✅ Deleted ${mealFoodsResult.affectedRows} meal_foods records`);

    // Then, delete meal_tracking records
    const mealTrackingResult = await query('DELETE FROM meal_tracking');
    console.log(`✅ Deleted ${mealTrackingResult.affectedRows} meal_tracking records`);

    console.log('✅ All meal tracking data cleared successfully!');

  } catch (error) {
    console.error('❌ Error clearing meal data:', error);
  }
}

// Run the script
clearMealData(); 