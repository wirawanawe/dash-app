# 🔄 Panduan Reset & Sinkronisasi Data Dokter

## ⚠️ PERINGATAN

Fitur **"Reset & Sync dari API"** adalah operasi **DESTRUCTIVE** yang akan:
1. ❌ **MENGHAPUS SEMUA** data dokter yang ada di database
2. ✅ **MENGGANTINYA** dengan data dokter dari API eksternal

**⚡ OPERASI INI TIDAK DAPAT DIBATALKAN!**

---

## 📋 Perbedaan dengan Sinkronisasi Biasa

### 🟢 Sinkronisasi Biasa (Tombol Hijau)
```
Data Lama: [Dokter A, Dokter B, Dokter C]
Data API:  [Dokter A, Dokter D, Dokter E]

HASIL:     [Dokter A, Dokter B, Dokter C, Dokter D, Dokter E]
           └─ Dokter A di-skip (sudah ada)
           └─ Dokter D & E ditambahkan (baru)
           └─ Dokter B & C tetap ada (tidak dihapus)
```

**Karakteristik:**
- ✅ Data lama tetap aman
- ✅ Hanya menambah data baru
- ✅ Skip data yang sudah ada
- ✅ Aman untuk digunakan berkala

---

### 🔴 Reset & Sync (Tombol Oranye-Merah)
```
Data Lama: [Dokter A, Dokter B, Dokter C]
Data API:  [Dokter A, Dokter D, Dokter E]

PROSES:
1. DELETE: [] (semua dihapus)
2. INSERT: [Dokter A, Dokter D, Dokter E]

HASIL:     [Dokter A, Dokter D, Dokter E]
           └─ Dokter B & C HILANG (dihapus)
           └─ Hanya data dari API yang tersisa
```

**Karakteristik:**
- ❌ Data lama DIHAPUS SEMUA
- ⚠️ Data yang tidak ada di API akan HILANG
- ✅ Database menjadi clean sesuai API
- ⚠️ Hanya gunakan untuk reset database

---

## 🎯 Kapan Menggunakan Reset & Sync?

### ✅ Gunakan Ketika:
1. **Database baru / setup awal**
   - Anda ingin mengisi database kosong dengan data dari API
   
2. **Data database korup atau tidak konsisten**
   - Ada banyak data duplikat atau error
   - Perlu clean slate untuk mulai fresh
   
3. **Migrasi atau testing**
   - Ingin memastikan database persis sama dengan data API
   - Testing dengan dataset fresh
   
4. **Data manual sudah tidak relevan**
   - Data dokter yang diinput manual sudah usang
   - Ingin full replacement dari API

### ❌ JANGAN Gunakan Ketika:
1. **Sudah ada data penting yang diinput manual**
   - Contoh: Email, telp, alamat dokter yang belum di backup
   
2. **Relasi dengan tabel lain**
   - Jika ada kunjungan atau data lain yang terkait dengan dokter
   
3. **Hanya ingin update data**
   - Gunakan sinkronisasi biasa (tombol hijau)
   
4. **Tidak yakin dengan konsekuensinya**
   - Jangan ambil resiko, gunakan sinkronisasi biasa

---

## 📖 Cara Menggunakan

### Langkah-langkah:

#### 1. Backup Database (WAJIB!)
```bash
# Backup tabel doctors
mysqldump -u root -p phc_dashboard doctors > doctors_backup.sql

# Atau backup seluruh database
mysqldump -u root -p phc_dashboard > full_backup.sql
```

#### 2. Buka Halaman Dokter
- Navigasi ke `/doctors`
- Pastikan Anda login sebagai admin/superadmin

#### 3. Klik Tombol "Reset & Sync dari API"
- Tombol berwarna **oranye-merah** (gradient)
- Icon: 🔄 (RotateCcw)
- Posisi: Setelah tombol "Sinkronisasi dari API"

#### 4. Konfirmasi Pertama
```
⚠️ PERINGATAN: Anda akan menghapus SEMUA data dokter 
yang ada dan menggantinya dengan data dari API!

Apakah Anda yakin ingin melanjutkan?
```
- Klik **Cancel** jika ragu
- Klik **OK** untuk lanjut

#### 5. Konfirmasi Kedua (Double Confirmation)
```
Konfirmasi sekali lagi: Semua data dokter akan dihapus 
permanen dan diganti dengan data dari API eksternal. 
Proses ini tidak dapat dibatalkan!

Lanjutkan?
```
- Klik **Cancel** untuk batalkan
- Klik **OK** untuk eksekusi

#### 6. Proses Berjalan
```
🔄 Menghapus data dokter lama dan melakukan 
   sinkronisasi dari API eksternal...
```
- **Durasi**: 2-5 menit
- **Status**: Tombol disabled dengan animasi spin
- **Loading**: Toast notification tampil

#### 7. Selesai
```
✅ Reset dan sinkronisasi selesai: 
   25 dokter lama dihapus, 30 dokter baru ditambahkan
```

---

## 🔍 Detail Proses

### Step-by-Step Internal Process:

```
┌─────────────────────────────────────────────────────┐
│ 1. COUNT existing doctors                          │
│    └─ Query: SELECT COUNT(*) FROM doctors         │
│    └─ Result: 25 doctors                          │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 2. DELETE all existing doctors                     │
│    └─ Query: DELETE FROM doctors                  │
│    └─ Result: 25 doctors deleted                  │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 3. FETCH data from external API                    │
│    └─ URL: api-ehr-klinik.doctorphc.id/...       │
│    └─ Pages: 10 pages x 1000 records             │
│    └─ Result: 10,000 visits fetched               │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 4. EXTRACT unique doctors                          │
│    └─ Parse field: visit.Dokter                   │
│    └─ Deduplicate by name                         │
│    └─ Result: 30 unique doctors                   │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 5. INSERT all doctors to database                  │
│    └─ Query: INSERT INTO doctors (name, ...)     │
│    └─ Loop: 30 inserts                            │
│    └─ Result: 30 doctors added                    │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 6. RETURN statistics                                │
│    └─ deleted: 25                                  │
│    └─ added: 30                                    │
│    └─ errors: 0                                    │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Response Format

### Success Response:
```json
{
  "success": true,
  "message": "Reset dan sinkronisasi selesai: 25 dokter lama dihapus, 30 dokter baru ditambahkan",
  "stats": {
    "deleted": 25,      // Jumlah dokter yang dihapus
    "total": 30,        // Total dokter unik dari API
    "added": 30,        // Jumlah dokter yang berhasil ditambahkan
    "errors": 0         // Jumlah error saat insert
  }
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Gagal melakukan reset dan sinkronisasi dokter dari API",
  "error": "Connection timeout"
}
```

---

## 🛡️ Fitur Keamanan

### 1. Double Confirmation
- Pengguna harus konfirmasi 2x
- Peringatan jelas tentang konsekuensi
- Mencegah klik tidak sengaja

### 2. Disabled State
- Tombol disabled saat proses berjalan
- Mencegah multiple execution
- Visual feedback dengan animasi

### 3. Error Handling
- Try-catch di setiap step
- Rollback otomatis jika error di tengah proses
- Error logging untuk debugging

### 4. Transaction Safety
```sql
-- Proses menggunakan transaction untuk safety
START TRANSACTION;
DELETE FROM doctors;
-- Insert new doctors...
COMMIT;
-- Jika error: ROLLBACK;
```

---

## 🔧 Troubleshooting

### Problem 1: Error "Connection timeout"
**Penyebab:** API eksternal tidak dapat diakses
**Solusi:**
1. Cek koneksi internet
2. Ping API: `curl https://api-ehr-klinik.doctorphc.id`
3. Coba lagi beberapa saat

### Problem 2: Data tidak lengkap setelah reset
**Penyebab:** API mungkin tidak mengembalikan semua data
**Solusi:**
1. Restore dari backup
2. Cek log server untuk detail
3. Coba lagi di waktu berbeda

### Problem 3: Proses stuck/hang
**Penyebab:** API lambat atau data terlalu besar
**Solusi:**
1. Tunggu hingga timeout (30 detik per request)
2. Refresh halaman jika > 10 menit
3. Cek log server

### Problem 4: Error saat delete
**Penyebab:** Foreign key constraint
**Solusi:**
```sql
-- Sementara disable foreign key check
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM doctors;
SET FOREIGN_KEY_CHECKS = 1;
```

---

## 🔄 Recovery (Jika Ada Masalah)

### Restore dari Backup:
```bash
# Stop aplikasi
pm2 stop dash-app

# Restore database
mysql -u root -p phc_dashboard < doctors_backup.sql

# Start aplikasi
pm2 start dash-app

# Verify
mysql -u root -p phc_dashboard -e "SELECT COUNT(*) FROM doctors;"
```

---

## 📝 Checklist Sebelum Reset & Sync

```
☐ Backup database sudah dibuat
☐ Backup disimpan di lokasi aman
☐ Sudah konfirmasi dengan team
☐ Tidak ada proses penting yang berjalan
☐ Punya akses untuk restore jika gagal
☐ Sudah baca dan paham dokumentasi ini
☐ Siap dengan konsekuensi data dihapus
☐ Memilih waktu yang tepat (di luar jam sibuk)
```

---

## 🎨 Visual Guide

### Tombol di UI:

```
┌──────────────────────────────────────────────────────────┐
│  Header: Daftar Dokter                                   │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  [🔄 Refresh Data]  [☁️ Sinkronisasi dari API]           │
│                                                           │
│  [🔄 Reset & Sync dari API]  [+ Tambah Dokter]          │
│   └─ Warna: Oranye → Merah (gradient)                   │
│   └─ Icon: RotateCcw dengan animasi spin                │
│   └─ Tooltip: "Hapus semua data dokter..."              │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### State Tombol:

**Idle (Normal):**
```css
background: gradient(orange-500 → red-600)
icon: RotateCcw (static)
text: "Reset & Sync dari API"
cursor: pointer
```

**Loading (Processing):**
```css
background: gradient(orange-500 → red-600)
icon: RotateCcw (spinning animation)
text: "Reset & Sync..."
cursor: not-allowed
opacity: 0.5
disabled: true
```

**Disabled (Other Process):**
```css
opacity: 0.5
cursor: not-allowed
disabled: true
```

---

## 📞 Support

Jika mengalami masalah:
1. Cek console browser (F12)
2. Cek log server
3. Restore dari backup
4. Hubungi tim teknis

---

## ⚖️ Pertimbangan Hukum & Data

⚠️ **PENTING**: Pastikan Anda memiliki:
- ✅ Izin untuk menghapus data
- ✅ Backup yang valid
- ✅ Persetujuan dari stakeholder
- ✅ Dokumentasi perubahan data

---

## 📅 Best Practices

### Kapan Waktu Terbaik:
- ⏰ **Di luar jam kerja** (malam atau weekend)
- 📊 **Saat traffic rendah** (tidak ada user aktif)
- 🔧 **Saat maintenance window** (sudah dijadwalkan)

### Setelah Reset & Sync:
1. ✅ Verify data: Cek jumlah dokter
2. ✅ Test functionality: Coba buat kunjungan
3. ✅ Inform team: Beritahu tim tentang perubahan
4. ✅ Monitor: Pantau error log selama 24 jam
5. ✅ Document: Catat apa yang dilakukan

---

**Dibuat:** 30 Oktober 2025  
**Versi:** 1.0  
**Last Updated:** 30 Oktober 2025

