import fetch from 'node-fetch';

async function testMobileConnection() {
  const baseUrls = [
    'http://10.242.90.103:3000/api/mobile',
    'http://localhost:3000/api/mobile',
    'http://127.0.0.1:3000/api/mobile'
  ];

  console.log('🔍 Testing mobile app connection...\n');

  for (const baseUrl of baseUrls) {
    try {
      console.log(`Testing: ${baseUrl}`);
      
      // Test health endpoint
      const healthResponse = await fetch(`${baseUrl.replace('/api/mobile', '')}/api/health`);
      const healthData = await healthResponse.json();
      console.log(`✅ Health check: ${healthData.message}`);
      
      // Test mobile auth endpoint
      const authResponse = await fetch(`${baseUrl}/auth/me`);
      const authData = await authResponse.json();
      console.log(`✅ Auth endpoint: ${authData.message}`);
      
      console.log(`✅ ${baseUrl} is accessible\n`);
      
    } catch (error) {
      console.log(`❌ ${baseUrl} failed: ${error.message}\n`);
    }
  }
}

testMobileConnection();
