# 🔧 Perbaikan Fitur Anggota Keluarga

## ❌ Masalah yang Ditemukan

Error: `Unknown column 'blood_type' in 'field list'`

### Penyebab:
Tabel `patients` Anda belum memiliki kolom-kolom tambahan yang diperlukan untuk fitur anggota keluarga, seperti:
- `nip` (Nomor Induk Pegawai)
- `no_peserta` (Nomor Peserta)
- `nama_peserta` (Nama Peserta/Kepala Keluarga)
- `bagian` (Bagian/Departemen)
- `blood_type` (Golongan Darah)
- Dan kolom lainnya

## ✅ Solusi yang Telah Diterapkan

### 1. Query API yang Lebih Fleksibel
API endpoint `/api/patients/family` telah diupdate untuk:
- **Mencoba basic query dulu** (hanya kolom yang pasti ada)
- **Fallback ke extended query** jika kolom tambahan tersedia
- **Tidak error** jika kolom belum ada

### 2. Fitur Tetap Berfungsi
Meskipun kolom tambahan belum ada, fitur tetap dapat:
- ✅ Menampilkan anggota keluarga berdasarkan NIP
- ✅ Menampilkan informasi dasar (nama, NIK, gender, dll)
- ⚠️ Beberapa field akan kosong (blood_type, bagian, nama_peserta)

## 🚀 Cara Menambahkan Kolom Tambahan

### Opsi 1: Menggunakan Script SQL (Recommended)

Jalankan script SQL yang sudah disiapkan:

```bash
# Dari direktori root project
mysql -u [username] -p [database_name] < scripts/add-family-fields.sql
```

Contoh:
```bash
mysql -u root -p phc_dashboard < scripts/add-family-fields.sql
```

Script ini akan:
- ✅ Menambahkan semua kolom yang diperlukan
- ✅ Aman dijalankan berulang kali (hanya add jika belum ada)
- ✅ Membuat index pada kolom `nip` untuk performa

### Opsi 2: Manual via MySQL Client

```sql
USE phc_dashboard;

-- Tambahkan kolom satu per satu
ALTER TABLE patients ADD COLUMN nip VARCHAR(100);
ALTER TABLE patients ADD COLUMN no_peserta VARCHAR(100);
ALTER TABLE patients ADD COLUMN nama_peserta VARCHAR(255);
ALTER TABLE patients ADD COLUMN bagian VARCHAR(255);
ALTER TABLE patients ADD COLUMN blood_type VARCHAR(10);
ALTER TABLE patients ADD COLUMN religion VARCHAR(50);
ALTER TABLE patients ADD COLUMN marital_status VARCHAR(50);
ALTER TABLE patients ADD COLUMN occupation VARCHAR(100);
ALTER TABLE patients ADD COLUMN status VARCHAR(50) DEFAULT 'Aktif';
ALTER TABLE patients ADD COLUMN synced_at TIMESTAMP NULL;

-- Tambahkan index untuk performa
CREATE INDEX idx_nip ON patients(nip);
```

### Opsi 3: Menggunakan Init Script yang Sudah Ada

Jika Anda menggunakan Docker atau setup baru, jalankan script init yang sudah ada:

```bash
# Script ini ada di init-scripts/30-alter-patients-table-for-api.sql
mysql -u [username] -p [database_name] < init-scripts/30-alter-patients-table-for-api.sql
```

## 📊 Verifikasi

### 1. Cek Kolom yang Ada

```sql
DESCRIBE patients;
```

Atau:

```sql
SHOW COLUMNS FROM patients;
```

### 2. Gunakan API Debug

Akses endpoint debug untuk melihat status database:

```
GET /api/patients/debug-family?nip=5383001L
```

Atau melalui browser:
1. Buka detail pasien
2. Klik tab "Anggota Keluarga"
3. Jika tidak ada data, klik tombol "🔍 Ambil Debug Data"
4. Cek console browser (F12)

## 📝 Update Data NIP

Setelah kolom ditambahkan, Anda perlu mengisi data NIP untuk pasien yang sudah ada:

```sql
-- Contoh update NIP untuk pasien
UPDATE patients SET nip = '5383001L' WHERE name = 'R. SUYETY';
UPDATE patients SET nip = '5383001L' WHERE name = 'SISWO HADIPRAMONO';

-- Update nama peserta (kepala keluarga)
UPDATE patients SET nama_peserta = 'SISWO HADIPRAMONO' WHERE nip = '5383001L';

-- Update bagian
UPDATE patients SET bagian = 'Kantor UID Jawa Barat' WHERE nip = '5383001L';
```

## 🎯 Testing Setelah Fix

1. **Refresh halaman aplikasi**
2. **Buka detail pasien** dengan NIP `5383001L`
3. **Klik tab "Anggota Keluarga"**
4. **Verifikasi:**
   - ✅ Menampilkan 2 anggota keluarga
   - ✅ Menampilkan nama kepala keluarga
   - ✅ Card anggota keluarga ter-highlight dengan benar
   - ✅ Tombol "Lihat Detail" berfungsi

## 🔍 Troubleshooting

### Masalah: Tab "Anggota Keluarga" tidak muncul

**Solusi:**
- Pastikan pasien memiliki NIP
- Cek di console browser untuk error
- Verifikasi kolom `nip` sudah ada di tabel

### Masalah: Data keluarga tidak muncul

**Kemungkinan:**
1. **Field NIP kosong** - Update data NIP
2. **Tidak ada pasien lain dengan NIP sama** - Normal jika memang cuma 1 pasien
3. **Error query** - Cek log server

**Cek dengan query:**
```sql
SELECT id, name, nip FROM patients WHERE nip IS NOT NULL;
```

### Masalah: Error "Unknown column"

**Solusi:**
1. Jalankan script `add-family-fields.sql`
2. Restart aplikasi Next.js
3. Clear cache browser

## 📚 Dokumentasi Terkait

- `FAMILY_MEMBERS_FEATURE.md` - Dokumentasi lengkap fitur
- `init-scripts/30-alter-patients-table-for-api.sql` - Script ALTER TABLE original
- `scripts/add-family-fields.sql` - Script perbaikan (safe to run multiple times)

## ✨ Fitur Setelah Fix Lengkap

Setelah semua kolom ditambahkan dan data terisi:

1. **Tab Anggota Keluarga** muncul di detail pasien
2. **Nama Kepala Keluarga** ditampilkan di bagian atas
3. **Badge 👑** untuk kepala keluarga
4. **Card terpisah** untuk setiap anggota dengan info lengkap:
   - NIK & No. MR
   - Jenis kelamin
   - Tanggal lahir
   - Golongan darah
   - Telepon
   - Bagian/Departemen
5. **Navigasi antar anggota** dengan tombol "Lihat Detail"

---

**Status:** ✅ Fixed - API tetap berfungsi dengan atau tanpa kolom tambahan  
**Update:** October 30, 2025  
**Next Step:** Jalankan script SQL untuk menambahkan kolom

