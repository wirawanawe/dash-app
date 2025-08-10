-- Mobile App Database Tables
-- This script creates all necessary tables for the mobile app functionality

-- Food Database Table
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

-- Missions Table
CREATE TABLE IF NOT EXISTS missions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL COMMENT 'Judul misi',
    description TEXT NOT NULL COMMENT 'Deskripsi detail misi',
    category ENUM('health_tracking', 'nutrition', 'fitness', 'mental_health', 'education', 'consultation', 'daily_habit') NOT NULL COMMENT 'Kategori misi',
    type ENUM('daily', 'weekly', 'monthly', 'one_time') NOT NULL COMMENT 'Tipe misi',
    target_value INT NOT NULL COMMENT 'Target nilai yang harus dicapai',
    unit VARCHAR(50) COMMENT 'Satuan target',
    points INT NOT NULL DEFAULT 10 COMMENT 'Poin yang didapat jika misi selesai',
    icon VARCHAR(100) COMMENT 'Icon untuk misi',
    color VARCHAR(7) COMMENT 'Warna misi dalam format hex',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Status aktif misi',
    difficulty ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'easy' COMMENT 'Tingkat kesulitan misi',
    requirements JSON COMMENT 'Persyaratan khusus untuk misi',
    start_date DATE COMMENT 'Tanggal mulai misi tersedia',
    end_date DATE COMMENT 'Tanggal berakhir misi',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_type (type),
    INDEX idx_active (is_active),
    INDEX idx_difficulty (difficulty)
);

-- User Missions Table (for tracking user progress)
CREATE TABLE IF NOT EXISTS user_missions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    mission_id INT NOT NULL,
    status ENUM('active', 'completed', 'expired', 'cancelled') NOT NULL DEFAULT 'active',
    progress INT NOT NULL DEFAULT 0 COMMENT 'Progress saat ini',
    completed_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    UNIQUE KEY unique_user_mission (user_id, mission_id)
);

-- Wellness Activities Table
CREATE TABLE IF NOT EXISTS wellness_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_id VARCHAR(50) NOT NULL,
    activity_name VARCHAR(100) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    activity_category VARCHAR(50) NOT NULL,
    duration INT NOT NULL DEFAULT 0 COMMENT 'durasi dalam menit',
    points_earned INT NOT NULL DEFAULT 0,
    notes TEXT,
    completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    mood_before ENUM('very_happy', 'happy', 'neutral', 'sad', 'very_sad'),
    mood_after ENUM('very_happy', 'happy', 'neutral', 'sad', 'very_sad'),
    stress_level_before ENUM('low', 'moderate', 'high', 'very_high'),
    stress_level_after ENUM('low', 'moderate', 'high', 'very_high'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_activity_category (activity_category),
    INDEX idx_completed_at (completed_at)
);

-- Mood Tracking Table
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
    
    INDEX idx_user_id (user_id),
    INDEX idx_tracking_date (tracking_date),
    INDEX idx_mood_level (mood_level),
    UNIQUE KEY unique_user_date (user_id, tracking_date)
);

-- Water Tracking Table
CREATE TABLE IF NOT EXISTS water_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount_ml INT NOT NULL,
    notes TEXT,
    tracking_date DATE NOT NULL,
    tracking_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_tracking_date (tracking_date),
    INDEX idx_datetime (tracking_date, tracking_time)
);

-- User Water Settings Table
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
    
    INDEX idx_user_id (user_id)
);

-- Sleep Tracking Table
CREATE TABLE IF NOT EXISTS sleep_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    sleep_date DATE NOT NULL,
    bedtime TIME,
    wake_time TIME,
    sleep_duration_minutes INT,
    sleep_quality ENUM('excellent', 'good', 'fair', 'poor', 'very_poor'),
    sleep_latency_minutes INT COMMENT 'Waktu yang dibutuhkan untuk tertidur',
    wake_up_count INT DEFAULT 0 COMMENT 'Berapa kali terbangun malam',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_sleep_date (sleep_date),
    UNIQUE KEY unique_user_date (user_id, sleep_date)
);

-- Meal Logging Table
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
    
    FOREIGN KEY (food_id) REFERENCES food_database(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_meal_date (meal_date),
    INDEX idx_meal_type (meal_type),
    INDEX idx_food_id (food_id)
);

-- Fitness Tracking Table
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
    
    INDEX idx_user_id (user_id),
    INDEX idx_tracking_date (tracking_date),
    INDEX idx_activity_type (activity_type)
);

-- User Quick Foods Table (favorite foods for quick logging)
CREATE TABLE IF NOT EXISTS user_quick_foods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    food_id INT NOT NULL,
    custom_portion_grams DECIMAL(6,2),
    custom_name VARCHAR(255),
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (food_id) REFERENCES food_database(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_food_id (food_id),
    UNIQUE KEY unique_user_food (user_id, food_id)
);

-- Chat Table
CREATE TABLE IF NOT EXISTS chats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    doctor_id INT,
    title VARCHAR(255),
    status ENUM('active', 'closed', 'waiting') NOT NULL DEFAULT 'active',
    last_message_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_status (status)
);

-- Chat Messages Table
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
    INDEX idx_chat_id (chat_id),
    INDEX idx_sender (sender_id, sender_type),
    INDEX idx_sent_at (sent_at)
);

-- Consultations Table
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
    
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_status (status),
    INDEX idx_scheduled_at (scheduled_at)
);

-- Health Data Table (for storing various health metrics)
CREATE TABLE IF NOT EXISTS health_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    data_type ENUM('blood_pressure', 'heart_rate', 'temperature', 'weight', 'height', 'bmi', 'blood_sugar', 'cholesterol') NOT NULL,
    value DECIMAL(8,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    systolic_value DECIMAL(8,2) COMMENT 'For blood pressure',
    diastolic_value DECIMAL(8,2) COMMENT 'For blood pressure',
    notes TEXT,
    measured_at TIMESTAMP NOT NULL,
    source ENUM('manual', 'device', 'doctor') NOT NULL DEFAULT 'manual',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_data_type (data_type),
    INDEX idx_measured_at (measured_at)
);

-- Assessments Table (health questionnaires)
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
    
    INDEX idx_user_id (user_id),
    INDEX idx_assessment_type (assessment_type),
    INDEX idx_completed_at (completed_at)
);

-- Insert some sample food data
INSERT INTO food_database (name, name_indonesian, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, is_verified, source) VALUES
('White Rice', 'Nasi Putih', 'Karbohidrat', 130, 2.7, 28, 0.3, 0.4, TRUE, 'manual'),
('Brown Rice', 'Nasi Merah', 'Karbohidrat', 111, 2.6, 23, 0.9, 1.8, TRUE, 'manual'),
('Chicken Breast', 'Dada Ayam', 'Protein', 165, 31, 0, 3.6, 0, TRUE, 'manual'),
('Salmon', 'Ikan Salmon', 'Protein', 208, 20, 0, 12, 0, TRUE, 'manual'),
('Broccoli', 'Brokoli', 'Sayuran', 34, 2.8, 7, 0.4, 2.6, TRUE, 'manual'),
('Spinach', 'Bayam', 'Sayuran', 23, 2.9, 3.6, 0.4, 2.2, TRUE, 'manual'),
('Apple', 'Apel', 'Buah', 52, 0.3, 14, 0.2, 2.4, TRUE, 'manual'),
('Banana', 'Pisang', 'Buah', 89, 1.1, 23, 0.3, 2.6, TRUE, 'manual'),
('Almonds', 'Kacang Almond', 'Kacang-kacangan', 579, 21, 22, 50, 12, TRUE, 'manual'),
('Greek Yogurt', 'Yogurt Yunani', 'Dairy', 59, 10, 3.6, 0.4, 0, TRUE, 'manual');

-- Insert some sample missions
INSERT INTO missions (title, description, category, type, target_value, unit, points, difficulty, is_active) VALUES
('Minum Air 8 Gelas', 'Minum minimal 8 gelas air putih dalam sehari untuk menjaga hidrasi tubuh', 'daily_habit', 'daily', 8, 'gelas', 15, 'easy', TRUE),
('Olahraga 30 Menit', 'Lakukan olahraga atau aktivitas fisik selama minimal 30 menit', 'fitness', 'daily', 30, 'menit', 25, 'medium', TRUE),
('Catat Mood Harian', 'Catat mood dan perasaan Anda setiap hari untuk tracking kesehatan mental', 'mental_health', 'daily', 1, 'kali', 10, 'easy', TRUE),
('Konsumsi 5 Porsi Sayur/Buah', 'Konsumsi minimal 5 porsi sayuran dan buah-buahan dalam sehari', 'nutrition', 'daily', 5, 'porsi', 20, 'medium', TRUE),
('Tidur 8 Jam', 'Tidur dengan kualitas baik selama 7-8 jam per malam', 'daily_habit', 'daily', 8, 'jam', 20, 'medium', TRUE),
('Meditasi 10 Menit', 'Lakukan meditasi atau mindfulness selama 10 menit untuk ketenangan pikiran', 'mental_health', 'daily', 10, 'menit', 15, 'easy', TRUE),
('Jalan Kaki 10.000 Langkah', 'Capai target 10.000 langkah per hari dengan berjalan kaki', 'fitness', 'daily', 10000, 'langkah', 30, 'medium', TRUE);

-- Create indexes for better performance
CREATE INDEX idx_food_search ON food_database(name, name_indonesian, category);
CREATE INDEX idx_missions_active ON missions(is_active, category, difficulty);
CREATE INDEX idx_user_missions_progress ON user_missions(user_id, status, mission_id);
CREATE INDEX idx_wellness_user_date ON wellness_activities(user_id, completed_at);
CREATE INDEX idx_tracking_user_date ON mood_tracking(user_id, tracking_date);
CREATE INDEX idx_water_user_date ON water_tracking(user_id, tracking_date);
CREATE INDEX idx_sleep_user_date ON sleep_tracking(user_id, sleep_date);
CREATE INDEX idx_meal_user_date ON meal_logging(user_id, meal_date, meal_type);
CREATE INDEX idx_fitness_user_date ON fitness_tracking(user_id, tracking_date);
CREATE INDEX idx_health_user_type_date ON health_data(user_id, data_type, measured_at);
CREATE INDEX idx_chat_active ON chats(status, last_message_at);
CREATE INDEX idx_consultation_schedule ON consultations(status, scheduled_at); 