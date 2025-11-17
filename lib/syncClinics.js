/**
 * Sync function to fetch clinics (faskes) from API and save to database
 */

import { query } from './db.js';
import { fetchJson } from './sync/shared/fetch.js';
import { createSyncLog, updateSyncLogProgress, completeSyncLog } from './sync/shared/syncLog.js';

const API_BASE_URL = 'https://api-ehr-klinik.doctorphc.id/master/faskes';

/**
 * Transform API faskes record to database format
 */
function transformClinicRecord(faskes) {
  const externalId = faskes.uuid || faskes.id;
  if (!externalId) {
    throw new Error('Missing external_id');
  }

  return {
    external_id: externalId,
    name: faskes.nama_faskes || 'Unknown',
    code: faskes.kode_faskes || null,
    client_id: faskes.client_id || null,
  };
}

/**
 * Bulk save clinic records to cache table first
 */
async function bulkSaveClinicRecordsToCache(clinicsData) {
  if (!clinicsData || clinicsData.length === 0) {
    return { inserted: 0, updated: 0, failed: 0 };
  }

  let inserted = 0;
  let updated = 0;
  let failed = 0;

  // Process in smaller chunks to avoid query size limits
  const chunkSize = 50;
  
  for (let i = 0; i < clinicsData.length; i += chunkSize) {
    const chunk = clinicsData.slice(i, i + chunkSize);
    const chunkNum = Math.floor(i / chunkSize) + 1;
    
    try {
      // Check which records already exist in cache
      const externalIds = chunk.map(c => c.external_id).filter(id => id != null);
      let existingIds = new Set();
      
      if (externalIds.length > 0) {
        try {
          const placeholders = externalIds.map(() => '?').join(',');
          const existing = await query(
            `SELECT external_id FROM clinics_cache WHERE external_id IN (${placeholders})`,
            externalIds
          );
          existingIds = new Set(existing.map(row => row.external_id));
        } catch (checkError) {
          console.warn(`⚠️  Failed to check existing records in cache for chunk ${chunkNum}:`, checkError.message);
        }
      }

      // Save each clinic to cache
      for (const clinicData of chunk) {
        try {
          await query(
            `INSERT INTO clinics_cache 
             (external_id, name, code, client_id, external_created_at, external_updated_at, synced_at) 
             VALUES (?, ?, ?, ?, NULL, NULL, NOW())
             ON DUPLICATE KEY UPDATE
               name = VALUES(name),
               code = VALUES(code),
               client_id = VALUES(client_id),
               external_created_at = VALUES(external_created_at),
               external_updated_at = VALUES(external_updated_at),
               synced_at = NOW()`,
            [
              clinicData.external_id,
              clinicData.name,
              clinicData.code,
              clinicData.client_id
            ]
          );

          // Count inserted vs updated
          if (clinicData.external_id && existingIds.has(clinicData.external_id)) {
            updated++;
          } else if (clinicData.external_id) {
            inserted++;
          }
        } catch (error) {
          console.error(`❌ Failed to save clinic to cache ${clinicData.external_id}:`, error.message);
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
    if (i + chunkSize < clinicsData.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`💾 Cache save completed: ${inserted} inserted, ${updated} updated, ${failed} failed`);
  return { inserted, updated, failed };
}

/**
 * Process clinic records from cache to main clinics table
 */
async function processClinicsFromCache() {
  console.log('🔄 Processing clinics from cache to main table...');
  
  let inserted = 0;
  let updated = 0;
  let failed = 0;

  try {
    // Get all records from cache that need to be processed
    const cacheRecords = await query(
      `SELECT * FROM clinics_cache ORDER BY synced_at DESC`
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
        const externalIds = chunk.map(c => c.external_id).filter(id => id != null);
        let existingIds = new Set();
        
        if (externalIds.length > 0) {
          try {
            const placeholders = externalIds.map(() => '?').join(',');
            const existing = await query(
              `SELECT external_id FROM clinics WHERE external_id IN (${placeholders})`,
              externalIds
            );
            existingIds = new Set(existing.map(row => row.external_id));
          } catch (checkError) {
            console.warn(`⚠️  Failed to check existing records for chunk ${chunkNum}:`, checkError.message);
          }
        }

        // Save each clinic to main table
        for (const cacheRecord of chunk) {
          try {
            await query(
              `INSERT INTO clinics 
               (external_id, name, code, client_id, address, city, is_active, created_at, updated_at) 
               VALUES (?, ?, ?, ?, NULL, 'N/A', TRUE, NOW(), NOW())
               ON DUPLICATE KEY UPDATE
                 name = VALUES(name),
                 code = VALUES(code),
                 client_id = VALUES(client_id),
                 updated_at = NOW()`,
              [
                cacheRecord.external_id,
                cacheRecord.name,
                cacheRecord.code,
                cacheRecord.client_id
              ]
            );

            // Count inserted vs updated
            if (cacheRecord.external_id && existingIds.has(cacheRecord.external_id)) {
              updated++;
            } else if (cacheRecord.external_id) {
              inserted++;
            }
          } catch (error) {
            console.error(`❌ Failed to save clinic from cache ${cacheRecord.external_id}:`, error.message);
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
 * Sync clinics (faskes) from API
 * @param {object} options - Sync options
 * @returns {Promise<object>} Sync result
 */
export async function syncClinics(options = {}) {
  const {
    batchSize = 50,
    delayBetweenBatches = 1000,
  } = options;

  const startTime = Date.now();
  let insertedCount = 0;
  let updatedCount = 0;
  let failedCount = 0;
  let fetchedRecords = 0;
  let syncLogId = null;

  try {
    console.log('🔄 Starting clinics (faskes) sync from API...');
    console.log(`⚙️  Config: batchSize=${batchSize}, delayBetweenBatches=${delayBetweenBatches}ms`);

    // Create sync log for progress tracking
    try {
      syncLogId = await createSyncLog('clinics');
      console.log(`📝 Sync log created: ID ${syncLogId}`);
    } catch (error) {
      console.warn('⚠️  Failed to create sync log:', error.message);
    }

    // Fetch all data from API (faskes API doesn't use pagination)
    console.log('📡 Fetching all faskes data from API...');
    
    let allRecords = [];
    try {
      const data = await fetchJson(
        API_BASE_URL,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } },
        3,
        120000 // 2 minutes timeout (clinics API is usually faster)
      );

      // Extract data array from response
      if (Array.isArray(data)) {
        allRecords = data;
      } else if (data.data && Array.isArray(data.data)) {
        allRecords = data.data;
      } else {
        throw new Error('Invalid API response format');
      }

      fetchedRecords = allRecords.length;
      console.log(`✅ Successfully fetched ${fetchedRecords} records from API`);

      // Update progress in sync log
      if (syncLogId) {
        await updateSyncLogProgress(syncLogId, {
          totalRecords: fetchedRecords,
          fetchedRecords: fetchedRecords,
          processedRecords: 0,
          insertedRecords: 0,
          updatedRecords: 0,
          failedRecords: 0,
          currentPage: 1,
          progressPercent: 0,
        });
      }
    } catch (error) {
      console.error('❌ Failed to fetch from API:', error.message);
      throw error;
    }

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
        const clinicsData = [];
        for (const faskes of batch) {
          try {
            const clinicData = transformClinicRecord(faskes);
            clinicsData.push(clinicData);
          } catch (error) {
            console.error(`❌ Failed to transform clinic (external_id: ${faskes.uuid || faskes.id || 'unknown'}):`, error.message);
            failedCount++;
          }
        }

        // Save batch to cache first
        if (clinicsData.length > 0) {
          const result = await bulkSaveClinicRecordsToCache(clinicsData);
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

        // Log progress every 10 batches or every 100 records
        if (batchNum % 10 === 0 || processedRecords % 100 === 0) {
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

    // Process all cached records to main clinics table
    console.log('🔄 Processing cached records to main clinics table...');
    const processResult = await processClinicsFromCache();
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

