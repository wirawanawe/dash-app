# Perbaikan Riwayat Kunjungan Pasien

## 📋 Ringkasan

Perbaikan untuk mengambil data riwayat kunjungan pasien dari tabel `visits` (kunjungan) berdasarkan **No.KTP (NIK)** pasien. Sebelumnya, sistem hanya mengambil data berdasarkan `patient_id`, yang menyebabkan data kunjungan yang tersimpan dengan `patient_nik` tidak muncul.

## 🎯 Masalah yang Diperbaiki

### Masalah Sebelumnya:
- Riwayat kunjungan hanya mengambil data berdasarkan `patient_id`
- Data kunjungan dari API eksternal yang tersimpan dengan `patient_nik` tidak muncul
- Pasien yang sama dengan NIK yang sama tetapi `patient_id` berbeda tidak menampilkan riwayat kunjungan lengkap

### Solusi:
- Menambahkan parameter `useNik=true` pada API endpoint
- Query database sekarang mencari berdasarkan `patient_nik` **ATAU** `patient_id`
- Menggabungkan data dari kedua sumber untuk riwayat kunjungan lengkap

## 🔧 Perubahan yang Dilakukan

### 1. API Route: `/api/patients/[id]/visits/route.js`

#### Fitur Baru:
- Parameter query baru: `useNik` (boolean)
- Jika `useNik=true`, sistem akan:
  1. Mengambil NIK pasien dari tabel `patients`
  2. Query visits menggunakan `WHERE patient_nik = ? OR patient_id = ?`
  3. Mengembalikan semua kunjungan yang cocok dengan NIK atau patient_id

#### Query SQL:
```sql
-- Dengan useNik=true
SELECT 
  v.id,
  v.visit_date,
  v.visit_time,
  v.status,
  v.complaint,
  v.diagnosis,
  v.treatment,
  v.notes,
  v.assessment,
  v.room,
  v.clinic,
  COALESCE(v.patient_name, p.name) as patient_name,
  COALESCE(v.patient_nik, p.nik) as patient_nik,
  COALESCE(v.doctor_name, d.name) as doctor_name,
  v.visit_number,
  v.external_id,
  v.physical_exam,
  v.facility_name,
  v.patient_nip,
  v.patient_no_peserta,
  v.patient_nama_peserta,
  v.patient_gender,
  v.patient_birth_date,
  v.patient_department
FROM visits v
LEFT JOIN patients p ON v.patient_id = p.id
LEFT JOIN doctors d ON v.doctor_id = d.id
WHERE v.patient_nik = ? OR v.patient_id = ?
ORDER BY v.visit_date DESC, v.visit_time DESC
```

### 2. PatientDetailModal Component

**File**: `app/patients/components/PatientDetailModal.jsx`

#### Perubahan:
- Fungsi `fetchVisitHistory()` disederhanakan
- Menghapus fetch dari external API
- Menggunakan endpoint internal dengan parameter `useNik=true`

```javascript
const fetchVisitHistory = async () => {
  if (!patient.id) return;
  
  setLoadingVisits(true);
  try {
    const patientId = patient.id;
    let visits = [];
    
    // Fetch visits from internal database using NIK-based query
    const response = await fetch(
      `/api/patients/${patientId}/visits?limit=1000&page=1&useNik=true`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        visits = data.data;
      }
    }
    
    setVisitHistory(visits);
  } catch (error) {
    console.error("Error in fetchVisitHistory:", error);
    setVisitHistory([]);
  } finally {
    setLoadingVisits(false);
  }
};
```

### 3. PatientVisitHistory Component

**File**: `app/patients/components/PatientVisitHistory.jsx`

#### Perubahan:
- Menambahkan parameter `useNik=true` pada fetch URL

```javascript
const url = `/api/patients/${patientId}/visits?page=${currentPage}&limit=50&useNik=true`;
```

### 4. VisitHistory Component (Patient Detail Page)

**File**: `app/patients/[id]/components/VisitHistory.jsx`

#### Perubahan:
- Menambahkan parameter `useNik=true` pada fetch URL

```javascript
const response = await fetch(
  `/api/patients/${patientId}/visits?page=${currentPage}&limit=50&useNik=true`
);
```

## 📊 Struktur Data

### Tabel `patients`
- `id` - Primary key
- `nik` - No.KTP/NIK pasien
- `name` - Nama pasien
- ... (kolom lainnya)

### Tabel `visits`
- `id` - Primary key
- `patient_id` - Foreign key ke patients (nullable)
- `patient_nik` - NIK dari API eksternal
- `patient_name` - Nama dari API eksternal
- `visit_date` - Tanggal kunjungan
- `visit_time` - Waktu kunjungan
- `diagnosis` - Diagnosa
- `complaint` - Keluhan
- `treatment` - Tindakan
- `doctor_name` - Nama dokter
- `clinic` - Nama klinik
- ... (kolom lainnya dari API)

## 🔍 Cara Kerja

1. **Frontend** memanggil API dengan `useNik=true`:
   ```
   GET /api/patients/123/visits?useNik=true&limit=1000
   ```

2. **Backend** (API route):
   - Ambil NIK dari tabel `patients` berdasarkan `patient_id`
   - Query tabel `visits` dengan:
     - `patient_nik = [nik yang didapat]` **ATAU**
     - `patient_id = [patient_id]`
   - Return semua kunjungan yang cocok

3. **Frontend** menerima dan menampilkan data kunjungan lengkap

## ✅ Manfaat

1. **Data Lengkap**: Menampilkan semua kunjungan pasien, baik dari API eksternal maupun input manual
2. **Akurasi**: Menggunakan NIK sebagai identifier utama, lebih akurat dari MR Number
3. **Konsistensi**: Tidak ada lagi data kunjungan yang hilang
4. **Performa**: Query langsung ke database lokal, lebih cepat dari API eksternal

## 🧪 Testing

### Test Case 1: Pasien dengan kunjungan dari API eksternal
- Buka detail pasien yang memiliki NIK
- Klik tab "Riwayat Kunjungan"
- **Expected**: Menampilkan semua kunjungan yang tersimpan dengan `patient_nik` tersebut

### Test Case 2: Pasien dengan kunjungan manual
- Buka detail pasien yang memiliki kunjungan input manual
- Klik tab "Riwayat Kunjungan"
- **Expected**: Menampilkan kunjungan berdasarkan `patient_id`

### Test Case 3: Pasien dengan kunjungan campuran
- Buka detail pasien yang memiliki kunjungan dari API dan manual
- Klik tab "Riwayat Kunjungan"
- **Expected**: Menampilkan gabungan semua kunjungan

## 📝 Notes

- Parameter `useNik` bersifat **optional** (default: `false`)
- Jika pasien tidak memiliki NIK, sistem fallback ke query berdasarkan `patient_id`
- Query menggunakan `COALESCE()` untuk menggabungkan data dari berbagai sumber
- Sorting berdasarkan tanggal terbaru terlebih dahulu

## 🔄 Backward Compatibility

Perubahan ini **backward compatible**:
- Endpoint lama masih berfungsi (tanpa parameter `useNik`)
- Component lain yang tidak menggunakan `useNik=true` tidak terpengaruh
- Data existing tidak perlu migrasi

## 📅 Tanggal Implementasi

**30 Oktober 2025**

---

**Status**: ✅ **SELESAI** - Riwayat kunjungan berhasil diambil dari tabel `visits` berdasarkan No.KTP (NIK)

