-- Migrate data from phc_mobile to phc_dashboard
-- This script moves data from mobile backend to dashboard database

-- 1. Create and migrate food_database table (if not exists)
CREATE TABLE IF NOT EXISTS phc_dashboard.food_database (
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
    is_verified BOOLEAN DEFAULT FALSE,
    source ENUM('manual', 'api', 'ai_scan') DEFAULT 'manual',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO phc_dashboard.food_database 
SELECT * FROM phc_mobile.food_database;

-- 2. Migrate users (mobile users) to mobile_users table
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

-- 3. Migrate missions (if not already migrated)
INSERT IGNORE INTO phc_dashboard.missions 
SELECT * FROM phc_mobile.missions;

-- 4. Migrate user_missions (if not already migrated)
INSERT IGNORE INTO phc_dashboard.user_missions 
SELECT * FROM phc_mobile.user_missions;

-- 5. Migrate health_data (if not already migrated)
INSERT IGNORE INTO phc_dashboard.health_data 
SELECT * FROM phc_mobile.health_data;

-- 6. Migrate wellness_activities (if not already migrated)
INSERT IGNORE INTO phc_dashboard.wellness_activities 
SELECT * FROM phc_mobile.wellness_activities;

-- 7. Migrate sleep_tracking (if not already migrated)
INSERT IGNORE INTO phc_dashboard.sleep_tracking 
SELECT * FROM phc_mobile.sleep_tracking;

-- 8. Create and migrate clinics table (if not exists)
CREATE TABLE IF NOT EXISTS phc_dashboard.clinics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO phc_dashboard.clinics 
SELECT * FROM phc_mobile.clinics;

-- 9. Create and migrate services table (if not exists)
CREATE TABLE IF NOT EXISTS phc_dashboard.services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    clinic_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

INSERT IGNORE INTO phc_dashboard.services 
SELECT * FROM phc_mobile.services;

-- 10. Create and migrate bookings table (if not exists)
CREATE TABLE IF NOT EXISTS phc_dashboard.bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    clinic_id INT NOT NULL,
    service_id INT,
    doctor_id INT,
    booking_date DATE NOT NULL,
    booking_time TIME,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
);

INSERT IGNORE INTO phc_dashboard.bookings 
SELECT * FROM phc_mobile.bookings;

-- 11. Create and migrate consultations table (if not exists)
CREATE TABLE IF NOT EXISTS phc_dashboard.consultations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    doctor_id INT NOT NULL,
    consultation_date DATE NOT NULL,
    consultation_time TIME,
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    diagnosis TEXT,
    prescription TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

INSERT IGNORE INTO phc_dashboard.consultations 
SELECT * FROM phc_mobile.consultations;

-- 12. Create and migrate assessments table (if not exists)
CREATE TABLE IF NOT EXISTS phc_dashboard.assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    assessment_type ENUM('health_risk', 'nutrition', 'fitness', 'mental_health', 'sleep') NOT NULL,
    score DECIMAL(5,2),
    result_category ENUM('low', 'medium', 'high') NOT NULL,
    recommendations TEXT,
    assessment_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE
);

INSERT IGNORE INTO phc_dashboard.assessments 
SELECT * FROM phc_mobile.assessments;

-- 13. Create and migrate mood_tracking table (if not exists)
CREATE TABLE IF NOT EXISTS phc_dashboard.mood_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    mood_rating INT CHECK (mood_rating >= 1 AND mood_rating <= 10),
    mood_description VARCHAR(255),
    activities TEXT,
    notes TEXT,
    tracked_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE
);

INSERT IGNORE INTO phc_dashboard.mood_tracking 
SELECT * FROM phc_mobile.mood_tracking;

-- 14. Create and migrate water_tracking table (if not exists)
CREATE TABLE IF NOT EXISTS phc_dashboard.water_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount_ml INT NOT NULL,
    tracked_date DATE NOT NULL,
    tracked_time TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE
);

INSERT IGNORE INTO phc_dashboard.water_tracking 
SELECT * FROM phc_mobile.water_tracking;

-- 15. Create and migrate user_water_settings table (if not exists)
CREATE TABLE IF NOT EXISTS phc_dashboard.user_water_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    daily_goal_ml INT DEFAULT 2000,
    reminder_enabled BOOLEAN DEFAULT TRUE,
    reminder_interval_hours INT DEFAULT 2,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE
);

INSERT IGNORE INTO phc_dashboard.user_water_settings 
SELECT * FROM phc_mobile.user_water_settings;

-- 16. Create and migrate meal_logging table (if not exists)
CREATE TABLE IF NOT EXISTS phc_dashboard.meal_logging (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    food_id INT,
    meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
    quantity DECIMAL(5,2) NOT NULL,
    unit VARCHAR(20),
    calories DECIMAL(6,2),
    logged_date DATE NOT NULL,
    logged_time TIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES food_database(id) ON DELETE SET NULL
);

INSERT IGNORE INTO phc_dashboard.meal_logging 
SELECT * FROM phc_mobile.meal_logging;

-- 17. Create and migrate fitness_tracking table (if not exists)
CREATE TABLE IF NOT EXISTS phc_dashboard.fitness_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    duration_minutes INT NOT NULL,
    calories_burned DECIMAL(6,2),
    distance_km DECIMAL(5,2),
    steps INT,
    tracked_date DATE NOT NULL,
    tracked_time TIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE
);

INSERT IGNORE INTO phc_dashboard.fitness_tracking 
SELECT * FROM phc_mobile.fitness_tracking;

-- 18. Create and migrate user_quick_foods table (if not exists)
CREATE TABLE IF NOT EXISTS phc_dashboard.user_quick_foods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    food_name VARCHAR(255) NOT NULL,
    calories_per_serving DECIMAL(6,2),
    serving_size VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE
);

INSERT IGNORE INTO phc_dashboard.user_quick_foods 
SELECT * FROM phc_mobile.user_quick_foods;

-- 19. Create and migrate user_wellness_activities table (if not exists)
CREATE TABLE IF NOT EXISTS phc_dashboard.user_wellness_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_id INT NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_minutes INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES wellness_activities(id) ON DELETE CASCADE
);

INSERT IGNORE INTO phc_dashboard.user_wellness_activities 
SELECT * FROM phc_mobile.user_wellness_activities;

-- 20. Create and migrate wellness_challenges table (if not exists)
CREATE TABLE IF NOT EXISTS phc_dashboard.wellness_challenges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    challenge_type ENUM('individual', 'group', 'community') DEFAULT 'individual',
    duration_days INT NOT NULL,
    points_reward INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO phc_dashboard.wellness_challenges 
SELECT * FROM phc_mobile.wellness_challenges;

-- 21. Create and migrate chats table (if not exists)
CREATE TABLE IF NOT EXISTS phc_dashboard.chats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    doctor_id INT,
    chat_type ENUM('consultation', 'support', 'general') DEFAULT 'general',
    status ENUM('active', 'closed', 'archived') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
);

INSERT IGNORE INTO phc_dashboard.chats 
SELECT * FROM phc_mobile.chats;

-- 22. Create and migrate chat_messages table (if not exists)
CREATE TABLE IF NOT EXISTS phc_dashboard.chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chat_id INT NOT NULL,
    sender_type ENUM('user', 'doctor', 'system') NOT NULL,
    sender_id INT,
    message TEXT NOT NULL,
    message_type ENUM('text', 'image', 'file') DEFAULT 'text',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

INSERT IGNORE INTO phc_dashboard.chat_messages 
SELECT * FROM phc_mobile.chat_messages;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_food_database_category ON phc_dashboard.food_database(category);
CREATE INDEX IF NOT EXISTS idx_bookings_user_date ON phc_dashboard.bookings(user_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_consultations_user_date ON phc_dashboard.consultations(user_id, consultation_date);
CREATE INDEX IF NOT EXISTS idx_assessments_user_type ON phc_dashboard.assessments(user_id, assessment_type);
CREATE INDEX IF NOT EXISTS idx_mood_tracking_user_date ON phc_dashboard.mood_tracking(user_id, tracked_date);
CREATE INDEX IF NOT EXISTS idx_water_tracking_user_date ON phc_dashboard.water_tracking(user_id, tracked_date);
CREATE INDEX IF NOT EXISTS idx_meal_logging_user_date ON phc_dashboard.meal_logging(user_id, logged_date);
CREATE INDEX IF NOT EXISTS idx_fitness_tracking_user_date ON phc_dashboard.fitness_tracking(user_id, tracked_date);
CREATE INDEX IF NOT EXISTS idx_chats_user_status ON phc_dashboard.chats(user_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_created ON phc_dashboard.chat_messages(chat_id, created_at); 