# URL API untuk Postman - Cek Data Tanggal 19-11-2025

## Base URL
```
https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan
```

## URL untuk Postman

### 1. Single Date (Tanggal Tunggal)
```
GET https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan?limit=100&page=1&date=2025-11-19
```

### 2. Date Range (Range Tanggal)
```
GET https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan?limit=100&page=1&start_date=2025-11-19&end_date=2025-11-19
```

### 3. Dengan Limit Lebih Besar
```
GET https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan?limit=1000&page=1&date=2025-11-19
```

### 4. Tanpa Filter Tanggal (Cek Data Terbaru)
```
GET https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan?limit=100&page=1
```

## Cara Menggunakan di Postman

1. **Buka Postman**
2. **Pilih Method**: `GET`
3. **Masukkan URL** (pilih salah satu di atas)
4. **Headers** (opsional):
   ```
   Content-Type: application/json
   ```
5. **Klik Send**

## Catatan

- Format tanggal: `YYYY-MM-DD` (contoh: `2025-11-19`)
- Parameter `limit`: jumlah record per halaman (disarankan 100-200 untuk menghindari timeout)
- Parameter `page`: nomor halaman (mulai dari 1)
- Jika API tidak menghormati parameter `date`, coba gunakan URL tanpa filter tanggal dan cek manual di response

## Expected Response Format

Response biasanya berupa array atau object dengan struktur:
```json
{
  "data": [
    {
      "ID": "...",
      "Tgl_Kunjungan": "2025-11-19 08:00:00",
      "Pasien": [...],
      ...
    }
  ]
}
```

atau langsung array:
```json
[
  {
    "ID": "...",
    "Tgl_Kunjungan": "2025-11-19 08:00:00",
    ...
  }
]
```

