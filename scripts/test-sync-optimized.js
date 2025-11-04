#!/usr/bin/env node

/**
 * Test Script untuk Visits Sync yang Sudah Dioptimasi
 * 
 * Script ini akan:
 * 1. Check API health
 * 2. Trigger sync
 * 3. Monitor progress
 * 4. Report results
 */

async function testOptimizedSync() {
  console.log('🧪 Testing Optimized Visits Sync');
  console.log('═══════════════════════════════════════════\n');
  
  // Step 1: Check API health
  console.log('Step 1: Checking External API Health...');
  const healthStartTime = Date.now();
  const healthController = new AbortController();
  const healthTimeout = setTimeout(() => healthController.abort(), 30000);
  
  let apiHealthy = false;
  try {
    const healthResponse = await fetch(
      'https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan?page=1&limit=1',
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: healthController.signal
      }
    );
    
    clearTimeout(healthTimeout);
    const healthDuration = Date.now() - healthStartTime;
    
    if (healthResponse.ok) {
      const data = await healthResponse.json();
      const total = data['total pasien'] || data.total || 0;
      
      console.log(`✅ API is responding`);
      console.log(`   Response time: ${healthDuration}ms`);
      console.log(`   Total records available: ${total}`);
      console.log(`   Status: ${healthResponse.status}\n`);
      apiHealthy = true;
    } else {
      console.log(`⚠️  API returned status: ${healthResponse.status}`);
      console.log(`   Response time: ${healthDuration}ms\n`);
    }
  } catch (error) {
    clearTimeout(healthTimeout);
    const healthDuration = Date.now() - healthStartTime;
    
    if (error.name === 'AbortError') {
      console.log(`❌ API timeout after ${healthDuration}ms`);
    } else {
      console.log(`❌ API error: ${error.message}`);
    }
    console.log(`   Duration: ${healthDuration}ms\n`);
  }
  
  // Step 2: Trigger sync
  console.log('Step 2: Triggering Optimized Sync...');
  console.log('   This may take 3-10 minutes depending on API response');
  console.log('   Watch server logs for detailed progress\n');
  
  const syncStartTime = Date.now();
  
  try {
    const syncResponse = await fetch('http://localhost:3000/api/visits/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const syncDuration = Math.round((Date.now() - syncStartTime) / 1000);
    const result = await syncResponse.json();
    
    console.log('\n═══════════════════════════════════════════');
    console.log('Sync Results:');
    console.log('═══════════════════════════════════════════\n');
    
    if (result.success) {
      console.log(`✅ ${result.message}`);
      console.log(`\nStatistics:`);
      console.log(`   Fetched:      ${result.stats.fetched} records`);
      console.log(`   Inserted:     ${result.stats.inserted} records`);
      console.log(`   Updated:      ${result.stats.updated} records`);
      console.log(`   Failed:       ${result.stats.failed} records`);
      console.log(`   Pages Failed: ${result.stats.pages_failed} pages`);
      console.log(`   Duration:     ${result.stats.duration_seconds}s`);
      console.log(`   Partial Sync: ${result.stats.partial_sync ? 'Yes ⚠️' : 'No ✅'}`);
      
      if (result.sampleErrors && result.sampleErrors.length > 0) {
        console.log(`\n⚠️  Sample Errors:`);
        result.sampleErrors.forEach(err => {
          console.log(`   - Page ${err.page || err.external_id}: ${err.error || err.message}`);
        });
      }
      
      // Performance analysis
      console.log(`\n📊 Performance Analysis:`);
      if (result.stats.duration_seconds < 180) {
        console.log(`   ✅ Excellent (< 3 minutes)`);
      } else if (result.stats.duration_seconds < 360) {
        console.log(`   ✅ Good (3-6 minutes)`);
      } else if (result.stats.duration_seconds < 600) {
        console.log(`   ⚠️  Slow (6-10 minutes)`);
      } else {
        console.log(`   ❌ Very slow (> 10 minutes)`);
      }
      
      if (result.stats.pages_failed === 0) {
        console.log(`   ✅ No page failures - perfect sync!`);
      } else if (result.stats.pages_failed < 5) {
        console.log(`   ⚠️  Some pages failed but acceptable`);
      } else {
        console.log(`   ❌ Many pages failed - check API health`);
      }
      
      const successRate = result.stats.fetched > 0 
        ? ((result.stats.inserted + result.stats.updated) / result.stats.fetched * 100).toFixed(1)
        : 0;
      console.log(`   Success Rate: ${successRate}%`);
      
      console.log(`\n🎉 Sync completed successfully!`);
      
    } else {
      console.log(`❌ ${result.message}`);
      console.log(`   Error: ${result.error}`);
      
      if (result.recommendations) {
        console.log(`\n💡 Recommendations:`);
        result.recommendations.forEach(rec => {
          console.log(`   - ${rec}`);
        });
      }
    }
    
  } catch (error) {
    const syncDuration = Math.round((Date.now() - syncStartTime) / 1000);
    console.log(`\n❌ Sync request failed after ${syncDuration}s`);
    console.log(`   Error: ${error.message}`);
  }
  
  // Step 3: Check database
  console.log('\n═══════════════════════════════════════════');
  console.log('Step 3: Checking Database...');
  console.log('═══════════════════════════════════════════\n');
  
  try {
    // Import query
    const { query } = await import('../lib/db.js');
    
    // Get stats
    const [stats] = await query(`
      SELECT 
        COUNT(*) as total_visits,
        MAX(synced_at) as last_synced,
        COUNT(DISTINCT external_id) as unique_visits,
        MIN(visit_date) as oldest_visit,
        MAX(visit_date) as newest_visit
      FROM visits
    `);
    
    console.log('Database Statistics:');
    console.log(`   Total visits in DB:  ${stats.total_visits}`);
    console.log(`   Unique visits:       ${stats.unique_visits}`);
    console.log(`   Last synced:         ${stats.last_synced}`);
    console.log(`   Date range:          ${stats.oldest_visit} to ${stats.newest_visit}`);
    
    // Get recent sync logs
    const logs = await query(`
      SELECT 
        id,
        status,
        records_fetched,
        records_inserted,
        records_updated,
        records_failed,
        error_message,
        duration_seconds,
        started_at
      FROM sync_logs
      WHERE entity_type = 'visits'
      ORDER BY started_at DESC
      LIMIT 3
    `);
    
    console.log(`\nRecent Sync Logs:`);
    logs.forEach((log, index) => {
      console.log(`\n   Sync #${log.id} (${log.started_at}):`);
      console.log(`     Status:   ${log.status}`);
      console.log(`     Fetched:  ${log.records_fetched || 0}`);
      console.log(`     Inserted: ${log.records_inserted || 0}`);
      console.log(`     Updated:  ${log.records_updated || 0}`);
      console.log(`     Failed:   ${log.records_failed || 0}`);
      console.log(`     Duration: ${log.duration_seconds || 0}s`);
      if (log.error_message) {
        console.log(`     Error:    ${log.error_message}`);
      }
    });
    
    process.exit(0);
    
  } catch (error) {
    console.log(`⚠️  Could not check database: ${error.message}`);
    process.exit(1);
  }
}

// Run the test
console.log('⏰ Starting at:', new Date().toLocaleString());
console.log('');

testOptimizedSync().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});

