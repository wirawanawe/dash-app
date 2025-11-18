# 🔧 Fix: Session 24 Jam - Masalah dan Solusi

## ⚠️ Masalah

User yang sudah login **sebelum perubahan** masih memiliki token lama dengan expiry **1 jam**. Mereka perlu logout dan login ulang untuk mendapatkan token baru dengan expiry **24 jam**.

## ✅ Perubahan yang Sudah Dilakukan

1. **JWT Token Expiry** (`app/api/auth/login/route.js`):
   - ✅ Diubah dari `"1h"` menjadi `"24h"`

2. **Cookie Max Age** (`lib/auth.js`):
   - ✅ Diubah dari `3600` detik (1 jam) menjadi `86400` detik (24 jam)

## 🔄 Solusi untuk User yang Sudah Login

### **Opsi 1: Logout dan Login Ulang (Recommended)**
1. Klik tombol **Logout** di aplikasi
2. Login kembali dengan email dan password
3. Token baru akan memiliki expiry **24 jam**

### **Opsi 2: Clear Cookies Browser**
1. Buka Developer Tools (F12)
2. Buka tab **Application** (Chrome) atau **Storage** (Firefox)
3. Hapus semua cookies untuk domain aplikasi
4. Refresh halaman dan login kembali

### **Opsi 3: Hard Refresh**
1. Tekan `Ctrl + Shift + R` (Windows/Linux) atau `Cmd + Shift + R` (Mac)
2. Login kembali jika diminta

## 🔍 Verifikasi Token Expiry

Untuk memverifikasi token memiliki expiry 24 jam:

1. Login ke aplikasi
2. Buka Developer Tools (F12)
3. Buka tab **Application** → **Cookies**
4. Cari cookie `token`
5. Periksa **Expires** - seharusnya menunjukkan waktu 24 jam dari sekarang

## 📝 Catatan Teknis

- **Cookie `lastActivity`**: Masih di-set tapi **tidak digunakan** untuk session timeout (sistem sudah stateless)
- **JWT Token**: Expiry diatur di token itu sendiri, bukan di cookie
- **Cookie Max Age**: Hanya untuk cookie expiry, tidak mempengaruhi JWT token expiry

## 🚀 Setelah Login Ulang

Setelah logout dan login ulang:
- ✅ Token baru akan memiliki expiry **24 jam**
- ✅ Cookie akan memiliki maxAge **86400 detik** (24 jam)
- ✅ User akan tetap login selama **24 jam** tanpa perlu login ulang

## ⚙️ Konfigurasi Saat Ini

- **JWT Token Expiry**: `24h` (24 jam)
- **Cookie Max Age**: `86400` detik (24 jam)
- **Session Type**: Stateless (JWT only)
- **Auto Logout**: Tidak ada (hanya berdasarkan token expiry)

