# Implementasi Sinkronisasi Data Faskes dari API Master

## Ringkasan Perubahan

Dokumen ini menjelaskan implementasi fitur sinkronisasi data faskes dari API master eksternal ke database lokal.

---

## 1. Sumber Data

### API Endpoint
```
https://api-ehr-klinik.doctorphc.id/master/faskes
```

### Struktur Response API
```json
{
  "data": [
    {
      "id": "4",
      "uuid": "b4382a39-b013-11f0-8dd3-9828a62dfebe",
      "kode_faskes": "UIT",
      "nama_faskes": "Klinik UIT",
      "client_id": "CLN-878064",
      "created_at": "2025-10-23 20:24:30",
      "updated_at": null
    }
  ]
}
```

---

## 2. Perubahan Database

### Tabel `clinics` - Kolom Baru

Ditambahkan 3 kolom baru untuk menyimpan data dari API:

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `external_id` | VARCHAR(100) | UUID dari API (field `uuid`) |
| `code` | VARCHAR(50) | Kode faskes (field `kode_faskes`) |
| `client_id` | VARCHAR(50) | ID klien (field `client_id`) |

### Script untuk Menambah Kolom

File: `scripts/add-faskes-columns.cjs`

Menjalankan:
```bash
node scripts/add-faskes-columns.cjs
```

---

## 3. Perubahan Kode

### A. API Route untuk Sinkronisasi

**File**: `app/api/clinics/sync/route.js`

**Endpoint**: `POST /api/clinics/sync`

**Cara Kerja**:
1. Mengambil data dari API master faskes
2. **MENGHAPUS** semua data clinics yang ada di database lokal
3. Memasukkan data baru dari API ke database
4. Mengembalikan statistik hasil sinkronisasi

**Response Example**:
```json
{
  "success": true,
  "message": "Sinkronisasi selesai: 3 faskes berhasil ditambahkan",
  "stats": {
    "total": 3,
    "inserted": 3,
    "errors": 0
  }
}
```

**Mapping Data**:
- `uuid` → `external_id`
- `kode_faskes` → `code`
- `nama_faskes` → `name`
- `client_id` → `client_id`

### B. API Route GET Clinics

**File**: `app/api/clinics/route.js`

**Perubahan**:
- Menambahkan field baru dalam SELECT query: `external_id`, `code`, `client_id`
- Menambahkan pencarian berdasarkan `code` dalam WHERE clause

### C. Halaman Clinics

**File**: `app/clinics/page.js`

**Perubahan**:

1. **Table View**: Menambahkan kolom "Kode Faskes"
   - Menampilkan kode faskes dalam format bold biru
   - Menampilkan client_id di bawahnya (jika ada)

2. **Grid View**: Menambahkan informasi kode faskes
   - Ditampilkan di bawah nama klinik

---

## 4. Cara Menggunakan

### Langkah-langkah Sinkronisasi:

1. **Buka halaman Clinics**
   ```
   http://localhost:3000/clinics
   ```

2. **Klik tombol "Sinkronisasi dari API"**
   - Tombol berwarna hijau dengan icon Cloud ☁️
   - Terletak di header halaman

3. **Konfirmasi**
   - Sistem akan menampilkan konfirmasi
   - Proses akan menghapus semua data clinics yang ada
   - Klik OK untuk melanjutkan

4. **Tunggu Proses Selesai**
   - Loading toast akan muncul
   - Notifikasi sukses akan ditampilkan setelah selesai

5. **Data Ditampilkan**
   - Tabel akan otomatis refresh
   - Data baru dari API akan ditampilkan

---

## 5. Tampilan Data

### Table View

| Klinik | Kode Faskes | Lokasi | Kontak | Status | Dibuat | Aksi |
|--------|-------------|--------|--------|--------|--------|------|
| Klinik UIT | **UIT**<br>Client: CLN-878064 | N/A | - | Aktif | 30 Okt 2025 | Edit / Hapus |

### Grid View

```
┌─────────────────────────────────────┐
│ 🏢 Klinik UIT                       │
│ Kode: UIT                          │
│ 🟢 Aktif                           │
│                                     │
│ 📍 N/A                              │
│ 📅 Dibuat: 30 Okt 2025             │
│                                     │
│ [Edit] [Hapus]                     │
└─────────────────────────────────────┘
```

---

## 6. Fitur Tambahan

### Retry Mechanism
- Maksimal 3 percobaan untuk request ke API
- Exponential backoff delay (2^n detik)
- Timeout 30 detik per request

### Error Handling
- Validasi format response API
- Penanganan error per record (tidak menghentikan proses)
- Logging error untuk debugging

### Pencarian
- Mendukung pencarian berdasarkan:
  - Nama klinik
  - Alamat
  - Kota
  - **Kode faskes** (baru)

---

## 7. Script Pendukung

### Test Script API
**File**: `scripts/test-faskes-api.cjs`

Untuk mengecek struktur response API:
```bash
node scripts/test-faskes-api.cjs
```

### Add Columns Script
**File**: `scripts/add-faskes-columns.cjs`

Untuk menambahkan kolom baru ke tabel clinics:
```bash
node scripts/add-faskes-columns.cjs
```

---

## 8. Keamanan dan Akses

- Hanya **SUPERADMIN** dan **ADMIN** yang dapat mengakses halaman clinics
- Hanya **SUPERADMIN** yang dapat melakukan sinkronisasi
- Hanya **SUPERADMIN** yang dapat menghapus data clinics

---

## 9. Catatan Penting

⚠️ **PERHATIAN**: 
- Proses sinkronisasi akan **MENGHAPUS SEMUA DATA** clinics yang ada di database lokal
- Pastikan untuk backup data jika diperlukan sebelum melakukan sinkronisasi
- Data yang dihapus tidak dapat dikembalikan

---

## 10. Testing

### Manual Testing
1. Buka http://localhost:3000/clinics
2. Login sebagai SUPERADMIN
3. Klik tombol "Sinkronisasi dari API"
4. Verifikasi:
   - Data lama terhapus
   - Data baru muncul dari API
   - Kolom "Kode Faskes" menampilkan data dengan benar
   - Pencarian berdasarkan kode faskes berfungsi

### Expected Results
- API mengembalikan data faskes
- Database ter-update dengan data terbaru
- UI menampilkan data dengan benar
- Notifikasi sukses muncul

---

## 11. Troubleshooting

### Masalah: API tidak dapat diakses
**Solusi**: 
- Pastikan koneksi internet stabil
- Cek apakah API endpoint masih aktif
- Lihat console log untuk detail error

### Masalah: Kolom tidak ditemukan
**Solusi**: 
- Jalankan script `add-faskes-columns.cjs` untuk menambah kolom
- Restart aplikasi

### Masalah: Data tidak muncul setelah sync
**Solusi**:
- Check console log untuk error
- Verifikasi struktur response API masih sama
- Klik tombol "Refresh Data" untuk reload

---

## 12. File yang Dimodifikasi

1. ✅ `app/api/clinics/sync/route.js` - Logic sinkronisasi baru
2. ✅ `app/api/clinics/route.js` - Query dengan field baru
3. ✅ `app/clinics/page.js` - UI dengan kolom baru
4. ✅ `scripts/add-faskes-columns.cjs` - Script migrasi database
5. ✅ `scripts/test-faskes-api.cjs` - Script testing API

---

## Kesimpulan

Implementasi sinkronisasi data faskes dari API master telah selesai dan siap digunakan. Fitur ini memungkinkan admin untuk dengan mudah mengupdate data klinik dari sumber data eksternal dengan satu klik tombol.

