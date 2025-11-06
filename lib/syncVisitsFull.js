// Full Sync Module - Wrapper untuk existing sync logic
// Dipanggil oleh job queue

import { query } from './db.js';

/**
 * Helper function untuk fetch dengan retry
 */
async function fetchWithRetry(url, options, maxRetries = 2, timeoutMs = 60000) {
  for (let i = 0; i < maxRetries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (i === maxRetries - 1) {
        throw error;
      }
      
      const backoffDelay = Math.pow(2, i) * 500;
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
}

/**
 * Full sync - Similar to existing sync but modularized
 */
async function syncFull(options = {}) {
  const startTime = Date.now();
  const config = {
    maxRecords: options.maxRecords || 5000,
    recordsPerPage: options.recordsPerPage || 500,
    concurrentPages: options.concurrentPages || 3,
    batchSize: options.batchSize || 100,
    delayBetweenBatches: options.delayBetweenBatches || 500,
  };
  
  let insertedCount = 0;
  let updatedCount = 0;
  let failedCount = 0;
  const errors = [];
  
  try {
    console.log('🔄 Starting full sync...');
    
    // Step 1: Get total count
    const countResponse = await fetchWithRetry(
      `https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan?page=1&limit=1`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
      2,
      30000
    );
    
    if (!countResponse.ok) {
      throw new Error(`Failed to get count: ${countResponse.status}`);
    }
    
    const countData = await countResponse.json();
    const externalTotal = countData['total pasien'] || countData.total || 0;
    
    console.log(`📊 External total: ${externalTotal}`);
    
    // Step 2: Calculate pages to fetch
    const desiredRecords = Math.min(config.maxRecords, externalTotal);
    const recordsPerPage = config.recordsPerPage;
    const totalPagesInExternal = Math.ceil(externalTotal / recordsPerPage);
    const pagesToFetch = Math.ceil(desiredRecords / recordsPerPage);
    const startPage = Math.max(1, totalPagesInExternal - pagesToFetch + 1);
    const endPage = Math.min(startPage + pagesToFetch - 1, totalPagesInExternal);
    
    console.log(`📄 Fetching pages ${startPage} to ${endPage}`);
    
    // Step 3: Fetch pages in concurrent batches
    let allRecords = [];
    
    for (let batchStart = startPage; batchStart <= endPage; batchStart += config.concurrentPages) {
      const batchEnd = Math.min(batchStart + config.concurrentPages - 1, endPage);
      const pageNumbers = [];
      
      for (let pageNum = batchStart; pageNum <= batchEnd; pageNum++) {
        pageNumbers.push(pageNum);
      }
      
      console.log(`📥 Fetching pages ${batchStart}-${batchEnd}...`);
      
      // Fetch concurrent
      const fetchPromises = pageNumbers.map(pageNum => {
        const apiUrl = `https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan?page=${pageNum}&limit=${recordsPerPage}`;
        
        return fetchWithRetry(apiUrl, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }, 2, 60000)
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          const data = await response.json();
          return { pageNum, data: data.data || [], success: true };
        })
        .catch((error) => {
          return { pageNum, error: error.message, success: false };
        });
      });
      
      const results = await Promise.all(fetchPromises);
      
      // Process results
      results.forEach(result => {
        if (result.success && Array.isArray(result.data)) {
          allRecords = allRecords.concat(result.data);
        }
      });
      
      // Throttling
      if (batchEnd < endPage) {
        await new Promise(resolve => setTimeout(resolve, config.delayBetweenBatches));
      }
    }
    
    console.log(`📊 Fetched ${allRecords.length} records`);
    
    // Step 4: Save to database in batches
    for (let i = 0; i < allRecords.length; i += config.batchSize) {
      const batch = allRecords.slice(i, i + config.batchSize);
      
      console.log(`💾 Processing batch ${Math.floor(i / config.batchSize) + 1}/${Math.ceil(allRecords.length / config.batchSize)}`);
      
      for (const visit of batch) {
        try {
          const externalId = visit.ID || visit.No_Kunjungan;
          if (!externalId) {
            continue;
          }
          
          const visitData = {
            external_id: externalId,
            visit_number: visit.No_Kunjungan || null,
            unique_id: visit.ID || null,
            patient_nik: visit.Pasien?.[0]?.NIK || null,
            patient_name: visit.Pasien?.[0]?.Nama_Pasien || null,
            patient_nip: visit.Pasien?.[0]?.NIP || null,
            patient_no_peserta: visit.Pasien?.[0]?.No_Peserta || null,
            patient_nama_peserta: visit.Pasien?.[0]?.Nama_Peserta || null,
            patient_gender: visit.Pasien?.[0]?.Jenis_Kelamin || null,
            patient_birth_date: visit.Pasien?.[0]?.Tgl_Lahir || null,
            patient_department: visit.Pasien?.[0]?.Bagian || null,
            diagnosis: visit.Diagnosa || null,
            complaint: visit.Diagnosa || null,
            treatment: null,
            notes: null,
            assessment: null,
            status: 'Selesai',
            clinic: visit.Klinik || null,
            room: visit.Klinik || null,
            visit_date: visit.Tgl_Kunjungan || null,
            doctor_name: visit.Dokter || null,
            facility_code: visit.Fasilitas_Kesehatan?.[0]?.Kode || null,
            facility_name: visit.Fasilitas_Kesehatan?.[0]?.Nama_Faskes || null,
            physical_exam: JSON.stringify({
              weight: "0",
              height: "0",
              waistCircumference: "0",
              temperature: "0",
              spO2: "0",
              bloodPressure: { systolic: "0", diastolic: "0" },
              pulse: "0",
              respirationRate: "0",
              eyes: "",
              ears: ""
            }),
            external_created_at: visit.audittrail?.created_at || null,
            external_updated_at: visit.audittrail?.updated_at || null,
          };
          
          const result = await query(
            `INSERT INTO visits (
              external_id, visit_number, unique_id,
              patient_nik, patient_name, patient_nip,
              patient_no_peserta, patient_nama_peserta,
              patient_gender, patient_birth_date, patient_department,
              diagnosis, complaint, treatment, notes, assessment,
              status, clinic, room, visit_date,
              doctor_name, facility_code, facility_name,
              physical_exam, external_created_at, external_updated_at,
              synced_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
              visit_number = VALUES(visit_number),
              unique_id = VALUES(unique_id),
              patient_nik = VALUES(patient_nik),
              patient_name = VALUES(patient_name),
              patient_nip = VALUES(patient_nip),
              patient_no_peserta = VALUES(patient_no_peserta),
              patient_nama_peserta = VALUES(patient_nama_peserta),
              patient_gender = VALUES(patient_gender),
              patient_birth_date = VALUES(patient_birth_date),
              patient_department = VALUES(patient_department),
              diagnosis = VALUES(diagnosis),
              complaint = VALUES(complaint),
              treatment = VALUES(treatment),
              notes = VALUES(notes),
              assessment = VALUES(assessment),
              status = VALUES(status),
              clinic = VALUES(clinic),
              room = VALUES(room),
              visit_date = VALUES(visit_date),
              doctor_name = VALUES(doctor_name),
              facility_code = VALUES(facility_code),
              facility_name = VALUES(facility_name),
              physical_exam = VALUES(physical_exam),
              external_created_at = VALUES(external_created_at),
              external_updated_at = VALUES(external_updated_at),
              synced_at = NOW()`,
            [
              visitData.external_id,
              visitData.visit_number,
              visitData.unique_id,
              visitData.patient_nik,
              visitData.patient_name,
              visitData.patient_nip,
              visitData.patient_no_peserta,
              visitData.patient_nama_peserta,
              visitData.patient_gender,
              visitData.patient_birth_date,
              visitData.patient_department,
              visitData.diagnosis,
              visitData.complaint,
              visitData.treatment,
              visitData.notes,
              visitData.assessment,
              visitData.status,
              visitData.clinic,
              visitData.room,
              visitData.visit_date,
              visitData.doctor_name,
              visitData.facility_code,
              visitData.facility_name,
              visitData.physical_exam,
              visitData.external_created_at,
              visitData.external_updated_at
            ]
          );
          
          if (result.affectedRows === 1) {
            insertedCount++;
          } else if (result.affectedRows === 2) {
            updatedCount++;
          }
          
        } catch (error) {
          failedCount++;
          if (errors.length < 5) {
            errors.push({
              external_id: visit?.ID || visit?.No_Kunjungan,
              error: error.message,
            });
          }
        }
      }
      
      // Throttling
      if (i + config.batchSize < allRecords.length) {
        await new Promise(resolve => setTimeout(resolve, config.delayBetweenBatches));
      }
    }
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    const result = {
      success: true,
      message: 'Full sync completed',
      stats: {
        fetched: allRecords.length,
        inserted: insertedCount,
        updated: updatedCount,
        failed: failedCount,
        duration_seconds: duration,
      },
      errors: errors.length > 0 ? errors : undefined,
    };
    
    console.log(`✅ Full sync completed:`, result.stats);
    
    return result;
    
  } catch (error) {
    console.error('❌ Full sync failed:', error.message);
    
    return {
      success: false,
      message: 'Full sync failed',
      error: error.message,
      stats: {
        inserted: insertedCount,
        updated: updatedCount,
        failed: failedCount,
      },
    };
  }
}

export const syncModule = {
  syncFull,
};

