-- Migration: Add mission_date field to user_missions table
-- This allows missions to be tracked per specific date

USE phc_dashboard;

-- Add mission_date column to user_missions table
ALTER TABLE user_missions 
ADD COLUMN mission_date DATE NOT NULL DEFAULT CURRENT_DATE 
AFTER mission_id;

-- Add index for efficient date-based queries
CREATE INDEX idx_user_missions_date ON user_missions(user_id, mission_date, status);

-- Update existing records to have mission_date based on created_at
UPDATE user_missions 
SET mission_date = DATE(created_at) 
WHERE mission_date = CURRENT_DATE;

-- Add unique constraint to prevent duplicate missions on same date
ALTER TABLE user_missions 
ADD UNIQUE KEY unique_user_mission_date (user_id, mission_id, mission_date);

-- Drop the old unique constraint since we now have date-based uniqueness
ALTER TABLE user_missions 
DROP INDEX unique_user_mission;

-- Add comment to explain the new field
ALTER TABLE user_missions 
MODIFY COLUMN mission_date DATE NOT NULL DEFAULT CURRENT_DATE 
COMMENT 'Tanggal misi dimulai, memungkinkan misi yang sama untuk tanggal berbeda';

-- Update the table comment
ALTER TABLE user_missions 
COMMENT = 'Tabel untuk melacak misi pengguna dengan dukungan tanggal spesifik';

-- Verify the changes
DESCRIBE user_missions; 

-- Migration script to allow multiple user missions with different dates
-- This enables users to select the same mission multiple times with different created_at dates

-- Add mission_date column to user_missions table
ALTER TABLE user_missions ADD COLUMN mission_date DATE NULL AFTER mission_id;

-- Update existing records to have mission_date based on created_at
UPDATE user_missions 
SET mission_date = DATE(created_at)
WHERE mission_date IS NULL;

-- Remove the unique constraint that prevents multiple missions
ALTER TABLE user_missions DROP INDEX unique_user_mission;

-- Add a new unique constraint that allows multiple missions with different dates
ALTER TABLE user_missions ADD UNIQUE KEY unique_user_mission_date (user_id, mission_id, mission_date);

-- Add index for better performance on date-based queries
CREATE INDEX idx_user_missions_date ON user_missions(user_id, mission_date);

-- Add index for mission selection queries
CREATE INDEX idx_user_missions_mission_date ON user_missions(user_id, mission_id, mission_date); 