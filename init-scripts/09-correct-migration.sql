-- Correct migration from phc_mobile to phc_dashboard
-- Based on actual table structures

-- 1. Migrate food_database
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

-- 4. Migrate user_missions (corrected fields)
INSERT IGNORE INTO phc_dashboard.user_missions (
    id, user_id, mission_id, status, progress, start_date, 
    completed_at, created_at, updated_at
)
SELECT 
    id, user_id, mission_id, status, progress, start_date,
    completed_date,
    created_at,
    updated_at
FROM phc_mobile.user_missions;

-- Show migration results
SELECT 'Migration completed successfully!' as status;
SELECT COUNT(*) as food_items_migrated FROM phc_dashboard.food_database;
SELECT COUNT(*) as mobile_users_migrated FROM phc_dashboard.mobile_users;
SELECT COUNT(*) as missions_migrated FROM phc_dashboard.missions;
SELECT COUNT(*) as user_missions_migrated FROM phc_dashboard.user_missions; 