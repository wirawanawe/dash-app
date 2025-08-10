-- Mobile App Tables for Dashboard
-- This script creates tables for mobile app management in the dash-app database

-- Mobile Users Table
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Missions Table
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User Missions Table (for tracking user progress)
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
    UNIQUE KEY unique_user_mission (user_id, mission_id)
);

-- Health Data Table
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
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE
);

-- Wellness Activities Table
CREATE TABLE IF NOT EXISTS wellness_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category ENUM('fitness', 'nutrition', 'mental_health', 'social', 'environmental') NOT NULL,
    duration_minutes INT,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    points INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User Wellness Activities Table
CREATE TABLE IF NOT EXISTS user_wellness_activities (
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

-- Sleep Tracking Table
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
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_mobile_users_email ON mobile_users(email);
CREATE INDEX idx_mobile_users_phone ON mobile_users(phone);
CREATE INDEX idx_mobile_users_active ON mobile_users(is_active);
CREATE INDEX idx_missions_category ON missions(category);
CREATE INDEX idx_missions_active ON missions(is_active);
CREATE INDEX idx_user_missions_user_id ON user_missions(user_id);
CREATE INDEX idx_user_missions_status ON user_missions(status);
CREATE INDEX idx_health_data_user_date ON health_data(user_id, recorded_date);
CREATE INDEX idx_sleep_tracking_user_date ON sleep_tracking(user_id, sleep_date); 