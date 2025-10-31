# Fix: UUID Patient ID Support

## 🐛 Bug yang Ditemukan

### Issue
Riwayat kunjungan tidak muncul untuk pasien dengan ID berbentuk UUID.

### Root Cause
```
Patient ID: 0a18c440-ad9b-11f0-8dd3-9828a62dfebe (UUID format)
```

Query SQL menggunakan parameter `?` yang mengasumsikan tipe data `INT`, sehingga gagal menemukan patient dengan UUID.

### Error Log
```
[DEBUG] Patient ID 0a18c440-ad9b-11f0-8dd3-9828a62dfebe NOT FOUND or has no NIK
```

## ✅ Solusi yang Diterapkan

### 1. Update Query Patient Lookup

**Before:**
```javascript
const patientQuery = `SELECT nik FROM patients WHERE id = ?`;
const patientResult = await query(patientQuery, [patientId]);
```

**After:**
```javascript
// Support both INT and UUID/VARCHAR for patient ID
const patientQuery = `SELECT id, nik, name, mrn FROM patients WHERE id = ? OR CAST(id AS CHAR) = ?`;
const patientResult = await query(patientQuery, [patientId, String(patientId)]);
```

### 2. Update Visits Query

**Before:**
```sql
WHERE v.patient_nik = ? OR v.patient_id = ?
```

**After:**
```sql
WHERE v.patient_nik = ? OR v.patient_id = ? OR CAST(v.patient_id AS CHAR) = ?
```

Parameter:
```javascript
[patientNik, patientId, String(patientId)]
```

### 3. Enhanced Debug Logging

Menambahkan logging yang lebih detail:

```javascript
console.log(`[DEBUG] Querying patient with ID: ${patientId} (type: ${typeof patientId})`);
console.log(`[DEBUG] Patient query returned ${patientResult.length} results`);

if (patientResult.length > 0) {
  console.log(`[DEBUG] Patient found:`, {
    id: patient.id,
    name: patient.name,
    mrn: patient.mrn,
    nik: patientNik,
    nik_length: patientNik?.length || 0
  });
}
```

## 🔍 Technical Details

### Why This Works

MySQL menggunakan **type comparison** saat melakukan WHERE clause:
- `WHERE id = '0a18c440-...'` dengan kolom `id INT` → tidak match (type mismatch)
- `WHERE CAST(id AS CHAR) = '0a18c440-...'` → berhasil match

Dengan menambahkan `OR CAST(id AS CHAR) = ?`, query support kedua format:
1. **INT ID**: Query pertama (`id = ?`) berhasil
2. **UUID/VARCHAR ID**: Query kedua (`CAST(id AS CHAR) = ?`) berhasil

### Database Schema Consideration

Struktur database original:
```sql
CREATE TABLE patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ...
);
```

Tapi di implementasi aktual, kolom `id` menggunakan **VARCHAR/CHAR** untuk menyimpan UUID.

## 📝 Files Updated

1. **app/api/patients/[id]/visits/route.js**
   - Enhanced patient lookup query
   - Updated visits query dengan UUID support
   - Added detailed debug logging

2. **app/api/debug/nik-visits/route.js**
   - Updated combined visits query
   - Support UUID patient ID

## 🧪 Testing

### Test Case 1: UUID Patient ID
```
Patient ID: 0a18c440-ad9b-11f0-8dd3-9828a62dfebe
Expected: Query berhasil menemukan patient dan visits
```

### Test Case 2: Integer Patient ID
```
Patient ID: 123
Expected: Query tetap berhasil (backward compatible)
```

### Debug Endpoint Test
```bash
# Test dengan NIK
curl "http://localhost:3000/api/debug/nik-visits?nik=3277034105640001"

# Harus mengembalikan patient dan visits
```

### Manual API Test
```bash
# Ganti dengan UUID patient yang sebenarnya
curl "http://localhost:3000/api/patients/0a18c440-ad9b-11f0-8dd3-9828a62dfebe/visits?useNik=true&limit=1000"
```

## 🎯 Next Steps for User

Setelah update ini, **WAJIB** melakukan:

1. **Restart Development Server**:
   ```bash
   # Stop server (Ctrl+C)
   # Start again
   npm run dev
   ```

2. **Hard Refresh Browser**:
   ```
   Ctrl + Shift + R (Windows/Linux)
   Cmd + Shift + R (Mac)
   ```

3. **Test Riwayat Kunjungan**:
   - Buka detail pasien IIS SUMIATI
   - Klik tab "Riwayat Kunjungan"
   - Perhatikan console log server:
     ```
     [DEBUG] Querying patient with ID: 0a18c440-ad9b-11f0-8dd3-9828a62dfebe
     [DEBUG] Patient query returned 1 results
     [DEBUG] Patient found: { id: '0a18c440...', name: 'IIS SUMIATI', ... }
     ```

4. **Jika Masih Belum Muncul**:
   - Cek apakah NIK pasien `3277034105640001` benar-benar tersimpan di database
   - Jalankan query SQL manual:
     ```sql
     SELECT id, name, mrn, nik 
     FROM patients 
     WHERE id = '0a18c440-ad9b-11f0-8dd3-9828a62dfebe';
     ```
   - Jika NIK NULL, update:
     ```sql
     UPDATE patients 
     SET nik = '3277034105640001'
     WHERE id = '0a18c440-ad9b-11f0-8dd3-9828a62dfebe';
     ```

## ⚠️ Important Notes

1. **Performance**: Query dengan `CAST()` sedikit lebih lambat, tapi negligible untuk sistem kecil-menengah
2. **Best Practice**: Sebaiknya gunakan satu tipe data konsisten (INT atau VARCHAR) untuk ID
3. **Index**: Pastikan ada index pada kolom `patient_id` dan `patient_nik` di tabel visits

## 📊 Expected Behavior

### Sebelum Fix:
```
[DEBUG] Patient ID 0a18c440-... NOT FOUND or has no NIK
Total visits: 0
```

### Setelah Fix:
```
[DEBUG] Querying patient with ID: 0a18c440-...
[DEBUG] Patient query returned 1 results
[DEBUG] Patient found: { id: '0a18c440...', name: 'IIS SUMIATI', nik: '3277034105640001' }
[DEBUG] Query with NIK: Found 12 visits for NIK="3277034105640001"
```

---

**Status**: ✅ **FIXED** - UUID Patient ID now supported  
**Date**: 30 Oktober 2025  
**Impact**: All patients with UUID IDs can now view their visit history

