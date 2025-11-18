#!/usr/bin/env node

/**
 * Script untuk mengambil data faskes/klinik dari API eksternal
 * dan menyimpannya ke database lokal dengan pagination 1000 record per page
 * 
 * Usage:
 *   node scripts/sync-clinics-paginated.js
 */

import { query, closePool } from '../lib/db.js';
import { fetchJson } from '../lib/sync/shared/fetch.js';

const API_BASE_URL = 'https://api-ehr-klinik.doctorphc.id/master/faskes';
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
 * Transform API clinic record to database format
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
    address: faskes.alamat || null,
    city: faskes.kota || null,
    phone: faskes.telepon || null,
    email: faskes.email || null,
    external_created_at: faskes.created_at || null,
    external_updated_at: faskes.updated_at || null,
  };
}

/**
 * Save clinic records to cache table
 */
async function saveClinicRecords(clinicsData) {
  if (!clinicsData || clinicsData.length === 0) {
    return { inserted: 0, failed: 0 };
  }

  let inserted = 0;
  let failed = 0;

  const chunkSize = 100;
  for (let i = 0; i < clinicsData.length; i += chunkSize) {
    const chunk = clinicsData.slice(i, i + chunkSize);
    const chunkNum = Math.floor(i / chunkSize) + 1;

    for (const clinicData of chunk) {
      try {
        await query(
          `INSERT INTO clinics_cache (
            external_id, name, code, client_id, address, city, phone, email,
            external_created_at, external_updated_at, synced_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            code = VALUES(code),
            client_id = VALUES(client_id),
            address = VALUES(address),
            city = VALUES(city),
            phone = VALUES(phone),
            email = VALUES(email),
            external_created_at = VALUES(external_created_at),
            external_updated_at = VALUES(external_updated_at),
            synced_at = NOW()`,
          [
            clinicData.external_id ?? null,
            clinicData.name ?? null,
            clinicData.code ?? null,
            clinicData.client_id ?? null,
            clinicData.address ?? null,
            clinicData.city ?? null,
            clinicData.phone ?? null,
            clinicData.email ?? null,
            clinicData.external_created_at ?? null,
            clinicData.external_updated_at ?? null,
          ]
        );
        inserted++;
      } catch (error) {
        console.error(`❌ Failed to save clinic ${clinicData.external_id}:`, error.message);
        failed++;
      }
    }
    
    if (chunkNum % 10 === 0) {
      console.log(`   💾 Saved chunk ${chunkNum}: ${inserted} inserted, ${failed} failed`);
    }
  }
  
  return { inserted, failed };
}

/**
 * Fetch clinics page from API
 */
async function fetchClinicsPage(page) {
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
  console.log('🚀 Starting clinics sync with pagination');
  console.log('═══════════════════════════════════════════\n');
  
  const startTime = Date.now();
  let totalInserted = 0;
  let totalFailed = 0;
  let currentPage = 1;
  let hasMorePages = true;
  let consecutiveEmptyPages = 0;
  const maxConsecutiveEmpty = 3;
  let totalRecordsFromAPI = null;
  let totalPagesFromAPI = null;

  try {
    // Step 1: Truncate clinics_cache table
    console.log('🗑️  Truncating clinics_cache table...');
    await query('TRUNCATE TABLE clinics_cache');
    console.log('✅ Table truncated successfully\n');

    // Step 2: Fetch and save data page by page
    console.log(`📥 Fetching data (${RECORDS_PER_PAGE} records per page)...\n`);

    while (hasMorePages) {
      try {
        const result = await fetchClinicsPage(currentPage);
        const records = result.records;
        const pagination = result.pagination;
        
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
          
          if (totalPagesFromAPI !== null && currentPage >= totalPagesFromAPI) {
            console.log(`✅ Reached last page according to API (page ${totalPagesFromAPI})`);
            hasMorePages = false;
            break;
          }
          
          if (consecutiveEmptyPages >= maxConsecutiveEmpty) {
            console.log(`🛑 Stopping: ${maxConsecutiveEmpty} consecutive empty pages`);
            hasMorePages = false;
            break;
          }
          
          currentPage++;
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        consecutiveEmptyPages = 0;

        // Transform records
        const transformedRecords = [];
        for (const record of records) {
          try {
            transformedRecords.push(transformClinicRecord(record));
          } catch (error) {
            console.warn(`⚠️  Failed to transform record:`, error.message);
            totalFailed++;
          }
        }

        // Save to database
        console.log(`💾 Saving ${transformedRecords.length} records to database...`);
        const saveResult = await saveClinicRecords(transformedRecords);
        totalInserted += saveResult.inserted;
        totalFailed += saveResult.failed;

        console.log(`✅ Page ${currentPage} completed: ${saveResult.inserted} inserted, ${saveResult.failed} failed`);
        
        if (totalRecordsFromAPI !== null) {
          const progress = ((totalInserted / totalRecordsFromAPI) * 100).toFixed(1);
          console.log(`   📊 Progress: ${totalInserted}/${totalRecordsFromAPI} records (${progress}%)\n`);
        } else {
          console.log(`   📊 Total inserted so far: ${totalInserted} records\n`);
        }

        // Check if we should continue
        if (totalPagesFromAPI !== null && currentPage >= totalPagesFromAPI) {
          console.log(`✅ Reached last page according to API (page ${totalPagesFromAPI})`);
          hasMorePages = false;
        } else if (records.length < RECORDS_PER_PAGE) {
          if (totalPagesFromAPI === null || currentPage < totalPagesFromAPI) {
            console.log(`⚠️  Page ${currentPage} returned ${records.length} records (less than ${RECORDS_PER_PAGE}), but continuing...`);
          } else {
            console.log(`✅ Reached last page (got ${records.length} records, expected ${RECORDS_PER_PAGE})`);
            hasMorePages = false;
          }
        }
        
        if (hasMorePages) {
          currentPage++;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ Error processing page ${currentPage}:`, error.message);
        consecutiveEmptyPages++;
        
        if (consecutiveEmptyPages >= maxConsecutiveEmpty) {
          console.log(`🛑 Stopping: ${maxConsecutiveEmpty} consecutive errors/empty pages`);
          hasMorePages = false;
        } else {
          console.log(`⚠️  Retrying next page... (consecutive errors: ${consecutiveEmptyPages}/${maxConsecutiveEmpty})`);
          currentPage++;
          await new Promise(resolve => setTimeout(resolve, 2000));
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

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

