// Script to clear all existing clinics data
const mysql = require('mysql2/promise');

async function clearClinicsData() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'pr1k1t1w',
      database: process.env.DB_NAME || 'phc_dashboard',
    });

    console.log('✅ Connected to database');

    // Get current count
    const [countBefore] = await connection.execute('SELECT COUNT(*) as total FROM clinics');
    console.log(`\n📊 Current data: ${countBefore[0].total} clinics`);

    if (countBefore[0].total === 0) {
      console.log('✅ No data to delete. Database is already clean.');
      return;
    }

    // Delete from clinic_polyclinics first (if exists)
    try {
      const [deleteRelations] = await connection.execute('DELETE FROM clinic_polyclinics');
      console.log(`🗑️  Deleted ${deleteRelations.affectedRows} clinic-polyclinic relationships`);
    } catch (error) {
      console.log('ℹ️  No clinic_polyclinics table or no relationships to delete');
    }

    // Delete all clinics
    const [deleteResult] = await connection.execute('DELETE FROM clinics');
    console.log(`🗑️  Deleted ${deleteResult.affectedRows} clinics`);

    // Verify deletion
    const [countAfter] = await connection.execute('SELECT COUNT(*) as total FROM clinics');
    console.log(`\n📊 After deletion: ${countAfter[0].total} clinics`);

    if (countAfter[0].total === 0) {
      console.log('\n✅ All clinics data successfully deleted!');
      console.log('\n📝 Next steps:');
      console.log('   1. Go to http://localhost:3000/clinics');
      console.log('   2. Click "Sinkronisasi dari API" button');
      console.log('   3. Fresh data from API will be imported');
    } else {
      console.log('\n⚠️  Warning: Some data may still exist');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Confirm before proceeding
console.log('⚠️  WARNING: This will DELETE ALL clinics data!');
console.log('═══════════════════════════════════════════════\n');

clearClinicsData();

