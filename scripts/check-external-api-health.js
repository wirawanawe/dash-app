#!/usr/bin/env node

/**
 * External API Health Check Script
 * 
 * This script checks the health and responsiveness of the external visits API
 * Used to diagnose 504 timeouts and connection issues
 */

async function checkExternalAPI() {
  const baseUrl = 'https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan';
  
  console.log('🔍 External API Health Check');
  console.log('═══════════════════════════════════════════\n');
  
  // Test 1: Basic connectivity
  console.log('Test 1: Basic Connectivity');
  console.log('   URL:', baseUrl + '?page=1&limit=1');
  
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    const response = await fetch(baseUrl + '?page=1&limit=1', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Response time: ${duration}ms`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        const total = data['total pasien'] || data.total || 0;
        
        console.log('   ✅ API is responding correctly');
        console.log(`   Total records available: ${total}`);
        
        // Test 2: Response time for larger page
        console.log('\nTest 2: Fetching larger page (100 records)');
        const largeStartTime = Date.now();
        const largeResponse = await fetch(baseUrl + '?page=1&limit=100', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal
        });
        const largeDuration = Date.now() - largeStartTime;
        
        console.log(`   Status: ${largeResponse.status}`);
        console.log(`   Response time: ${largeDuration}ms`);
        
        if (largeResponse.ok) {
          const largeData = await largeResponse.json();
          console.log(`   Records returned: ${largeData.data?.length || 0}`);
          console.log('   ✅ Larger page fetch successful');
        } else {
          console.log('   ❌ Failed to fetch larger page');
        }
        
        // Summary
        console.log('\n═══════════════════════════════════════════');
        console.log('Summary:');
        if (duration < 5000 && largeDuration < 15000) {
          console.log('✅ API is healthy and responsive');
          console.log('   Small page: ' + duration + 'ms (< 5s target)');
          console.log('   Large page: ' + largeDuration + 'ms (< 15s target)');
        } else if (duration < 10000) {
          console.log('⚠️  API is slow but functional');
          console.log('   Small page: ' + duration + 'ms');
          console.log('   Large page: ' + largeDuration + 'ms');
          console.log('   Consider reducing batch sizes or increasing timeouts');
        } else {
          console.log('❌ API is very slow');
          console.log('   Small page: ' + duration + 'ms');
          console.log('   This may cause sync failures');
        }
        
      } else {
        console.log('   ❌ API returned non-JSON response');
        const text = await response.text();
        console.log('   Response preview:', text.substring(0, 200));
        console.log('\n❌ API is not functioning correctly (HTML/error page returned)');
      }
    } else {
      console.log(`   ❌ API returned error status: ${response.status}`);
      
      if (response.status === 504) {
        console.log('\n❌ Gateway Timeout (504)');
        console.log('   The external API server is not responding in time');
        console.log('   This is the root cause of the sync failures');
        console.log('\nRecommendations:');
        console.log('   1. Contact the API provider about timeouts');
        console.log('   2. Increase timeout values in sync code');
        console.log('   3. Reduce batch sizes to fetch less data at once');
        console.log('   4. Add retry logic with exponential backoff');
      }
    }
    
  } catch (error) {
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    console.log(`   ❌ Request failed after ${duration}ms`);
    console.log('   Error:', error.message);
    
    if (error.name === 'AbortError') {
      console.log('\n❌ Request Timeout (30 seconds)');
      console.log('   The external API is too slow or unresponsive');
      console.log('   This will cause sync operations to fail');
    } else {
      console.log('\n❌ Network Error');
      console.log('   Unable to connect to external API');
    }
    
    console.log('\nRecommendations:');
    console.log('   1. Check network connectivity');
    console.log('   2. Verify the API URL is correct');
    console.log('   3. Contact API provider about availability');
    console.log('   4. Check firewall/proxy settings');
  }
  
  console.log('═══════════════════════════════════════════\n');
}

// Run the health check
checkExternalAPI().catch(console.error);

