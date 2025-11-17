/**
 * Simple sync function to fetch visits from API and save to database
 */

import { query } from './db.js';
import { fetchJson } from './sync/shared/fetch.js';
import { normalizePrescriptions } from './sync/shared/normalize.js';
import { createSyncLog, updateSyncLogProgress, completeSyncLog } from './sync/shared/syncLog.js';

const API_BASE_URL = 'https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan';
const NO_LIMIT_FETCH_STRATEGIES = [
  (page = 1) => `${API_BASE_URL}?page=${page}&limit=0`,
  (page = 1) => `${API_BASE_URL}?page=${page}&limit=all`,
  (page = 1) => `${API_BASE_URL}?page=${page}`,
];

function extractRecordsFromApiResponse(data, pageNum = null) {
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

  const context = pageNum ? ` on page ${pageNum}` : '';
  console.warn(`⚠️  Unexpected API response format${context}:`, JSON.stringify(data).substring(0, 500));
  return [];
}

async function fetchAllRecordsWithoutLimit({
  page = 1,
  retries = 2,
  timeout = 300000,
  syncLogId = null,
} = {}) {
  let lastError = null;

  for (const buildUrl of NO_LIMIT_FETCH_STRATEGIES) {
    const url = buildUrl(page);
    try {
      console.log(`📡 Attempting full fetch without limit via ${url}`);
      const data = await fetchJson(
        url,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } },
        retries,
        timeout
      );

      const records = extractRecordsFromApiResponse(data);
      if (!records.length) {
        console.warn(`⚠️  Full fetch attempt returned 0 records (${url}). Trying next strategy...`);
        continue;
      }

      if (syncLogId) {
        await updateSyncLogProgress(syncLogId, {
          totalRecords: records.length,
          fetchedRecords: records.length,
          processedRecords: 0,
          insertedRecords: 0,
          updatedRecords: 0,
          failedRecords: 0,
          currentPage: page,
          progressPercent: 0,
        });
      }

      return { records, url };
    } catch (error) {
      lastError = error;
      console.error(`❌ Full fetch attempt failed (${url}):`, error.message);
    }
  }

  throw lastError || new Error('Unable to fetch records without limit');
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
    prescriptions: JSON.stringify(normalizedPrescriptions),
    prescription_count: normalizedPrescriptions.length,
  };
}

/**
 * Bulk save visit records to cache table first
 */
async function bulkSaveVisitRecordsToCache(visitsData) {
  if (!visitsData || visitsData.length === 0) {
    return { inserted: 0, updated: 0, failed: 0 };
  }

  let inserted = 0;
  let updated = 0;
  let failed = 0;

  // Process in smaller chunks to avoid query size limits
  const chunkSize = 50;
  
  for (let i = 0; i < visitsData.length; i += chunkSize) {
    const chunk = visitsData.slice(i, i + chunkSize);
    const chunkNum = Math.floor(i / chunkSize) + 1;
    
    try {
      // Check which records already exist in cache
      const externalIds = chunk.map(v => v.external_id).filter(id => id != null);
      let existingIds = new Set();
      
      if (externalIds.length > 0) {
        try {
          const placeholders = externalIds.map(() => '?').join(',');
          const existing = await query(
            `SELECT external_id FROM visits_cache WHERE external_id IN (${placeholders})`,
            externalIds
          );
          existingIds = new Set(existing.map(row => row.external_id));
        } catch (checkError) {
          console.warn(`⚠️  Failed to check existing records in cache for chunk ${chunkNum}:`, checkError.message);
        }
      }

      // Save to cache table
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
              visitData.status ?? 'Selesai',
              visitData.clinic ?? null,
              visitData.room ?? null,
              visitData.visit_date ?? null,
              visitData.doctor_name ?? null,
              visitData.facility_code ?? null,
              visitData.facility_name ?? null,
              visitData.physical_exam ?? null,
              visitData.external_created_at ?? null,
              visitData.external_updated_at ?? null
            ]
          );

          // Count inserted vs updated
          if (visitData.external_id && existingIds.has(visitData.external_id)) {
            updated++;
          } else if (visitData.external_id) {
            inserted++;
          }
        } catch (error) {
          console.error(`❌ Failed to save visit to cache ${visitData.external_id}:`, error.message);
          failed++;
        }
      }

      // Log progress every 10 chunks
      if (chunkNum % 10 === 0) {
        console.log(`💾 Saved to cache chunk ${chunkNum}: ${inserted} inserted, ${updated} updated`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to bulk save to cache chunk ${chunkNum}:`, error.message);
      failed += chunk.length;
    }
    
    // Add delay between chunks to reduce CPU load
    if (i + chunkSize < visitsData.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`💾 Cache save completed: ${inserted} inserted, ${updated} updated, ${failed} failed`);
  return { inserted, updated, failed };
}

/**
 * Process visit records from cache to main visits table
 */
async function processVisitsFromCache() {
  console.log('🔄 Processing visits from cache to main table...');
  
  let inserted = 0;
  let updated = 0;
  let failed = 0;

  try {
    // Get all records from cache that need to be processed
    const cacheRecords = await query(
      `SELECT * FROM visits_cache ORDER BY synced_at DESC`
    );

    if (cacheRecords.length === 0) {
      console.log('ℹ️  No records in cache to process');
      return { inserted: 0, updated: 0, failed: 0 };
    }

    console.log(`📊 Found ${cacheRecords.length} records in cache to process`);

    // Process in chunks
    const chunkSize = 50;
    
    for (let i = 0; i < cacheRecords.length; i += chunkSize) {
      const chunk = cacheRecords.slice(i, i + chunkSize);
      const chunkNum = Math.floor(i / chunkSize) + 1;
      
      try {
        // Check which records already exist in main table
        const externalIds = chunk.map(v => v.external_id).filter(id => id != null);
        let existingIds = new Set();
        
        if (externalIds.length > 0) {
          try {
            const placeholders = externalIds.map(() => '?').join(',');
            const existing = await query(
              `SELECT external_id FROM visits WHERE external_id IN (${placeholders})`,
              externalIds
            );
            existingIds = new Set(existing.map(row => row.external_id));
          } catch (checkError) {
            console.warn(`⚠️  Failed to check existing records for chunk ${chunkNum}:`, checkError.message);
          }
        }

        const values = chunk.map(() => 
          '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())'
        ).join(', ');
        
        const params = chunk.flatMap(cacheRecord => [
          cacheRecord.external_id ?? null,
          cacheRecord.visit_number ?? null,
          cacheRecord.unique_id ?? null,
          cacheRecord.patient_nik ?? null,
          cacheRecord.patient_name ?? null,
          cacheRecord.patient_nip ?? null,
          cacheRecord.patient_no_peserta ?? null,
          cacheRecord.patient_nama_peserta ?? null,
          cacheRecord.patient_gender ?? null,
          cacheRecord.patient_birth_date ?? null,
          cacheRecord.patient_department ?? null,
          cacheRecord.diagnosis ?? null,
          cacheRecord.complaint ?? null,
          cacheRecord.treatment ?? null,
          cacheRecord.notes ?? null,
          cacheRecord.assessment ?? null,
          cacheRecord.status ?? 'Selesai',
          cacheRecord.clinic ?? null,
          cacheRecord.room ?? null,
          cacheRecord.visit_date ?? null,
          cacheRecord.doctor_name ?? null,
          cacheRecord.facility_code ?? null,
          cacheRecord.facility_name ?? null,
          cacheRecord.physical_exam ?? null,
          cacheRecord.external_created_at ?? null,
          cacheRecord.external_updated_at ?? null,
          JSON.stringify([]), // prescriptions - empty for now, can be enhanced later
          0 // prescription_count
        ]);

        await query(
          `INSERT INTO visits (
            external_id, visit_number, unique_id,
            patient_nik, patient_name, patient_nip,
            patient_no_peserta, patient_nama_peserta,
            patient_gender, patient_birth_date, patient_department,
            diagnosis, complaint, treatment, notes, assessment,
            status, clinic, room, visit_date,
            doctor_name, facility_code, facility_name,
            physical_exam, external_created_at, external_updated_at,
            prescriptions, prescription_count, synced_at
          ) VALUES ${values}
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
            prescriptions = VALUES(prescriptions),
            prescription_count = VALUES(prescription_count),
            synced_at = NOW()`,
          params
        );

        // Count inserted vs updated
        let chunkInserted = 0;
        let chunkUpdated = 0;
        
        for (const cacheRecord of chunk) {
          if (cacheRecord.external_id && existingIds.has(cacheRecord.external_id)) {
            chunkUpdated++;
          } else if (cacheRecord.external_id) {
            chunkInserted++;
          }
        }

        inserted += chunkInserted;
        updated += chunkUpdated;

        // Log progress every 10 chunks
        if (chunkNum % 10 === 0) {
          console.log(`💾 Processed from cache chunk ${chunkNum}: ${chunkInserted} inserted, ${chunkUpdated} updated`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to process from cache chunk ${chunkNum}:`, error.message);
        failed += chunk.length;
      }
      
      // Add delay between chunks to reduce CPU load
      if (i + chunkSize < cacheRecords.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ Cache processing completed: ${inserted} inserted, ${updated} updated, ${failed} failed`);
    return { inserted, updated, failed };

  } catch (error) {
    console.error('❌ Error processing from cache:', error);
    return { inserted: 0, updated: 0, failed: 0 };
  }
}

/**
 * Sync visits from API - Fetch all data in one go (no limit, no pagination)
 * @param {object} options - Sync options
 * @returns {Promise<object>} Sync result
 */
export async function syncVisits(options = {}) {
  const {
    batchSize = 50, // Smaller batch size untuk mengurangi load CPU
    delayBetweenBatches = 2000, // 2 detik delay antar batch untuk mengurangi load CPU API
  } = options;

  const startTime = Date.now();
  let insertedCount = 0;
  let updatedCount = 0;
  let failedCount = 0;
  let fetchedRecords = 0;
  let syncLogId = null;

  try {
    console.log('🔄 Starting visits sync from API...');
    console.log(`📡 API URL: ${API_BASE_URL}`);
    console.log(`⚙️  Config: batchSize=${batchSize}, delayBetweenBatches=${delayBetweenBatches}ms`);

    const normalizedMode = typeof options.mode === 'string' ? options.mode.toLowerCase() : 'full';
    const isLimitedMode = ['limited', 'limit', 'update', 'incremental', 'partial'].includes(normalizedMode);
    const requestedLimit = parseInt(options.limit ?? options.fetchLimit ?? options.recordsPerPage ?? (isLimitedMode ? 200 : 1000), 10);
    const fallbackRecordsPerPage = parseInt(options.recordsPerPage ?? (isLimitedMode ? 200 : 1000), 10);
    const safeLimit = Number.isNaN(requestedLimit) ? (isLimitedMode ? 200 : 1000) : Math.max(1, Math.min(requestedLimit, 1000));
    const recordsPerPage = isLimitedMode
      ? safeLimit
      : (Number.isNaN(fallbackRecordsPerPage) ? 1000 : Math.max(1, Math.min(fallbackRecordsPerPage, 1000)));
    const pagesToFetch = Math.max(1, parseInt(options.pages ?? options.updatePages ?? 1, 10) || 1);
    // For 1000 records per page, use longer delay to avoid API overload
    const paginationDelay = options.paginationDelay ?? (isLimitedMode ? 1500 : (recordsPerPage >= 1000 ? 5000 : 3000));
    const maxConsecutiveEmpty = isLimitedMode ? 2 : 5;
    const fullFetchTimeout = options.fullFetchTimeout || 300000;
    const fullFetchRetries = options.fullFetchRetries || 2;
    const maxPagesToFetch = isLimitedMode ? pagesToFetch : 9999;

    if (isLimitedMode) {
      console.log(`🚦 Sync mode: LIMITED (update latest data)`);
      console.log(`📏 Limit per page: ${recordsPerPage}, pages to fetch: ${maxPagesToFetch}`);
    } else {
      console.log(`🚦 Sync mode: FULL (attempt no-limit fetch first)`);
      console.log(`📥 Will try to fetch the entire dataset without limit before falling back to pagination`);
    }

    // Create sync log for progress tracking
    try {
      syncLogId = await createSyncLog('visits');
      console.log(`📝 Sync log created: ID ${syncLogId}`);
    } catch (error) {
      console.warn('⚠️  Failed to create sync log:', error.message);
    }

    // Test API connection first (with longer timeout and more retries)
    try {
      console.log('🔍 Testing API connection...');
      console.log(`📡 Testing URL: ${API_BASE_URL}?page=1&limit=1`);
      const testData = await fetchJson(
        `${API_BASE_URL}?page=1&limit=1`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } },
        3, // 3 retries for test
        120000 // 2 minutes timeout for test (API might be slow)
      );
      console.log('✅ API connection test successful');
      if (testData) {
        console.log(`📊 Test response structure:`, Object.keys(testData || {}));
        // Check if we got valid data structure
        const hasData = Array.isArray(testData) || 
                       (testData.data && Array.isArray(testData.data)) ||
                       (testData.Data && Array.isArray(testData.Data)) ||
                       (testData.records && Array.isArray(testData.records));
        if (!hasData) {
          console.warn('⚠️  API response structure might be unexpected:', JSON.stringify(testData).substring(0, 200));
        }
      }
    } catch (testError) {
      console.error('❌ API connection test failed:', testError.message);
      console.error('   This might indicate:');
      console.error('   - API endpoint is down or unreachable');
      console.error('   - Network connectivity issues');
      console.error('   - API requires authentication');
      console.error('   - API is very slow (timeout)');
      console.warn('⚠️  Continuing anyway - will attempt to fetch data...');
      // Don't throw error, just log warning and continue
      // The actual fetch will fail if API is really down
    }

    let allRecords = [];
    let usePagination = true;
    const delayBetweenPages = paginationDelay;
    const maxConsecutiveEmptyPages = maxConsecutiveEmpty;
    
    if (!isLimitedMode) {
      try {
        const { records, url } = await fetchAllRecordsWithoutLimit({
          syncLogId,
          retries: fullFetchRetries,
          timeout: fullFetchTimeout,
        });
        // Only use no-limit fetch if we got a reasonable amount of data
        // If we got very few records (< 100), it's likely a sample/error, so use pagination instead
        if (records.length >= 100) {
          allRecords = records;
          fetchedRecords = records.length;
          usePagination = false;
          console.log(`✅ Successfully fetched ${records.length} records without limit via ${url}`);
        } else {
          console.warn(`⚠️  No-limit fetch returned only ${records.length} records (likely incomplete). Falling back to pagination...`);
          // Continue to pagination below
        }
      } catch (noLimitError) {
        console.warn(`⚠️  Unable to fetch all data without limit: ${noLimitError.message}`);
        console.warn('⚠️  Falling back to paginated fetch...');
      }
    }

    if (usePagination) {
      console.log(
        isLimitedMode
          ? '📄 Fetching recent data using limited pagination...'
          : '📄 Starting pagination to fetch all data...'
      );
      console.log(`⚙️  Using ${recordsPerPage} records per page with ${delayBetweenPages}ms delay`);
    }
    
    if (usePagination) {
      let pageNum = 1;
      let consecutiveEmptyPages = 0;
      let lastNonEmptyPage = 0; // Track last page that had data
      let pagesAttempted = 0;
      
      while (pageNum <= 9999 && pagesAttempted < maxPagesToFetch) {
        pagesAttempted++;
        try {
          console.log(`📄 Fetching page ${pageNum} (limit=${recordsPerPage})...`);
          
        // Use longer timeout for larger page sizes (1000 records might take longer)
        const pageTimeout = recordsPerPage >= 1000 ? 120000 : 180000; // 2 min for 1000, 3 min for smaller
        const data = await fetchJson(
          `${API_BASE_URL}?page=${pageNum}&limit=${recordsPerPage}`,
          { method: 'GET', headers: { 'Content-Type': 'application/json' } },
          3,
          pageTimeout
        );

          // Validate response structure
          if (!data) {
            throw new Error('API returned empty or null response');
          }

          // Try different possible response formats
          const records = extractRecordsFromApiResponse(data, pageNum);
          
          // Check if we got less records than expected (might be last page)
          const isPartialPage = records.length > 0 && records.length < recordsPerPage;
          const isEmptyPage = records.length === 0;
          
          if (isEmptyPage) {
            consecutiveEmptyPages++;
            console.log(`⚠️  Page ${pageNum} returned no records (empty count: ${consecutiveEmptyPages})`);
            
            // Only stop if we've had multiple consecutive empty pages AND we've fetched at least some data
            // This prevents stopping too early if API has gaps
            // Also check if we're far past the last non-empty page
            const pagesSinceLastData = pageNum - lastNonEmptyPage;
            
            if (consecutiveEmptyPages >= maxConsecutiveEmptyPages && fetchedRecords > 0) {
              // If we've had many empty pages and we're far past last data, stop
              if (pagesSinceLastData >= maxConsecutiveEmptyPages) {
                console.log(`🛑 Stopping: ${maxConsecutiveEmptyPages} consecutive empty pages (already fetched ${fetchedRecords} records, last data at page ${lastNonEmptyPage})`);
                break;
              }
              // If we're not far past last data, continue (might be temporary gap)
              console.log(`⚠️  Empty page but only ${pagesSinceLastData} pages since last data, continuing...`);
            }
            // If we haven't fetched any data yet, continue longer (might be API issue)
            if (fetchedRecords === 0 && consecutiveEmptyPages >= 10) {
              console.log(`🛑 Stopping: No data found after ${consecutiveEmptyPages} pages`);
              break;
            }
            pageNum++;
            await new Promise(resolve => setTimeout(resolve, delayBetweenPages));
            continue;
          }

          consecutiveEmptyPages = 0;
          lastNonEmptyPage = pageNum; // Update last non-empty page
          allRecords = allRecords.concat(records);
          fetchedRecords = allRecords.length;

          console.log(`✅ Page ${pageNum}: Got ${records.length} records (Total fetched: ${fetchedRecords})${isPartialPage ? ' [Partial page - might be last]' : ''}`);
          
          // If we got a partial page (less than recordsPerPage), check a few more pages to be sure
          // This ensures we don't miss data if API has inconsistent page sizes
          if (isPartialPage && pageNum - lastNonEmptyPage < 3) {
            console.log(`📌 Partial page detected, will check ${3 - (pageNum - lastNonEmptyPage)} more pages to ensure completeness`);
          }

          // Update progress in sync log
          if (syncLogId) {
            await updateSyncLogProgress(syncLogId, {
              totalRecords: fetchedRecords, // Will be updated as we fetch more
              fetchedRecords: fetchedRecords,
              processedRecords: 0,
              insertedRecords: 0,
              updatedRecords: 0,
              failedRecords: 0,
              currentPage: pageNum,
              progressPercent: 0, // Will be calculated during processing
            });
          }

          // Log progress every 10 pages or every 2000 records
          if (pageNum % 10 === 0 || fetchedRecords % 2000 === 0) {
            console.log(`📊 Progress: Page ${pageNum}, Total fetched: ${fetchedRecords} records`);
          }

          // CPU-friendly throttling between pages
          await new Promise(resolve => setTimeout(resolve, delayBetweenPages));
          pageNum++;
        } catch (error) {
          console.error(`❌ Failed to fetch page ${pageNum}:`, error.message);
          console.error(`   Error details:`, error);
          console.error(`   URL: ${API_BASE_URL}?page=${pageNum}&limit=${recordsPerPage}`);
          
          // If this is the first page and it fails, throw error immediately
          if (pageNum === 1 && fetchedRecords === 0) {
            console.error('❌ CRITICAL: Failed to fetch first page. Cannot continue sync.');
            throw new Error(`Failed to fetch first page from API: ${error.message}`);
          }
          
          // For subsequent pages, log error but continue
          if (error.message.includes('timeout') || error.message.includes('aborted')) {
            // For timeout errors, wait longer before retrying
            const waitTime = 15000; // 15 seconds
            console.log(`⏸️  Timeout detected. Waiting ${waitTime/1000} seconds before continuing to next page...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else if (error.message.includes('HTTP 4')) {
            // For 4xx errors (client errors), stop immediately
            console.error(`❌ HTTP 4xx error detected. Stopping sync.`);
            throw new Error(`API returned client error: ${error.message}`);
          } else {
            // For other errors, shorter wait and continue
            console.warn(`⚠️  Non-critical error, continuing to next page...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
          pageNum++;
        }
      }
    }

    fetchedRecords = allRecords.length;
    console.log(`📊 Total records fetched: ${fetchedRecords}`);

    if (allRecords.length === 0) {
      const errorMsg = 'No records found in API. This might indicate an API issue or authentication problem.';
      console.error(`❌ ${errorMsg}`);
      
      if (syncLogId) {
        await completeSyncLog(syncLogId, {
          status: 'failed',
          fetchedRecords: 0,
          insertedRecords: 0,
          updatedRecords: 0,
          failedRecords: 0,
          totalRecords: 0,
          processedRecords: 0,
          errorMessage: errorMsg,
          durationSeconds: Math.round((Date.now() - startTime) / 1000),
        });
      }
      return {
        success: false,
        error: errorMsg,
        message: errorMsg,
        fetched: 0,
        inserted: 0,
        updated: 0,
        failed: 0,
        duration: Math.round((Date.now() - startTime) / 1000),
      };
    }

    // Update sync log with final total records count
    if (syncLogId) {
      await updateSyncLogProgress(syncLogId, {
        totalRecords: allRecords.length,
        fetchedRecords: allRecords.length,
        processedRecords: 0,
        insertedRecords: 0,
        updatedRecords: 0,
        failedRecords: 0,
        currentPage: 0, // Reset page counter for processing phase
        progressPercent: 0,
      });
    }

    // Process all records in batches with CPU-friendly throttling
    console.log(`🔄 Processing ${allRecords.length} records in batches of ${batchSize}...`);
    const totalBatches = Math.ceil(allRecords.length / batchSize);
    
    for (let i = 0; i < allRecords.length; i += batchSize) {
      const batch = allRecords.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const processedRecords = Math.min(i + batchSize, allRecords.length);

      try {
        // Transform batch
        const visitsData = [];
        for (const visit of batch) {
          try {
            const visitData = transformVisitRecord(visit);
            visitsData.push(visitData);
          } catch (error) {
            console.error(`❌ Failed to transform visit (external_id: ${visit.ID || visit.No_Kunjungan || 'unknown'}):`, error.message);
            failedCount++;
          }
        }

        // Save batch to cache first
        if (visitsData.length > 0) {
          const result = await bulkSaveVisitRecordsToCache(visitsData);
          insertedCount += result.inserted;
          updatedCount += result.updated;
          failedCount += result.failed;
          
          // Log if there are failures in this batch
          if (result.failed > 0) {
            console.warn(`⚠️  Batch ${batchNum}: ${result.failed} records failed to save to cache`);
          }
        } else {
          console.warn(`⚠️  Batch ${batchNum}: No valid data to save after transformation`);
          failedCount += batch.length;
        }

        // Update progress in sync log
        if (syncLogId) {
          await updateSyncLogProgress(syncLogId, {
            totalRecords: allRecords.length,
            fetchedRecords: allRecords.length,
            processedRecords: processedRecords,
            insertedRecords: insertedCount,
            updatedRecords: updatedCount,
            failedRecords: failedCount,
            progressPercent: Math.round((processedRecords / allRecords.length) * 100),
          });
        }

        // Log progress every 10 batches or every 1000 records
        if (batchNum % 10 === 0 || processedRecords % 1000 === 0) {
          const progress = Math.round((processedRecords / allRecords.length) * 100);
          console.log(`📊 Progress: ${progress}% (${processedRecords}/${allRecords.length} records, Batch ${batchNum}/${totalBatches})`);
        }

        // CPU-friendly throttling between batches
        if (i + batchSize < allRecords.length) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
      } catch (error) {
        console.error(`Failed to process batch ${batchNum}:`, error.message);
        failedCount += batch.length;
      }
    }

    // Process all cached records to main visits table
    console.log('🔄 Processing cached records to main visits table...');
    const processResult = await processVisitsFromCache();
    const mainInserted = processResult.inserted;
    const mainUpdated = processResult.updated;
    const mainFailed = processResult.failed;

    // After all records are synced, remove records that don't exist in API
    console.log('🧹 Cleaning up records that don\'t exist in API...');
    let deletedCount = 0;
    
    try {
      // Get all external_ids from synced records
      const syncedExternalIds = allRecords
        .map(visit => visit.ID || visit.No_Kunjungan)
        .filter(id => id != null)
        .map(id => String(id));
      
      if (syncedExternalIds.length > 0) {
        // Delete records that are not in the synced list
        // Process in chunks to avoid query size limits
        const deleteChunkSize = 1000;
        
        // First, get all external_ids currently in database
        const existingRecords = await query(
          `SELECT external_id FROM visits WHERE external_id IS NOT NULL`
        );
        const existingExternalIds = new Set(existingRecords.map(r => String(r.external_id)));
        const syncedExternalIdsSet = new Set(syncedExternalIds);
        
        // Find external_ids to delete (exist in DB but not in API)
        const idsToDelete = Array.from(existingExternalIds).filter(id => !syncedExternalIdsSet.has(id));
        
        if (idsToDelete.length > 0) {
          console.log(`🗑️  Found ${idsToDelete.length} records to delete (not in API)`);
          
          // Delete in chunks
          for (let i = 0; i < idsToDelete.length; i += deleteChunkSize) {
            const chunk = idsToDelete.slice(i, i + deleteChunkSize);
            const chunkPlaceholders = chunk.map(() => '?').join(',');
            
            const deleteResult = await query(
              `DELETE FROM visits WHERE external_id IN (${chunkPlaceholders})`,
              chunk
            );
            
            deletedCount += deleteResult.affectedRows || 0;
          }
          
          console.log(`✅ Deleted ${deletedCount} records that don't exist in API`);
        } else {
          console.log('✅ No records to delete - all records are in sync with API');
        }
      }
    } catch (cleanupError) {
      console.error('⚠️  Error during cleanup:', cleanupError.message);
      // Don't fail the sync if cleanup fails
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    // Complete sync log
    if (syncLogId) {
      await completeSyncLog(syncLogId, {
        status: 'completed',
        fetchedRecords,
        insertedRecords: insertedCount,
        updatedRecords: updatedCount,
        failedRecords: failedCount,
        totalRecords: fetchedRecords,
        processedRecords: insertedCount + updatedCount,
        durationSeconds: duration,
      });
    }

    console.log(`✅ Sync completed in ${duration}s`);
    console.log(`   Fetched: ${fetchedRecords}`);
    console.log(`   Cache: Inserted: ${insertedCount}, Updated: ${updatedCount}, Failed: ${failedCount}`);
    console.log(`   Main Table: Inserted: ${mainInserted}, Updated: ${mainUpdated}, Failed: ${mainFailed}`);
    console.log(`   Deleted: ${deletedCount}`);

    return {
      success: true,
      fetched: fetchedRecords,
      inserted: mainInserted,
      updated: mainUpdated,
      failed: failedCount + mainFailed,
      deleted: deletedCount,
      total: fetchedRecords,
      processed: mainInserted + mainUpdated,
      cacheStats: {
        inserted: insertedCount,
        updated: updatedCount,
        failed: failedCount
      },
      duration,
    };

  } catch (error) {
    console.error('❌ Sync error:', error);
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    // Mark sync log as failed
    if (syncLogId) {
      await completeSyncLog(syncLogId, {
        status: 'failed',
        fetchedRecords,
        insertedRecords: insertedCount,
        updatedRecords: updatedCount,
        failedRecords: failedCount,
        totalRecords: fetchedRecords,
        processedRecords: insertedCount + updatedCount,
        errorMessage: error.message,
        durationSeconds: duration,
      });
    }
    
    return {
      success: false,
      error: error.message,
      fetched: fetchedRecords,
      inserted: insertedCount,
      updated: updatedCount,
      failed: failedCount,
      duration,
    };
  }
}

