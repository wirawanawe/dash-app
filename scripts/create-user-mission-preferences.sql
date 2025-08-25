-- Create User Mission Preferences Table
-- This script creates the user_mission_preferences table for storing user preferences
-- about mission display settings (show/hide completed missions, sorting, etc.)

USE phc_dashboard;

-- ========================================
-- STEP 1: CREATE USER MISSION PREFERENCES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS user_mission_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    show_completed_missions BOOLEAN DEFAULT FALSE COMMENT 'Whether to show completed missions by default',
    sort_by ENUM('progress', 'difficulty', 'points', 'category') DEFAULT 'progress' COMMENT 'How to sort missions',
    sort_order ENUM('asc', 'desc') DEFAULT 'desc' COMMENT 'Sort order (ascending or descending)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user (user_id),
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_show_completed (show_completed_missions)
);

-- ========================================
-- STEP 2: INSERT DEFAULT PREFERENCES FOR EXISTING USERS
-- ========================================

-- Insert default preferences for all existing users
INSERT IGNORE INTO user_mission_preferences (user_id, show_completed_missions, sort_by, sort_order)
SELECT 
    id as user_id,
    FALSE as show_completed_missions,
    'progress' as sort_by,
    'desc' as sort_order
FROM mobile_users
WHERE is_active = TRUE;

-- ========================================
-- STEP 3: CREATE INDEXES FOR BETTER PERFORMANCE
-- ========================================

-- Add composite index for common queries
CREATE INDEX idx_user_preferences_composite ON user_mission_preferences(user_id, show_completed_missions);

-- Add index for sorting queries
CREATE INDEX idx_user_preferences_sort ON user_mission_preferences(user_id, sort_by, sort_order);

-- ========================================
-- STEP 4: VERIFICATION QUERIES
-- ========================================

-- Check table structure
DESCRIBE user_mission_preferences;

-- Check if preferences were created for all users
SELECT 
    'USER_PREFERENCES_CREATED' as report_type,
    NOW() as creation_date,
    COUNT(*) as total_preferences,
    COUNT(CASE WHEN show_completed_missions = TRUE THEN 1 END) as show_completed_count,
    COUNT(CASE WHEN show_completed_missions = FALSE THEN 1 END) as hide_completed_count,
    COUNT(CASE WHEN sort_by = 'progress' THEN 1 END) as sort_by_progress_count,
    COUNT(CASE WHEN sort_by = 'difficulty' THEN 1 END) as sort_by_difficulty_count,
    COUNT(CASE WHEN sort_by = 'points' THEN 1 END) as sort_by_points_count,
    COUNT(CASE WHEN sort_by = 'category' THEN 1 END) as sort_by_category_count
FROM user_mission_preferences;

-- Check user distribution
SELECT 
    show_completed_missions,
    sort_by,
    sort_order,
    COUNT(*) as user_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM user_mission_preferences
GROUP BY show_completed_missions, sort_by, sort_order
ORDER BY user_count DESC;

-- ========================================
-- STEP 5: SAMPLE DATA FOR TESTING
-- ========================================

-- Insert some sample preferences for testing (uncomment if needed)
/*
INSERT INTO user_mission_preferences (user_id, show_completed_missions, sort_by, sort_order) VALUES
(1, TRUE, 'progress', 'desc'),
(2, FALSE, 'difficulty', 'asc'),
(3, TRUE, 'points', 'desc'),
(4, FALSE, 'category', 'asc')
ON DUPLICATE KEY UPDATE
    show_completed_missions = VALUES(show_completed_missions),
    sort_by = VALUES(sort_by),
    sort_order = VALUES(sort_order),
    updated_at = NOW();
*/

-- ========================================
-- STEP 6: SUMMARY REPORT
-- ========================================

-- Generate summary report
SELECT 
    'USER_MISSION_PREFERENCES_IMPLEMENTATION' as report_type,
    NOW() as implementation_date,
    (SELECT COUNT(*) FROM user_mission_preferences) as total_preferences,
    (SELECT COUNT(*) FROM mobile_users WHERE is_active = TRUE) as total_active_users,
    (SELECT COUNT(*) FROM user_mission_preferences) / (SELECT COUNT(*) FROM mobile_users WHERE is_active = TRUE) * 100 as coverage_percentage;
