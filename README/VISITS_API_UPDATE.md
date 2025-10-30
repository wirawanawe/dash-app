# Update API Kunjungan - Dokumentasi

## Ringkasan Perubahan

Aplikasi dashboard telah diupdate untuk mengambil data kunjungan dari API baru `https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan`. Perubahan ini mencakup update pada endpoint API, mapping field data, dan tampilan UI.

---

## Perubahan API Endpoint

### API Lama
```
http://api-klinik.doctorphcindonesia.web.id/transaksi/kunjungan
```

### API Baru
```
https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan
```

---

## Struktur Data API Baru

### Response Format
```json
{
  "statusCode": 200,
  "message": "OK",
  "total pasien": 9159,
  "limit": 10,
  "page": 1,
  "data": [
    {
      "ID": "297728dc-b40c-11f0-a35b-98fa9b2420a3",
      "No_Kunjungan": "2507010001",
      "Tgl_Kunjungan": "2025-07-01 07:10:12",
      "Pasien": [
        {
          "NIK": "3273203110500001",
          "Nama_Pasien": "CHARLES TOGATOROP",
          "Jenis_Kelamin": "Laki-laki",
          "Tgl_Lahir": "1950-01-01 00:00:00",
          "NIP": "5082033P",
          "No_Peserta": "7137200020119653",
          "Nama_Peserta": "CHARLES TOGATOROP",
          "Bagian": "Kantor UID Jawa Barat"
        }
      ],
      "Fasilitas_Kesehatan": [
        {
          "Kode": "KD",
          "Nama_Faskes": "Klinik Pratama Lisna Sehat"
        }
      ],
      "Klinik": "UMUM",
      "Dokter": "Cristian Pranata, dr.",
      "Diagnosa": "(I10 - Essential (primary) hypertension/hypertension ;  M17.0 - Primary gonarthrosis, bilateral)",
      "audittrail": {
        "created_at": "2025-10-28 21:41:17",
        "updated_at": null
      }
    }
  ]
}
```

---

## Mapping Field Data

### Data Kunjungan
| Field Aplikasi | Field API | Deskripsi |
|---------------|-----------|-----------|
| `id` | `No_Kunjungan` | Nomor kunjungan utama |
| `uniqueId` | `ID` | UUID unik kunjungan |
| `visitNumber` | `No_Kunjungan` | Nomor kunjungan |
| `visitDate` | `Tgl_Kunjungan` | Tanggal kunjungan |
| `clinic` | `Klinik` | Nama klinik/poli |
| `diagnosis` | `Diagnosa` | Diagnosa medis pasien |
| `status` | - | Default "Selesai" |
| `createdAt` | `audittrail.created_at` | Tanggal dibuat |
| `updatedAt` | `audittrail.updated_at` | Tanggal diupdate |

### Data Pasien
| Field Aplikasi | Field API | Deskripsi |
|---------------|-----------|-----------|
| `patient.id` | `Pasien[0].NIK` | NIK sebagai ID |
| `patient.name` | `Pasien[0].Nama_Pasien` | Nama pasien |
| `patient.nik` | `Pasien[0].NIK` | NIK pasien |
| `patient.mrNumber` | `Pasien[0].NIK` | Nomor rekam medis (menggunakan NIK) |
| `patient.nip` | `Pasien[0].NIP` | NIP pegawai |
| `patient.noPeserta` | `Pasien[0].No_Peserta` | Nomor peserta BPJS |
| `patient.namaPeserta` | `Pasien[0].Nama_Peserta` | Nama peserta BPJS |
| `patient.gender` | `Pasien[0].Jenis_Kelamin` | Jenis kelamin |
| `patient.birthDate` | `Pasien[0].Tgl_Lahir` | Tanggal lahir |
| `patient.department` | `Pasien[0].Bagian` | Bagian/departemen |

### Data Dokter
| Field Aplikasi | Field API | Deskripsi |
|---------------|-----------|-----------|
| `doctor.name` | `Dokter` | Nama dokter (string) |

### Data Fasilitas Kesehatan
| Field Aplikasi | Field API | Deskripsi |
|---------------|-----------|-----------|
| `facility.code` | `Fasilitas_Kesehatan[0].Kode` | Kode faskes |
| `facility.name` | `Fasilitas_Kesehatan[0].Nama_Faskes` | Nama faskes |

---

## Perubahan File

### 1. `/app/api/visits/route.js`
**Perubahan:**
- Update URL API endpoint
- Mapping field data baru sesuai struktur API
- Menambahkan field baru: `uniqueId`, `visitNumber`, `clinic`, `diagnosis`, `facility`
- Update field pasien: `nik`, `noPeserta`, `namaPeserta`, `gender`, `birthDate`, `department`

### 2. `/app/visits/page.js`
**Perubahan:**
- Update kolom tabel:
  - "Unit" → "Klinik/Poli"
  - "Keluhan" → "Diagnosa"
- Update tampilan data pasien untuk menampilkan NIK dan NIP
- Update key untuk row (`uniqueId` atau `id`)
- Update format tanggal dengan format yang lebih readable

### 3. `/app/visits/components/VisitDetailModal.jsx`
**Perubahan:**
- Update informasi pasien untuk menampilkan:
  - NIK
  - NIP
  - No. Peserta
  - Jenis Kelamin
  - Bagian/Departemen
- Replace section "Insurance & Company" dengan "Facility & Clinic"
- Simplifikasi section "Medical Records (SOAP)" menjadi "Diagnosa Medis"
- Menampilkan field `diagnosis` sebagai diagnosa utama

---

## Fitur yang Tetap Berfungsi

1. **Pencarian**
   - Search by keyword (nama pasien, dokter, diagnosa)
   - Search by date

2. **Filter**
   - Filter by date range (tanggal awal - tanggal akhir)
   - Filter by status
   - Filter by doctor

3. **Pagination**
   - Page navigation
   - Customizable items per page (10, 25, 50, 100)

4. **Sorting**
   - Sort by date (newest first - default)
   - Sort by ID
   - Sort by name

5. **Detail Modal**
   - View complete visit information
   - Patient details
   - Doctor information
   - Facility information
   - Medical diagnosis
   - Audit trail

---

## Total Data

Saat ini API memiliki **9,159 data kunjungan** yang dapat diakses melalui pagination.

---

## Testing

Untuk testing API endpoint:

```bash
# Test basic endpoint
curl "https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan?page=1&limit=10"

# Test dengan jq untuk format yang lebih readable
curl -s "https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan?page=1&limit=1" | jq '.'

# Test specific fields
curl -s "https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan?page=1&limit=5" | jq '.data[0] | {No_Kunjungan, Tgl_Kunjungan, Pasien: .Pasien[0].Nama_Pasien, Dokter, Klinik, Diagnosa}'
```

---

## Cara Penggunaan

1. **Akses Halaman Kunjungan**
   - Buka `/visits` di aplikasi dashboard
   - Data akan otomatis dimuat dari API baru

2. **Pencarian**
   - Masukkan keyword di search box (nama pasien, dokter, diagnosa)
   - Pilih tanggal untuk filter berdasarkan tanggal kunjungan
   - Klik tombol "Cari"

3. **Filter Lanjutan**
   - Klik tombol "Filter" untuk membuka panel filter
   - Pilih tanggal awal dan akhir
   - Pilih status (jika diperlukan)
   - Pilih dokter (jika diperlukan)
   - Klik "Terapkan Filter"

4. **Lihat Detail**
   - Klik icon mata (👁️) pada kolom "Aksi"
   - Modal detail akan muncul dengan informasi lengkap kunjungan

---

## Notes

- API tidak menyediakan informasi tentang rekam medis SOAP (Subject, Object, Assessment, Planning) secara detail, hanya diagnosa
- Physical examination data tidak tersedia dari API baru (ditampilkan default "0")
- Status kunjungan default "Selesai" karena API tidak menyediakan informasi status
- Referral, sick leave, dan health certificate information tidak tersedia dari API baru

---

## Future Improvements

1. Tambahkan support untuk filter berdasarkan klinik/poli
2. Tambahkan export data ke Excel/PDF
3. Tambahkan grafik statistik kunjungan
4. Integrate dengan detail rekam medis jika API menyediakan endpoint tambahan
5. Tambahkan print functionality untuk detail kunjungan

---

**Last Updated:** October 29, 2025
**API Version:** v1
**Total Records:** 9,159 kunjungan

