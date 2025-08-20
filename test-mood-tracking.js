const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Test JWT token (you'll need to replace this with a valid token)
const TEST_TOKEN = 'your-test-jwt-token-here';

async function testMoodTracking() {
  console.log('🧪 Testing Mood Tracking API...\n');

  // Test 1: Create mood entry
  console.log('1. Testing POST /api/mobile/wellness/mood-tracker');
  try {
    const createResponse = await fetch(`${BASE_URL}/api/mobile/wellness/mood-tracker`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      body: JSON.stringify({
        mood_level: 'happy',
        stress_level: 'low',
        energy_level: 'high',
        sleep_quality: 'good',
        notes: 'Feeling great today!',
        tracking_date: new Date().toISOString().split('T')[0]
      })
    });

    const createResult = await createResponse.json();
    console.log('Response:', createResult);
    console.log('Status:', createResponse.status);
    console.log('✅ Create mood entry test completed\n');
  } catch (error) {
    console.error('❌ Create mood entry test failed:', error.message);
  }

  // Test 2: Get today's mood
  console.log('2. Testing GET /api/mobile/wellness/mood-tracker/today');
  try {
    const todayResponse = await fetch(`${BASE_URL}/api/mobile/wellness/mood-tracker/today`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });

    const todayResult = await todayResponse.json();
    console.log('Response:', todayResult);
    console.log('Status:', todayResponse.status);
    console.log('✅ Get today mood test completed\n');
  } catch (error) {
    console.error('❌ Get today mood test failed:', error.message);
  }

  // Test 3: Get mood tracker data
  console.log('3. Testing GET /api/mobile/wellness/mood-tracker');
  try {
    const trackerResponse = await fetch(`${BASE_URL}/api/mobile/wellness/mood-tracker?period=7`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });

    const trackerResult = await trackerResponse.json();
    console.log('Response:', trackerResult);
    console.log('Status:', trackerResponse.status);
    console.log('✅ Get mood tracker test completed\n');
  } catch (error) {
    console.error('❌ Get mood tracker test failed:', error.message);
  }
}

// Run the tests
testMoodTracking().catch(console.error);
