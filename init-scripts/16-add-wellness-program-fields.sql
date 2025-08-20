-- Add Wellness Program fields to mobile_users table
-- This script adds the necessary fields for wellness program tracking

USE phc_dashboard;

-- Add wellness program fields to mobile_users table
ALTER TABLE mobile_users 
ADD COLUMN wellness_program_joined BOOLEAN DEFAULT FALSE COMMENT 'Status user dalam program wellness',
ADD COLUMN wellness_join_date DATETIME NULL COMMENT 'Tanggal user join program wellness',
ADD COLUMN wellness_program_duration INT NULL COMMENT 'Durasi program wellness dalam hari',
ADD COLUMN activity_level ENUM('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active') NULL COMMENT 'Level aktivitas fisik user',
ADD COLUMN fitness_goal ENUM('weight_loss', 'muscle_gain', 'maintenance', 'general_health') NULL COMMENT 'Tujuan fitness user';

-- Add indexes for better performance
CREATE INDEX idx_wellness_program_joined ON mobile_users(wellness_program_joined);
CREATE INDEX idx_wellness_join_date ON mobile_users(wellness_join_date);
CREATE INDEX idx_wellness_program_duration ON mobile_users(wellness_program_duration);
CREATE INDEX idx_activity_level ON mobile_users(activity_level);
CREATE INDEX idx_fitness_goal ON mobile_users(fitness_goal);

-- Update existing users who have missions to be considered as joined wellness program
UPDATE mobile_users 
SET wellness_program_joined = TRUE, 
    wellness_join_date = NOW(),
    wellness_program_duration = 30 -- Default 30 days for existing users
WHERE id IN (
    SELECT DISTINCT user_id 
    FROM user_missions 
    WHERE status IN ('active', 'completed')
);

-- Show migration results
SELECT 
    'Migration completed' as status,
    COUNT(*) as total_users,
    SUM(CASE WHEN wellness_program_joined = TRUE THEN 1 ELSE 0 END) as joined_wellness,
    SUM(CASE WHEN wellness_program_joined = FALSE THEN 1 ELSE 0 END) as not_joined
FROM mobile_users; 