# ⚡ Quick Fix: Data Tidak Masuk ke Database

**Problem:** Data dari API belum masuk ke database lokal  
**Goal:** Data masuk ke database dan loading jadi cepat

---

## 🚀 Quick Steps (5 Menit)

### STEP 1: Run Diagnostic Tool

```bash
cd /Users/wirawanawe/Project/dash-app
node scripts/check-sync-status.js
```

Tool ini akan check:
- ✅ Tabel cache sudah ada atau belum
- ✅ Berapa banyak data di cache
- ✅ History sync terakhir
- ✅ Sample data

**Output akan memberitahu Anda apa yang harus dilakukan!**

---

### STEP 2: Fix Based on Output

#### Skenario A: "No cache tables found"

**Artinya:** Tabel belum dibuat

**Fix:**
```bash
mysql -u root -p
# Masukkan password MySQL

# Lalu:
USE phc_dashboard;
SOURCE init-scripts/28-update-cache-tables.sql;
EXIT;
```

**Test lagi:**
```bash
node scripts/check-sync-status.js
```

---

#### Skenario B: "NO DATA IN CACHE"

**Artinya:** Tabel ada tapi kosong, perlu sync

**Fix:**

**Terminal 1** - Start app:
```bash
npm run dev
# Tunggu sampai "✓ Ready"
```

**Terminal 2** - Run sync:
```bash
# Sync semua data
node scripts/auto-sync-data.js all

# ATAU sync satu-satu:
node scripts/auto-sync-data.js visits
node scripts/auto-sync-data.js patients
```

**Tunggu sampai selesai** (2-5 menit tergantung data)

**Test lagi:**
```bash
node scripts/check-sync-status.js
```

---

#### Skenario C: "DATA AVAILABLE IN CACHE"

**Artinya:** ✅ **SUKSES!** Data sudah ada di database

**Test di browser:**
- http://localhost:3000/visits
- http://localhost:3000/patients

**Seharusnya loading super cepat (<1 detik)!** ⚡

---

## 🔧 Troubleshooting

### Error: "ECONNREFUSED"

**Problem:** App tidak running

**Fix:**
```bash
# Terminal 1: Start app
npm run dev

# Wait for "✓ Ready in [x]ms"
# ○ Local: http://localhost:3000

# Terminal 2: Test
curl http://localhost:3000/api/health
# Should return: {"status":"ok"}

# Then sync
node scripts/auto-sync-data.js all
```

---

### Error: "Table doesn't exist"

**Problem:** Migration belum dijalankan

**Fix:**
```bash
mysql -u root -p phc_dashboard < init-scripts/28-update-cache-tables.sql
```

---

### Error: "Connection refused to MySQL"

**Problem:** MySQL tidak running atau credentials salah

**Fix:**
```bash
# Check MySQL running
mysql -u root -p
# Jika tidak bisa connect, start MySQL dulu

# Mac:
brew services start mysql

# Linux:
sudo systemctl start mysql

# Windows:
# Start MySQL via Services
```

---

### Sync Stuck/Lambat

**Problem:** API eksternal slow

**Fix:**
```bash
# Sync satu-satu dengan delay
node scripts/auto-sync-data.js visits

# Tunggu selesai...

node scripts/auto-sync-data.js patients
```

---

### Sync Failed - Check Logs

```bash
# Check error di sync logs
mysql -u root -p phc_dashboard -e "
SELECT 
  entity_type,
  status,
  error_message,
  started_at
FROM sync_logs 
WHERE status = 'failed'
ORDER BY started_at DESC 
LIMIT 3;
"
```

Copy error message untuk troubleshoot lebih lanjut.

---

## 📋 Complete Checklist

Jalankan checklist ini untuk memastikan semuanya OK:

```bash
# 1. Check diagnostic
node scripts/check-sync-status.js
# Expected: "DATA AVAILABLE IN CACHE"

# 2. Check via SQL
mysql -u root -p phc_dashboard -e "
SELECT COUNT(*) as visits FROM visits_cache;
SELECT COUNT(*) as patients FROM patients_cache;
"
# Expected: Number > 0

# 3. Test API
curl "http://localhost:3000/api/visits?page=1&limit=1"
# Expected: JSON dengan data visits

# 4. Test browser
# Visit: http://localhost:3000/visits
# Expected: Loading cepat, data muncul
```

---

## 🎯 One-Liner Commands

Jika bingung, copy-paste ini satu per satu:

```bash
# 1. Check status
node scripts/check-sync-status.js

# 2. If tables missing, create them
mysql -u root -p phc_dashboard < init-scripts/28-update-cache-tables.sql

# 3. Start app (Terminal 1)
npm run dev

# 4. Sync data (Terminal 2)
node scripts/auto-sync-data.js all

# 5. Check status lagi
node scripts/check-sync-status.js

# 6. Open browser
open http://localhost:3000/visits
```

---

## 📊 Manual Check (Jika Script Gagal)

```bash
mysql -u root -p
```

```sql
USE phc_dashboard;

-- 1. Check tables
SHOW TABLES LIKE '%cache%';
-- Harus ada: visits_cache, patients_cache

-- 2. Check data
SELECT COUNT(*) FROM visits_cache;
SELECT COUNT(*) FROM patients_cache;

-- 3. Check sample
SELECT 
  visit_number, 
  patient_name, 
  visit_date 
FROM visits_cache 
LIMIT 3;

-- 4. Check sync history
SELECT 
  entity_type,
  status,
  records_inserted,
  started_at
FROM sync_logs 
ORDER BY started_at DESC 
LIMIT 5;

EXIT;
```

---

## ✅ Success Criteria

Setup berhasil jika:

✅ `node scripts/check-sync-status.js` menunjukkan "DATA AVAILABLE"  
✅ `SELECT COUNT(*) FROM visits_cache` returns > 0  
✅ `SELECT COUNT(*) FROM patients_cache` returns > 0  
✅ Browser `/visits` loading <1 detik  
✅ Browser `/patients` loading <1 detik  
✅ Tidak ada error di console  

---

## 🆘 Masih Gagal?

Jika semua di atas sudah dicoba tapi masih gagal:

### 1. Collect Info

Run dan copy output:
```bash
# System info
node --version
npm --version
mysql --version

# App status
curl http://localhost:3000/api/health

# Database status
node scripts/check-sync-status.js

# Last sync log
mysql -u root -p phc_dashboard -e "SELECT * FROM sync_logs ORDER BY started_at DESC LIMIT 1\\G"
```

### 2. Check Files

```bash
# Check migration files exist
ls -la init-scripts/ | grep cache

# Check script exists
ls -la scripts/auto-sync-data.js
```

### 3. Try Fresh Install

```bash
# BACKUP FIRST!
mysqldump -u root -p phc_dashboard > backup_$(date +%Y%m%d).sql

# Drop and recreate
mysql -u root -p -e "DROP DATABASE IF EXISTS phc_dashboard; CREATE DATABASE phc_dashboard;"

# Import base tables
mysql -u root -p phc_dashboard < init-scripts/01-create-tables.sql

# Import cache tables
mysql -u root -p phc_dashboard < init-scripts/28-update-cache-tables.sql

# Sync data
npm run dev # Terminal 1
node scripts/auto-sync-data.js all # Terminal 2
```

---

## 📞 Documentation

- **DEBUG_SYNC_ISSUE.md** - Troubleshooting lengkap
- **SETUP_DATABASE_CACHE.md** - Setup guide lengkap
- **DATABASE_STRUCTURE.md** - Struktur tabel
- **ERROR_FIX_GUIDE.md** - Common errors

---

**Remember:** Diagnostic tool adalah teman terbaik Anda!

```bash
node scripts/check-sync-status.js
```

Jalankan ini kapan saja untuk check status sistem.

---

**Good luck!** 🚀

Jika masih stuck setelah semua ini, share output dari diagnostic tool untuk troubleshoot lebih lanjut.

