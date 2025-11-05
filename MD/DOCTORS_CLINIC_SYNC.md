# Sinkronisasi Dokter dengan Data Klinik dari API Kunjungan

## Ringkasan Perubahan

Sistem sinkronisasi dokter telah diperbarui untuk mengambil dan menyimpan data klinik dari API kunjungan eksternal. Setiap dokter sekarang akan otomatis dihubungkan dengan klinik tempat mereka praktek berdasarkan data dari API kunjungan.

---

## Perubahan Utama

### 1. Error Fix - Duplikasi `doctorStats`
**File:** `app/doctors/page.js`

**Masalah:** 
- Variabel `doctorStats` didefinisikan dua kali (baris 206 dan 294)
- Menyebabkan error: "the name `doctorStats` is defined multiple times"

**Solusi:**
- Menghapus definisi `doctorStats` yang kedua (baris 293-299)
- Mempertahankan definisi pertama yang lebih lengkap (baris 206-221) yang mencakup statistik per klinik dan poli

---

### 2. Sinkronisasi Dokter dengan Data Klinik

#### A. API Sync (Tambah Dokter Baru)
**File:** `app/api/doctors/sync/route.js`

**Fitur Baru:**
1. **Ekstraksi Data Klinik dari API Kunjungan**
   - Mengambil nama klinik dari field `Klinik` (contoh: "UMUM", "GIGI")
   - Mengambil kode fasilitas dari `Fasilitas_Kesehatan[0].Kode`
   - Mengambil nama fasilitas dari `Fasilitas_Kesehatan[0].Nama_Faskes`

2. **Pembuatan/Pencarian Klinik Otomatis**
   - Memeriksa apakah klinik sudah ada di database berdasarkan nama
   - Jika belum ada, membuat klinik baru dengan informasi dari API
   - Menyimpan mapping nama klinik ke clinic_id

3. **Asosiasi Dokter dengan Klinik**
   - Setiap dokter dihubungkan dengan klinik utama mereka (klinik pertama yang ditemukan)
   - Dokter baru langsung disimpan dengan `clinic_id`
   - Dokter yang sudah ada diperbarui dengan `clinic_id` jika sebelumnya kosong

**Response API:**
```json
{
  "success": true,
  "message": "Sinkronisasi selesai: X dokter baru ditambahkan, Y dokter diperbarui dengan klinik, Z dokter sudah ada",
  "stats": {
    "totalDoctors": 150,
    "totalClinics": 5,
    "added": 10,
    "updated": 20,
    "skipped": 120
  }
}
```

#### B. API Reset-Sync (Reset & Sinkronisasi Ulang)
**File:** `app/api/doctors/reset-sync/route.js`

**Fitur Baru:**
1. **Menghapus Semua Dokter Lama**
   - Menghapus seluruh data dokter dari database
   - Menghitung jumlah dokter yang dihapus

2. **Sinkronisasi Ulang dengan Data Klinik**
   - Proses yang sama dengan API sync biasa
   - Semua dokter baru disimpan dengan informasi klinik
   - Klinik baru dibuat jika belum ada

**Response API:**
```json
{
  "success": true,
  "message": "Reset dan sinkronisasi selesai: X dokter lama dihapus, Y dokter baru ditambahkan dengan data klinik",
  "stats": {
    "deleted": 100,
    "totalDoctors": 150,
    "totalClinics": 5,
    "added": 150,
    "errors": 0
  }
}
```

---

## Alur Sinkronisasi

### 1. Pengambilan Data dari API Kunjungan
```
API Endpoint: https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan
```

**Data yang Diambil:**
- `Dokter`: Nama dokter
- `Klinik`: Nama klinik/poli (UMUM, GIGI, dll)
- `Fasilitas_Kesehatan[0].Kode`: Kode fasilitas (contoh: "KD")
- `Fasilitas_Kesehatan[0].Nama_Faskes`: Nama fasilitas (contoh: "Klinik Pratama Lisna Sehat")

### 2. Ekstraksi Data Unik
```javascript
// Contoh data yang diekstrak:
doctorsMap = {
  "Cristian Pranata, dr.": {
    name: "Cristian Pranata, dr.",
    clinics: ["UMUM", "GIGI"]
  },
  "Dr. Siti Aminah": {
    name: "Dr. Siti Aminah",
    clinics: ["UMUM"]
  }
}

clinicsMap = {
  "UMUM": {
    name: "UMUM",
    facilityCode: "KD",
    facilityName: "Klinik Pratama Lisna Sehat"
  },
  "GIGI": {
    name: "GIGI",
    facilityCode: "KD",
    facilityName: "Klinik Pratama Lisna Sehat"
  }
}
```

### 3. Pembuatan/Pencarian Klinik
```sql
-- Cek apakah klinik sudah ada
SELECT id FROM clinics WHERE name = 'UMUM' LIMIT 1;

-- Jika belum ada, buat klinik baru
INSERT INTO clinics (name, code, address, city, phone, is_active, created_at, updated_at) 
VALUES ('Klinik Pratama Lisna Sehat', 'KD', '-', '-', '-', 1, NOW(), NOW());
```

### 4. Penyimpanan Dokter dengan Klinik
```sql
-- Untuk dokter baru
INSERT INTO doctors (name, specialist, license_number, clinic_id, created_at, updated_at) 
VALUES ('Cristian Pranata, dr.', NULL, NULL, 1, NOW(), NOW());

-- Untuk dokter yang sudah ada (hanya update jika clinic_id masih NULL)
UPDATE doctors 
SET clinic_id = 1, updated_at = NOW() 
WHERE id = 5 AND clinic_id IS NULL;
```

---

## Struktur Database

### Tabel `doctors`
```sql
CREATE TABLE doctors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  specialist VARCHAR(255),
  license_number VARCHAR(100),
  clinic_id INT,                    -- ← Field untuk hubungan dengan klinik
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id)
);
```

### Tabel `clinics`
```sql
CREATE TABLE clinics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## Penggunaan

### 1. Sinkronisasi Biasa (Tambah Dokter Baru)
```bash
# Via UI: Klik tombol "Sinkronisasi dari API"
# Via API:
POST /api/doctors/sync
```

**Hasil:**
- Dokter baru ditambahkan dengan data klinik
- Dokter yang sudah ada tanpa klinik diperbarui
- Dokter yang sudah ada dengan klinik diabaikan

### 2. Reset & Sinkronisasi Ulang
```bash
# Via UI: Klik tombol "Reset & Sinkronisasi Ulang"
# Via API:
POST /api/doctors/reset-sync
```

**Peringatan:** 
⚠️ Proses ini akan **menghapus semua data dokter** yang ada!
- Memerlukan konfirmasi ganda
- Semua dokter lama dihapus
- Data dokter baru dari API disimpan dengan informasi klinik

---

## Contoh Skenario

### Skenario 1: Sinkronisasi Pertama Kali
**Kondisi Awal:** Database kosong

**Proses:**
1. Ambil data dari 10 halaman terakhir API kunjungan
2. Temukan 150 dokter unik dan 5 klinik unik
3. Buat 5 klinik baru di database
4. Tambahkan 150 dokter dengan clinic_id yang sesuai

**Hasil:**
- 5 klinik baru: UMUM, GIGI, MATA, THT, ANAK
- 150 dokter baru dengan klinik masing-masing

### Skenario 2: Sinkronisasi Lanjutan
**Kondisi Awal:** Database sudah ada 100 dokter, 50 tanpa clinic_id

**Proses:**
1. Ambil data dari API kunjungan
2. Temukan 120 dokter unik (50 baru, 70 sudah ada)
3. Dokter yang sudah ada tanpa clinic_id: 30 dokter
4. Update 30 dokter dengan clinic_id
5. Tambahkan 50 dokter baru dengan clinic_id

**Hasil:**
- 50 dokter baru ditambahkan
- 30 dokter diperbarui dengan klinik
- 40 dokter yang sudah punya klinik diabaikan

### Skenario 3: Reset & Sinkronisasi
**Kondisi Awal:** Database ada 100 dokter dengan berbagai kondisi

**Proses:**
1. Hapus 100 dokter lama
2. Ambil data dari API kunjungan
3. Temukan 150 dokter unik dengan 5 klinik
4. Tambahkan 150 dokter baru dengan clinic_id

**Hasil:**
- 100 dokter lama dihapus
- 150 dokter baru ditambahkan (termasuk yang sudah ada sebelumnya)
- Semua dokter memiliki data klinik yang fresh dari API

---

## Keuntungan

1. **Otomatisasi Lengkap**
   - Tidak perlu input manual untuk data klinik
   - Data selalu sinkron dengan API kunjungan

2. **Integritas Data**
   - Setiap dokter terhubung dengan klinik yang sesuai
   - Klinik baru dibuat otomatis jika belum ada

3. **Fleksibilitas**
   - Sinkronisasi biasa: hanya tambah data baru
   - Reset-sync: mulai dari awal dengan data terbaru

4. **Statistik yang Akurat**
   - Laporan dokter per klinik lebih akurat
   - Filter dan pencarian berdasarkan klinik lebih efektif

---

## Catatan Penting

1. **Klinik Utama**: Jika dokter praktek di beberapa klinik, hanya klinik pertama yang ditemukan yang disimpan sebagai `clinic_id`

2. **Data Minimal Klinik**: Klinik yang dibuat otomatis memiliki data minimal (address, city, phone = '-') karena API kunjungan tidak menyediakan detail lengkap

3. **Performa**: Proses sinkronisasi mengambil data dari 10 halaman terakhir (10,000 records) untuk efisiensi

4. **Error Handling**: Jika terjadi error pada satu dokter/klinik, proses tetap dilanjutkan untuk data lainnya

---

## File yang Dimodifikasi

1. `app/doctors/page.js`
   - Menghapus duplikasi variabel `doctorStats`

2. `app/api/doctors/sync/route.js`
   - Menambahkan ekstraksi data klinik dari API kunjungan
   - Menambahkan logika pembuatan/pencarian klinik
   - Menambahkan asosiasi dokter dengan klinik

3. `app/api/doctors/reset-sync/route.js`
   - Menambahkan ekstraksi data klinik dari API kunjungan
   - Menambahkan logika pembuatan/pencarian klinik
   - Menambahkan asosiasi dokter dengan klinik

---

**Tanggal Implementasi:** 30 Oktober 2025  
**Status:** ✅ Selesai & Tested  
**Developer:** AI Assistant

