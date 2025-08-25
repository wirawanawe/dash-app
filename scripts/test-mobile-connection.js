// Test script to simulate mobile app connection
const urls = [
  'http://localhost:3000/api/mobile',
  'http://192.168.18.30:3000/api/mobile',
  'http://10.0.2.2:3000/api/mobile'
];

async function testConnection(url) {
  console.log(`\n🔍 Testing connection to: ${url}`);
  
  try {
    // Test health endpoint
    const healthUrl = url.replace('/api/mobile', '/api/health');
    console.log(`Testing health: ${healthUrl}`);
    
    const healthResponse = await fetch(healthUrl);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test mood API
    const moodUrl = `${url}/mood_tracking`;
    console.log(`Testing mood API: ${moodUrl}`);
    
    const moodData = {
      user_id: 1,
      mood_level: 'happy',
      stress_level: 'low',
      tracking_date: '2025-01-21',
      notes: 'Test connection'
    };
    
    const moodResponse = await fetch(moodUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(moodData)
    });
    
    const moodResult = await moodResponse.json();
    console.log('✅ Mood API result:', moodResult);
    
    return { success: true, url };
    
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    return { success: false, url, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing mobile app connections...\n');
  
  for (const url of urls) {
    const result = await testConnection(url);
    if (result.success) {
      console.log(`\n🎉 SUCCESS: ${url} is working!`);
    } else {
      console.log(`\n💥 FAILED: ${url} - ${result.error}`);
    }
  }
}

runTests();
