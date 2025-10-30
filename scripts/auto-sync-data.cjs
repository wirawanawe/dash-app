#!/usr/bin/env node

/**
 * Auto Sync Data Script
 * This script automatically syncs data from external APIs to local database cache
 * Can be run manually or scheduled with cron
 * 
 * Usage:
 *   node scripts/auto-sync-data.js [entity]
 * 
 * Examples:
 *   node scripts/auto-sync-data.js          # Sync all data
 *   node scripts/auto-sync-data.js visits   # Sync only visits
 *   node scripts/auto-sync-data.js patients # Sync only patients
 */

const https = require('https');
const http = require('http');

// Configuration
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
const ENTITY = process.argv[2] || 'all'; // Default to 'all' if no argument provided

// Allowed entities
const ALLOWED_ENTITIES = ['all', 'visits', 'patients', 'doctors', 'clinics'];

if (!ALLOWED_ENTITIES.includes(ENTITY)) {
  console.error(`❌ Invalid entity: ${ENTITY}`);
  console.error(`   Allowed entities: ${ALLOWED_ENTITIES.join(', ')}`);
  process.exit(1);
}

/**
 * Make HTTP/HTTPS POST request
 */
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = protocol.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

/**
 * Sync specific entity
 */
async function syncEntity(entity) {
  const url = `${APP_URL}/api/${entity === 'all' ? 'sync/all' : `${entity}/sync`}`;
  
  console.log(`\n🔄 Syncing ${entity}...`);
  console.log(`   URL: ${url}`);
  
  try {
    const startTime = Date.now();
    const response = await makeRequest(url);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (response.status === 200 && response.data.success) {
      console.log(`✅ ${entity} sync completed in ${duration}s`);
      
      if (response.data.stats) {
        console.log(`   Fetched: ${response.data.stats.fetched || 0}`);
        console.log(`   Inserted: ${response.data.stats.inserted || 0}`);
        console.log(`   Updated: ${response.data.stats.updated || 0}`);
      }
      
      if (response.data.summary) {
        console.log(`   Total Fetched: ${response.data.summary.total_fetched || 0}`);
        console.log(`   Total Inserted: ${response.data.summary.total_inserted || 0}`);
        console.log(`   Total Updated: ${response.data.summary.total_updated || 0}`);
      }
      
      return true;
    } else {
      console.error(`❌ ${entity} sync failed`);
      console.error(`   Status: ${response.status}`);
      console.error(`   Message: ${response.data.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${entity} sync error:`, error.message);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   PHC Dashboard - Auto Sync Data         ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`   Time: ${new Date().toLocaleString('id-ID')}`);
  console.log(`   Entity: ${ENTITY}`);
  console.log(`   App URL: ${APP_URL}`);
  
  const success = await syncEntity(ENTITY);
  
  console.log('\n' + '═'.repeat(44));
  if (success) {
    console.log('✅ Sync completed successfully');
    process.exit(0);
  } else {
    console.log('❌ Sync failed');
    process.exit(1);
  }
}

// Run main function
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

