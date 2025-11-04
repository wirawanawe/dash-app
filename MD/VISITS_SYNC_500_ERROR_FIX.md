# 🔧 Visits Sync 500 Error - Root Cause Analysis & Fix

**Date:** November 4, 2025  
**Issue:** POST /api/visits/sync returning 500 errors with 60-72s response times

---

## 📊 Problem Analysis

### Observed Symptoms
```bash
POST /api/visits/sync 500 in 71700ms
POST /api/visits/sync 500 in 72164ms
POST /api/visits/sync 500 in 60149ms
POST /api/visits/sync 500 in 60153ms
```

### Database Investigation Results

Checked recent sync logs:

```
Sync ID: 41  - Status: failed - Duration: 60s
  Error: Failed to fetch count: 504

Sync ID: 40  - Status: failed - Duration: 60s
  Error: Failed to fetch count: 504

Sync ID: 39  - Status: failed - Duration: 72s
  Error: Unexpected token '<', "<!DOCTYPE "... is not valid JSON

Sync ID: 38  - Status: failed - Duration: 72s
  Error: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

### External API Health Check

```bash
$ node scripts/check-external-api-health.js

Test 1: Basic Connectivity
   URL: https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan?page=1&limit=1
   ❌ Request failed after 30007ms
   Error: This operation was aborted

❌ Request Timeout (30 seconds)
   The external API is too slow or unresponsive
```

---

## 🎯 Root Cause

**The external API (`https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan`) is experiencing severe issues:**

1. **504 Gateway Timeout** - API server is not responding within reasonable time
2. **Returning HTML error pages** - Instead of JSON, indicating server errors
3. **Complete unresponsiveness** - Even basic connectivity tests timeout after 30s

**This is NOT a problem with our code or database.** The external API provider needs to address their server issues.

---

## ✅ Fixes Implemented

Despite the external API issues, I've implemented several improvements to make the sync more robust:

### 1. **Proper Timeout Implementation** ✅

**Problem:** The old code used `timeout: 30000` option which fetch() doesn't support

**Before:**
```javascript
const response = await fetch(url, {
  ...options,
  timeout: 30000, // ❌ This doesn't work!
});
```

**After:**
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

const response = await fetch(url, {
  ...options,
  signal: controller.signal, // ✅ Proper timeout handling
});
clearTimeout(timeoutId);
```

### 2. **HTML Error Detection** ✅

**Problem:** API sometimes returns HTML error pages instead of JSON, causing parsing errors

**Solution:**
```javascript
// Check if response is HTML instead of JSON
const contentType = response.headers.get('content-type');
if (contentType && contentType.includes('text/html')) {
  const text = await response.text();
  console.error(`❌ External API returned HTML instead of JSON. Status: ${response.status}`);
  throw new Error(`External API returned HTML (status ${response.status}). API may be down.`);
}
```

### 3. **Comprehensive Logging** ✅

**Problem:** No visibility into what's happening during sync

**Solution:** Added detailed logging at every step:
```javascript
console.log('🔄 Starting visits sync...');
console.log('📊 Step 1: Fetching total count from external API...');
console.log(`🌐 Fetching (attempt ${i + 1}/${maxRetries}): ${url}`);
console.log(`✅ Fetch successful: ${response.status}`);
console.log('💾 Step 4: Saving to database...');
console.error('❌ Visits sync failed:', error.message);
```

Now you can watch the sync progress in real-time:
```bash
🔄 Starting visits sync...
📝 Created sync log entry: 42
📊 Step 1: Fetching total count from external API...
🌐 Fetching (attempt 1/3): https://api-ehr-klinik.doctorphc.id/...
⏱️ Request timeout after 30000ms (attempt 1/3)
⏳ Waiting 1000ms before retry...
🌐 Fetching (attempt 2/3): https://api-ehr-klinik.doctorphc.id/...
❌ Fetch error (attempt 2/3): Failed to fetch count: 504
```

### 4. **Better Retry Logic** ✅

**Improvements:**
- Explicit retry attempt logging
- Exponential backoff with clear timing
- Detailed error messages for each attempt
- Clear indication of which retry attempt failed

### 5. **Gentler API Usage** ✅

**Changes:**
- Reduced batch size from 5 to 3 pages at a time
- Increased delay between batches from 500ms to 1000ms
- Increased timeout for data pages to 45 seconds
- Better batch progress logging

**Before:**
```javascript
const batchSize = 5;
await delay(500);
```

**After:**
```javascript
const batchSize = 3; // More gentle on the API
await delay(1000);   // Longer rest between batches
```

### 6. **Enhanced Error Messages** ✅

**Problem:** Users didn't know why sync was failing

**Solution:**
```javascript
return NextResponse.json({
  success: false,
  message: 'Visits sync failed',
  error: error.message,
  details: 'Check server logs for more information. Common issues: External API timeout (504), API returning HTML instead of JSON, network issues.'
}, { status: 500 });
```

---

## 🛠️ New Tools Created

### 1. External API Health Check Script

**File:** `scripts/check-external-api-health.js`

**Usage:**
```bash
node scripts/check-external-api-health.js
```

**What it does:**
- Tests basic connectivity to external API
- Measures response times
- Tests both small (1 record) and large (100 records) fetches
- Detects HTML vs JSON responses
- Provides recommendations based on results

**Example Output:**
```
🔍 External API Health Check
═══════════════════════════════════════════

Test 1: Basic Connectivity
   URL: https://api-ehr-klinik.doctorphc.id/...
   Status: 200 OK
   Response time: 1234ms
   ✅ API is healthy and responsive

Test 2: Fetching larger page (100 records)
   Status: 200
   Response time: 4567ms
   Records returned: 100
   ✅ Larger page fetch successful

Summary:
✅ API is healthy and responsive
   Small page: 1234ms (< 5s target)
   Large page: 4567ms (< 15s target)
```

---

## 📝 Files Modified

### 1. `/app/api/visits/sync/route.js`

**Changes:**
- ✅ Proper timeout implementation using AbortController
- ✅ HTML error page detection and handling
- ✅ Comprehensive logging throughout the sync process
- ✅ Better retry logic with exponential backoff
- ✅ Reduced batch sizes (5→3) for gentler API usage
- ✅ Increased delays (500ms→1s) between batches
- ✅ Enhanced error messages with troubleshooting tips
- ✅ Stack trace logging for debugging

### 2. `/scripts/check-external-api-health.js` (NEW)

**Purpose:** Health check tool for external API diagnostics

---

## 🔍 Diagnosis Guide

### Step 1: Check Sync Logs

```bash
node -e "
import { query } from './lib/db.js';
const logs = await query('SELECT * FROM sync_logs WHERE entity_type = \"visits\" ORDER BY started_at DESC LIMIT 5');
logs.forEach(log => console.log(log));
process.exit(0);
"
```

### Step 2: Check External API Health

```bash
node scripts/check-external-api-health.js
```

### Step 3: Watch Server Logs

Now with enhanced logging, you can watch the sync process in real-time:

```bash
# The server logs will show detailed progress like:
🔄 Starting visits sync...
📝 Created sync log entry: 42
📊 Step 1: Fetching total count from external API...
🌐 Fetching (attempt 1/3): https://...
```

---

## 🚨 Current Status

### ❌ External API Issues (NOT FIXED - requires API provider)

The external API is currently:
- Timing out after 30+ seconds
- Returning 504 Gateway Timeout errors
- Sometimes returning HTML error pages instead of JSON
- Completely unresponsive

**Action Required:** Contact API provider (api-ehr-klinik.doctorphc.id) about:
1. 504 Gateway Timeout errors
2. Server performance issues
3. HTML error pages being returned
4. General API availability

### ✅ Our Code Improvements (FIXED)

Our sync code has been improved with:
- ✅ Proper timeout handling
- ✅ HTML error detection
- ✅ Comprehensive logging
- ✅ Better retry logic
- ✅ Gentler API usage
- ✅ Enhanced error messages
- ✅ Diagnostic tools

**These improvements will help the sync work better once the external API is stable again.**

---

## 💡 Recommendations

### Short Term (Immediate Actions)

1. **Contact API Provider**
   - Report 504 timeout errors
   - Request performance improvements
   - Ask about API rate limits
   - Inquire about maintenance schedule

2. **Monitor API Health**
   ```bash
   # Run health check periodically
   watch -n 300 'node scripts/check-external-api-health.js'
   ```

3. **Check Server Logs**
   - Watch for improved external API response times
   - Verify sync succeeds when API is available

### Medium Term (Configuration Adjustments)

If external API remains slow but functional:

1. **Adjust Timeouts** (`app/api/visits/sync/route.js`):
   ```javascript
   // Line 82: Increase count fetch timeout
   }, 3, 60000); // From 30000 to 60000 (60 seconds)
   
   // Line 127: Increase data page timeout  
   }, 3, 90000); // From 45000 to 90000 (90 seconds)
   ```

2. **Reduce Data Volume**:
   ```javascript
   // Line 101: Reduce records to fetch
   const desiredRecords = 5000; // From 20000 to 5000
   
   // Line 102: Reduce page size
   const recordsPerPage = 500; // From 1000 to 500
   ```

3. **Further Reduce Batch Sizes**:
   ```javascript
   // Line 111: Reduce concurrent requests
   const batchSize = 2; // From 3 to 2
   
   // Line 143: Increase delay
   await delay(2000); // From 1000 to 2000 (2 seconds)
   ```

### Long Term (Architecture)

Consider implementing:

1. **Queue-based Sync**
   - Move sync to background job queue
   - Process in smaller chunks over time
   - Don't block HTTP requests

2. **Incremental Sync**
   - Only fetch records newer than last sync
   - Use `since` or `updated_after` parameters if available
   - Reduces data volume per sync

3. **Caching Layer**
   - Cache API responses temporarily
   - Reduce API calls
   - Serve stale data if API is down

4. **Circuit Breaker Pattern**
   - Stop trying if API is consistently failing
   - Automatic retry after cooldown period
   - Prevent resource waste

---

## 📊 Performance Targets

### When External API is Healthy

| Metric | Target | Current (API Down) |
|--------|--------|-------------------|
| Total sync time | < 60s | 60-72s (timeout) |
| Count fetch | < 5s | 30s+ (timeout) |
| Page fetch | < 15s each | 30s+ (timeout) |
| Success rate | > 95% | 0% (API down) |

### Expected Improvements After Fix

Once external API is stable:
- **Count fetch:** 2-5 seconds
- **Page fetch:** 5-15 seconds per page
- **Total sync:** 30-120 seconds (depending on data volume)
- **Success rate:** 95%+ (with retries handling occasional failures)

---

## ✅ Testing

### Test 1: Verify Logging Works

```bash
# Trigger a sync and watch the logs
curl -X POST http://localhost:3000/api/visits/sync

# You should see detailed logging like:
# 🔄 Starting visits sync...
# 📝 Created sync log entry: XX
# 📊 Step 1: Fetching total count...
```

### Test 2: Verify Health Check

```bash
node scripts/check-external-api-health.js

# Should output comprehensive health report
```

### Test 3: Verify Error Handling

```bash
# When API is down, sync should:
# - Log clear error messages
# - Update sync_logs with error details
# - Return 500 with helpful error message
# - NOT crash the server
```

### Test 4: Verify Sync When API is Up

```bash
# Once external API is healthy:
# - Run sync: curl -X POST http://localhost:3000/api/visits/sync
# - Should complete successfully
# - Check sync_logs for 'completed' status
# - Verify records were inserted/updated in visits table
```

---

## 🎯 Summary

### Problem
- POST /api/visits/sync failing with 500 errors
- Taking 60-72 seconds before timing out
- External API returning 504 errors and HTML pages

### Root Cause
- **External API (api-ehr-klinik.doctorphc.id) is down or severely degraded**
- API timing out after 30+ seconds
- Returning error pages instead of JSON

### What Was Fixed (Our Code)
- ✅ Proper timeout implementation with AbortController
- ✅ HTML error page detection
- ✅ Comprehensive logging for debugging
- ✅ Better retry logic with exponential backoff
- ✅ Gentler API usage (smaller batches, longer delays)
- ✅ Enhanced error messages
- ✅ Diagnostic health check tool

### What Needs External Action
- ❌ External API provider needs to fix their 504 timeout issues
- ❌ External API needs performance improvements
- ❌ Contact api-ehr-klinik.doctorphc.id support team

### Next Steps
1. Run health check periodically: `node scripts/check-external-api-health.js`
2. Contact external API provider about 504 errors
3. Monitor server logs for improved API response times
4. Once API is stable, sync should work reliably with our improvements

---

## 📞 Support

If you continue to see sync failures:

1. **Check external API first:**
   ```bash
   node scripts/check-external-api-health.js
   ```

2. **Check recent sync logs:**
   ```bash
   node -e "import { query } from './lib/db.js'; const logs = await query('SELECT * FROM sync_logs WHERE entity_type = \"visits\" ORDER BY started_at DESC LIMIT 3'); console.table(logs); process.exit(0);"
   ```

3. **Check server logs** for detailed error messages with the new logging

4. **Contact API provider** if health check shows API is down

---

**Status:** ✅ Code improvements complete, waiting for external API to be fixed

**Last Updated:** November 4, 2025

