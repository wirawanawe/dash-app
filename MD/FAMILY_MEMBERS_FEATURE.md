# Fitur Anggota Keluarga Pasien

## 📋 Deskripsi

Fitur ini memungkinkan pengelompokan dan penampilan data pasien-pasien yang memiliki NIP (Nomor Induk Pegawai) yang sama. Pasien dengan NIP yang sama dianggap sebagai satu keluarga, dimana **Nama Peserta** adalah nama kepala keluarga atau pemilik NIP tersebut.

## 🎯 Tujuan

1. Mengidentifikasi dan mengelompokkan anggota keluarga berdasarkan NIP
2. Memudahkan melihat seluruh anggota keluarga dalam satu tampilan
3. Menampilkan informasi kepala keluarga (pemilik NIP) dengan jelas
4. Mempermudah navigasi antar anggota keluarga

## 🔧 Implementasi Teknis

### 1. API Endpoint

**File:** `/app/api/patients/family/route.js`

**Endpoint:** `GET /api/patients/family?nip={nip}`

**Response:**
```json
{
  "success": true,
  "nip": "123456789",
  "namaPeserta": "Nama Kepala Keluarga",
  "totalMembers": 4,
  "data": [
    {
      "id": "1",
      "name": "Nama Pasien",
      "nip": "123456789",
      "nik": "1234567890123456",
      "namaPeserta": "Nama Kepala Keluarga",
      "isMainParticipant": true,
      // ... data pasien lainnya
    }
  ]
}
```

**Fitur:**
- Query semua pasien dengan NIP yang sama
- Mengurutkan dengan kepala keluarga (nama sama dengan nama peserta) di urutan pertama
- Flag `isMainParticipant` untuk menandai kepala keluarga

### 2. Frontend - Patient Detail Modal

**File:** `/app/patients/components/PatientDetailModal.jsx`

**Fitur yang Ditambahkan:**

#### a. Tab Anggota Keluarga
- Tab baru "Anggota Keluarga" ditambahkan di detail pasien
- Hanya muncul jika pasien memiliki NIP
- Menampilkan semua anggota keluarga dengan NIP yang sama

#### b. Informasi Kepala Keluarga
- Section khusus menampilkan **Nama Peserta** sebagai kepala keluarga
- Badge 👑 untuk menandai kepala keluarga
- Highlight berbeda untuk kepala keluarga dan pasien saat ini

#### c. Card Anggota Keluarga
Setiap card menampilkan:
- Nama lengkap
- NIK dan No. MR
- Jenis kelamin
- Tanggal lahir
- Golongan darah
- Telepon
- Bagian/Departemen
- Tombol "Lihat Detail" untuk membuka detail anggota keluarga tersebut

#### d. Visual Indicators
- **Border Ungu + Badge 👑**: Kepala keluarga (pemilik NIP)
- **Border Biru + Badge 👤**: Pasien yang sedang dilihat
- **Border Abu-abu**: Anggota keluarga lainnya

### 3. Event Handler

**File:** `/app/patients/page.js`

**Custom Event:** `openPatientDetail`
- Menangani pembukaan detail pasien dari card anggota keluarga
- Memungkinkan navigasi antar anggota keluarga tanpa menutup modal

## 💡 Cara Penggunaan

### Untuk User

1. **Buka Detail Pasien**
   - Klik tombol "👁️ Detail" pada tabel pasien
   
2. **Lihat Anggota Keluarga**
   - Jika pasien memiliki NIP, tab "Anggota Keluarga" akan muncul
   - Klik tab tersebut untuk melihat semua anggota keluarga

3. **Identifikasi Kepala Keluarga**
   - Cari card dengan badge 👑 "Kepala Keluarga"
   - Atau lihat di bagian atas yang menampilkan "Nama Peserta"

4. **Navigasi Antar Anggota**
   - Klik tombol "Lihat Detail" pada card anggota keluarga
   - Modal akan refresh dengan detail anggota yang dipilih

### Informasi yang Ditampilkan

#### Di Tab Informasi Pasien:
- **NIP**: Nomor Induk Pegawai
- **Nama Peserta (Kepala Keluarga)**: Nama pemilik NIP dengan badge "👑 Pemilik NIP"
- **No. Peserta**: Nomor peserta asuransi/kepesertaan

#### Di Tab Anggota Keluarga:
- **Kepala Keluarga**: Ditampilkan di bagian atas
- **Daftar Anggota**: Grid card dengan semua anggota keluarga
- **Total Anggota**: Jumlah total anggota keluarga

## 📊 Struktur Database

### Tabel: `patients`

Field yang digunakan:
- `nip` - Nomor Induk Pegawai (untuk mengelompokkan keluarga)
- `nama_peserta` - Nama kepala keluarga (pemilik NIP)
- `no_peserta` - Nomor peserta
- `bagian` - Bagian/Departemen

Query untuk mendapatkan anggota keluarga:
```sql
SELECT * FROM patients 
WHERE nip = ? 
ORDER BY 
  CASE 
    WHEN name = nama_peserta THEN 0 
    ELSE 1 
  END,
  name ASC
```

## 🎨 UI/UX Design

### Color Scheme:
- **Kepala Keluarga**: Purple/Pink gradient (`border-purple-300`, `bg-purple-50`)
- **Pasien Saat Ini**: Blue/Cyan gradient (`border-blue-400`, `bg-blue-50`)
- **Anggota Lainnya**: Standard white (`border-gray-200`)

### Responsive Design:
- Grid 2 kolom di desktop (md:grid-cols-2)
- Grid 1 kolom di mobile
- Scrollable content area
- Touch-friendly button sizes

## 📝 Catatan Penting

1. **NIP Wajib**: Fitur ini hanya bekerja jika pasien memiliki NIP
2. **Nama Peserta**: Harus terisi untuk mengidentifikasi kepala keluarga
3. **Sinkronisasi Data**: Pastikan data NIP dan Nama Peserta tersinkronisasi dengan baik dari API eksternal
4. **Performance**: Query dioptimasi dengan index pada field `nip`

## 🔄 Update Future

Fitur yang bisa ditambahkan di masa depan:
- Export data keluarga ke PDF
- Grafik hubungan keluarga
- Filter berdasarkan status aktif/tidak aktif
- Riwayat kunjungan keseluruhan keluarga
- Notifikasi jika ada anggota keluarga baru

## 🐛 Troubleshooting

### Tab Anggota Keluarga tidak muncul
- Pastikan pasien memiliki NIP yang valid
- Cek di console browser untuk error API

### Tidak ada anggota keluarga yang muncul
- Pastikan ada pasien lain dengan NIP yang sama di database
- Cek response API: `/api/patients/family?nip={nip}`

### Error saat klik "Lihat Detail"
- Pastikan event listener sudah terpasang di page.js
- Cek console browser untuk error JavaScript

## 👨‍💻 Developer Notes

### Testing
1. Test dengan pasien yang memiliki NIP
2. Test dengan pasien tanpa NIP
3. Test navigasi antar anggota keluarga
4. Test dengan berbagai ukuran layar (responsive)

### Database Requirements
- Field `nip`, `nama_peserta`, dan `no_peserta` harus ada di tabel `patients`
- Index pada field `nip` untuk performa query yang optimal

---

**Tanggal Implementasi:** October 30, 2025  
**Developer:** AI Assistant  
**Status:** ✅ Completed

