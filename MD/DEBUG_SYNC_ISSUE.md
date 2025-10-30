# 🔧 Debug: Data Tidak Masuk ke Database

Panduan step-by-step untuk fix masalah data tidak masuk ke database lokal.

## 📋 Checklist Diagnosis

Ikuti step berikut **SATU PER SATU** dan catat hasilnya:

---

## ✅ STEP 1: Check Tabel Sudah Ada

Buka terminal MySQL dan jalankan:

```bash
mysql -u root -p
# Masukkan password MySQL Anda
```

Lalu jalankan query ini:

```sql
USE phc_dashboard;

-- Check tabel cache ada atau tidak
SHOW TABLES LIKE '%cache%';
```

**Expected Output:**
```
+--------------------------------+
| Tables_in_phc_dashboard (%cache%) |
+--------------------------------+
| patients_cache                 |
| visits_cache                   |
+--------------------------------+
```

### ❌ Jika Tidak Ada Tabel:

**Solusi:** Tabel belum dibuat, jalankan migration:

```sql
-- Masih di MySQL prompt
SOURCE init-scripts/27-create-api-cache-tables.sql;

-- Atau kalau mau pakai yang lengkap:
SOURCE init-scripts/28-update-cache-tables.sql;

-- Verify
SHOW TABLES LIKE '%cache%';
```

### ✅ Jika Tabel Sudah Ada:

Lanjut ke Step 2.

---

## ✅ STEP 2: Check Struktur Tabel

Masih di MySQL, jalankan:

```sql
-- Check kolom visits_cache
DESCRIBE visits_cache;

-- Check kolom patients_cache
DESCRIBE patients_cache;
```

**Expected:** Seharusnya ada banyak kolom (external_id, visit_number, patient_nik, dll.)

### ❌ Jika Struktur Salah/Kurang Lengkap:

```sql
-- Drop dan buat ulang
DROP TABLE IF EXISTS visits_cache;
DROP TABLE IF EXISTS patients_cache;
DROP TABLE IF EXISTS sync_logs;
DROP TABLE IF EXISTS sync_schedules;

-- Import ulang
SOURCE init-scripts/28-update-cache-tables.sql;
```

### ✅ Jika Struktur OK:

Lanjut ke Step 3.

---

## ✅ STEP 3: Check Data di Tabel

```sql
-- Check jumlah data
SELECT COUNT(*) as total_visits FROM visits_cache;
SELECT COUNT(*) as total_patients FROM patients_cache;
```

**Expected:**
- Jika sudah sync: Angka > 0
- Jika belum sync: 0

### Hasil COUNT = 0:

**Artinya:** Sync belum dijalankan atau gagal. Lanjut ke Step 4.

### Hasil COUNT > 0:

**Artinya:** Data sudah ada! Mungkin masalahnya di API endpoint.  
Lanjut ke Step 6.

---

## ✅ STEP 4: Check Sync Logs

```sql
-- Check apakah pernah sync
SELECT * FROM sync_logs ORDER BY started_at DESC LIMIT 5;
```

### Hasil: Empty / No rows

**Artinya:** Belum pernah run sync sama sekali.  
**Solusi:** Lanjut ke Step 5 untuk run sync.

### Hasil: Ada rows tapi status = 'failed'

**Check error:**
```sql
SELECT 
  id,
  entity_type,
  status,
  error_message,
  started_at
FROM sync_logs 
WHERE status = 'failed'
ORDER BY started_at DESC 
LIMIT 3;
```

**Copy `error_message` dan lanjut ke Step 7 (Common Errors).**

### Hasil: Ada rows dengan status = 'completed'

**Check detail:**
```sql
SELECT 
  entity_type,
  status,
  records_fetched,
  records_inserted,
  records_updated,
  duration_seconds,
  started_at
FROM sync_logs 
WHERE status = 'completed'
ORDER BY started_at DESC 
LIMIT 3;
```

Jika `records_inserted` = 0, ada masalah. Lanjut ke Step 7.

---

## ✅ STEP 5: Run Sync Manual

### 5A: Pastikan App Running

```bash
# Terminal 1: Start app
cd /Users/wirawanawe/Project/dash-app
npm run dev

# Tunggu sampai muncul:
# ✓ Ready in [x]ms
# ○ Local: http://localhost:3000
```

### 5B: Test API Available

```bash
# Terminal 2: Test API
curl http://localhost:3000/api/health

# Expected: {"status":"ok"}
```

### 5C: Run Sync

```bash
# Sync all data
node scripts/auto-sync-data.js all

# Atau sync satu-satu:
node scripts/auto-sync-data.js visits
node scripts/auto-sync-data.js patients
```

**Watch output for errors!**

### ✅ Expected Success Output:

```
╔══════════════════════════════════════════╗
║   PHC Dashboard - Auto Sync Data         ║
╚══════════════════════════════════════════╝
   Time: [timestamp]
   Entity: all
   App URL: http://localhost:3000

🔄 Syncing all...
✅ all sync completed in [x]s
   Total Fetched: [number]
   Total Inserted: [number]
   Total Updated: [number]

════════════════════════════════════════════
✅ Sync completed successfully
```

### ❌ Jika Ada Error:

Copy error message lengkap dan lanjut ke Step 7.

---

## ✅ STEP 6: Verify Data Masuk

Setelah sync, check lagi:

```sql
-- Check count
SELECT COUNT(*) as total FROM visits_cache;
SELECT COUNT(*) as total FROM patients_cache;

-- Check sample data
SELECT 
  visit_number,
  patient_name,
  visit_date,
  clinic,
  synced_at
FROM visits_cache 
ORDER BY synced_at DESC 
LIMIT 5;

SELECT 
  nik,
  name,
  gender,
  synced_at
FROM patients_cache 
ORDER BY synced_at DESC 
LIMIT 5;
```

### ✅ Jika Ada Data:

**SUCCESS!** Data sudah masuk. Lanjut test di browser:
- `http://localhost:3000/visits`
- `http://localhost:3000/patients`

Seharusnya loading cepat!

### ❌ Jika Masih Kosong:

Ada masalah serious. Lanjut ke Step 7.

---

## ✅ STEP 7: Common Errors & Solutions

### Error 1: Table doesn't exist

**Error:**
```
Table 'phc_dashboard.visits_cache' doesn't exist
```

**Solusi:**
```sql
-- Jalankan migration
USE phc_dashboard;
SOURCE init-scripts/28-update-cache-tables.sql;
```

---

### Error 2: ECONNREFUSED

**Error:**
```
connect ECONNREFUSED 127.0.0.1:3000
```

**Penyebab:** App tidak running atau belum ready.

**Solusi:**
```bash
# 1. Stop app kalau lagi running (Ctrl+C)
# 2. Start ulang
npm run dev

# 3. Tunggu sampai benar-benar ready
# 4. Test dulu
curl http://localhost:3000/api/health

# 5. Baru sync
node scripts/auto-sync-data.js all
```

---

### Error 3: External API Timeout

**Error:**
```
Failed to fetch from external API
TimeoutError
```

**Penyebab:** API eksternal slow/down.

**Solusi:**
```bash
# Try sync with retry
node scripts/auto-sync-data.js visits
# Wait 1 minute
node scripts/auto-sync-data.js patients
```

Atau test API eksternal dulu:
```bash
curl "https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan?page=1&limit=1"
```

---

### Error 4: Duplicate Entry

**Error:**
```
Duplicate entry 'xxx' for key 'unique_external_id'
```

**Penyebab:** Data sudah ada, coba sync lagi.

**Solusi:**
```sql
-- Check data yang conflict
SELECT COUNT(*) FROM visits_cache;

-- Kalau mau start fresh:
TRUNCATE visits_cache;
TRUNCATE patients_cache;
TRUNCATE sync_logs;

-- Lalu sync ulang
```

---

### Error 5: Column doesn't exist

**Error:**
```
Unknown column 'xxx' in 'field list'
```

**Penyebab:** Struktur tabel tidak sesuai dengan code.

**Solusi:**
```sql
-- Drop dan recreate dengan struktur baru
DROP TABLE IF EXISTS visits_cache;
DROP TABLE IF EXISTS patients_cache;

-- Import struktur lengkap
SOURCE init-scripts/28-update-cache-tables.sql;

-- Verify struktur
DESCRIBE visits_cache;

-- Sync ulang
```

---

## 🔧 Manual Sync via API (Alternative)

Jika script tidak work, coba via API langsung:

### Sync Visits:

```bash
curl -X POST http://localhost:3000/api/visits/sync
```

### Sync Patients:

```bash
curl -X POST http://localhost:3000/api/patients/sync
```

### Check Response:

**Success:**
```json
{
  "success": true,
  "message": "Visits sync completed successfully",
  "stats": {
    "fetched": 1000,
    "inserted": 950,
    "updated": 50,
    "duration_seconds": 45
  }
}
```

**Failed:**
```json
{
  "success": false,
  "message": "Visits sync failed",
  "error": "[error message]"
}
```

---

## 📊 Monitoring Script

Buat script untuk check status:

```bash
#!/bin/bash
# File: check-sync-status.sh

echo "=== SYNC STATUS CHECK ==="
echo ""

mysql -u root -p phc_dashboard -e "
SELECT 'Visits Cache:' as check_type, COUNT(*) as total FROM visits_cache
UNION ALL
SELECT 'Patients Cache:', COUNT(*) FROM patients_cache
UNION ALL
SELECT 'Sync Logs:', COUNT(*) FROM sync_logs;

SELECT '' as '';
SELECT 'Latest Syncs:' as info;
SELECT 
  entity_type,
  status,
  records_inserted,
  started_at
FROM sync_logs 
ORDER BY started_at DESC 
LIMIT 5;
"
```

Jalankan:
```bash
chmod +x check-sync-status.sh
./check-sync-status.sh
```

---

## 🆘 Quick Fix Commands

Jika bingung, copy-paste command ini satu per satu:

```bash
# 1. Check app running
curl http://localhost:3000/api/health

# 2. If not running, start it
npm run dev
# Wait for ready...

# 3. In new terminal, sync visits
node scripts/auto-sync-data.js visits

# 4. Check hasil
curl "http://localhost:3000/api/visits?page=1&limit=1"

# 5. If OK, sync patients
node scripts/auto-sync-data.js patients

# 6. Check hasil
curl "http://localhost:3000/api/patients?page=1&limit=1"
```

---

## 📝 Debug Checklist

Isi checklist ini untuk track progress:

```
[ ] Tabel cache sudah dibuat
[ ] Struktur tabel benar (DESCRIBE)
[ ] App sudah running (npm run dev)
[ ] API /health returns OK
[ ] Sync script dijalankan (node scripts/auto-sync-data.js)
[ ] Sync logs menunjukkan 'completed'
[ ] visits_cache COUNT > 0
[ ] patients_cache COUNT > 0
[ ] Sample data keliatan di query SELECT
[ ] Browser /visits loading cepat
[ ] Browser /patients loading cepat
```

---

## 🎯 Next Actions

**Jika semua ✅:**
Congrats! Data sudah masuk. Setup auto-refresh:
- Lihat `QUICK_START_CACHING.md`

**Jika masih ❌:**
1. Screenshot error message lengkap
2. Copy output dari `SELECT * FROM sync_logs ORDER BY started_at DESC LIMIT 1;`
3. Share untuk troubleshoot lebih lanjut

---

**Last Resort:**

Jika semua gagal, coba fresh install:

```bash
# Backup dulu jika ada data penting
mysqldump -u root -p phc_dashboard > backup.sql

# Drop database dan buat ulang
mysql -u root -p -e "DROP DATABASE phc_dashboard; CREATE DATABASE phc_dashboard;"

# Import semua script dari awal
mysql -u root -p phc_dashboard < init-scripts/01-create-tables.sql
mysql -u root -p phc_dashboard < init-scripts/28-update-cache-tables.sql

# Sync ulang
node scripts/auto-sync-data.js all
```

---

**Status Update:** Setelah coba steps di atas, let me know hasil dan error apa yang muncul!

