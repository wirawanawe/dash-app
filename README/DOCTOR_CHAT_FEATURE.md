# Fitur Chat Dokter

## Deskripsi
Fitur Chat Dokter memungkinkan dokter yang login ke dashboard untuk berinteraksi dengan user mobile melalui sistem chat real-time. Dokter dapat melihat, mengirim, dan mengelola percakapan dengan pasien mobile mereka.

## Fitur Utama

### 1. Keamanan dan Akses
- **Role-based Access**: Hanya user dengan role "doctor" yang dapat mengakses fitur chat
- **Isolasi Chat**: Dokter hanya dapat melihat chat dengan user yang sedang chat dengan mereka
- **Autentikasi**: Menggunakan NextAuth untuk memverifikasi session dokter

### 2. Manajemen Chat
- **Daftar Chat**: Menampilkan semua chat yang dimiliki dokter
- **Filter Status**: Filter berdasarkan status chat (Aktif/Tertutup/Semua)
- **Pencarian**: Cari chat berdasarkan nama user, email, atau judul chat
- **Statistik**: Dashboard dengan statistik chat (total, aktif, tertutup, pesan belum dibaca)

### 3. Percakapan
- **Interface Chat**: Interface chat yang user-friendly dengan bubble chat
- **Pengiriman Pesan**: Dokter dapat mengirim pesan teks
- **Status Pesan**: Indikator pesan terkirim dan terlihat
- **Timestamp**: Waktu pengiriman pesan dengan format yang mudah dibaca
- **Auto-scroll**: Otomatis scroll ke pesan terbaru

### 4. Manajemen Status Chat
- **Tutup Chat**: Dokter dapat menutup chat yang sudah selesai
- **Buka Kembali**: Chat yang ditutup dapat dibuka kembali
- **Status Indikator**: Visual indicator untuk status chat

### 5. Chat Baru
- **Modal Pencarian User**: Pilih user mobile untuk memulai chat baru
- **Pesan Awal**: Opsional mengirim pesan awal saat membuat chat
- **Validasi**: Mencegah duplikasi chat dengan user yang sama

## Struktur Database

### Tabel `chats`
```sql
CREATE TABLE chats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    doctor_id INT,
    title VARCHAR(255),
    status ENUM('active', 'closed', 'waiting') NOT NULL DEFAULT 'active',
    last_message_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_status (status)
);
```

### Tabel `chat_messages`
```sql
CREATE TABLE chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chat_id INT NOT NULL,
    sender_id INT NOT NULL,
    sender_type ENUM('user', 'doctor') NOT NULL,
    message_type ENUM('text', 'image', 'file', 'voice') NOT NULL DEFAULT 'text',
    content TEXT NOT NULL,
    file_url VARCHAR(500),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
    INDEX idx_chat_id (chat_id),
    INDEX idx_sender (sender_id, sender_type),
    INDEX idx_sent_at (sent_at)
);
```

## API Endpoints

### 1. GET `/api/chat`
Mengambil daftar chat untuk dokter yang sedang login.

**Query Parameters:**
- `page`: Halaman (default: 1)
- `limit`: Jumlah item per halaman (default: 20)
- `search`: Kata kunci pencarian
- `status`: Filter status (active/closed/all)

**Response:**
```json
{
  "chats": [
    {
      "id": 1,
      "user_id": 123,
      "doctor_id": 456,
      "title": "Konsultasi dengan John Doe",
      "status": "active",
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "user_phone": "+628123456789",
      "unread_count": 2,
      "last_message": "Terima kasih dokter",
      "last_message_time": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

### 2. POST `/api/chat`
Membuat chat baru dengan user mobile.

**Request Body:**
```json
{
  "user_id": 123,
  "title": "Chat dengan John Doe",
  "initial_message": "Halo, ada yang bisa saya bantu?"
}
```

### 3. GET `/api/chat/[id]`
Mengambil pesan dalam chat tertentu.

**Query Parameters:**
- `page`: Halaman (default: 1)
- `limit`: Jumlah pesan per halaman (default: 50)

### 4. POST `/api/chat/[id]`
Mengirim pesan dalam chat.

**Request Body:**
```json
{
  "content": "Pesan dari dokter"
}
```

### 5. PUT `/api/chat/[id]`
Mengubah status chat (tutup/buka).

**Request Body:**
```json
{
  "status": "closed"
}
```

### 6. GET `/api/chat/users`
Mengambil daftar user mobile yang bisa diajak chat.

## Komponen React

### 1. `ChatPage` (`app/chat/page.js`)
Halaman utama fitur chat dokter dengan:
- Header dengan statistik
- Sidebar daftar chat
- Area percakapan
- Modal chat baru

### 2. `ChatList` (`app/chat/components/ChatList.jsx`)
Komponen untuk menampilkan daftar chat dengan:
- Avatar user
- Informasi user (nama, email, telepon)
- Status chat
- Indikator pesan belum dibaca
- Timestamp pesan terakhir

### 3. `ChatConversation` (`app/chat/components/ChatConversation.jsx`)
Komponen untuk menampilkan percakapan dengan:
- Header chat dengan info user
- Area pesan dengan bubble chat
- Input pengiriman pesan
- Kontrol status chat

### 4. `NewChatModal` (`app/chat/components/NewChatModal.jsx`)
Modal untuk membuat chat baru dengan:
- Pencarian user
- Daftar user mobile
- Input pesan awal
- Validasi duplikasi chat

## Cara Penggunaan

### 1. Akses Fitur Chat
1. Login sebagai dokter
2. Klik menu "Chat Dokter" di sidebar
3. Sistem akan memverifikasi role dokter

### 2. Melihat Daftar Chat
1. Halaman akan menampilkan semua chat yang dimiliki dokter
2. Gunakan filter untuk melihat chat berdasarkan status
3. Gunakan pencarian untuk menemukan chat tertentu

### 3. Membuat Chat Baru
1. Klik tombol "Chat Baru"
2. Cari user mobile yang ingin diajak chat
3. Pilih user dari daftar
4. Opsional: ketik pesan awal
5. Klik "Buat Chat"

### 4. Mengirim Pesan
1. Pilih chat dari daftar
2. Ketik pesan di area input
3. Tekan Enter atau klik tombol kirim
4. Pesan akan muncul di area percakapan

### 5. Mengelola Status Chat
1. Untuk menutup chat: klik tombol X di header chat
2. Untuk membuka kembali: klik tombol check di header chat

## Keamanan

### 1. Role-based Access Control
- Hanya user dengan role "doctor" yang dapat mengakses
- Middleware memverifikasi session dan role
- Redirect otomatis jika tidak memiliki akses

### 2. Data Isolation
- Dokter hanya dapat melihat chat mereka sendiri
- Query database menggunakan `WHERE doctor_id = ?`
- Tidak ada akses cross-doctor

### 3. Input Validation
- Validasi input pesan (tidak boleh kosong)
- Sanitasi data sebelum disimpan ke database
- Error handling untuk operasi database

## Testing

### 1. Seed Data
Jalankan script untuk membuat data sample:
```bash
node scripts/seed-chat-data.js
```

### 2. Test Cases
- Login sebagai dokter dan akses halaman chat
- Buat chat baru dengan user mobile
- Kirim pesan dalam chat
- Tutup dan buka kembali chat
- Test pencarian dan filter
- Test dengan user non-doctor (harus di-redirect)

## Troubleshooting

### 1. Chat tidak muncul
- Pastikan ada data mobile users dan doctors
- Cek apakah dokter memiliki chat yang terkait
- Verifikasi query database

### 2. Tidak bisa mengirim pesan
- Pastikan chat status "active"
- Cek koneksi database
- Verifikasi session dokter

### 3. Error akses
- Pastikan user memiliki role "doctor"
- Cek session authentication
- Verifikasi middleware auth

## Future Enhancements

### 1. Real-time Chat
- Implementasi WebSocket untuk real-time messaging
- Push notification untuk pesan baru
- Online/offline status

### 2. File Sharing
- Upload dan share gambar
- Share dokumen medis
- Voice messages

### 3. Chat Templates
- Template pesan untuk konsultasi umum
- Quick replies
- Auto-suggestions

### 4. Analytics
- Chat duration tracking
- Response time metrics
- User satisfaction ratings

### 5. Integration
- Integrasi dengan sistem appointment
- Link ke medical records
- Prescription management 