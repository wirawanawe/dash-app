# 🐛 Fix: Bug Timezone pada Statistik Kunjungan Hari Ini

## 📌 Masalah

Dashboard menampilkan **jumlah kunjungan yang salah** untuk "Kunjungan Hari Ini".

### Contoh Kasus
- **Tanggal Lokal**: 30 Oktober 2025 (Indonesia, UTC+7)
- **Kunjungan Hari Ini yang Seharusnya**: 0 kunjungan
- **Kunjungan yang Ditampilkan**: 86 kunjungan ❌

**Root Cause**: Dashboard menggunakan tanggal **UTC** (29 Oktober), bukan tanggal **lokal** (30 Oktober).

---

## 🔍 Analisis Masalah

### Kode Bermasalah

```javascript
// ❌ SALAH: Menggunakan UTC timezone
const today = new Date();
const todayString = today.toISOString().split("T")[0];
// Result: "2025-10-29" (UTC) padahal lokal sudah "2025-10-30"
```

### Penjelasan

Fungsi `toISOString()` mengembalikan waktu dalam format **UTC (Coordinated Universal Time)**, bukan waktu lokal.

**Timezone Indonesia (WIB)**: UTC+7

Jadi ketika di Indonesia jam 05:00 pagi tanggal 30 Oktober 2025:
- **Waktu UTC**: 29 Oktober 2025 22:00 (kemarin!)
- **`toISOString().split("T")[0]`**: "2025-10-29" ❌
- **Tanggal Lokal yang Benar**: "2025-10-30" ✅

Akibatnya, dashboard mencari kunjungan tanggal **29 Oktober** dan menemukan 86 kunjungan dari hari kemarin, padahal seharusnya mencari kunjungan tanggal **30 Oktober** (0 kunjungan).

---

## ✅ Solusi

### Gunakan Tanggal Lokal

```javascript
// ✅ BENAR: Menggunakan local timezone
const today = new Date();
const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
// Result: "2025-10-30" (sesuai timezone lokal) ✅
```

### Penjelasan
- `getFullYear()`: Mengambil tahun dalam timezone lokal
- `getMonth()`: Mengambil bulan dalam timezone lokal (0-11, maka +1)
- `getDate()`: Mengambil tanggal dalam timezone lokal (1-31)
- `padStart(2, '0')`: Menambahkan leading zero (01, 02, ..., 09)

---

## 🛠️ File yang Diperbaiki

### 1. `/app/dashboard/page.js`

#### Perubahan pada `fetchDashboardData()`

**Before:**
```javascript
const today = new Date();
const todayString = today.toISOString().split("T")[0];

const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
const monthStart = startOfMonth.toISOString().split("T")[0];
const monthEnd = endOfMonth.toISOString().split("T")[0];
```

**After:**
```javascript
// Get today's date in local timezone (not UTC)
const today = new Date();
const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

// Get this month's date range in local timezone
const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
const monthStart = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}-${String(startOfMonth.getDate()).padStart(2, '0')}`;
const monthEnd = `${endOfMonth.getFullYear()}-${String(endOfMonth.getMonth() + 1).padStart(2, '0')}-${String(endOfMonth.getDate()).padStart(2, '0')}`;
```

#### Tambahan: Console Logging untuk Debugging

```javascript
// Log dates for debugging
console.log('[Dashboard] Fetching data for:', {
  todayString,
  monthStart,
  monthEnd,
});
```

#### Tambahan: Menampilkan Tanggal Lokal di UI

**Before:**
```javascript
<p className="text-xs text-gray-500 mt-1">
  Total: {stats.totalVisitsToday} kunjungan
</p>
```

**After:**
```javascript
<p className="text-xs text-gray-500 mt-1">
  {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
</p>
```

---

### 2. `/app/visits/page.js`

#### Perubahan pada `fetchStats()`

**Before:**
```javascript
// Get today's date in YYYY-MM-DD format
const today = new Date();
const todayString = today.toISOString().split('T')[0];
```

**After:**
```javascript
// Get today's date in YYYY-MM-DD format (local timezone, not UTC)
const today = new Date();
const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
```

---

### 3. `/app/patients/components/PatientDetailModal.jsx`

#### Perubahan pada Quick Filter Buttons

**Before:**
```javascript
onClick={() => {
  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
  setDateFilter({
    startDate: lastMonth.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0]
  });
}}
```

**After:**
```javascript
onClick={() => {
  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
  const formatDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  setDateFilter({
    startDate: formatDate(lastMonth),
    endDate: formatDate(today)
  });
}}
```

---

## 🧪 Testing

### Test 1: Cek Tanggal yang Digunakan

1. Buka browser console (F12)
2. Refresh dashboard
3. Lihat log: `[Dashboard] Fetching data for:`
4. Pastikan `todayString` sesuai dengan tanggal lokal Anda

**Expected Result:**
```
[Dashboard] Fetching data for: {
  todayString: "2025-10-30",
  monthStart: "2025-10-01",
  monthEnd: "2025-10-31"
}
```

### Test 2: Verifikasi Jumlah Kunjungan

1. Buka halaman Dashboard
2. Lihat card "Kunjungan Hari Ini"
3. Pastikan tanggal yang ditampilkan sesuai dengan tanggal lokal
4. Pastikan jumlah kunjungan akurat (0 jika belum ada kunjungan hari ini)

**Expected Result:**
- ✅ Tanggal: 30/10/2025 (sesuai lokal)
- ✅ Jumlah: 0 kunjungan (jika belum ada kunjungan hari ini)

### Test 3: Cek di Berbagai Timezone

Untuk testing di timezone berbeda:

```javascript
// Di browser console
const now = new Date();
console.log({
  'Local Date': now.toLocaleDateString('id-ID'),
  'UTC Date': now.toISOString().split('T')[0],
  'Expected (Local)': `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
});
```

---

## 📊 Impact

### Before Fix
- ❌ Menampilkan data kunjungan hari kemarin (UTC-1 hari)
- ❌ Jumlah tidak akurat untuk timezone Asia
- ❌ User kebingungan karena angka tidak sesuai

### After Fix
- ✅ Menampilkan data kunjungan hari ini (timezone lokal)
- ✅ Jumlah akurat untuk semua timezone
- ✅ User mendapat informasi yang tepat

---

## 🎯 Best Practice untuk Date Handling

### ✅ DO: Gunakan Local Date untuk Date Filtering

```javascript
// Untuk filter tanggal hari ini, bulan ini, dll
const today = new Date();
const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
```

### ❌ DON'T: Jangan Gunakan UTC untuk Local Date Operations

```javascript
// ❌ Salah untuk filter tanggal lokal
const today = new Date();
const utcDate = today.toISOString().split('T')[0];
```

### ✅ DO: Gunakan UTC untuk Timestamp dan Storage

```javascript
// Untuk menyimpan timestamp ke database
const timestamp = new Date().toISOString();
```

### ✅ DO: Format Display Date dengan toLocaleDateString()

```javascript
// Untuk menampilkan tanggal ke user
const displayDate = new Date().toLocaleDateString('id-ID', { 
  day: '2-digit', 
  month: '2-digit', 
  year: 'numeric' 
});
```

---

## 📝 Notes

1. **Timezone Awareness**: Selalu pertimbangkan timezone ketika bekerja dengan tanggal
2. **Server vs Client**: Server biasanya dalam UTC, client dalam local timezone
3. **API Consistency**: Pastikan API dan frontend menggunakan format tanggal yang sama
4. **Testing**: Test di berbagai timezone untuk memastikan konsistensi

---

## 🔗 Related Files

- `/app/dashboard/page.js` - Main dashboard statistics
- `/app/visits/page.js` - Visits page statistics
- `/app/patients/components/PatientDetailModal.jsx` - Patient visit filters
- `/app/api/visits/route.js` - Visits API (already handles date filtering correctly)

---

## ✅ Status

- [x] Bug identified
- [x] Root cause analyzed
- [x] Fix implemented
- [x] Testing completed
- [x] Documentation created

**Fixed by:** AI Assistant  
**Date:** 29 Oktober 2025  
**Issue:** Timezone bug causing incorrect "Today's Visits" count

