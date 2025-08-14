import fetch from 'node-fetch';

async function testSleepAPI() {
  try {
    const testData = {
      user_id: 1,
      sleep_date: '2024-01-15',
      sleep_hours: 7,
      sleep_minutes: 30,
      sleep_quality: 'good',
      bedtime: '22:30',
      wake_time: '06:00',
      notes: 'Test sleep data'
    };

    console.log('Testing sleep API with data:', testData);

    const response = await fetch('http://localhost:3000/api/mobile/sleep_tracking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response body:', result);

    if (response.ok) {
      console.log('✅ Sleep API test successful');
    } else {
      console.log('❌ Sleep API test failed');
    }

  } catch (error) {
    console.error('❌ Error testing sleep API:', error);
  }
}

// Run the test
testSleepAPI().then(() => {
  console.log('Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
