#!/usr/bin/env node

/**
 * Script untuk copy data dari visits_cache ke tabel visits utama
 * 
 * Usage:
 *   node scripts/copy-cache-to-visits.js
 */

import { query, closePool } from '../lib/db.js';

/**
 * Copy data from visits_cache to visits table
 */
async function copyCacheToVisits() {
  console.log('🚀 Starting copy from visits_cache to visits table');
  console.log('═══════════════════════════════════════════\n');
  
  const startTime = Date.now();
  let totalCopied = 0;
  let totalUpdated = 0;
  let totalFailed = 0;
  const batchSize = 1000;

  try {
    // Check which columns exist in visits table
    console.log('🔍 Checking table structure...');
    const columns = await query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'visits'`
    );
    const existingColumns = new Set(columns.map((col) => col.COLUMN_NAME));
    console.log(`✅ Found ${existingColumns.size} columns in visits table\n`);

    // Get total count from cache
    const [countResult] = await query('SELECT COUNT(*) as total FROM visits_cache');
    const totalRecords = countResult?.total || 0;
    
    console.log(`📊 Total records in cache: ${totalRecords.toLocaleString('id-ID')}`);
    console.log(`📦 Processing in batches of ${batchSize} records\n`);

    if (totalRecords === 0) {
      console.log('⚠️  No records found in visits_cache. Nothing to copy.');
      return;
    }

    // Process in batches
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        // Fetch batch from cache (only columns that exist in visits table)
        const selectColumns = [
          'external_id', 'visit_number', 'unique_id',
          'patient_nik', 'patient_name', 'patient_nip',
          'patient_no_peserta', 'patient_nama_peserta',
          'patient_gender', 'patient_birth_date', 'patient_department',
          'diagnosis', 'complaint', 'treatment', 'notes', 'assessment',
          'status', 'clinic', 'room', 'visit_date',
          'doctor_name', 'facility_code', 'facility_name',
          'physical_exam', 'prescriptions', 'prescription_count',
          'external_created_at', 'external_updated_at'
        ].filter(col => existingColumns.has(col));
        
        // Use raw query for LIMIT/OFFSET to avoid parameter issues
        const cacheRecords = await query(
          `SELECT ${selectColumns.join(', ')}
          FROM visits_cache
          ORDER BY id
          LIMIT ${batchSize} OFFSET ${offset}`
        );

        if (!cacheRecords || cacheRecords.length === 0) {
          hasMore = false;
          break;
        }

        console.log(`📥 Processing batch: ${offset + 1} - ${offset + cacheRecords.length} of ${totalRecords}`);

        // Check which records already exist (batch check for efficiency)
        const externalIds = cacheRecords.map(r => r.external_id).filter(Boolean);
        let existingIds = new Set();
        
        if (externalIds.length > 0) {
          const placeholders = externalIds.map(() => '?').join(',');
          const existingRecords = await query(
            `SELECT external_id FROM visits WHERE external_id IN (${placeholders})`,
            externalIds
          );
          existingIds = new Set(existingRecords.map(r => r.external_id));
        }

        // Use explicit INSERT query based on columns that exist in visits table
        // Only include columns that exist in both cache and visits
        const insertCols = selectColumns.filter(col => existingColumns.has(col));
        
        // Build INSERT query - use explicit column list
        const insertColsList = insertCols.join(', ');
        const placeholders = insertCols.map(() => '?').join(', ');
        
        // Build UPDATE clause - exclude external_id
        const updateCols = insertCols.filter(col => col !== 'external_id');
        let updateClauses = updateCols.map(col => `${col} = VALUES(${col})`).join(',\n                ');
        
        // Add synced_at to UPDATE if column exists
        if (existingColumns.has('synced_at')) {
          updateClauses = updateClauses ? `${updateClauses},\n                synced_at = NOW()` : 'synced_at = NOW()';
        }

        // Debug: Log first record structure
        if (offset === 0 && cacheRecords.length > 0) {
          console.log(`\n🔍 Debug Info:`);
          console.log(`   Insert columns (${insertCols.length}):`, insertCols.join(', '));
          console.log(`   Placeholders: ${placeholders.split(',').length} placeholders`);
          console.log(`   First record keys:`, Object.keys(cacheRecords[0]).join(', '));
        }

        // Insert/Update each record
        for (let idx = 0; idx < cacheRecords.length; idx++) {
          const record = cacheRecords[idx];
          try {
            // Build values array in exact order of insertCols
            const values = insertCols.map(col => {
              const value = record[col];
              // Handle JSON fields - ensure string format
              if (col === 'physical_exam' && value !== null && value !== undefined) {
                return typeof value === 'string' ? value : JSON.stringify(value);
              }
              return value ?? null;
            });
            
            // Verify counts match before executing
            const expectedPlaceholders = insertCols.length;
            if (values.length !== expectedPlaceholders) {
              console.error(`❌ Mismatch at record ${offset + idx + 1}: ${values.length} values but ${expectedPlaceholders} columns`);
              console.error(`   Columns: ${insertCols.join(', ')}`);
              totalFailed++;
              continue;
            }
            
            await query(
              `INSERT INTO visits (${insertColsList})
              VALUES (${placeholders})
              ON DUPLICATE KEY UPDATE
                ${updateClauses}`,
              values
            );

            // Count based on whether record existed before
            if (existingIds.has(record.external_id)) {
              totalUpdated++;
            } else {
              totalCopied++;
            }
          } catch (error) {
            console.error(`❌ Failed to copy record ${record.external_id}:`, error.message);
            // Log more details for debugging
            if (error.message.includes('Unknown column')) {
              console.error(`   Record data keys:`, Object.keys(record).join(', '));
            }
            totalFailed++;
          }
        }

        offset += cacheRecords.length;
        
        // Show progress
        if (offset % (batchSize * 5) === 0 || offset >= totalRecords) {
          console.log(`✅ Progress: ${offset}/${totalRecords} records processed (${totalCopied} inserted, ${totalUpdated} updated, ${totalFailed} failed)`);
        }

        // Check if we're done
        if (cacheRecords.length < batchSize) {
          hasMore = false;
        }
      } catch (error) {
        console.error(`❌ Error processing batch at offset ${offset}:`, error.message);
        totalFailed += batchSize;
        offset += batchSize; // Skip this batch and continue
      }
    }

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n═══════════════════════════════════════════');
    console.log('📊 Copy Summary');
    console.log('═══════════════════════════════════════════');
    console.log(`Total records in cache: ${totalRecords.toLocaleString('id-ID')}`);
    console.log(`Records inserted: ${totalCopied.toLocaleString('id-ID')}`);
    console.log(`Records updated: ${totalUpdated.toLocaleString('id-ID')}`);
    console.log(`Records failed: ${totalFailed.toLocaleString('id-ID')}`);
    console.log(`Duration: ${duration} seconds`);
    console.log('═══════════════════════════════════════════\n');

    // Verify final count
    const [finalCount] = await query('SELECT COUNT(*) as total FROM visits WHERE external_id IS NOT NULL');
    console.log(`✅ Total records in visits table: ${finalCount?.total?.toLocaleString('id-ID') || 0}`);

  } catch (error) {
    console.error('\n❌ Copy failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run the script
copyCacheToVisits().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

