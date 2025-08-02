# Google Authentication Integration dengan Mobile Users

## Overview

Sistem ini mengintegrasikan Google Authentication dengan tabel `mobile_users` sehingga user yang login melalui Google akan otomatis terdaftar di database dan dapat melengkapi data profile mereka.

## Endpoints

### 1. Google Authentication
**POST** `/api/mobile/auth/google`

**Request Body:**
```json
{
  "google_user_id": "google_user_1753800204311",
  "name": "John Doe",
  "email": "john@example.com",
  "profile_picture": "https://...",
  "phone": "+6281234567890",
  "date_of_birth": "1990-01-01",
  "gender": "male",
  "height": 170.5,
  "weight": 70.0,
  "blood_type": "O+",
  "emergency_contact_name": "Jane Doe",
  "emergency_contact_phone": "+6281234567891"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registrasi Google berhasil",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+6281234567890",
      "date_of_birth": "1990-01-01",
      "gender": "male",
      "height": 170.5,
      "weight": 70.0,
      "blood_type": "O+"
    },
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "isNewUser": true
  }
}
```

### 2. Get User Profile
**GET** `/api/mobile/users/profile?user_id=google_user_1753800204311`

**Response:**
```json
{
  "success": true,
  "message": "Profile berhasil diambil",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+6281234567890",
    "date_of_birth": "1990-01-01",
    "gender": "male",
    "height": 170.5,
    "weight": 70.0,
    "blood_type": "O+",
    "emergency_contact_name": "Jane Doe",
    "emergency_contact_phone": "+6281234567891",
    "is_active": 1,
    "created_at": "2024-01-15T10:00:00.000Z",
    "updated_at": "2024-01-15T10:00:00.000Z"
  }
}
```

### 3. Update User Profile
**PUT** `/api/mobile/users/profile/update`

**Request Body:**
```json
{
  "user_id": "google_user_1753800204311",
  "name": "John Doe Updated",
  "phone": "+6281234567890",
  "date_of_birth": "1990-01-01",
  "gender": "male",
  "height": 170.5,
  "weight": 70.0,
  "blood_type": "O+",
  "emergency_contact_name": "Jane Doe",
  "emergency_contact_phone": "+6281234567891"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile berhasil diupdate",
  "data": {
    "id": 1,
    "name": "John Doe Updated",
    "email": "john@example.com",
    "phone": "+6281234567890",
    "date_of_birth": "1990-01-01",
    "gender": "male",
    "height": 170.5,
    "weight": 70.0,
    "blood_type": "O+",
    "emergency_contact_name": "Jane Doe",
    "emergency_contact_phone": "+6281234567891"
  }
}
```

## Cara Kerja

### 1. Google User ID Mapping
- Google user ID disimpan di kolom `password` dengan format `google_<google_user_id>`
- Contoh: `google_user_1753800204311` disimpan sebagai `google_google_user_1753800204311`

### 2. User Registration Flow
1. User login dengan Google di mobile app
2. Mobile app mengirim data Google ke `/api/mobile/auth/google`
3. Sistem mengecek apakah user sudah ada berdasarkan email
4. Jika belum ada, user baru dibuat di tabel `mobile_users`
5. Jika sudah ada, data Google digunakan untuk melengkapi data yang kosong
6. JWT token dikembalikan untuk autentikasi

### 3. Profile Completion
- User dapat melengkapi data profile melalui endpoint `/api/mobile/users/profile/update`
- Data yang dapat dilengkapi: phone, date_of_birth, gender, height, weight, blood_type, emergency_contact_name, emergency_contact_phone

### 4. API Integration
- Semua API mobile menggunakan user_id (Google ID atau mobile_users ID)
- Sistem otomatis mencari mapping yang benar
- Jika user tidak ditemukan, API mengembalikan data kosong atau error yang sesuai

## Database Schema

### mobile_users Table
```sql
CREATE TABLE mobile_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL, -- Google ID disimpan di sini
  date_of_birth DATE,
  gender ENUM('male','female','other'),
  height DECIMAL(5,2),
  weight DECIMAL(5,2),
  blood_type ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-'),
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Error Handling

### Common Errors
1. **User tidak ditemukan**: 404 - User belum terdaftar
2. **Email sudah terdaftar**: 400 - Email sudah digunakan user lain
3. **Phone sudah terdaftar**: 400 - Nomor telepon sudah digunakan user lain
4. **Data tidak valid**: 400 - Format data tidak sesuai (blood_type, gender, dll)

## Security Considerations

1. **JWT Token**: Menggunakan secret key yang aman
2. **Password Storage**: Google ID disimpan sebagai password (tidak di-hash karena bukan password asli)
3. **Input Validation**: Semua input divalidasi sebelum disimpan
4. **SQL Injection**: Menggunakan prepared statements

## Testing

### Test Google Registration
```bash
curl -X POST http://localhost:3001/api/mobile/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "google_user_id": "google_user_1753800204311",
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+6281234567890"
  }'
```

### Test Profile Update
```bash
curl -X PUT http://localhost:3001/api/mobile/users/profile/update \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "google_user_1753800204311",
    "name": "Updated Name",
    "phone": "+6281234567890"
  }'
```

### Test Meal Tracking
```bash
curl "http://localhost:3001/api/mobile/tracking/meal/today?user_id=google_user_1753800204311"
``` 