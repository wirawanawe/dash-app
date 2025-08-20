-- Migration: Add activity_date field to user_wellness_activities table
-- This allows wellness activities to be tracked per specific date and reset daily

USE phc_dashboard;

-- Add activity_date column to user_wellness_activities table
ALTER TABLE user_wellness_activities 
ADD COLUMN activity_date DATE NOT NULL DEFAULT CURRENT_DATE 
AFTER activity_id;

-- Add index for efficient date-based queries
CREATE INDEX idx_user_wellness_activities_date ON user_wellness_activities(user_id, activity_date);

-- Update existing records to have activity_date based on completed_at
UPDATE user_wellness_activities 
SET activity_date = DATE(completed_at) 
WHERE activity_date = CURRENT_DATE;

-- Add unique constraint to prevent duplicate activities on same date
ALTER TABLE user_wellness_activities 
ADD UNIQUE KEY unique_user_activity_date (user_id, activity_id, activity_date);

-- Add comment to explain the new field
ALTER TABLE user_wellness_activities 
MODIFY COLUMN activity_date DATE NOT NULL DEFAULT CURRENT_DATE 
COMMENT 'Tanggal aktivitas wellness dilakukan, memungkinkan aktivitas yang sama untuk tanggal berbeda';

-- Update the table comment
ALTER TABLE user_wellness_activities 
COMMENT = 'Tabel untuk melacak aktivitas wellness pengguna dengan dukungan tanggal spesifik';

-- Verify the changes
DESCRIBE user_wellness_activities;
