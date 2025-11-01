# 🚀 Production Performance Checklist - dash.doctorphc.id

## 🔴 CRITICAL - Deploy Segera

### 1. ✅ Database Indexes (PALING PENTING!)
Tanpa indexes, query akan sangat lambat untuk data besar.

```bash
# Di server, run SQL script
mysql -u root -p phc_dashboard < /www/wwwroot/dash-app/scripts/create-performance-indexes.sql
```

**Atau manual via MySQL:**
```sql
USE phc_dashboard;

-- Indexes untuk visits (table paling sering diquery)
CREATE INDEX idx_visits_date ON visits(visit_date);
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_visits_patient_name ON visits(patient_name(255));
CREATE INDEX idx_visits_doctor_name ON visits(doctor_name(255));
CREATE INDEX idx_visits_date_status ON visits(visit_date, status);

-- Indexes untuk patients
CREATE INDEX idx_patients_name ON patients(name(255));
CREATE INDEX idx_patients_nik ON patients(nik);
CREATE INDEX idx_patients_mrn ON patients(mrn);

-- Indexes untuk doctors
CREATE INDEX idx_doctors_name ON doctors(name(255));

-- Verify indexes created
SHOW INDEX FROM visits;
SHOW INDEX FROM patients;
```

### 2. ✅ Update Code dengan Optimasi
```bash
cd /www/wwwroot/dash-app

# Backup dulu
cp -r /www/wwwroot/dash-app /www/wwwroot/dash-app.backup-$(date +%Y%m%d)

# Pull latest changes
git pull origin master

# Install dependencies
npm install

# Build production
npm run build

# Restart
pm2 restart dash-app
```

### 3. ✅ Environment Variables
Update `/www/wwwroot/dash-app/.env.local`:

```bash
# CRITICAL: Must set JWT_SECRET
JWT_SECRET=your_very_long_random_secret_minimum_32_characters_here

# Database Connection Pool (untuk 1000+ users)
DB_CONNECTION_LIMIT=100
DB_QUEUE_LIMIT=500

# Caching (5 minutes = 300000ms)
CACHE_MAX_SIZE=10000
CACHE_TTL=300000
RESPONSE_CACHE_MAX_SIZE=5000
RESPONSE_CACHE_TTL=120000

# Rate Limiting
RATE_LIMIT_GLOBAL=200
RATE_LIMIT_API=100
RATE_LIMIT_SEARCH=30

# Node Environment
NODE_ENV=production
```

### 4. ✅ PM2 Configuration
Optimize PM2 untuk production:

```bash
# Stop current
pm2 stop dash-app

# Start dengan config optimal
pm2 start npm --name "dash-app" -- start -- -p 3000
pm2 set dash-app max_memory_restart 500M

# Enable monitoring
pm2 install pm2-logrotate

# Save config
pm2 save
```

## 🟡 MEDIUM Priority

### 5. Server Resources Check
```bash
# Check memory
free -h

# Check CPU
top -bn1 | head -20

# Check disk
df -h

# Check MySQL status
systemctl status mysql

# Check MySQL connections
mysql -u root -p -e "SHOW STATUS LIKE 'Threads_connected';"
mysql -u root -p -e "SHOW STATUS LIKE 'Max_used_connections';"
```

### 6. MySQL Configuration
Edit `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
[mysqld]
# Connection Settings
max_connections = 200
max_connect_errors = 100

# Buffer Pool (adjust based on your RAM)
innodb_buffer_pool_size = 512M  # 50-70% of RAM if dedicated DB server

# Query Cache (if MySQL 5.7)
query_cache_size = 64M
query_cache_type = 1

# Slow Query Log (untuk debug)
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2  # Log queries > 2 seconds
```

```bash
# Restart MySQL
systemctl restart mysql
```

### 7. Nginx Configuration (jika pakai nginx)
```nginx
# /etc/nginx/sites-available/dash.doctorphc.id

server {
    listen 80;
    server_name dash.doctorphc.id;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
    gzip_min_length 256;

    # Client body size
    client_max_body_size 10M;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # Static files caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }

    # Main proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Test & reload nginx
nginx -t
systemctl reload nginx
```

## 🟢 MONITORING & DEBUGGING

### 8. Check Slow Queries
```bash
# Enable slow query log
mysql -u root -p phc_dashboard

SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

# Check after some time
tail -f /var/log/mysql/slow-query.log
```

### 9. Monitor Application
```bash
# PM2 monitoring
pm2 monit

# Check logs
pm2 logs dash-app --lines 100

# Check health endpoint
curl http://localhost:3000/api/health
```

### 10. Database Query Analysis
```sql
-- Check slow queries
SELECT * FROM information_schema.processlist 
WHERE command != 'Sleep' 
ORDER BY time DESC 
LIMIT 10;

-- Check table sizes
SELECT 
    table_name AS 'Table',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'phc_dashboard'
ORDER BY (data_length + index_length) DESC;

-- Optimize tables
OPTIMIZE TABLE visits;
OPTIMIZE TABLE patients;
ANALYZE TABLE visits;
ANALYZE TABLE patients;
```

## 📊 Expected Performance After Optimization

### Before:
- Initial Load: 10-15 seconds ❌
- Dashboard: 5-8 seconds ❌
- Visits Page: 8-12 seconds ❌
- Search: 3-5 seconds per keystroke ❌

### After:
- Initial Load: 1-2 seconds ✅
- Dashboard: 0.5-1 second ✅
- Visits Page: 1-2 seconds ✅
- Search: <500ms (debounced) ✅

## 🔥 Quick Wins (Do These FIRST!)

1. **Create Database Indexes** (5 minutes, huge impact)
2. **Update .env.local** with connection pool settings
3. **Run `npm run build`** for production optimization
4. **Restart PM2** with `pm2 restart dash-app`

## 🐛 Troubleshooting

### Jika masih lambat setelah optimasi:

1. **Check database indexes:**
```sql
SHOW INDEX FROM visits;
```

2. **Check slow queries:**
```bash
tail -100 /var/log/mysql/slow-query.log
```

3. **Check server resources:**
```bash
htop  # atau top
```

4. **Check Next.js build:**
```bash
cd /www/wwwroot/dash-app
ls -la .next/  # harus ada folder ini
```

5. **Check PM2 status:**
```bash
pm2 status
pm2 logs dash-app --err
```

## 📞 Support

Jika masih ada masalah, kirim:
1. Output dari `curl http://localhost:3000/api/health`
2. Output dari `pm2 logs dash-app --lines 50`
3. Screenshot slow query log
4. Server specs (RAM, CPU, disk)

---

**PRIORITY:** Jalankan steps 1-4 dalam "Quick Wins" SEKARANG untuk improvement drastis!

