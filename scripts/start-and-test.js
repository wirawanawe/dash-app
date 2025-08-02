import { exec } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';

const execAsync = promisify(exec);

async function startAndTest() {
  console.log("🚀 Starting application and testing API...\n");

  try {
    // Start the application in background
    console.log("1️⃣ Starting Next.js application...");
    const { stdout, stderr } = await execAsync('npm run dev', { 
      cwd: process.cwd(),
      stdio: 'pipe'
    });

    // Wait for application to start
    console.log("⏳ Waiting for application to start...");
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Test the API
    console.log("2️⃣ Testing meal tracking API...");
    
    try {
      const response = await fetch('http://10.242.90.103:3000/api/mobile/tracking/meal/today?user_id=1');
      const data = await response.json();
      
      console.log(`   Status: ${response.status}`);
      console.log(`   Success: ${data.success}`);
      
      if (data.success) {
        console.log("✅ API is working correctly!");
        console.log("📊 Response data:", JSON.stringify(data.data, null, 2));
      } else {
        console.log("❌ API returned error:", data.message || data.error);
      }
      
    } catch (error) {
      console.log("❌ Failed to test API:", error.message);
      console.log("💡 Make sure the application is running on port 3000");
    }

    console.log("\n🎉 Setup completed!");
    console.log("\n📋 Next steps:");
    console.log("1. Open http://10.242.90.103:3000 in your browser");
    console.log("2. Login with superadmin@phc.com / superadmin123");
    console.log("3. Test all features");

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// Run the script
startAndTest(); 