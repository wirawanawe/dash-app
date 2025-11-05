# Konfigurasi Session Management

## Overview

Sistem ini menggunakan **stateless authentication** dengan JWT token. Server tidak menyimpan session dan selalu dalam keadaan up. Hanya user yang memiliki session di client side (JWT token).

## Konfigurasi Saat Ini

**Authentication Method**: **JWT Token Only (Stateless)**
**Session Timeout**: **Tidak ada** (Server stateless, hanya JWT token expiry yang berlaku)

## File yang Mengatur Authentication

### 1. Middleware (`middleware.js`)

Server-side JWT verification untuk proteksi route:

```javascript
// Stateless - hanya verify JWT token
const payload = await verifyJwtToken(token.value);
```

**Fungsi:**

- Verify JWT token pada setiap request
- Redirect ke login jika token invalid/expired
- Tidak menyimpan session atau activity tracking

### 2. Providers (`components/Providers.jsx`)

Client-side authentication state management:

```javascript
// Stateless authentication - no session tracking on client
```

**Fungsi:**

- Manage user authentication state
- Handle login/logout
- Tidak ada activity tracking
- Tidak ada auto-logout berdasarkan waktu

## Cara Kerja Stateless Authentication

### 1. JWT Token Based

System menggunakan JWT token untuk authentication:

- **Access Token**: Token dengan expiry (90 hari untuk web, 7-30 hari untuk mobile)
- **Refresh Token**: Token untuk mendapatkan access token baru (365 hari)
- **No Activity Tracking**: Server tidak track aktivitas user
- **No Session Storage**: Server tidak menyimpan session

### 2. Token Validation

- **Server-side**: Middleware verify JWT token setiap request
- **Client-side**: Token disimpan di cookie/storage
- **No Auto-Logout**: User tidak akan logout otomatis karena inactivity

### 3. Authentication Flow

1. User login → Dapatkan JWT token
2. Token disimpan di cookie/storage
3. Setiap request → Token dikirim ke server
4. Server verify token → Allow/Deny access
5. Token expired → User perlu login lagi
6. Manual logout → Token dihapus dari client

## Riwayat Perubahan

| Tanggal     | Method                  | Keterangan                                    |
| ----------- | ----------------------- | --------------------------------------------- |
| Awal        | Session (5 menit)       | Default setting untuk testing                 |
| Update 1    | Session (1 jam)         | Update sesuai kebutuhan production            |
| **Terbaru** | **JWT Only (Stateless)** | **Server stateless, no session timeout**      |

## Mengubah JWT Token Expiry

Untuk mengubah durasi JWT token, edit file backend:

### Backend Auth Routes

```javascript
// backend/routes/auth.js atau app/api/auth/login/route.js
const generateToken = (userId) => {
  return jwt.sign({ userId }, jwtSecret, {
    expiresIn: "90d", // Ubah sesuai kebutuhan
  });
};
```

### Contoh Durasi JWT Umum:

- **7 hari**: `"7d"`
- **30 hari**: `"30d"`
- **90 hari**: `"90d"` (current web)
- **365 hari**: `"365d"`

## Security Considerations

### 1. JWT Token Security

- Token harus disimpan dengan aman (httpOnly cookies untuk web)
- Token expired otomatis berdasarkan waktu yang ditentukan
- Refresh token untuk mendapatkan access token baru tanpa login ulang

### 2. Stateless Benefits

- Server tidak perlu menyimpan session data
- Scalable - server bisa di-scale horizontal tanpa masalah
- No session hijacking karena tidak ada session storage
- Server selalu up, tidak ada session timeout

### 3. Token Validation

- Setiap request divalidasi dengan JWT verification
- Invalid/expired token akan ditolak otomatis
- User harus login ulang jika token expired

## Best Practices

### 1. Development Environment

- Gunakan JWT dengan expiry lebih pendek untuk testing (7 hari)
- Easy logout untuk development workflow
- Console logging untuk debugging token issues

### 2. Production Environment

- JWT expiry yang reasonable (30-90 hari untuk web, 7-30 hari untuk mobile)
- Implement refresh token untuk seamless user experience
- Monitor JWT expiration dan token validation failures

### 3. User Experience

- User tetap login selama JWT masih valid
- Tidak ada auto-logout karena inactivity
- Clear notification saat token expired
- Refresh token untuk perpanjang session tanpa login ulang

## Troubleshooting

### Token Expired Terlalu Cepat

- Cek JWT expiry setting di backend
- Pastikan JWT_SECRET konsisten
- Validasi token generation logic

### Token Tidak Expired

- Cek JWT expiry time setting
- Pastikan token validation berjalan
- Debug dengan decode JWT token

### User Tidak Bisa Access Protected Routes

- Cek apakah token tersimpan di cookie
- Validasi JWT token di middleware
- Pastikan token belum expired
- Check browser console untuk error

## Monitoring & Analytics

### 1. Token Usage Metrics

- Token generation frequency
- Token expiration rate
- Refresh token usage patterns

### 2. Security Metrics

- Failed token validations
- Expired token attempts
- Suspicious token activity

### 3. Performance Impact

- Stateless server - minimal overhead
- No session storage required
- Fast token verification
- Scalable architecture
