# Sistem Roles PHC Dashboard

Sistem roles yang baru telah dibuat dengan tabel terpisah untuk mengelola role pengguna dengan lebih fleksibel dan terstruktur.

## Struktur Database

### Tabel `roles`
```sql
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSON,
  level INT NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Tabel `users` (Updated)
```sql
ALTER TABLE users ADD COLUMN role_id INT NULL AFTER role;
ALTER TABLE users ADD CONSTRAINT fk_users_role_id 
FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;
```

## Roles yang Tersedia

### 1. SUPERADMIN (Level 4)
- **Display Name**: Super Administrator
- **Description**: Full system access with all privileges
- **Permissions**: `["*"]` (All permissions)
- **Users**: 1 user

### 2. ADMIN (Level 3)
- **Display Name**: Administrator
- **Description**: Administrative access to manage clinics and users
- **Permissions**: `["users.read", "users.write", "clinics.read", "clinics.write", "doctors.read", "doctors.write", "patients.read", "patients.write", "visits.read", "visits.write"]`
- **Users**: 5 users

### 3. DOCTOR (Level 2)
- **Display Name**: Doctor
- **Description**: Medical professional access to patient data and examinations
- **Permissions**: `["patients.read", "patients.write", "visits.read", "visits.write", "examinations.read", "examinations.write", "chat.read", "chat.write"]`
- **Users**: 2 users

### 4. STAFF (Level 1)
- **Display Name**: Staff
- **Description**: Basic access for clinic staff
- **Permissions**: `["patients.read", "visits.read", "visits.write"]`
- **Users**: 1 user

## Hierarki Role

```
SUPERADMIN (Level 4) - Highest
    ↓
ADMIN (Level 3)
    ↓
DOCTOR (Level 2)
    ↓
STAFF (Level 1) - Lowest
```

## Script yang Tersedia

### 1. `create-roles-table.sql`
Script SQL untuk membuat tabel roles dan mengupdate tabel users.

### 2. `apply-roles-migration.js`
Script untuk menjalankan migrasi roles.

### 3. `fix-roles-migration.js`
Script untuk memperbaiki masalah migrasi roles.

### 4. `fix-role-mapping.js`
Script untuk memperbaiki mapping role.

### 5. `final-role-fix.js`
Script final untuk memperbaiki mapping role.

### 6. `check-and-fix-roles.js`
Script untuk memeriksa dan memperbaiki mapping role.

### 7. `get-users-with-roles.js`
Script untuk mengambil data user dengan informasi role lengkap.

## Cara Menjalankan

### 1. Membuat tabel roles
```bash
node scripts/apply-roles-migration.js
```

### 2. Memperbaiki mapping role
```bash
node scripts/check-and-fix-roles.js
```

### 3. Mengambil data user dengan roles
```bash
node scripts/get-users-with-roles.js
```

## Data User dengan Roles

### Superadmin (1 user)
- Super Administrator (superadmin@phc.com)

### Admin (5 users)
- Aditya Wirawan (wiwawe@phc.com)
- Admin Klinik PHC Bandung (admin.klinikphcbandung@phc.com)
- Admin Klinik PHC Jakarta Pusat (admin.klinikphcjakartapusat@phc.com)
- Admin Klinik PHC Medan (admin.klinikphcmedan@phc.com)
- Admin Klinik PHC Surabaya (admin.klinikphcsurabaya@phc.com)

### Doctor (2 users)
- Dodi Nugraha (dodi@phc.com)
- Dr. Test Doctor (doctor@phc.com)

### Staff (1 user)
- Nadia Mulya (namu@phc.com)

## Users by Clinic

### Klinik PHC Surabaya (2 users)
- Nadia Mulya (Staff)
- Admin Klinik PHC Surabaya (Administrator)

### Klinik PHC Jakarta Pusat (1 user)
- Admin Klinik PHC Jakarta Pusat (Administrator)

### Klinik PHC Bandung (1 user)
- Admin Klinik PHC Bandung (Administrator)

### Klinik PHC Medan (1 user)
- Admin Klinik PHC Medan (Administrator)

## Keuntungan Sistem Roles Baru

### 1. Fleksibilitas
- Role dapat ditambah, diubah, atau dihapus dengan mudah
- Permissions dapat dikelola secara granular
- Level hierarki yang jelas

### 2. Skalabilitas
- Mudah menambah role baru
- Permissions dapat diperluas
- Struktur yang mendukung pertumbuhan sistem

### 3. Keamanan
- Permissions yang terdefinisi dengan jelas
- Hierarki role yang terstruktur
- Kontrol akses yang lebih baik

### 4. Maintainability
- Kode yang lebih bersih
- Mudah untuk debugging
- Dokumentasi yang jelas

## Query Examples

### 1. Get users with roles
```sql
SELECT 
  u.id,
  u.name,
  u.email,
  r.name as role_name,
  r.display_name as role_display_name,
  r.level as role_level
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
ORDER BY r.level DESC, u.name;
```

### 2. Get role statistics
```sql
SELECT 
  r.name as role_name,
  r.display_name,
  r.level,
  COUNT(u.id) as user_count
FROM roles r
LEFT JOIN users u ON r.id = u.role_id
GROUP BY r.id, r.name, r.display_name, r.level
ORDER BY r.level DESC;
```

### 3. Get users by clinic with roles
```sql
SELECT 
  c.name as clinic_name,
  COUNT(u.id) as user_count,
  GROUP_CONCAT(
    CONCAT(u.name, ' (', r.display_name, ')') 
    SEPARATOR ', '
  ) as users_with_roles
FROM clinics c
LEFT JOIN users u ON c.id = u.clinic_id
LEFT JOIN roles r ON u.role_id = r.id
GROUP BY c.id, c.name
ORDER BY user_count DESC;
```

## File Output

Script akan menghasilkan file JSON dengan format:
- `users-with-roles-YYYY-MM-DD.json` - Data user dengan informasi role lengkap

## Notes

- Sistem roles menggunakan foreign key untuk integritas data
- Permissions disimpan dalam format JSON untuk fleksibilitas
- Level hierarki memudahkan kontrol akses
- View `users_with_roles` tersedia untuk query yang mudah 