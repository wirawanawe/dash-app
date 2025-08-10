# PHC Dashboard - Modern Healthcare Management

Modern healthcare management dashboard for PHC with real-time patient tracking, doctor management, and comprehensive reporting.

## 🚀 New Features: Mobile App Integration

Sistem ini sekarang terintegrasi dengan backend mobile app PHC. Admin dapat mengelola konten mobile app melalui dashboard web ini.

### Mobile App Management Features

#### ✅ Database Makanan (Food Database)
- **Path**: `/mobile/food`
- **Features**: 
  - Kelola database makanan dengan informasi nutrisi lengkap
  - Search dan filter berdasarkan kategori
  - Upload gambar makanan
  - Verifikasi data makanan
  - Support untuk barcode scanning
- **API Endpoints**:
  - `GET /api/mobile/food` - List foods with pagination and search
  - `POST /api/mobile/food` - Create new food item
  - `GET /api/mobile/food/[id]` - Get specific food item
  - `PUT /api/mobile/food/[id]` - Update food item
  - `DELETE /api/mobile/food/[id]` - Delete food item
  - `GET /api/mobile/food/categories` - Get food categories

#### ✅ **Already Implemented:**
- **Missions Management** - Kelola sistem misi dan reward untuk user mobile app


#### 🔄 Coming Soon
- **Health Tracking** - API untuk tracking mood, air, tidur, makanan, fitness
- **Education Content** - Kelola konten edukasi kesehatan
- **Health News** - Kelola berita dan artikel kesehatan
- **Chat System** - Sistem chat antara user dan dokter
- **Health Calculators** - Kalkulator kesehatan (BMI, BMR, dll)

### Database Schema

Sistem ini menggunakan database schema yang sama dengan backend mobile app. Tabel utama yang sudah tersedia:

- `food_database` - Database makanan dengan informasi nutrisi
- `missions` - Sistem misi dan reward
- `user_missions` - Progress misi user

- `mood_tracking` - Tracking mood harian
- `water_tracking` - Tracking konsumsi air
- `sleep_tracking` - Tracking pola tidur
- `meal_logging` - Log makanan user
- `fitness_tracking` - Tracking aktivitas fisik
- `health_data` - Data kesehatan umum
- `chats` & `chat_messages` - Sistem chat
- `consultations` - Konsultasi dengan dokter
- `assessments` - Kuesioner kesehatan

### Setup Instructions

1. **Run Database Migration**:
   ```bash
   # Jalankan script SQL untuk membuat tabel mobile app
   mysql -u your_username -p your_database < init-scripts/02-mobile-app-tables.sql
   ```

2. **Access Mobile App Management**:
   - Login sebagai ADMIN
   - Navigate ke menu "Mobile App" di sidebar
   - Mulai dengan "Database Makanan" untuk mengelola food database

3. **API Integration**:
   - Mobile app dapat menggunakan API endpoints yang sudah tersedia
   - Base URL: `your-dashboard-url/api/mobile/`
   - Authentication: Same as existing API

### Navigation

Menu "Mobile App" hanya tersedia untuk user dengan role ADMIN. Submenu yang tersedia:
- 🍽️ Database Makanan (`/mobile/food`)

- 🏆 Sistem Misi (`/mobile/missions`)

## Original Features

### Features
- **Patient Management**: Comprehensive patient records with visit history
- **Doctor Management**: Doctor profiles and scheduling
- **Visit Tracking**: Real-time visit status and queue management
- **Laboratory Integration**: Lab results and report management
- **User Management**: Role-based access control
- **Settings Management**: Master data configuration
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### Tech Stack
- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MySQL
- **Authentication**: NextAuth.js (if implemented) or custom auth
- **UI Components**: Custom components with Tailwind CSS
- **Icons**: React Icons (Heroicons, Font Awesome)

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dash-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   ```bash
   # Create database
   mysql -u root -p
   CREATE DATABASE phc_dashboard;
   USE phc_dashboard;
   
   # Run initialization scripts
   source init-scripts/01-create-tables.sql;
   source init-scripts/02-mobile-app-tables.sql;
   
   ```

4. **Environment Configuration**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Edit .env.local with your database credentials
   DATABASE_URL="mysql://username:password@localhost:3306/phc_dashboard"
   ```

5. **Run the application**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   ```

### Project Structure
```
dash-app/
├── app/                    # Next.js 14 app directory
│   ├── api/               # API routes
│   │   ├── mobile/        # Mobile app API endpoints
│   │   └── ...           # Other API endpoints
│   ├── mobile/            # Mobile app management pages
│   │   └── food/         # Food database management
│   └── ...               # Other pages
├── components/            # Reusable React components
├── lib/                  # Utility functions and configurations
├── init-scripts/         # Database initialization scripts
└── public/               # Static assets
```

### API Documentation

#### Mobile App APIs
- **Food Database**: `/api/mobile/food/*`
- **Missions**: `/api/mobile/missions/*`

- **Tracking**: `/api/mobile/tracking/*` (Coming Soon)

#### Healthcare Management APIs
- **Patients**: `/api/patients/*`
- **Doctors**: `/api/doctors/*`
- **Visits**: `/api/visits/*`
- **Laboratory**: `/api/laboratory/*`
- **Settings**: `/api/settings/*`

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### License
This project is proprietary software developed for PHC.

### Support
For support and questions, contact the development team.

---

**Note**: Mobile app integration is actively being developed. More features will be added progressively.
