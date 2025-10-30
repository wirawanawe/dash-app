# Panduan Penggunaan Filter Tanggal

## 🎯 Quick Start

Filter tanggal di halaman Visits sekarang berfungsi dengan sempurna! Berikut cara menggunakannya:

---

## 1. 📅 Search by Date (Cari Berdasarkan Tanggal Tertentu)

### Langkah-langkah:
1. Buka halaman `/visits`
2. Lihat bagian "Pencarian & Filter"
3. Klik pada **input tanggal kedua** (di sebelah search box)
4. Pilih tanggal yang ingin dicari
5. Klik tombol **"Cari"**

### Contoh:
```
Tanggal: 2025-07-01
Hasil: Menampilkan semua kunjungan pada tanggal 1 Juli 2025
```

### Screenshot Flow:
```
┌─────────────────────────────────────────────────────────┐
│  Pencarian & Filter                                     │
├─────────────────────────────────────────────────────────┤
│  [Search box...]  [📅 Pilih Tanggal]  [🔍 Cari]       │
│                                                         │
│  > Pilih: 2025-07-01                                   │
│  > Klik: "Cari"                                        │
│  > Hasil: 25 kunjungan ditemukan pada 1 Juli 2025     │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 📊 Filter by Date Range (Filter Berdasarkan Rentang Tanggal)

### Langkah-langkah:
1. Buka halaman `/visits`
2. Klik tombol **"Filter"** (di sebelah tombol Cari)
3. Panel "Filter Lanjutan" akan muncul
4. Isi **Tanggal Awal** dan **Tanggal Akhir**
5. Klik **"Terapkan Filter"**

### Contoh:
```
Tanggal Awal: 2025-07-01
Tanggal Akhir: 2025-07-31
Hasil: Menampilkan semua kunjungan bulan Juli 2025
```

### Screenshot Flow:
```
┌─────────────────────────────────────────────────────────┐
│  Filter Lanjutan                                        │
├─────────────────────────────────────────────────────────┤
│  Tanggal Awal:  [2025-07-01]                           │
│  Tanggal Akhir: [2025-07-31]                           │
│  Status:        [Semua Status ▼]                       │
│  Dokter:        [Semua Dokter ▼]                       │
│                                                         │
│  [Reset Filter]  [Terapkan Filter]                     │
└─────────────────────────────────────────────────────────┘
```

---

## 3. 🔓 Open-ended Range (Filter Tanpa Batas)

### A. Dari Tanggal Tertentu (Sampai Sekarang)

**Langkah:**
1. Klik tombol "Filter"
2. Isi **Tanggal Awal** saja
3. Kosongkan **Tanggal Akhir**
4. Klik "Terapkan Filter"

**Contoh:**
```
Tanggal Awal: 2025-07-01
Tanggal Akhir: (kosong)
Hasil: Semua kunjungan dari 1 Juli 2025 sampai sekarang
```

### B. Sampai Tanggal Tertentu (Dari Awal)

**Langkah:**
1. Klik tombol "Filter"
2. Kosongkan **Tanggal Awal**
3. Isi **Tanggal Akhir** saja
4. Klik "Terapkan Filter"

**Contoh:**
```
Tanggal Awal: (kosong)
Tanggal Akhir: 2025-07-31
Hasil: Semua kunjungan dari awal sampai 31 Juli 2025
```

---

## 4. 🔄 Kombinasi Filter

Anda bisa kombinasikan filter tanggal dengan filter lainnya:

### Contoh 1: Tanggal + Status
```
Tanggal Awal: 2025-07-01
Tanggal Akhir: 2025-07-31
Status: Selesai
Hasil: Kunjungan bulan Juli yang sudah selesai
```

### Contoh 2: Tanggal + Dokter
```
Tanggal Awal: 2025-07-01
Tanggal Akhir: 2025-07-31
Dokter: Cristian Pranata, dr.
Hasil: Kunjungan Dr. Cristian bulan Juli
```

### Contoh 3: Lengkap (Tanggal + Status + Dokter)
```
Tanggal Awal: 2025-07-01
Tanggal Akhir: 2025-07-15
Status: Selesai
Dokter: Cristian Pranata, dr.
Hasil: Kunjungan Dr. Cristian yang selesai di paruh pertama Juli
```

---

## 5. 🗑️ Reset Filter

### Untuk menghapus semua filter:

**Cara 1: Reset Filter Lanjutan**
1. Buka panel "Filter Lanjutan"
2. Klik tombol **"Reset Filter"**
3. Semua filter tanggal range akan dikosongkan

**Cara 2: Reset Search**
1. Klik tombol **"Reset"** (di sebelah tombol "Cari")
2. Semua search dan filter akan dikosongkan

---

## 6. 📋 Active Filter Display

Ketika filter aktif, Anda akan melihat badge di bawah form filter:

```
Filter aktif:  [Dari: 2025-07-01 ×]  [Sampai: 2025-07-31 ×]
```

Klik **×** pada badge untuk menghapus filter tertentu.

---

## 🎯 Tips & Tricks

### ✅ DO's (Yang Harus Dilakukan)

1. **Gunakan Date Range untuk Laporan Bulanan**
   ```
   Tanggal Awal: 2025-07-01
   Tanggal Akhir: 2025-07-31
   → Perfect untuk laporan bulan Juli
   ```

2. **Kombinasikan dengan Search**
   ```
   Search: "CHARLES"
   Tanggal: 2025-07-01
   → Cari pasien bernama Charles pada tanggal tertentu
   ```

3. **Gunakan Open-ended untuk Monitoring**
   ```
   Tanggal Awal: 2025-07-01
   → Monitor kunjungan terbaru sejak Juli
   ```

### ❌ DON'Ts (Yang Perlu Dihindari)

1. **Jangan set Tanggal Akhir lebih awal dari Tanggal Awal**
   ```
   ❌ Tanggal Awal: 2025-07-31
      Tanggal Akhir: 2025-07-01
   → Tidak akan menampilkan hasil
   ```

2. **Jangan lupa klik "Terapkan Filter"**
   ```
   ❌ Mengisi tanggal tapi tidak klik "Terapkan Filter"
   → Filter tidak akan berfungsi
   ```

---

## 🔍 Troubleshooting

### Problem: Filter tidak menampilkan hasil

**Solution:**
1. ✅ Check apakah tanggal sudah benar
2. ✅ Pastikan Tanggal Awal ≤ Tanggal Akhir
3. ✅ Klik "Terapkan Filter" setelah mengisi
4. ✅ Coba reset dan filter ulang

### Problem: Hasil tidak sesuai yang diharapkan

**Solution:**
1. ✅ Check filter lain yang mungkin aktif (Status, Dokter)
2. ✅ Lihat badge "Filter aktif" untuk melihat filter yang sedang berjalan
3. ✅ Reset semua filter dan coba lagi

### Problem: Tidak bisa memilih tanggal

**Solution:**
1. ✅ Pastikan browser support input type="date"
2. ✅ Try refresh halaman
3. ✅ Clear browser cache

---

## 📊 Format Tanggal

Filter mendukung berbagai format tanggal dari API:

| Format | Contoh | Status |
|--------|--------|--------|
| YYYY-MM-DD | 2025-07-01 | ✅ Supported |
| YYYY-MM-DD HH:MM:SS | 2025-07-01 07:10:12 | ✅ Supported |
| ISO 8601 | 2025-07-01T07:10:12Z | ✅ Supported |

**Note:** Sistem otomatis menormalisasi semua format ke YYYY-MM-DD untuk perbandingan.

---

## 🎓 Advanced Usage

### Use Case 1: Laporan Harian
```javascript
// Pilih tanggal hari ini di date picker
// Sistem akan menampilkan semua kunjungan hari ini
```

### Use Case 2: Laporan Mingguan
```javascript
// Tanggal Awal: Senin minggu ini
// Tanggal Akhir: Minggu minggu ini
// Hasil: Semua kunjungan minggu ini
```

### Use Case 3: Laporan Kuartalan
```javascript
// Q1: 2025-01-01 s/d 2025-03-31
// Q2: 2025-04-01 s/d 2025-06-30
// Q3: 2025-07-01 s/d 2025-09-30
// Q4: 2025-10-01 s/d 2025-12-31
```

---

## 📞 Support

Jika mengalami masalah dengan filter tanggal:

1. Check dokumentasi ini terlebih dahulu
2. Lihat `README/DATE_FILTER_FIX.md` untuk detail teknis
3. Check browser console untuk error messages
4. Contact developer team

---

**Last Updated:** October 29, 2025  
**Version:** 1.0.1  
**Status:** ✅ Working Perfectly
