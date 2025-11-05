# 🚨 Visits Sync 500 Error - Quick Reference

## Problem
```
POST /api/visits/sync 500 in 71700ms
POST /api/visits/sync 500 in 72164ms
```

## Root Cause
**External API (api-ehr-klinik.doctorphc.id) is timing out (504 errors)**

## Quick Diagnosis

```bash
# 1. Check external API health
node scripts/check-external-api-health.js

# 2. Check recent sync errors
node -e "import { query } from './lib/db.js'; const logs = await query('SELECT id, status, error_message, duration_seconds FROM sync_logs WHERE entity_type = \"visits\" ORDER BY started_at DESC LIMIT 5'); console.table(logs); process.exit(0);"
```

## What Was Fixed

✅ **Our Code (FIXED):**
- Proper timeout handling with AbortController
- HTML error detection
- Comprehensive logging
- Better retry logic
- Gentler API usage (smaller batches, longer delays)
- Enhanced error messages
- Diagnostic tools

❌ **External API (NEEDS FIX):**
- Contact API provider about 504 timeouts
- External server performance issues

## Immediate Actions

1. **Run Health Check:**
   ```bash
   node scripts/check-external-api-health.js
   ```

2. **If API is down:**
   - Contact api-ehr-klinik.doctorphc.id support
   - Report 504 Gateway Timeout errors
   - Wait for external fix

3. **If API is up but slow:**
   - Adjust timeouts in `app/api/visits/sync/route.js`:
     - Line 82: Increase to 60000 (60 seconds)
     - Line 127: Increase to 90000 (90 seconds)
   - Reduce batch sizes:
     - Line 111: Change `batchSize = 3` to `2`
     - Line 143: Change `delay(1000)` to `delay(2000)`

## Monitoring

Watch server logs during sync - you'll now see detailed progress:
```
🔄 Starting visits sync...
📝 Created sync log entry: 42
📊 Step 1: Fetching total count from external API...
🌐 Fetching (attempt 1/3): https://...
✅ External API has 50000 total records
📄 Step 2: Fetching pages...
💾 Step 4: Saving to database...
✅ Visits sync completed successfully!
```

## Full Documentation

See `MD/VISITS_SYNC_500_ERROR_FIX.md` for complete analysis and recommendations.

---

**Status:** Code improvements complete ✅ | External API needs fix ❌  
**Last Updated:** November 4, 2025

