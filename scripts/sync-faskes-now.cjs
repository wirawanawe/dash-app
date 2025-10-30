// Script to trigger faskes sync via API endpoint
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function syncFaskesNow() {
  console.log('🚀 Starting Faskes Synchronization...\n');

  try {
    // Call the sync endpoint
    console.log('📡 Calling sync endpoint...');
    const response = await fetch('http://localhost:3000/api/clinics/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    
    console.log('\n✅ SYNCHRONIZATION SUCCESSFUL!\n');
    console.log('═══════════════════════════════════════════════');
    console.log(`📊 Message: ${result.message}`);
    console.log('\n📈 Statistics:');
    console.log(`   Total from API: ${result.stats.total}`);
    console.log(`   Successfully inserted: ${result.stats.inserted}`);
    console.log(`   Errors: ${result.stats.errors}`);
    console.log('═══════════════════════════════════════════════\n');

    if (result.stats.inserted > 0) {
      console.log('✅ Data has been successfully synced to database!');
      console.log('\n📝 Next steps:');
      console.log('   1. Open http://localhost:3000/clinics');
      console.log('   2. Verify the data is displayed correctly');
      console.log('   3. Check "Kode Faskes" column is filled\n');
    }

  } catch (error) {
    console.error('\n❌ SYNCHRONIZATION FAILED!');
    console.error('═══════════════════════════════════════════════');
    console.error('Error:', error.message);
    console.error('═══════════════════════════════════════════════\n');
    
    console.log('💡 Troubleshooting:');
    console.log('   1. Make sure the server is running: npm run dev');
    console.log('   2. Check if API is accessible: node scripts/test-faskes-api.cjs');
    console.log('   3. Check database connection\n');
    
    process.exit(1);
  }
}

syncFaskesNow();

