# Quick Start - Real-Time Sync

Panduan cepat untuk mengaktifkan sistem real-time sync yang efisien.

## 🚀 Quick Setup (5 Menit)

### 1. Setup Environment Variables

Tambahkan ke file `.env`:

```env
# Job Queue - Minimal Configuration
JOB_PROCESS_INTERVAL=30000
MAX_CONCURRENT_JOBS=2
AUTO_SYNC_ENABLED=true
AUTO_SYNC_INTERVAL=3600000
```

### 2. Create Database Table

Jalankan SQL script:

```bash
mysql -u root -p dash_app_db < init-scripts/31-create-job-queue-table.sql
```

Atau jalankan manual:

```sql
CREATE TABLE IF NOT EXISTS job_queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_type VARCHAR(50) NOT NULL,
  job_data JSON,
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  priority INT DEFAULT 0,
  attempts INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  error_message TEXT,
  result JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  next_retry_at TIMESTAMP NULL,
  INDEX idx_status_priority (status, priority DESC, created_at)
);
```

### 3. Restart Server

```bash
# Stop server
pm2 stop dash-app
# atau
Ctrl+C

# Start server
npm run dev
# atau
pm2 start ecosystem.config.cjs
```

Server akan otomatis start background worker!

### 4. Test Sync

#### Via Browser:
1. Buka http://localhost:3000/visits
2. Klik button "Sync dari API"
3. Job akan dijadwalkan dan diproses di background
4. Refresh halaman setelah beberapa menit untuk melihat data

#### Via API:
```bash
# Trigger incremental sync
curl -X POST http://localhost:3000/api/visits/sync-async?mode=incremental

# Check status
curl http://localhost:3000/api/visits/sync-async

# Check health
curl http://localhost:3000/api/health
```

## ✅ Verification

### 1. Check Worker Status

```bash
curl http://localhost:3000/api/health
```

Expected output:
```json
{
  "healthy": true,
  "checks": {
    "worker": { "healthy": true, "message": "OK" },
    "database": { "healthy": true },
    "queue": { "healthy": true }
  }
}
```

### 2. Check Queue Stats

```bash
curl http://localhost:3000/api/jobs/queue
```

Expected output:
```json
{
  "success": true,
  "stats": {
    "total_jobs": 5,
    "pending": 1,
    "processing": 0,
    "completed": 3,
    "failed": 1
  }
}
```

### 3. Check Server Logs

```bash
# Look for these messages:
✅ Job queue table initialized
🚀 Starting job queue processor
✅ Background worker started successfully
```

## 📊 Usage Examples

### Manual Sync (Incremental - Recommended)

```bash
curl -X POST http://localhost:3000/api/visits/sync-async?mode=incremental
```

**Keuntungan:**
- ✅ Hanya sync data baru/berubah
- ✅ Lebih cepat (biasanya < 1 menit)
- ✅ Lebih ringan ke CPU dan network
- ✅ Cocok untuk sync rutin

### Manual Sync (Full)

```bash
curl -X POST http://localhost:3000/api/visits/sync-async?mode=full&priority=8
```

**Keuntungan:**
- ✅ Sync semua data
- ✅ Berguna untuk initial sync atau recovery
- ⚠️  Lebih lama (bisa 5-10 menit)

### Auto-Sync (Recommended)

Set di `.env`:
```env
AUTO_SYNC_ENABLED=true
AUTO_SYNC_INTERVAL=3600000  # Every 1 hour
```

System akan otomatis sync setiap 1 jam!

## 🎯 Recommended Settings

### For Production Server

```env
# Job Queue
JOB_PROCESS_INTERVAL=30000      # Check queue every 30s
MAX_CONCURRENT_JOBS=2           # Process 2 jobs at once
JOB_TIMEOUT=300000              # 5 min timeout
JOB_BATCH_DELAY=1000            # 1s delay between batches

# Auto-Sync
AUTO_SYNC_ENABLED=true
AUTO_SYNC_INTERVAL=3600000      # Sync every 1 hour
```

### For Development

```env
# Job Queue
JOB_PROCESS_INTERVAL=10000      # Check queue every 10s
MAX_CONCURRENT_JOBS=1           # Process 1 job at once
JOB_TIMEOUT=300000              # 5 min timeout
JOB_BATCH_DELAY=500             # 0.5s delay

# Auto-Sync
AUTO_SYNC_ENABLED=false         # Manual sync only
```

## 🔧 Common Operations

### Trigger Manual Sync

```bash
# From browser: Click "Sync dari API" button

# From CLI:
curl -X POST http://localhost:3000/api/visits/sync-async?mode=incremental
```

### Check Sync Progress

```bash
curl http://localhost:3000/api/visits/sync-async | jq '.recentJobs'
```

### View Failed Jobs

```sql
SELECT id, job_type, attempts, error_message, created_at 
FROM job_queue 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Retry Failed Jobs

Failed jobs akan auto-retry. Untuk manual retry:

```sql
UPDATE job_queue 
SET status = 'pending', next_retry_at = NULL 
WHERE status = 'failed' AND attempts < max_retries;
```

### Clean Old Jobs

```bash
# Delete jobs older than 7 days
curl -X DELETE http://localhost:3000/api/jobs/queue?daysToKeep=7
```

## 🚨 Troubleshooting

### Worker Not Starting

**Check logs:**
```bash
tail -f logs/server.log
# Look for: "✅ Background worker started"
```

**Solution:**
1. Check database connection
2. Run SQL script untuk create table
3. Restart server

### Jobs Not Processing

**Check queue:**
```bash
curl http://localhost:3000/api/jobs/queue
```

**Solution:**
1. Check worker is running: `curl http://localhost:3000/api/health`
2. Check for stuck jobs in database
3. Restart server if needed

### High CPU Usage

**Solution:**
1. Reduce concurrent jobs:
   ```env
   MAX_CONCURRENT_JOBS=1
   ```

2. Increase batch delay:
   ```env
   JOB_BATCH_DELAY=3000
   ```

3. Use incremental sync instead of full

### Sync Taking Too Long

**Check:**
```bash
curl http://localhost:3000/api/visits/sync-async
```

**Solution:**
1. Use incremental mode (default)
2. Check network to external API
3. Check job is not stuck (restart server)

## 📈 Monitoring

### Daily Health Check

Add to cron:
```bash
# Check health every hour
0 * * * * curl http://localhost:3000/api/health > /dev/null
```

### Weekly Cleanup

```bash
# Clean old jobs every Sunday at 2am
0 2 * * 0 curl -X DELETE http://localhost:3000/api/jobs/queue?daysToKeep=7
```

### Monitoring Dashboard

Access via browser:
- Health: http://localhost:3000/api/health
- Queue Stats: http://localhost:3000/api/jobs/queue
- Sync Status: http://localhost:3000/api/visits/sync-async

## 🎉 You're Done!

Sistem real-time sync sudah aktif! Data kunjungan akan:
- ✅ Ter-sync otomatis setiap 1 jam (jika AUTO_SYNC_ENABLED)
- ✅ Dapat di-trigger manual dari UI
- ✅ Diproses di background tanpa blocking
- ✅ Tidak membebani CPU server
- ✅ Auto-retry jika gagal

## 📚 Next Steps

1. Monitor queue stats untuk beberapa hari
2. Adjust interval sesuai kebutuhan
3. Setup monitoring alerts
4. Review dokumentasi lengkap di [REALTIME_SYNC_SETUP.md](./REALTIME_SYNC_SETUP.md)

## 💡 Tips

- **Gunakan incremental sync** untuk sync rutin (lebih efisien)
- **Enable auto-sync** untuk hands-off operation
- **Monitor queue stats** secara berkala
- **Cleanup old jobs** mingguan untuk performance
- **Adjust settings** sesuai kapasitas server

## 🆘 Need Help?

1. Check health endpoint: `/api/health`
2. Check server logs
3. Review dokumentasi lengkap
4. Check database for error messages

