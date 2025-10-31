import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'phc_dashboard',
  port: process.env.DB_PORT || 3306,
};

async function debugNikVisits() {
  const targetNik = '3277034105640001';
  
  console.log('='.repeat(80));
  console.log(`🔍 DEBUG: Mencari data untuk NIK ${targetNik}`);
  console.log('='.repeat(80));

  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Koneksi database berhasil\n');

    // 1. Cek apakah NIK ada di tabel patients
    console.log('1️⃣ Mencari di tabel PATIENTS:');
    console.log('-'.repeat(80));
    const [patients] = await connection.execute(
      'SELECT id, mrn, name, nik, birthdate, gender FROM patients WHERE nik = ?',
      [targetNik]
    );
    
    if (patients.length > 0) {
      console.log(`✅ Ditemukan ${patients.length} pasien dengan NIK ${targetNik}:`);
      patients.forEach((p, idx) => {
        console.log(`   ${idx + 1}. ID: ${p.id}, MRN: ${p.mrn}, Nama: ${p.name}`);
        console.log(`      NIK: ${p.nik}, Gender: ${p.gender}, DOB: ${p.birthdate}`);
      });
    } else {
      console.log(`❌ TIDAK ditemukan pasien dengan NIK ${targetNik} di tabel patients`);
    }
    console.log('');

    // 2. Cek apakah NIK ada di tabel visits (field patient_nik)
    console.log('2️⃣ Mencari di tabel VISITS (field patient_nik):');
    console.log('-'.repeat(80));
    const [visitsWithNik] = await connection.execute(
      `SELECT 
        id, 
        patient_id, 
        patient_nik, 
        patient_name, 
        visit_date, 
        visit_time,
        status,
        diagnosis,
        doctor_name,
        clinic
      FROM visits 
      WHERE patient_nik = ?
      ORDER BY visit_date DESC`,
      [targetNik]
    );
    
    if (visitsWithNik.length > 0) {
      console.log(`✅ Ditemukan ${visitsWithNik.length} kunjungan dengan patient_nik = ${targetNik}:`);
      visitsWithNik.forEach((v, idx) => {
        console.log(`   ${idx + 1}. Visit ID: ${v.id}, Patient ID: ${v.patient_id || 'NULL'}`);
        console.log(`      Nama: ${v.patient_name}, Tanggal: ${v.visit_date}`);
        console.log(`      Dokter: ${v.doctor_name || '-'}, Klinik: ${v.clinic || '-'}`);
        console.log(`      Status: ${v.status}, Diagnosis: ${v.diagnosis || '-'}`);
      });
    } else {
      console.log(`❌ TIDAK ditemukan kunjungan dengan patient_nik = ${targetNik}`);
    }
    console.log('');

    // 3. Cek kunjungan berdasarkan patient_id (jika pasien ditemukan di step 1)
    if (patients.length > 0) {
      const patientIds = patients.map(p => p.id);
      console.log('3️⃣ Mencari di tabel VISITS (berdasarkan patient_id):');
      console.log('-'.repeat(80));
      
      for (const patientId of patientIds) {
        const [visitsWithId] = await connection.execute(
          `SELECT 
            id, 
            patient_id, 
            patient_nik, 
            patient_name, 
            visit_date, 
            visit_time,
            status,
            diagnosis,
            doctor_name,
            clinic
          FROM visits 
          WHERE patient_id = ?
          ORDER BY visit_date DESC`,
          [patientId]
        );
        
        console.log(`   Patient ID ${patientId}:`);
        if (visitsWithId.length > 0) {
          console.log(`   ✅ Ditemukan ${visitsWithId.length} kunjungan:`);
          visitsWithId.forEach((v, idx) => {
            console.log(`      ${idx + 1}. Visit ID: ${v.id}, Tanggal: ${v.visit_date}`);
            console.log(`         Nama: ${v.patient_name || '-'}, NIK: ${v.patient_nik || '-'}`);
          });
        } else {
          console.log(`   ❌ Tidak ada kunjungan untuk patient_id ${patientId}`);
        }
      }
      console.log('');
    }

    // 4. Cek total kunjungan dengan NIK tersebut (kombinasi)
    console.log('4️⃣ Total kunjungan (kombinasi patient_nik DAN patient_id):');
    console.log('-'.repeat(80));
    
    if (patients.length > 0) {
      const patientIds = patients.map(p => p.id);
      const placeholders = patientIds.map(() => '?').join(',');
      
      const [combinedVisits] = await connection.execute(
        `SELECT 
          COUNT(*) as total,
          MIN(visit_date) as first_visit,
          MAX(visit_date) as last_visit
        FROM visits 
        WHERE patient_nik = ? OR patient_id IN (${placeholders})`,
        [targetNik, ...patientIds]
      );
      
      console.log(`   Total kunjungan: ${combinedVisits[0].total}`);
      console.log(`   Kunjungan pertama: ${combinedVisits[0].first_visit || '-'}`);
      console.log(`   Kunjungan terakhir: ${combinedVisits[0].last_visit || '-'}`);
    } else {
      const [nikOnlyVisits] = await connection.execute(
        'SELECT COUNT(*) as total FROM visits WHERE patient_nik = ?',
        [targetNik]
      );
      console.log(`   Total kunjungan (hanya patient_nik): ${nikOnlyVisits[0].total}`);
    }
    console.log('');

    // 5. Cek apakah ada masalah dengan format NIK
    console.log('5️⃣ Mencari NIK dengan LIKE pattern (jika ada masalah format):');
    console.log('-'.repeat(80));
    const [likePatients] = await connection.execute(
      'SELECT id, mrn, name, nik FROM patients WHERE nik LIKE ?',
      [`%${targetNik}%`]
    );
    
    if (likePatients.length > 0) {
      console.log(`   ✅ Ditemukan ${likePatients.length} pasien dengan NIK mengandung "${targetNik}":`);
      likePatients.forEach((p, idx) => {
        console.log(`      ${idx + 1}. NIK: "${p.nik}" (length: ${p.nik?.length || 0}), Nama: ${p.name}`);
      });
    } else {
      console.log(`   ❌ Tidak ada NIK yang mengandung "${targetNik}"`);
    }
    console.log('');

    // 6. Cek visits dengan LIKE pattern
    console.log('6️⃣ Mencari visits dengan patient_nik LIKE pattern:');
    console.log('-'.repeat(80));
    const [likeVisits] = await connection.execute(
      'SELECT DISTINCT patient_nik, patient_name, COUNT(*) as total FROM visits WHERE patient_nik LIKE ? GROUP BY patient_nik, patient_name',
      [`%${targetNik}%`]
    );
    
    if (likeVisits.length > 0) {
      console.log(`   ✅ Ditemukan visits dengan patient_nik mengandung "${targetNik}":`);
      likeVisits.forEach((v, idx) => {
        console.log(`      ${idx + 1}. NIK: "${v.patient_nik}" (length: ${v.patient_nik?.length || 0})`);
        console.log(`         Nama: ${v.patient_name}, Total kunjungan: ${v.total}`);
      });
    } else {
      console.log(`   ❌ Tidak ada visits dengan patient_nik mengandung "${targetNik}"`);
    }
    console.log('');

    // 7. Cek sample visits untuk melihat struktur data
    console.log('7️⃣ Sample 3 visits terbaru (untuk referensi struktur):');
    console.log('-'.repeat(80));
    const [sampleVisits] = await connection.execute(
      `SELECT id, patient_id, patient_nik, patient_name, visit_date, status 
       FROM visits 
       WHERE patient_nik IS NOT NULL 
       ORDER BY visit_date DESC 
       LIMIT 3`
    );
    
    if (sampleVisits.length > 0) {
      sampleVisits.forEach((v, idx) => {
        console.log(`   ${idx + 1}. Visit ID: ${v.id}`);
        console.log(`      patient_nik: "${v.patient_nik}" (length: ${v.patient_nik?.length || 0})`);
        console.log(`      patient_name: ${v.patient_name}`);
        console.log(`      visit_date: ${v.visit_date}`);
      });
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('🏁 DEBUG SELESAI');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Koneksi database ditutup');
    }
  }
}

// Run the debug script
debugNikVisits().catch(console.error);

