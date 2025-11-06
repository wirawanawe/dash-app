# Real-Time Sync System - Setup Guide

## Overview

Sistem real-time sync untuk data kunjungan yang efisien dan tidak membebani CPU server. Menggunakan job queue berbasis database untuk background processing dengan throttling dan batching.

## Fitur Utama

### 1. **Job Queue System**
- Database-backed queue untuk reliability
- Automatic retry dengan exponential backoff
- Priority-based processing
- Concurrent processing dengan limit

### 2. **Incremental Sync**
- Hanya sync data terbaru/yang berubah
- Lebih efisien dibanding full sync
- Menggunakan timestamp untuk tracking

### 3. **Background Worker**
- Auto-start saat server running
- Proses jobs secara background
- CPU throttling untuk mencegah overload
- Graceful shutdown

### 4. **Auto-Sync**
- Optional auto-sync dengan interval
- Configurable melalui environment variables
- Dapat di-enable/disable

## Architecture

```
┌─────────────────┐
│   Frontend      │
│  (visits page)  │
└────────┬────────┘
         │ POST /api/visits/sync-async
         ▼
┌─────────────────┐
│  API Endpoint   │
│  (sync-async)   │
└────────┬────────┘
         │ Add job to queue
         ▼
┌─────────────────┐
│   Job Queue     │
│   (Database)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Background      │
│   Worker        │
└────────┬────────┘
         │ Process jobs
         ▼
┌─────────────────┐
│  Sync Module    │
│  (incremental)  │
└────────┬────────┘
         │ Fetch from API
         ▼
┌─────────────────┐
│  External API   │
└────────┬────────┘
         │ Data
         ▼
┌─────────────────┐
│   Database      │
│   (visits)      │
└─────────────────┘
```

## Installation

### 1. Database Setup

Job queue table akan dibuat otomatis saat server start. Jika ingin membuat manual:

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
  INDEX idx_status_priority (status, priority DESC, created_at),
  INDEX idx_job_type (job_type),
  INDEX idx_next_retry (next_retry_at)
);
```

### 2. Environment Variables

Copy `.env.example` ke `.env` dan sesuaikan:

```bash
# Job Queue Configuration
JOB_PROCESS_INTERVAL=30000      # Process setiap 30 detik
MAX_CONCURRENT_JOBS=2           # Max 2 jobs concurrent
JOB_TIMEOUT=300000              # Timeout 5 menit
JOB_MAX_RETRIES=3               # Max 3 retries
JOB_BATCH_DELAY=1000            # 1 detik delay antar batch

# Auto-sync Configuration
AUTO_SYNC_ENABLED=true          # Enable auto-sync
AUTO_SYNC_INTERVAL=3600000      # Auto-sync setiap 1 jam
```

### 3. Server Configuration

Background worker sudah di-setup di `server.js` dan akan auto-start saat server running.

## Usage

### 1. Manual Sync (dari Frontend)

Button "Sync dari API" di halaman visits akan:
- Menambahkan job ke queue (tidak blocking)
- Job diproses di background
- User tidak perlu menunggu
- Dapat refresh halaman untuk melihat hasil

### 2. API Endpoints

#### Trigger Async Sync
```bash
# Incremental sync (recommended)
POST /api/visits/sync-async?mode=incremental

# Full sync
POST /api/visits/sync-async?mode=full&priority=5
```

Response:
```json
{
  "success": true,
  "message": "Sync job queued successfully (incremental mode)",
  "job": {
    "id": 123,
    "type": "visits_incremental_sync",
    "mode": "incremental",
    "priority": 5
  }
}
```

#### Check Sync Status
```bash
GET /api/visits/sync-async
```

Response:
```json
{
  "success": true,
  "queueStats": {
    "total_jobs": 10,
    "pending": 2,
    "processing": 1,
    "completed": 5,
    "failed": 2
  },
  "recentJobs": [...]
}
```

#### Queue Management
```bash
# Get queue statistics
GET /api/jobs/queue

# Clean up old jobs (older than 7 days)
DELETE /api/jobs/queue?daysToKeep=7

# Add custom job
POST /api/jobs/queue
{
  "jobType": "visits_incremental_sync",
  "priority": 5
}
```

#### Health Check
```bash
GET /api/health
```

Response:
```json
{
  "healthy": true,
  "service": "dash-app",
  "checks": {
    "database": { "healthy": true },
    "worker": { "healthy": true },
    "queue": { "healthy": true, "stats": {...} }
  },
  "uptime": 3600
}
```

## Configuration

### Job Processing Interval

Mengatur seberapa sering worker memproses jobs:

```env
# Process setiap 30 detik (default)
JOB_PROCESS_INTERVAL=30000

# Untuk sync lebih sering (setiap 10 detik)
JOB_PROCESS_INTERVAL=10000

# Untuk load yang lebih ringan (setiap 2 menit)
JOB_PROCESS_INTERVAL=120000
```

### Concurrent Jobs

Mengatur berapa banyak jobs yang diproses bersamaan:

```env
# 2 jobs concurrent (default - recommended)
MAX_CONCURRENT_JOBS=2

# Untuk server powerful (4 jobs)
MAX_CONCURRENT_JOBS=4

# Untuk server dengan resource terbatas (1 job)
MAX_CONCURRENT_JOBS=1
```

### CPU Throttling

Delay antar batch untuk memberi jeda ke CPU:

```env
# 1 detik delay (default)
JOB_BATCH_DELAY=1000

# Untuk server busy (3 detik delay)
JOB_BATCH_DELAY=3000

# Untuk server idle (500ms delay)
JOB_BATCH_DELAY=500
```

### Auto-Sync

Enable/disable dan atur interval auto-sync:

```env
# Enable auto-sync
AUTO_SYNC_ENABLED=true

# Auto-sync setiap 1 jam (default)
AUTO_SYNC_INTERVAL=3600000

# Auto-sync setiap 30 menit
AUTO_SYNC_INTERVAL=1800000

# Auto-sync setiap 6 jam
AUTO_SYNC_INTERVAL=21600000
```

## Monitoring

### 1. Queue Statistics

```bash
curl http://localhost:3000/api/jobs/queue
```

Monitor:
- Total jobs
- Pending jobs
- Processing jobs
- Completed jobs
- Failed jobs
- Average duration

### 2. Health Check

```bash
curl http://localhost:3000/api/health
```

Monitor:
- Database connectivity
- Worker status
- Queue health
- System uptime

### 3. Recent Jobs

```bash
curl http://localhost:3000/api/visits/sync-async
```

Monitor:
- Recent sync jobs
- Job status
- Error messages
- Job results

## Troubleshooting

### Jobs Stuck in Processing

Jika ada jobs yang stuck:

1. Check health endpoint:
```bash
curl http://localhost:3000/api/health
```

2. Restart server untuk reset stuck jobs

3. Manual cleanup jika perlu:
```sql
UPDATE job_queue 
SET status = 'failed', error_message = 'Manually reset stuck job'
WHERE status = 'processing' 
AND started_at < DATE_SUB(NOW(), INTERVAL 10 MINUTE);
```

### High CPU Usage

Jika CPU usage tinggi:

1. Kurangi concurrent jobs:
```env
MAX_CONCURRENT_JOBS=1
```

2. Tambah delay antar batch:
```env
JOB_BATCH_DELAY=3000
```

3. Perlambat processing interval:
```env
JOB_PROCESS_INTERVAL=60000
```

### Failed Jobs

Check error messages di queue:

```sql
SELECT * FROM job_queue 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 10;
```

Jobs akan auto-retry dengan exponential backoff:
- Retry 1: setelah 1 menit
- Retry 2: setelah 5 menit
- Retry 3: setelah 15 menit

## Performance Tips

### 1. Incremental vs Full Sync

- **Incremental**: Gunakan untuk sync rutin (lebih cepat, lebih efisien)
- **Full**: Gunakan untuk initial sync atau recovery

### 2. Optimal Settings untuk Server

**Low-end server (1-2 CPU cores):**
```env
JOB_PROCESS_INTERVAL=60000
MAX_CONCURRENT_JOBS=1
JOB_BATCH_DELAY=2000
AUTO_SYNC_INTERVAL=7200000  # 2 hours
```

**Mid-range server (4 CPU cores):**
```env
JOB_PROCESS_INTERVAL=30000
MAX_CONCURRENT_JOBS=2
JOB_BATCH_DELAY=1000
AUTO_SYNC_INTERVAL=3600000  # 1 hour
```

**High-end server (8+ CPU cores):**
```env
JOB_PROCESS_INTERVAL=15000
MAX_CONCURRENT_JOBS=4
JOB_BATCH_DELAY=500
AUTO_SYNC_INTERVAL=1800000  # 30 minutes
```

### 3. Database Optimization

Pastikan indexes sudah ada:
```sql
-- Check indexes
SHOW INDEX FROM job_queue;
SHOW INDEX FROM visits;

-- Add index jika belum ada
CREATE INDEX idx_external_updated_at ON visits(external_updated_at);
CREATE INDEX idx_synced_at ON visits(synced_at);
```

## Maintenance

### Regular Cleanup

Setup cron job untuk cleanup old jobs:

```bash
# Cleanup setiap hari jam 2 pagi
0 2 * * * curl -X DELETE http://localhost:3000/api/jobs/queue?daysToKeep=7
```

Atau via code:
```javascript
// Cleanup jobs older than 7 days
const queue = getJobQueue();
await queue.cleanup(7);
```

### Monitoring Logs

Check server logs untuk monitoring:
```bash
# Follow logs
tail -f logs/server.log

# Search for sync activity
grep "sync" logs/server.log

# Check for errors
grep "ERROR" logs/server.log
```

## Migration from Old Sync

Jika sebelumnya menggunakan sync sinkron:

1. Update frontend untuk menggunakan `/api/visits/sync-async` instead of `/api/visits/sync`
2. Update .env dengan job queue config
3. Restart server
4. Old sync endpoint (`/api/visits/sync`) masih available untuk fallback

## Support

Untuk issues atau questions:
1. Check health endpoint first
2. Check server logs
3. Check queue statistics
4. Review environment variables

