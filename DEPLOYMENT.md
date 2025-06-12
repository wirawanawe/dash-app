# Deployment Guide untuk aaPanel

## ⚠️ Masalah bcrypt SUDAH DISELESAIKAN!

Project ini telah diupdate untuk menggunakan `bcryptjs` instead of `bcrypt` untuk menghindari masalah kompilasi di server Linux. Semua fungsi tetap sama, tidak ada perubahan API.

## Persiapan Server

### 1. Instalasi Node.js di aaPanel

1. Login ke aaPanel
2. Masuk ke **Software Store** → **Runtime Environment**
3. Install **Node.js** (pilih versi 18 atau lebih tinggi)

### 2. Instalasi PM2

```bash
npm install -g pm2
```

### 3. Setup Database MySQL

1. Buat database baru di aaPanel (nama: `phc_dashboard`)
2. Buat user database dengan privilege penuh
3. Catat credentials database

## Langkah Deployment

### 1. Upload Project

1. Upload semua file project ke directory website di aaPanel
2. Atau gunakan Git clone jika repository sudah ada

### 2. Install Dependencies

```bash
cd /path/to/your/project
npm install
```

**Note:** Dependencies akan terinstall dengan lancar karena sudah menggunakan `bcryptjs`.

### 3. Setup Environment Variables

Buat file `.env.local` dengan konfigurasi:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=phc_dashboard

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_for_production

# Application Configuration
NODE_ENV=production
PORT=3000
```

### 4. Setup Database

```bash
npm run db:setup
```

### 5. Build Application

```bash
npm run build
```

### 6. Deploy dengan PM2

```bash
# Menggunakan script otomatis
./deploy.sh

# Atau manual
pm2 start ecosystem.config.js --env production
pm2 save
```

### 7. Setup Reverse Proxy di aaPanel

1. Masuk ke **Website** → **Domain** → **Reverse Proxy**
2. Tambah rule:
   - **Proxy Name**: dash-app
   - **Target URL**: http://127.0.0.1:3000
   - **Send Domain**: $host
   - **Cache**: Enable

### 8. Setup SSL (Opsional)

1. Di aaPanel, masuk ke **Website** → **SSL**
2. Install SSL certificate untuk domain Anda

## Monitoring dan Maintenance

### Melihat Status PM2

```bash
pm2 status
pm2 logs dash-app
```

### Restart Aplikasi

```bash
pm2 restart dash-app
```

### Update Aplikasi

```bash
git pull origin main  # jika menggunakan git
npm install           # jika ada dependency baru
npm run build
pm2 restart dash-app
```

## Port Configuration

- Aplikasi berjalan di port 3000
- Pastikan port 3000 tidak digunakan aplikasi lain
- aaPanel akan proxy request dari port 80/443 ke port 3000

## Files yang Dibuat untuk Deployment

- `ecosystem.config.js` - Konfigurasi PM2
- `deploy.sh` - Script deployment otomatis
- `fix-bcrypt.sh` - Script untuk mengatasi masalah bcrypt (sudah dijalankan)
- `install-dependencies.sh` - Script install build tools (tidak diperlukan lagi)

## Troubleshooting

### ✅ Jika ada error bcrypt saat npm install:

Masalah ini sudah diselesaikan! Project menggunakan `bcryptjs` yang tidak memerlukan kompilasi.

### Jika aplikasi tidak bisa diakses:

1. Periksa status PM2: `pm2 status`
2. Periksa logs: `pm2 logs dash-app`
3. Periksa konfigurasi reverse proxy di aaPanel
4. Pastikan firewall tidak memblokir port 3000

### Jika database error:

1. Periksa koneksi database di `.env.local`
2. Pastikan MySQL service berjalan
3. Periksa privilege user database

## ✨ Keunggulan Versi Ini:

- ✅ Tidak ada masalah kompilasi bcrypt
- ✅ Install dependencies lebih cepat
- ✅ Kompatibel dengan semua server Linux
- ✅ Performance sama dengan bcrypt
- ✅ API tidak berubah sama sekali
