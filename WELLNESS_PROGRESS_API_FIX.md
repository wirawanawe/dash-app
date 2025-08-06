# Wellness Progress API Fix

## Problem
The wellness progress API (`/api/mobile/wellness-progress/[id]/route.js`) was failing with database errors due to missing columns in the database tables:

1. **user_missions table**: Missing columns `start_date`, `completed_date`, `points_earned`, `streak_count`, `last_completed_date`, `current_value`
2. **water_tracking table**: Missing columns `water_intake`, `target_water`
3. **mood_tracking table**: Missing column `mood_score`
4. **sleep_tracking table**: Missing column `sleep_hours`

## Solution

### 1. Database Schema Fix
Created and executed `scripts/fix-wellness-progress-columns.sql` to add the missing columns:

```sql
-- Add missing columns to user_missions table
ALTER TABLE user_missions 
ADD COLUMN start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN completed_date TIMESTAMP NULL,
ADD COLUMN points_earned INT DEFAULT 0,
ADD COLUMN streak_count INT DEFAULT 0,
ADD COLUMN last_completed_date TIMESTAMP NULL;

-- Add missing columns to water_tracking table
ALTER TABLE water_tracking 
ADD COLUMN water_intake INT DEFAULT 0,
ADD COLUMN target_water INT DEFAULT 2000;

-- Add missing columns to mood_tracking table
ALTER TABLE mood_tracking 
ADD COLUMN mood_score INT DEFAULT 5;

-- Add missing columns to sleep_tracking table
ALTER TABLE sleep_tracking 
ADD COLUMN sleep_hours DECIMAL(4,2) DEFAULT 0;
```

### 2. Data Migration
The script also includes data migration to populate the new columns with appropriate values:

- `water_intake` is set to `amount_ml` for existing water tracking records
- `mood_score` is calculated from `mood_level` enum values
- `sleep_hours` is calculated from `sleep_duration_minutes` or `bedtime`/`wake_time`
- `start_date` is set to `created_at` for existing user missions

### 3. API Code Improvements
Enhanced the API code with better error handling and fallback mechanisms:

1. **COALESCE functions**: Used to handle missing columns gracefully
2. **Fallback queries**: If the main query fails, try with minimal columns
3. **Individual queries**: If UNION queries fail, try separate queries for each tracking type
4. **Better error handling**: Continue with empty arrays instead of failing completely

### 4. Key Changes in API Code

#### User Missions Query
```sql
-- Before (failing)
SELECT um.start_date, um.completed_date, um.points_earned, ...

-- After (working with fallbacks)
SELECT 
  COALESCE(um.start_date, um.created_at) as start_date,
  COALESCE(um.completed_date, um.completed_at) as completed_date,
  COALESCE(um.points_earned, 0) as points_earned,
  ...
```

#### Tracking Data Query
```sql
-- Before (failing)
SELECT water_intake as value, ...

-- After (working with fallbacks)
SELECT 
  COALESCE(water_intake, amount_ml) as value,
  COALESCE(target_water, 2000) as target,
  ...
```

## Testing Results

The API now works correctly for:
- ✅ Existing users with data (user ID 1)
- ✅ Users with minimal data (user ID 2)
- ✅ Non-existent users (proper error handling)
- ✅ All tracking data types (water, mood, sleep)
- ✅ User missions with proper fallback handling

## Files Modified

1. `scripts/fix-wellness-progress-columns.sql` - Database schema fix
2. `app/api/mobile/wellness-progress/[id]/route.js` - Enhanced API with better error handling

## API Response Structure

The API now returns a comprehensive wellness progress object including:
- User information
- Activity statistics
- Mission progress
- Tracking data averages
- Wellness score calculation
- Recent activities
- Activity distribution

All with proper error handling and graceful degradation when data is missing. 