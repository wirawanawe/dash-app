# Auto-Sync Implementation Guide

## 📋 Overview

This document describes the automatic synchronization system implemented for the PHC Dashboard. The system automatically syncs visit data from the external API without requiring server restarts.

## ✅ Fixed Issues

### 1. Database Schema Fix
**Problem**: `sync_logs` table was missing the `records_failed` column, causing sync errors.

**Solution**: Added the missing column to the database:
```sql
ALTER TABLE sync_logs 
ADD COLUMN records_failed INT DEFAULT 0 
AFTER records_inserted;
```

**Files Modified**:
- ✅ Database patched using `scripts/apply-sync-fix.js`
- ✅ Init script updated: `init-scripts/27-create-api-cache-tables.sql`

### 2. No Server Restart Required
The database fix was applied while the server was running. The connection pool automatically handles the schema change without requiring a restart.

## 🔄 Auto-Sync Features

### When Does Sync Happen?

The system automatically syncs data in the following scenarios:

#### 1. **On Browser Refresh**
- Triggers 2 seconds after page load
- Uses silent mode (no UI notifications)
- Only syncs if 5+ minutes have passed since last sync

#### 2. **On User Login**
- Triggers 1 second after successful login
- Forces sync by clearing last sync time
- Ensures fresh data for new sessions

#### 3. **On Page Navigation**
- Triggers 1 second after navigation
- Uses silent mode
- Only syncs if 5+ minutes have passed since last sync

### Sync Rate Limiting

To prevent excessive API calls, the system implements intelligent rate limiting:

- **Minimum Interval**: 5 minutes between syncs
- **Last Sync Time**: Stored in browser's localStorage
- **Smart Skip**: Automatically skips sync if interval hasn't passed

## 📁 File Structure

### New Files Created

```
utils/
  └── syncUtils.js          # Core sync utility functions

scripts/
  ├── apply-sync-fix.js     # Database fix script
  └── fix-sync-logs-table.sql  # SQL fix (for reference)

MD/
  └── AUTO_SYNC_IMPLEMENTATION.md  # This document
```

### Modified Files

```
components/
  └── Providers.jsx         # Added auto-sync on page load & navigation

app/login/
  └── LoginClient.jsx       # Added sync trigger on login

init-scripts/
  └── 27-create-api-cache-tables.sql  # Updated sync_logs schema
```

## 🛠️ Technical Details

### Sync Utility Functions

#### `syncVisits(silent = true)`
Main sync function that:
- Checks if sync is needed
- Calls `/api/visits/sync` endpoint
- Updates last sync time
- Returns sync result

#### `syncOnPageLoad()`
- Called when page loads or refreshes
- Silent mode enabled
- 2-second delay to avoid blocking UI

#### `syncOnLogin()`
- Called after successful login
- Forces sync by clearing last sync time
- 1-second delay to allow navigation

#### `syncOnNavigation()`
- Called on page route changes
- Silent mode enabled
- 1-second delay to avoid blocking navigation

#### Helper Functions
- `shouldSync()` - Checks if enough time has passed
- `updateLastSyncTime()` - Updates localStorage
- `getLastSyncInfo()` - Returns sync status info

### Integration Points

#### 1. Providers Component
```javascript
// On mount - triggers sync on page load
useEffect(() => {
  if (!mounted) return;
  checkAuth();
  syncOnPageLoad();
}, [mounted]);

// On navigation - triggers sync when route changes
useEffect(() => {
  if (!mounted || !user) return;
  syncOnNavigation();
}, [pathname, mounted, user]);
```

#### 2. Login Component
```javascript
// After successful login
setUser(userData);
toast.success("Login berhasil! Selamat datang di PHC Dashboard");
syncOnLogin();
router.push("/dashboard");
```

## 🎯 Usage

### For Developers

The sync system works automatically. No manual intervention needed.

To check sync status in console:
```javascript
import { getLastSyncInfo } from '@/utils/syncUtils';

const info = getLastSyncInfo();
console.log(info);
// {
//   hasSynced: true,
//   lastSyncTime: Date,
//   timeSinceLastSync: 123456,
//   nextSyncIn: 176544
// }
```

### Manual Sync (if needed)

```javascript
import { syncVisits } from '@/utils/syncUtils';

// Silent sync
await syncVisits(true);

// Verbose sync with console logs
await syncVisits(false);
```

## 📊 Sync Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Actions                              │
└────────────┬───────────────┬────────────────┬───────────────┘
             │               │                │
             ▼               ▼                ▼
      Page Refresh     User Login     Page Navigation
             │               │                │
             │               │                │
             ▼               ▼                ▼
      ┌──────────────────────────────────────────────┐
      │         syncUtils.js Functions                │
      │  • Check if sync needed (5 min interval)     │
      │  • Call /api/visits/sync endpoint            │
      │  • Update last sync time                     │
      └──────────────┬───────────────────────────────┘
                     │
                     ▼
      ┌──────────────────────────────────────────────┐
      │    External API (api-ehr-klinik)             │
      │  • Fetch visits data                         │
      │  • Process and transform                     │
      └──────────────┬───────────────────────────────┘
                     │
                     ▼
      ┌──────────────────────────────────────────────┐
      │         Database (sync_logs & visits)        │
      │  • Log sync operation                        │
      │  • Insert/Update visit records               │
      │  • Track records_failed                      │
      └──────────────────────────────────────────────┘
```

## 🔍 Monitoring

### Check Sync Status

Access `/api/visits/sync` with GET method to see:
- Latest sync logs
- Sync schedule configuration
- Cache statistics

### Database Queries

```sql
-- Check recent sync logs
SELECT * FROM sync_logs 
WHERE entity_type = 'visits' 
ORDER BY started_at DESC 
LIMIT 10;

-- Check failed records
SELECT * FROM sync_logs 
WHERE records_failed > 0 
ORDER BY started_at DESC;
```

## 🚀 Benefits

1. **No Server Restart**: Database changes applied without downtime
2. **Automatic Sync**: Data stays fresh without manual intervention
3. **Rate Limited**: Prevents API overload with smart intervals
4. **Silent Operation**: No UI interruption during background sync
5. **Reliable**: Handles errors gracefully and logs failures

## ⚙️ Configuration

To change sync interval, edit `utils/syncUtils.js`:

```javascript
// Current: 5 minutes
const SYNC_INTERVAL = 5 * 60 * 1000;

// Change to 10 minutes
const SYNC_INTERVAL = 10 * 60 * 1000;
```

## 📝 Notes

- Sync is client-side initiated but server-side processed
- localStorage is used for tracking (per-browser storage)
- Multiple tabs may trigger sync independently
- Failed syncs are logged but don't prevent future attempts

## 🔒 Security

- All sync requests include credentials
- Authentication required via session cookies
- Rate limiting prevents abuse
- Error messages sanitized before logging

## 📞 Support

For issues or questions:
1. Check console logs for sync status
2. Review database sync_logs table
3. Verify `records_failed` column exists
4. Test manual sync with `syncVisits(false)`

---

**Implementation Date**: November 3, 2025  
**Status**: ✅ Active and Working  
**Server Restart Required**: ❌ No

