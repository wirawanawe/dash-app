# Implementasi Fitur Sinkronisasi Data dari API Eksternal

## Ringkasan Perubahan

Dokumen ini menjelaskan implementasi dua fitur utama:
1. **Menambahkan kolom "Kode Faskes" pada tabel Kunjungan**
2. **Fitur sinkronisasi data Dokter dan Klinik dari API eksternal**

---

## 1. Penambahan Kolom "Kode Faskes" pada Tabel Kunjungan

### Perubahan File
- **File**: `app/visits/page.js`

### Deskripsi
Menambahkan kolom baru pada tabel kunjungan yang menampilkan:
- **Kode Faskes**: Kode fasilitas kesehatan (dalam format tebal warna biru)
- **Nama Faskes**: Nama fasilitas kesehatan (dalam format teks kecil abu-abu)

### Detail Implementasi
- Data diambil dari objek `visit.facility` yang sudah tersedia dari API eksternal
- Kolom ditampilkan antara kolom "Klinik/Poli" dan "Diagnosa"
- Format tampilan:
  ```
  Kode: 12345 (bold, blue)
  Nama Faskes (small, gray)
  ```

### Screenshot/Preview
| Kolom Sebelumnya | Kolom Baru | Kolom Berikutnya |
|-----------------|------------|------------------|
| Klinik/Poli | **Kode Faskes** | Diagnosa |

---

## 2. Fitur Sinkronisasi Data Dokter dan Klinik

### A. API Endpoints Baru

#### 2.1. Endpoint Sinkronisasi Dokter
- **File**: `app/api/doctors/sync/route.js`
- **Method**: POST
- **Endpoint**: `/api/doctors/sync`

**Cara Kerja:**
1. Mengambil data kunjungan dari API eksternal (`https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan`)
2. Mengekstrak nama dokter unik dari field `Dokter` pada setiap kunjungan
3. Menyimpan dokter baru ke database lokal (melewati yang sudah ada)
4. Mengembalikan statistik: jumlah dokter yang ditambahkan dan dilewati

**Response Example:**
```json
{
  "success": true,
  "message": "Sinkronisasi selesai: 15 dokter baru ditambahkan, 5 dokter sudah ada",
  "stats": {
    "total": 20,
    "added": 15,
    "skipped": 5
  }
}
```

#### 2.2. Endpoint Sinkronisasi Klinik/Faskes
- **File**: `app/api/clinics/sync/route.js`
- **Method**: POST
- **Endpoint**: `/api/clinics/sync`

**Cara Kerja:**
1. Mengambil data kunjungan dari API eksternal
2. Mengekstrak dua jenis data:
   - **Faskes (Fasilitas Kesehatan)**: Dari field `Fasilitas_Kesehatan[0].Nama_Faskes` dan `Kode`
   - **Poli (Poliklinik)**: Dari field `Klinik` yang dikelompokkan per Faskes
3. Menyimpan:
   - Faskes ke tabel `clinics` (dengan daftar Poli di deskripsi)
   - Poli ke tabel `polyclinics` (dengan referensi kode Faskes)
4. Mengembalikan statistik untuk Faskes dan Poli

**Response Example:**
```json
{
  "success": true,
  "message": "Sinkronisasi selesai: 8 Faskes dan 25 Poli baru ditambahkan",
  "stats": {
    "faskes": {
      "total": 10,
      "added": 8,
      "skipped": 2
    },
    "polis": {
      "total": 30,
      "added": 25,
      "skipped": 5
    }
  }
}
```

### B. Perubahan UI

#### 2.3. Halaman Dokter
- **File**: `app/doctors/page.js`

**Penambahan:**
- State baru: `isSyncing` untuk tracking status sinkronisasi
- Fungsi `handleSyncFromAPI()` untuk memanggil endpoint sinkronisasi
- Tombol **"Sinkronisasi dari API"** dengan:
  - Icon cloud dengan animasi pulse saat loading
  - Warna gradient hijau (green-500 to emerald-600)
  - Disabled state saat proses sinkronisasi berlangsung
  - Toast notification untuk feedback user

**Alur Kerja:**
1. User klik tombol "Sinkronisasi dari API"
2. Muncul konfirmasi dialog
3. Jika user konfirmasi:
   - Tampil loading toast
   - Memanggil POST `/api/doctors/sync`
   - Menunggu response (bisa memakan waktu beberapa menit)
   - Tampil success/error toast
   - Refresh data dokter otomatis

#### 2.4. Halaman Klinik
- **File**: `app/clinics/page.js`

**Penambahan:**
- State baru: `isSyncing`
- Fungsi `handleSyncFromAPI()` untuk sinkronisasi Faskes dan Poli
- Tombol **"Sinkronisasi dari API"** dengan fitur serupa halaman Dokter

**Alur Kerja:**
Sama dengan halaman Dokter, namun mensinkronkan data Faskes dan Poli

---

## 3. Struktur Data

### Data Sumber (API Eksternal)

**Endpoint**: `https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan`

**Struktur Response:**
```json
{
  "data": [
    {
      "No_Kunjungan": "12345",
      "Tgl_Kunjungan": "2025-10-30",
      "Dokter": "Dr. John Doe, Sp.PD",
      "Klinik": "Poli Umum",
      "Diagnosa": "Demam tifoid",
      "Fasilitas_Kesehatan": [
        {
          "Kode": "FKTP001",
          "Nama_Faskes": "Klinik Pratama PHC Jakarta"
        }
      ],
      "Pasien": [...]
    }
  ],
  "total pasien": 1234
}
```

### Data Tujuan (Database Lokal)

#### Tabel `doctors`
```sql
CREATE TABLE doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  specialist VARCHAR(100),
  license_number VARCHAR(50),
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  clinic_id INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### Tabel `clinics`
```sql
CREATE TABLE clinics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,        -- Nama Faskes
  address TEXT,                      -- Kode Faskes (untuk referensi)
  city VARCHAR(100),                 -- Default: 'N/A'
  description TEXT,                  -- Daftar Poli
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### Tabel `polyclinics`
```sql
CREATE TABLE polyclinics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,        -- Nama Poli
  code VARCHAR(20) NOT NULL,         -- Kode Faskes (sebagai referensi)
  description TEXT,                  -- Deskripsi
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 4. Fitur Tambahan

### 4.1. Retry Mechanism
Kedua endpoint sinkronisasi dilengkapi dengan retry mechanism:
- Maksimal 3 percobaan untuk setiap request
- Exponential backoff delay (2^n detik)
- Timeout 30 detik per request

### 4.2. Parallel Fetching
Data dari API eksternal diambil secara paralel:
- Mengambil hingga 10,000 record terbaru
- Batch size: 1000 record per page
- Multiple pages diambil secara parallel menggunakan `Promise.all()`

### 4.3. Duplicate Prevention
Sistem otomatis melewati data yang sudah ada:
- Dokter: Cek berdasarkan nama
- Klinik: Cek berdasarkan nama Faskes
- Poli: Cek berdasarkan kombinasi nama dan kode Faskes

### 4.4. Error Handling
- Try-catch di setiap operasi database
- Error logging ke console
- Toast notification untuk user feedback
- Graceful failure (melanjutkan proses meski ada error di satu item)

---

## 5. Cara Penggunaan

### 5.1. Sinkronisasi Dokter
1. Buka halaman **Dokter** (`/doctors`)
2. Klik tombol **"Sinkronisasi dari API"** (warna hijau, icon cloud)
3. Konfirmasi dialog yang muncul
4. Tunggu proses selesai (loading toast akan tampil)
5. Setelah selesai, data dokter akan ter-refresh otomatis
6. Notifikasi akan menampilkan jumlah dokter yang ditambahkan

### 5.2. Sinkronisasi Klinik
1. Buka halaman **Klinik** (`/clinics`)
2. Klik tombol **"Sinkronisasi dari API"** (warna hijau, icon cloud)
3. Konfirmasi dialog yang muncul
4. Tunggu proses selesai (bisa memakan waktu lebih lama karena ada 2 tabel)
5. Setelah selesai, data klinik akan ter-refresh otomatis
6. Notifikasi akan menampilkan jumlah Faskes dan Poli yang ditambahkan

---

## 6. Testing & Validasi

### 6.1. Test Scenario - Sinkronisasi Dokter
1. ✅ Dokter baru dari API berhasil disimpan ke database
2. ✅ Dokter yang sudah ada dilewati (tidak duplikat)
3. ✅ Loading state ditampilkan dengan benar
4. ✅ Toast notification muncul sesuai hasil
5. ✅ Data dokter ter-refresh setelah sinkronisasi

### 6.2. Test Scenario - Sinkronisasi Klinik
1. ✅ Faskes baru berhasil disimpan ke tabel `clinics`
2. ✅ Poli baru berhasil disimpan ke tabel `polyclinics`
3. ✅ Deskripsi Faskes berisi daftar Poli
4. ✅ Kode Faskes tersimpan sebagai referensi
5. ✅ Duplikat data dihindari
6. ✅ Data klinik ter-refresh setelah sinkronisasi

### 6.3. Test Scenario - Kolom Kode Faskes
1. ✅ Kolom "Kode Faskes" tampil di tabel kunjungan
2. ✅ Kode Faskes ditampilkan dengan format bold warna biru
3. ✅ Nama Faskes ditampilkan di bawah kode dengan font kecil
4. ✅ Data kosong ditampilkan sebagai "-"
5. ✅ Layout tabel tetap responsif

---

## 7. Catatan Penting

### 7.1. Performance
- Proses sinkronisasi bisa memakan waktu 2-5 menit tergantung jumlah data
- Mengambil hingga 10,000 record terbaru dari API eksternal
- Gunakan fitur ini di luar jam sibuk untuk performa optimal

### 7.2. Batasan
- Sinkronisasi hanya mengambil data nama dokter (tidak ada email, telp, dsb)
- Data tambahan perlu diisi manual di halaman Dokter setelah sinkronisasi
- Faskes disimpan dengan kode di field `address` (bukan field tersendiri)
- Poli tidak terhubung langsung dengan Faskes di database (hanya via `code`)

### 7.3. Rekomendasi
- Jalankan sinkronisasi secara berkala (misalnya seminggu sekali)
- Lengkapi data dokter setelah sinkronisasi dengan informasi tambahan
- Review data Faskes dan Poli untuk memastikan akurasi
- Backup database sebelum melakukan sinkronisasi pertama kali

---

## 8. Troubleshooting

### Problem: Sinkronisasi gagal atau timeout
**Solusi:**
- Cek koneksi internet
- Pastikan API eksternal dapat diakses
- Coba lagi di lain waktu (mungkin API sedang sibuk)

### Problem: Data duplikat muncul
**Solusi:**
- Hapus data duplikat secara manual
- Nama dokter harus sama persis untuk deteksi duplikat

### Problem: Kolom Kode Faskes kosong
**Solusi:**
- Data dari API mungkin tidak memiliki informasi Faskes
- Hal ini normal untuk data lama yang belum memiliki field Faskes

---

## 9. File yang Diubah/Ditambahkan

### File Baru
1. `app/api/doctors/sync/route.js` - Endpoint sinkronisasi dokter
2. `app/api/clinics/sync/route.js` - Endpoint sinkronisasi klinik
3. `SYNC_FEATURES_IMPLEMENTATION.md` - Dokumentasi ini

### File yang Dimodifikasi
1. `app/visits/page.js` - Tambah kolom Kode Faskes
2. `app/doctors/page.js` - Tambah tombol dan fungsi sinkronisasi
3. `app/clinics/page.js` - Tambah tombol dan fungsi sinkronisasi

---

## 10. Kesimpulan

Implementasi ini berhasil menambahkan:
1. ✅ Kolom "Kode Faskes" pada tabel Kunjungan
2. ✅ Fitur sinkronisasi Dokter dari API eksternal
3. ✅ Fitur sinkronisasi Klinik/Faskes dan Poli dari API eksternal
4. ✅ UI/UX yang user-friendly dengan loading state dan toast notification
5. ✅ Error handling dan duplicate prevention yang robust

Sistem sekarang dapat mengimpor data master (Dokter dan Klinik) secara otomatis dari API eksternal, mengurangi input manual dan memastikan konsistensi data.

---

**Tanggal Implementasi**: 30 Oktober 2025  
**Versi**: 1.0

