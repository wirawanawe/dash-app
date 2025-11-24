#!/usr/bin/env node

/**
 * Script untuk membandingkan jumlah data di API vs Database
 */

import { query, closePool } from '../lib/db.js';
import { fetchJson } from '../lib/sync/shared/fetch.js';

const API_BASE_URL = 'https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan';

async function compareCounts() {
  console.log('🔍 Comparing API vs Database counts...');
  console.log('═══════════════════════════════════════════\n');

  try {
    // 1. Get count from database
    console.log('📊 Checking database...');
    const [dbCount] = await query('SELECT COUNT(*) as total FROM visits WHERE external_id IS NOT NULL');
    const [dbUnique] = await query('SELECT COUNT(DISTINCT external_id) as total FROM visits WHERE external_id IS NOT NULL');
    const [dbCache] = await query('SELECT COUNT(*) as total FROM visits_cache');
    
    console.log(`   Database visits (with external_id): ${dbCount.total.toLocaleString('id-ID')}`);
    console.log(`   Database unique external_ids: ${dbUnique.total.toLocaleString('id-ID')}`);
    console.log(`   Database visits_cache: ${dbCache.total.toLocaleString('id-ID')}`);

    // 2. Try to get count from API
    console.log('\n📡 Checking API...');
    try {
      // Try to get total from API response
      const url = `${API_BASE_URL}?limit=1&page=1`;
      const data = await fetchJson(
        url,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } },
        3,
        60000
      );

      let apiTotal = null;
      if (data.total !== undefined) {
        apiTotal = data.total;
      } else if (data.Total !== undefined) {
        apiTotal = data.Total;
      } else if (data.totalRecords !== undefined) {
        apiTotal = data.totalRecords;
      } else if (data.total_records !== undefined) {
        apiTotal = data.total_records;
      }

      if (apiTotal !== null) {
        console.log(`   API total records: ${apiTotal.toLocaleString('id-ID')}`);
      } else {
        console.log(`   ⚠️  API tidak mengembalikan total count`);
      }

      // Try to fetch first page to see actual records
      const url2 = `${API_BASE_URL}?limit=1000&page=1`;
      const data2 = await fetchJson(
        url2,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } },
        2,
        60000
      );

      let records = [];
      if (Array.isArray(data2)) {
        records = data2;
      } else if (Array.isArray(data2.data)) {
        records = data2.data;
      } else if (Array.isArray(data2.Data)) {
        records = data2.Data;
      }

      console.log(`   API records in first page: ${records.length}`);

    } catch (apiError) {
      console.log(`   ⚠️  Error fetching from API: ${apiError.message}`);
    }

    // 3. Check for duplicates
    console.log('\n🔍 Checking for duplicates...');
    const [duplicateCount] = await query(`
      SELECT COUNT(*) as count 
      FROM (
        SELECT external_id 
        FROM visits 
        WHERE external_id IS NOT NULL 
        GROUP BY external_id 
        HAVING COUNT(*) > 1
      ) as duplicates
    `);
    
    if (duplicateCount.count > 0) {
      console.log(`   ⚠️  Found ${duplicateCount.count} duplicate external_ids`);
      
      const duplicates = await query(`
        SELECT external_id, COUNT(*) as count 
        FROM visits 
        WHERE external_id IS NOT NULL 
        GROUP BY external_id 
        HAVING COUNT(*) > 1 
        ORDER BY count DESC 
        LIMIT 5
      `);
      
      duplicates.forEach(dup => {
        console.log(`      - ${dup.external_id}: ${dup.count} records`);
      });
    } else {
      console.log(`   ✅ No duplicate external_ids found`);
    }

    // 4. Check for records without external_id
    const [withoutExternalId] = await query('SELECT COUNT(*) as count FROM visits WHERE external_id IS NULL');
    if (withoutExternalId.count > 0) {
      console.log(`   ⚠️  Found ${withoutExternalId.count.toLocaleString('id-ID')} records without external_id`);
    } else {
      console.log(`   ✅ All records have external_id`);
    }

    // 5. Summary
    console.log('\n═══════════════════════════════════════════');
    console.log('📊 Summary:');
    console.log(`   Database total: ${dbCount.total.toLocaleString('id-ID')}`);
    console.log(`   Database unique: ${dbUnique.total.toLocaleString('id-ID')}`);
    console.log(`   Difference: ${(dbCount.total - dbUnique.total).toLocaleString('id-ID')}`);
    
    if (dbCount.total === dbUnique.total) {
      console.log(`   ✅ All records are unique (no duplicates)`);
    } else {
      console.log(`   ⚠️  There are ${(dbCount.total - dbUnique.total).toLocaleString('id-ID')} duplicate records`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await closePool();
  }
}

compareCounts().then(() => {
  console.log('\n✅ Comparison completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Comparison failed:', error);
  process.exit(1);
});

