-- Add missing columns to user_water_settings table
-- This migration adds the columns needed for the enhanced water settings functionality

-- Add custom_goal_ml column
ALTER TABLE user_water_settings 
ADD COLUMN custom_goal_ml INT NULL AFTER daily_goal_ml;

-- Add doctor_recommended_ml column
ALTER TABLE user_water_settings 
ADD COLUMN doctor_recommended_ml INT NULL AFTER custom_goal_ml;

-- Add is_doctor_set column
ALTER TABLE user_water_settings 
ADD COLUMN is_doctor_set BOOLEAN DEFAULT FALSE AFTER doctor_id;

-- Rename existing columns to match new structure
-- Rename is_reminder_enabled to reminder_enabled
ALTER TABLE user_water_settings 
CHANGE COLUMN is_reminder_enabled reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- Rename start_time to reminder_start_time
ALTER TABLE user_water_settings 
CHANGE COLUMN start_time reminder_start_time TIME NOT NULL DEFAULT '07:00:00';

-- Rename end_time to reminder_end_time
ALTER TABLE user_water_settings 
CHANGE COLUMN end_time reminder_end_time TIME NOT NULL DEFAULT '22:00:00';

-- Add weight_kg column
ALTER TABLE user_water_settings 
ADD COLUMN weight_kg DECIMAL(5,2) NULL AFTER reminder_end_time;

-- Add activity_level column
ALTER TABLE user_water_settings 
ADD COLUMN activity_level ENUM('low', 'moderate', 'high') DEFAULT 'moderate' AFTER weight_kg;

-- Add climate_factor column
ALTER TABLE user_water_settings 
ADD COLUMN climate_factor ENUM('normal', 'hot', 'very_hot') DEFAULT 'normal' AFTER activity_level;

-- Add notes column
ALTER TABLE user_water_settings 
ADD COLUMN notes TEXT NULL AFTER climate_factor;

-- Add indexes for better performance
CREATE INDEX idx_water_settings_activity ON user_water_settings(activity_level);
CREATE INDEX idx_water_settings_climate ON user_water_settings(climate_factor);
