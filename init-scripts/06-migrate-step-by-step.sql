-- Step-by-step migration from phc_mobile to phc_dashboard
-- This script migrates data one table at a time

-- 1. Migrate food_database
INSERT IGNORE INTO phc_dashboard.food_database 
SELECT * FROM phc_mobile.food_database;

-- 2. Migrate users to mobile_users (basic fields only)
INSERT IGNORE INTO phc_dashboard.mobile_users (
    id, name, email, phone, password, date_of_birth, gender, 
    height, weight, is_active, created_at, updated_at
)
SELECT 
    id, name, email, phone, password, date_of_birth, gender,
    height, weight, is_active, 
    NOW() as created_at,
    NOW() as updated_at
FROM phc_mobile.users;

-- 3. Migrate missions (basic fields)
INSERT IGNORE INTO phc_dashboard.missions (
    id, title, description, category, points, target_value, 
    target_unit, is_active, created_at, updated_at
)
SELECT 
    id, title, description, category, points, target_value,
    unit, is_active,
    created_at,
    updated_at
FROM phc_mobile.missions;

-- 4. Migrate wellness_activities (basic fields)
INSERT IGNORE INTO phc_dashboard.wellness_activities (
    id, title, description, category, duration_minutes, 
    difficulty, points, is_active, created_at, updated_at
)
SELECT 
    id, title, description, category, duration_minutes,
    difficulty, points, is_active,
    NOW() as created_at,
    NOW() as updated_at
FROM phc_mobile.wellness_activities;

-- 5. Migrate health_data (basic fields)
INSERT IGNORE INTO phc_dashboard.health_data (
    id, user_id, data_type, value, unit, recorded_date, 
    recorded_time, notes, created_at
)
SELECT 
    id, user_id, data_type, value, unit, recorded_date,
    recorded_time, notes, NOW() as created_at
FROM phc_mobile.health_data;

-- 6. Migrate sleep_tracking (basic fields)
INSERT IGNORE INTO phc_dashboard.sleep_tracking (
    id, user_id, sleep_date, bedtime, wake_time, 
    total_hours, quality_rating, notes, created_at
)
SELECT 
    id, user_id, sleep_date, bedtime, wake_time,
    total_hours, quality_rating, notes, NOW() as created_at
FROM phc_mobile.sleep_tracking;

-- 7. Migrate user_missions (basic fields)
INSERT IGNORE INTO phc_dashboard.user_missions (
    id, user_id, mission_id, status, progress, start_date, 
    end_date, completed_at, created_at, updated_at
)
SELECT 
    id, user_id, mission_id, status, progress, start_date,
    end_date, completed_at,
    NOW() as created_at,
    NOW() as updated_at
FROM phc_mobile.user_missions;

-- 8. Migrate user_wellness_activities (basic fields)
INSERT IGNORE INTO phc_dashboard.user_wellness_activities (
    id, user_id, activity_id, completed_at, duration_minutes, 
    notes, created_at
)
SELECT 
    id, user_id, activity_id, completed_at, duration_minutes,
    notes, NOW() as created_at
FROM phc_mobile.user_wellness_activities; 