# 🎨 Visual Guide - Sistem Permission User

## 📋 Table of Contents
1. [Sebelum vs Sesudah](#sebelum-vs-sesudah)
2. [Cara Kerja Sistem](#cara-kerja-sistem)
3. [Langkah-langkah Penggunaan](#langkah-langkah-penggunaan)
4. [Contoh Use Case](#contoh-use-case)

## 🔄 Sebelum vs Sesudah

### ❌ SEBELUM (Role-Based)

```
┌─────────────────────────────────────────┐
│  System Lama                            │
├─────────────────────────────────────────┤
│                                         │
│  User → Role (Fixed)                    │
│          ↓                              │
│  Role → Menu Access (Fixed)             │
│                                         │
│  ⚠️  Tidak Fleksibel                    │
│  - Admin hanya bisa akses menu admin    │
│  - Staff hanya bisa akses menu staff    │
│  - Tidak bisa custom per user           │
│                                         │
└─────────────────────────────────────────┘
```

### ✅ SESUDAH (Permission-Based)

```
┌─────────────────────────────────────────┐
│  System Baru                            │
├─────────────────────────────────────────┤
│                                         │
│  User → Custom Permissions              │
│          ↓                              │
│  Menu Access (Flexible)                 │
│                                         │
│  ✅ Sangat Fleksibel                    │
│  - Bisa set permission per user         │
│  - Tidak terbatas role                  │
│  - Checkbox untuk setiap menu           │
│                                         │
└─────────────────────────────────────────┘
```

## 🔧 Cara Kerja Sistem

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Admin     │──────│  Permission  │──────│  Database   │
│  (Web UI)   │      │    Modal     │      │  (MySQL)    │
└─────────────┘      └──────────────┘      └─────────────┘
       │                    │                       │
       │ 1. Klik Lock       │                       │
       │    button          │                       │
       │                    │                       │
       │────────────────────>                       │
       │                    │                       │
       │                    │ 2. Fetch current      │
       │                    │    permissions        │
       │                    │                       │
       │                    │<──────────────────────│
       │                    │                       │
       │ 3. Toggle          │                       │
       │    checkboxes      │                       │
       │                    │                       │
       │<───────────────────│                       │
       │                    │                       │
       │ 4. Click Save      │                       │
       │                    │                       │
       │────────────────────>                       │
       │                    │                       │
       │                    │ 5. Save to DB         │
       │                    │                       │
       │                    │──────────────────────>│
       │                    │                       │
       │ 6. Success Toast   │                       │
       │                    │                       │
       │<───────────────────│                       │
       │                    │                       │

┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│    User     │──────│   Sidebar    │──────│  Database   │
│  (Login)    │      │ (Dynamic)    │      │  (MySQL)    │
└─────────────┘      └──────────────┘      └─────────────┘
       │                    │                       │
       │ 1. User login      │                       │
       │                    │                       │
       │────────────────────>                       │
       │                    │                       │
       │                    │ 2. Fetch user         │
       │                    │    permissions        │
       │                    │                       │
       │                    │<──────────────────────│
       │                    │                       │
       │                    │ 3. Filter menus       │
       │                    │    (only allowed)     │
       │                    │                       │
       │ 4. Show sidebar    │                       │
       │    with allowed    │                       │
       │    menus only      │                       │
       │                    │                       │
       │<───────────────────│                       │
       │                    │                       │
```

## 📖 Langkah-langkah Penggunaan

### Step 1: Setup Database (One Time)

```bash
# Option A: Automatic (Recommended)
bash scripts/setup-permissions.sh

# Option B: Manual
mysql -u root -p phc_dashboard < init-scripts/15-create-user-permissions.sql
node scripts/migrate-default-permissions.js
```

**Output yang diharapkan:**
```
================================================
  Setup User Permissions System
================================================

Database Configuration:
  Host: localhost
  User: root
  Database: phc_dashboard

Continue with this configuration? (y/n) y

================================================
  Step 1: Create user_permissions table
================================================

✓ Table created successfully

================================================
  Step 2: Migrate default permissions
================================================

Connecting to database...
Connected to database successfully!

Found 10 users

✅ Set permissions for user John Doe (john@example.com) - Role: ADMIN - 10 menus
✅ Set permissions for user Jane Smith (jane@example.com) - Role: STAFF - 3 menus
...

============================================================
Migration completed!
✅ Success: 10 users
⏭️  Skipped: 0 users
❌ Errors: 0 users
============================================================
```

### Step 2: Login sebagai Admin

```
URL: http://localhost:3000/login
Email: admin@example.com
Password: your_password
```

### Step 3: Buka Halaman Users

```
URL: http://localhost:3000/users
```

**Tampilan:**
```
┌──────────────────────────────────────────────────────────────┐
│  Daftar Pengguna                                   [+ Tambah] │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  Search: [___________] [Filter Role ▼]                        │
│                                                                │
│  ┌────────┬──────────┬──────┬────────┬─────────────────────┐ │
│  │ Nama   │ Email    │ Role │ Status │ Aksi                │ │
│  ├────────┼──────────┼──────┼────────┼─────────────────────┤ │
│  │ John   │ john@... │ ADMIN│ ✓ Aktif│ [👁️] [🔒] [✏️] [🗑️] │ │
│  │ Jane   │ jane@... │ STAFF│ ✓ Aktif│ [👁️] [🔒] [✏️] [🗑️] │ │
│  └────────┴──────────┴──────┴────────┴─────────────────────┘ │
│                                                                │
└──────────────────────────────────────────────────────────────┘
                              ↑
                              │
                    Klik tombol 🔒 (Lock)
```

### Step 4: Kelola Permission

**Klik tombol 🔒 untuk membuka modal:**

```
┌─────────────────────────────────────────────────────────┐
│  Kelola Akses Menu                               [X]    │
│  Pilih menu yang dapat diakses oleh John Doe            │
│  ● 8 dari 12 menu dipilih                               │
├─────────────────────────────────────────────────────────┤
│  [Pilih Semua]  [Hapus Semua]                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────┐  ┌────────────────────┐        │
│  │ ☑ Dashboard        │  │ ☑ Kunjungan        │        │
│  │   Halaman utama    │  │   Kelola kunjungan │        │
│  └────────────────────┘  └────────────────────┘        │
│                                                          │
│  ┌────────────────────┐  ┌────────────────────┐        │
│  │ ☐ Pemeriksaan      │  │ ☐ Chat Konsultasi  │        │
│  │   Data pemeriksaan │  │   Chat dengan dokter│        │
│  └────────────────────┘  └────────────────────┘        │
│                                                          │
│  ┌────────────────────┐  ┌────────────────────┐        │
│  │ ☑ Pasien           │  │ ☑ Dokter           │        │
│  │   Kelola pasien    │  │   Kelola dokter    │        │
│  └────────────────────┘  └────────────────────┘        │
│                                                          │
│  ... (scroll untuk menu lainnya)                        │
│                                                          │
├─────────────────────────────────────────────────────────┤
│              [Batal]  [💾 Simpan Permission]            │
└─────────────────────────────────────────────────────────┘
```

### Step 5: Login sebagai User

**User dengan permission terbatas:**

```
Sidebar SEBELUM (semua menu):          Sidebar SESUDAH (permission-based):

┌──────────────────┐                    ┌──────────────────┐
│ 🏠 Dashboard     │                    │ 🏠 Dashboard     │ ✅
│ 📅 Kunjungan     │                    │ 📅 Kunjungan     │ ✅
│ 🩺 Pemeriksaan   │ ──────────────▶   │ 👥 Pasien        │ ✅
│ 💬 Chat          │                    └──────────────────┘
│ 👥 Pasien        │                    (hanya 3 menu)
│ 👨‍⚕️ Dokter        │
│ 🏥 Klinik        │
│ 💊 Obat          │
│ 📱 Mobile App    │
│ 👤 Pengguna      │
│ ⚙️  Settings      │
│ 🧪 Laboratorium  │
└──────────────────┘
(12 menu)
```

## 🎯 Contoh Use Case

### Use Case 1: Staff Penerimaan Pasien

**Kebutuhan:**
- Hanya perlu akses data pasien
- Hanya perlu lihat kunjungan
- Tidak perlu akses admin features

**Permission yang di-set:**
```
✅ Dashboard
✅ Kunjungan
✅ Pasien
❌ Pemeriksaan
❌ Chat
❌ Dokter
❌ Klinik
❌ Obat
❌ Mobile App
❌ Pengguna
❌ Settings
❌ Laboratorium
```

### Use Case 2: Dokter Spesialis

**Kebutuhan:**
- Akses pemeriksaan pasien
- Akses chat konsultasi
- Akses hasil laboratorium
- Tidak perlu akses admin

**Permission yang di-set:**
```
✅ Dashboard
✅ Kunjungan
✅ Pemeriksaan
✅ Chat
✅ Laboratorium
❌ Pasien
❌ Dokter
❌ Klinik
❌ Obat
❌ Mobile App
❌ Pengguna
❌ Settings
```

### Use Case 3: Admin Klinik

**Kebutuhan:**
- Kelola semua data
- Kelola user
- Kelola settings
- Full access

**Permission yang di-set:**
```
✅ Semua menu (12 menu)
```

## 📊 Database Structure

```sql
-- Tabel user_permissions
┌────┬─────────┬────────────┬────────────┬────────────┐
│ id │ user_id │ menu_key   │ has_access │ created_at │
├────┼─────────┼────────────┼────────────┼────────────┤
│  1 │    5    │ dashboard  │     1      │ 2024-...   │
│  2 │    5    │ visits     │     1      │ 2024-...   │
│  3 │    5    │ patients   │     1      │ 2024-...   │
│  4 │    5    │ doctors    │     0      │ 2024-...   │
│  5 │    5    │ settings   │     0      │ 2024-...   │
└────┴─────────┴────────────┴────────────┴────────────┘
                     ↓
            has_access = 1 → Menu muncul
            has_access = 0 → Menu tidak muncul
```

## 🎨 UI/UX Flow

```
Admin Flow:
1. 🔐 Login
2. 👥 Navigate to Users page
3. 🔒 Click Lock icon on a user
4. ✅ Check/uncheck menus in modal
5. 💾 Click Save
6. ✅ Toast: "Permission berhasil disimpan"
7. 🔄 User's sidebar updates automatically on next login

User Flow:
1. 🔐 Login
2. 📱 App loads sidebar with permissions
3. 👀 Only see allowed menus
4. 🚫 Hidden menus are not accessible
5. ✅ Better UX - cleaner sidebar
```

## 🔔 Notifications

**Success:**
```
┌──────────────────────────────────┐
│ ✅ Permission berhasil disimpan  │
└──────────────────────────────────┘
```

**Error:**
```
┌──────────────────────────────────┐
│ ❌ Gagal menyimpan permission    │
└──────────────────────────────────┘
```

**Loading:**
```
┌──────────────────────────────────┐
│ ⏳ Menyimpan permission...       │
└──────────────────────────────────┘
```

## 🎉 Result

**Sebelum:**
- User dengan role "Staff" → stuck dengan 3 menu fixed
- Tidak fleksibel
- Harus ubah role untuk ubah akses

**Sesudah:**
- User dengan role apapun → bisa custom permission
- Sangat fleksibel
- Checkbox untuk setiap menu
- Admin control penuh

---

**Happy Managing Permissions! 🚀**

