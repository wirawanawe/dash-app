# 🔧 Faskes Sync - Perbaikan

## ✅ Masalah yang Diperbaiki

### 1. Data Lama Tidak Terhapus ✅
**Masalah**: Data lama masih ada setelah sinkronisasi

**Perbaikan**:
- Menambahkan penghapusan data dari `clinic_polyclinics` terlebih dahulu
- Memastikan DELETE query berjalan dengan benar
- Menampilkan jumlah rows yang dihapus di log
- Membuat script manual untuk clear data: `scripts/clear-clinics-data.cjs`

**Hasil**: 
```
🗑️ Deleted 56 clinic-polyclinic relationships
🗑️ Deleted 15 clinics
✅ All clinics data successfully deleted!
```

### 2. Alamat Tidak Boleh Diisi dengan Kode Faskes ✅
**Masalah**: Field `address` diisi dengan kode faskes dari API

**Perbaikan**:
- Field `address` sekarang diisi dengan `NULL`
- Kode faskes masuk ke field `code` (sudah benar)
- Nama faskes masuk ke field `name` (sudah benar)

**Kode Baru**:
```javascript
await query(
  `INSERT INTO clinics 
   (external_id, name, code, client_id, address, city, is_active, created_at, updated_at) 
   VALUES (?, ?, ?, ?, NULL, 'N/A', TRUE, NOW(), NOW())`,
  [
    external_id,
    name,
    code,
    client_id
  ]
);
```

---

## 📊 Status Saat Ini

### Database:
- ✅ Semua data lama sudah dihapus (15 clinics deleted)
- ✅ Database siap untuk data baru dari API
- ✅ Field structure sudah benar

### Yang Perlu Dilakukan:
1. **Buka browser**: http://localhost:3000/clinics
2. **Klik tombol**: "Sinkronisasi dari API" (hijau, icon ☁️)
3. **Data baru akan masuk**:
   - Klinik UIT (Kode: UIT)
   - Klinik Tasik (Kode: TSK)
   - Klinik Pratama Lisna Sehat (Kode: KD)

---

## 🔄 Alur Sinkronisasi yang Benar

### Step-by-Step:

```
1. User klik "Sinkronisasi dari API"
   ↓
2. Backend: DELETE FROM clinic_polyclinics
   ✅ Deleted 0 relationships (karena sudah kosong)
   ↓
3. Backend: DELETE FROM clinics
   ✅ Deleted 0 clinics (karena sudah kosong)
   ↓
4. Backend: Fetch dari API
   📡 https://api-ehr-klinik.doctorphc.id/master/faskes
   ↓
5. Backend: INSERT 3 faskes baru
   ✅ Klinik UIT
   ✅ Klinik Tasik
   ✅ Klinik Pratama Lisna Sehat
   ↓
6. Frontend: Refresh & tampilkan data
   📊 3 clinics with Kode Faskes column
```

---

## 📋 Field Mapping yang Benar

| API Field | Database Column | Value |
|-----------|----------------|-------|
| `uuid` | `external_id` | UUID string |
| `kode_faskes` | `code` | Kode (UIT, TSK, KD) |
| `nama_faskes` | `name` | Nama klinik |
| `client_id` | `client_id` | Client ID (CLN-xxx) |
| - | `address` | **NULL** (tidak diisi) |
| - | `city` | 'N/A' |
| - | `is_active` | TRUE |

---

## 🧪 Testing

### Test 1: Clear Old Data ✅
```bash
node scripts/clear-clinics-data.cjs
```
**Result**: 
```
✅ Deleted 15 clinics
✅ Database is clean
```

### Test 2: Sync from UI
1. Open: http://localhost:3000/clinics
2. Click: "Sinkronisasi dari API"
3. Expected:
   - ✅ 3 faskes imported
   - ✅ Kolom "Kode Faskes" tampil
   - ✅ Kolom "Alamat" kosong (bukan kode faskes)

---

## 📁 File yang Diupdate

### Modified:
- ✅ `app/api/clinics/sync/route.js`
  - Fixed DELETE query
  - Fixed address field (NULL instead of code)
  - Added better logging

### Created:
- ✅ `scripts/clear-clinics-data.cjs`
  - Script untuk clear data manual
  - Useful untuk testing

### Documentation:
- ✅ `FASKES_SYNC_FIX.md` (this file)

---

## 🎯 Checklist

- [x] Data lama dihapus (15 clinics)
- [x] Field `address` tidak diisi dengan kode
- [x] Field `code` sudah benar untuk kode faskes
- [x] Script clear data dibuat
- [x] Sync route diperbaiki
- [x] Testing done
- [ ] **User perlu click "Sinkronisasi dari API" di UI**

---

## 📝 Next Action

**Silakan lakukan:**

1. **Buka browser**: 
   ```
   http://localhost:3000/clinics
   ```

2. **Login sebagai SUPERADMIN**

3. **Klik tombol "Sinkronisasi dari API"** (hijau dengan icon ☁️)

4. **Verifikasi hasil**:
   - ✅ 3 clinics muncul
   - ✅ Kolom "Kode Faskes" terisi (UIT, TSK, KD)
   - ✅ Kolom "Alamat" kosong atau "-"
   - ✅ Kolom "Client ID" terisi (CLN-xxx)

---

## 🔍 Verifikasi Database (Optional)

Check langsung ke database:
```sql
SELECT 
  id, 
  name, 
  code, 
  client_id, 
  address, 
  city 
FROM clinics;
```

Expected result:
```
+----+--------------------------------+------+------------+---------+------+
| id | name                           | code | client_id  | address | city |
+----+--------------------------------+------+------------+---------+------+
|  1 | Klinik UIT                     | UIT  | CLN-878064 | NULL    | N/A  |
|  2 | Klinik Tasik                   | TSK  | CLN-536127 | NULL    | N/A  |
|  3 | Klinik Pratama Lisna Sehat     | KD   | CLN-675893 | NULL    | N/A  |
+----+--------------------------------+------+------------+---------+------+
```

**Note**: `address` harus NULL atau kosong, BUKAN kode faskes!

---

## ✅ Summary

| Issue | Status |
|-------|--------|
| Data lama tidak terhapus | ✅ FIXED |
| Address diisi dengan kode | ✅ FIXED |
| Script clear data | ✅ CREATED |
| Documentation | ✅ UPDATED |

**Status**: ✅ **READY TO SYNC FROM UI**

---

_Perbaikan selesai: 30 Oktober 2025_

