#!/usr/bin/env node

/**
 * Script untuk copy data dari clinics_cache ke tabel clinics utama
 * 
 * Usage:
 *   node scripts/copy-cache-to-clinics.js
 */

import { query, closePool } from '../lib/db.js';

async function copyCacheToClinics() {
  console.log('🚀 Starting copy from clinics_cache to clinics table');
  console.log('═══════════════════════════════════════════\n');
  
  const startTime = Date.now();
  let totalCopied = 0;
  let totalUpdated = 0;
  let totalFailed = 0;
  const batchSize = 1000;

  try {
    console.log('🔍 Checking table structure...');
    const columns = await query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'clinics'`
    );
    const existingColumns = new Set(columns.map((col) => col.COLUMN_NAME));
    console.log(`✅ Found ${existingColumns.size} columns in clinics table\n`);

    const [countResult] = await query('SELECT COUNT(*) as total FROM clinics_cache');
    const totalRecords = countResult?.total || 0;
    
    console.log(`📊 Total records in cache: ${totalRecords.toLocaleString('id-ID')}`);
    console.log(`📦 Processing in batches of ${batchSize} records\n`);

    if (totalRecords === 0) {
      console.log('⚠️  No records found in clinics_cache. Nothing to copy.');
      return;
    }

    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const selectColumns = [
          'external_id', 'name', 'code', 'client_id', 'address', 'city', 'phone', 'email',
          'external_created_at', 'external_updated_at'
        ].filter(col => existingColumns.has(col));
        
        const cacheRecords = await query(
          `SELECT ${selectColumns.join(', ')}
          FROM clinics_cache
          ORDER BY id
          LIMIT ${batchSize} OFFSET ${offset}`
        );

        if (!cacheRecords || cacheRecords.length === 0) {
          hasMore = false;
          break;
        }

        console.log(`📥 Processing batch: ${offset + 1} - ${offset + cacheRecords.length} of ${totalRecords}`);

        const externalIds = cacheRecords.map(r => r.external_id).filter(Boolean);
        let existingIds = new Set();
        
        if (externalIds.length > 0) {
          const placeholders = externalIds.map(() => '?').join(',');
          const existingRecords = await query(
            `SELECT external_id FROM clinics WHERE external_id IN (${placeholders})`,
            externalIds
          );
          existingIds = new Set(existingRecords.map(r => r.external_id));
        }

        const insertCols = selectColumns.filter(col => existingColumns.has(col));
        const insertColsList = insertCols.join(', ');
        const placeholders = insertCols.map(() => '?').join(', ');
        
        const updateCols = insertCols.filter(col => col !== 'external_id');
        let updateClauses = updateCols.map(col => `${col} = VALUES(${col})`).join(',\n                ');
        
        if (existingColumns.has('synced_at')) {
          updateClauses = updateClauses ? `${updateClauses},\n                synced_at = NOW()` : 'synced_at = NOW()';
        }

        for (let idx = 0; idx < cacheRecords.length; idx++) {
          const record = cacheRecords[idx];
          try {
            const values = insertCols.map(col => record[col] ?? null);
            
            const expectedPlaceholders = insertCols.length;
            if (values.length !== expectedPlaceholders) {
              console.error(`❌ Mismatch at record ${offset + idx + 1}: ${values.length} values but ${expectedPlaceholders} columns`);
              totalFailed++;
              continue;
            }
            
            await query(
              `INSERT INTO clinics (${insertColsList})
              VALUES (${placeholders})
              ON DUPLICATE KEY UPDATE
                ${updateClauses}`,
              values
            );

            if (existingIds.has(record.external_id)) {
              totalUpdated++;
            } else {
              totalCopied++;
            }
          } catch (error) {
            console.error(`❌ Failed to copy record ${record.external_id}:`, error.message);
            totalFailed++;
          }
        }

        offset += cacheRecords.length;
        
        if (offset % (batchSize * 5) === 0 || offset >= totalRecords) {
          console.log(`✅ Progress: ${offset}/${totalRecords} records processed (${totalCopied} inserted, ${totalUpdated} updated, ${totalFailed} failed)`);
        }

        if (cacheRecords.length < batchSize) {
          hasMore = false;
        }
      } catch (error) {
        console.error(`❌ Error processing batch at offset ${offset}:`, error.message);
        totalFailed += batchSize;
        offset += batchSize;
      }
    }

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

    const [finalCount] = await query('SELECT COUNT(*) as total FROM clinics WHERE external_id IS NOT NULL');
    console.log(`✅ Total records in clinics table: ${finalCount?.total?.toLocaleString('id-ID') || 0}`);

  } catch (error) {
    console.error('\n❌ Copy failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

copyCacheToClinics().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

