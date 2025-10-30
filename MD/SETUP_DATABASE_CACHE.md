# 🗄️ Setup Database Cache - Panduan Lengkap

Panduan step-by-step untuk setup sistem caching database.

## 📋 Overview

Sistem ini akan:
1. ✅ Membuat tabel cache untuk visits dan patients
2. ✅ Menyimpan data dari API eksternal ke database lokal
3. ✅ Loading 10-30x lebih cepat
4. ✅ Auto-refresh berkala untuk data real-time

---

## 🚀 Quick Setup (5 Menit)

### Opsi 1: Setup Baru (Recommended)

Jika Anda belum pernah menjalankan migration sebelumnya:

```bash
# 1. Login ke MySQL
mysql -u root -p

# 2. Jalankan migration
USE phc_dashboard;
SOURCE init-scripts/27-create-api-cache-tables.sql;

# 3. Verifikasi
SHOW TABLES LIKE '%cache%';
# Seharusnya muncul 4 tabel baru

# 4. Keluar
EXIT;
```

### Opsi 2: Update dari Setup Lama

Jika Anda sudah menjalankan migration 27 sebelumnya dan ingin update:

```bash
# 1. Login ke MySQL
mysql -u root -p

# 2. Update struktur tabel
USE phc_dashboard;
SOURCE init-scripts/28-update-cache-tables.sql;

# 3. Verifikasi
DESCRIBE visits_cache;
DESCRIBE patients_cache;

# 4. Keluar
EXIT;
```

### Opsi 3: Fresh Install (Start dari Awal)

Jika Anda ingin start dari awal (hapus tabel lama):

```bash
# 1. Login ke MySQL
mysql -u root -p

# 2. Hapus tabel lama (HATI-HATI! Data akan hilang)
USE phc_dashboard;
DROP TABLE IF EXISTS visits_cache;
DROP TABLE IF EXISTS patients_cache;
DROP TABLE IF EXISTS sync_logs;
DROP TABLE IF EXISTS sync_schedules;

# 3. Buat ulang dengan struktur baru
SOURCE init-scripts/28-update-cache-tables.sql;

# 4. Verifikasi
SHOW TABLES LIKE '%cache%';

# 5. Keluar
EXIT;
```

---

## 🔧 Setup via phpMyAdmin

### Step 1: Login

1. Buka browser, akses phpMyAdmin
2. Login dengan kredensial MySQL Anda

### Step 2: Pilih Database

1. Klik database **`phc_dashboard`** di sidebar kiri
2. Pastikan database sudah dipilih (highlight biru)

### Step 3: Import SQL

**Untuk Setup Baru:**
1. Klik tab **"Import"** di bagian atas
2. Klik **"Choose File"**
3. Browse ke: `/Users/wirawanawe/Project/dash-app/init-scripts/27-create-api-cache-tables.sql`
4. Scroll ke bawah, klik **"Go"**
5. Tunggu sampai selesai (akan muncul pesan "Import has been successfully finished")

**Untuk Update:**
1. Klik tab **"Import"** di bagian atas
2. Klik **"Choose File"**
3. Browse ke: `/Users/wirawanawe/Project/dash-app/init-scripts/28-update-cache-tables.sql`
4. Scroll ke bawah, klik **"Go"**
5. Tunggu sampai selesai

### Step 4: Verifikasi

1. Klik **Refresh** di browser atau klik database `phc_dashboard` lagi
2. Lihat daftar tabel, seharusnya ada:
   - ✅ `visits_cache`
   - ✅ `patients_cache`
   - ✅ `sync_logs`
   - ✅ `sync_schedules`

3. Klik tabel `sync_schedules`
4. Klik tab **"Browse"**
5. Seharusnya ada 5 rows (visits, patients, doctors, clinics, all)

---

## 📊 Verifikasi Setup

### Check 1: Tabel Sudah Dibuat

```sql
USE phc_dashboard;

-- List semua tabel cache
SHOW TABLES LIKE '%cache%';

-- Expected output:
-- patients_cache
-- sync_logs
-- sync_schedules
-- visits_cache
```

### Check 2: Struktur Tabel Benar

```sql
-- Check visits_cache
DESCRIBE visits_cache;

-- Seharusnya ada kolom:
-- id, external_id, visit_number, patient_nik, patient_name, etc.

-- Check patients_cache
DESCRIBE patients_cache;

-- Seharusnya ada kolom:
-- id, external_id, mrn, nik, nip, name, etc.
```

### Check 3: Views Tersedia (Jika pakai update)

```sql
-- List views
SHOW FULL TABLES WHERE TABLE_TYPE LIKE 'VIEW';

-- Expected:
-- v_visits_summary
-- v_visits_stats
-- v_patients_summary
```

### Check 4: Stored Procedures (Jika pakai update)

```sql
-- List procedures
SHOW PROCEDURE STATUS WHERE Db = 'phc_dashboard';

-- Expected:
-- sp_get_visits_by_nik
-- sp_get_sync_statistics
-- sp_cleanup_old_logs
```

### Check 5: Sync Schedules

```sql
-- Check default schedules
SELECT * FROM sync_schedules;

-- Expected output:
-- Entity     | Enabled | Interval (min) | Last Sync | Next Sync
-- visits     | 1       | 30             | NULL      | NULL
-- patients   | 1       | 60             | NULL      | NULL
-- doctors    | 1       | 120            | NULL      | NULL
-- clinics    | 1       | 120            | NULL      | NULL
-- all        | 0       | 240            | NULL      | NULL
```

---

## 🔄 Initial Data Sync

Setelah tabel dibuat, sync data dari API:

### Sync Semua Data (Recommended untuk pertama kali)

```bash
# Pastikan app sudah running
npm run dev

# Di terminal baru, jalankan sync
node scripts/auto-sync-data.js all
```

**Expected Output:**
```
╔══════════════════════════════════════════╗
║   PHC Dashboard - Auto Sync Data         ║
╚══════════════════════════════════════════╝
   Time: [timestamp]
   Entity: all
   App URL: http://localhost:3000

🔄 Syncing all...
   URL: http://localhost:3000/api/sync/all

✅ all sync completed in 120.5s
   Total Fetched: 15000
   Total Inserted: 15000
   Total Updated: 0

════════════════════════════════════════════
✅ Sync completed successfully
```

### Sync Individual Entity

```bash
# Sync visits only
node scripts/auto-sync-data.js visits

# Sync patients only
node scripts/auto-sync-data.js patients

# Sync doctors only
node scripts/auto-sync-data.js doctors

# Sync clinics only
node scripts/auto-sync-data.js clinics
```

---

## ✅ Verify Data Tersimpan

### Check via SQL

```sql
-- Check jumlah data
SELECT 
  'visits' as entity,
  COUNT(*) as total 
FROM visits_cache
UNION ALL
SELECT 
  'patients' as entity,
  COUNT(*) as total 
FROM patients_cache;

-- Check sample data visits
SELECT 
  visit_number,
  patient_name,
  visit_date,
  clinic,
  doctor_name
FROM visits_cache
ORDER BY visit_date DESC
LIMIT 10;

-- Check sample data patients
SELECT 
  nik,
  name,
  gender,
  phone,
  insurance
FROM patients_cache
LIMIT 10;
```

### Check via API

```bash
# Check visits
curl "http://localhost:3000/api/visits?page=1&limit=10"

# Check patients
curl "http://localhost:3000/api/patients?page=1&limit=10"

# Check sync status
curl "http://localhost:3000/api/sync/all"
```

### Check via Browser

1. Buka browser
2. Go to: `http://localhost:3000/visits`
3. Seharusnya loading **super cepat** (<1 detik)
4. Data muncul dengan lengkap

---

## 🐛 Troubleshooting

### Problem 1: Permission Denied

**Error:**
```
ERROR 1045 (28000): Access denied for user 'root'@'localhost'
```

**Solution:**
```bash
# Check MySQL user dan password
mysql -u root -p
# Enter password yang benar

# Atau gunakan user lain
mysql -u your_username -p
```

---

### Problem 2: Table Already Exists

**Error:**
```
ERROR 1050 (42S01): Table 'visits_cache' already exists
```

**Solution:**

**Opsi A:** Skip error (table sudah ada, aman)
- Jika struktur sudah benar, lanjut ke sync data

**Opsi B:** Drop dan buat ulang
```sql
DROP TABLE IF EXISTS visits_cache;
DROP TABLE IF EXISTS patients_cache;
DROP TABLE IF EXISTS sync_logs;
DROP TABLE IF EXISTS sync_schedules;

-- Lalu import ulang
SOURCE init-scripts/28-update-cache-tables.sql;
```

---

### Problem 3: Sync Failed - ECONNREFUSED

**Error:**
```
❌ all sync error: connect ECONNREFUSED 127.0.0.1:3000
```

**Solution:**
```bash
# 1. Pastikan app running
npm run dev

# 2. Tunggu sampai ready
# ✓ Ready in [x]ms
# ○ Local: http://localhost:3000

# 3. Baru jalankan sync di terminal baru
node scripts/auto-sync-data.js all
```

---

### Problem 4: Cache Empty After Sync

**Check sync logs:**
```sql
-- Check hasil sync
SELECT 
  entity_type,
  status,
  records_fetched,
  records_inserted,
  records_updated,
  error_message,
  started_at,
  completed_at
FROM sync_logs
ORDER BY started_at DESC
LIMIT 5;

-- Check error
SELECT * FROM sync_logs 
WHERE status = 'failed'
ORDER BY started_at DESC;
```

**Jika status = 'failed':**
1. Lihat `error_message` untuk detail error
2. Check koneksi ke external API
3. Try sync manual via API:
   ```bash
   curl -X POST http://localhost:3000/api/visits/sync
   ```

---

### Problem 5: Slow Query

**Check indexes:**
```sql
-- Check indexes pada visits_cache
SHOW INDEX FROM visits_cache;

-- Check indexes pada patients_cache
SHOW INDEX FROM patients_cache;

-- Jika perlu rebuild
OPTIMIZE TABLE visits_cache;
OPTIMIZE TABLE patients_cache;
```

---

## 📈 Monitoring

### Daily Monitoring Queries

```sql
-- 1. Cache statistics
CALL sp_get_sync_statistics();

-- 2. Recent syncs
SELECT * FROM sync_logs 
WHERE started_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY started_at DESC;

-- 3. Failed syncs
SELECT * FROM sync_logs 
WHERE status = 'failed' 
  AND started_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY started_at DESC;

-- 4. Data growth
SELECT 
  DATE(synced_at) as date,
  COUNT(*) as visits_synced
FROM visits_cache
WHERE synced_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(synced_at)
ORDER BY date DESC;
```

### Check Table Size

```sql
SELECT 
  TABLE_NAME as 'Table',
  ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS 'Size (MB)',
  TABLE_ROWS as 'Rows'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'phc_dashboard'
  AND TABLE_NAME IN ('visits_cache', 'patients_cache')
ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;
```

---

## 🎯 Next Steps

Setelah setup berhasil:

1. **✅ Setup Auto-Refresh** (optional tapi recommended)
   - Lihat: `QUICK_START_CACHING.md` section "Setup Auto-Refresh"
   - Options: PM2 atau Cron Job

2. **✅ Monitoring**
   - Setup daily check untuk sync status
   - Monitor table size
   - Check failed syncs

3. **✅ Optimization**
   - Adjust sync intervals sesuai kebutuhan
   - Setup cleanup untuk data lama
   - Monitor query performance

4. **✅ Documentation**
   - Baca `DATABASE_STRUCTURE.md` untuk detail struktur
   - Baca `CACHING_SYSTEM.md` untuk sistem lengkap
   - Bookmark query examples untuk daily use

---

## 📚 Documentation

- **QUICK_START_CACHING.md** - Quick setup guide
- **DATABASE_STRUCTURE.md** - Struktur tabel lengkap
- **CACHING_SYSTEM.md** - Dokumentasi sistem
- **ERROR_FIX_GUIDE.md** - Troubleshooting guide

---

## ✅ Checklist

Setup completed jika semua ini ✅:

- [ ] Tabel cache dibuat (visits_cache, patients_cache)
- [ ] Tabel support dibuat (sync_logs, sync_schedules)
- [ ] Views dibuat (jika pakai update)
- [ ] Stored procedures dibuat (jika pakai update)
- [ ] Initial sync completed
- [ ] visits_cache ada data (COUNT > 0)
- [ ] patients_cache ada data (COUNT > 0)
- [ ] sync_logs ada entry success
- [ ] Page `/visits` loading cepat (<1s)
- [ ] Page `/patients` loading cepat (<1s)
- [ ] No errors di browser console
- [ ] No errors di terminal

---

**🎉 Selamat! Database cache sudah siap digunakan.**

Loading sekarang **10-30x lebih cepat**! ⚡

---

**Support:** Jika ada masalah, check dokumentasi lain atau lihat error logs di `sync_logs` table.

