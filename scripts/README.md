# Script Pengambilan Data User

Script ini digunakan untuk mengambil data user dari database PHC Dashboard.

## Script yang Tersedia

### 1. `test-db-connection.js`
Script untuk menguji koneksi database dan melihat data user secara singkat.

**Cara menjalankan:**
```bash
node scripts/test-db-connection.js
```

**Output:**
- Status koneksi database
- Jumlah user di database
- Sample 5 user pertama
- Jumlah mobile users

### 2. `get-users-data.js`
Script untuk mengambil semua data user (dashboard dan mobile) dengan statistik lengkap.

**Cara menjalankan:**
```bash
node scripts/get-users-data.js
```

**Output:**
- Daftar lengkap dashboard users (admin, doctor, staff)
- Daftar lengkap mobile users
- Statistik user berdasarkan role
- File JSON dengan semua data

### 3. `get-users-filtered.js`
Script untuk mengambil data user dengan filter berdasarkan role, gender, dan clinic.

**Cara menjalankan:**
```bash
node scripts/get-users-filtered.js
```

**Output:**
- User berdasarkan role (Superadmin, Admin, Doctor, Staff)
- Mobile users berdasarkan gender (Male/Female)
- User berdasarkan clinic
- File JSON dengan data terfilter

### 4. `get-users-simple.js`
Script dengan opsi command line untuk mengambil data user dengan berbagai filter.

**Cara menjalankan:**
```bash
# Lihat bantuan
node scripts/get-users-simple.js --help

# Ambil semua user
node scripts/get-users-simple.js --type all

# Ambil hanya dashboard users
node scripts/get-users-simple.js --type dashboard

# Ambil hanya mobile users
node scripts/get-users-simple.js --type mobile

# Filter berdasarkan role
node scripts/get-users-simple.js --type dashboard --role ADMIN

# Filter berdasarkan status aktif
node scripts/get-users-simple.js --type all --active true

# Simpan ke file JSON
node scripts/get-users-simple.js --type all --save
```

## Struktur Data

### Dashboard Users
- **id**: ID unik user
- **name**: Nama lengkap user
- **email**: Email user
- **role**: Role user (SUPERADMIN, ADMIN, DOCTOR, STAFF)
- **clinic_id**: ID klinik (jika ada)
- **clinic_name**: Nama klinik (jika ada)
- **is_active**: Status aktif (1 = aktif, 0 = tidak aktif)
- **created_at**: Tanggal pembuatan akun
- **updated_at**: Tanggal terakhir update

### Mobile Users
- **id**: ID unik user
- **name**: Nama lengkap user
- **email**: Email user
- **phone**: Nomor telepon
- **date_of_birth**: Tanggal lahir
- **gender**: Gender (male, female, other)
- **height**: Tinggi badan (cm)
- **weight**: Berat badan (kg)
- **is_active**: Status aktif
- **created_at**: Tanggal pembuatan akun
- **updated_at**: Tanggal terakhir update

## File Output

Script akan menghasilkan file JSON dengan format:
- `users-data-YYYY-MM-DD.json` - Data lengkap semua user
- `users-filtered-YYYY-MM-DD.json` - Data user dengan filter

## Konfigurasi Database

Script menggunakan konfigurasi database berikut:
- **Host**: localhost
- **User**: root
- **Password**: pr1k1t1w
- **Database**: phc_dashboard
- **Port**: 3306

## Statistik yang Tersedia

### Dashboard Users
- Total dashboard users: 9
- Superadmin: 1
- Admin: 5
- Doctor: 2
- Staff: 1
- Active users: 9

### Mobile Users
- Total mobile users: 10
- Male users: 5
- Female users: 5
- Active users: 10

### Total
- Total semua user: 19
- Total active users: 19

## Contoh Penggunaan

### 1. Mengambil semua data user
```bash
node scripts/get-users-data.js
```

### 2. Mengambil data dengan filter
```bash
node scripts/get-users-filtered.js
```

### 3. Mengambil data berdasarkan role
```bash
node scripts/get-users-simple.js --type dashboard --role ADMIN
```

### 4. Mengambil data mobile users yang aktif
```bash
node scripts/get-users-simple.js --type mobile --active true --save
```

## Troubleshooting

### Error: Access denied for user 'root'@'localhost'
Pastikan password database benar. Default password adalah `pr1k1t1w`.

### Error: Database connection failed
1. Pastikan MySQL server berjalan
2. Pastikan database `phc_dashboard` ada
3. Pastikan user `root` memiliki akses ke database

### Error: Table doesn't exist
Pastikan semua tabel telah dibuat dengan menjalankan script SQL di folder `init-scripts/`.

## Dependencies

Script memerlukan package berikut:
- `mysql2` - Untuk koneksi ke database MySQL
- `fs` - Untuk menulis file JSON (built-in Node.js)

## Notes

- Script menggunakan ES modules (import/export)
- Data disimpan dalam format JSON untuk kemudahan analisis
- Semua script menggunakan kredensial database yang sama
- Output console memberikan informasi yang jelas dan terstruktur 