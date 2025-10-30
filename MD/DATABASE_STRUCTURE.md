# Struktur Database Cache

Dokumentasi lengkap struktur tabel cache dan mapping data dari API eksternal.

## 📊 Tabel Cache

### 1. `visits_cache`

Menyimpan data kunjungan dari API eksternal.

#### Struktur Kolom

| Kolom | Tipe | Deskripsi | Sumber API |
|-------|------|-----------|------------|
| `id` | INT | Primary key (auto increment) | Local |
| `external_id` | VARCHAR(100) | ID unik dari API | `visit.ID` atau `visit.No_Kunjungan` |
| `visit_number` | VARCHAR(100) | Nomor kunjungan | `visit.No_Kunjungan` |
| `unique_id` | VARCHAR(100) | ID unik | `visit.ID` |
| **Patient Info** ||||
| `patient_nik` | VARCHAR(100) | NIK pasien | `visit.Pasien[0].NIK` |
| `patient_name` | VARCHAR(255) | Nama pasien | `visit.Pasien[0].Nama_Pasien` |
| `patient_nip` | VARCHAR(100) | NIP pasien | `visit.Pasien[0].NIP` |
| `patient_no_peserta` | VARCHAR(100) | No peserta BPJS | `visit.Pasien[0].No_Peserta` |
| `patient_nama_peserta` | VARCHAR(255) | Nama peserta BPJS | `visit.Pasien[0].Nama_Peserta` |
| `patient_gender` | VARCHAR(50) | Jenis kelamin | `visit.Pasien[0].Jenis_Kelamin` |
| `patient_birth_date` | DATE | Tanggal lahir | `visit.Pasien[0].Tgl_Lahir` |
| `patient_department` | VARCHAR(255) | Bagian/Departemen | `visit.Pasien[0].Bagian` |
| **Visit Info** ||||
| `diagnosis` | TEXT | Diagnosis | `visit.Diagnosa` |
| `complaint` | TEXT | Keluhan | `visit.Diagnosa` |
| `treatment` | TEXT | Tindakan | - |
| `notes` | TEXT | Catatan | - |
| `assessment` | TEXT | Assessment | - |
| `status` | VARCHAR(50) | Status kunjungan | Default: 'Selesai' |
| `clinic` | VARCHAR(255) | Nama klinik | `visit.Klinik` |
| `room` | VARCHAR(255) | Ruangan | `visit.Klinik` |
| `visit_date` | DATE | Tanggal kunjungan | `visit.Tgl_Kunjungan` |
| `visit_time` | TIME | Waktu kunjungan | - |
| **Doctor Info** ||||
| `doctor_name` | VARCHAR(255) | Nama dokter | `visit.Dokter` |
| `doctor_id` | VARCHAR(100) | ID dokter | - |
| **Facility Info** ||||
| `facility_code` | VARCHAR(100) | Kode faskes | `visit.Fasilitas_Kesehatan[0].Kode` |
| `facility_name` | VARCHAR(255) | Nama faskes | `visit.Fasilitas_Kesehatan[0].Nama_Faskes` |
| **Additional** ||||
| `physical_exam` | JSON | Data pemeriksaan fisik | JSON object |
| `kode_poli` | VARCHAR(100) | Kode poli | - |
| `nama_poli` | VARCHAR(255) | Nama poli | - |
| `no_antrian` | VARCHAR(50) | Nomor antrian | - |
| `jenis_kunjungan` | VARCHAR(100) | Jenis kunjungan | - |
| `cara_bayar` | VARCHAR(100) | Cara pembayaran | - |
| **Audit** ||||
| `external_created_at` | TIMESTAMP | Created date dari API | `visit.audittrail.created_at` |
| `external_updated_at` | TIMESTAMP | Updated date dari API | `visit.audittrail.updated_at` |
| `synced_at` | TIMESTAMP | Waktu sinkronisasi | Auto (NOW()) |
| `updated_at` | TIMESTAMP | Waktu update lokal | Auto (ON UPDATE) |

#### Indexes

- `UNIQUE` pada `external_id`
- `INDEX` pada `visit_number`, `patient_nik`, `patient_name`, `visit_date`, `doctor_name`, `clinic`, `status`

---

### 2. `patients_cache`

Menyimpan data pasien dari API eksternal.

#### Struktur Kolom

| Kolom | Tipe | Deskripsi | Sumber API |
|-------|------|-----------|------------|
| `id` | INT | Primary key | Local |
| `external_id` | VARCHAR(100) | ID dari API | `patient.id` atau `patient.ID` |
| **Basic Info** ||||
| `mrn` | VARCHAR(100) | Medical Record Number | `patient.mrn` atau `patient.MRN` |
| `nik` | VARCHAR(100) | NIK | `patient.nik` atau `patient.NIK` |
| `nip` | VARCHAR(100) | NIP | `patient.nip` atau `patient.NIP` |
| `name` | VARCHAR(255) | Nama lengkap | `patient.name` atau `patient.NAMA` |
| `birth_date` | DATE | Tanggal lahir | `patient.birthDate` atau `patient.TANGGAL_LAHIR` |
| `birth_place` | VARCHAR(255) | Tempat lahir | `patient.birthPlace` |
| `gender` | VARCHAR(50) | Jenis kelamin | `patient.gender` atau `patient.JENIS_KELAMIN` |
| `age` | INT | Umur | Calculated |
| **Contact Info** ||||
| `address` | TEXT | Alamat lengkap | `patient.address` atau `patient.ALAMAT` |
| `rt` | VARCHAR(10) | RT | - |
| `rw` | VARCHAR(10) | RW | - |
| `kelurahan` | VARCHAR(100) | Kelurahan | - |
| `kecamatan` | VARCHAR(100) | Kecamatan | - |
| `kota` | VARCHAR(100) | Kota | - |
| `provinsi` | VARCHAR(100) | Provinsi | - |
| `kode_pos` | VARCHAR(20) | Kode pos | - |
| `phone` | VARCHAR(50) | Telepon | `patient.phone` atau `patient.TELEPON` |
| `email` | VARCHAR(100) | Email | `patient.email` atau `patient.EMAIL` |
| **Medical Info** ||||
| `blood_type` | VARCHAR(10) | Golongan darah | `patient.bloodType` atau `patient.GOLONGAN_DARAH` |
| `rhesus` | VARCHAR(10) | Rhesus | - |
| `religion` | VARCHAR(50) | Agama | `patient.religion` atau `patient.AGAMA` |
| `marital_status` | VARCHAR(50) | Status perkawinan | `patient.maritalStatus` atau `patient.STATUS_PERKAWINAN` |
| `occupation` | VARCHAR(100) | Pekerjaan | `patient.occupation` atau `patient.PEKERJAAN` |
| `education` | VARCHAR(100) | Pendidikan | - |
| **Insurance Info** ||||
| `insurance` | VARCHAR(100) | Asuransi | `patient.insurance` atau `patient.ASURANSI` |
| `insurance_number` | VARCHAR(100) | No asuransi | - |
| `no_peserta` | VARCHAR(100) | No peserta BPJS | - |
| `nama_peserta` | VARCHAR(255) | Nama peserta BPJS | - |
| `jenis_peserta` | VARCHAR(100) | Jenis peserta | - |
| `faskes_tingkat_1` | VARCHAR(255) | Faskes tingkat 1 | - |
| `kelas_rawat` | VARCHAR(50) | Kelas rawat | - |
| **Emergency** ||||
| `emergency_contact` | VARCHAR(255) | Kontak darurat | `patient.emergencyContact` |
| `emergency_phone` | VARCHAR(50) | Telepon kontak darurat | - |
| `emergency_relation` | VARCHAR(100) | Hubungan | - |
| **Additional** ||||
| `status` | VARCHAR(50) | Status | `patient.status` atau `patient.STATUS` |
| `clinic_id` | INT | ID klinik | `patient.clinic_id` |
| `bagian` | VARCHAR(255) | Bagian | - |
| `foto_url` | VARCHAR(500) | URL foto | - |
| **Audit** ||||
| `external_created_at` | TIMESTAMP | Created dari API | `patient.created_at` |
| `external_updated_at` | TIMESTAMP | Updated dari API | `patient.updated_at` |
| `synced_at` | TIMESTAMP | Waktu sync | Auto |
| `updated_at` | TIMESTAMP | Waktu update | Auto |

#### Indexes

- `UNIQUE` pada `external_id`
- `INDEX` pada `mrn`, `nik`, `nip`, `name`, `no_peserta`, `status`, `clinic_id`

---

### 3. `sync_logs`

Log operasi sinkronisasi.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | INT | Primary key |
| `entity_type` | ENUM | 'visits', 'patients', 'doctors', 'clinics', 'all' |
| `status` | ENUM | 'started', 'in_progress', 'completed', 'failed' |
| `records_fetched` | INT | Jumlah record yang diambil |
| `records_inserted` | INT | Jumlah record baru |
| `records_updated` | INT | Jumlah record diupdate |
| `error_message` | TEXT | Pesan error jika failed |
| `started_at` | TIMESTAMP | Waktu mulai |
| `completed_at` | TIMESTAMP | Waktu selesai |
| `duration_seconds` | INT | Durasi dalam detik |

---

### 4. `sync_schedules`

Konfigurasi jadwal sinkronisasi.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | INT | Primary key |
| `entity_type` | ENUM | Type entity |
| `is_enabled` | BOOLEAN | Aktif/tidak |
| `interval_minutes` | INT | Interval sync (menit) |
| `last_sync_at` | TIMESTAMP | Sync terakhir |
| `next_sync_at` | TIMESTAMP | Sync berikutnya |

**Default Values:**
- visits: 30 minutes
- patients: 60 minutes
- doctors: 120 minutes
- clinics: 120 minutes

---

## 🔄 Mapping Data API ke Database

### Visits API Response Format

```json
{
  "ID": "12345",
  "No_Kunjungan": "KUN/2024/00001",
  "Tgl_Kunjungan": "2024-10-30",
  "Diagnosa": "Demam",
  "Klinik": "Poli Umum",
  "Dokter": "Dr. John Doe",
  "Pasien": [{
    "NIK": "1234567890123456",
    "Nama_Pasien": "John Doe",
    "NIP": "198001011234",
    "No_Peserta": "0001234567890",
    "Nama_Peserta": "John Doe",
    "Jenis_Kelamin": "Laki-laki",
    "Tgl_Lahir": "1980-01-01",
    "Bagian": "IT"
  }],
  "Fasilitas_Kesehatan": [{
    "Kode": "001",
    "Nama_Faskes": "RS Example"
  }],
  "audittrail": {
    "created_at": "2024-10-30 10:00:00",
    "updated_at": "2024-10-30 10:00:00"
  }
}
```

### Patients API Response Format

```json
{
  "id": "12345",
  "mrn": "MR001",
  "nik": "1234567890123456",
  "name": "John Doe",
  "birthDate": "1980-01-01",
  "gender": "Laki-laki",
  "phone": "081234567890",
  "address": "Jl. Example No. 123",
  "insurance": "BPJS",
  "status": "active"
}
```

---

## 📦 Views & Stored Procedures

### Views

#### `v_visits_summary`
View ringkasan visits dengan info tambahan (year, month, day).

```sql
SELECT * FROM v_visits_summary WHERE visit_year = 2024;
```

#### `v_visits_stats`
Statistik visits per hari.

```sql
SELECT * FROM v_visits_stats WHERE date >= '2024-01-01';
```

#### `v_patients_summary`
Ringkasan patients dengan kalkulasi umur.

```sql
SELECT * FROM v_patients_summary WHERE age_calculated >= 18;
```

### Stored Procedures

#### `sp_get_visits_by_nik(p_nik)`
Mendapatkan semua visits berdasarkan NIK pasien.

```sql
CALL sp_get_visits_by_nik('1234567890123456');
```

#### `sp_get_sync_statistics()`
Mendapatkan statistik sinkronisasi.

```sql
CALL sp_get_sync_statistics();
```

#### `sp_cleanup_old_logs(days_to_keep)`
Cleanup log lama.

```sql
CALL sp_cleanup_old_logs(30); -- Hapus log > 30 hari
```

---

## 🚀 Setup Instructions

### Step 1: Create/Update Tables

```bash
# Via MySQL CLI
mysql -u root -p phc_dashboard < init-scripts/28-update-cache-tables.sql

# Or via phpMyAdmin
# Import file: init-scripts/28-update-cache-tables.sql
```

### Step 2: Verify Tables

```sql
-- Check tables created
SHOW TABLES LIKE '%cache%';

-- Check structure
DESCRIBE visits_cache;
DESCRIBE patients_cache;

-- Check views
SHOW FULL TABLES WHERE TABLE_TYPE LIKE 'VIEW';

-- Check procedures
SHOW PROCEDURE STATUS WHERE Db = 'phc_dashboard';
```

### Step 3: Initial Sync

```bash
node scripts/auto-sync-data.js all
```

### Step 4: Verify Data

```sql
-- Check data count
SELECT COUNT(*) as total_visits FROM visits_cache;
SELECT COUNT(*) as total_patients FROM patients_cache;

-- Check latest sync
SELECT * FROM sync_logs ORDER BY started_at DESC LIMIT 5;

-- Use views
SELECT * FROM v_visits_stats ORDER BY date DESC LIMIT 10;

-- Use procedures
CALL sp_get_sync_statistics();
```

---

## 🔍 Query Examples

### Get visits by date range

```sql
SELECT * FROM visits_cache
WHERE visit_date BETWEEN '2024-01-01' AND '2024-12-31'
ORDER BY visit_date DESC;
```

### Get visits by patient

```sql
CALL sp_get_visits_by_nik('1234567890123456');

-- Or direct query
SELECT * FROM visits_cache
WHERE patient_nik = '1234567890123456'
ORDER BY visit_date DESC;
```

### Get daily statistics

```sql
SELECT * FROM v_visits_stats
WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
ORDER BY date DESC;
```

### Get patients by criteria

```sql
SELECT * FROM patients_cache
WHERE gender = 'Laki-laki'
  AND TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) >= 18
ORDER BY name;
```

---

## 🧹 Maintenance

### Cleanup old data

```sql
-- Delete visits older than 2 years
DELETE FROM visits_cache
WHERE visit_date < DATE_SUB(CURDATE(), INTERVAL 2 YEAR);

-- Delete old sync logs
CALL sp_cleanup_old_logs(90);
```

### Rebuild indexes

```sql
OPTIMIZE TABLE visits_cache;
OPTIMIZE TABLE patients_cache;
```

### Check table size

```sql
SELECT 
  TABLE_NAME,
  ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS 'Size (MB)',
  TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'phc_dashboard'
  AND TABLE_NAME LIKE '%cache%';
```

---

## 📝 Notes

- Semua VARCHAR size sudah disesuaikan dengan data real dari API
- Indexes dibuat untuk kolom yang sering di-query
- Views untuk kemudahan reporting
- Stored procedures untuk operasi umum
- Timestamp tracking untuk audit

---

**Last Updated:** 2024
**Version:** 1.0

