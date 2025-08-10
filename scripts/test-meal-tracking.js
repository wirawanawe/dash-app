import fetch from 'node-fetch';

const BASE_URL = 'http://10.242.90.103:3000';

async function testMealTrackingAPI() {
  console.log('🧪 Testing Meal Tracking API...\n');

  try {
    // Test 1: Get today's meal tracking
    console.log('1. Testing GET /api/mobile/tracking/meal/today?user_id=1');
    const todayResponse = await fetch(`${BASE_URL}/api/mobile/tracking/meal/today?user_id=1`);
    const todayData = await todayResponse.json();
    
    console.log(`   Status: ${todayResponse.status}`);
    console.log(`   Success: ${todayData.success}`);
    if (todayData.error) {
      console.log(`   Error: ${todayData.error}`);
    } else {
      console.log(`   Data: ${JSON.stringify(todayData.data, null, 2)}`);
    }
    console.log('');

    // Test 2: Get meal tracking with date parameter
    console.log('2. Testing GET /api/mobile/tracking/meal?user_id=1&date=2024-01-01');
    const mealResponse = await fetch(`${BASE_URL}/api/mobile/tracking/meal?user_id=1&date=2024-01-01`);
    const mealData = await mealResponse.json();
    
    console.log(`   Status: ${mealResponse.status}`);
    console.log(`   Success: ${mealData.success}`);
    if (mealData.error) {
      console.log(`   Error: ${mealData.error}`);
    } else {
      console.log(`   Data: ${JSON.stringify(mealData.data, null, 2)}`);
    }
    console.log('');

    // Test 3: Create a meal tracking entry
    console.log('3. Testing POST /api/mobile/tracking/meal');
    const createMealData = {
      user_id: 1,
      meal_type: 'breakfast',
      foods: [
        {
          food_id: 1, // Rice
          quantity: 1,
          unit: 'cup',
          calories: 130,
          protein: 2.7,
          carbs: 28,
          fat: 0.3
        },
        {
          food_id: 2, // Chicken Breast
          quantity: 100,
          unit: 'grams',
          calories: 165,
          protein: 31,
          carbs: 0,
          fat: 3.6
        }
      ],
      notes: 'Test breakfast meal',
      recorded_at: new Date().toISOString()
    };

    const createResponse = await fetch(`${BASE_URL}/api/mobile/tracking/meal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createMealData)
    });
    const createData = await createResponse.json();
    
    console.log(`   Status: ${createResponse.status}`);
    console.log(`   Success: ${createData.success}`);
    if (createData.error) {
      console.log(`   Error: ${createData.error}`);
    } else {
      console.log(`   Message: ${createData.message}`);
      console.log(`   Data: ${JSON.stringify(createData.data, null, 2)}`);
    }
    console.log('');

    // Test 4: Get today's meal tracking again (should now have data)
    console.log('4. Testing GET /api/mobile/tracking/meal/today?user_id=1 (after creating meal)');
    const todayResponse2 = await fetch(`${BASE_URL}/api/mobile/tracking/meal/today?user_id=1`);
    const todayData2 = await todayResponse2.json();
    
    console.log(`   Status: ${todayResponse2.status}`);
    console.log(`   Success: ${todayData2.success}`);
    if (todayData2.error) {
      console.log(`   Error: ${todayData2.error}`);
    } else {
      console.log(`   Data: ${JSON.stringify(todayData2.data, null, 2)}`);
    }

    console.log('\n✅ Meal tracking API tests completed!');

  } catch (error) {
    console.error('❌ Error testing meal tracking API:', error.message);
  }
}

// Run the test
testMealTrackingAPI(); 