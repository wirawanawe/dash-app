#!/usr/bin/env node

/**
 * Diagnostic Tool - Check Sync CPU Bottleneck
 * 
 * Cek:
 * 1. API eksternal response time
 * 2. Database query performance
 * 3. JSON parsing overhead
 * 4. Network I/O
 */

import { query } from '../lib/db.js';

const API_URL = 'https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan';

async function fetchWithTiming(url) {
  const start = Date.now();
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const duration = Date.now() - start;
    
    if (!response.ok) {
      return { success: false, duration, status: response.status };
    }
    
    const parseStart = Date.now();
    const data = await response.json();
    const parseDuration = Date.now() - parseStart;
    
    return {
      success: true,
      duration,
      parseDuration,
      dataSize: JSON.stringify(data).length,
      recordCount: data.data?.length || 0
    };
  } catch (error) {
    return {
      success: false,
      duration: Date.now() - start,
      error: error.message
    };
  }
}

async function testDatabasePerformance() {
  console.log('\n🔍 Testing Database Performance...\n');
  
  // Test simple SELECT
  const selectStart = Date.now();
  await query('SELECT COUNT(*) as count FROM visits');
  const selectDuration = Date.now() - selectStart;
  console.log(`   SELECT query: ${selectDuration}ms`);
  
  // Test INSERT
  const insertStart = Date.now();
  await query(
    `INSERT INTO visits (external_id, visit_number, patient_name, synced_at) 
     VALUES ('test_diagnostic', 'TEST001', 'Test Patient', NOW())
     ON DUPLICATE KEY UPDATE synced_at = NOW()`
  );
  const insertDuration = Date.now() - insertStart;
  console.log(`   INSERT query: ${insertDuration}ms`);
  
  // Cleanup
  await query(`DELETE FROM visits WHERE external_id = 'test_diagnostic'`);
  
  return {
    select: selectDuration,
    insert: insertDuration
  };
}

async function testAPIPerformance() {
  console.log('\n🌐 Testing External API Performance...\n');
  
  const tests = [];
  
  // Test 1: First page (usually cached)
  console.log('   Testing page 1...');
  const test1 = await fetchWithTiming(`${API_URL}?page=1&limit=10`);
  tests.push({ page: 1, ...test1 });
  console.log(`   ✓ Page 1: ${test1.duration}ms (parse: ${test1.parseDuration}ms, records: ${test1.recordCount})`);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 2: Different page
  console.log('   Testing page 10...');
  const test2 = await fetchWithTiming(`${API_URL}?page=10&limit=10`);
  tests.push({ page: 10, ...test2 });
  console.log(`   ✓ Page 10: ${test2.duration}ms (parse: ${test2.parseDuration}ms, records: ${test2.recordCount})`);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 3: Large page
  console.log('   Testing page 1 with 100 records...');
  const test3 = await fetchWithTiming(`${API_URL}?page=1&limit=100`);
  tests.push({ page: 1, size: 100, ...test3 });
  console.log(`   ✓ Large page: ${test3.duration}ms (parse: ${test3.parseDuration}ms, records: ${test3.recordCount})`);
  
  return tests;
}

async function analyzeCPUBottleneck() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║          Sync CPU Bottleneck Diagnostic Tool                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  // Test 1: Database
  const dbPerf = await testDatabasePerformance();
  
  // Test 2: External API
  const apiPerf = await testAPIPerformance();
  
  // Analysis
  console.log('\n📊 Analysis:\n');
  
  const avgAPITime = apiPerf.reduce((sum, t) => sum + t.duration, 0) / apiPerf.length;
  const avgParseTime = apiPerf.reduce((sum, t) => sum + (t.parseDuration || 0), 0) / apiPerf.length;
  
  console.log(`   Database INSERT: ${dbPerf.insert}ms`);
  console.log(`   API Fetch (avg): ${Math.round(avgAPITime)}ms`);
  console.log(`   JSON Parse (avg): ${Math.round(avgParseTime)}ms`);
  console.log('');
  
  // Identify bottleneck
  console.log('🎯 Bottleneck Identification:\n');
  
  if (avgAPITime > 3000) {
    console.log('   ⚠️  BOTTLENECK: External API is SLOW (>3 seconds)');
    console.log('   📝 Recommendation:');
    console.log('      - Use smaller page sizes (50-100 records)');
    console.log('      - Add longer delays between API calls (3-5 seconds)');
    console.log('      - Reduce concurrent requests to 1');
    console.log('      - Consider asking API provider to optimize');
  } else if (avgAPITime > 1000) {
    console.log('   ⚠️  WARNING: External API is moderate (1-3 seconds)');
    console.log('   📝 Recommendation:');
    console.log('      - Use moderate throttling (1-2 seconds between calls)');
    console.log('      - Batch size: 50-100 records');
  } else {
    console.log('   ✅ External API is FAST (<1 second)');
  }
  
  console.log('');
  
  if (dbPerf.insert > 100) {
    console.log('   ⚠️  BOTTLENECK: Database INSERT is SLOW (>100ms)');
    console.log('   📝 Recommendation:');
    console.log('      - Check database server load');
    console.log('      - Add database indexes');
    console.log('      - Use connection pooling');
    console.log('      - Consider bulk inserts');
  } else if (dbPerf.insert > 50) {
    console.log('   ⚠️  WARNING: Database INSERT is moderate (50-100ms)');
    console.log('   📝 Recommendation:');
    console.log('      - Optimize with batch inserts');
    console.log('      - Add delays between batches');
  } else {
    console.log('   ✅ Database performance is GOOD (<50ms)');
  }
  
  console.log('');
  
  if (avgParseTime > 500) {
    console.log('   ⚠️  BOTTLENECK: JSON parsing is SLOW (>500ms)');
    console.log('   📝 Recommendation:');
    console.log('      - Reduce API page size');
    console.log('      - Use streaming JSON parser');
    console.log('      - Request less fields from API if possible');
  } else {
    console.log('   ✅ JSON parsing is FAST (<500ms)');
  }
  
  // Overall recommendation
  console.log('\n💡 Overall CPU Optimization Strategy:\n');
  
  const totalTimePerRecord = (avgAPITime / 10) + dbPerf.insert + (avgParseTime / 10);
  console.log(`   Time per record: ~${Math.round(totalTimePerRecord)}ms`);
  console.log('');
  
  if (totalTimePerRecord > 200) {
    console.log('   🔴 HIGH CPU RISK:');
    console.log('      - Process 1 record at a time');
    console.log('      - Add 200ms delay per record');
    console.log('      - Add 5s delay between pages');
    console.log('      - Max 50 records per sync');
    console.log('');
    console.log('   Use: syncVisitsStream.js (ultra-conservative)');
  } else if (totalTimePerRecord > 100) {
    console.log('   🟡 MODERATE CPU RISK:');
    console.log('      - Batch size: 30-50 records');
    console.log('      - Add 2-3s delay between batches');
    console.log('      - Sequential API calls');
    console.log('');
    console.log('   Use: syncVisitsIncremental.js (optimized)');
  } else {
    console.log('   🟢 LOW CPU RISK:');
    console.log('      - Batch size: 50-100 records');
    console.log('      - Add 1-2s delay between batches');
    console.log('');
    console.log('   Use: syncVisitsIncremental.js (default)');
  }
  
  console.log('\n✅ Diagnostic complete!\n');
}

// Run diagnostic
analyzeCPUBottleneck().catch(error => {
  console.error('❌ Diagnostic failed:', error);
  process.exit(1);
});

