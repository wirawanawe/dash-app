// Test script to verify faskes sync functionality
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testFaskesSync() {
  console.log('🧪 Testing Faskes Synchronization...\n');

  try {
    // Step 1: Test API connectivity
    console.log('1️⃣ Testing API connectivity...');
    const apiResponse = await fetch('https://api-ehr-klinik.doctorphc.id/master/faskes', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!apiResponse.ok) {
      throw new Error(`API request failed: ${apiResponse.status}`);
    }

    const apiData = await apiResponse.json();
    const faskesCount = apiData.data?.length || 0;
    console.log(`✅ API accessible - Found ${faskesCount} faskes records\n`);

    // Step 2: Show sample data
    if (apiData.data && apiData.data.length > 0) {
      console.log('2️⃣ Sample data from API:');
      console.log('─────────────────────────────────────');
      apiData.data.forEach((faskes, index) => {
        console.log(`\n${index + 1}. ${faskes.nama_faskes}`);
        console.log(`   Kode: ${faskes.kode_faskes}`);
        console.log(`   Client ID: ${faskes.client_id}`);
        console.log(`   UUID: ${faskes.uuid}`);
      });
      console.log('\n─────────────────────────────────────\n');
    }

    // Step 3: Instructions for manual testing
    console.log('3️⃣ Next steps for manual testing:');
    console.log('─────────────────────────────────────');
    console.log('1. Buka browser dan akses: http://localhost:3000/clinics');
    console.log('2. Login sebagai SUPERADMIN');
    console.log('3. Klik tombol "Sinkronisasi dari API" (hijau, dengan icon cloud)');
    console.log('4. Konfirmasi dialog yang muncul');
    console.log('5. Tunggu proses selesai');
    console.log('6. Verifikasi data muncul di tabel dengan kolom "Kode Faskes"');
    console.log('─────────────────────────────────────\n');

    console.log('✅ Pre-sync test completed successfully!');
    console.log(`📊 Ready to sync ${faskesCount} faskes records\n`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testFaskesSync();

