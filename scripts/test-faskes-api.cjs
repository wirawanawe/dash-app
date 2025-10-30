// Test script to check the structure of faskes API response
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testFaskesAPI() {
  try {
    console.log('Fetching data from faskes API...');
    const response = await fetch('https://api-ehr-klinik.doctorphc.id/master/faskes', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('\n=== API Response Structure ===');
    console.log('Type:', typeof data);
    console.log('Is Array:', Array.isArray(data));
    
    if (data.data) {
      console.log('Has data property:', true);
      console.log('data is Array:', Array.isArray(data.data));
      console.log('Total records in data:', data.data?.length);
    }
    
    if (Array.isArray(data)) {
      console.log('Total records (direct array):', data.length);
    }
    
    // Show first record structure
    let firstRecord = null;
    if (Array.isArray(data) && data.length > 0) {
      firstRecord = data[0];
    } else if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      firstRecord = data.data[0];
    }
    
    if (firstRecord) {
      console.log('\n=== First Record Structure ===');
      console.log(JSON.stringify(firstRecord, null, 2));
      
      console.log('\n=== Field Names ===');
      console.log(Object.keys(firstRecord));
    }
    
    console.log('\n✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testFaskesAPI();

