import { query } from '../lib/db.js';

async function testWeeklySummary() {
  try {
    console.log('🧪 Testing Weekly Summary API...');
    
    // Test the nutrition query directly
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    console.log(`📅 Date range: ${startDate} to ${endDate}`);
    
    // Check if meal_logging table exists and has data
    const tableCheck = await query("SHOW TABLES LIKE 'meal_logging'");
    console.log('📋 meal_logging table exists:', tableCheck.length > 0);
    
    if (tableCheck.length > 0) {
      const mealLoggingCount = await query("SELECT COUNT(*) as count FROM meal_logging");
      console.log('📊 meal_logging records:', mealLoggingCount[0].count);
      
      // Test the nutrition query
      const nutritionSql = `
        SELECT 
          DATE(recorded_at) as date,
          COALESCE(SUM(calories), 0) as total_calories,
          COUNT(DISTINCT id) as meal_count
        FROM meal_logging
        WHERE user_id = 1 AND DATE(recorded_at) BETWEEN ? AND ?
        GROUP BY DATE(recorded_at)
        ORDER BY date ASC
      `;
      
      const nutritionData = await query(nutritionSql, [startDate, endDate]);
      console.log('🍽️ Nutrition data:', nutritionData);
      
      // Check if there's any calorie data
      const totalCalories = nutritionData.reduce((sum, day) => sum + Number(day.total_calories), 0);
      console.log('🔥 Total calories for week:', totalCalories);
    }
    
    // Also check meal_tracking and meal_foods tables
    const mealTrackingCheck = await query("SHOW TABLES LIKE 'meal_tracking'");
    console.log('📋 meal_tracking table exists:', mealTrackingCheck.length > 0);
    
    const mealFoodsCheck = await query("SHOW TABLES LIKE 'meal_foods'");
    console.log('📋 meal_foods table exists:', mealFoodsCheck.length > 0);
    
    if (mealTrackingCheck.length > 0) {
      const mealTrackingCount = await query("SELECT COUNT(*) as count FROM meal_tracking");
      console.log('📊 meal_tracking records:', mealTrackingCount[0].count);
    }
    
    if (mealFoodsCheck.length > 0) {
      const mealFoodsCount = await query("SELECT COUNT(*) as count FROM meal_foods");
      console.log('📊 meal_foods records:', mealFoodsCount[0].count);
    }
    
    // Test the full weekly summary query
    console.log('\n🔍 Testing full weekly summary query...');
    const weeklySummarySql = `
      SELECT 
        DATE(recorded_at) as date,
        COALESCE(SUM(calories), 0) as total_calories,
        COUNT(DISTINCT id) as meal_count
      FROM meal_logging
      WHERE user_id = 1 AND DATE(recorded_at) BETWEEN ? AND ?
      GROUP BY DATE(recorded_at)
      ORDER BY date ASC
    `;
    
    const weeklySummaryData = await query(weeklySummarySql, [startDate, endDate]);
    console.log('📈 Weekly summary nutrition data:', weeklySummaryData);
    
    console.log('\n✅ Weekly summary test completed!');
    
  } catch (error) {
    console.error('❌ Error testing weekly summary:', error);
  } finally {
    process.exit(0);
  }
}

testWeeklySummary();
