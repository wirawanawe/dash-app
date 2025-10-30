# Setup Database di aaPanel

## 🔧 Langkah 1: Buat Database dan User di aaPanel

### 1. Login ke aaPanel

1. Masuk ke panel kontrol aaPanel
2. Navigasi ke **Database** → **MySQL**

### 2. Buat Database

1. Klik **Add Database**
2. **Database Name**: `phc_dashboard`
3. **Character Set**: `utf8mb4_unicode_ci`
4. Klik **Submit**

### 3. Buat User Database

1. Klik **Add User**
2. **Username**: `phc_user` (atau nama lain yang Anda inginkan)
3. **Password**: Buat password yang kuat
4. **Allowed Hosts**: `localhost` (untuk keamanan)
5. Klik **Submit**

### 4. Berikan Privilege ke User

1. Di bagian **Database Privileges**
2. Pilih database `phc_dashboard`
3. Pilih user `phc_user`
4. Berikan **All Privileges**
5. Klik **Submit**

## 🔧 Langkah 2: Setup Environment Variables

### 1. Buat File .env.local

Di directory project `/www/wwwroot/dashapp/`, buat file `.env.local`:

```bash
cd /www/wwwroot/dashapp
nano .env.local
```

### 2. Isi File .env.local

```env
# Database Configuration
DB_HOST=localhost
DB_USER=phc_user
DB_PASSWORD=your_strong_password_here
DB_NAME=phc_dashboard

# JWT Secret (Ganti dengan random string yang aman)
JWT_SECRET=your_super_secret_jwt_key_for_production_min_32_chars

# Application Configuration
NODE_ENV=production
PORT=3000

# Next.js Configuration
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

**Penting:** Ganti `your_strong_password_here` dengan password yang Anda buat di step 3!

### 3. Set Permission File

```bash
chmod 600 .env.local
```

## 🔧 Langkah 3: Test Koneksi Database

```bash
# Test koneksi database
npm run db:setup
```

## 🔧 Langkah 4: Alternatif Jika Root Access Diperlukan

Jika Anda ingin menggunakan user root MySQL:

### 1. Cek Password Root MySQL

Di aaPanel:

1. **Database** → **MySQL** → **Root Password**
2. Catat atau reset password root

### 2. Update .env.local dengan Root

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=mysql_root_password_dari_aapanel
DB_NAME=phc_dashboard
JWT_SECRET=your_super_secret_jwt_key_for_production_min_32_chars
NODE_ENV=production
PORT=3000
```

## 🔧 Troubleshooting

### Error: Access denied for user

1. Pastikan username dan password benar
2. Pastikan user memiliki privilege ke database
3. Cek file `.env.local` ada dan readable

### Error: Database does not exist

1. Pastikan database `phc_dashboard` sudah dibuat
2. Cek nama database di aaPanel
3. Pastikan case-sensitive matching

### Error: Connection refused

1. Pastikan MySQL service berjalan
2. Cek firewall settings
3. Pastikan host adalah `localhost`

## 📋 Checklist Setup Database

- [ ] Database `phc_dashboard` sudah dibuat
- [ ] User database sudah dibuat dengan password kuat
- [ ] User memiliki full privilege ke database
- [ ] File `.env.local` sudah dibuat dengan credentials yang benar
- [ ] Permission file `.env.local` sudah di-set (600)
- [ ] Test koneksi dengan `npm run db:setup`

## 🔍 Debug Commands

```bash
# Test MySQL connection
mysql -u phc_user -p -h localhost phc_dashboard

# Check if .env.local is being read
node -e "require('dotenv').config({path:'.env.local'}); console.log(process.env.DB_USER)"

# Check database exists
mysql -u root -p -e "SHOW DATABASES;"
```
