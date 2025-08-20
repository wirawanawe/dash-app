-- Migration: Add activity_type field to user_wellness_activities table
-- This allows storing the activity type (normal, intense, relaxed) for proper point calculation

USE phc_dashboard;

-- Add activity_type column to user_wellness_activities table
ALTER TABLE user_wellness_activities 
ADD COLUMN activity_type ENUM('normal', 'intense', 'relaxed') NOT NULL DEFAULT 'normal' 
AFTER notes;

-- Add comment to explain the new field
ALTER TABLE user_wellness_activities 
MODIFY COLUMN activity_type ENUM('normal', 'intense', 'relaxed') NOT NULL DEFAULT 'normal' 
COMMENT 'Tipe aktivitas: normal (x1), intense (x1.5), relaxed (x0.8)';

-- Update the table comment
ALTER TABLE user_wellness_activities 
COMMENT = 'Tabel untuk melacak aktivitas wellness pengguna dengan dukungan tanggal spesifik dan tipe aktivitas';

-- Verify the changes
DESCRIBE user_wellness_activities;
