#!/usr/bin/env node

/**
 * Load Testing Script untuk menguji aplikasi dengan 1000+ concurrent users
 * 
 * Usage:
 *   node scripts/load-test.js [options]
 * 
 * Options:
 *   --url <url>          Base URL aplikasi (default: http://localhost:3000)
 *   --users <number>     Jumlah concurrent users (default: 1000)
 *   --duration <seconds> Durasi test dalam detik (default: 60)
 *   --ramp-up <seconds> Waktu ramp-up dalam detik (default: 10)
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';
import { performance } from 'perf_hooks';

// Parse arguments
const args = process.argv.slice(2);
const getArg = (name, defaultValue) => {
  const index = args.indexOf(`--${name}`);
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
};

const baseUrl = getArg('url', 'http://localhost:3000');
const numUsers = parseInt(getArg('users', '1000'));
const duration = parseInt(getArg('duration', '60'));
const rampUpTime = parseInt(getArg('ramp-up', '10'));

// Statistics
const stats = {
  total: 0,
  success: 0,
  errors: 0,
  timeouts: 0,
  responseTimes: [],
  statusCodes: {},
  errorsByType: {}
};

// Endpoints to test
const endpoints = [
  { path: '/api/dashboard/stats', weight: 30 }, // 30% of requests
  { path: '/api/visits?page=1&limit=20', weight: 25 }, // 25%
  { path: '/api/visits?page=2&limit=20', weight: 20 }, // 20%
  { path: '/api/patients?page=1&limit=20', weight: 15 }, // 15%
  { path: '/api/health', weight: 10 }, // 10%
];

// Weighted random endpoint selection
function getRandomEndpoint() {
  const totalWeight = endpoints.reduce((sum, ep) => sum + ep.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const endpoint of endpoints) {
    random -= endpoint.weight;
    if (random <= 0) {
      return endpoint.path;
    }
  }
  return endpoints[0].path;
}

// Make HTTP request
function makeRequest(url, endpoint, userIndex) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const fullUrl = new URL(endpoint, url).toString();
    const urlObj = new URL(fullUrl);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': `LoadTest-User-${userIndex}`,
        'Accept': 'application/json'
      },
      timeout: 30000 // 30 seconds
    };
    
    const client = urlObj.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        stats.total++;
        stats.responseTimes.push(responseTime);
        
        // Track status codes
        const statusCode = res.statusCode;
        stats.statusCodes[statusCode] = (stats.statusCodes[statusCode] || 0) + 1;
        
        if (statusCode >= 200 && statusCode < 300) {
          stats.success++;
        } else {
          stats.errors++;
          stats.errorsByType[`HTTP_${statusCode}`] = (stats.errorsByType[`HTTP_${statusCode}`] || 0) + 1;
        }
        
        resolve({
          success: statusCode >= 200 && statusCode < 300,
          statusCode,
          responseTime,
          cacheHit: res.headers['x-cache'] === 'HIT'
        });
      });
    });
    
    req.on('error', (error) => {
      stats.total++;
      stats.errors++;
      stats.errorsByType[error.code || 'UNKNOWN'] = (stats.errorsByType[error.code || 'UNKNOWN'] || 0) + 1;
      resolve({ success: false, error: error.message });
    });
    
    req.on('timeout', () => {
      req.destroy();
      stats.total++;
      stats.timeouts++;
      stats.errors++;
      stats.errorsByType['TIMEOUT'] = (stats.errorsByType['TIMEOUT'] || 0) + 1;
      resolve({ success: false, error: 'Request timeout' });
    });
    
    req.end();
  });
}

// Simulate a user session
async function simulateUser(userIndex, startTime, endTime) {
  const requests = [];
  let lastRequestTime = performance.now();
  
  while (performance.now() < endTime) {
    const endpoint = getRandomEndpoint();
    const request = makeRequest(baseUrl, endpoint, userIndex);
    requests.push(request);
    
    // Wait a bit between requests (simulate user thinking time)
    const thinkTime = Math.random() * 2000 + 500; // 500-2500ms
    await new Promise(resolve => setTimeout(resolve, thinkTime));
    
    lastRequestTime = performance.now();
  }
  
  // Wait for remaining requests
  await Promise.all(requests);
}

// Calculate statistics
function calculateStats() {
  const responseTimes = stats.responseTimes.sort((a, b) => a - b);
  const count = responseTimes.length;
  
  if (count === 0) {
    return {
      avg: 0,
      min: 0,
      max: 0,
      p50: 0,
      p95: 0,
      p99: 0
    };
  }
  
  return {
    avg: responseTimes.reduce((a, b) => a + b, 0) / count,
    min: responseTimes[0],
    max: responseTimes[count - 1],
    p50: responseTimes[Math.floor(count * 0.5)],
    p95: responseTimes[Math.floor(count * 0.95)],
    p99: responseTimes[Math.floor(count * 0.99)]
  };
}

// Print statistics
function printStats() {
  const responseTimeStats = calculateStats();
  const successRate = stats.total > 0 ? (stats.success / stats.total * 100).toFixed(2) : 0;
  const errorRate = stats.total > 0 ? (stats.errors / stats.total * 100).toFixed(2) : 0;
  const rps = stats.total / duration;
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 LOAD TEST RESULTS');
  console.log('='.repeat(80));
  console.log(`\nConfiguration:`);
  console.log(`  Base URL: ${baseUrl}`);
  console.log(`  Concurrent Users: ${numUsers}`);
  console.log(`  Duration: ${duration}s`);
  console.log(`  Ramp-up Time: ${rampUpTime}s`);
  
  console.log(`\n📈 Overall Statistics:`);
  console.log(`  Total Requests: ${stats.total}`);
  console.log(`  Successful: ${stats.success} (${successRate}%)`);
  console.log(`  Errors: ${stats.errors} (${errorRate}%)`);
  console.log(`  Timeouts: ${stats.timeouts}`);
  console.log(`  Requests/Second: ${rps.toFixed(2)}`);
  
  console.log(`\n⏱️  Response Time Statistics:`);
  console.log(`  Average: ${responseTimeStats.avg.toFixed(2)}ms`);
  console.log(`  Min: ${responseTimeStats.min.toFixed(2)}ms`);
  console.log(`  Max: ${responseTimeStats.max.toFixed(2)}ms`);
  console.log(`  P50 (Median): ${responseTimeStats.p50.toFixed(2)}ms`);
  console.log(`  P95: ${responseTimeStats.p95.toFixed(2)}ms`);
  console.log(`  P99: ${responseTimeStats.p99.toFixed(2)}ms`);
  
  console.log(`\n📊 Status Code Distribution:`);
  Object.entries(stats.statusCodes)
    .sort((a, b) => b[1] - a[1])
    .forEach(([code, count]) => {
      const percentage = (count / stats.total * 100).toFixed(2);
      console.log(`  ${code}: ${count} (${percentage}%)`);
    });
  
  if (Object.keys(stats.errorsByType).length > 0) {
    console.log(`\n❌ Errors by Type:`);
    Object.entries(stats.errorsByType)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
  }
  
  console.log('\n' + '='.repeat(80));
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  if (responseTimeStats.p95 > 5000) {
    console.log('  ⚠️  P95 response time is high. Consider optimizing database queries and caching.');
  }
  if (errorRate > 5) {
    console.log('  ⚠️  Error rate is high. Check server logs and increase connection limits.');
  }
  if (stats.timeouts > 0) {
    console.log('  ⚠️  Timeouts detected. Consider increasing timeout values or optimizing slow queries.');
  }
  if (successRate > 95 && responseTimeStats.p95 < 1000) {
    console.log('  ✅ System is performing well under load!');
  }
  console.log('\n');
}

// Main function
async function main() {
  console.log('🚀 Starting Load Test...\n');
  console.log(`Target: ${baseUrl}`);
  console.log(`Users: ${numUsers}`);
  console.log(`Duration: ${duration}s`);
  console.log(`Ramp-up: ${rampUpTime}s\n`);
  
  const startTime = performance.now();
  const endTime = startTime + (duration * 1000);
  const rampUpEndTime = startTime + (rampUpTime * 1000);
  
  // Start users gradually (ramp-up)
  const users = [];
  const usersPerRamp = Math.ceil(numUsers / rampUpTime);
  
  console.log('⏳ Ramping up users...');
  
  for (let i = 0; i < numUsers; i++) {
    const delay = (i / usersPerRamp) * 1000; // Spread over ramp-up period
    
    setTimeout(() => {
      const userPromise = simulateUser(i + 1, performance.now(), endTime);
      users.push(userPromise);
      
      if ((i + 1) % 100 === 0) {
        console.log(`  Started ${i + 1}/${numUsers} users...`);
      }
    }, delay);
  }
  
  // Wait for ramp-up
  await new Promise(resolve => setTimeout(resolve, rampUpTime * 1000));
  
  console.log(`\n🔥 Running load test for ${duration}s...`);
  console.log(`  Started ${numUsers} users`);
  console.log(`  Monitor progress at ${baseUrl}/api/health\n`);
  
  // Periodic progress updates
  const progressInterval = setInterval(() => {
    const elapsed = (performance.now() - startTime) / 1000;
    const remaining = duration - elapsed;
    const currentRps = stats.total / elapsed;
    
    if (remaining > 0) {
      console.log(`  [${elapsed.toFixed(1)}s] Requests: ${stats.total}, RPS: ${currentRps.toFixed(2)}, Success: ${((stats.success / stats.total) * 100).toFixed(1)}%`);
    }
  }, 10 * 1000); // Every 10 seconds
  
  // Wait for test duration
  await new Promise(resolve => setTimeout(resolve, duration * 1000));
  
  clearInterval(progressInterval);
  
  console.log('\n⏹️  Stopping load test...');
  
  // Wait for all users to finish
  await Promise.all(users);
  
  // Print final statistics
  printStats();
}

// Run the test
main().catch(console.error);

