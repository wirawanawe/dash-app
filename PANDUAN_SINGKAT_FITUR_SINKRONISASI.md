# 📋 Panduan Singkat - Fitur Sinkronisasi Data

## ✅ Fitur 1: Kolom Kode Faskes di Tabel Kunjungan

### Sebelum
```
| Pasien | Dokter | Klinik/Poli | Diagnosa | Status |
```

### Sesudah
```
| Pasien | Dokter | Klinik/Poli | Kode Faskes | Diagnosa | Status |
```

### Tampilan Kolom Kode Faskes
```
┌─────────────────────┐
│  FKTP001           │ ← Kode (bold, biru)
│  Klinik PHC Jakarta│ ← Nama Faskes (kecil, abu)
└─────────────────────┘
```

---

## ✅ Fitur 2: Tombol Sinkronisasi di Halaman Dokter

### Lokasi Tombol
Di bagian header halaman Dokter, setelah tombol "Refresh Data":

```
[ Refresh Data ] [ 🌥 Sinkronisasi dari API ] [ + Tambah Dokter ]
                   ↑ Tombol baru (hijau)
```

### Cara Menggunakan
1. Buka halaman **Dokter** (`/doctors`)
2. Klik tombol **"Sinkronisasi dari API"** (warna hijau dengan icon cloud ☁️)
3. Akan muncul konfirmasi:
   ```
   Apakah Anda yakin ingin melakukan sinkronisasi data dokter 
   dari API eksternal? Proses ini mungkin memakan waktu beberapa menit.
   ```
4. Klik **OK** untuk melanjutkan
5. Loading akan tampil: "Melakukan sinkronisasi data dokter dari API eksternal..."
6. Setelah selesai, akan muncul notifikasi:
   ```
   ✅ Sinkronisasi selesai: 15 dokter baru ditambahkan, 5 dokter sudah ada
   ```

### Yang Terjadi di Background
```
API Eksternal                    Database Lokal
─────────────                    ──────────────
📡 Kunjungan → Ekstrak Dokter → 💾 Tabel doctors
   (10k data)   (unik)             (15 baru)
                                   (5 skip duplikat)
```

---

## ✅ Fitur 3: Tombol Sinkronisasi di Halaman Klinik

### Lokasi Tombol
Di bagian header halaman Klinik:

```
[ Refresh Data ] [ 🌥 Sinkronisasi dari API ] [ + Tambah Klinik ]
                   ↑ Tombol baru (hijau)
```

### Cara Menggunakan
1. Buka halaman **Klinik** (`/clinics`)
2. Klik tombol **"Sinkronisasi dari API"** (warna hijau dengan icon cloud ☁️)
3. Konfirmasi muncul:
   ```
   Apakah Anda yakin ingin melakukan sinkronisasi data Faskes dan Poli 
   dari API eksternal? Proses ini mungkin memakan waktu beberapa menit.
   ```
4. Klik **OK**
5. Tunggu proses selesai
6. Notifikasi sukses:
   ```
   ✅ Sinkronisasi selesai: 8 Faskes dan 25 Poli baru ditambahkan
   ```

### Yang Terjadi di Background
```
API Eksternal                    Database Lokal
─────────────                    ──────────────
📡 Kunjungan → ┌→ Ekstrak Faskes → 💾 Tabel clinics (8 baru)
   (10k data)  │
               └→ Ekstrak Poli → 💾 Tabel polyclinics (25 baru)
```

### Struktur Data Klinik/Faskes

**Tabel Clinics (Faskes):**
```
┌───────────────────────────────────────┐
│ Klinik Pratama PHC Jakarta           │
│ Kode: FKTP001                        │
│ Poliklinik: Poli Umum, Poli Gigi,   │
│             Poli KIA                 │
└───────────────────────────────────────┘
```

**Tabel Polyclinics (Poli):**
```
┌─────────────────────────────────────┐
│ Nama: Poli Umum                    │
│ Kode: FKTP001 (referensi Faskes)  │
│ Deskripsi: Poliklinik di Klinik... │
└─────────────────────────────────────┘
```

---

## 🔄 Sumber Data

Semua data diambil dari API Eksternal:
```
🌐 https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan
```

### Data yang Diekstrak

1. **Dokter** → Dari field: `visit.Dokter`
   - Contoh: "Dr. John Doe, Sp.PD"

2. **Faskes** → Dari field: `visit.Fasilitas_Kesehatan[0]`
   - Kode: `Fasilitas_Kesehatan[0].Kode`
   - Nama: `Fasilitas_Kesehatan[0].Nama_Faskes`

3. **Poli** → Dari field: `visit.Klinik`
   - Contoh: "Poli Umum", "Poli Gigi"

---

## ⚙️ Fitur Teknis

### ✅ Duplicate Prevention
Sistem otomatis mengecek dan melewati data yang sudah ada:
```
Dokter baru   → SIMPAN ✅
Dokter sudah ada → SKIP ⏭️
```

### ✅ Retry Mechanism
Jika koneksi gagal, sistem retry otomatis:
```
Percobaan 1 → ❌ Gagal
Tunggu 1 detik...
Percobaan 2 → ❌ Gagal
Tunggu 2 detik...
Percobaan 3 → ✅ Berhasil
```

### ✅ Parallel Processing
Data diambil secara paralel untuk kecepatan:
```
Page 1 ──┐
Page 2 ──┼→ Parallel Fetch → Combine → Process
Page 3 ──┘
```

### ✅ Loading States
UI menampilkan status real-time:
```
Idle:      [ 🌥 Sinkronisasi dari API ]
Loading:   [ 💫 Sinkronisasi... ] (disabled, pulse animation)
Success:   Toast: "✅ 15 dokter baru ditambahkan..."
Error:     Toast: "❌ Gagal melakukan sinkronisasi"
```

---

## 📊 Statistik Sinkronisasi

Setelah sinkronisasi selesai, Anda akan melihat:

### Contoh Response Dokter
```json
{
  "success": true,
  "message": "Sinkronisasi selesai: 15 dokter baru ditambahkan, 5 dokter sudah ada",
  "stats": {
    "total": 20,    ← Total dokter unik ditemukan
    "added": 15,    ← Dokter baru yang ditambahkan
    "skipped": 5    ← Dokter yang sudah ada (di-skip)
  }
}
```

### Contoh Response Klinik
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

---

## ⚠️ Catatan Penting

### Waktu Proses
- Sinkronisasi Dokter: ~2-3 menit
- Sinkronisasi Klinik: ~3-5 menit (lebih lama karena 2 tabel)
- Tergantung jumlah data dan koneksi internet

### Rekomendasi Penggunaan
- ✅ Jalankan saat pertama kali setup
- ✅ Jalankan secara berkala (1x seminggu)
- ✅ Jalankan di luar jam sibuk
- ⚠️ Jangan refresh halaman saat proses berlangsung

### Data yang Perlu Dilengkapi Manual
Setelah sinkronisasi Dokter, lengkapi data berikut secara manual:
- ✏️ Spesialisasi
- ✏️ Nomor SIP
- ✏️ Email
- ✏️ Nomor Telepon
- ✏️ Alamat

---

## 🆘 Troubleshooting

### Problem: Tombol disabled terus
**Penyebab:** Proses masih berjalan
**Solusi:** Tunggu hingga selesai atau refresh halaman

### Problem: Error "Gagal melakukan sinkronisasi"
**Penyebab:** Koneksi API gagal
**Solusi:** 
1. Cek koneksi internet
2. Coba lagi beberapa saat
3. Cek console browser untuk error detail

### Problem: Data tidak muncul setelah sinkronisasi
**Penyebab:** Semua data sudah ada (di-skip)
**Solusi:** Normal, berarti tidak ada data baru dari API

### Problem: Proses terlalu lama
**Penyebab:** Data sangat banyak atau koneksi lambat
**Solusi:** 
1. Tunggu hingga selesai
2. Pastikan koneksi internet stabil
3. Jangan tutup tab browser

---

## 📞 Bantuan Teknis

Jika mengalami masalah:
1. Cek console browser (F12) untuk error message
2. Cek log server untuk detail error
3. Pastikan API eksternal dapat diakses
4. Backup database sebelum troubleshooting

---

**Selamat menggunakan fitur sinkronisasi! 🎉**

