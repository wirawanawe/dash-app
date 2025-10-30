/**
 * Script to check family data in database
 * Usage: node scripts/check-family-data.js [NIP]
 */

const mysql = require('mysql2/promise');

async function checkFamilyData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'phc_dashboard',
  });

  try {
    console.log('🔍 Checking patients table for family data...\n');

    // Get NIP from command line argument
    const targetNip = process.argv[2] || '5383001L';
    
    console.log(`📋 Looking for patients with NIP: ${targetNip}\n`);

    // Check how many patients have NIP
    const [nipStats] = await connection.execute(
      'SELECT COUNT(*) as total, COUNT(DISTINCT nip) as unique_nips FROM patients WHERE nip IS NOT NULL AND nip != ""'
    );
    console.log('📊 NIP Statistics:');
    console.log(`   Total patients with NIP: ${nipStats[0].total}`);
    console.log(`   Unique NIPs: ${nipStats[0].unique_nips}\n`);

    // Check specific NIP
    const [targetPatients] = await connection.execute(
      'SELECT id, name, nip, nik, mrn, no_peserta, nama_peserta, bagian, gender FROM patients WHERE TRIM(nip) = ?',
      [targetNip]
    );

    console.log(`🔎 Patients with NIP '${targetNip}':`);
    console.log(`   Found: ${targetPatients.length} patients\n`);

    if (targetPatients.length > 0) {
      targetPatients.forEach((patient, index) => {
        console.log(`   ${index + 1}. ${patient.name}`);
        console.log(`      ID: ${patient.id}`);
        console.log(`      NIK: ${patient.nik}`);
        console.log(`      NIP: ${patient.nip}`);
        console.log(`      MRN: ${patient.mrn}`);
        console.log(`      No Peserta: ${patient.no_peserta}`);
        console.log(`      Nama Peserta: ${patient.nama_peserta}`);
        console.log(`      Bagian: ${patient.bagian}`);
        console.log(`      Gender: ${patient.gender}`);
        console.log('');
      });
    } else {
      console.log('   ❌ No patients found with this NIP\n');
      
      // Check if NIP exists with different format
      const [similarNips] = await connection.execute(
        'SELECT DISTINCT nip FROM patients WHERE nip LIKE ? LIMIT 10',
        [`%${targetNip}%`]
      );
      
      if (similarNips.length > 0) {
        console.log('   💡 Similar NIPs found:');
        similarNips.forEach(row => {
          console.log(`      - "${row.nip}"`);
        });
      }
    }

    // Check all NIPs with multiple patients (families)
    console.log('\n👨‍👩‍👧‍👦 Families (NIPs with multiple patients):');
    const [families] = await connection.execute(
      `SELECT nip, nama_peserta, COUNT(*) as member_count, GROUP_CONCAT(name SEPARATOR ', ') as members
       FROM patients 
       WHERE nip IS NOT NULL AND nip != ''
       GROUP BY nip, nama_peserta
       HAVING COUNT(*) > 1
       ORDER BY member_count DESC
       LIMIT 10`
    );

    if (families.length > 0) {
      families.forEach((family, index) => {
        console.log(`\n   ${index + 1}. NIP: ${family.nip}`);
        console.log(`      Kepala Keluarga: ${family.nama_peserta}`);
        console.log(`      Jumlah Anggota: ${family.member_count}`);
        console.log(`      Anggota: ${family.members}`);
      });
    } else {
      console.log('   ❌ No families found (no NIPs with multiple patients)');
    }

    console.log('\n✅ Check completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the check
checkFamilyData().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

