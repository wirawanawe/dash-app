# Docker Setup untuk PHC Dashboard

Panduan lengkap untuk menjalankan PHC Dashboard menggunakan Docker.

## Prerequisites

- Docker Engine (version 20.10 atau lebih baru)
- Docker Compose (version 2.0 atau lebih baru)
- Port 3000, 3306, dan 8080 harus tersedia di sistem Anda

## Struktur File Docker

```
/
├── Dockerfile              # Konfigurasi Docker untuk Next.js app
├── docker-compose.yml      # Orkestrasi semua services
├── docker.env              # Environment variables untuk Docker
├── .dockerignore           # File yang diabaikan saat build
└── init-scripts/           # Script inisialisasi database
    └── 01-create-tables.sql
```

## Quick Start

### 1. Clone dan Masuk ke Direktori

```bash
git clone <repository-url>
cd dash-app
```

### 2. Konfigurasi Environment

File `docker.env` sudah dikonfigurasi dengan setting default:

- Database: MySQL 8.0
- Database Name: phc_dashboard
- Root Password: rootpassword
- Port: 3000

**Untuk production, ubah password di file `docker.env`:**

```bash
nano docker.env
```

### 3. Jalankan Aplikasi

```bash
# Build dan jalankan semua services
docker-compose up --build

# Atau jalankan di background
docker-compose up -d --build
```

### 4. Akses Aplikasi

- **Aplikasi**: http://localhost:3000
- **phpMyAdmin**: http://localhost:8080
- **Database**: localhost:3306

## Services yang Tersedia

### 1. App (Next.js)

- **Port**: 3000
- **Description**: Aplikasi PHC Dashboard utama
- **Dependencies**: MySQL

### 2. MySQL

- **Port**: 3306
- **Database**: phc_dashboard
- **User**: root
- **Password**: rootpassword (default)

### 3. phpMyAdmin

- **Port**: 8080
- **Description**: Web interface untuk manajemen database
- **Login**: root / rootpassword

## Perintah Docker Compose

### Start Services

```bash
# Jalankan semua services
docker-compose up

# Jalankan di background
docker-compose up -d

# Build ulang dan jalankan
docker-compose up --build
```

### Stop Services

```bash
# Stop semua services
docker-compose down

# Stop dan hapus volumes (HATI-HATI: akan menghapus data database)
docker-compose down -v
```

### Logs

```bash
# Lihat logs semua services
docker-compose logs

# Lihat logs service tertentu
docker-compose logs app
docker-compose logs mysql

# Follow logs real-time
docker-compose logs -f app
```

### Restart Services

```bash
# Restart semua services
docker-compose restart

# Restart service tertentu
docker-compose restart app
```

## Development Mode

Untuk development dengan hot reload:

```bash
# Jalankan hanya database
docker-compose up mysql phpmyadmin

# Jalankan app secara lokal
npm run dev
```

## Troubleshooting

### 1. Port Already in Use

```bash
# Cek port yang digunakan
lsof -i :3000
lsof -i :3306
lsof -i :8080

# Atau ubah port di docker-compose.yml
```

### 2. Database Connection Error

```bash
# Cek status container
docker-compose ps

# Cek logs database
docker-compose logs mysql

# Restart database
docker-compose restart mysql
```

### 3. Build Errors

```bash
# Clean build
docker-compose down
docker system prune -f
docker-compose up --build --force-recreate
```

### 4. Database Tidak Terbuat

```bash
# Hapus volume dan buat ulang
docker-compose down -v
docker-compose up --build
```

## Backup dan Restore Database

### Backup

```bash
# Backup database
docker-compose exec mysql mysqldump -u root -prootpassword phc_dashboard > backup.sql
```

### Restore

```bash
# Restore database
docker-compose exec -i mysql mysql -u root -prootpassword phc_dashboard < backup.sql
```

## Production Deployment

### 1. Ubah Environment Variables

```bash
# Edit docker.env untuk production
nano docker.env

# Ubah minimal:
# - JWT_SECRET ke value yang aman
# - Database passwords
# - NODE_ENV=production
```

### 2. Build untuk Production

```bash
# Build image production
docker-compose -f docker-compose.yml up --build -d

# Cek container berjalan
docker-compose ps
```

### 3. Monitoring

```bash
# Monitor resource usage
docker stats

# Monitor logs
docker-compose logs -f
```

## Struktur Database

Database akan otomatis dibuat dengan tabel-tabel berikut:

- `users` - Data pengguna dan autentikasi
- `doctors` - Data dokter
- `patients` - Data pasien
- `visits` - Data kunjungan pasien
- `examinations` - Data pemeriksaan
- `polyclinics` - Data poliklinik
- `insurances` - Data asuransi
- `companies` - Data perusahaan
- `treatments` - Data tindakan medis
- `icd` - Data kode ICD

## Security Notes

⚠️ **PENTING untuk Production:**

1. Ubah semua password default
2. Gunakan JWT_SECRET yang kuat
3. Konfigurasi firewall yang tepat
4. Backup database secara berkala
5. Monitor logs secara rutin

## Support

Jika mengalami masalah:

1. Cek logs container dengan `docker-compose logs`
2. Pastikan semua port tersedia
3. Restart services dengan `docker-compose restart`
4. Rebuild jika ada perubahan kode dengan `docker-compose up --build`
