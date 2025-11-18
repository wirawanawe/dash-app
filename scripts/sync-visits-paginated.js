#!/usr/bin/env node

/**
 * Script untuk mengambil data kunjungan dari API eksternal
 * dan menyimpannya ke database lokal dengan pagination 1000 record per page
 * 
 * Usage:
 *   node scripts/sync-visits-paginated.js
 */

import { query, closePool } from '../lib/db.js';
import { fetchJson } from '../lib/sync/shared/fetch.js';
import { normalizePrescriptions } from '../lib/sync/shared/normalize.js';

const API_BASE_URL = 'https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan';
const RECORDS_PER_PAGE = 1000;

/**
 * Extract records from API response
 */
function extractRecordsFromApiResponse(data) {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.data)) {
    return data.data;
  }

  if (Array.isArray(data.Data)) {
    return data.Data;
  }

  if (Array.isArray(data.records)) {
    return data.records;
  }

  console.warn('⚠️  Unexpected API response format:', JSON.stringify(data).substring(0, 500));
  return [];
}

/**
 * Transform API visit record to database format
 */
function transformVisitRecord(visit) {
  const externalId = visit.ID || visit.No_Kunjungan;
  if (!externalId) {
    throw new Error('Missing external_id');
  }

  const normalizedPrescriptions = normalizePrescriptions(
    visit.Resep || visit.resep || visit.Prescription || visit.prescription
  );

  return {
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
    visit_time: null,
    doctor_name: visit.Dokter || null,
    doctor_id: null,
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
    kode_poli: visit.Kode_Poli || null,
    nama_poli: visit.Nama_Poli || null,
    no_antrian: visit.No_Antrian || null,
    jenis_kunjungan: visit.Jenis_Kunjungan || null,
    cara_bayar: visit.Cara_Bayar || null,
    external_created_at: visit.audittrail?.created_at || null,
    external_updated_at: visit.audittrail?.updated_at || null,
    prescriptions: JSON.stringify(normalizedPrescriptions),
    prescription_count: normalizedPrescriptions.length,
  };
}

/**
 * Save visit records to cache table
 */
async function saveVisitRecords(visitsData) {
  if (!visitsData || visitsData.length === 0) {
    return { inserted: 0, failed: 0 };
  }

  let inserted = 0;
  let failed = 0;

  // Process in chunks to avoid query size limits
  const chunkSize = 100;
  
  for (let i = 0; i < visitsData.length; i += chunkSize) {
    const chunk = visitsData.slice(i, i + chunkSize);
    const chunkNum = Math.floor(i / chunkSize) + 1;
    
    try {
      for (const visitData of chunk) {
        try {
          await query(
            `INSERT INTO visits_cache (
              external_id, visit_number, unique_id,
              patient_nik, patient_name, patient_nip,
              patient_no_peserta, patient_nama_peserta,
              patient_gender, patient_birth_date, patient_department,
              diagnosis, complaint, treatment, notes, assessment,
              status, clinic, room, visit_date,
              doctor_name, facility_code, facility_name,
              physical_exam, prescriptions, prescription_count,
              external_created_at, external_updated_at,
              synced_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
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
              prescriptions = VALUES(prescriptions),
              prescription_count = VALUES(prescription_count),
              external_created_at = VALUES(external_created_at),
              external_updated_at = VALUES(external_updated_at),
              synced_at = NOW()`,
            [
              visitData.external_id ?? null,
              visitData.visit_number ?? null,
              visitData.unique_id ?? null,
              visitData.patient_nik ?? null,
              visitData.patient_name ?? null,
              visitData.patient_nip ?? null,
              visitData.patient_no_peserta ?? null,
              visitData.patient_nama_peserta ?? null,
              visitData.patient_gender ?? null,
              visitData.patient_birth_date ?? null,
              visitData.patient_department ?? null,
              visitData.diagnosis ?? null,
              visitData.complaint ?? null,
              visitData.treatment ?? null,
              visitData.notes ?? null,
              visitData.assessment ?? null,
              visitData.status ?? null,
              visitData.clinic ?? null,
              visitData.room ?? null,
              visitData.visit_date ?? null,
              visitData.doctor_name ?? null,
              visitData.facility_code ?? null,
              visitData.facility_name ?? null,
              visitData.physical_exam ?? null,
              visitData.prescriptions ?? null,
              visitData.prescription_count ?? 0,
              visitData.external_created_at ?? null,
              visitData.external_updated_at ?? null,
            ]
          );
          inserted++;
        } catch (error) {
          console.error(`❌ Failed to save visit ${visitData.external_id}:`, error.message);
          failed++;
        }
      }

      if (chunkNum % 10 === 0 || i + chunkSize >= visitsData.length) {
        console.log(`   Processed chunk ${chunkNum} (${inserted} inserted, ${failed} failed so far)`);
      }
    } catch (error) {
      console.error(`❌ Error processing chunk ${chunkNum}:`, error.message);
      failed += chunk.length;
    }
  }

  return { inserted, failed };
}

/**
 * Fetch visits from API with pagination
 */
async function fetchVisitsPage(page) {
  const url = `${API_BASE_URL}?limit=${RECORDS_PER_PAGE}&page=${page}`;
  console.log(`📡 Fetching page ${page} from ${url}`);
  
  try {
    const data = await fetchJson(
      url,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } },
      3, // maxRetries
      180000 // timeout: 3 minutes
    );

    const records = extractRecordsFromApiResponse(data);
    
    // Try to extract pagination metadata from response
    const paginationInfo = {
      total: data.total || data.Total || data.totalRecords || data.total_records || null,
      totalPages: data.totalPages || data.TotalPages || data.total_pages || null,
      currentPage: data.currentPage || data.CurrentPage || data.current_page || data.page || page,
      perPage: data.perPage || data.PerPage || data.per_page || data.limit || RECORDS_PER_PAGE,
    };
    
    console.log(`✅ Fetched ${records.length} records from page ${page}`);
    if (paginationInfo.total !== null) {
      console.log(`   📊 API reports: Total=${paginationInfo.total}, TotalPages=${paginationInfo.totalPages || 'N/A'}`);
    }
    
    return { records, pagination: paginationInfo };
  } catch (error) {
    console.error(`❌ Error fetching page ${page}:`, error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting visits sync with pagination');
  console.log('═══════════════════════════════════════════\n');
  
  const startTime = Date.now();
  let totalInserted = 0;
  let totalFailed = 0;
  let currentPage = 1;
  let hasMorePages = true;
  let consecutiveEmptyPages = 0;
  const maxConsecutiveEmpty = 3; // Stop after 3 consecutive empty pages
  let totalRecordsFromAPI = null;
  let totalPagesFromAPI = null;

  try {
    // Step 1: Truncate visits_cache table
    console.log('🗑️  Truncating visits_cache table...');
    await query('TRUNCATE TABLE visits_cache');
    console.log('✅ Table truncated successfully\n');

    // Step 2: Fetch and save data page by page
    console.log(`📥 Fetching data (${RECORDS_PER_PAGE} records per page)...\n`);

    while (hasMorePages) {
      try {
        const result = await fetchVisitsPage(currentPage);
        const records = result.records;
        const pagination = result.pagination;
        
        // Update total records/pages from API if available
        if (pagination.total !== null && totalRecordsFromAPI === null) {
          totalRecordsFromAPI = pagination.total;
          console.log(`📊 API reports total records: ${totalRecordsFromAPI}`);
        }
        if (pagination.totalPages !== null && totalPagesFromAPI === null) {
          totalPagesFromAPI = pagination.totalPages;
          console.log(`📊 API reports total pages: ${totalPagesFromAPI}`);
        }
        
        if (records.length === 0) {
          consecutiveEmptyPages++;
          console.log(`⚠️  Page ${currentPage} returned no records (consecutive empty: ${consecutiveEmptyPages}/${maxConsecutiveEmpty})`);
          
          // If we know total pages from API, check if we've reached it
          if (totalPagesFromAPI !== null && currentPage >= totalPagesFromAPI) {
            console.log(`✅ Reached last page according to API (page ${totalPagesFromAPI})`);
            hasMorePages = false;
            break;
          }
          
          // Stop if too many consecutive empty pages
          if (consecutiveEmptyPages >= maxConsecutiveEmpty) {
            console.log(`🛑 Stopping: ${maxConsecutiveEmpty} consecutive empty pages`);
            hasMorePages = false;
            break;
          }
          
          currentPage++;
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        // Reset consecutive empty pages counter
        consecutiveEmptyPages = 0;

        // Transform records
        const transformedRecords = [];
        for (const record of records) {
          try {
            transformedRecords.push(transformVisitRecord(record));
          } catch (error) {
            console.warn(`⚠️  Failed to transform record:`, error.message);
            totalFailed++;
          }
        }

        // Save to database
        console.log(`💾 Saving ${transformedRecords.length} records to database...`);
        const saveResult = await saveVisitRecords(transformedRecords);
        totalInserted += saveResult.inserted;
        totalFailed += saveResult.failed;

        console.log(`✅ Page ${currentPage} completed: ${saveResult.inserted} inserted, ${saveResult.failed} failed`);
        
        // Show progress if we know total from API
        if (totalRecordsFromAPI !== null) {
          const progress = ((totalInserted / totalRecordsFromAPI) * 100).toFixed(1);
          console.log(`   📊 Progress: ${totalInserted}/${totalRecordsFromAPI} records (${progress}%)\n`);
        } else {
          console.log(`   📊 Total inserted so far: ${totalInserted} records\n`);
        }

        // Check if we should continue
        // If we know total pages from API, check against that
        if (totalPagesFromAPI !== null && currentPage >= totalPagesFromAPI) {
          console.log(`✅ Reached last page according to API (page ${totalPagesFromAPI})`);
          hasMorePages = false;
        } else if (records.length < RECORDS_PER_PAGE) {
          // If we got less than expected, might be last page (but continue if API says there's more)
          if (totalPagesFromAPI === null || currentPage < totalPagesFromAPI) {
            console.log(`⚠️  Page ${currentPage} returned ${records.length} records (less than ${RECORDS_PER_PAGE}), but continuing...`);
          } else {
            console.log(`✅ Reached last page (got ${records.length} records, expected ${RECORDS_PER_PAGE})`);
            hasMorePages = false;
          }
        }
        
        if (hasMorePages) {
          currentPage++;
          // Small delay between pages to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ Error processing page ${currentPage}:`, error.message);
        consecutiveEmptyPages++;
        
        // Retry logic: if error, try next page up to max consecutive empty
        if (consecutiveEmptyPages >= maxConsecutiveEmpty) {
          console.log(`🛑 Stopping: ${maxConsecutiveEmpty} consecutive errors/empty pages`);
          hasMorePages = false;
        } else {
          console.log(`⚠️  Retrying next page... (consecutive errors: ${consecutiveEmptyPages}/${maxConsecutiveEmpty})`);
          currentPage++;
          await new Promise(resolve => setTimeout(resolve, 2000)); // Longer delay on error
        }
      }
    }

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n═══════════════════════════════════════════');
    console.log('📊 Sync Summary');
    console.log('═══════════════════════════════════════════');
    console.log(`Total pages processed: ${currentPage - 1}`);
    console.log(`Total records inserted: ${totalInserted}`);
    console.log(`Total records failed: ${totalFailed}`);
    console.log(`Duration: ${duration} seconds`);
    console.log('═══════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

