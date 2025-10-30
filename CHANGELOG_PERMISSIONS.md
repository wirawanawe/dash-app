# Changelog - Sistem Permission User

## 📅 Date: 2025-10-30

## 🎯 Perubahan Utama

### ❌ Dihapus
1. **Halaman Role Info** (`/app/role-info/page.js`)
   - Halaman informasi tentang hierarki role
   - Tidak lagi diperlukan dengan sistem permission baru

2. **Halaman Role Management** (`/app/role-management/page.js`)
   - Halaman untuk mengelola role user
   - Digantikan dengan permission management di halaman Users

### ✅ Ditambahkan

#### 1. Database Schema
- **File:** `init-scripts/15-create-user-permissions.sql`
- **Tabel:** `user_permissions`
- **Columns:**
  - `id` (INT, PRIMARY KEY)
  - `user_id` (INT, FOREIGN KEY to users)
  - `menu_key` (VARCHAR(50))
  - `has_access` (BOOLEAN)
  - `created_at`, `updated_at` (TIMESTAMP)
- **Constraints:**
  - UNIQUE: (user_id, menu_key)
  - FOREIGN KEY: user_id → users(id) ON DELETE CASCADE

#### 2. API Endpoints

**a. `/api/users/[id]/permissions` (GET, PUT)**
- GET: Mendapatkan permission untuk user tertentu
- PUT: Update permission untuk user tertentu
- **File:** `app/api/users/[id]/permissions/route.js`

**b. `/api/auth/permissions` (GET)**
- GET: Mendapatkan permission untuk current logged-in user
- **File:** `app/api/auth/permissions/route.js`

#### 3. UI Components

**a. UserPermissionsModal**
- **File:** `app/users/components/UserPermissionsModal.jsx`
- **Features:**
  - Modal untuk kelola permission per user
  - Checklist untuk setiap menu/fitur
  - Tombol "Pilih Semua" / "Hapus Semua"
  - Visual icon dan deskripsi untuk setiap menu
  - Real-time counter permission yang aktif

**b. Updated Users Page**
- **File:** `app/users/page.js`
- **Changes:**
  - Tambah tombol "Kelola Akses Menu" (Lock icon)
  - Integrasi dengan UserPermissionsModal
  - Support untuk view mode table dan grid

#### 4. Updated Sidebar
- **File:** `components/Sidebar.jsx`
- **Changes:**
  - Fetch user permissions via API on mount
  - Filter menu berdasarkan permission
  - Hapus role-based filtering
  - Hapus menu "Role Management" dan "Role Info"
  - Dynamic menu display berdasarkan permission

#### 5. Scripts & Documentation

**a. Migration Script**
- **File:** `scripts/migrate-default-permissions.cjs`
- **Purpose:** Set default permissions untuk existing users berdasarkan role

**b. Setup Script**
- **File:** `scripts/setup-permissions.sh`
- **Purpose:** Automated setup untuk database dan migration

**c. Documentation**
- `USER_PERMISSIONS_SYSTEM.md` - Dokumentasi lengkap sistem
- `QUICK_START_PERMISSIONS.md` - Quick start guide
- `scripts/README-PERMISSIONS.md` - Dokumentasi script dan SQL
- `CHANGELOG_PERMISSIONS.md` - Changelog ini

## 🔧 Technical Changes

### Database
- ✅ Tabel baru: `user_permissions`
- ✅ Foreign key constraint ke tabel `users`
- ✅ Unique constraint untuk prevent duplicate permission

### API
- ✅ 2 API endpoints baru untuk CRUD permission
- ✅ JWT authentication untuk security
- ✅ Error handling yang proper

### Frontend
- ✅ React hooks (useState, useEffect) untuk state management
- ✅ Toast notifications untuk user feedback
- ✅ Loading states untuk better UX
- ✅ Responsive design untuk mobile

### Backend Logic
- ✅ Permission check di sidebar
- ✅ Backward compatibility (default show all if no permission set)
- ✅ Role field tetap ada untuk backward compatibility

## 📊 Menu Keys Available

| Menu Key | Label | Default Superadmin | Default Admin | Default Doctor | Default Staff |
|----------|-------|:------------------:|:-------------:|:--------------:|:-------------:|
| dashboard | Dashboard | ✅ | ✅ | ✅ | ✅ |
| visits | Kunjungan | ✅ | ✅ | ✅ | ✅ |
| examinations | Pemeriksaan | ✅ | ❌ | ✅ | ❌ |
| chat | Chat Konsultasi | ✅ | ❌ | ✅ | ❌ |
| patients | Pasien | ✅ | ✅ | ❌ | ✅ |
| doctors | Dokter | ✅ | ✅ | ❌ | ❌ |
| clinics | Klinik | ✅ | ✅ | ❌ | ❌ |
| medicine | Obat | ✅ | ✅ | ❌ | ❌ |
| mobile | Mobile App | ✅ | ✅ | ❌ | ❌ |
| users | Pengguna | ✅ | ✅ | ❌ | ❌ |
| settings | Settings | ✅ | ✅ | ❌ | ❌ |
| laboratory | Laboratorium | ✅ | ✅ | ✅ | ❌ |

## 🚀 Migration Steps

1. **Run database migration:**
   ```bash
   mysql -u root -p phc_dashboard < init-scripts/15-create-user-permissions.sql
   ```

2. **Run permission migration:**
   ```bash
   node scripts/migrate-default-permissions.cjs
   ```

   Or use automated script:
   ```bash
   bash scripts/setup-permissions.sh
   ```

3. **Restart application:**
   ```bash
   npm run dev
   ```

## 🧪 Testing Checklist

- [x] Database table created successfully
- [x] API endpoints working
- [x] Permission modal opens and closes properly
- [x] Checkboxes can be toggled
- [x] Permissions save correctly
- [x] Sidebar filters menus based on permissions
- [x] Users without permissions see all menus (backward compatibility)
- [x] Toast notifications appear on success/error
- [x] Loading states work correctly
- [x] Mobile responsive design
- [x] No linter errors

## ⚠️ Breaking Changes

**None.** System is designed to be backward compatible. Users without permissions set will see all menus by default.

## 🔄 Rollback Plan

If needed to rollback:

1. Drop table:
   ```sql
   DROP TABLE IF EXISTS user_permissions;
   ```

2. Restore deleted files:
   - `app/role-info/page.js`
   - `app/role-management/page.js`

3. Revert changes to:
   - `components/Sidebar.jsx`
   - `app/users/page.js`

## 📝 Notes

- Field `role` di tabel `users` tetap ada untuk backward compatibility
- Permission system ini lebih fleksibel dari role-based system
- Admin dapat set permission yang sangat spesifik untuk setiap user
- Sidebar akan otomatis hide menu yang tidak di-allow

## 👥 Affected Users

- **Admin/Superadmin:** Sekarang bisa kelola permission per user dengan lebih detail
- **End Users:** Hanya melihat menu yang telah di-allow admin
- **Developers:** Perlu aware dengan permission system saat develop fitur baru

## 🎯 Next Steps

1. Test system dengan berbagai role
2. Set permission untuk semua existing users
3. Train admin untuk menggunakan fitur permission management
4. Monitor logs untuk errors
5. Collect feedback dari users

## 📞 Support

Jika ada issue, refer to:
- `USER_PERMISSIONS_SYSTEM.md` untuk troubleshooting
- Check server logs
- Check browser console
- Check database dengan SQL query

---

**Author:** AI Assistant  
**Date:** 2025-10-30  
**Version:** 1.0.0

