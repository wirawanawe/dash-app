-- Migration script: Move all mobile tables from phc_mobile to phc_dashboard
-- This script will create tables if they don't exist and migrate data safely

-- Set the target database
USE phc_dashboard;

-- 1. FOOD DATABASE TABLE
-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS food_database (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_indonesian VARCHAR(255),
    category VARCHAR(100) NOT NULL,
    calories_per_100g DECIMAL(6,2) NOT NULL,
    protein_per_100g DECIMAL(6,2) NOT NULL DEFAULT 0,
    carbs_per_100g DECIMAL(6,2) NOT NULL DEFAULT 0,
    fat_per_100g DECIMAL(6,2) NOT NULL DEFAULT 0,
    fiber_per_100g DECIMAL(6,2) NOT NULL DEFAULT 0,
    sugar_per_100g DECIMAL(6,2) NOT NULL DEFAULT 0,
    sodium_per_100g DECIMAL(8,2) NOT NULL DEFAULT 0,
    serving_size VARCHAR(100),
    serving_weight DECIMAL(6,2),
    barcode VARCHAR(50),
    image_url VARCHAR(500),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    source ENUM('manual', 'api', 'ai_scan') NOT NULL DEFAULT 'manual',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_category (category),
    INDEX idx_barcode (barcode),
    INDEX idx_verified (is_verified)
);

-- Migrate food data if source table exists
INSERT IGNORE INTO food_database 
SELECT * FROM phc_mobile.food_database;

-- 2. MOBILE USERS TABLE
-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS mobile_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    height DECIMAL(5,2), -- in cm
    weight DECIMAL(5,2), -- in kg
    blood_type ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_active (is_active)
);

-- Migrate users data if source table exists
INSERT IGNORE INTO mobile_users (
    id, name, email, phone, password, date_of_birth, gender, 
    height, weight, is_active, created_at, updated_at
)
SELECT 
    id, name, email, phone, password, date_of_birth, gender,
    height, weight, is_active, 
    NOW() as created_at,
    NOW() as updated_at
FROM phc_mobile.users;

-- 3. MISSIONS TABLE
-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS missions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category ENUM('fitness', 'nutrition', 'wellness', 'mental_health', 'sleep') NOT NULL,
    points INT NOT NULL DEFAULT 0,
    duration_days INT,
    target_value DECIMAL(10,2),
    target_unit VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_active (is_active)
);

-- Migrate missions data if source table exists
INSERT IGNORE INTO missions (
    id, title, description, category, points, target_value, 
    target_unit, is_active, created_at, updated_at
)
SELECT 
    id, title, description, category, points, target_value,
    unit, is_active,
    created_at,
    updated_at
FROM phc_mobile.missions;

-- 4. USER MISSIONS TABLE
-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS user_missions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    mission_id INT NOT NULL,
    status ENUM('active', 'completed', 'failed', 'abandoned') DEFAULT 'active',
    progress DECIMAL(5,2) DEFAULT 0.00, -- percentage completion
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE,
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_mission (user_id, mission_id),
    
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
);

-- Migrate user_missions data if source table exists
INSERT IGNORE INTO user_missions (
    id, user_id, mission_id, status, progress, start_date, 
    completed_at, created_at, updated_at
)
SELECT 
    id, user_id, mission_id, status, progress, start_date,
    completed_date,
    created_at,
    updated_at
FROM phc_mobile.user_missions;

-- 5. WELLNESS ACTIVITIES TABLE
-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS wellness_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category ENUM('fitness', 'nutrition', 'mental_health', 'social', 'environmental') NOT NULL,
    duration_minutes INT,
    calories_burn INT,
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    instructions TEXT,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_active (is_active)
);

-- Migrate wellness_activities data if source table exists
INSERT IGNORE INTO wellness_activities (
    id, name, description, category, duration_minutes, 
    calories_burn, difficulty_level, instructions, image_url, is_active, created_at, updated_at
)
SELECT 
    id, title, description, category, duration_minutes,
    calories_burn, difficulty_level, instructions, image_url, is_active,
    NOW() as created_at,
    NOW() as updated_at
FROM phc_mobile.wellness_activities;

-- 6. HEALTH DATA TABLE
-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS health_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    data_type ENUM('weight', 'height', 'blood_pressure', 'heart_rate', 'steps', 'calories', 'sleep_hours', 'water_intake') NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20),
    recorded_date DATE NOT NULL,
    recorded_time TIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE,
    
    INDEX idx_user_date (user_id, recorded_date)
);

-- Migrate health_data if source table exists
INSERT IGNORE INTO health_data (
    id, user_id, data_type, value, unit, recorded_date, 
    recorded_time, notes, created_at
)
SELECT 
    id, user_id, data_type, value, unit, recorded_date,
    recorded_time, notes, NOW() as created_at
FROM phc_mobile.health_data;

-- 7. SLEEP TRACKING TABLE
-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS sleep_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    sleep_date DATE NOT NULL,
    bedtime TIME,
    wake_time TIME,
    total_hours DECIMAL(4,2),
    quality_rating INT CHECK (quality_rating >= 1 AND quality_rating <= 10),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE,
    
    INDEX idx_user_date (user_id, sleep_date)
);

-- Migrate sleep_tracking if source table exists
INSERT IGNORE INTO sleep_tracking (
    id, user_id, sleep_date, bedtime, wake_time, 
    total_hours, quality_rating, notes, created_at
)
SELECT 
    id, user_id, sleep_date, bedtime, wake_time,
    total_hours, quality_rating, notes, NOW() as created_at
FROM phc_mobile.sleep_tracking;

-- 8. MOOD TRACKING TABLE
-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS mood_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    mood_level ENUM('very_happy', 'happy', 'neutral', 'sad', 'very_sad') NOT NULL,
    stress_level ENUM('low', 'moderate', 'high', 'very_high'),
    energy_level ENUM('very_high', 'high', 'moderate', 'low', 'very_low'),
    sleep_quality ENUM('excellent', 'good', 'fair', 'poor', 'very_poor'),
    notes TEXT,
    activities JSON COMMENT 'Aktivitas yang dilakukan hari ini',
    weather VARCHAR(50),
    location VARCHAR(100),
    tracking_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, tracking_date),
    
    INDEX idx_user_date (user_id, tracking_date)
);

-- Migrate mood_tracking if source table exists
INSERT IGNORE INTO mood_tracking (
    id, user_id, mood_level, stress_level, energy_level, sleep_quality,
    notes, activities, weather, location, tracking_date, created_at, updated_at
)
SELECT 
    id, user_id, mood_level, stress_level, energy_level, sleep_quality,
    notes, activities, weather, location, tracking_date,
    NOW() as created_at,
    NOW() as updated_at
FROM phc_mobile.mood_tracking;

-- 9. WATER TRACKING TABLE
-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS water_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount_ml INT NOT NULL,
    notes TEXT,
    tracking_date DATE NOT NULL,
    tracking_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE,
    
    INDEX idx_user_date (user_id, tracking_date)
);

-- Migrate water_tracking if source table exists
INSERT IGNORE INTO water_tracking (
    id, user_id, amount_ml, notes, tracking_date, tracking_time, created_at, updated_at
)
SELECT 
    id, user_id, amount_ml, notes, tracking_date, tracking_time,
    NOW() as created_at,
    NOW() as updated_at
FROM phc_mobile.water_tracking;

-- 10. USER WATER SETTINGS TABLE
-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS user_water_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    daily_goal_ml INT NOT NULL DEFAULT 2000,
    reminder_interval_minutes INT NOT NULL DEFAULT 60,
    start_time TIME NOT NULL DEFAULT '07:00:00',
    end_time TIME NOT NULL DEFAULT '22:00:00',
    is_reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    doctor_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE
);

-- Migrate user_water_settings if source table exists
INSERT IGNORE INTO user_water_settings (
    id, user_id, daily_goal_ml, reminder_interval_minutes, start_time, end_time,
    is_reminder_enabled, doctor_id, created_at, updated_at
)
SELECT 
    id, user_id, daily_goal_ml, reminder_interval_minutes, start_time, end_time,
    is_reminder_enabled, doctor_id,
    NOW() as created_at,
    NOW() as updated_at
FROM phc_mobile.user_water_settings;

-- 11. MEAL LOGGING TABLE
-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS meal_logging (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    food_id INT NOT NULL,
    meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
    portion_grams DECIMAL(6,2) NOT NULL,
    meal_date DATE NOT NULL,
    meal_time TIME NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES food_database(id) ON DELETE CASCADE,
    
    INDEX idx_user_date (user_id, meal_date)
);

-- Migrate meal_logging if source table exists
INSERT IGNORE INTO meal_logging (
    id, user_id, food_id, meal_type, portion_grams, meal_date, meal_time, notes, created_at, updated_at
)
SELECT 
    id, user_id, food_id, meal_type, quantity, logged_date, logged_time, notes,
    NOW() as created_at,
    NOW() as updated_at
FROM phc_mobile.meal_logging;

-- 12. FITNESS TRACKING TABLE
-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS fitness_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    activity_name VARCHAR(100) NOT NULL,
    duration_minutes INT NOT NULL,
    calories_burned INT,
    distance_km DECIMAL(6,2),
    intensity ENUM('low', 'moderate', 'high', 'very_high'),
    notes TEXT,
    tracking_date DATE NOT NULL,
    tracking_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE,
    
    INDEX idx_user_date (user_id, tracking_date)
);

-- Migrate fitness_tracking if source table exists
INSERT IGNORE INTO fitness_tracking (
    id, user_id, activity_type, activity_name, duration_minutes, calories_burned,
    distance_km, intensity, notes, tracking_date, tracking_time, created_at, updated_at
)
SELECT 
    id, user_id, activity_type, activity_name, duration_minutes, calories_burned,
    distance_km, intensity, notes, tracked_date, tracked_time,
    NOW() as created_at,
    NOW() as updated_at
FROM phc_mobile.fitness_tracking;

-- 13. USER QUICK FOODS TABLE
-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS user_quick_foods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    food_id INT NOT NULL,
    custom_portion_grams DECIMAL(6,2),
    custom_name VARCHAR(255),
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES food_database(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_food (user_id, food_id)
);

-- Migrate user_quick_foods if source table exists
INSERT IGNORE INTO user_quick_foods (
    id, user_id, food_id, custom_portion_grams, custom_name, order_index, created_at, updated_at
)
SELECT 
    id, user_id, food_id, custom_portion_grams, custom_name, order_index,
    NOW() as created_at,
    NOW() as updated_at
FROM phc_mobile.user_quick_foods;

-- 14. CHATS TABLE
-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS chats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    doctor_id INT,
    title VARCHAR(255),
    status ENUM('active', 'closed', 'waiting') NOT NULL DEFAULT 'active',
    last_message_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id)
);

-- Migrate chats if source table exists
INSERT IGNORE INTO chats (
    id, user_id, doctor_id, title, status, last_message_at, created_at, updated_at
)
SELECT 
    id, user_id, doctor_id, title, status, last_message_at,
    NOW() as created_at,
    NOW() as updated_at
FROM phc_mobile.chats;

-- 15. CHAT MESSAGES TABLE
-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS chat_messages (
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
    
    INDEX idx_chat_id (chat_id)
);

-- Migrate chat_messages if source table exists
INSERT IGNORE INTO chat_messages (
    id, chat_id, sender_id, sender_type, message_type, content, file_url, is_read, sent_at
)
SELECT 
    id, chat_id, sender_id, sender_type, message_type, content, file_url, is_read,
    NOW() as sent_at
FROM phc_mobile.chat_messages;

-- 16. CONSULTATIONS TABLE
-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS consultations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    doctor_id INT NOT NULL,
    chat_id INT,
    type ENUM('general', 'specialist', 'follow_up', 'emergency') NOT NULL DEFAULT 'general',
    status ENUM('scheduled', 'ongoing', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    consultation_notes TEXT,
    prescription TEXT,
    follow_up_required BOOLEAN NOT NULL DEFAULT FALSE,
    follow_up_date DATE,
    fee DECIMAL(10,2),
    payment_status ENUM('pending', 'paid', 'cancelled') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE SET NULL,
    
    INDEX idx_user_id (user_id)
);

-- Migrate consultations if source table exists
INSERT IGNORE INTO consultations (
    id, user_id, doctor_id, chat_id, type, status, scheduled_at, started_at, ended_at,
    consultation_notes, prescription, follow_up_required, follow_up_date, fee, payment_status,
    created_at, updated_at
)
SELECT 
    id, user_id, doctor_id, chat_id, type, status, scheduled_at, started_at, ended_at,
    consultation_notes, prescription, follow_up_required, follow_up_date, fee, payment_status,
    NOW() as created_at,
    NOW() as updated_at
FROM phc_mobile.consultations;

-- 17. ASSESSMENTS TABLE
-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    assessment_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    questions JSON NOT NULL,
    answers JSON NOT NULL,
    score INT,
    results TEXT,
    recommendations TEXT,
    completed_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id)
);

-- Migrate assessments if source table exists
INSERT IGNORE INTO assessments (
    id, user_id, assessment_type, title, questions, answers, score, results, recommendations,
    completed_at, created_at, updated_at
)
SELECT 
    id, user_id, assessment_type, title, questions, answers, score, results, recommendations,
    completed_at,
    NOW() as created_at,
    NOW() as updated_at
FROM phc_mobile.assessments;

-- Show migration results
SELECT 'Migration completed successfully!' as status;

-- Show counts of migrated data
SELECT 'Food Database' as table_name, COUNT(*) as record_count FROM food_database
UNION ALL
SELECT 'Mobile Users' as table_name, COUNT(*) as record_count FROM mobile_users
UNION ALL
SELECT 'Missions' as table_name, COUNT(*) as record_count FROM missions
UNION ALL
SELECT 'User Missions' as table_name, COUNT(*) as record_count FROM user_missions
UNION ALL
SELECT 'Wellness Activities' as table_name, COUNT(*) as record_count FROM wellness_activities
UNION ALL
SELECT 'Health Data' as table_name, COUNT(*) as record_count FROM health_data
UNION ALL
SELECT 'Sleep Tracking' as table_name, COUNT(*) as record_count FROM sleep_tracking
UNION ALL
SELECT 'Mood Tracking' as table_name, COUNT(*) as record_count FROM mood_tracking
UNION ALL
SELECT 'Water Tracking' as table_name, COUNT(*) as record_count FROM water_tracking
UNION ALL
SELECT 'User Water Settings' as table_name, COUNT(*) as record_count FROM user_water_settings
UNION ALL
SELECT 'Meal Logging' as table_name, COUNT(*) as record_count FROM meal_logging
UNION ALL
SELECT 'Fitness Tracking' as table_name, COUNT(*) as record_count FROM fitness_tracking
UNION ALL
SELECT 'User Quick Foods' as table_name, COUNT(*) as record_count FROM user_quick_foods
UNION ALL
SELECT 'Chats' as table_name, COUNT(*) as record_count FROM chats
UNION ALL
SELECT 'Chat Messages' as table_name, COUNT(*) as record_count FROM chat_messages
UNION ALL
SELECT 'Consultations' as table_name, COUNT(*) as record_count FROM consultations
UNION ALL
SELECT 'Assessments' as table_name, COUNT(*) as record_count FROM assessments; 