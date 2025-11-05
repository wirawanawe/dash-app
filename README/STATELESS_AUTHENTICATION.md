# 🔐 Stateless Authentication Implementation

## Overview

Sistem telah diubah dari **session-based** menjadi **stateless authentication** menggunakan JWT token. Server tidak lagi menyimpan session dan selalu dalam keadaan up. Hanya user yang memiliki session di client side melalui JWT token.

## 🎯 Perubahan Utama

### **Sebelum (Session-Based):**
- ❌ Server menyimpan session data
- ❌ Activity tracking (mouse, keyboard, click, scroll)
- ❌ Auto-logout setelah 1 jam inactivity
- ❌ Session timeout di server dan client
- ❌ `lastActivity` cookie tracking

### **Sekarang (Stateless JWT):**
- ✅ Server tidak menyimpan session
- ✅ Hanya JWT token verification
- ✅ Tidak ada auto-logout karena inactivity
- ✅ User tetap login selama token valid
- ✅ Server scalable dan selalu up

---

## 📁 File yang Diubah

### 1. **Middleware** (`middleware.js`)

**Before:**
```javascript
// Session timeout 1 jam
const SESSION_TIMEOUT = 60 * 60 * 1000;

// Memeriksa lastActivity cookie
const lastActivity = request.cookies.get("lastActivity");
if (now - lastActivity >= SESSION_TIMEOUT) {
  // Auto logout
}
```

**After:**
```javascript
// Stateless - hanya verify JWT token
const payload = await verifyJwtToken(token.value);
if (!payload) {
  // Redirect ke login
}
```

**Perubahan:**
- ❌ Hapus session timeout logic
- ❌ Hapus `lastActivity` cookie tracking
- ✅ Hanya verify JWT token
- ✅ Tidak ada auto-logout berdasarkan inactivity

---

### 2. **Providers** (`components/Providers.jsx`)

**Before:**
```javascript
// State untuk tracking aktivitas
const [lastActivity, setLastActivity] = useState(Date.now());
const SESSION_TIMEOUT = 60 * 60 * 1000;

// Event listeners untuk activity tracking
window.addEventListener("mousemove", resetTimer);
window.addEventListener("keypress", resetTimer);
window.addEventListener("click", resetTimer);
window.addEventListener("scroll", resetTimer);

// Check timeout setiap 60 detik
const interval = setInterval(() => {
  if (now - lastActivity >= SESSION_TIMEOUT) {
    handleSessionTimeout();
  }
}, 60000);
```

**After:**
```javascript
// Stateless authentication - no session tracking on client
// Tidak ada activity tracking
// Tidak ada session timeout check
```

**Perubahan:**
- ❌ Hapus `lastActivity` state
- ❌ Hapus `SESSION_TIMEOUT` constant
- ❌ Hapus `handleSessionTimeout` function
- ❌ Hapus semua event listeners (mousemove, keypress, click, scroll)
- ❌ Hapus interval check untuk timeout
- ✅ Hanya handle login/logout manual

---

### 3. **Documentation** (`README/SESSION_CONFIG.md`)

**Updated:**
- Penjelasan stateless authentication
- JWT token expiry configuration
- Security considerations untuk stateless
- Best practices untuk JWT
- Troubleshooting JWT issues

---

## 🔄 Authentication Flow

### **Login:**
```
1. User input email & password
2. Backend verify credentials
3. Generate JWT token (90 hari expiry)
4. Token disimpan di cookie (httpOnly)
5. User authenticated ✅
```

### **Access Protected Route:**
```
1. User request protected route
2. Middleware check JWT token di cookie
3. Verify JWT token
   - Valid ✅ → Allow access
   - Invalid/Expired ❌ → Redirect ke login
4. Request proceed
```

### **Logout:**
```
1. User click logout button
2. Frontend call /api/auth/logout
3. Clear JWT token dari cookie
4. Redirect ke login
5. User logged out ✅
```

---

## 🎯 Benefits

### 1. **Scalability**
- Server stateless → mudah di-scale horizontal
- Tidak perlu shared session storage
- Load balancer friendly

### 2. **Performance**
- Tidak ada session storage overhead
- Tidak ada activity tracking overhead
- Fast JWT verification

### 3. **User Experience**
- User tetap login selama token valid
- Tidak ada unexpected logout
- Seamless experience

### 4. **Security**
- JWT token dengan expiry time
- Token validation setiap request
- No session hijacking

### 5. **Maintenance**
- Simpler architecture
- Less code to maintain
- Easier debugging

---

## ⚙️ Configuration

### JWT Token Expiry

**Web Dashboard:**
```javascript
// app/api/auth/login/route.js
expiresIn: "90d" // 90 hari
```

**Mobile App:**
```javascript
// backend JWT generation
expiresIn: "30d" // 30 hari untuk mobile
```

**Refresh Token:**
```javascript
expiresIn: "365d" // 1 tahun
```

---

## 🔒 Security Considerations

### 1. **Token Storage**
- Web: httpOnly cookies (XSS protection)
- Mobile: Secure storage (AsyncStorage/Keychain)

### 2. **Token Expiry**
- Access token: 30-90 hari
- Refresh token: 365 hari
- Auto-refresh untuk seamless UX

### 3. **Token Validation**
- Setiap request divalidasi
- Invalid token → 401 Unauthorized
- Expired token → Refresh or login

---

## 🧪 Testing

### Test Stateless Authentication

1. **Login Test:**
   ```bash
   # Login user
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@phc.com","password":"password"}'
   ```

2. **Protected Route Test:**
   ```bash
   # Access dengan token
   curl http://localhost:3000/api/users \
     -H "Cookie: token=YOUR_JWT_TOKEN"
   ```

3. **No Auto-Logout Test:**
   - Login ke dashboard
   - Biarkan idle 2+ jam
   - Refresh page
   - ✅ User masih login (tidak auto-logout)

---

## 📊 Migration Impact

### **Breaking Changes:**
- ❌ Session timeout dihapus → user tidak auto-logout
- ❌ Activity tracking dihapus → tidak ada tracking aktivitas

### **Non-Breaking:**
- ✅ JWT token authentication tetap sama
- ✅ Login/logout functionality tetap sama
- ✅ API authentication tetap sama

### **User Impact:**
- ✅ User tetap login lebih lama
- ✅ Tidak ada unexpected logout
- ✅ Better user experience

---

## 🚀 Deployment

### 1. **Backend Restart Required:**
```bash
cd /Users/wirawanawe/Project/dash-app
pm2 restart dash-app
```

### 2. **No Database Changes:**
- Tidak ada perubahan database schema
- Tidak ada migration required

### 3. **No Frontend Build:**
- Changes di server-side only
- Frontend automatically picks up changes

---

## 📝 Rollback Plan

Jika perlu rollback ke session-based:

1. Restore `middleware.js` dari git history
2. Restore `components/Providers.jsx` dari git history
3. Restart backend server
4. Session timeout akan aktif kembali

---

## ✅ Checklist

- [x] Hapus session timeout dari middleware
- [x] Hapus activity tracking dari Providers
- [x] Update dokumentasi SESSION_CONFIG.md
- [x] Buat dokumentasi STATELESS_AUTHENTICATION.md
- [x] Test JWT token validation
- [x] Verify no auto-logout

---

## 📞 Support

Jika ada masalah dengan stateless authentication:

1. Check JWT token di browser cookie
2. Verify token belum expired
3. Check middleware JWT verification
4. Review server logs untuk errors
5. Test dengan fresh login

---

**Status**: ✅ Implemented and Ready for Production

**Date**: November 5, 2025

**Migration**: Session-Based → Stateless JWT Authentication

