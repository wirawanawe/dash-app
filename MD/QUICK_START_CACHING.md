# Quick Start - Sistem Caching

Panduan cepat untuk setup dan menggunakan sistem caching baru.

## Setup Cepat (5 Menit)

### 1. Database Migration

```bash
# Jalankan migration untuk membuat tabel cache
mysql -u root -p phc_dashboard < init-scripts/27-create-api-cache-tables.sql
```

Atau lewat phpMyAdmin:
1. Buka phpMyAdmin
2. Select database `phc_dashboard`
3. Import file `init-scripts/27-create-api-cache-tables.sql`

### 2. Initial Sync Data

**Pilih salah satu:**

**Via API (Recommended untuk development):**
```bash
# Pastikan aplikasi sudah running
npm run dev

# Di terminal lain, sync data
curl -X POST http://localhost:3000/api/sync/all
```

**Via Script (Recommended untuk production):**
```bash
node scripts/auto-sync-data.js all
```

**Tunggu sampai selesai** (bisa 2-5 menit tergantung jumlah data).

### 3. Test Hasilnya

Buka browser dan test:
```
http://localhost:3000/visits
http://localhost:3000/patients
```

Seharusnya loading **jauh lebih cepat** sekarang! 🚀

### 4. Setup Auto-Refresh

**Untuk Development:**
```bash
# Tambahkan ke package.json scripts
"sync": "node scripts/auto-sync-data.js"

# Jalankan manual kapan perlu refresh
npm run sync visits
npm run sync patients
```

**Untuk Production:**

**Metode 1: PM2 (Recommended)**

Edit `ecosystem.config.cjs`, tambahkan:
```javascript
module.exports = {
  apps: [
    // ... existing apps
    {
      name: "sync-visits",
      script: "./scripts/auto-sync-data.js",
      args: "visits",
      cron_restart: "*/30 * * * *", // Every 30 minutes
      autorestart: false
    },
    {
      name: "sync-patients",
      script: "./scripts/auto-sync-data.js",
      args: "patients",
      cron_restart: "0 * * * *", // Every hour
      autorestart: false
    }
  ]
};
```

Start PM2:
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup  # Setup untuk auto-start saat reboot
```

**Metode 2: Cron Job**

```bash
# Edit crontab
crontab -e

# Tambahkan (sesuaikan path):
*/30 * * * * cd /path/to/dash-app && node scripts/auto-sync-data.js visits >> logs/sync.log 2>&1
0 * * * * cd /path/to/dash-app && node scripts/auto-sync-data.js patients >> logs/sync.log 2>&1
```

## Verifikasi Setup

### Check Cache Terisi

```sql
-- Check jumlah data di cache
SELECT COUNT(*) as total_visits FROM visits_cache;
SELECT COUNT(*) as total_patients FROM patients_cache;

-- Check last sync time
SELECT entity_type, last_sync_at, next_sync_at 
FROM sync_schedules;
```

### Check Sync Logs

```sql
-- Check 5 sync terakhir
SELECT * FROM sync_logs 
ORDER BY started_at DESC 
LIMIT 5;
```

### Test API Endpoints

```bash
# Test visits dari cache
curl "http://localhost:3000/api/visits?page=1&limit=10"

# Test patients dari cache
curl "http://localhost:3000/api/patients?page=1&limit=10"

# Test sync status
curl "http://localhost:3000/api/sync/all"
```

## Manual Refresh

Kapanpun butuh refresh data:

```bash
# Refresh semua
node scripts/auto-sync-data.js all

# Refresh specific entity
node scripts/auto-sync-data.js visits
node scripts/auto-sync-data.js patients
```

Atau via API:
```bash
curl -X POST http://localhost:3000/api/sync/all
curl -X POST http://localhost:3000/api/visits/sync
curl -X POST http://localhost:3000/api/patients/sync
```

## Konfigurasi Interval Sync

Default interval:
- Visits: 30 menit
- Patients: 60 menit (1 jam)
- Doctors: 120 menit (2 jam)
- Clinics: 120 menit (2 jam)

Untuk ubah interval:
```sql
-- Update interval visits menjadi 15 menit
UPDATE sync_schedules 
SET interval_minutes = 15 
WHERE entity_type = 'visits';
```

## Monitoring

### Via Database

```sql
-- Recent syncs
SELECT 
  entity_type,
  status,
  records_fetched,
  records_inserted,
  records_updated,
  duration_seconds,
  started_at
FROM sync_logs
WHERE started_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY started_at DESC;

-- Failed syncs
SELECT * FROM sync_logs 
WHERE status = 'failed' 
ORDER BY started_at DESC;
```

### Via API

```bash
# Get all sync status
curl http://localhost:3000/api/sync/all

# Get visits sync status
curl http://localhost:3000/api/visits/sync

# Get patients sync status
curl http://localhost:3000/api/patients/sync
```

### Via PM2 (if using PM2)

```bash
# Check running processes
pm2 list

# View logs
pm2 logs sync-visits
pm2 logs sync-patients

# Monitor
pm2 monit
```

## Troubleshooting Quick Fix

### Problem: Data tidak muncul

**Fix:**
```bash
# 1. Check cache table
mysql -u root -p -e "SELECT COUNT(*) FROM phc_dashboard.visits_cache"

# 2. If empty, run sync
node scripts/auto-sync-data.js all

# 3. Check logs
mysql -u root -p -e "SELECT * FROM phc_dashboard.sync_logs ORDER BY started_at DESC LIMIT 1"
```

### Problem: Sync failed

**Fix:**
```bash
# 1. Check error message
mysql -u root -p -e "SELECT error_message FROM phc_dashboard.sync_logs WHERE status='failed' ORDER BY started_at DESC LIMIT 1"

# 2. Test API connection
curl https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan?page=1&limit=1

# 3. Check app logs
tail -f logs/sync.log  # if using cron
pm2 logs  # if using PM2
```

### Problem: Still slow

**Fix:**
```bash
# 1. Check if using cache
# In browser console:
fetch('/api/visits').then(r => r.json()).then(d => console.log('Source:', d.source))

# 2. Check cache size
mysql -u root -p -e "SELECT COUNT(*) FROM phc_dashboard.visits_cache"

# 3. If cache empty, sync again
node scripts/auto-sync-data.js all
```

## Next Steps

1. ✅ Setup database (done)
2. ✅ Initial sync (done)
3. ✅ Test loading speed (should be fast!)
4. ✅ Setup auto-refresh
5. ✅ Monitor for 24 hours
6. 📝 Adjust sync intervals if needed
7. 🎉 Enjoy fast loading!

## Need Help?

Baca dokumentasi lengkap: [CACHING_SYSTEM.md](./CACHING_SYSTEM.md)

---

Selamat! Sistem caching sudah aktif. Loading sekarang jauh lebih cepat! 🚀

