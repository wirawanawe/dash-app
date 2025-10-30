# 🎨 Visual Guide - Sinkronisasi Data Faskes

## 📸 Before & After

### BEFORE ❌
```
Tabel clinics tidak memiliki kolom untuk:
- Kode faskes
- External ID (UUID)
- Client ID

Data harus diinput manual satu per satu
```

### AFTER ✅
```
Tabel clinics sekarang memiliki:
- ✅ Kode faskes (code)
- ✅ External ID (external_id)
- ✅ Client ID (client_id)

Data dapat disinkronisasi otomatis dari API dengan 1 klik!
```

---

## 🖥️ UI Changes

### Table View - Kolom Baru

**SEBELUM:**
```
┌──────────────┬─────────┬─────────┬────────┬──────────┬──────┐
│ Klinik       │ Lokasi  │ Kontak  │ Status │ Dibuat   │ Aksi │
├──────────────┼─────────┼─────────┼────────┼──────────┼──────┤
│ Klinik A     │ Jakarta │ 021xxx  │ Aktif  │ 01/01/25 │ ✏️🗑️  │
└──────────────┴─────────┴─────────┴────────┴──────────┴──────┘
```

**SESUDAH:**
```
┌──────────────┬──────────────┬─────────┬─────────┬────────┬──────────┬──────┐
│ Klinik       │ Kode Faskes  │ Lokasi  │ Kontak  │ Status │ Dibuat   │ Aksi │
├──────────────┼──────────────┼─────────┼─────────┼────────┼──────────┼──────┤
│ Klinik UIT   │ UIT          │ N/A     │ -       │ Aktif  │ 30/10/25 │ ✏️🗑️  │
│              │ CLN-878064   │         │         │        │          │      │
└──────────────┴──────────────┴─────────┴─────────┴────────┴──────────┴──────┘
                    ↑
                   BARU!
```

### Header - Tombol Baru

**SEBELUM:**
```
┌────────────────────────────────────────────┐
│ Daftar Klinik                              │
│                                            │
│ [🔄 Refresh] [➕ Tambah Klinik]           │
└────────────────────────────────────────────┘
```

**SESUDAH:**
```
┌────────────────────────────────────────────────────────────┐
│ Daftar Klinik                                              │
│                                                            │
│ [🔄 Refresh] [☁️ Sinkronisasi dari API] [➕ Tambah Klinik]│
└────────────────────────────────────────────────────────────┘
                          ↑
                         BARU!
```

---

## 🔄 Workflow Sinkronisasi

### Step-by-Step Visual

```
┌─────────────────────────────────────────────────────────────┐
│                     USER ACTION                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
        ┌─────────────────────────────────────┐
        │ Klik "Sinkronisasi dari API"        │
        └─────────────────────────────────────┘
                           │
                           ▼
        ┌─────────────────────────────────────┐
        │ Konfirmasi Dialog:                  │
        │ "Hapus data lama dan ganti dengan   │
        │  data dari API?"                    │
        │                                     │
        │        [Cancel]  [OK]               │
        └─────────────────────────────────────┘
                           │
                           ▼ [OK]
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND PROCESS                         │
└─────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
┌─────────────────┐                 ┌─────────────────┐
│ Fetch dari API  │                 │ DELETE FROM     │
│ /master/faskes  │                 │ clinics         │
└─────────────────┘                 └─────────────────┘
        │                                     │
        │                                     │
        └──────────────────┬──────────────────┘
                           │
                           ▼
        ┌─────────────────────────────────────┐
        │ INSERT data baru ke database        │
        │                                     │
        │ - Klinik UIT (UIT, CLN-878064)     │
        │ - Klinik Tasik (TSK, CLN-536127)   │
        │ - Klinik Pratama Lisna Sehat (KD)  │
        └─────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND UPDATE                         │
└─────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
┌─────────────────┐                 ┌─────────────────┐
│ Show Success    │                 │ Auto Refresh    │
│ Toast:          │                 │ Table           │
│ "✅ 3 faskes    │                 │                 │
│ ditambahkan"    │                 │ [Data baru      │
│                 │                 │  muncul]        │
└─────────────────┘                 └─────────────────┘
```

---

## 📊 Data Flow

### API → Database → UI

```
┌──────────────────────────────────────────────────────────────┐
│                        API RESPONSE                          │
│  https://api-ehr-klinik.doctorphc.id/master/faskes          │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
         {
           "data": [
             {
               "uuid": "b4382a39-...",      ──────┐
               "kode_faskes": "UIT",        ─────┐│
               "nama_faskes": "Klinik UIT", ────┐││
               "client_id": "CLN-878064"    ───┐│││
             }                                 ││││
           ]                                   ││││
         }                                     ││││
                                               ││││
                              │                ││││
                              ▼                ││││
┌──────────────────────────────────────────────────────────────┐
│                    DATABASE INSERT                           │
│                                                              │
│  INSERT INTO clinics (                                      │
│    external_id,    ◄──────────────────────────────────────┘││
│    code,           ◄───────────────────────────────────────┘│
│    name,           ◄────────────────────────────────────────┘
│    client_id       ◄─────────────────────────────────────────┘
│  ) VALUES (...)                                             │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                     UI DISPLAY                               │
│                                                              │
│  ┌────────────┬──────────────┬──────────┐                  │
│  │ Klinik     │ Kode Faskes  │ Status   │                  │
│  ├────────────┼──────────────┼──────────┤                  │
│  │ Klinik UIT │ UIT          │ 🟢 Aktif  │                  │
│  │            │ CLN-878064   │          │                  │
│  └────────────┴──────────────┴──────────┘                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎯 Field Mapping

### API Fields → Database Columns

```
API                          DATABASE
─────────────────           ─────────────────
uuid                    →   external_id
kode_faskes             →   code
nama_faskes             →   name
client_id               →   client_id
(not provided)          →   city = 'N/A'
(auto)                  →   is_active = TRUE
(auto)                  →   created_at = NOW()
(auto)                  →   updated_at = NOW()
```

---

## 🎨 Button Design

### Tombol "Sinkronisasi dari API"

```
┌────────────────────────────────────────┐
│  ☁️  Sinkronisasi dari API             │ ← Hijau (Green)
└────────────────────────────────────────┘
     ↑
   Icon Cloud

Hover Effect:
┌────────────────────────────────────────┐
│  ☁️  Sinkronisasi dari API             │ ← Hijau lebih terang
└────────────────────────────────────────┘
     Scale: 1.05 (slightly bigger)
     Shadow: More prominent

Loading State:
┌────────────────────────────────────────┐
│  ⌛  Sinkronisasi...                    │ ← Disabled
└────────────────────────────────────────┘
     Icon: Spinning/Pulsing
     Cursor: not-allowed
```

---

## 📱 Responsive Design

### Desktop View (>1024px)
```
┌─────────────────────────────────────────────────────────────┐
│ Daftar Klinik                                               │
│ [🔄 Refresh] [☁️ Sinkronisasi] [➕ Tambah]                  │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Klinik  │ Kode │ Lokasi │ Kontak │ Status │ Aksi     │  │
│ │─────────┼──────┼────────┼────────┼────────┼──────────│  │
│ │ UIT     │ UIT  │ N/A    │ -      │ Aktif  │ ✏️ 🗑️     │  │
│ └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Tablet View (768px - 1024px)
```
┌──────────────────────────────────────┐
│ Daftar Klinik                        │
│ [🔄] [☁️] [➕]                        │
│                                      │
│ ┌──────────────────────────────────┐│
│ │ Klinik    │ Kode │ Status │ Aksi││
│ │───────────┼──────┼────────┼─────││
│ │ UIT       │ UIT  │ Aktif  │ ✏️🗑️││
│ └──────────────────────────────────┘│
└──────────────────────────────────────┘
```

### Mobile View (<768px)
```
┌─────────────────────────────┐
│ Daftar Klinik               │
│ [🔄] [☁️] [➕]              │
│                             │
│ ┌─────────────────────────┐ │
│ │ 🏢 Klinik UIT           │ │
│ │ Kode: UIT               │ │
│ │ 🟢 Aktif                │ │
│ │ [Edit] [Hapus]          │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

---

## ✨ Animation & Feedback

### Loading State
```
Sinkronisasi...
┌────────────────────┐
│ ⏳ Loading...      │
│ ▓▓▓▓▓▓▓░░░░░░░ 50%│
└────────────────────┘
```

### Success State
```
✅ Success!
┌────────────────────────────────┐
│ ✅ Sinkronisasi selesai:       │
│ 3 faskes berhasil ditambahkan │
└────────────────────────────────┘
```

### Error State
```
❌ Error!
┌────────────────────────────────┐
│ ❌ Gagal melakukan sinkronisasi│
│ Error: Connection timeout      │
└────────────────────────────────┘
```

---

## 🔍 Search Enhancement

### Search Box - Now includes Code

**Placeholder Text:**
```
🔍 Cari klinik berdasarkan nama, lokasi, atau kode faskes...
```

**Search Results:**
```
Query: "UIT"

Results:
┌────────────────────────────────┐
│ 🏢 Klinik UIT                  │
│ Kode: UIT ← Matched!          │
│ Lokasi: N/A                    │
└────────────────────────────────┘
```

---

## 📊 Statistics Display

### Stats Cards Update

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 📊 Total     │ │ 🟢 Aktif     │ │ ⭐ Rating    │
│              │ │              │ │              │
│      3       │ │      3       │ │     N/A      │
│   Klinik     │ │   Klinik     │ │  Rata-rata   │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## 🎉 Final Result

### Complete Page View

```
╔═══════════════════════════════════════════════════════════╗
║                   🏥 DAFTAR KLINIK                         ║
║                                                            ║
║  [🔄 Refresh] [☁️ Sinkronisasi dari API] [➕ Tambah]      ║
╠═══════════════════════════════════════════════════════════╣
║                                                            ║
║  📊 Stats:                                                 ║
║  ┌──────────┐ ┌──────────┐ ┌──────────┐                  ║
║  │ Total: 3 │ │ Aktif: 3 │ │ Rating:- │                  ║
║  └──────────┘ └──────────┘ └──────────┘                  ║
║                                                            ║
║  🔍 Search: [_____________________________] [Cari]        ║
║                                                            ║
║  📋 Data Klinik:                                           ║
║  ┌──────────────────────────────────────────────────────┐ ║
║  │ Klinik           │ Kode Faskes    │ Lokasi │ Status  │ ║
║  ├──────────────────┼────────────────┼────────┼─────────┤ ║
║  │ Klinik UIT       │ UIT            │ N/A    │ 🟢 Aktif│ ║
║  │                  │ CLN-878064     │        │         │ ║
║  ├──────────────────┼────────────────┼────────┼─────────┤ ║
║  │ Klinik Tasik     │ TSK            │ N/A    │ 🟢 Aktif│ ║
║  │                  │ CLN-536127     │        │         │ ║
║  ├──────────────────┼────────────────┼────────┼─────────┤ ║
║  │ Klinik Pratama   │ KD             │ N/A    │ 🟢 Aktif│ ║
║  │ Lisna Sehat      │ CLN-675893     │        │         │ ║
║  └──────────────────┴────────────────┴────────┴─────────┘ ║
║                                                            ║
║  Showing 1-3 of 3 clinics                 [←] [→]        ║
╚═══════════════════════════════════════════════════════════╝
```

---

_Visual Guide Created: 30 Oktober 2025_

