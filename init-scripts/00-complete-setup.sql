-- Complete Database Setup for PHC Dashboard and Mobile App
-- This script creates all necessary tables for both dashboard and mobile functionality

-- Create database and use it
CREATE DATABASE IF NOT EXISTS phc_dashboard;
USE phc_dashboard;

-- ========================================
-- DASHBOARD TABLES
-- ========================================

-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('superadmin', 'admin', 'doctor', 'staff') NOT NULL DEFAULT 'staff',
  clinic_id INT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_clinic_id (clinic_id)
);

-- Create clinics table
CREATE TABLE IF NOT EXISTS clinics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  operating_hours JSON,
  description TEXT,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_city (city),
  INDEX idx_is_active (is_active)
);

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  specialist VARCHAR(100),
  license_number VARCHAR(50),
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  clinic_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL
);

-- Create polyclinics table
CREATE TABLE IF NOT EXISTS polyclinics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  UNIQUE KEY unique_code (code)
);

-- Create insurances table
CREATE TABLE IF NOT EXISTS insurances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create treatments table
CREATE TABLE IF NOT EXISTS treatments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create ICD table
CREATE TABLE IF NOT EXISTS icd (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mrn VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  birthdate DATE,
  gender ENUM('MALE', 'FEMALE') NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  nik VARCHAR(20),
  insurance_id INT,
  insurance_number VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_mrn (mrn),
  INDEX idx_name (name)
);

-- Create visits table
CREATE TABLE IF NOT EXISTS visits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  visit_date DATE NOT NULL,
  visit_time TIME,
  doctor_id INT,
  diagnosis TEXT,
  treatment TEXT,
  notes TEXT,
  status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
);

-- Create examinations table
CREATE TABLE IF NOT EXISTS examinations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  visit_id INT NOT NULL,
  blood_pressure VARCHAR(20),
  heart_rate VARCHAR(20),
  temperature DECIMAL(4,1),
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  notes TEXT,
  diagnosis TEXT,
  icd_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
  FOREIGN KEY (icd_id) REFERENCES icd(id),
  INDEX idx_visit (visit_id)
);

-- ========================================
-- MOBILE APP TABLES
-- ========================================

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
    mood ENUM('very_happy', 'happy', 'neutral', 'sad', 'very_sad') NOT NULL,
    stress_level ENUM('low', 'moderate', 'high', 'very_high'),
    notes TEXT,
    tracking_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_tracking_date (tracking_date),
    UNIQUE KEY unique_user_date (user_id, tracking_date)
);

-- Water Tracking Table
CREATE TABLE IF NOT EXISTS water_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount_ml INT NOT NULL DEFAULT 0,
    target_ml INT NOT NULL DEFAULT 2000,
    tracking_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_tracking_date (tracking_date),
    UNIQUE KEY unique_user_date (user_id, tracking_date)
);

-- User Water Settings Table
CREATE TABLE IF NOT EXISTS user_water_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    daily_target_ml INT NOT NULL DEFAULT 2000,
    reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    reminder_interval_hours INT NOT NULL DEFAULT 2,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user (user_id)
);

-- Sleep Tracking Table
CREATE TABLE IF NOT EXISTS sleep_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    sleep_date DATE NOT NULL,
    bedtime TIME,
    wake_time TIME,
    sleep_duration_hours DECIMAL(4,2),
    sleep_quality ENUM('excellent', 'good', 'fair', 'poor'),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_sleep_date (sleep_date),
    UNIQUE KEY unique_user_date (user_id, sleep_date)
);

-- Meal Logging Table (REMOVED - consolidated into meal_tracking)

-- Meal Tracking Table (new structure)
CREATE TABLE IF NOT EXISTS meal_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_meal_type (meal_type),
    INDEX idx_recorded_at (recorded_at)
);

-- Meal Foods Table (for storing individual food items in a meal)
CREATE TABLE IF NOT EXISTS meal_foods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meal_id INT NOT NULL,
    food_id INT NOT NULL,
    quantity DECIMAL(6,2) NOT NULL DEFAULT 1,
    unit VARCHAR(50) NOT NULL DEFAULT 'serving',
    calories DECIMAL(8,2) NOT NULL DEFAULT 0,
    protein DECIMAL(6,2) NOT NULL DEFAULT 0,
    carbs DECIMAL(6,2) NOT NULL DEFAULT 0,
    fat DECIMAL(6,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (meal_id) REFERENCES meal_tracking(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES food_database(id) ON DELETE CASCADE,
    INDEX idx_meal_id (meal_id),
    INDEX idx_food_id (food_id)
);

-- Fitness Tracking Table
CREATE TABLE IF NOT EXISTS fitness_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tracking_date DATE NOT NULL,
    steps INT DEFAULT 0,
    distance_km DECIMAL(6,2) DEFAULT 0,
    calories_burned INT DEFAULT 0,
    active_minutes INT DEFAULT 0,
    workout_type VARCHAR(100),
    workout_duration_minutes INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_tracking_date (tracking_date),
    UNIQUE KEY unique_user_date (user_id, tracking_date)
);

-- User Quick Foods Table
CREATE TABLE IF NOT EXISTS user_quick_foods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    food_id INT NOT NULL,
    custom_name VARCHAR(255),
    custom_quantity DECIMAL(6,2) DEFAULT 1,
    custom_unit VARCHAR(50) DEFAULT 'serving',
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (food_id) REFERENCES food_database(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_favorite (is_favorite)
);

-- Chat Tables
CREATE TABLE IF NOT EXISTS chats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    doctor_id INT,
    status ENUM('active', 'closed', 'pending') DEFAULT 'active',
    subject VARCHAR(255),
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_status (status)
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chat_id INT NOT NULL,
    sender_id INT NOT NULL,
    sender_type ENUM('user', 'doctor') NOT NULL,
    message TEXT NOT NULL,
    message_type ENUM('text', 'image', 'file') DEFAULT 'text',
    file_url VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
    INDEX idx_chat_id (chat_id),
    INDEX idx_sender (sender_id, sender_type),
    INDEX idx_created_at (created_at)
);

-- Consultations Table
CREATE TABLE IF NOT EXISTS consultations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    doctor_id INT,
    consultation_type ENUM('chat', 'video', 'in_person') NOT NULL,
    subject VARCHAR(255),
    description TEXT,
    scheduled_at TIMESTAMP,
    duration_minutes INT DEFAULT 30,
    status ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_status (status),
    INDEX idx_scheduled_at (scheduled_at)
);

-- Health Data Table
CREATE TABLE IF NOT EXISTS health_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    data_type ENUM('blood_pressure', 'heart_rate', 'temperature', 'weight', 'height', 'bmi', 'blood_sugar', 'cholesterol', 'other') NOT NULL,
    value DECIMAL(8,2),
    unit VARCHAR(20),
    additional_data JSON,
    measured_at TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_data_type (data_type),
    INDEX idx_measured_at (measured_at)
);

-- Assessments Table
CREATE TABLE IF NOT EXISTS assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    assessment_type ENUM('mental_health', 'nutrition', 'fitness', 'sleep', 'stress', 'general') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    questions JSON NOT NULL,
    answers JSON,
    score DECIMAL(5,2),
    max_score DECIMAL(5,2),
    result_category ENUM('excellent', 'good', 'fair', 'poor', 'critical') NOT NULL,
    recommendations TEXT,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_assessment_type (assessment_type),
    INDEX idx_completed_at (completed_at)
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX idx_food_search ON food_database(name, name_indonesian, category);
CREATE INDEX idx_missions_active ON missions(is_active, category, difficulty);
CREATE INDEX idx_user_missions_progress ON user_missions(user_id, status, mission_id);
CREATE INDEX idx_wellness_user_date ON wellness_activities(user_id, completed_at);
CREATE INDEX idx_tracking_user_date ON mood_tracking(user_id, tracking_date);
CREATE INDEX idx_water_user_date ON water_tracking(user_id, tracking_date);
CREATE INDEX idx_sleep_user_date ON sleep_tracking(user_id, sleep_date);
CREATE INDEX idx_fitness_user_date ON fitness_tracking(user_id, tracking_date);
CREATE INDEX idx_health_user_type_date ON health_data(user_id, data_type, measured_at);
CREATE INDEX idx_chat_active ON chats(status, last_message_at);
CREATE INDEX idx_consultation_schedule ON consultations(status, scheduled_at);
CREATE INDEX idx_meal_tracking_user_date ON meal_tracking(user_id, recorded_at);
CREATE INDEX idx_meal_foods_meal ON meal_foods(meal_id, food_id);

-- ========================================
-- DEFAULT DATA
-- ========================================

-- Insert default superadmin user
INSERT INTO users (name, email, password, role, is_active) VALUES 
('Super Admin', 'superadmin@phc.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'superadmin', TRUE)
ON DUPLICATE KEY UPDATE role = 'superadmin';

-- Insert sample food items
INSERT IGNORE INTO food_database (name, name_indonesian, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, is_verified, source) VALUES
('Rice', 'Nasi', 'Grains', 130, 2.7, 28, 0.3, 0.4, TRUE, 'manual'),
('Chicken Breast', 'Dada Ayam', 'Protein', 165, 31, 0, 3.6, 0, TRUE, 'manual'),
('Broccoli', 'Brokoli', 'Vegetables', 34, 2.8, 7, 0.4, 2.6, TRUE, 'manual'),
('Banana', 'Pisang', 'Fruits', 89, 1.1, 23, 0.3, 2.6, TRUE, 'manual'),
('Egg', 'Telur', 'Protein', 155, 13, 1.1, 11, 0, TRUE, 'manual'),
('Milk', 'Susu', 'Dairy', 42, 3.4, 5, 1, 0, TRUE, 'manual'),
('Bread', 'Roti', 'Grains', 265, 9, 49, 3.2, 2.7, TRUE, 'manual'),
('Apple', 'Apel', 'Fruits', 52, 0.3, 14, 0.2, 2.4, TRUE, 'manual'),
('Salmon', 'Salmon', 'Protein', 208, 25, 0, 12, 0, TRUE, 'manual'),
('Spinach', 'Bayam', 'Vegetables', 23, 2.9, 3.6, 0.4, 2.2, TRUE, 'manual');

-- Insert sample missions
INSERT IGNORE INTO missions (title, description, category, type, target_value, unit, points, icon, color, difficulty) VALUES
('Drink Water', 'Minum 8 gelas air per hari', 'health_tracking', 'daily', 8, 'glasses', 10, 'water', '#4A90E2', 'easy'),
('Walk 10,000 Steps', 'Berjalan 10,000 langkah per hari', 'fitness', 'daily', 10000, 'steps', 15, 'walking', '#7ED321', 'medium'),
('Eat Vegetables', 'Makan sayuran 3 kali per hari', 'nutrition', 'daily', 3, 'times', 10, 'vegetables', '#50E3C2', 'easy'),
('Sleep 8 Hours', 'Tidur 8 jam per malam', 'health_tracking', 'daily', 8, 'hours', 12, 'sleep', '#9013FE', 'medium'),
('Exercise 30 Minutes', 'Olahraga 30 menit per hari', 'fitness', 'daily', 30, 'minutes', 20, 'exercise', '#F5A623', 'hard'); 

-- ========================================
-- MEDICINES TABLE
-- ========================================

-- Create medicines table (Medicine/Drug table)
CREATE TABLE IF NOT EXISTS medicines (
    ElementDetailKey INT AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT NOT NULL,
    Detail VARCHAR(50) NULL,
    DetailDescription VARCHAR(100) DEFAULT '' NOT NULL,
    HNA FLOAT(53) DEFAULT 0 NOT NULL,
    HNAJual FLOAT(53) DEFAULT 0 NOT NULL,
    SmallUnit VARCHAR(50) DEFAULT '' NOT NULL,
    MediumUnit CHAR(10) DEFAULT '' NOT NULL,
    LargeUnit CHAR(10) DEFAULT '' NOT NULL,
    factor_3 REAL DEFAULT 1 NOT NULL,
    QtyMin INT DEFAULT 0 NOT NULL,
    UserIDInput VARCHAR(10) NULL,
    UserIDModify VARCHAR(10) NULL,
    Berlaku BIT DEFAULT 1 NOT NULL,
    GCRecord BIT DEFAULT 0 NOT NULL,
    ReffID VARCHAR(30) NULL,
    KFA_Code VARCHAR(20) NULL,
    IsSyncServerPHC BIT DEFAULT 0 NOT NULL,
    APLN_Code VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key relationship with clinics table
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    
    -- Indexes for better performance
    INDEX idx_clinic_id (clinic_id),
    INDEX idx_detail (Detail),
    INDEX idx_kfa_code (KFA_Code),
    INDEX idx_apln_code (APLN_Code),
    INDEX idx_berlaku (Berlaku),
    INDEX idx_created_at (created_at)
);

-- Insert sample medicine data for testing
INSERT INTO medicines (clinic_id, Detail, DetailDescription, HNA, HNAJual, SmallUnit, MediumUnit, LargeUnit, factor_3, QtyMin, KFA_Code, APLN_Code, UserIDInput) VALUES
-- Clinic 1 Medicines
(1, 'PARACETAMOL 500MG', 'Paracetamol 500mg Tablet - Obat pereda nyeri dan demam', 0.50, 0.75, 'Tablet', 'Strip', 'Box', 10, 1, 'PAR001', 'APL001', 'SYSTEM'),
(1, 'AMOXICILLIN 500MG', 'Amoxicillin 500mg Capsule - Antibiotik untuk infeksi bakteri', 1.20, 1.80, 'Capsule', 'Strip', 'Box', 10, 1, 'AMO001', 'APL002', 'SYSTEM'),
(1, 'IBUPROFEN 400MG', 'Ibuprofen 400mg Tablet - Obat anti inflamasi non steroid', 0.80, 1.20, 'Tablet', 'Strip', 'Box', 10, 1, 'IBU001', 'APL003', 'SYSTEM'),
(1, 'CETIRIZINE 10MG', 'Cetirizine 10mg Tablet - Antihistamin untuk alergi', 1.50, 2.25, 'Tablet', 'Strip', 'Box', 10, 1, 'CET001', 'APL004', 'SYSTEM'),
(1, 'OMEPRAZOLE 20MG', 'Omeprazole 20mg Capsule - Obat untuk asam lambung', 2.00, 3.00, 'Capsule', 'Strip', 'Box', 10, 1, 'OME001', 'APL005', 'SYSTEM'),
(1, 'METFORMIN 500MG', 'Metformin 500mg Tablet - Obat diabetes tipe 2', 1.80, 2.70, 'Tablet', 'Strip', 'Box', 10, 1, 'MET001', 'APL006', 'SYSTEM'),
(1, 'LOSARTAN 50MG', 'Losartan 50mg Tablet - Obat tekanan darah tinggi', 2.50, 3.75, 'Tablet', 'Strip', 'Box', 10, 1, 'LOS001', 'APL007', 'SYSTEM'),
(1, 'SIMVASTATIN 20MG', 'Simvastatin 20mg Tablet - Obat kolesterol', 3.00, 4.50, 'Tablet', 'Strip', 'Box', 10, 1, 'SIM001', 'APL008', 'SYSTEM'),
(1, 'AMLODIPINE 5MG', 'Amlodipine 5mg Tablet - Obat tekanan darah tinggi', 1.75, 2.62, 'Tablet', 'Strip', 'Box', 10, 1, 'AML001', 'APL009', 'SYSTEM'),
(1, 'FOLIC ACID 5MG', 'Folic Acid 5mg Tablet - Suplemen asam folat', 0.30, 0.45, 'Tablet', 'Strip', 'Box', 10, 1, 'FOL001', 'APL010', 'SYSTEM'),

-- Clinic 2 Medicines
(2, 'PARACETAMOL 500MG', 'Paracetamol 500mg Tablet - Obat pereda nyeri dan demam', 0.55, 0.80, 'Tablet', 'Strip', 'Box', 10, 1, 'PAR001', 'APL001', 'SYSTEM'),
(2, 'CETIRIZINE 10MG', 'Cetirizine 10mg Tablet - Antihistamin untuk alergi', 1.60, 2.40, 'Tablet', 'Strip', 'Box', 10, 1, 'CET001', 'APL004', 'SYSTEM'),
(2, 'OMEPRAZOLE 20MG', 'Omeprazole 20mg Capsule - Obat untuk asam lambung', 2.10, 3.15, 'Capsule', 'Strip', 'Box', 10, 1, 'OME001', 'APL005', 'SYSTEM'),
(2, 'METFORMIN 500MG', 'Metformin 500mg Tablet - Obat diabetes tipe 2', 1.90, 2.85, 'Tablet', 'Strip', 'Box', 10, 1, 'MET001', 'APL006', 'SYSTEM'),
(2, 'LOSARTAN 50MG', 'Losartan 50mg Tablet - Obat tekanan darah tinggi', 2.60, 3.90, 'Tablet', 'Strip', 'Box', 10, 1, 'LOS001', 'APL007', 'SYSTEM'),
(2, 'SIMVASTATIN 20MG', 'Simvastatin 20mg Tablet - Obat kolesterol', 3.10, 4.65, 'Tablet', 'Strip', 'Box', 10, 1, 'SIM001', 'APL008', 'SYSTEM'),
(2, 'AMLODIPINE 5MG', 'Amlodipine 5mg Tablet - Obat tekanan darah tinggi', 1.85, 2.77, 'Tablet', 'Strip', 'Box', 10, 1, 'AML001', 'APL009', 'SYSTEM'),
(2, 'FOLIC ACID 5MG', 'Folic Acid 5mg Tablet - Suplemen asam folat', 0.35, 0.52, 'Tablet', 'Strip', 'Box', 10, 1, 'FOL001', 'APL010', 'SYSTEM'),
(2, 'VITAMIN C 1000MG', 'Vitamin C 1000mg Tablet - Suplemen vitamin C', 0.75, 1.12, 'Tablet', 'Strip', 'Box', 10, 1, 'VIT001', 'APL011', 'SYSTEM'),
(2, 'CALCIUM 500MG', 'Calcium 500mg Tablet - Suplemen kalsium', 1.25, 1.87, 'Tablet', 'Strip', 'Box', 10, 1, 'CAL001', 'APL012', 'SYSTEM'),

-- Clinic 3 Medicines (if exists)
(3, 'PARACETAMOL 500MG', 'Paracetamol 500mg Tablet - Obat pereda nyeri dan demam', 0.52, 0.78, 'Tablet', 'Strip', 'Box', 10, 1, 'PAR001', 'APL001', 'SYSTEM'),
(3, 'AMOXICILLIN 500MG', 'Amoxicillin 500mg Capsule - Antibiotik untuk infeksi bakteri', 1.25, 1.87, 'Capsule', 'Strip', 'Box', 10, 1, 'AMO001', 'APL002', 'SYSTEM'),
(3, 'IBUPROFEN 400MG', 'Ibuprofen 400mg Tablet - Obat anti inflamasi non steroid', 0.85, 1.27, 'Tablet', 'Strip', 'Box', 10, 1, 'IBU001', 'APL003', 'SYSTEM'),
(3, 'CETIRIZINE 10MG', 'Cetirizine 10mg Tablet - Antihistamin untuk alergi', 1.55, 2.32, 'Tablet', 'Strip', 'Box', 10, 1, 'CET001', 'APL004', 'SYSTEM'),
(3, 'OMEPRAZOLE 20MG', 'Omeprazole 20mg Capsule - Obat untuk asam lambung', 2.05, 3.07, 'Capsule', 'Strip', 'Box', 10, 1, 'OME001', 'APL005', 'SYSTEM'); 