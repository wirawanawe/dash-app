/**
 * Sync function to fetch patients from API and save to database
 */

import { query } from './db.js';
import { fetchJson } from './sync/shared/fetch.js';
import { createSyncLog, updateSyncLogProgress, completeSyncLog } from './sync/shared/syncLog.js';

const API_BASE_URL = 'https://api-ehr-klinik.doctorphc.id/pasien';

/**
 * Transform API patient record to database format
 */
function transformPatientRecord(patient) {
  const externalId = patient.id || patient.ID || patient.nik || patient.NIK;
  if (!externalId) {
    throw new Error('Missing external_id');
  }

  // Map gender to ENUM format (handle Indonesian: Laki-laki/Perempuan)
  const rawGender = patient.gender || patient.JENIS_KELAMIN || patient.Jenis_Kelamin || '';
  let mappedGender = 'MALE'; // default
  if (rawGender) {
    const genderLower = String(rawGender).toLowerCase();
    if (genderLower.includes('perempuan') || genderLower.includes('wanita') || 
        genderLower.includes('female') || genderLower.includes('woman') || 
        (genderLower.includes('f') && genderLower.length <= 6)) {
      mappedGender = 'FEMALE';
    } else {
      mappedGender = 'MALE';
    }
  }

  return {
    external_id: String(externalId),
    mrn: patient.mrn || patient.MRN || patient.mr_number || null,
    nik: patient.nik || patient.NIK || null,
    name: patient.name || patient.NAMA || patient.Nama_Pasien || null,
    nip: patient.nip || patient.NIP || null,
    no_peserta: patient.no_peserta || patient.No_Peserta || patient.NO_PESERTA || null,
    nama_peserta: patient.nama_peserta || patient.Nama_Peserta || patient.NAMA_PESERTA || null,
    bagian: patient.bagian || patient.Bagian || patient.BAGIAN || patient.department || patient.Department || null,
    birthdate: patient.birthDate || patient.birth_date || patient.TANGGAL_LAHIR || patient.Tgl_Lahir || null,
    gender: mappedGender,
    address: patient.address || patient.ALAMAT || patient.Alamat || null,
    phone: patient.phone || patient.TELEPON || patient.No_Telepon || patient.no_telepon || null,
    email: patient.email || patient.EMAIL || null,
    blood_type: patient.bloodType || patient.GOLONGAN_DARAH || patient.Gol_Darah || null,
    religion: patient.religion || patient.AGAMA || null,
    marital_status: patient.maritalStatus || patient.STATUS_PERKAWINAN || patient.Status_Kawin || null,
    occupation: patient.occupation || patient.PEKERJAAN || null,
    insurance_number: patient.insurance || patient.ASURANSI || patient.insurance_number || null,
    emergency_contact: patient.emergencyContact || patient.KONTAK_DARURAT || null,
    status: patient.status || patient.STATUS || 'active',
    clinic_id: patient.clinic_id || patient.CLINIC_ID || null,
    external_created_at: patient.created_at || patient.CREATED_AT || null,
    external_updated_at: patient.updated_at || patient.UPDATED_AT || null,
  };
}

/**
 * Bulk save patient records to cache table first
 */
async function bulkSavePatientRecordsToCache(patientsData) {
  if (!patientsData || patientsData.length === 0) {
    return { inserted: 0, updated: 0, failed: 0 };
  }

  let inserted = 0;
  let updated = 0;
  let failed = 0;

  // Process in smaller chunks to avoid query size limits
  const chunkSize = 50;
  
  for (let i = 0; i < patientsData.length; i += chunkSize) {
    const chunk = patientsData.slice(i, i + chunkSize);
    const chunkNum = Math.floor(i / chunkSize) + 1;
    
    try {
      // Check which records already exist in cache
      const externalIds = chunk.map(p => p.external_id).filter(id => id != null);
      let existingIds = new Set();
      
      if (externalIds.length > 0) {
        try {
          const placeholders = externalIds.map(() => '?').join(',');
          const existing = await query(
            `SELECT external_id FROM patients_cache WHERE external_id IN (${placeholders})`,
            externalIds
          );
          existingIds = new Set(existing.map(row => row.external_id));
        } catch (checkError) {
          console.warn(`⚠️  Failed to check existing records in cache for chunk ${chunkNum}:`, checkError.message);
        }
      }

      // Save each patient to cache
      for (const patientData of chunk) {
        try {
          await query(
            `INSERT INTO patients_cache (
              external_id, mrn, nik, nip, name, birth_date, gender,
              address, phone, email, insurance, insurance_number,
              no_peserta, nama_peserta, bagian, status,
              external_created_at, external_updated_at, synced_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
              mrn = VALUES(mrn),
              nik = VALUES(nik),
              nip = VALUES(nip),
              name = VALUES(name),
              birth_date = VALUES(birth_date),
              gender = VALUES(gender),
              address = VALUES(address),
              phone = VALUES(phone),
              email = VALUES(email),
              insurance = VALUES(insurance),
              insurance_number = VALUES(insurance_number),
              no_peserta = VALUES(no_peserta),
              nama_peserta = VALUES(nama_peserta),
              bagian = VALUES(bagian),
              status = VALUES(status),
              external_created_at = VALUES(external_created_at),
              external_updated_at = VALUES(external_updated_at),
              synced_at = NOW()`,
            [
              patientData.external_id,
              patientData.mrn,
              patientData.nik,
              patientData.nip,
              patientData.name,
              patientData.birthdate,
              patientData.gender,
              patientData.address,
              patientData.phone,
              patientData.email,
              patientData.insurance_number ? 'BPJS' : null,
              patientData.insurance_number,
              patientData.no_peserta,
              patientData.nama_peserta,
              patientData.bagian,
              patientData.status || 'active',
              patientData.external_created_at,
              patientData.external_updated_at
            ]
          );

          // Count inserted vs updated
          if (patientData.external_id && existingIds.has(patientData.external_id)) {
            updated++;
          } else if (patientData.external_id) {
            inserted++;
          }
        } catch (error) {
          console.error(`❌ Failed to save patient to cache ${patientData.external_id}:`, error.message);
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
    if (i + chunkSize < patientsData.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`💾 Cache save completed: ${inserted} inserted, ${updated} updated, ${failed} failed`);
  return { inserted, updated, failed };
}

/**
 * Normalize gender value to match ENUM('MALE', 'FEMALE')
 */
function normalizeGender(gender) {
  if (!gender) {
    return 'MALE'; // Default value
  }

  const genderLower = String(gender).toLowerCase().trim();
  
  // Check for female indicators
  if (genderLower.includes('perempuan') || 
      genderLower.includes('wanita') || 
      genderLower.includes('female') || 
      genderLower.includes('woman') || 
      genderLower === 'f' ||
      genderLower === 'p') {
    return 'FEMALE';
  }
  
  // Default to MALE for all other cases
  return 'MALE';
}

/**
 * Process patient records from cache to main patients table
 */
async function processPatientsFromCache() {
  console.log('🔄 Processing patients from cache to main table...');
  
  let inserted = 0;
  let updated = 0;
  let failed = 0;

  try {
    // Get all records from cache that need to be processed
    const cacheRecords = await query(
      `SELECT * FROM patients_cache ORDER BY synced_at DESC`
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
        const externalIds = chunk.map(p => p.external_id).filter(id => id != null);
        let existingIds = new Set();
        
        if (externalIds.length > 0) {
          try {
            const placeholders = externalIds.map(() => '?').join(',');
            const existing = await query(
              `SELECT external_id FROM patients WHERE external_id IN (${placeholders})`,
              externalIds
            );
            existingIds = new Set(existing.map(row => row.external_id));
          } catch (checkError) {
            console.warn(`⚠️  Failed to check existing records for chunk ${chunkNum}:`, checkError.message);
          }
        }

        // Save each patient to main table
        for (const cacheRecord of chunk) {
          try {
            // Normalize gender to match ENUM('MALE', 'FEMALE')
            const normalizedGender = normalizeGender(cacheRecord.gender);
            
            await query(
              `INSERT INTO patients (
                external_id, mrn, nik, name, nip, no_peserta, nama_peserta, bagian,
                birthdate, gender, address, phone, email, insurance_number,
                created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
              ON DUPLICATE KEY UPDATE
                mrn = VALUES(mrn),
                nik = VALUES(nik),
                name = VALUES(name),
                nip = VALUES(nip),
                no_peserta = VALUES(no_peserta),
                nama_peserta = VALUES(nama_peserta),
                bagian = VALUES(bagian),
                birthdate = VALUES(birthdate),
                gender = VALUES(gender),
                address = VALUES(address),
                phone = VALUES(phone),
                email = VALUES(email),
                insurance_number = VALUES(insurance_number),
                updated_at = NOW()`,
              [
                cacheRecord.external_id,
                cacheRecord.mrn,
                cacheRecord.nik,
                cacheRecord.name,
                cacheRecord.nip,
                cacheRecord.no_peserta,
                cacheRecord.nama_peserta,
                cacheRecord.bagian,
                cacheRecord.birth_date,
                normalizedGender, // Use normalized gender
                cacheRecord.address,
                cacheRecord.phone,
                cacheRecord.email,
                cacheRecord.insurance_number
              ]
            );

            // Count inserted vs updated
            if (cacheRecord.external_id && existingIds.has(cacheRecord.external_id)) {
              updated++;
            } else if (cacheRecord.external_id) {
              inserted++;
            }
          } catch (error) {
            console.error(`❌ Failed to save patient from cache ${cacheRecord.external_id}:`, error.message);
            failed++;
          }
        }

        // Log progress every 10 chunks
        if (chunkNum % 10 === 0) {
          console.log(`💾 Processed from cache chunk ${chunkNum}: ${inserted} inserted, ${updated} updated`);
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
 * Sync patients from API - Fetch all data with pagination
 * @param {object} options - Sync options
 * @returns {Promise<object>} Sync result
 */
export async function syncPatients(options = {}) {
  const {
    batchSize = 50,
    delayBetweenBatches = 2000,
  } = options;

  const startTime = Date.now();
  let insertedCount = 0;
  let updatedCount = 0;
  let failedCount = 0;
  let fetchedRecords = 0;
  let syncLogId = null;

  try {
    console.log('🔄 Starting patients sync from API...');
    console.log(`⚙️  Config: batchSize=${batchSize}, delayBetweenBatches=${delayBetweenBatches}ms`);

    // Create sync log for progress tracking
    try {
      syncLogId = await createSyncLog('patients');
      console.log(`📝 Sync log created: ID ${syncLogId}`);
    } catch (error) {
      console.warn('⚠️  Failed to create sync log:', error.message);
    }

    // Use pagination to fetch all data
    let allRecords = [];
    const recordsPerPage = 200;
    const delayBetweenPages = 3000;
    
    console.log('📄 Starting pagination to fetch all data...');
    console.log(`⚙️  Using ${recordsPerPage} records per page with ${delayBetweenPages}ms delay`);
    
    let pageNum = 1;
    let consecutiveEmptyPages = 0;
    const maxConsecutiveEmpty = 3;
    
    while (pageNum <= 9999) {
      try {
        console.log(`📄 Fetching page ${pageNum} (limit=${recordsPerPage})...`);
        
        const data = await fetchJson(
          `${API_BASE_URL}?page=${pageNum}&limit=${recordsPerPage}`,
          { method: 'GET', headers: { 'Content-Type': 'application/json' } },
          3,
          180000 // 3 minutes timeout per page (increased for large data)
        );

        const records = data.data || data.Data || data.records || [];
        
        if (records.length === 0) {
          consecutiveEmptyPages++;
          console.log(`⚠️  Page ${pageNum} returned no records (empty count: ${consecutiveEmptyPages})`);
          
          if (consecutiveEmptyPages >= maxConsecutiveEmpty) {
            console.log(`🛑 Stopping: ${maxConsecutiveEmpty} consecutive empty pages`);
            break;
          }
          pageNum++;
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }

        consecutiveEmptyPages = 0;
        allRecords = allRecords.concat(records);
        fetchedRecords = allRecords.length;

        console.log(`✅ Page ${pageNum}: Got ${records.length} records (Total fetched: ${fetchedRecords})`);

        // Update progress in sync log
        if (syncLogId) {
          await updateSyncLogProgress(syncLogId, {
            totalRecords: fetchedRecords,
            fetchedRecords: fetchedRecords,
            processedRecords: 0,
            insertedRecords: 0,
            updatedRecords: 0,
            failedRecords: 0,
            currentPage: pageNum,
            progressPercent: 0,
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
        if (error.message.includes('timeout') || error.message.includes('aborted')) {
          // For timeout errors, wait longer before retrying
          const waitTime = 15000; // 15 seconds
          console.log(`⏸️  Timeout detected. Waiting ${waitTime/1000} seconds before continuing to next page...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          // For other errors, shorter wait
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        pageNum++;
      }
    }

    fetchedRecords = allRecords.length;
    console.log(`📊 Total records fetched: ${fetchedRecords}`);

    if (allRecords.length === 0) {
      if (syncLogId) {
        await completeSyncLog(syncLogId, {
          status: 'completed',
          fetchedRecords: 0,
          insertedRecords: 0,
          updatedRecords: 0,
          failedRecords: 0,
          totalRecords: 0,
          processedRecords: 0,
          durationSeconds: Math.round((Date.now() - startTime) / 1000),
        });
      }
      return {
        success: true,
        message: 'No records found in API',
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
        currentPage: 0,
        progressPercent: 0,
      });
    }

    // Process all records in batches
    console.log(`🔄 Processing ${allRecords.length} records in batches of ${batchSize}...`);
    const totalBatches = Math.ceil(allRecords.length / batchSize);
    
    for (let i = 0; i < allRecords.length; i += batchSize) {
      const batch = allRecords.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const processedRecords = Math.min(i + batchSize, allRecords.length);

      try {
        // Transform batch
        const patientsData = [];
        for (const patient of batch) {
          try {
            const patientData = transformPatientRecord(patient);
            patientsData.push(patientData);
          } catch (error) {
            console.error(`❌ Failed to transform patient (external_id: ${patient.id || patient.ID || patient.nik || 'unknown'}):`, error.message);
            failedCount++;
          }
        }

        // Save batch to cache first
        if (patientsData.length > 0) {
          const result = await bulkSavePatientRecordsToCache(patientsData);
          insertedCount += result.inserted;
          updatedCount += result.updated;
          failedCount += result.failed;
          
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

    // Process all cached records to main patients table
    console.log('🔄 Processing cached records to main patients table...');
    const processResult = await processPatientsFromCache();
    const mainInserted = processResult.inserted;
    const mainUpdated = processResult.updated;
    const mainFailed = processResult.failed;

    const duration = Math.round((Date.now() - startTime) / 1000);

    // Complete sync log
    if (syncLogId) {
      await completeSyncLog(syncLogId, {
        status: 'completed',
        fetchedRecords,
        insertedRecords: mainInserted,
        updatedRecords: mainUpdated,
        failedRecords: failedCount + mainFailed,
        totalRecords: fetchedRecords,
        processedRecords: mainInserted + mainUpdated,
        durationSeconds: duration,
      });
    }

    console.log(`✅ Sync completed in ${duration}s`);
    console.log(`   Fetched: ${fetchedRecords}`);
    console.log(`   Cache: Inserted: ${insertedCount}, Updated: ${updatedCount}, Failed: ${failedCount}`);
    console.log(`   Main Table: Inserted: ${mainInserted}, Updated: ${mainUpdated}, Failed: ${mainFailed}`);

    return {
      success: true,
      fetched: fetchedRecords,
      inserted: mainInserted,
      updated: mainUpdated,
      failed: failedCount + mainFailed,
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

