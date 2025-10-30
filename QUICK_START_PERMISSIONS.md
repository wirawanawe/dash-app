# Quick Start - Sistem Permission User

## 🎯 Ringkasan Perubahan

✅ **Dihapus:**
- Halaman `/role-info` 
- Halaman `/role-management`

✅ **Ditambahkan:**
- Sistem permission berbasis menu per user
- Modal "Kelola Akses Menu" di halaman Users
- Tabel database `user_permissions`
- API untuk manajemen permission

## 🚀 Setup Cepat (3 Langkah)

### Langkah 1: Jalankan Migrasi Database

**Via MySQL CLI:**
```bash
mysql -u root -p phc_dashboard < init-scripts/15-create-user-permissions.sql
```

**Via Docker:**
```bash
docker exec -i dash-app-mysql-1 mysql -uroot -proot phc_dashboard < init-scripts/15-create-user-permissions.sql
```

### Langkah 2: Set Default Permission untuk User Existing

```bash
# Set environment variables (sesuaikan dengan konfigurasi Anda)
export DB_HOST=localhost
export DB_USER=root
export DB_PASSWORD=root
export DB_NAME=phc_dashboard

# Jalankan script migrasi
node scripts/migrate-default-permissions.cjs
```

Script ini akan:
- Set permission default berdasarkan role user
- Skip user yang sudah punya permission
- Tampilkan summary hasil migrasi

### Langkah 3: Restart Aplikasi

```bash
npm run dev
```

## 💡 Cara Menggunakan

### Untuk Admin/Superadmin:

1. **Buka halaman Users** (`/users`)

2. **Klik tombol Lock (🔒)** pada user yang ingin dikelola

3. **Centang menu yang diinginkan:**
   - ✅ = User bisa akses menu
   - ☐ = User tidak bisa akses menu

4. **Klik "Simpan Permission"**

### Untuk User Biasa:

1. **Login ke aplikasi**

2. **Sidebar akan menampilkan** hanya menu yang telah dicentang admin

3. **Menu yang tidak dicentang** tidak akan muncul di sidebar

## 📋 Daftar Menu yang Tersedia

| Menu Key | Label | Deskripsi |
|----------|-------|-----------|
| `dashboard` | Dashboard | Halaman utama dengan statistik |
| `visits` | Kunjungan | Kelola data kunjungan pasien |
| `examinations` | Pemeriksaan | Data pemeriksaan medis |
| `chat` | Chat Konsultasi | Fitur chat dengan dokter |
| `patients` | Pasien | Kelola data pasien |
| `doctors` | Dokter | Kelola data dokter |
| `clinics` | Klinik | Kelola data klinik |
| `medicine` | Obat | Kelola data obat |
| `mobile` | Mobile App | Kelola konten mobile app |
| `users` | Pengguna | Kelola pengguna dan hak akses |
| `settings` | Settings | Pengaturan sistem |
| `laboratory` | Laboratorium | Hasil dan data lab |

## 🔍 Default Permission by Role

### Superadmin
✅ Semua menu (12 menu)

### Admin
✅ 10 menu: dashboard, visits, patients, doctors, clinics, medicine, mobile, users, settings, laboratory

### Doctor
✅ 5 menu: dashboard, visits, examinations, chat, laboratory

### Staff
✅ 3 menu: dashboard, visits, patients

## ✅ Testing

### Test 1: Kelola Permission
1. Login sebagai admin
2. Buka `/users`
3. Klik tombol Lock pada user
4. Centang/uncentang beberapa menu
5. Simpan
6. Refresh halaman

### Test 2: Lihat Hasil di Sidebar
1. Login sebagai user yang baru diatur permissionnya
2. Check sidebar - hanya menu yang dicentang yang muncul
3. Coba akses URL menu yang tidak dicentang (harus ditolak/redirect)

### Test 3: Database Check
```sql
-- Lihat permission user
SELECT u.name, up.menu_key, up.has_access
FROM users u
LEFT JOIN user_permissions up ON u.id = up.user_id
WHERE u.id = 1;
```

## 🆘 Troubleshooting

### ❌ Error: Table 'user_permissions' doesn't exist
**Solusi:** Jalankan script migrasi database (Langkah 1)

### ❌ Semua menu muncul padahal sudah set permission
**Solusi:** 
1. Check browser console untuk error
2. Pastikan API `/api/auth/permissions` return data
3. Logout dan login ulang
4. Clear browser cache

### ❌ Modal permission tidak muncul
**Solusi:**
1. Check console browser untuk error
2. Pastikan file `UserPermissionsModal.jsx` ada
3. Pastikan import sudah benar di `page.js`

### ❌ Permission tidak tersimpan
**Solusi:**
1. Check server console untuk error
2. Pastikan API `/api/users/[id]/permissions` berjalan
3. Check foreign key constraint di database

## 📚 Dokumentasi Lengkap

Untuk dokumentasi detail, lihat:
- `USER_PERMISSIONS_SYSTEM.md` - Dokumentasi lengkap sistem
- `scripts/README-PERMISSIONS.md` - Dokumentasi script dan SQL manual

## 🎉 Selesai!

Sistem permission berbasis menu sudah siap digunakan. User sekarang bisa diberikan akses yang lebih spesifik sesuai kebutuhan tanpa terbatas oleh role.

**Happy Coding! 🚀**

