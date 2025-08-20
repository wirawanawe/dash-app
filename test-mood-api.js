const fetch = require('node-fetch');

async function testMoodAPI() {
  console.log('🧪 Testing Mood API...');
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3000/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test 2: Create mood entry
    console.log('2. Testing mood creation...');
    const moodData = {
      user_id: 1,
      mood_level: 'happy',
      stress_level: 'low',
      tracking_date: '2025-01-19',
      notes: 'Test dari script'
    };
    
    const moodResponse = await fetch('http://localhost:3000/api/mobile/mood_tracking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(moodData)
    });
    
    const moodResult = await moodResponse.json();
    console.log('✅ Mood creation result:', moodResult);
    
    // Test 3: Get mood history
    console.log('3. Testing mood history...');
    const historyResponse = await fetch('http://localhost:3000/api/mobile/mood_tracking?user_id=1&limit=5');
    const historyData = await historyResponse.json();
    console.log('✅ Mood history:', historyData);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testMoodAPI();
