# Meal Tracking API Fix

## Problem
The meal tracking API endpoint `GET /api/mobile/tracking/meal/today?user_id=1` was returning a 500 error because the required database tables were missing.

## Root Cause
The database initialization was incomplete - only basic dashboard tables were created, but the mobile app tables (including `meal_tracking`, `meal_foods`, and `food_database`) were missing. Additionally, the `users` table was missing from the database.

## Solution

### 1. Complete Database Setup
Created a comprehensive database initialization script that includes all necessary tables:

- **File**: `init-scripts/00-complete-setup.sql`
- **Script**: `scripts/setup-complete-db.js`
- **Command**: `npm run setup-complete-db`

### 2. Missing Tables Fix
Created a script to add missing tables:

- **Script**: `scripts/create-users-table.js`
- **Command**: `npm run create-users-table`

### 3. Database Configuration Fix
Fixed the database connection configuration in `lib/db.js` to properly use environment variables.

### 4. Tables Created
The complete setup creates all necessary tables:

#### Dashboard Tables
- `users` - User authentication ✅
- `clinics` - Clinic information ✅
- `doctors` - Doctor profiles ✅
- `patients` - Patient records
- `visits` - Patient visits
- `examinations` - Medical examinations
- And more...

#### Mobile App Tables
- `food_database` - Food items with nutrition data ✅
- `meal_tracking` - Meal tracking entries ✅
- `meal_foods` - Individual food items in meals ✅
- `missions` - Health missions/challenges ✅
- `user_missions` - User mission progress ✅

- `mood_tracking` - Mood tracking ✅
- `water_tracking` - Water intake tracking ✅
- `sleep_tracking` - Sleep tracking ✅
- `fitness_tracking` - Fitness activities ✅
- And more...

### 5. Sample Data
The setup includes sample data:
- 10 common food items with nutrition information ✅
- 5 sample health missions ✅
- Superadmin user account ✅

## How to Fix

### Option 1: Complete Fix (Recommended)
This will create all missing tables and fix the configuration:
```bash
cd dash-app
npm run create-users-table
npm run dev
```

### Option 2: Step by Step Setup
1. Check database connection:
```bash
cd dash-app
npm run check-db
```

2. Create missing tables:
```bash
npm run create-users-table
```

3. Test database connection:
```bash
npm run test-db-simple
```

4. Start the application:
```bash
npm run dev
```

5. Test the API:
```bash
npm run test-meal-tracking
```

### Option 3: Full Setup and Test
Run everything at once:
```bash
npm run start-and-test
```

## Available Scripts

- `npm run create-users-table` - Create missing users table and related tables
- `npm run full-setup` - Complete setup (database + tables)
- `npm run check-db` - Check database connection and tables
- `npm run setup-complete-db` - Setup database tables only
- `npm run test-db-simple` - Simple database connection test
- `npm run test-meal-tracking` - Test meal tracking API
- `npm run start-and-test` - Start app and test API
- `npm run test-db` - Test database connection

## Prerequisites

### MySQL Installation

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

**Windows:**
- Download MySQL installer from [mysql.com](https://dev.mysql.com/downloads/installer/)
- Follow the installation wizard

### Database Configuration

Create a `.env` file in the dash-app directory:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=pr1k1t1w
DB_NAME=phc_dashboard
```

## API Endpoints

### GET /api/mobile/tracking/meal/today?user_id=1
Returns today's nutrition summary for a user.

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2024-01-01",
    "totals": {
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0,
      "meal_count": 0,
      "food_count": 0
    },
    "meals_by_type": {},
    "recommended": {
      "calories": 2000,
      "protein": 50,
      "carbs": 250,
      "fat": 65
    },
    "percentages": {
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0
    },
    "meal_types": []
  }
}
```

### GET /api/mobile/tracking/meal?user_id=1&date=2024-01-01
Returns meal tracking data for a specific date.

### POST /api/mobile/tracking/meal
Creates a new meal tracking entry.

**Request Body:**
```json
{
  "user_id": 1,
  "meal_type": "breakfast",
  "foods": [
    {
      "food_id": 1,
      "quantity": 1,
      "unit": "cup",
      "calories": 130,
      "protein": 2.7,
      "carbs": 28,
      "fat": 0.3
    }
  ],
  "notes": "Optional notes",
  "recorded_at": "2024-01-01T08:00:00Z"
}
```

## Verification

After running the setup, you can verify the fix by:

1. **Check database tables exist:**
```sql
SHOW TABLES LIKE '%meal%';
SHOW TABLES LIKE '%food%';
SHOW TABLES LIKE '%user%';
```

2. **Check sample data:**
```sql
SELECT COUNT(*) FROM food_database;
SELECT COUNT(*) FROM missions;
SELECT COUNT(*) FROM users;
```

3. **Test API endpoint:**
```bash
curl "http://localhost:3000/api/mobile/tracking/meal/today?user_id=1"
```

## Troubleshooting

### If you still get 500 errors:

1. **Check database connection:**
```bash
npm run test-db-simple
```

2. **Verify tables exist:**
```bash
npm run check-db
```

3. **Check application logs:**
```bash
npm run dev
# Look for database connection errors in the console
```

### Common Issues:

1. **MySQL not installed**: 
   - Install MySQL using the instructions above
   - Make sure MySQL service is running

2. **Wrong database credentials**: 
   - Check `.env` file
   - Try connecting manually: `mysql -u root -p`

3. **Tables not created**: 
   - Run `npm run create-users-table`
   - Or run `npm run full-setup` for complete setup

4. **Port conflicts**: 
   - Check if port 3306 is available
   - Stop other MySQL instances

5. **Permission issues**: 
   - Make sure your MySQL user has proper permissions
   - Try creating a new MySQL user if needed

6. **Database configuration issues**:
   - Check that `.env` file has correct password
   - Make sure `lib/db.js` is reading environment variables correctly

### Database Configuration

For local MySQL:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=pr1k1t1w
DB_NAME=phc_dashboard
```

If you have a different password:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=phc_dashboard
```

## Files Modified/Created

- `init-scripts/00-complete-setup.sql` - Complete database schema
- `scripts/setup-complete-db.js` - Database setup script
- `scripts/create-users-table.js` - Create missing users table
- `scripts/full-setup.js` - Complete setup script
- `scripts/check-db-connection.js` - Database check script
- `scripts/test-db-connection-simple.js` - Simple database test
- `scripts/test-meal-tracking.js` - API test script
- `scripts/start-and-test.js` - Start and test script
- `lib/db.js` - Fixed database configuration
- `package.json` - Added new npm scripts
- `MEAL_TRACKING_FIX.md` - This documentation

## Next Steps

1. Install MySQL if not already installed
2. Run the complete database setup: `npm run create-users-table`
3. Test the meal tracking API: `npm run test-meal-tracking`
4. Start the application: `npm run dev`
5. Verify all mobile app features work correctly
6. Consider adding more sample data if needed 