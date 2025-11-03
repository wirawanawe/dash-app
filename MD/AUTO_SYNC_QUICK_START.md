# 🚀 Auto-Sync Quick Start Guide

## ✅ Status: READY TO USE

Sistem auto-sync sudah aktif dan berjalan! Server **TIDAK** perlu restart.

## 📍 Apa yang Sudah Diperbaiki?

### 1. ❌ Error: "Unknown column 'records_failed'"
**STATUS**: ✅ FIXED

Database sudah diperbaiki dan kolom `records_failed` sudah ditambahkan ke tabel `sync_logs`.

### 2. ❌ Perlu Restart Server
**STATUS**: ✅ TIDAK PERLU RESTART

Semua perubahan diterapkan tanpa restart server. Connection pool database otomatis menangani perubahan schema.

### 3. ❌ Sync Manual
**STATUS**: ✅ AUTO-SYNC AKTIF

Sync sekarang otomatis terjadi pada:
- ✅ Refresh browser
- ✅ Login user
- ✅ Pindah halaman

## 🎯 Cara Kerja Auto-Sync

### Kapan Sync Terjadi?

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  User Action            → Sync Trigger → API Sync      │
│  ────────────────────────────────────────────────────   │
│                                                          │
│  🔄 Browser Refresh     → 2 detik delay → Sync         │
│  👤 User Login          → 1 detik delay → Sync         │
│  📄 Pindah Halaman      → 1 detik delay → Sync         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Rate Limiting

Untuk menghindari terlalu banyak request ke API:

- ⏰ **Interval Minimum**: 5 menit antara sync
- 💾 **Tracking**: Waktu sync terakhir disimpan di localStorage browser
- 🎯 **Smart Skip**: Otomatis skip sync jika belum 5 menit

## 🧪 Testing

### 1. Test Refresh Browser

1. Buka halaman dashboard
2. Buka Console (F12)
3. Refresh halaman (F5)
4. Lihat console log:
   ```
   ✅ Background sync completed on page load
   ```

### 2. Test Login

1. Logout dari aplikasi
2. Login kembali
3. Buka Console (F12)
4. Lihat console log:
   ```
   ✅ Sync completed after login
   ```

### 3. Test Navigation

1. Login ke dashboard
2. Buka Console (F12)
3. Navigasi ke halaman lain (misalnya: Dashboard → Patients → Visits)
4. Lihat console log:
   ```
   ✅ Background sync completed on navigation
   ```

### 4. Test Rate Limiting

1. Refresh halaman beberapa kali dalam 5 menit
2. Sync pertama akan berjalan
3. Sync selanjutnya akan di-skip
4. Console akan menunjukkan: "Sync skipped: Not enough time since last sync"

## 🔍 Monitoring

### Check Status Sync

Buka browser console dan jalankan:

```javascript
// Get sync info
const info = JSON.parse(localStorage.getItem('last_sync_time'));
console.log('Last sync:', new Date(parseInt(info)));
```

### Check Database

```sql
-- Lihat 10 sync logs terakhir
SELECT 
  id,
  entity_type,
  status,
  records_fetched,
  records_inserted,
  records_updated,
  records_failed,
  duration_seconds,
  started_at
FROM sync_logs 
WHERE entity_type = 'visits' 
ORDER BY started_at DESC 
LIMIT 10;

-- Check kolom records_failed ada
SHOW COLUMNS FROM sync_logs LIKE 'records_failed';
```

### API Endpoint untuk Monitoring

```bash
# Get sync status via API
curl http://localhost:3000/api/visits/sync
```

Response akan menampilkan:
- Latest sync logs
- Sync schedule
- Cache statistics

## 📝 File yang Diubah

```
✅ Database
   └── sync_logs table (added records_failed column)

✅ New Files
   ├── utils/syncUtils.js (core sync functions)
   ├── scripts/apply-sync-fix.js (DB fix script)
   └── MD/AUTO_SYNC_IMPLEMENTATION.md (full documentation)

✅ Modified Files
   ├── components/Providers.jsx (sync on load & navigation)
   ├── app/login/LoginClient.jsx (sync on login)
   └── init-scripts/27-create-api-cache-tables.sql (schema update)
```

## ⚡ Langkah Selanjutnya

### Tidak Ada! 🎉

Sistem sudah siap digunakan. Auto-sync akan berjalan otomatis.

### Optional: Adjust Sync Interval

Jika ingin mengubah interval sync, edit `utils/syncUtils.js`:

```javascript
// Ubah dari 5 menit ke interval lain
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 menit

// Contoh: ubah ke 10 menit
const SYNC_INTERVAL = 10 * 60 * 1000; // 10 menit
```

## 🎨 Visual Indicator (Optional)

Jika ingin menambahkan visual indicator untuk sync:

```javascript
// Contoh: tambahkan toast notification
import { syncVisits } from '@/utils/syncUtils';
import toast from 'react-hot-toast';

const result = await syncVisits(false);
if (result.success && !result.skipped) {
  toast.success('Data berhasil disinkronkan!');
}
```

## 🐛 Troubleshooting

### Sync Tidak Berjalan?

1. **Check Console**: Buka browser console untuk error messages
2. **Check Auth**: Pastikan user sudah login
3. **Check Time**: Pastikan sudah lewat 5 menit sejak sync terakhir
4. **Clear Storage**: Hapus localStorage dengan `localStorage.clear()`

### Error "records_failed" Masih Muncul?

```bash
# Jalankan ulang fix script
cd /Users/wirawanawe/Project/dash-app
node scripts/apply-sync-fix.js
```

### Sync Terlalu Sering?

Ubah `SYNC_INTERVAL` di `utils/syncUtils.js` ke nilai yang lebih besar.

## 📊 Expected Behavior

### Scenario 1: Baru Login
```
1. User login → 2. Wait 1 detik → 3. Sync triggered
4. Fetch data dari API → 5. Save ke database
6. Console log: "✅ Sync completed after login"
```

### Scenario 2: Refresh Page (dalam 5 menit)
```
1. User refresh → 2. Wait 2 detik → 3. Check last sync time
4. Skip sync (belum 5 menit) → 5. No API call
```

### Scenario 3: Navigation (sudah 5 menit)
```
1. User pindah halaman → 2. Wait 1 detik → 3. Check last sync time
4. Sync triggered → 5. Fetch data → 6. Update database
7. Console log: "✅ Background sync completed on navigation"
```

## 🎯 Summary

| Fitur | Status | Notes |
|-------|--------|-------|
| Database Fix | ✅ Done | Column `records_failed` added |
| No Restart Required | ✅ Done | Server tetap running |
| Auto-sync on Refresh | ✅ Done | 2 seconds delay |
| Auto-sync on Login | ✅ Done | 1 second delay |
| Auto-sync on Navigation | ✅ Done | 1 second delay |
| Rate Limiting | ✅ Done | 5 minutes interval |
| Error Handling | ✅ Done | Graceful error handling |
| Logging | ✅ Done | Console logs & DB logs |

---

## 🎉 Selamat!

Sistem auto-sync sudah aktif dan berfungsi dengan baik!

**Tidak ada action yang diperlukan dari Anda. Sistem akan bekerja otomatis.**

---

*Last Updated: November 3, 2025*  
*Status: ✅ Production Ready*

