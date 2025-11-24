#!/usr/bin/env node

/**
 * Script untuk memeriksa duplicate data di tabel visits
 */

import { query, closePool } from '../lib/db.js';

async function checkDuplicates() {
  console.log('🔍 Checking for duplicates in visits table...');
  console.log('═══════════════════════════════════════════\n');

  try {
    // 1. Total records
    const [totalResult] = await query('SELECT COUNT(*) as total FROM visits');
    console.log(`📊 Total records: ${totalResult.total.toLocaleString('id-ID')}`);

    // 2. Records with external_id
    const [withExternalId] = await query('SELECT COUNT(*) as count FROM visits WHERE external_id IS NOT NULL');
    console.log(`📊 Records with external_id: ${withExternalId.count.toLocaleString('id-ID')}`);

    // 3. Unique external_ids
    const [uniqueExternalId] = await query('SELECT COUNT(DISTINCT external_id) as count FROM visits WHERE external_id IS NOT NULL');
    console.log(`📊 Unique external_ids: ${uniqueExternalId.count.toLocaleString('id-ID')}`);

    // 4. Check for duplicates by external_id
    const duplicateExternalId = await query(`
      SELECT external_id, COUNT(*) as count 
      FROM visits 
      WHERE external_id IS NOT NULL 
      GROUP BY external_id 
      HAVING count > 1 
      ORDER BY count DESC 
      LIMIT 10
    `);
    
    if (duplicateExternalId.length > 0) {
      console.log(`\n⚠️  Found ${duplicateExternalId.length} duplicate external_ids:`);
      duplicateExternalId.forEach(dup => {
        console.log(`   - ${dup.external_id}: ${dup.count} records`);
      });
    } else {
      console.log(`\n✅ No duplicates found by external_id`);
    }

    // 5. Check for duplicates by visit_number
    const duplicateVisitNumber = await query(`
      SELECT visit_number, COUNT(*) as count 
      FROM visits 
      WHERE visit_number IS NOT NULL 
      GROUP BY visit_number 
      HAVING count > 1 
      ORDER BY count DESC 
      LIMIT 10
    `);
    
    if (duplicateVisitNumber.length > 0) {
      console.log(`\n⚠️  Found ${duplicateVisitNumber.length} duplicate visit_numbers:`);
      duplicateVisitNumber.forEach(dup => {
        console.log(`   - ${dup.visit_number}: ${dup.count} records`);
      });
    } else {
      console.log(`\n✅ No duplicates found by visit_number`);
    }

    // 6. Check for duplicates by combination of external_id and visit_date
    const duplicateByDate = await query(`
      SELECT external_id, visit_date, COUNT(*) as count 
      FROM visits 
      WHERE external_id IS NOT NULL AND visit_date IS NOT NULL
      GROUP BY external_id, visit_date 
      HAVING count > 1 
      ORDER BY count DESC 
      LIMIT 10
    `);
    
    if (duplicateByDate.length > 0) {
      console.log(`\n⚠️  Found ${duplicateByDate.length} duplicate combinations (external_id + visit_date):`);
      duplicateByDate.forEach(dup => {
        console.log(`   - external_id: ${dup.external_id}, date: ${dup.visit_date}, count: ${dup.count}`);
      });
    } else {
      console.log(`\n✅ No duplicates found by external_id + visit_date`);
    }

    // 7. Summary
    const totalDuplicates = duplicateExternalId.length + duplicateVisitNumber.length;
    const expectedRecords = uniqueExternalId.count;
    const actualRecords = totalResult.total;
    const difference = actualRecords - expectedRecords;

    console.log(`\n═══════════════════════════════════════════`);
    console.log(`📊 Summary:`);
    console.log(`   Total records: ${actualRecords.toLocaleString('id-ID')}`);
    console.log(`   Unique external_ids: ${expectedRecords.toLocaleString('id-ID')}`);
    console.log(`   Difference: ${difference.toLocaleString('id-ID')}`);
    
    if (difference > 0) {
      console.log(`   ⚠️  There are ${difference.toLocaleString('id-ID')} extra records`);
    } else if (difference === 0) {
      console.log(`   ✅ All records are unique`);
    }

  } catch (error) {
    console.error('❌ Error checking duplicates:', error);
  } finally {
    await closePool();
  }
}

checkDuplicates().then(() => {
  console.log('\n✅ Check completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Check failed:', error);
  process.exit(1);
});

