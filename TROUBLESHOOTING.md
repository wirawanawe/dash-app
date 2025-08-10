# Troubleshooting Server 500 Errors

## Problem
Your mobile app is experiencing 500 server errors when trying to load data from the backend API.

## Root Cause
The API endpoints were using incorrect column names that don't match the database schema.

## Fixed Issues

### 1. Today Summary Endpoint (`/api/mobile/tracking/today-summary`)
**Problem**: Using wrong column names
- ❌ `recorded_at` → ✅ `tracking_date`
- ❌ `sleep_hours`, `sleep_minutes` → ✅ `sleep_duration_minutes` (calculated)
- ❌ `mood` → ✅ `mood_level`
- ❌ `recorded_at` → ✅ `measured_at` (for health data)

### 2. Water Tracking Endpoint (`/api/mobile/tracking/water`)
**Problem**: Using wrong column names
- ❌ `recorded_at` → ✅ `tracking_date` and `tracking_time`

### 3. Mood Tracking Endpoint (`/api/mobile/mood_tracking`)
**Problem**: Using wrong column names
- ❌ `mood` → ✅ `mood_level`
- ❌ `recorded_at` → ✅ `tracking_date`

### 4. Sleep Tracking Endpoint (`/api/mobile/sleep_tracking`)
**Problem**: Using non-existent columns
- ❌ `sleep_hours`, `sleep_minutes` → ✅ `sleep_duration_minutes` (calculated)

### 5. Health Data Endpoint (`/api/mobile/health_data`)
**Problem**: Using wrong column names
- ❌ `recorded_at` → ✅ `measured_at`

## Database Setup

### Option 1: Using Docker (Recommended)
```bash
# Start MySQL container
docker compose up -d mysql

# Wait for MySQL to be ready, then run setup
npm run setup-db
```

### Option 2: Local MySQL Installation
1. Install MySQL on your system
2. Create a database named `phc_dashboard`
3. Copy `env.local.example` to `.env.local` and configure
4. Run setup:
```bash
npm run setup-db
```

### Option 3: Manual Setup
1. Create database: `CREATE DATABASE phc_dashboard;`
2. Run SQL files in order:
   - `init-scripts/01-create-tables.sql`
   - `init-scripts/02-mobile-app-tables.sql`
   - `init-scripts/03-mobile-tables.sql`

## Environment Configuration

Create `.env.local` file:
```bash
cp env.local.example .env.local
```

Edit `.env.local` with your database credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=phc_dashboard
DB_PORT=3306
```

## Testing the Fix

1. Start the server:
```bash
npm run dev
```

2. Test API endpoints:
```bash
# Test today summary
curl "http://localhost:3000/api/mobile/tracking/today-summary?user_id=1"

# Test missions
curl "http://localhost:3000/api/mobile/missions"

# Test water tracking
curl "http://localhost:3000/api/mobile/tracking/water?user_id=1"
```

## Common Issues

### Database Connection Failed
- Check if MySQL is running
- Verify credentials in `.env.local`
- Try: `npm run test-db`

### Tables Don't Exist
- Run: `npm run setup-db`
- Check SQL files in `init-scripts/`

### Still Getting 500 Errors
- Check server logs for specific error messages
- Verify database schema matches API expectations
- Test individual endpoints

## Database Schema Reference

### Key Tables and Columns

**water_tracking**
- `user_id`, `amount_ml`, `tracking_date`, `tracking_time`, `notes`

**sleep_tracking**
- `user_id`, `sleep_date`, `sleep_duration_minutes`, `sleep_quality`, `bedtime`, `wake_time`

**mood_tracking**
- `user_id`, `mood_level`, `energy_level`, `tracking_date`, `notes`

**health_data**
- `user_id`, `data_type`, `value`, `unit`, `measured_at`, `notes`

**missions**
- `id`, `title`, `description`, `category`, `points`, `duration_days`, `target_value`, `target_unit`

## Next Steps

1. ✅ Fixed API endpoint column mismatches
2. 🔄 Set up database properly
3. 🧪 Test all endpoints
4. 🚀 Deploy to production

If you're still experiencing issues, check the server logs for specific error messages and ensure the database is properly initialized. 