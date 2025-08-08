# PHC Office Admin Data Management

## Overview
Sistem manajemen data kantor PHC yang memungkinkan admin untuk mengelola informasi kontak dan alamat kantor pusat PHC.

## Fitur yang Diimplementasikan

### 1. Database Table
- **Table**: `phc_office_admin`
- **Fields**:
  - `id` (Primary Key, Auto Increment)
  - `office_name` (VARCHAR 255) - Nama kantor
  - `phone` (VARCHAR 20) - Nomor telepon
  - `email` (VARCHAR 255) - Email
  - `address` (TEXT) - Alamat lengkap
  - `city` (VARCHAR 100) - Kota
  - `postal_code` (VARCHAR 10) - Kode pos
  - `contact_person` (VARCHAR 100) - Kontak person
  - `is_active` (BOOLEAN) - Status aktif
  - `created_at` (TIMESTAMP) - Waktu dibuat
  - `updated_at` (TIMESTAMP) - Waktu diupdate

### 2. API Endpoints
- **GET** `/api/phc-office-admin` - Mengambil semua data kantor aktif
- **POST** `/api/phc-office-admin` - Membuat data kantor baru
- **PUT** `/api/phc-office-admin` - Mengupdate data kantor
- **DELETE** `/api/phc-office-admin?id={id}` - Menghapus data kantor (soft delete)

### 3. Web Interface
- **URL**: `/settings/phc-office-admin`
- **Fitur**:
  - Form input untuk data kantor
  - Validasi field required
  - Mode edit dan view
  - Tombol edit, hapus, dan simpan
  - Feedback message untuk setiap aksi
  - Responsive design

### 4. Menu Integration
- Ditambahkan menu "Data Kantor PHC" di halaman Settings
- Icon: Building2
- Path: `/settings/phc-office-admin`

## Cara Penggunaan

### 1. Akses Halaman
1. Login ke dashboard admin
2. Buka menu Settings
3. Klik "Data Kantor PHC"

### 2. Menambah Data Kantor
1. Jika belum ada data, form akan dalam mode "tambah"
2. Isi semua field yang diperlukan (bertanda *)
3. Klik "Simpan"

### 3. Mengedit Data Kantor
1. Data yang sudah ada akan ditampilkan dalam mode view
2. Klik tombol "Edit" untuk mengubah data
3. Modifikasi field yang diinginkan
4. Klik "Update" untuk menyimpan perubahan
5. Klik "Batal" untuk membatalkan perubahan

### 4. Menghapus Data Kantor
1. Klik tombol "Hapus" (merah)
2. Konfirmasi penghapusan
3. Data akan di-soft delete (is_active = FALSE)

## File yang Dibuat/Dimodifikasi

### Database
- `init-scripts/23-create-phc-office-admin.sql` - Script pembuatan tabel dan data default

### API
- `app/api/phc-office-admin/route.js` - API endpoints untuk CRUD operations

### Web Interface
- `app/settings/phc-office-admin/page.js` - Halaman manajemen data kantor PHC

### Menu Integration
- `app/settings/page.js` - Ditambahkan menu item untuk PHC Office Admin

## Data Default
Sistem akan membuat data default dengan informasi:
- **Nama Kantor**: Kantor Pusat PHC
- **Telepon**: +62-21-12345678
- **Email**: admin@phc.com
- **Alamat**: Jl. Sudirman No. 123, Jakarta Pusat
- **Kota**: Jakarta Pusat
- **Kode Pos**: 12190
- **Kontak Person**: Admin PHC

## Testing
Untuk testing API, gunakan file `test-phc-office-api.js`:
```bash
node test-phc-office-api.js
```

## Keamanan
- Semua input divalidasi di server side
- Menggunakan prepared statements untuk mencegah SQL injection
- Soft delete untuk mencegah kehilangan data
- Error handling yang komprehensif

## Dependencies
- Next.js 14
- MySQL 8.0
- Lucide React (untuk icons)
- Tailwind CSS (untuk styling)
