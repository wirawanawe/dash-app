# Debug: NIK 3277034105640001 - 12 Kunjungan Tidak Muncul

## 🔍 Masalah
Data pasien dengan NIK `3277034105640001` memiliki 12 kunjungan di tabel `visits`, tetapi tidak muncul di detail pasien tab "Riwayat Kunjungan".

## 🛠️ Langkah Debugging

### Opsi 1: Menggunakan API Debug Endpoint

1. **Jalankan aplikasi** (jika belum berjalan):
   ```bash
   npm run dev
   ```

2. **Akses endpoint debug** di browser atau Postman:
   ```
   http://localhost:3000/api/debug/nik-visits?nik=3277034105640001
   ```

3. **Analisa hasil JSON** yang muncul. Perhatikan bagian:
   - `summary.patient_found_in_patients_table` - apakah NIK ada di tabel `patients`?
   - `summary.visits_with_patient_nik` - berapa banyak visits dengan `patient_nik`?
   - `summary.visits_with_patient_id` - berapa banyak visits dengan `patient_id`?
   - `summary.issue_detected` - deskripsi masalah yang terdeteksi

### Opsi 2: Cek Console Log Server

1. **Buka detail pasien** dengan NIK `3277034105640001`
2. **Klik tab "Riwayat Kunjungan"**
3. **Lihat console log server** (terminal tempat `npm run dev` berjalan)
4. Cari log yang dimulai dengan `[DEBUG]`:
   ```
   [DEBUG] Patient ID XX has NIK: "3277034105640001" (length: 16)
   [DEBUG] Query with NIK: Found XX visits for NIK="3277034105640001" OR patient_id=XX
   [DEBUG] Sample visit: { id: XX, visit_date: ..., ... }
   ```

### Opsi 3: Query Database Langsung

Jalankan query berikut di MySQL:

```sql
-- 1. Cek apakah NIK ada di tabel patients
SELECT id, mrn, name, nik, CHAR_LENGTH(nik) as nik_length
FROM patients 
WHERE nik = '3277034105640001';

-- 2. Cek kunjungan dengan patient_nik
SELECT 
  id, 
  patient_id, 
  patient_nik, 
  CHAR_LENGTH(patient_nik) as nik_length,
  patient_name, 
  visit_date,
  status
FROM visits 
WHERE patient_nik = '3277034105640001'
ORDER BY visit_date DESC;

-- 3. Cek kunjungan dengan TRIM (jika ada whitespace)
SELECT 
  id, 
  patient_id, 
  patient_nik, 
  CHAR_LENGTH(patient_nik) as nik_length,
  patient_name, 
  visit_date
FROM visits 
WHERE TRIM(patient_nik) = '3277034105640001'
ORDER BY visit_date DESC;

-- 4. Cek dengan LIKE (jika ada masalah format)
SELECT 
  id, 
  patient_id, 
  patient_nik, 
  CHAR_LENGTH(patient_nik) as nik_length,
  patient_name, 
  visit_date
FROM visits 
WHERE patient_nik LIKE '%3277034105640001%'
ORDER BY visit_date DESC;

-- 5. Cek kombinasi (jika pasien ditemukan di step 1)
-- Ganti XXX dengan patient.id dari hasil query 1
SELECT 
  COUNT(*) as total_visits,
  MIN(visit_date) as first_visit,
  MAX(visit_date) as last_visit
FROM visits 
WHERE patient_nik = '3277034105640001' OR patient_id = XXX;
```

## 🔎 Kemungkinan Penyebab

### 1. NIK Tidak Ada di Tabel `patients`
**Gejala**: 
- Query 1 tidak mengembalikan hasil
- API mencari patient berdasarkan ID, tapi tidak menemukan NIK

**Solusi**:
```sql
-- Update NIK di tabel patients jika patient sudah ada
UPDATE patients 
SET nik = '3277034105640001'
WHERE id = XXX; -- ganti XXX dengan patient ID yang benar
```

### 2. Format NIK Berbeda (Whitespace, Leading Zeros)
**Gejala**:
- Query exact match tidak berhasil
- Query dengan LIKE atau TRIM berhasil
- `nik_length` tidak sama dengan 16

**Solusi**:
```sql
-- Cleanup NIK di tabel visits
UPDATE visits 
SET patient_nik = TRIM(patient_nik)
WHERE patient_nik IS NOT NULL;

-- Cleanup NIK di tabel patients
UPDATE patients 
SET nik = TRIM(nik)
WHERE nik IS NOT NULL;
```

### 3. Data Visits Tidak Ter-link
**Gejala**:
- Data visits ada dengan `patient_nik` yang benar
- Tapi `patient_id` NULL atau tidak cocok dengan patient di tabel `patients`

**Solusi**:
```sql
-- Link visits ke patients berdasarkan NIK
UPDATE visits v
INNER JOIN patients p ON v.patient_nik = p.nik
SET v.patient_id = p.id
WHERE v.patient_nik = '3277034105640001' 
  AND (v.patient_id IS NULL OR v.patient_id != p.id);
```

### 4. Parameter `useNik` Tidak Digunakan
**Gejala**:
- Log server tidak muncul
- Query tidak menggunakan NIK

**Solusi**:
- Pastikan frontend sudah di-refresh setelah perubahan kode
- Clear cache browser (Ctrl + Shift + R)
- Restart development server

## 🧪 Test Manual

### Test 1: Akses langsung API endpoint
```bash
# Ganti 123 dengan patient ID yang sebenarnya
curl "http://localhost:3000/api/patients/123/visits?useNik=true&limit=1000"
```

**Expected**: Harus return JSON dengan array visits yang berisi 12 data

### Test 2: Cek di browser
1. Buka halaman Patients
2. Cari pasien dengan NIK `3277034105640001`
3. Klik detail pasien
4. Klik tab "Riwayat Kunjungan"
5. Lihat apakah 12 kunjungan muncul

## 📝 Catatan Penting

1. **NIK harus exact match** - tidak boleh ada whitespace atau karakter ekstra
2. **NIK di patients.nik harus terisi** - jika NULL, query tidak akan berfungsi
3. **Patient ID harus benar** - pastikan membuka detail pasien yang benar
4. **Reload page** setelah perubahan kode untuk memastikan code terbaru terload

## 🔧 Quick Fix Script

Jika masalahnya adalah NIK tidak ada di tabel patients, jalankan:

```sql
-- Asumsi: ada visits dengan patient_nik tapi tidak ada patient dengan NIK tersebut
-- Solusi: buat patient baru atau update existing patient

-- Opsi 1: Update existing patient
UPDATE patients 
SET nik = '3277034105640001'
WHERE mrn = 'XXX'; -- ganti dengan MR Number yang benar

-- Opsi 2: Link visits yang ada ke patient berdasarkan nama
UPDATE visits v
INNER JOIN patients p ON TRIM(v.patient_name) = TRIM(p.name)
SET v.patient_id = p.id
WHERE v.patient_nik = '3277034105640001';
```

## ✅ Verifikasi Perbaikan

Setelah melakukan perbaikan:

1. **Test query langsung**:
   ```sql
   SELECT COUNT(*) 
   FROM visits v
   INNER JOIN patients p ON v.patient_nik = p.nik OR v.patient_id = p.id
   WHERE p.nik = '3277034105640001';
   ```
   Harus return: 12

2. **Test API endpoint**:
   - Akses `/api/debug/nik-visits?nik=3277034105640001`
   - `summary.total_visits` harus = 12

3. **Test di UI**:
   - Buka detail pasien
   - Tab "Riwayat Kunjungan" harus menampilkan 12 data

---

**Dibuat**: 30 Oktober 2025  
**Status**: 🔍 Waiting for debug results

