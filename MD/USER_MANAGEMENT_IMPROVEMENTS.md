# Peningkatan Manajemen Pengguna

## Ringkasan Perubahan

Dokumen ini menjelaskan perubahan yang telah diterapkan pada sistem manajemen pengguna untuk meningkatkan keamanan dan kontrol akses.

## 1. Pembatasan Akses terhadap Superadmin

### Deskripsi
**Semua role selain Superadmin** tidak dapat:
1. **Menghapus** pengguna dengan role Superadmin
2. **Mengedit** pengguna dengan role Superadmin  
3. **Mengatur** role pengguna menjadi Superadmin
4. **Mengelola akses menu (permissions)** pengguna Superadmin

Hanya sesama Superadmin yang dapat melakukan operasi tersebut terhadap pengguna Superadmin.

### Implementasi

#### Backend - API Protection
**File:** `app/api/users/[id]/route.js`

##### DELETE Endpoint
- Menambahkan autentikasi token untuk mendapatkan informasi user yang sedang login
- Menambahkan validasi role sebelum menghapus user:
  - Jika user yang dihapus adalah **Superadmin**, hanya **Superadmin** yang bisa melakukannya
  - Semua role lain (Admin, Doctor, Staff) akan ditolak dengan status 403

```javascript
// Only superadmin can delete superadmin
// All other roles are blocked from deleting superadmin
if (existingUser.role?.toUpperCase() === 'SUPERADMIN') {
  if (!userPayload || userPayload.role?.toUpperCase() !== 'SUPERADMIN') {
    return NextResponse.json(
      { error: "Hanya Superadmin yang dapat menghapus pengguna Superadmin" },
      { status: 403 }
    );
  }
}
```

##### PUT Endpoint (Update)
- Menambahkan validasi untuk mencegah editing Superadmin oleh non-Superadmin
- Menambahkan validasi untuk mencegah mengubah role menjadi Superadmin oleh non-Superadmin

```javascript
// Check if current user is trying to edit a superadmin
// Only superadmin can edit superadmin users
if (existingUser.role?.toUpperCase() === 'SUPERADMIN') {
  if (!userPayload || userPayload.role?.toUpperCase() !== 'SUPERADMIN') {
    return NextResponse.json(
      { error: "Hanya Superadmin yang dapat mengedit pengguna Superadmin" },
      { status: 403 }
    );
  }
}

// Check if trying to change role to SUPERADMIN
// Only superadmin can set role to superadmin
const newRole = body.role ? body.role.toUpperCase() : existingUser.role?.toUpperCase();
if (newRole === 'SUPERADMIN') {
  if (!userPayload || userPayload.role?.toUpperCase() !== 'SUPERADMIN') {
    return NextResponse.json(
      { error: "Hanya Superadmin yang dapat mengatur role Superadmin" },
      { status: 403 }
    );
  }
}
```

#### Frontend - UI Protection
**File:** `app/users/page.js`

##### Validasi di Handler Functions
- Menambahkan validasi di `handleDeleteUser()` untuk mencegah non-Superadmin menghapus Superadmin
- Menambahkan validasi di `handleEditUser()` untuk mencegah non-Superadmin mengedit Superadmin

```javascript
// Handle delete user
const handleDeleteUser = async (id, targetUser) => {
  // Check if non-superadmin is trying to delete superadmin
  if (user?.role?.toUpperCase() !== 'SUPERADMIN' && targetUser?.role?.toUpperCase() === 'SUPERADMIN') {
    toast.error("Hanya Superadmin yang dapat menghapus pengguna Superadmin");
    return;
  }
  // ... rest of the function
};

// Handle edit user
const handleEditUser = (targetUser) => {
  // Check if non-superadmin is trying to edit superadmin
  if (user?.role?.toUpperCase() !== 'SUPERADMIN' && targetUser?.role?.toUpperCase() === 'SUPERADMIN') {
    toast.error("Hanya Superadmin yang dapat mengedit pengguna Superadmin");
    return;
  }
  // ... rest of the function
};

// Handle show permissions modal
const handleShowPermissions = (targetUser) => {
  // Check if non-superadmin is trying to manage superadmin permissions
  if (user?.role?.toUpperCase() !== 'SUPERADMIN' && targetUser?.role?.toUpperCase() === 'SUPERADMIN') {
    toast.error("Hanya Superadmin yang dapat mengelola akses menu Superadmin");
    return;
  }
  // ... rest of the function
};
```

##### Menyembunyikan Tombol Aksi
Menyembunyikan tombol Permissions, Edit, dan Delete untuk Superadmin jika user yang login bukan Superadmin (di Table View dan Grid View)

**Table View:**
```javascript
{/* Hide permissions button for superadmin if current user is not superadmin */}
{!(user?.role?.toUpperCase() !== 'SUPERADMIN' && tableUser?.role?.toUpperCase() === 'SUPERADMIN') && (
  <button
    onClick={() => handleShowPermissions(tableUser)}
    className="text-purple-600 hover:text-purple-900 p-2 rounded-lg hover:bg-purple-50 transition-colors"
    title="Kelola Akses Menu"
  >
    <Lock className="h-4 w-4" />
  </button>
)}
{/* Hide edit button for superadmin if current user is not superadmin */}
{!(user?.role?.toUpperCase() !== 'SUPERADMIN' && tableUser?.role?.toUpperCase() === 'SUPERADMIN') && (
  <button
    onClick={() => handleEditUser(tableUser)}
    className="text-indigo-600 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
    title="Edit Pengguna"
  >
    <Edit className="h-4 w-4" />
  </button>
)}
{/* Hide delete button for superadmin if current user is not superadmin */}
{!(user?.role?.toUpperCase() !== 'SUPERADMIN' && tableUser?.role?.toUpperCase() === 'SUPERADMIN') && (
  <button
    onClick={() => handleDeleteUser(tableUser.id, tableUser)}
    className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
    title="Hapus Pengguna"
  >
    <Trash2 className="h-4 w-4" />
  </button>
)}
```

**Grid View:**
```javascript
{/* Hide permissions button for superadmin if current user is not superadmin */}
{!(user?.role?.toUpperCase() !== 'SUPERADMIN' && gridUser?.role?.toUpperCase() === 'SUPERADMIN') && (
  <button
    onClick={() => handleShowPermissions(gridUser)}
    className="flex-1 px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
  >
    Akses
  </button>
)}
{/* Hide edit button for superadmin if current user is not superadmin */}
{!(user?.role?.toUpperCase() !== 'SUPERADMIN' && gridUser?.role?.toUpperCase() === 'SUPERADMIN') && (
  <button
    onClick={() => handleEditUser(gridUser)}
    className="flex-1 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
  >
    Edit
  </button>
)}
{/* Hide delete button for superadmin if current user is not superadmin */}
{!(user?.role?.toUpperCase() !== 'SUPERADMIN' && gridUser?.role?.toUpperCase() === 'SUPERADMIN') && (
  <button
    onClick={() => handleDeleteUser(gridUser.id, gridUser)}
    className="flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
  >
    Hapus
  </button>
)}
```

##### Form Role Selection
**File:** `app/users/components/UserForm.jsx`

Membatasi opsi role Superadmin hanya untuk Superadmin:
- Jika user adalah Superadmin: dapat memilih semua role termasuk Superadmin
- Jika user adalah Admin: dapat memilih Admin, Doctor, dan Staff (tidak ada opsi Superadmin)
- Jika user adalah role lain: hanya dapat memilih Doctor dan Staff

```javascript
<select
  id="role"
  name="role"
  value={formData.role}
  onChange={handleChange}
  className="w-full p-2 text-black border border-gray-300 rounded-md"
>
  {currentUser?.role?.toLowerCase() === "superadmin" ? (
    <>
      <option value="superadmin">Superadmin</option>
      <option value="admin">Admin</option>
      <option value="doctor">Dokter</option>
      <option value="staff">Staff</option>
    </>
  ) : currentUser?.role?.toLowerCase() === "admin" ? (
    <>
      <option value="admin">Admin</option>
      <option value="doctor">Dokter</option>
      <option value="staff">Staff</option>
    </>
  ) : (
    <>
      <option value="doctor">Dokter</option>
      <option value="staff">Staff</option>
    </>
  )}
</select>
{currentUser?.role?.toLowerCase() !== "superadmin" && (
  <p className="text-xs text-gray-500 mt-1">
    Hanya Superadmin yang dapat mengatur role Superadmin
  </p>
)}
```

##### Permissions Protection
**File:** `app/api/users/[id]/permissions/route.js`

Menambahkan validasi untuk mencegah non-Superadmin melihat dan mengubah permissions Superadmin:

```javascript
// GET user permissions
export async function GET(request, { params }) {
  // Get user information from token
  const userPayload = await getUserFromToken(request);
  
  // Check if target user is superadmin
  const [targetUser] = await query("SELECT role FROM users WHERE id = ?", [id]);
  
  // Only superadmin can view superadmin permissions
  if (targetUser.role?.toUpperCase() === 'SUPERADMIN') {
    if (!userPayload || userPayload.role?.toUpperCase() !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: "Hanya Superadmin yang dapat melihat permission Superadmin" },
        { status: 403 }
      );
    }
  }
  // ... rest of the function
}

// PUT update user permissions
export async function PUT(request, { params }) {
  // Get user information from token
  const userPayload = await getUserFromToken(request);
  
  // Check if target user is superadmin
  const [targetUser] = await query("SELECT role FROM users WHERE id = ?", [id]);
  
  // Only superadmin can update superadmin permissions
  if (targetUser.role?.toUpperCase() === 'SUPERADMIN') {
    if (!userPayload || userPayload.role?.toUpperCase() !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: "Hanya Superadmin yang dapat mengubah permission Superadmin" },
        { status: 403 }
      );
    }
  }
  // ... rest of the function
}
```

## 2. Filter Pengguna Berdasarkan Klinik

### Deskripsi
Penerapan filtering data pengguna berdasarkan klinik yang dimiliki oleh user yang sedang login:
- **User dengan clinic_id (tidak kosong)**: Hanya dapat melihat pengguna dari klinik yang sama
- **User tanpa clinic_id (kosong/null)**: Dapat melihat semua pengguna dari semua klinik

### Implementasi

#### Backend - Data Filtering
**File:** `app/api/users/route.js`

- Menambahkan fungsi `getUserFromToken()` untuk mendapatkan informasi user dari JWT token
- Menambahkan filter clinic_id pada query database:

```javascript
// Add clinic filtering based on current user's clinic_id
// If user has clinic_id, they can only see users from the same clinic
// If user has no clinic_id (null), they can see all users
if (userPayload && userPayload.clinic_id) {
  whereConditions.push('u.clinic_id = ?');
  params.push(userPayload.clinic_id);
}
```

### Skenario Penggunaan

#### Skenario 1: User dengan Klinik
**User:** Admin Klinik A (clinic_id = 1)
**Hasil:** Hanya dapat melihat pengguna yang memiliki clinic_id = 1

#### Skenario 2: User tanpa Klinik
**User:** Superadmin (clinic_id = null)
**Hasil:** Dapat melihat semua pengguna dari semua klinik

#### Skenario 3: Non-Superadmin Mencoba Mengelola Superadmin
**User:** Admin / Doctor / Staff
**Target:** Superadmin
**Hasil:** 
- Tombol Edit dan Delete tidak muncul di UI
- Jika tetap mencoba via API, akan ditolak dengan error 403
- Tidak dapat memilih role Superadmin di form
- Jika mencoba mengubah role user lain menjadi Superadmin via API, akan ditolak dengan error 403

## File yang Dimodifikasi

1. **app/api/users/route.js**
   - Menambahkan import `jwtVerify` dari jose
   - Menambahkan fungsi `getUserFromToken()`
   - Menambahkan filter clinic_id pada query GET

2. **app/api/users/[id]/route.js**
   - Menambahkan import `jwtVerify` dari jose
   - Menambahkan fungsi `getUserFromToken()`
   - Menambahkan validasi role pada endpoint DELETE untuk mencegah semua non-Superadmin menghapus Superadmin
   - Menambahkan validasi role pada endpoint PUT untuk mencegah semua non-Superadmin mengedit Superadmin
   - Menambahkan validasi untuk mencegah mengubah role menjadi Superadmin oleh non-Superadmin

3. **app/users/page.js**
   - Mengubah parameter `handleDeleteUser()` untuk menerima target user
   - Menambahkan validasi di `handleDeleteUser()` untuk mencegah non-Superadmin menghapus Superadmin
   - Menambahkan validasi di `handleEditUser()` untuk mencegah non-Superadmin mengedit Superadmin
   - Menyembunyikan tombol Edit di Table View dan Grid View untuk Superadmin jika user bukan Superadmin
   - Menyembunyikan tombol Delete di Table View dan Grid View untuk Superadmin jika user bukan Superadmin
   - Menambahkan `fetchUsers()` setelah berhasil delete untuk refresh data

4. **app/users/components/UserForm.jsx**
   - Mengubah logika dropdown role untuk menyembunyikan opsi Superadmin dari non-Superadmin
   - Admin dapat memilih: Admin, Doctor, Staff
   - Hanya Superadmin yang dapat memilih role Superadmin
   - Menambahkan pesan informasi bahwa hanya Superadmin yang dapat mengatur role Superadmin

5. **app/api/users/[id]/permissions/route.js**
   - Menambahkan import `jwtVerify` dari jose
   - Menambahkan fungsi `getUserFromToken()`
   - Menambahkan validasi role pada endpoint GET untuk mencegah non-Superadmin melihat permissions Superadmin
   - Menambahkan validasi role pada endpoint PUT untuk mencegah non-Superadmin mengubah permissions Superadmin

## Keamanan

### Lapisan Perlindungan Ganda
1. **Frontend Validation**: Mencegah user interface menampilkan opsi yang tidak diizinkan
2. **Backend Validation**: Memastikan tidak ada bypass dari frontend yang dapat merusak sistem

### Token Authentication
- Menggunakan JWT token dari cookies atau Authorization header
- Token diverifikasi menggunakan JWT_SECRET dari environment variables
- Payload token berisi informasi user (id, role, clinic_id)

## Testing yang Disarankan

### Test Case 1: Non-Superadmin Tidak Dapat Mengelola Superadmin
1. Login sebagai Admin/Doctor/Staff
2. Buka halaman Users
3. Verifikasi tombol Permissions, Edit, dan Delete tidak muncul untuk user Superadmin
4. Verifikasi hanya tombol Detail yang muncul untuk Superadmin
5. Coba hapus, edit, atau kelola permissions Superadmin via API (jika memungkinkan)
6. Verifikasi error 403 dikembalikan

### Test Case 2: Non-Superadmin Tidak Dapat Mengatur Role Superadmin
1. Login sebagai Admin/Doctor/Staff
2. Buka form tambah/edit user
3. Verifikasi opsi Superadmin tidak muncul di dropdown role
4. Coba ubah role user menjadi Superadmin via API (jika memungkinkan)
5. Verifikasi error 403 dikembalikan

### Test Case 3: Superadmin Dapat Mengelola Semua User
1. Login sebagai Superadmin
2. Buka halaman Users
3. Verifikasi tombol Edit dan Delete muncul untuk semua user termasuk Superadmin
4. Verifikasi dapat mengedit Superadmin lain
5. Verifikasi dapat menghapus Superadmin lain
6. Verifikasi dapat mengatur role Superadmin di form

### Test Case 3: Filter Klinik - User dengan Klinik
1. Login sebagai Admin dengan clinic_id tertentu
2. Buka halaman Users
3. Verifikasi hanya user dari klinik yang sama yang ditampilkan

### Test Case 4: Filter Klinik - User tanpa Klinik
1. Login sebagai Superadmin (tanpa clinic_id)
2. Buka halaman Users
3. Verifikasi semua user dari semua klinik ditampilkan

## Pertimbangan untuk Pengembangan Selanjutnya

1. **Audit Log**: Pertimbangkan untuk menambahkan logging untuk setiap percobaan penghapusan user
2. **Soft Delete**: Pertimbangkan menggunakan soft delete daripada hard delete untuk menjaga data historis
3. **Permission System**: Pertimbangkan sistem permission yang lebih granular untuk kontrol akses yang lebih detail
4. **Rate Limiting**: Tambahkan rate limiting pada endpoint delete untuk mencegah abuse

## Catatan

- Perubahan ini telah diuji dan tidak menghasilkan error linter
- Kompatibel dengan sistem autentikasi yang ada
- Tidak mengubah database schema
- Backward compatible dengan fitur yang ada

## Matriks Hak Akses

| Role | Lihat Superadmin | Edit Superadmin | Hapus Superadmin | Atur Role Superadmin | Kelola Permissions Superadmin |
|------|-----------------|----------------|-----------------|---------------------|------------------------------|
| **Superadmin** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Admin** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Doctor** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Staff** | ✅ | ❌ | ❌ | ❌ | ❌ |

## Ringkasan Perlindungan

1. ✅ **DELETE Protection**: Non-Superadmin tidak dapat menghapus Superadmin
2. ✅ **EDIT Protection**: Non-Superadmin tidak dapat mengedit data Superadmin
3. ✅ **ROLE Protection**: Non-Superadmin tidak dapat mengubah role pengguna menjadi Superadmin
4. ✅ **PERMISSIONS Protection**: Non-Superadmin tidak dapat melihat atau mengubah permissions Superadmin
5. ✅ **UI Protection**: Tombol Permissions, Edit, dan Delete disembunyikan untuk Superadmin jika user bukan Superadmin
6. ✅ **Form Protection**: Opsi role Superadmin hanya muncul untuk Superadmin
7. ✅ **Clinic Filter**: User dengan clinic_id hanya melihat user dari klinik yang sama

---

**Tanggal Implementasi:** 30 Oktober 2025  
**Tanggal Update Terakhir:** 30 Oktober 2025  
**Developer:** AI Assistant  
**Status:** ✅ Selesai & Diperbarui

