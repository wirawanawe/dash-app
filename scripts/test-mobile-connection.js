import fetch from 'node-fetch';

async function testMobileConnection() {
  const baseURL = 'http://localhost:3000';
  
  console.log('🔍 Testing mobile app connection...');
  
  try {
    // Test 1: Health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await fetch(`${baseURL}/api/mobile/health`);
    const healthData = await healthResponse.json();
    
    if (healthResponse.ok) {
      console.log('✅ Health endpoint working:', healthData.message);
    } else {
      console.log('❌ Health endpoint failed:', healthData);
      return;
    }
    
    // Test 2: Sleep tracking API
    console.log('\n2. Testing sleep tracking API...');
    const sleepData = {
      user_id: 1,
      sleep_date: '2024-01-18',
      sleep_hours: 8,
      sleep_minutes: 0,
      sleep_quality: 'excellent',
      bedtime: '22:00',
      wake_time: '06:00',
      notes: 'Test sleep data from mobile app'
    };
    
    const sleepResponse = await fetch(`${baseURL}/api/mobile/sleep_tracking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sleepData)
    });
    
    const sleepResult = await sleepResponse.json();
    
    if (sleepResponse.ok && sleepResult.success) {
      console.log('✅ Sleep tracking API working:', sleepResult.message);
      console.log('📊 Created sleep entry with ID:', sleepResult.data.id);
    } else {
      console.log('❌ Sleep tracking API failed:', sleepResult);
    }
    
    // Test 3: Get sleep data
    console.log('\n3. Testing get sleep data...');
    const getSleepResponse = await fetch(`${baseURL}/api/mobile/sleep_tracking?user_id=1&sleep_date=2024-01-18`);
    const getSleepResult = await getSleepResponse.json();
    
    if (getSleepResponse.ok && getSleepResult.success) {
      console.log('✅ Get sleep data working:', getSleepResult.sleepData?.length || 0, 'entries found');
    } else {
      console.log('❌ Get sleep data failed:', getSleepResult);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testMobileConnection().then(() => {
  console.log('\nTest script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Test script failed:', error);
  process.exit(1);
});
