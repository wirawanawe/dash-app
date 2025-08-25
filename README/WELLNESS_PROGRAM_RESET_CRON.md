# Wellness Program Reset Cron Job Setup

## Overview
Sistem ini secara otomatis mereset program wellness yang sudah melewati tanggal berakhirnya. Ketika program wellness berakhir, sistem akan:

1. **Menyimpan data program ke history** - Semua aktivitas, misi, dan metrik kesehatan disimpan
2. **Reset status program** - `wellness_program_joined` diubah menjadi `FALSE`
3. **Hapus data program aktif** - Semua field program di-clear (join_date, duration, end_date, dll)
4. **User harus mendaftar ulang** - User perlu setup program wellness baru

## Files Created

### 1. API Endpoint
- **File**: `dash-app/app/api/mobile/wellness/reset-expired-programs/route.js`
- **Function**: Manual reset endpoint untuk admin
- **Methods**: 
  - `GET` - Check expired programs
  - `POST` - Reset expired programs

### 2. Automatic Reset Script
- **File**: `dash-app/scripts/reset-expired-wellness-programs.js`
- **Function**: Script untuk reset otomatis
- **Usage**: Can be run manually or via cron job

### 3. Cron Job Script
- **File**: `dash-app/scripts/run-wellness-reset-cron.sh`
- **Function**: Shell script wrapper untuk cron job
- **Features**: Logging, error handling, environment setup

## Setup Instructions

### 1. Environment Variables
Set environment variables sesuai dengan konfigurasi database Anda:

```bash
export DB_HOST="localhost"
export DB_USER="root"
export DB_PASSWORD="your_password"
export DB_NAME="phc_dashboard"
export DB_PORT="3306"
```

### 2. Manual Testing
Test script secara manual terlebih dahulu:

```bash
# Masuk ke direktori dash-app
cd dash-app

# Test script reset
node scripts/reset-expired-wellness-programs.js

# Test shell script
./scripts/run-wellness-reset-cron.sh
```

### 3. Setup Cron Job

#### Option A: Daily Reset (Recommended)
```bash
# Edit crontab
crontab -e

# Add this line to run daily at 2 AM
0 2 * * * /path/to/phc-mobile/dash-app/scripts/run-wellness-reset-cron.sh
```

#### Option B: Multiple Times Daily
```bash
# Run every 6 hours
0 */6 * * * /path/to/phc-mobile/dash-app/scripts/run-wellness-reset-cron.sh

# Run every 12 hours
0 */12 * * * /path/to/phc-mobile/dash-app/scripts/run-wellness-reset-cron.sh
```

#### Option C: Custom Schedule
```bash
# Run at specific times (e.g., 6 AM and 6 PM)
0 6,18 * * * /path/to/phc-mobile/dash-app/scripts/run-wellness-reset-cron.sh
```

### 4. Verify Cron Job
```bash
# Check if cron job is active
crontab -l

# Check logs
tail -f dash-app/logs/wellness-reset-cron.log
```

## Monitoring

### 1. Log Files
- **Location**: `dash-app/logs/wellness-reset-cron.log`
- **Rotation**: Automatically cleaned up after 30 days
- **Format**: Timestamp + message

### 2. Database Logs
- **Table**: `wellness_program_reset_logs`
- **Contains**: Reset summary, success/error counts, detailed results
- **Query**: 
```sql
SELECT * FROM wellness_program_reset_logs 
ORDER BY reset_date DESC 
LIMIT 10;
```

### 3. Check Expired Programs
```bash
# Via API
curl -X GET "http://localhost:3000/api/mobile/wellness/reset-expired-programs"

# Via Database
SELECT 
  id, name, email, wellness_program_end_date,
  DATEDIFF(NOW(), wellness_program_end_date) as days_expired
FROM mobile_users 
WHERE wellness_program_joined = TRUE 
  AND wellness_program_end_date < NOW()
  AND wellness_program_completed = FALSE;
```

## API Endpoints

### 1. Check Expired Programs
```http
GET /api/mobile/wellness/reset-expired-programs
```

**Response:**
```json
{
  "success": true,
  "data": {
    "expired_count": 5,
    "expired_users": [
      {
        "user_id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "join_date": "2024-01-01T00:00:00.000Z",
        "end_date": "2024-01-31T00:00:00.000Z",
        "days_expired": 3,
        "program_cycles": 1
      }
    ]
  }
}
```

### 2. Reset Expired Programs
```http
POST /api/mobile/wellness/reset-expired-programs
```

**Response:**
```json
{
  "success": true,
  "message": "Reset process completed. 5 programs reset successfully, 0 errors.",
  "data": {
    "reset_count": 5,
    "error_count": 0,
    "users_reset": [
      {
        "user_id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "status": "success",
        "message": "Program expired and reset successfully"
      }
    ]
  }
}
```

## Troubleshooting

### 1. Script Not Found
```bash
# Check if script exists
ls -la dash-app/scripts/reset-expired-wellness-programs.js

# Check permissions
chmod +x dash-app/scripts/run-wellness-reset-cron.sh
```

### 2. Database Connection Error
```bash
# Check database credentials
mysql -u root -p phc_dashboard

# Test connection from script
node -e "
const mysql = require('mysql2/promise');
const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'phc_dashboard'
});
console.log('Connection successful');
await connection.end();
"
```

### 3. Cron Job Not Running
```bash
# Check cron service
sudo systemctl status cron

# Check cron logs
sudo tail -f /var/log/cron

# Test cron job manually
/path/to/phc-mobile/dash-app/scripts/run-wellness-reset-cron.sh
```

### 4. Permission Issues
```bash
# Make script executable
chmod +x dash-app/scripts/run-wellness-reset-cron.sh

# Check file ownership
ls -la dash-app/scripts/

# Fix ownership if needed
sudo chown your_user:your_group dash-app/scripts/run-wellness-reset-cron.sh
```

## Integration with Existing System

### 1. Automatic Reset on Program Check
Ketika user mengakses endpoint `/api/mobile/wellness/check-program-status`, sistem akan otomatis:

1. Deteksi program yang sudah expired
2. Mark program sebagai completed
3. Reset `wellness_program_joined` ke `FALSE`
4. User perlu setup program baru

### 2. User Experience
- **Program Active**: User dapat menggunakan fitur wellness normal
- **Program Expired**: User akan melihat pesan "Program selesai, daftar program baru"
- **Program Reset**: User perlu setup ulang dengan data baru

### 3. Data Preservation
- **History**: Semua data program disimpan di `wellness_program_history`
- **Cycles**: Jumlah siklus program di-increment
- **Health Data**: Data kesehatan (weight, height) tetap tersimpan

## Security Considerations

### 1. Database Access
- Script menggunakan environment variables untuk credentials
- Tidak ada hardcoded passwords
- Connection pooling untuk efisiensi

### 2. Logging
- Semua aktivitas reset di-log
- Error handling yang comprehensive
- Log rotation untuk mencegah disk space issues

### 3. Error Handling
- Script tidak crash jika ada error pada satu user
- Continue processing other users
- Detailed error reporting

## Performance Considerations

### 1. Batch Processing
- Process users satu per satu untuk avoid memory issues
- Transaction handling untuk data consistency
- Connection reuse untuk efisiensi

### 2. Database Indexes
Pastikan index berikut sudah ada:
```sql
CREATE INDEX idx_wellness_program_joined ON mobile_users(wellness_program_joined);
CREATE INDEX idx_wellness_program_end_date ON mobile_users(wellness_program_end_date);
CREATE INDEX idx_wellness_program_completed ON mobile_users(wellness_program_completed);
```

### 3. Monitoring
- Monitor log file size
- Check database performance impact
- Track reset frequency and success rate
