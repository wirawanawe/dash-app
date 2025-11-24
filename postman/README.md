# Postman Collection - PHC Dashboard API

## Cara Import ke Postman

1. **Buka Postman**
2. **Klik Import** (tombol di kiri atas)
3. **Pilih File** → Pilih file `PHC_Dashboard_API.postman_collection.json`
4. **Klik Import**

## Request yang Tersedia

### 1. Get All Visits (Page 1)
- **URL**: `GET https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan?limit=100&page=1`
- **Deskripsi**: Mengambil semua data kunjungan tanpa filter tanggal
- **Gunakan untuk**: Melihat struktur data dan data terbaru

### 2. Get Visits by Date (19-11-2025)
- **URL**: `GET https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan?limit=100&page=1&date=2025-11-19`
- **Deskripsi**: Mengambil data kunjungan untuk tanggal 19 November 2025
- **Parameter**: 
  - `date`: Format YYYY-MM-DD (contoh: 2025-11-19)
- **Gunakan untuk**: Mencari data untuk tanggal tertentu

### 3. Get Visits by Date Range
- **URL**: `GET https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan?limit=100&page=1&start_date=2025-11-19&end_date=2025-11-19`
- **Deskripsi**: Mengambil data kunjungan untuk range tanggal
- **Parameter**:
  - `start_date`: Tanggal mulai (YYYY-MM-DD)
  - `end_date`: Tanggal akhir (YYYY-MM-DD)
- **Gunakan untuk**: Mencari data dalam range tanggal tertentu

### 4. Get Visits - Check Tgl_Kunjungan Field
- **URL**: `GET https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan?limit=10&page=1`
- **Deskripsi**: Mengambil 10 record pertama untuk melihat struktur data
- **Gunakan untuk**: Memeriksa format kolom `Tgl_Kunjungan` di response

### 5. Get Visits - Multiple Pages
- **URL**: `GET https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan?limit=200&page=1`
- **Deskripsi**: Mengambil data dengan limit lebih besar
- **Gunakan untuk**: Mencari data tanggal tertentu di beberapa halaman

## Cara Menggunakan

### Untuk Cek Data Tanggal 19-11-2025:

1. **Buka request**: "2. Get Visits by Date (19-11-2025)"
2. **Klik Send**
3. **Cek Response**:
   - Lihat apakah ada data yang dikembalikan
   - Periksa kolom `Tgl_Kunjungan` di setiap record
   - Pastikan format tanggal sesuai (2025-11-19 atau 2025-11-19 HH:MM:SS)

### Jika Tidak Ada Data di Page 1:

1. **Ubah parameter `page`** dari 1 ke 2, 3, dst
2. **Atau gunakan request**: "5. Get Visits - Multiple Pages"
3. **Cari manual** di response untuk record dengan `Tgl_Kunjungan` yang mengandung `2025-11-19`

## Format Response

Response biasanya berupa array atau object dengan struktur:

```json
[
  {
    "ID": "uuid-here",
    "No_Kunjungan": "2501020001",
    "Tgl_Kunjungan": "2025-11-19 08:00:00",
    "Pasien": [
      {
        "Nama_Pasien": "Nama Pasien",
        "NIK": "1234567890",
        ...
      }
    ],
    "Dokter": "Nama Dokter",
    "Klinik": "Nama Klinik",
    ...
  }
]
```

atau

```json
{
  "data": [
    {
      "ID": "...",
      "Tgl_Kunjungan": "2025-11-19 08:00:00",
      ...
    }
  ]
}
```

## Tips

1. **Jika API timeout**: Kurangi nilai `limit` (misalnya dari 200 ke 100 atau 50)
2. **Untuk mencari tanggal tertentu**: Gunakan request tanpa filter tanggal, lalu cari manual di response berdasarkan kolom `Tgl_Kunjungan`
3. **Format tanggal**: Pastikan menggunakan format `YYYY-MM-DD` (contoh: `2025-11-19`)
4. **Kolom utama**: Script sync menggunakan kolom `Tgl_Kunjungan` sebagai referensi utama untuk filter tanggal

## Troubleshooting

### API Mengembalikan 504 Gateway Timeout
- **Solusi**: Kurangi nilai `limit` atau tambahkan delay antar request

### Data Tidak Sesuai dengan Filter Tanggal
- **Kemungkinan**: API tidak menghormati parameter `date` di URL
- **Solusi**: Ambil data tanpa filter tanggal, lalu filter manual berdasarkan kolom `Tgl_Kunjungan` di response

### Tidak Ada Data untuk Tanggal Tertentu
- **Cek**: Apakah data untuk tanggal tersebut sudah ada di API
- **Coba**: Request tanpa filter tanggal dan cari manual di beberapa halaman pertama

