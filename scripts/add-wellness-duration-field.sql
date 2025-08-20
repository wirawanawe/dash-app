-- Add Wellness Program Duration Field
-- This script adds the wellness_program_duration field to mobile_users table

USE phc_dashboard;

-- Add wellness program duration field to mobile_users table
ALTER TABLE mobile_users 
ADD COLUMN wellness_program_duration INT NULL COMMENT 'Durasi program wellness dalam hari';

-- Add index for better performance
CREATE INDEX idx_wellness_program_duration ON mobile_users(wellness_program_duration);

-- Update existing users who have missions to have default duration
UPDATE mobile_users 
SET wellness_program_duration = 30 -- Default 30 days for existing users
WHERE wellness_program_joined = TRUE AND wellness_program_duration IS NULL;

-- Show migration results
SELECT 
    'Migration completed' as status,
    COUNT(*) as total_users,
    SUM(CASE WHEN wellness_program_joined = TRUE THEN 1 ELSE 0 END) as joined_wellness,
    SUM(CASE WHEN wellness_program_duration IS NOT NULL THEN 1 ELSE 0 END) as has_duration
FROM mobile_users;
