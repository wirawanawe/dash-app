# Fitur Detail Pasien

## Overview

Fitur detail pasien telah dibuat untuk memberikan tampilan informasi pasien yang komprehensif, mirip dengan fitur detail kunjungan. Fitur ini mencakup modal detail dan halaman detail yang telah diperbarui.

## Fitur yang Ditambahkan

### 1. Modal Detail Pasien (`PatientDetailModal.jsx`)

Modal detail pasien yang dapat diakses dari tabel daftar pasien dengan fitur:

**Informasi yang Ditampilkan:**

- **Informasi Pribadi**: No. RM, Nama, NIK, Jenis Kelamin, Golongan Darah
- **Informasi Kelahiran**: Tanggal Lahir, Umur (otomatis dihitung), Tempat Lahir, Agama
- **Informasi Kontak**: Telepon, Email, Kontak Darurat, Status Pernikahan
- **Alamat**: Alamat Lengkap, Kota, Provinsi, Kode Pos
- **Informasi Kepegawaian**: NIP, Nama Karyawan, Jabatan, Departemen (jika ada)
- **Informasi Asuransi**: Jenis, Nomor, Status, Masa Berlaku
- **Informasi Medis**: Alergi, Riwayat Penyakit, Obat yang Dikonsumsi, Catatan Khusus
- **Informasi Registrasi**: Tanggal Registrasi, Terakhir Diupdate, Status

**Fitur Modal:**

- Design responsif dengan grid layout
- Color-coded sections untuk kemudahan identifikasi
- Tombol aksi: Edit Pasien, Lihat Riwayat Kunjungan
- Format tanggal Indonesia
- Kalkulasi umur otomatis
- Penanganan data kosong dengan placeholder "-"

### 2. Tombol Detail di Tabel Pasien

**Tombol Aksi yang Diperbarui:**

- 🛈 **Detail (Info Circle)**: Membuka modal detail pasien
- 👁 **Lihat**: Mengarah ke halaman detail pasien
- ✏️ **Edit**: Mengarah ke halaman edit pasien
- 🗑️ **Hapus**: Menghapus data pasien

### 3. Halaman Detail Pasien yang Diperbarui

Halaman detail pasien (`/patients/[id]/page.js`) telah diperbarui dengan:

- Layout yang sama dengan modal detail
- Navigasi breadcrumb (tombol kembali)
- Section yang lebih terorganisir dengan warna dan icon
- Informasi yang lebih komprehensif

## Struktur File

```
app/patients/
├── components/
│   ├── PatientDetailModal.jsx     # Modal detail pasien (BARU)
│   └── PatientTable.jsx           # Tabel dengan tombol detail (DIPERBARUI)
├── [id]/
│   └── page.js                    # Halaman detail (DIPERBARUI)
└── page.js                        # Halaman daftar pasien
```

## Cara Penggunaan

### Mengakses Modal Detail

1. Buka halaman "Daftar Pasien"
2. Klik tombol "ℹ️" (info circle) pada baris pasien yang diinginkan
3. Modal detail akan terbuka dengan informasi lengkap

### Mengakses Halaman Detail

1. Buka halaman "Daftar Pasien"
2. Klik tombol "👁" (eye) pada baris pasien yang diinginkan
3. Halaman detail pasien akan terbuka

## Fitur Teknis

### Responsive Design

- Modal dan halaman responsif untuk desktop dan mobile
- Grid layout yang menyesuaikan ukuran layar
- Scroll vertical untuk modal dengan konten panjang

### Data Handling

- Penanganan data kosong dengan graceful fallback
- Format tanggal Indonesia
- Kalkulasi umur otomatis dari tanggal lahir
- Status badge dengan color coding

### Performance

- Modal dimuat hanya saat diperlukan
- Data tidak di-fetch ulang saat modal dibuka (menggunakan data dari tabel)
- Optimasi rendering dengan conditional rendering

## Kustomisasi

### Menambah Field Baru

Untuk menambah field baru di modal detail:

1. **Tambah di Modal (`PatientDetailModal.jsx`)**:

```jsx
<div>
  <span className="font-medium text-gray-700">Field Baru:</span>
  <p className="text-gray-900">{patient.newField || "-"}</p>
</div>
```

2. **Tambah di Halaman Detail (`[id]/page.js`)**:

```jsx
<div>
  <span className="font-medium text-gray-700">Field Baru:</span>
  <p className="text-gray-900">{patient.newField || "-"}</p>
</div>
```

### Mengubah Warna Section

Setiap section memiliki warna yang berbeda:

- Biru (`bg-blue-50`): Informasi Pribadi
- Hijau (`bg-green-50`): Informasi Kelahiran
- Ungu (`bg-purple-50`): Informasi Kontak
- Orange (`bg-orange-50`): Alamat
- Indigo (`bg-indigo-50`): Informasi Kepegawaian
- Emerald (`bg-emerald-50`): Informasi Asuransi
- Merah (`bg-red-50`): Informasi Medis
- Abu-abu (`bg-gray-50`): Informasi Registrasi

## Integrasi dengan API

Modal dan halaman detail menggunakan data yang sama dari API `/api/patients/[id]`.

**Expected Data Structure:**

```json
{
  "id": "patient-id",
  "mrNumber": "RM001",
  "name": "Nama Pasien",
  "nik": "1234567890123456",
  "gender": "Laki-laki",
  "birthDate": "1990-01-01",
  "phone": "08123456789",
  "email": "patient@email.com",
  "address": "Alamat lengkap",
  "nip": "NIP123456" // opsional untuk karyawan
  // ... field lainnya
}
```

## Testing

### Manual Testing Checklist

- [ ] Modal terbuka dengan data yang benar
- [ ] Semua section menampilkan informasi yang tepat
- [ ] Tombol "Edit Pasien" berfungsi
- [ ] Tombol "Lihat Riwayat Kunjungan" berfungsi
- [ ] Modal dapat ditutup dengan tombol X
- [ ] Responsive design berfungsi di mobile
- [ ] Data kosong ditampilkan sebagai "-"
- [ ] Kalkulasi umur benar
- [ ] Format tanggal Indonesia benar

### Troubleshooting

**Modal tidak terbuka:**

- Cek console untuk error JavaScript
- Pastikan import `PatientDetailModal` benar
- Pastikan state `showDetailModal` ter-update

**Data tidak tampil:**

- Cek struktur data dari API
- Pastikan field name sesuai dengan yang digunakan di component
- Cek network tab untuk response API

**Styling tidak sesuai:**

- Pastikan Tailwind CSS class tersedia
- Cek responsive breakpoints
- Validasi color scheme

## Future Enhancements

1. **Print to PDF**: Fitur export detail pasien ke PDF
2. **QR Code**: Generate QR code untuk akses cepat data pasien
3. **Photo Upload**: Upload dan display foto pasien
4. **Medical Timeline**: Timeline riwayat medis pasien
5. **Family Tree**: Informasi keluarga dan keturunan
6. **Appointment History**: Riwayat janji temu dengan detail
