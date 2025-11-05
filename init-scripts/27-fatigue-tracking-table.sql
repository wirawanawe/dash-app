-- Fatigue Assessment Tracking Table
-- This table stores daily fatigue assessment data for users

CREATE TABLE IF NOT EXISTS fatigue_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    
    -- Assessment Date
    assessment_date DATE NOT NULL,
    
    -- Sleep Metrics
    sleep_hours DECIMAL(3,1) NOT NULL COMMENT 'Hours of sleep (0-24)',
    sleep_quality INT NOT NULL COMMENT 'Sleep quality rating (1-10)',
    
    -- Mental State Metrics
    mood_level INT NOT NULL COMMENT 'Mood level (1-5, 1=very bad, 5=excellent)',
    stress_level INT NOT NULL COMMENT 'Stress level (1-10, 1=low, 10=high)',
    energy_level INT NOT NULL COMMENT 'Energy level (1-10, 1=exhausted, 10=energized)',
    focus_level INT NOT NULL COMMENT 'Focus/concentration level (1-10)',
    
    -- Physical Activity
    physical_activity INT NOT NULL DEFAULT 0 COMMENT 'Minutes of exercise or steps',
    activity_type ENUM('steps', 'minutes') DEFAULT 'minutes' COMMENT 'Type of activity measurement',
    
    -- Lifestyle Factors
    caffeine_intake INT NOT NULL DEFAULT 0 COMMENT 'Number of caffeinated drinks',
    
    -- Calculated Fatigue Score
    fatigue_score DECIMAL(5,2) NOT NULL COMMENT 'Calculated fatigue score (0-100)',
    fatigue_level ENUM('excellent', 'good', 'moderate', 'high', 'severe') NOT NULL,
    
    -- Additional Notes
    notes TEXT,
    symptoms JSON COMMENT 'Array of reported symptoms',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_user_id (user_id),
    INDEX idx_assessment_date (assessment_date),
    INDEX idx_user_date (user_id, assessment_date),
    INDEX idx_fatigue_level (fatigue_level),
    INDEX idx_created_at (created_at),
    
    -- Ensure one assessment per user per day
    UNIQUE KEY unique_user_date (user_id, assessment_date),
    
    -- Foreign key constraint
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample/dummy data for testing
INSERT INTO fatigue_tracking (
    user_id, assessment_date, sleep_hours, sleep_quality, mood_level, 
    stress_level, energy_level, focus_level, physical_activity, activity_type,
    caffeine_intake, fatigue_score, fatigue_level, notes
) VALUES 
-- User 1 - Last 7 days with varying fatigue levels
(1, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 7.5, 8, 4, 3, 8, 7, 45, 'minutes', 2, 78.5, 'good', 'Felt refreshed after good sleep'),
(1, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 6.0, 6, 3, 5, 6, 6, 30, 'minutes', 3, 65.0, 'moderate', 'Moderate energy throughout day'),
(1, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 5.5, 5, 3, 7, 5, 5, 20, 'minutes', 4, 52.5, 'high', 'Struggled with focus'),
(1, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 8.0, 9, 5, 2, 9, 8, 60, 'minutes', 1, 88.0, 'excellent', 'Great day, very productive'),
(1, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 7.0, 7, 4, 4, 7, 7, 40, 'minutes', 2, 72.0, 'good', 'Good overall condition'),
(1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 6.5, 6, 3, 6, 6, 6, 35, 'minutes', 3, 63.0, 'moderate', 'Average day'),
(1, CURDATE(), 7.5, 8, 4, 3, 8, 8, 50, 'minutes', 2, 80.0, 'good', 'Feeling energized today'),

-- User 2 - Sample data
(2, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 6.0, 6, 3, 5, 6, 5, 8000, 'steps', 2, 64.0, 'moderate', 'Regular workday'),
(2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 7.0, 7, 4, 4, 7, 7, 10000, 'steps', 1, 74.0, 'good', 'Good sleep helped'),
(2, CURDATE(), 8.0, 9, 5, 2, 9, 9, 12000, 'steps', 1, 90.0, 'excellent', 'Excellent condition'),

-- User 3 - Sample data with high fatigue
(3, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 5.0, 4, 2, 8, 4, 4, 15, 'minutes', 5, 45.0, 'high', 'Very tired, lots of work'),
(3, CURDATE(), 5.5, 5, 2, 7, 5, 5, 20, 'minutes', 4, 50.0, 'high', 'Still feeling fatigued')
ON DUPLICATE KEY UPDATE
    sleep_hours = VALUES(sleep_hours),
    sleep_quality = VALUES(sleep_quality),
    mood_level = VALUES(mood_level),
    stress_level = VALUES(stress_level),
    energy_level = VALUES(energy_level),
    focus_level = VALUES(focus_level),
    physical_activity = VALUES(physical_activity),
    activity_type = VALUES(activity_type),
    caffeine_intake = VALUES(caffeine_intake),
    fatigue_score = VALUES(fatigue_score),
    fatigue_level = VALUES(fatigue_level),
    notes = VALUES(notes),
    updated_at = CURRENT_TIMESTAMP;

