# 🚀 Quick Start - Sinkronisasi Data Faskes

## ✅ Status: READY TO USE

API sudah diverifikasi dan mengembalikan **3 faskes** yang siap disinkronisasi:

1. **Klinik UIT** (Kode: UIT)
2. **Klinik Tasik** (Kode: TSK)  
3. **Klinik Pratama Lisna Sehat** (Kode: KD)

---

## 🎯 Cara Menggunakan

### Langkah 1: Akses Halaman Clinics
Buka browser dan akses:
```
http://localhost:3000/clinics
```

### Langkah 2: Login
Login menggunakan akun **SUPERADMIN**

### Langkah 3: Sinkronisasi
1. Cari tombol **"Sinkronisasi dari API"** (warna hijau dengan icon ☁️)
2. Klik tombol tersebut
3. Konfirmasi dialog yang muncul
4. Tunggu proses selesai (beberapa detik)

### Langkah 4: Verifikasi
Data akan muncul di tabel dengan informasi:
- ✅ Nama Klinik
- ✅ **Kode Faskes** (kolom baru!)
- ✅ Client ID
- ✅ Status dan tanggal

---

## ⚠️ PENTING

### Data yang Akan Dihapus
Proses sinkronisasi akan:
- **MENGHAPUS** semua data clinics yang ada
- **MENAMBAHKAN** data baru dari API

### Backup
Jika diperlukan, backup data lama sebelum sinkronisasi:
```bash
mysqldump -u root -ppr1k1t1w phc_dashboard clinics > backup_clinics.sql
```

---

## 🔍 Verifikasi Hasil

Setelah sinkronisasi berhasil, tabel clinics akan menampilkan:

| Klinik | Kode Faskes | Lokasi | Status |
|--------|-------------|--------|--------|
| Klinik UIT | **UIT**<br>Client: CLN-878064 | N/A | 🟢 Aktif |
| Klinik Tasik | **TSK**<br>Client: CLN-536127 | N/A | 🟢 Aktif |
| Klinik Pratama Lisna Sehat | **KD**<br>Client: CLN-675893 | N/A | 🟢 Aktif |

---

## 🧪 Testing Koneksi API

Untuk memverifikasi koneksi API sebelum sinkronisasi:
```bash
node scripts/test-faskes-sync.cjs
```

Output yang diharapkan:
```
✅ API accessible - Found 3 faskes records
```

---

## 📋 Fitur Baru

### 1. Kolom Baru di Database
- `external_id` - UUID dari API
- `code` - Kode faskes
- `client_id` - ID klien

### 2. Tampilan Baru di UI
- Kolom "Kode Faskes" di table view
- Kode faskes ditampilkan di grid view
- Pencarian berdasarkan kode faskes

### 3. API Endpoint Baru
- `POST /api/clinics/sync` - Sinkronisasi data dari API master

---

## 🔧 Troubleshooting

### Server tidak running
```bash
npm run dev
```

### Database connection error
Restart Docker containers:
```bash
docker-compose restart mysql
```

Atau cek koneksi database:
```bash
node scripts/test-db-connection.js
```

### Kolom tidak ditemukan
Jalankan migrasi database:
```bash
node scripts/add-faskes-columns.cjs
```

---

## 📚 Dokumentasi Lengkap

Untuk informasi lebih detail, lihat:
- `FASKES_SYNC_IMPLEMENTATION.md` - Dokumentasi teknis lengkap
- `scripts/test-faskes-sync.cjs` - Script testing
- `scripts/add-faskes-columns.cjs` - Script migrasi database

---

## ✨ Summary

✅ Database schema sudah diupdate  
✅ API sync route sudah dibuat  
✅ UI sudah diupdate dengan kolom baru  
✅ Testing script sudah tersedia  
✅ API sudah diverifikasi (3 faskes ready)  

**Status: READY TO USE** 🎉

Silakan akses http://localhost:3000/clinics dan klik "Sinkronisasi dari API"!

