-- Simple migration from phc_mobile to phc_dashboard
-- Only migrate essential data that matches the structure

-- 1. Migrate food_database (this should work)
INSERT IGNORE INTO phc_dashboard.food_database 
SELECT * FROM phc_mobile.food_database;

-- 2. Migrate users to mobile_users (only matching fields)
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

-- 3. Migrate missions (only matching fields)
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

-- 4. Migrate health_data (only matching fields)
INSERT IGNORE INTO phc_dashboard.health_data (
    id, user_id, data_type, value, unit, recorded_date, 
    recorded_time, notes, created_at
)
SELECT 
    id, user_id, data_type, value, unit, recorded_date,
    recorded_time, notes, NOW() as created_at
FROM phc_mobile.health_data;

-- 5. Migrate sleep_tracking (only matching fields)
INSERT IGNORE INTO phc_dashboard.sleep_tracking (
    id, user_id, sleep_date, bedtime, wake_time, 
    total_hours, quality_rating, notes, created_at
)
SELECT 
    id, user_id, sleep_date, bedtime, wake_time,
    total_hours, quality_rating, notes, NOW() as created_at
FROM phc_mobile.sleep_tracking;

-- 6. Migrate user_missions (only matching fields)
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