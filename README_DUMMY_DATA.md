# PHC Dashboard - Dummy Data Setup

Script ini menambahkan data dummy yang komprehensif untuk semua tabel dalam database PHC Dashboard dan Mobile App.

## 📋 Data yang Ditambahkan

### 🏥 Dashboard Data
- **5 Clinics** - Rumah sakit PHC di berbagai kota
- **8 Doctors** - Dokter dengan berbagai spesialisasi
- **8 Polyclinics** - Poli-poli layanan kesehatan
- **5 Insurance Companies** - Perusahaan asuransi
- **5 Companies** - Perusahaan mitra
- **8 Treatments** - Jenis perawatan medis
- **8 ICD Codes** - Kode diagnosis penyakit
- **8 Patients** - Data pasien
- **8 Visits** - Kunjungan pasien
- **8 Examinations** - Pemeriksaan medis
- **5 Additional Users** - Staff dan admin

### 📱 Mobile App Data
- **10 Additional Food Items** - Makanan tambahan dalam database
- **8 Additional Missions** - Mission tambahan untuk mobile app
- **8 User Missions** - Data mission user (user_id 1)

- **8 Mood Tracking** - Data tracking mood
- **8 Water Tracking** - Data tracking air minum
- **1 User Water Settings** - Pengaturan air minum user
- **8 Sleep Tracking** - Data tracking tidur
- **9 Meal Logging** - Data logging makanan
- **7 Meal Tracking** - Data tracking makanan
- **5 Meal Foods** - Makanan dalam meal
- **8 Fitness Tracking** - Data tracking fitness
- **5 User Quick Foods** - Makanan favorit user
- **3 Chats** - Data chat
- **6 Chat Messages** - Pesan chat
- **4 Consultations** - Data konsultasi
- **8 Health Data** - Data kesehatan
- **2 Assessments** - Data assessment

## 🚀 Cara Menjalankan

### Metode 1: Menggunakan Script Shell (Recommended)

```bash
# Pastikan Anda berada di direktori dash-app
cd dash-app

# Jalankan script
chmod +x scripts/run-dummy-data.sh
./scripts/run-dummy-data.sh
```

### Metode 2: Menggunakan Node.js Script Langsung

```bash
# Pastikan Anda berada di direktori dash-app
cd dash-app

# Install dependencies jika belum
npm install mysql2

# Jalankan script
node scripts/add-dummy-data.js
```

### Metode 3: Menggunakan SQL File Langsung

```bash
# Masuk ke MySQL
mysql -u root -p

# Jalankan SQL file
source init-scripts/17-add-dummy-data.sql
```

## ⚙️ Konfigurasi Database

Script akan menggunakan konfigurasi default berikut:
- **Host**: localhost
- **User**: root
- **Password**: (kosong)
- **Database**: phc_dashboard
- **Port**: 3306

Anda dapat mengubah konfigurasi dengan environment variables:

```bash
export DB_HOST=your_host
export DB_USER=your_user
export DB_PASSWORD=your_password
export DB_NAME=your_database
export DB_PORT=your_port
```

## 🔐 Akun Login

Setelah menjalankan script, Anda dapat login dengan akun berikut:

### Dashboard Access
- **Super Admin**: `superadmin@phc.com` / `password`
- **Admin Jakarta**: `admin.jakarta@phc.com` / `password`
- **Staff Bandung**: `staff.bandung@phc.com` / `password`
- **Doctor Surabaya**: `doctor.surabaya@phc.com` / `password`
- **Admin Medan**: `admin.medan@phc.com` / `password`
- **Staff Makassar**: `staff.makassar@phc.com` / `password`

### Mobile App Data
Data mobile app tersedia untuk `user_id 1` dengan berbagai tracking data seperti:
- Mission progress
- Mood tracking
- Water intake
- Sleep tracking
- Meal logging
- Fitness activities
- Health data

## 📊 Struktur Data

### Clinics
- RS PHC Jakarta Pusat
- RS PHC Bandung
- RS PHC Surabaya
- RS PHC Medan
- RS PHC Makassar

### Doctors (dengan spesialisasi)
- Dr. Sarah Johnson (Kardiologi)
- Dr. Ahmad Rahman (Bedah Umum)
- Dr. Maria Garcia (Pediatri)
- Dr. Budi Santoso (Neurologi)
- Dr. Lisa Chen (Dermatologi)
- Dr. Rudi Hartono (Ortopedi)
- Dr. Siti Aminah (Ginekologi)
- Dr. John Smith (Pulmonologi)

### Patients
- Ahmad Fauzi
- Sarah Johnson
- Budi Santoso
- Maria Garcia
- Rudi Hartono
- Lisa Chen
- Ahmad Rahman
- Siti Nurhaliza

### Missions (Mobile App)
- Drink Water (Minum 8 gelas air per hari)
- Walk 10,000 Steps (Berjalan 10,000 langkah per hari)
- Eat Vegetables (Makan sayuran 3 kali per hari)
- Sleep 8 Hours (Tidur 8 jam per malam)
- Exercise 30 Minutes (Olahraga 30 menit per hari)
- Meditate 10 Minutes (Meditasi 10 menit per hari)
- Read Health Article (Baca artikel kesehatan 1 per hari)
- Take Vitamins (Minum vitamin sesuai anjuran)

## 🔧 Troubleshooting

### Error: "Database connection failed"
- Pastikan MySQL server berjalan
- Periksa konfigurasi database
- Pastikan database `phc_dashboard` sudah dibuat

### Error: "Table doesn't exist"
- Jalankan script setup database terlebih dahulu:
  ```bash
  mysql -u root -p < init-scripts/00-complete-setup.sql
  ```

### Error: "Access denied"
- Periksa username dan password database
- Pastikan user memiliki akses ke database

## 📝 Notes

- Script menggunakan `INSERT IGNORE` untuk menghindari duplikasi data
- Data dummy dibuat dengan tanggal yang relevan (Januari 2024)
- Semua password menggunakan hash bcrypt default
- Data mobile app fokus pada `user_id 1` untuk testing

## 🎯 Manfaat

1. **Testing Dashboard** - Data lengkap untuk testing semua fitur dashboard
2. **Testing Mobile App** - Data tracking untuk testing fitur mobile
3. **Demo** - Data realistis untuk demo aplikasi
4. **Development** - Data konsisten untuk development

## 📞 Support

Jika mengalami masalah, periksa:
1. Log error di console
2. Konfigurasi database
3. Status MySQL server
4. Permissions database user 