# Sistem Permission User Berbasis Menu

## Deskripsi

Sistem ini menggantikan sistem role-based access dengan permission-based access yang lebih fleksibel. Setiap user dapat diberikan akses ke menu/fitur tertentu dengan cara mencentang (check) atau tidak mencentang (uncheck) menu yang diinginkan.

## Perubahan yang Dilakukan

### 1. Halaman yang Dihapus
- `/role-info` - Halaman informasi role
- `/role-management` - Halaman manajemen role

### 2. Database Migration
Tabel baru `user_permissions` dibuat untuk menyimpan permission setiap user.

**Struktur Tabel:**
```sql
CREATE TABLE IF NOT EXISTS user_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  menu_key VARCHAR(50) NOT NULL,
  has_access BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_menu (user_id, menu_key)
);
```

**Menu Keys yang Tersedia:**
- `dashboard` - Dashboard
- `visits` - Kunjungan
- `examinations` - Pemeriksaan
- `chat` - Chat Konsultasi
- `patients` - Pasien
- `doctors` - Dokter
- `clinics` - Klinik
- `medicine` - Obat
- `mobile` - Mobile App
- `users` - Pengguna
- `settings` - Settings
- `laboratory` - Laboratorium

### 3. API Endpoints Baru

#### GET `/api/users/[id]/permissions`
Mendapatkan permission untuk user tertentu.

**Response:**
```json
{
  "dashboard": true,
  "visits": true,
  "patients": false,
  ...
}
```

#### PUT `/api/users/[id]/permissions`
Update permission untuk user tertentu.

**Request Body:**
```json
{
  "dashboard": true,
  "visits": true,
  "patients": false,
  ...
}
```

#### GET `/api/auth/permissions`
Mendapatkan permission untuk current logged-in user.

### 4. Fitur Baru di Halaman Users

Di halaman `/users`, sekarang terdapat tombol **"Kelola Akses Menu"** (ikon gembok ungu) untuk setiap user. Tombol ini membuka modal yang menampilkan:

- Daftar semua menu/fitur yang tersedia
- Checkbox untuk setiap menu
- Tombol "Pilih Semua" dan "Hapus Semua"
- Deskripsi singkat untuk setiap menu

### 5. Sidebar yang Dynamic

Sidebar sekarang membaca permission dari database dan hanya menampilkan menu yang memiliki akses `true` untuk user yang sedang login.

**Backward Compatibility:** Jika user belum memiliki permission yang diset, maka semua menu akan ditampilkan (default behavior).

## Cara Menggunakan

### 1. Jalankan Database Migration

```bash
# Login ke MySQL
mysql -u root -p

# Jalankan script migration
mysql -u root -p phc_dashboard < init-scripts/15-create-user-permissions.sql
```

Atau jika menggunakan Docker:

```bash
docker exec -i dash-app-mysql-1 mysql -uroot -proot phc_dashboard < init-scripts/15-create-user-permissions.sql
```

### 2. Set Permission untuk User

1. Login sebagai admin atau superadmin
2. Buka halaman **Pengguna** (`/users`)
3. Klik tombol **Lock** (Gembok ungu) pada user yang ingin diatur permissionnya
4. Centang menu yang ingin diberikan akses
5. Klik **Simpan Permission**

### 3. Test Permission

1. Login sebagai user yang telah diatur permissionnya
2. Sidebar hanya akan menampilkan menu yang telah dicentang
3. User tidak dapat mengakses menu yang tidak dicentang

## Cara Kerja Sistem

### Flow Permission

1. **Admin/Superadmin** membuka halaman Users
2. Klik tombol **"Kelola Akses Menu"** untuk user tertentu
3. Modal terbuka menampilkan daftar menu dengan checkbox
4. Admin mencentang/uncentang menu yang diinginkan
5. Klik **"Simpan Permission"**
6. Data disimpan ke tabel `user_permissions`
7. Saat user login, sidebar akan membaca permission dari database
8. Hanya menu dengan `has_access = true` yang ditampilkan

### Security

- Permission disimpan per user di database
- Sidebar fetch permission via API yang sudah ter-authenticated
- Jika user mencoba akses menu yang tidak diizinkan, akan di-redirect atau ditolak

## Troubleshooting

### Menu Tidak Muncul di Sidebar

1. Pastikan tabel `user_permissions` sudah dibuat
2. Pastikan user sudah memiliki permission yang di-set
3. Check console browser untuk error
4. Pastikan API `/api/auth/permissions` berjalan dengan baik

### Permission Tidak Tersimpan

1. Check foreign key constraint (pastikan user_id valid)
2. Check console server untuk error SQL
3. Pastikan request body format JSON benar

### Semua Menu Muncul Padahal Belum Set Permission

Ini adalah behavior default (backward compatibility). Jika belum ada permission yang di-set untuk user, maka semua menu akan muncul.

## Migrasi dari Role-Based ke Permission-Based

Untuk user existing, Anda perlu set permission secara manual:

```sql
-- Contoh: Set default permission untuk semua user existing
INSERT INTO user_permissions (user_id, menu_key, has_access)
SELECT id, 'dashboard', 1 FROM users WHERE role = 'staff';

INSERT INTO user_permissions (user_id, menu_key, has_access)
SELECT id, 'visits', 1 FROM users WHERE role = 'staff';

-- Ulangi untuk menu lainnya sesuai kebutuhan
```

Atau gunakan interface web di halaman Users untuk set permission satu per satu.

## Notes

- Field `role` di tabel `users` masih tetap ada untuk backward compatibility
- Anda bisa menghapus role-based logic dari kode jika sudah tidak diperlukan
- Permission system ini lebih fleksibel karena tidak terikat dengan role tertentu
- Setiap user bisa memiliki kombinasi permission yang berbeda

