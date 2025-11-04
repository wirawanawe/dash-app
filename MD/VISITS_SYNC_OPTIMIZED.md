# 🚀 Visits Sync - Versi Optimized

**Tanggal:** 4 November 2025  
**Status:** ✅ Siap Digunakan

---

## 🎯 Masalah Yang Diselesaikan

### Masalah Sebelumnya
- ❌ External API timeout (504 errors)
- ❌ Sync gagal total jika ada 1 page yang error
- ❌ Timeout terlalu pendek (30 detik)
- ❌ Terlalu banyak data sekaligus (20,000 records)
- ❌ Batch terlalu besar (5 pages sekaligus)
- ❌ Tidak ada fallback mechanism

### Solusi Baru
- ✅ Timeout diperpanjang (60-90 detik)
- ✅ **Partial sync** - lanjut meskipun ada yang gagal
- ✅ Fetch 1 page per request untuk reliability
- ✅ Target lebih kecil (5,000 records vs 20,000)
- ✅ Page size lebih kecil (500 vs 1,000 records)
- ✅ Delay lebih lama antar request (2 detik)
- ✅ Fallback mechanism jika count API gagal

---

## ⚙️ Konfigurasi Baru

```javascript
const SYNC_CONFIG = {
  INITIAL_TIMEOUT: 60000,        // 60 detik untuk request pertama
  DATA_PAGE_TIMEOUT: 90000,      // 90 detik untuk data pages
  MAX_RETRIES: 3,                // Maksimal retry per request
  BATCH_SIZE: 1,                 // Fetch 1 page at a time
  DELAY_BETWEEN_PAGES: 2000,     // 2 detik delay antar page
  MAX_RECORDS: 5000,             // Target 5000 records (lebih cepat)
  RECORDS_PER_PAGE: 500,         // 500 records per page
  ALLOW_PARTIAL_SYNC: true,      // Ijinkan partial sync
  MAX_FAILURES_ALLOWED: 10,      // Max 10 pages gagal
};
```

### Penjelasan Konfigurasi

| Setting | Nilai | Alasan |
|---------|-------|--------|
| `INITIAL_TIMEOUT` | 60s | API lambat, butuh waktu lebih |
| `DATA_PAGE_TIMEOUT` | 90s | Data pages lebih berat |
| `BATCH_SIZE` | 1 | Fetch satu-satu untuk reliability |
| `DELAY_BETWEEN_PAGES` | 2s | Beri jeda API untuk recover |
| `MAX_RECORDS` | 5000 | Lebih cepat selesai |
| `RECORDS_PER_PAGE` | 500 | Kurangi beban per request |
| `ALLOW_PARTIAL_SYNC` | true | Ambil data yang bisa diambil |
| `MAX_FAILURES_ALLOWED` | 10 | Stop jika terlalu banyak error |

---

## 🔥 Fitur Utama

### 1. **Partial Sync** ✅

Jika beberapa pages gagal, sync tetap lanjut dan simpan data yang berhasil:

```
Page 1: ✅ Success - 500 records
Page 2: ✅ Success - 500 records  
Page 3: ❌ Failed - Timeout
Page 4: ✅ Success - 500 records
Page 5: ✅ Success - 500 records

Result: 2000 records berhasil di-sync ✅
```

**Sebelumnya:** Jika 1 page gagal → semua gagal ❌  
**Sekarang:** Jika 1 page gagal → lanjut yang lain ✅

### 2. **Fallback Mode** ✅

Jika API count endpoint gagal, masih coba sync limited records:

```javascript
// Jika gagal get total count
catch (error) {
  if (ALLOW_PARTIAL_SYNC) {
    console.log('Fallback mode: Will sync limited records');
    externalTotal = MAX_RECORDS; // Coba sync 5000 records
  }
}
```

### 3. **One-by-One Fetching** ✅

Fetch halaman satu per satu untuk maximum reliability:

```javascript
// Fetch pages ONE BY ONE
for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
  try {
    // Fetch page
    const pageData = await fetchWithRetry(...);
    
    // Add to collection
    rawVisits = rawVisits.concat(pageData.data);
    
    // Delay before next
    await delay(2000);
    
  } catch (error) {
    // Log error but continue
    console.error(`Failed page ${pageNum}, continuing...`);
    continue; // ← Lanjut ke page berikutnya
  }
}
```

### 4. **Smart Error Handling** ✅

Stop sync jika terlalu banyak pages gagal:

```javascript
if (pagesFailed >= MAX_FAILURES_ALLOWED) {
  console.error(`Too many failures (${pagesFailed}). Stopping.`);
  break;
}
```

### 5. **Extended Timeouts** ✅

- Initial request: **60 detik** (was 30s)
- Data pages: **90 detik** (was 45s)  
- Retry backoff: 1s, 2s, 4s

### 6. **Reduced Load** ✅

- Max records: **5,000** (was 20,000)
- Records per page: **500** (was 1,000)
- Pages at once: **1** (was 3-5)
- Delay between pages: **2 seconds** (was 1s)

---

## 📊 Response Codes

### Success Cases

**200 OK** - Full sync berhasil:
```json
{
  "success": true,
  "message": "Visits sync completed successfully",
  "stats": {
    "fetched": 2500,
    "inserted": 150,
    "updated": 2350,
    "failed": 0,
    "pages_failed": 0,
    "duration_seconds": 180,
    "partial_sync": false
  }
}
```

**207 Multi-Status** - Partial sync (ada yang gagal tapi dapat data):
```json
{
  "success": true,
  "message": "Visits sync completed with warnings (3 pages failed)",
  "stats": {
    "fetched": 2000,
    "inserted": 120,
    "updated": 1880,
    "failed": 0,
    "pages_failed": 3,
    "duration_seconds": 200,
    "partial_sync": true
  },
  "sampleErrors": [
    { "page": 5, "error": "Request timeout after 90000ms" },
    { "page": 8, "error": "Failed to fetch page: 504" }
  ]
}
```

**500 Internal Server Error** - Sync gagal total:
```json
{
  "success": false,
  "message": "Visits sync failed",
  "error": "No data fetched from external API",
  "details": "Check server logs...",
  "recommendations": [
    "Run health check: node scripts/check-external-api-health.js",
    "Contact external API provider",
    "Try again later"
  ]
}
```

---

## 🧪 Testing

### Test 1: Run Sync

```bash
curl -X POST http://localhost:3000/api/visits/sync
```

**Expected logs:**
```
🔄 Starting visits sync with optimized settings...
⚙️  Config: Timeout=90000ms, MaxRecords=5000, PageSize=500
📝 Created sync log entry: 42
📊 Step 1: Fetching total count from external API...
🌐 Fetching (attempt 1/3): https://...
✅ External API has 50000 total records
📄 Step 2: Fetching pages 91 to 100
   Partial sync: ENABLED
   📦 Fetching page 91/100...
   ✅ Page 91 fetched: 500 records. Total so far: 500
   📦 Fetching page 92/100...
   ✅ Page 92 fetched: 500 records. Total so far: 1000
...
✅ Finished fetching. Total records: 5000, Pages failed: 0
💾 Step 4: Saving to database...
✅ Visits sync completed!
```

### Test 2: Check Sync Status

```bash
curl http://localhost:3000/api/visits/sync
```

**Response includes config:**
```json
{
  "success": true,
  "logs": [...],
  "schedule": {...},
  "stats": {...},
  "config": {
    "INITIAL_TIMEOUT": 60000,
    "DATA_PAGE_TIMEOUT": 90000,
    "MAX_RECORDS": 5000,
    ...
  }
}
```

### Test 3: Verify Data

```bash
node -e "
import { query } from './lib/db.js';
const [stats] = await query('SELECT COUNT(*) as total, MAX(synced_at) as last_sync FROM visits');
console.log(stats);
process.exit(0);
"
```

---

## ⚡ Performance Comparison

### Before Optimization

```
Settings:
  Timeout: 30-45s
  Max Records: 20,000
  Page Size: 1,000
  Batch Size: 3-5 pages
  Delay: 1 second
  Partial Sync: NO

Result:
  ❌ Frequent timeouts
  ❌ All-or-nothing (1 error = total fail)
  ❌ Overwhelming API
  ❌ 60-72s timeout, 0 records
```

### After Optimization

```
Settings:
  Timeout: 60-90s
  Max Records: 5,000
  Page Size: 500
  Batch Size: 1 page
  Delay: 2 seconds
  Partial Sync: YES

Expected Result:
  ✅ Better success rate
  ✅ Partial data if some pages fail
  ✅ Gentler on API
  ✅ 3-5 minutes, 2000-5000 records ✅
```

---

## 🎯 Skenario Penggunaan

### Skenario 1: API Normal

```
API Status: ✅ Healthy
Response Time: 5-15 seconds per page

Result:
✅ Full sync berhasil
✅ 5000 records dalam 3-4 menit
✅ 0 pages failed
```

### Skenario 2: API Lambat

```
API Status: ⚠️ Slow
Response Time: 30-60 seconds per page

Result:
✅ Partial sync berhasil  
✅ 3000-4000 records dalam 5-6 menit
⚠️ 2-3 pages timeout tapi lanjut
```

### Skenario 3: API Sangat Lambat

```
API Status: ❌ Very Slow / Down
Response Time: 90+ seconds (timeout)

Result:
⚠️ Minimal sync
✅ 500-1500 records (pages yang sempat success)
❌ 5+ pages failed
❌ Stop after 10 failures
```

### Skenario 4: API Down

```
API Status: ❌ Down
Response Time: Complete timeout

Result:
❌ Sync failed
❌ 0 records
Error: "No data fetched from external API"
Recommendation: Try again later
```

---

## 🔧 Cara Adjust Settings

### Jika API Lebih Cepat

```javascript
// Kurangi timeout, tambah target
const SYNC_CONFIG = {
  INITIAL_TIMEOUT: 30000,        // ← Kurangi jadi 30s
  DATA_PAGE_TIMEOUT: 45000,      // ← Kurangi jadi 45s
  MAX_RECORDS: 10000,            // ← Tambah jadi 10K
  RECORDS_PER_PAGE: 1000,        // ← Tambah jadi 1000
  DELAY_BETWEEN_PAGES: 1000,     // ← Kurangi jadi 1s
};
```

### Jika API Lebih Lambat

```javascript
// Tambah timeout, kurangi target
const SYNC_CONFIG = {
  INITIAL_TIMEOUT: 120000,       // ← Tambah jadi 120s
  DATA_PAGE_TIMEOUT: 180000,     // ← Tambah jadi 180s (3 min)
  MAX_RECORDS: 2000,             // ← Kurangi jadi 2K
  RECORDS_PER_PAGE: 200,         // ← Kurangi jadi 200
  DELAY_BETWEEN_PAGES: 5000,     // ← Tambah jadi 5s
  MAX_FAILURES_ALLOWED: 5,       // ← Lebih strict
};
```

### Disable Partial Sync

```javascript
const SYNC_CONFIG = {
  ALLOW_PARTIAL_SYNC: false,     // ← Set false
  // Jika 1 page gagal, semua gagal
};
```

---

## 📋 Monitoring

### Check Logs in Real-Time

Server logs sekarang sangat detail:

```
🔄 Starting visits sync with optimized settings...
⚙️  Config: Timeout=90000ms, MaxRecords=5000, PageSize=500
📝 Created sync log entry: 42
📊 Step 1: Fetching total count...
🌐 Fetching (attempt 1/3): https://...
⏱️ Request timeout after 60000ms (attempt 1/3)
⏳ Waiting 1000ms before retry...
🌐 Fetching (attempt 2/3): https://...
✅ Fetch successful: 200
✅ External API has 50000 total records
📄 Step 2: Fetching pages...
   📦 Fetching page 91/100...
   ✅ Page 91 fetched: 500 records
   📦 Fetching page 92/100...
   ❌ Failed to fetch page 92: Request timeout
   ⚠️  Continuing with partial sync (1 pages failed)
```

### Check Database Logs

```sql
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
LIMIT 5;
```

---

## 🎉 Kesimpulan

### ✅ Improvements

1. **Timeout 2x lebih lama** - 60-90s vs 30-45s
2. **Partial sync** - Dapat data meskipun ada yang gagal
3. **Fallback mode** - Tetap coba sync jika count API gagal
4. **One-by-one fetch** - Lebih reliable
5. **Smaller batches** - 500 records vs 1000
6. **Longer delays** - 2s vs 1s
7. **Better logging** - Detail setiap step
8. **Smart limits** - Stop jika terlalu banyak error

### 📊 Expected Results

**Dengan External API Normal:**
- ✅ 95%+ success rate
- ✅ 3-5 menit untuk 5000 records
- ✅ 0-1 pages failed

**Dengan External API Lambat:**
- ✅ 70-80% success rate  
- ✅ 5-8 menit untuk 3000-4000 records
- ⚠️ 2-5 pages failed tapi dapat data

**Dengan External API Down:**
- ❌ Gagal dengan error message yang jelas
- 📝 Logged untuk troubleshooting
- 💡 Recommendations diberikan

### 🚀 Ready to Use!

Sync code sekarang jauh lebih robust dan bisa handle external API yang lambat/tidak stabil.

---

**Status:** ✅ Production Ready  
**Last Updated:** 4 November 2025

