const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api/phc-office-admin';

async function testPHCOfficeAPI() {
  console.log('Testing PHC Office Admin API...\n');

  try {
    // Test GET endpoint
    console.log('1. Testing GET endpoint...');
    const getResponse = await fetch(BASE_URL);
    const getData = await getResponse.json();
    console.log('GET Response:', JSON.stringify(getData, null, 2));
    console.log('');

    // Test POST endpoint (create new)
    console.log('2. Testing POST endpoint...');
    const postData = {
      office_name: 'Kantor Cabang PHC Bandung',
      phone: '+62-22-87654321',
      email: 'bandung@phc.com',
      address: 'Jl. Asia Afrika No. 100, Bandung',
      city: 'Bandung',
      postal_code: '40111',
      contact_person: 'Admin Bandung'
    };

    const postResponse = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });
    const postResult = await postResponse.json();
    console.log('POST Response:', JSON.stringify(postResult, null, 2));
    console.log('');

    // Test PUT endpoint (update)
    if (postResult.success && postResult.data) {
      console.log('3. Testing PUT endpoint...');
      const updateData = {
        id: postResult.data.id,
        office_name: 'Kantor Cabang PHC Bandung (Updated)',
        phone: '+62-22-87654322',
        email: 'bandung.updated@phc.com',
        address: 'Jl. Asia Afrika No. 101, Bandung',
        city: 'Bandung',
        postal_code: '40112',
        contact_person: 'Admin Bandung Updated'
      };

      const putResponse = await fetch(BASE_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      const putResult = await putResponse.json();
      console.log('PUT Response:', JSON.stringify(putResult, null, 2));
      console.log('');

      // Test DELETE endpoint
      console.log('4. Testing DELETE endpoint...');
      const deleteResponse = await fetch(`${BASE_URL}?id=${postResult.data.id}`, {
        method: 'DELETE',
      });
      const deleteResult = await deleteResponse.json();
      console.log('DELETE Response:', JSON.stringify(deleteResult, null, 2));
    }

  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testPHCOfficeAPI();
