# 🚀 QUICK START GUIDE

## ✅ WHAT'S BEEN COMPLETED

### 1. **Database Setup** ✅
- Table `visits` updated with API columns
- Table `patients` updated with API columns
- Data successfully synced:
  - **18,684 visits** from API → `visits` table
  - **2,953 patients** from API → `patients` table

### 2. **API Endpoints Updated** ✅
- `/api/visits/sync` - syncs to `visits` table (not cache)
- `/api/patients/sync` - syncs to `patients` table (not cache)
- `/api/visits` - reads from `visits` table
- `/api/patients` - reads from `patients` table

### 3. **Auto-Sync Configured** ✅
- Visits: every 30 minutes
- Patients: every 60 minutes

---

## 🔧 NEXT STEPS (Required)

### **STEP 1: Restart Application**
```bash
# Kill existing process
pkill -f "node.*next"

# Start app (choose one):
# Option A: PM2
pm2 restart dash-app

# Option B: npm dev
npm run dev

# Option C: Production
npm run build && npm start
```

### **STEP 2: Test APIs**
```bash
# Test visits API
curl "http://localhost:3000/api/visits?page=1&limit=5"

# Test patients API
curl "http://localhost:3000/api/patients?page=1&limit=5"
```

### **STEP 3: Verify Web Interface**
Open browser:
- http://localhost:3000/visits
- http://localhost:3000/patients

---

## 📊 Verify Data in Database

```sql
-- Check visits
mysql -u root -p phc_dashboard
SELECT COUNT(*) FROM visits WHERE external_id IS NOT NULL;
SELECT patient_name, visit_date, clinic FROM visits WHERE external_id IS NOT NULL LIMIT 5;

-- Check patients
SELECT COUNT(*) FROM patients WHERE external_id IS NOT NULL;
SELECT name, nik, gender FROM patients WHERE external_id IS NOT NULL LIMIT 5;
```

**Expected Results:**
- Visits: 18,684 records
- Patients: 2,953 records

---

## 🔄 Manual Sync (If Needed)

```bash
# Sync all data
node scripts/auto-sync-data.cjs all

# Sync only visits
node scripts/auto-sync-data.cjs visits

# Sync only patients
node scripts/auto-sync-data.cjs patients

# Check status
node scripts/check-sync-status.mjs
```

---

## 🗄️ Optional: Cleanup Old Cache Tables

**⚠️ Only after confirming data works!**

```sql
-- Backup first
mysqldump -u root -p phc_dashboard visits_cache > backup_visits_cache.sql
mysqldump -u root -p phc_dashboard patients_cache > backup_patients_cache.sql

-- Then drop (optional)
DROP TABLE IF EXISTS visits_cache;
DROP TABLE IF EXISTS patients_cache;
```

---

## 🐛 Troubleshooting

### Issue: API Returns Empty Data

**Solution:**
```bash
# 1. Restart app
pm2 restart dash-app

# 2. Check data exists
mysql -u root -p phc_dashboard -e "SELECT COUNT(*) FROM visits;"

# 3. Re-sync if needed
node scripts/auto-sync-data.cjs all
```

### Issue: "Table doesn't exist"

**Solution:**
```bash
# Run migration scripts
mysql -u root -p phc_dashboard < init-scripts/27-create-api-cache-tables.sql
mysql -u root -p phc_dashboard < init-scripts/29-alter-visits-table-for-api.sql
mysql -u root -p phc_dashboard < init-scripts/30-alter-patients-table-for-api.sql
```

### Issue: Gender Mapping Error

**Fixed!** Gender now correctly maps:
- "Laki-laki" → MALE
- "Perempuan" → FEMALE

### Issue: MRN Required Error

**Fixed!** MRN is now nullable.

---

## 📁 Files Modified

### Database Migrations:
- `init-scripts/29-alter-visits-table-for-api.sql` ✅
- `init-scripts/30-alter-patients-table-for-api.sql` ✅

### API Routes:
- `app/api/visits/sync/route.js` ✅
- `app/api/visits/route.js` ✅
- `app/api/patients/sync/route.js` ✅
- `app/api/patients/route.js` ✅

### Scripts:
- `scripts/auto-sync-data.cjs` ✅
- `scripts/check-sync-status.mjs` ✅

---

## 🎯 Summary

### **BEFORE:**
```
API → visits_cache (separate cache table)
API → patients_cache (separate cache table)
Frontend reads → from cache tables
```

### **AFTER:**
```
API → visits (original table) ✅
API → patients (original table) ✅
Frontend reads → from original tables ✅
Auto-refresh every 30-60 minutes ✅
```

---

## ✅ Checklist

- [x] Database tables updated
- [x] API sync endpoints modified
- [x] Data synced (18,684 visits + 2,953 patients)
- [x] Auto-sync configured
- [x] Gender mapping fixed
- [x] MRN nullable fixed
- [x] Scripts tested
- [ ] **App restarted** ← DO THIS NOW!
- [ ] **Web interface tested**

---

## 📞 Support

If you encounter issues:

1. **Check sync status:**
   ```bash
   node scripts/check-sync-status.mjs
   ```

2. **View logs:**
   ```bash
   tail -f ~/.pm2/logs/dash-app-error.log
   ```

3. **Re-sync data:**
   ```bash
   node scripts/auto-sync-data.cjs all
   ```

---

**Date:** October 30, 2025  
**Status:** ✅ READY (needs app restart)  
**Version:** 2.0 - Direct API to Original Tables

