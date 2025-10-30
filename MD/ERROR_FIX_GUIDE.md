# 🔧 Error Fix Guide - Sistem Caching

## Error Yang Terjadi

Anda mengalami 2 error utama:

### 1. ❌ `Table 'phc_dashboard.visits_cache' doesn't exist`
**Penyebab:** Tabel cache belum dibuat di database.

### 2. ❌ `Incorrect arguments to mysqld_stmt_execute`
**Penyebab:** Bug di fallback code (sudah diperbaiki).

---

## ✅ Solusi Lengkap

### Step 1: Buat Tabel Cache (WAJIB!)

Pilih salah satu metode berikut:

#### **Metode A: Via MySQL Command Line (Recommended)**

```bash
# 1. Buka MySQL
mysql -u root -p
# Masukkan password MySQL Anda

# 2. Pilih database
USE phc_dashboard;

# 3. Import file migration
SOURCE init-scripts/27-create-api-cache-tables.sql;

# 4. Verifikasi tabel sudah dibuat
SHOW TABLES LIKE '%cache%';
# Seharusnya muncul: visits_cache, patients_cache

# 5. Keluar
EXIT;
```

#### **Metode B: Via phpMyAdmin**

1. Buka phpMyAdmin di browser
2. Login ke MySQL
3. Klik database `phc_dashboard` di sidebar kiri
4. Klik tab **"Import"** di atas
5. Klik **"Choose File"** dan pilih file:
   ```
   /Users/wirawanawe/Project/dash-app/init-scripts/27-create-api-cache-tables.sql
   ```
6. Scroll ke bawah dan klik **"Go"**
7. Tunggu sampai selesai (akan muncul pesan sukses)

#### **Metode C: Via MySQL Workbench**

1. Buka MySQL Workbench
2. Connect ke server MySQL Anda
3. Pilih schema `phc_dashboard`
4. Menu: **File → Run SQL Script**
5. Browse dan pilih file:
   ```
   /Users/wirawanawe/Project/dash-app/init-scripts/27-create-api-cache-tables.sql
   ```
6. Klik **"Run"**

#### **Metode D: Copy-Paste Manual**

1. Buka file `init-scripts/27-create-api-cache-tables.sql`
2. Copy semua isi file (Cmd+A, Cmd+C)
3. Buka MySQL client atau phpMyAdmin
4. Paste ke SQL editor
5. Execute/Run query

---

### Step 2: Verifikasi Tabel Sudah Dibuat

```sql
-- Jalankan query ini untuk memastikan
USE phc_dashboard;

-- Check tabel cache
SHOW TABLES LIKE '%cache%';

-- Check struktur
DESCRIBE visits_cache;
DESCRIBE patients_cache;
DESCRIBE sync_logs;
DESCRIBE sync_schedules;

-- Check data default
SELECT * FROM sync_schedules;
```

**Expected Result:**
- 4 tabel baru: `visits_cache`, `patients_cache`, `sync_logs`, `sync_schedules`
- `sync_schedules` ada 5 rows (visits, patients, doctors, clinics, all)

---

### Step 3: Initial Sync Data

Setelah tabel dibuat, sync data dari API:

```bash
# Pastikan app running
npm run dev

# Di terminal lain, jalankan sync
node scripts/auto-sync-data.js all
```

**Output yang diharapkan:**
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

═══════════════════════════════════════════
✅ Sync completed successfully
```

**Jika ada error saat sync**, tunggu sebentar dan coba lagi:
```bash
# Sync visits only
node scripts/auto-sync-data.js visits

# Sync patients only
node scripts/auto-sync-data.js patients
```

---

### Step 4: Test Aplikasi

1. **Buka browser** dan reload page
2. **Test visits page**: `http://localhost:3000/visits`
3. **Test patients page**: `http://localhost:3000/patients`

**Seharusnya:**
- ✅ Loading sangat cepat (<1 detik)
- ✅ Tidak ada error di console
- ✅ Data muncul dengan baik

---

## 🔍 Troubleshooting

### Problem: Migration gagal

**Error:** `ERROR 1050 (42S01): Table 'visits_cache' already exists`

**Solusi:**
```sql
-- Drop table yang ada dan buat ulang
DROP TABLE IF EXISTS visits_cache;
DROP TABLE IF EXISTS patients_cache;
DROP TABLE IF EXISTS sync_logs;
DROP TABLE IF EXISTS sync_schedules;

-- Lalu import ulang
SOURCE init-scripts/27-create-api-cache-tables.sql;
```

---

### Problem: Sync gagal - Connection refused

**Error:** `ECONNREFUSED` atau `fetch failed`

**Solusi:**
```bash
# Pastikan app running
npm run dev

# Tunggu sampai muncul:
# ✓ Ready in [x]ms
# ○ Local: http://localhost:3000

# Baru jalankan sync
node scripts/auto-sync-data.js all
```

---

### Problem: Cache masih kosong setelah sync

**Check:**
```sql
-- Check jumlah data
SELECT COUNT(*) FROM visits_cache;
SELECT COUNT(*) FROM patients_cache;

-- Check sync logs
SELECT * FROM sync_logs 
ORDER BY started_at DESC 
LIMIT 5;

-- Check apakah ada error
SELECT * FROM sync_logs 
WHERE status = 'failed';
```

**Jika failed:**
1. Check `error_message` di sync_logs
2. Check koneksi ke external API
3. Try sync manual via API:
   ```bash
   curl -X POST http://localhost:3000/api/visits/sync
   curl -X POST http://localhost:3000/api/patients/sync
   ```

---

### Problem: Still loading slow

**Check apakah menggunakan cache:**
```javascript
// Di browser console:
fetch('/api/visits')
  .then(r => r.json())
  .then(d => console.log('Data length:', d.data.length, 'Pagination:', d.pagination))
```

**Expected:**
- Response time: <1 second
- Data ada dan lengkap

**Jika masih lambat:**
1. Check apakah tabel cache terisi:
   ```sql
   SELECT COUNT(*) FROM visits_cache;
   ```
2. Jika kosong (0), berarti sync belum berhasil. Ulangi Step 3.
3. Check console browser untuk error
4. Check terminal untuk error message

---

## ✅ Checklist Setup

- [ ] Database migration berhasil (4 tabel baru dibuat)
- [ ] Tabel sync_schedules terisi (5 rows)
- [ ] Initial sync completed
- [ ] visits_cache terisi (ada data)
- [ ] patients_cache terisi (ada data)
- [ ] Test page `/visits` - loading cepat
- [ ] Test page `/patients` - loading cepat
- [ ] No errors di browser console
- [ ] No errors di terminal

---

## 🎉 Jika Semua Berhasil

Setelah semua checklist di atas terpenuhi:

1. **Loading sekarang 10-30x lebih cepat!** ⚡
2. **Setup auto-refresh** (optional):
   ```bash
   # Edit ecosystem.config.cjs, tambahkan sync tasks
   # Atau setup cron job
   # Lihat QUICK_START_CACHING.md untuk detail
   ```

---

## 📞 Need Help?

Jika masih ada masalah:

1. **Check error message** di terminal dan browser console
2. **Check sync logs**:
   ```sql
   SELECT * FROM sync_logs 
   WHERE status = 'failed' 
   ORDER BY started_at DESC;
   ```
3. **Run verbose test**:
   ```bash
   # Test database connection
   mysql -u root -p -e "USE phc_dashboard; SHOW TABLES;"
   
   # Test API
   curl http://localhost:3000/api/visits/sync
   ```

---

**Good luck!** 🚀

Jika sudah berhasil, hapus file ini atau simpan untuk referensi.

