# Sistem Caching Data API Eksternal

## Ringkasan

Sistem ini mengubah cara aplikasi mengambil data dari API eksternal. Sebelumnya, data diambil langsung dari API setiap kali ada request (lambat). Sekarang, data disimpan di database lokal dan di-refresh secara berkala (cepat).

## Arsitektur

```
┌─────────────────┐
│  External API   │
│  (Source Data)  │
└────────┬────────┘
         │
         │ Sync (Scheduled)
         ▼
┌─────────────────┐
│  Cache Tables   │
│  (Local DB)     │
│  - visits_cache │
│  - patients_cache│
└────────┬────────┘
         │
         │ Read (Fast)
         ▼
┌─────────────────┐
│   Application   │
│   (Frontend)    │
└─────────────────┘
```

## Keuntungan

### 1. **Loading Cepat**
- Data dibaca dari database lokal, bukan dari API eksternal
- Tidak perlu menunggu response dari API eksternal
- Pagination dilakukan di database, lebih efisien

### 2. **Real-time dengan Refresh**
- Data tetap up-to-date dengan auto-refresh berkala
- Configurable interval (bisa diatur per entity)
- Manual refresh juga tersedia

### 3. **Reliable**
- Jika API eksternal down, data masih bisa diakses dari cache
- Fallback mechanism tersedia
- Error handling yang baik

## Komponen Sistem

### 1. Cache Tables

#### `visits_cache`
Menyimpan data kunjungan dari API eksternal.

**Kolom utama:**
- `external_id`: ID dari API eksternal
- `visit_number`: Nomor kunjungan
- `patient_*`: Info pasien
- `doctor_name`: Nama dokter
- `clinic`, `room`: Info klinik
- `visit_date`: Tanggal kunjungan
- `synced_at`: Waktu terakhir sync

#### `patients_cache`
Menyimpan data pasien dari API eksternal.

**Kolom utama:**
- `external_id`: ID dari API eksternal
- `mrn`, `nik`, `nip`: ID pasien
- `name`: Nama pasien
- `birth_date`, `gender`: Info demografis
- `address`, `phone`, `email`: Kontak
- `synced_at`: Waktu terakhir sync

#### `sync_logs`
Menyimpan log setiap operasi sync.

**Kolom utama:**
- `entity_type`: visits, patients, doctors, clinics, all
- `status`: started, in_progress, completed, failed
- `records_fetched`, `records_inserted`, `records_updated`
- `started_at`, `completed_at`, `duration_seconds`
- `error_message`: Pesan error jika gagal

#### `sync_schedules`
Konfigurasi jadwal auto-sync.

**Kolom utama:**
- `entity_type`: visits, patients, doctors, clinics, all
- `is_enabled`: Aktif/non-aktif
- `interval_minutes`: Interval sync (menit)
- `last_sync_at`, `next_sync_at`: Tracking jadwal

### 2. API Endpoints

#### Sync Endpoints

**POST `/api/visits/sync`**
- Sync data visits dari API eksternal ke cache
- Fetch semua data (up to 20,000 records terbaru)
- Update cache dengan data terbaru
- Return statistics (fetched, inserted, updated)

**POST `/api/patients/sync`**
- Sync data patients dari API eksternal ke cache
- Fetch dengan pagination
- Update cache dengan data terbaru
- Return statistics

**POST `/api/sync/all`**
- Sync semua data sekaligus (visits, patients, doctors, clinics)
- Sequential sync untuk setiap entity
- Return summary statistics
- Recommended untuk initial sync atau full refresh

#### Query Endpoints

**GET `/api/visits`**
- Membaca data dari `visits_cache`
- Support search, filter, sorting, pagination
- Fast response (database query)
- Fallback ke API eksternal jika cache kosong

**GET `/api/patients`**
- Membaca data dari `patients_cache`
- Support search, filter, sorting, pagination
- Fast response (database query)
- Fallback ke API eksternal jika cache kosong

#### Status & Monitoring

**GET `/api/visits/sync`**
- Get sync logs untuk visits
- Get sync schedule
- Get cache statistics

**GET `/api/patients/sync`**
- Get sync logs untuk patients
- Get sync schedule
- Get cache statistics

**GET `/api/sync/all`**
- Get status semua sync operations
- Get all schedules
- Get cache statistics untuk semua entities

### 3. Auto-Refresh Mechanism

#### Sync Trigger API

**POST `/api/sync/trigger`**
- Check schedules yang due untuk sync
- Trigger sync untuk entities yang due
- Non-blocking (fire and forget)
- Return list of triggered syncs

**GET `/api/sync/trigger`**
- Get list of all schedules
- Show which schedules are due
- Useful for monitoring

#### Auto-Sync Script

**`scripts/auto-sync-data.js`**
```bash
# Sync semua data
node scripts/auto-sync-data.js

# Sync specific entity
node scripts/auto-sync-data.js visits
node scripts/auto-sync-data.js patients
```

#### Cron Job Setup

**Linux/Mac (crontab):**
```bash
# Edit crontab
crontab -e

# Add these lines:
# Sync visits every 30 minutes
*/30 * * * * cd /path/to/dash-app && node scripts/auto-sync-data.js visits >> logs/sync.log 2>&1

# Sync patients every hour
0 * * * * cd /path/to/dash-app && node scripts/auto-sync-data.js patients >> logs/sync.log 2>&1

# Full sync every 4 hours
0 */4 * * * cd /path/to/dash-app && node scripts/auto-sync-data.js all >> logs/sync.log 2>&1
```

**Windows (Task Scheduler):**
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., every 30 minutes)
4. Action: Start a program
   - Program: `node`
   - Arguments: `C:\path\to\dash-app\scripts\auto-sync-data.js visits`
   - Start in: `C:\path\to\dash-app`

**PM2 (Recommended for Node.js apps):**
```bash
# Add to ecosystem.config.cjs
{
  name: "sync-visits",
  script: "./scripts/auto-sync-data.js",
  args: "visits",
  cron_restart: "*/30 * * * *",
  autorestart: false
}

# Start with PM2
pm2 start ecosystem.config.cjs
pm2 save
```

## Konfigurasi Sync Schedule

Default schedule (dapat diubah di database):
- **Visits**: Setiap 30 menit
- **Patients**: Setiap 60 menit (1 jam)
- **Doctors**: Setiap 120 menit (2 jam)
- **Clinics**: Setiap 120 menit (2 jam)
- **All**: Manual only (disabled by default)

### Mengubah Schedule

```sql
-- Update interval sync visits menjadi 15 menit
UPDATE sync_schedules 
SET interval_minutes = 15 
WHERE entity_type = 'visits';

-- Disable auto-sync patients
UPDATE sync_schedules 
SET is_enabled = FALSE 
WHERE entity_type = 'patients';

-- Enable full sync setiap 6 jam
UPDATE sync_schedules 
SET is_enabled = TRUE, interval_minutes = 360 
WHERE entity_type = 'all';
```

## Setup & Installation

### 1. Database Migration

Run migration script:
```bash
mysql -u root -p phc_dashboard < init-scripts/27-create-api-cache-tables.sql
```

Atau import via phpMyAdmin/MySQL Workbench.

### 2. Initial Sync

Sync semua data untuk pertama kali:
```bash
# Via API
curl -X POST http://localhost:3000/api/sync/all

# Via script (recommended)
node scripts/auto-sync-data.js all
```

**Note:** Initial sync bisa memakan waktu beberapa menit tergantung jumlah data.

### 3. Setup Auto-Refresh

Pilih salah satu metode:

**Metode 1: Cron Job (Linux/Mac)**
```bash
crontab -e
# Add line untuk sync visits setiap 30 menit
*/30 * * * * cd /path/to/dash-app && node scripts/auto-sync-data.js visits
```

**Metode 2: PM2 (Recommended)**
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

**Metode 3: External Cron Service**
Setup cron service (seperti EasyCron, cron-job.org) untuk call:
```
POST http://your-domain.com/api/sync/trigger
```

## Monitoring

### Check Sync Status

**Via API:**
```bash
# Check all sync status
curl http://localhost:3000/api/sync/all

# Check specific entity
curl http://localhost:3000/api/visits/sync
curl http://localhost:3000/api/patients/sync
```

**Via Database:**
```sql
-- Recent sync logs
SELECT * FROM sync_logs 
ORDER BY started_at DESC 
LIMIT 10;

-- Failed syncs
SELECT * FROM sync_logs 
WHERE status = 'failed' 
ORDER BY started_at DESC;

-- Cache statistics
SELECT 
  COUNT(*) as total_visits,
  MAX(synced_at) as last_sync,
  MIN(visit_date) as oldest_visit,
  MAX(visit_date) as newest_visit
FROM visits_cache;
```

### Sync Logs Location

Jika menggunakan cron job dengan log file:
```bash
# View sync logs
tail -f logs/sync.log

# View PM2 logs
pm2 logs sync-visits
```

## Manual Refresh

### Via UI (Admin Panel)

Bisa ditambahkan button di admin panel:
```javascript
// Sync all data
async function syncAll() {
  const response = await fetch('/api/sync/all', { method: 'POST' });
  const data = await response.json();
  console.log('Sync result:', data);
}

// Sync specific entity
async function syncVisits() {
  const response = await fetch('/api/visits/sync', { method: 'POST' });
  const data = await response.json();
  console.log('Sync result:', data);
}
```

### Via API

```bash
# Sync all
curl -X POST http://localhost:3000/api/sync/all

# Sync visits only
curl -X POST http://localhost:3000/api/visits/sync

# Sync patients only
curl -X POST http://localhost:3000/api/patients/sync
```

### Via Script

```bash
# Sync all
node scripts/auto-sync-data.js all

# Sync specific
node scripts/auto-sync-data.js visits
node scripts/auto-sync-data.js patients
```

## Troubleshooting

### Data tidak muncul setelah setup

1. Check apakah tabel cache ada:
```sql
SHOW TABLES LIKE '%cache%';
```

2. Check apakah initial sync sudah dilakukan:
```sql
SELECT COUNT(*) FROM visits_cache;
SELECT COUNT(*) FROM patients_cache;
```

3. Jika kosong, lakukan initial sync:
```bash
node scripts/auto-sync-data.js all
```

### Sync gagal terus

1. Check error di sync_logs:
```sql
SELECT * FROM sync_logs 
WHERE status = 'failed' 
ORDER BY started_at DESC 
LIMIT 5;
```

2. Check koneksi ke external API:
```bash
curl https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan?page=1&limit=1
```

3. Check log aplikasi:
```bash
# PM2
pm2 logs

# Node
# Check console output
```

### Auto-refresh tidak jalan

1. Check cron job running:
```bash
# Linux/Mac
crontab -l
ps aux | grep auto-sync

# PM2
pm2 list
```

2. Check sync schedule configuration:
```sql
SELECT * FROM sync_schedules;
```

3. Test manual trigger:
```bash
curl -X POST http://localhost:3000/api/sync/trigger
```

### Loading masih lambat

1. Check apakah endpoint menggunakan cache:
```javascript
// Di browser console, check response
fetch('/api/visits').then(r => r.json()).then(console.log)
// Should show data from cache quickly
```

2. Check index di tabel cache:
```sql
SHOW INDEX FROM visits_cache;
SHOW INDEX FROM patients_cache;
```

3. Check query performance:
```sql
EXPLAIN SELECT * FROM visits_cache 
WHERE visit_date >= '2024-01-01' 
LIMIT 10;
```

## Performance Tips

1. **Index Optimization**
   - Cache tables sudah memiliki index optimal
   - Jangan hapus index yang ada

2. **Sync Interval**
   - Jangan set terlalu frequent (< 10 menit)
   - Balance antara real-time dan server load

3. **Batch Size**
   - Default fetch 1000 records per page
   - Bisa disesuaikan di sync endpoints

4. **Cleanup Old Data**
   - Bisa setup cleanup untuk data lama
   - Example: Hapus visits > 2 tahun
   ```sql
   DELETE FROM visits_cache 
   WHERE visit_date < DATE_SUB(NOW(), INTERVAL 2 YEAR);
   ```

## Best Practices

1. **Monitor Regularly**
   - Check sync logs setiap hari
   - Setup alerts untuk failed syncs

2. **Backup Data**
   - Backup cache tables regularly
   - Backup sync_logs untuk tracking

3. **Testing**
   - Test sync after deployment
   - Test fallback mechanism

4. **Documentation**
   - Update configuration changes
   - Document custom schedules

## Migration dari Old System

Jika upgrade dari sistem lama (direct API fetch):

1. Run database migration
2. Initial sync all data
3. Test endpoints masih bekerja
4. Setup auto-refresh
5. Monitor selama 24 jam
6. Jika stable, hapus old code

## Support

Jika ada masalah atau pertanyaan:
1. Check dokumentasi ini dulu
2. Check sync_logs untuk error details
3. Check application logs
4. Contact development team

---

**Version:** 1.0  
**Last Updated:** 2024  
**Author:** PHC Dashboard Team

