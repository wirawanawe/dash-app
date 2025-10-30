// Script to verify clinics data in database
const mysql = require('mysql2/promise');

async function verifyClinicsData() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'pr1k1t1w',
      database: process.env.DB_NAME || 'phc_dashboard',
    });

    console.log('✅ Connected to database\n');

    // Get all clinics data
    const [clinics] = await connection.execute(`
      SELECT 
        id, 
        external_id,
        name, 
        code, 
        client_id, 
        address,
        city,
        is_active,
        created_at
      FROM clinics
      ORDER BY id
    `);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 CLINICS DATA IN DATABASE');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    if (clinics.length === 0) {
      console.log('⚠️  No data found in database!');
      console.log('\n💡 Run sync first: node scripts/sync-faskes-now.cjs\n');
      return;
    }

    console.log(`Total records: ${clinics.length}\n`);

    clinics.forEach((clinic, index) => {
      console.log(`${index + 1}. ${clinic.name}`);
      console.log(`   ├─ ID: ${clinic.id}`);
      console.log(`   ├─ External ID: ${clinic.external_id}`);
      console.log(`   ├─ Kode Faskes: ${clinic.code || '-'}`);
      console.log(`   ├─ Client ID: ${clinic.client_id || '-'}`);
      console.log(`   ├─ Alamat: ${clinic.address || 'NULL (correct!)'}`);
      console.log(`   ├─ Kota: ${clinic.city || '-'}`);
      console.log(`   ├─ Status: ${clinic.is_active ? '🟢 Aktif' : '🔴 Tidak Aktif'}`);
      console.log(`   └─ Dibuat: ${clinic.created_at}`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════════');
    
    // Verify data quality
    console.log('\n🔍 DATA QUALITY CHECK:\n');
    
    const hasCode = clinics.filter(c => c.code).length;
    const hasClientId = clinics.filter(c => c.client_id).length;
    const hasAddress = clinics.filter(c => c.address && c.address !== '').length;
    const isActive = clinics.filter(c => c.is_active).length;
    
    console.log(`   ✅ Records with Kode Faskes: ${hasCode}/${clinics.length}`);
    console.log(`   ✅ Records with Client ID: ${hasClientId}/${clinics.length}`);
    console.log(`   ✅ Records with Address (should be 0): ${hasAddress}/${clinics.length}`);
    console.log(`   ✅ Active records: ${isActive}/${clinics.length}`);
    
    console.log('\n═══════════════════════════════════════════════════════════════\n');
    
    if (hasAddress > 0) {
      console.log('⚠️  WARNING: Some records have address filled!');
      console.log('   Address should be NULL, not filled with kode faskes.\n');
    } else {
      console.log('✅ All checks passed! Data is correct.\n');
    }
    
    console.log('📝 Next: Open http://localhost:3000/clinics to see the data\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifyClinicsData();

