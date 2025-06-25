# Konfigurasi Session Management

## Overview

Sistem session management dalam aplikasi ini mengatur durasi login user dan otomatis logout user saat tidak ada aktivitas dalam periode tertentu.

## Konfigurasi Saat Ini

**Session Timeout**: **1 jam (60 menit)**

## File yang Mengatur Session

### 1. Middleware (`middleware.js`)

Mengatur session timeout di level server-side untuk proteksi route:

```javascript
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 jam (60 menit)
```

**Fungsi:**

- Memeriksa `lastActivity` cookie pada setiap request
- Redirect ke login jika session expired
- Update `lastActivity` cookie saat user masih aktif

### 2. Providers (`components/Providers.jsx`)

Mengatur session timeout di level client-side untuk user experience:

```javascript
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 jam (60 menit)
```

**Fungsi:**

- Track aktivitas user (mouse, keyboard, click, scroll)
- Cek session timeout setiap 30 detik
- Tampilkan notifikasi saat session expired
- Auto logout dan redirect ke login

## Cara Kerja Session Management

### 1. Activity Tracking

System akan track aktivitas user melalui:

- **Mouse movement** (`mousemove`)
- **Keyboard input** (`keypress`)
- **Click events** (`click`)
- **Scroll events** (`scroll`)

### 2. Session Validation

- **Server-side**: Middleware check setiap request
- **Client-side**: Interval check setiap 30 detik
- **Cookie**: `lastActivity` menyimpan timestamp terakhir

### 3. Session Expiry Flow

1. User tidak aktif selama 1 jam
2. System detect session expired
3. Auto logout user
4. Clear cookies dan session data
5. Redirect ke halaman login
6. Tampilkan notifikasi: "Sesi Anda telah berakhir. Silakan login kembali."

## Riwayat Perubahan

| Tanggal | Durasi    | Keterangan                         |
| ------- | --------- | ---------------------------------- |
| Awal    | 5 menit   | Default setting untuk testing      |
| Terbaru | **1 jam** | Update sesuai kebutuhan production |

## Mengubah Session Timeout

Untuk mengubah durasi session, edit kedua file berikut:

### 1. Update Middleware

```javascript
// middleware.js
const SESSION_TIMEOUT = [DURASI] * 60 * 1000; // dalam milidetik
```

### 2. Update Providers

```javascript
// components/Providers.jsx
const SESSION_TIMEOUT = [DURASI] * 60 * 1000; // dalam milidetik
```

### Contoh Durasi Umum:

- **15 menit**: `15 * 60 * 1000`
- **30 menit**: `30 * 60 * 1000`
- **1 jam**: `60 * 60 * 1000`
- **2 jam**: `2 * 60 * 60 * 1000`
- **4 jam**: `4 * 60 * 60 * 1000`
- **8 jam**: `8 * 60 * 60 * 1000`

## Security Considerations

### 1. Auto Logout

- Melindungi akun dari akses unauthorized
- Mencegah session hijacking pada device shared
- Compliance dengan standar security

### 2. Activity Detection

- Real-time detection aktivitas user
- Granular tracking untuk akurasi
- Tidak mengganggu user experience

### 3. Server-Client Sync

- Double validation (server + client)
- Consistent session state
- Graceful handling session conflicts

## Best Practices

### 1. Development Environment

- Gunakan session pendek (5-15 menit) untuk testing
- Easy logout untuk development workflow
- Console logging untuk debugging

### 2. Production Environment

- Session yang reasonable (30 menit - 2 jam)
- Balance antara security dan user experience
- Monitor session patterns

### 3. User Experience

- Clear notification saat session expired
- Auto-save data sebelum logout
- Remember last page untuk redirect after login

## Troubleshooting

### Session Expired Terlalu Cepat

- Cek apakah activity tracking berfungsi
- Pastikan kedua file (middleware + providers) sinkron
- Validasi cookie `lastActivity` tersimpan

### Session Tidak Expired

- Cek logic validation di middleware
- Pastikan interval check berjalan
- Debug dengan console.log timestamp

### Auto Logout Tidak Berfungsi

- Cek network request ke `/api/auth/logout`
- Pastikan error handling tidak memblokir logout
- Validasi cookie clearing process

## Monitoring & Analytics

### 1. Session Duration Metrics

- Average session length
- Peak activity hours
- User behavior patterns

### 2. Security Metrics

- Session timeout frequency
- Concurrent sessions per user
- Suspicious activity detection

### 3. Performance Impact

- Cookie storage size
- Client-side memory usage
- Server-side validation overhead
