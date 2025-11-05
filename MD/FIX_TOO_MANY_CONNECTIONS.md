# 🚨 URGENT: Fix "Too Many Connections" Error

**Date:** 4 November 2025  
**Severity:** CRITICAL - Application tidak bisa akses database

---

## ❌ Problem

```
Error: Too many connections
GET /api/clinics 500
GET /api/settings/polyclinics 500
```

**Impact:**
- ❌ Semua API requests gagal
- ❌ Database tidak bisa diakses
- ❌ Application tidak berfungsi

---

## 🔍 Root Cause

MySQL connection pool sudah penuh. Kemungkinan penyebab:

1. **Connection leaks** - Connections tidak di-close dengan benar
2. **Too many requests** - Terlalu banyak concurrent requests
3. **MySQL limit too low** - Default MySQL max_connections = 151
4. **Pool limit too low** - Application pool limit = 20 (terlalu kecil)

---

## ✅ Quick Fix (IMMEDIATE)

### Option 1: Restart MySQL (FASTEST)

```bash
# macOS (Homebrew MySQL)
brew services restart mysql

# atau
sudo /usr/local/mysql/support-files/mysql.server restart

# Linux
sudo systemctl restart mysql

# Verify
mysql -u root -p -e "SHOW PROCESSLIST;"
```

### Option 2: Kill Sleeping Connections

```bash
# Login ke MySQL
mysql -u root -p

# Check connections
SHOW PROCESSLIST;

# Kill sleeping connections (one by one)
KILL <process_id>;

# Or kill all sleeping connections:
SELECT CONCAT('KILL ', id, ';') 
FROM information_schema.processlist 
WHERE Command = 'Sleep' 
AND Time > 60;

# Copy output dan execute
```

### Option 3: Increase MySQL max_connections

**Edit MySQL config:**

```bash
# Find MySQL config file
mysql --help | grep "Default options" -A 1

# Usually:
# macOS: /usr/local/etc/my.cnf or /etc/my.cnf
# Linux: /etc/mysql/my.cnf

# Edit file
sudo nano /usr/local/etc/my.cnf

# Add/modify:
[mysqld]
max_connections = 500

# Restart MySQL
brew services restart mysql
```

---

## ✅ Long-term Fix (APPLIED)

### 1. Increased Pool Limits

**File:** `lib/db.js`

```javascript
// Before
connectionLimit: 20,
queueLimit: 50,

// After
connectionLimit: 50,      // 2.5x increase
queueLimit: 100,          // 2x increase
maxIdle: 10,              // Close idle connections
idleTimeout: 60000,       // 60 seconds
```

### 2. Better Connection Management

Added to `lib/db.js`:
- ✅ `resetPool()` - Force reset stuck pool
- ✅ `cleanupIdleConnections()` - Auto cleanup
- ✅ `maxIdle` - Limit idle connections
- ✅ `idleTimeout` - Close old idle connections

### 3. Connection Leak Detection

Already using `pool.execute()` which auto-releases connections:
```javascript
// Good (auto-release)
const [rows] = await pool.execute(sql, params);

// Bad (manual release needed - NOT USED)
const connection = await pool.getConnection();
const [rows] = await connection.execute(sql);
await connection.release(); // MUST call this!
```

---

## 🚀 Recovery Steps

### Step 1: Restart MySQL (Recommended)

```bash
brew services restart mysql
```

### Step 2: Restart Application

```bash
# Stop current server (Ctrl+C)

# Restart
npm run dev
```

### Step 3: Verify Fix

```bash
# Check if connections are normal
node -e "
import { query } from './lib/db.js';
const result = await query('SELECT 1 as test');
console.log('Connection test:', result[0].test === 1 ? 'PASSED' : 'FAILED');
process.exit(0);
"
```

---

## 🔧 Prevention

### 1. Monitor Pool Usage

```bash
# Add to .env
DB_DEBUG=true

# Will log connection pool statistics
```

### 2. Regular Cleanup

Add cron job or periodic cleanup:
```javascript
// In server.js or somewhere
setInterval(async () => {
  const { cleanupIdleConnections } = await import('./lib/db.js');
  await cleanupIdleConnections();
}, 300000); // Every 5 minutes
```

### 3. Increase MySQL Limits

**Recommended MySQL config:**
```ini
[mysqld]
max_connections = 500
wait_timeout = 300
interactive_timeout = 300
```

---

## 📊 Current Configuration

### Application Pool

```javascript
connectionLimit: 50       // Max connections in pool
queueLimit: 100          // Max queued requests
maxIdle: 10              // Max idle connections
idleTimeout: 60000       // Close idle after 60s
```

### MySQL (Default)

```
max_connections = 151    // Too low for production!
Recommended: 500
```

---

## 🧪 Testing After Fix

### Test 1: Basic Query

```bash
node -e "
import { query } from './lib/db.js';
const result = await query('SELECT COUNT(*) as count FROM polyclinics');
console.log('Polyclinics:', result[0].count);
process.exit(0);
"
```

### Test 2: Multiple Concurrent

```bash
# Run 10 queries concurrently
for i in {1..10}; do
  curl http://localhost:3000/api/clinics &
done
wait

# All should succeed
```

### Test 3: Check Pool Stats

```bash
node -e "
import { getPoolStats } from './lib/db.js';
const stats = await getPoolStats();
console.log('Pool Stats:', stats);
process.exit(0);
"
```

---

## 🎯 Action Required

**IMMEDIATE (Do this NOW):**

1. **Restart MySQL:**
   ```bash
   brew services restart mysql
   ```

2. **Restart Application:**
   - Stop server (Ctrl+C)
   - Run `npm run dev`

3. **Test:**
   - Open http://localhost:3000/settings/polyclinics
   - Should load without errors

**OPTIONAL (For better stability):**

4. **Increase MySQL max_connections:**
   - Edit MySQL config
   - Set max_connections = 500
   - Restart MySQL

5. **Enable monitoring:**
   - Add `DB_DEBUG=true` to .env
   - Monitor connection usage

---

## 📋 Verification Checklist

After restart:

- [ ] MySQL started successfully
- [ ] Application started without errors
- [ ] Can access /settings/polyclinics
- [ ] Can access /api/clinics
- [ ] No "Too many connections" errors
- [ ] Pool stats show normal usage

---

## 🆘 If Still Not Working

1. **Check MySQL is running:**
   ```bash
   brew services list | grep mysql
   ```

2. **Check MySQL error log:**
   ```bash
   tail -f /usr/local/var/mysql/*.err
   ```

3. **Manual connection test:**
   ```bash
   mysql -u root -p
   ```

4. **Kill all connections manually:**
   ```sql
   SELECT CONCAT('KILL ', id, ';') 
   FROM information_schema.processlist 
   WHERE user = 'root';
   ```

---

**Status:** ⚠️ REQUIRES IMMEDIATE ACTION  
**Solution:** Restart MySQL & Application  
**Prevention:** Increase max_connections to 500

