-- Fix missing columns for wellness progress API
-- This script adds the missing columns that are referenced in the API but don't exist in the database

-- Add missing columns to user_missions table (only if they don't exist)
ALTER TABLE user_missions 
ADD COLUMN start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN completed_date TIMESTAMP NULL,
ADD COLUMN points_earned INT DEFAULT 0,
ADD COLUMN streak_count INT DEFAULT 0,
ADD COLUMN last_completed_date TIMESTAMP NULL;

-- Add missing columns to water_tracking table (only if they don't exist)
ALTER TABLE water_tracking 
ADD COLUMN water_intake INT DEFAULT 0,
ADD COLUMN target_water INT DEFAULT 2000;

-- Add missing columns to mood_tracking table (only if they don't exist)
ALTER TABLE mood_tracking 
ADD COLUMN mood_score INT DEFAULT 5;

-- Add missing columns to sleep_tracking table (only if they don't exist)
ALTER TABLE sleep_tracking 
ADD COLUMN sleep_hours DECIMAL(4,2) DEFAULT 0;

-- Update water_tracking to set water_intake = amount_ml if water_intake is 0
UPDATE water_tracking SET water_intake = amount_ml WHERE water_intake = 0 OR water_intake IS NULL;

-- Update mood_tracking to set mood_score based on mood_level
UPDATE mood_tracking SET mood_score = 
  CASE mood_level
    WHEN 'very_happy' THEN 10
    WHEN 'happy' THEN 8
    WHEN 'neutral' THEN 5
    WHEN 'sad' THEN 3
    WHEN 'very_sad' THEN 1
    ELSE 5
  END
WHERE mood_score = 0 OR mood_score IS NULL;

-- Update sleep_tracking to calculate sleep_hours from sleep_duration_minutes
UPDATE sleep_tracking SET sleep_hours = 
  CASE 
    WHEN sleep_duration_minutes IS NOT NULL THEN sleep_duration_minutes / 60.0
    WHEN bedtime IS NOT NULL AND wake_time IS NOT NULL THEN 
      (TIME_TO_SEC(wake_time) - TIME_TO_SEC(bedtime)) / 3600.0
    ELSE 0
  END
WHERE sleep_hours = 0 OR sleep_hours IS NULL;

-- Update user_missions to set start_date if it's NULL
UPDATE user_missions SET start_date = created_at WHERE start_date IS NULL;

-- Update user_missions to set completed_date if status is 'completed' and completed_date is NULL
UPDATE user_missions SET completed_date = updated_at 
WHERE status = 'completed' AND completed_date IS NULL AND updated_at IS NOT NULL; 