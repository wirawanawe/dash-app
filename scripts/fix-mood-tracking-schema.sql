-- Fix mood_tracking table schema
-- Add missing columns that are referenced in the API but don't exist in the database

-- Add mood_score column (will fail silently if it already exists)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'mood_tracking' 
   AND COLUMN_NAME = 'mood_score') = 0,
  'ALTER TABLE mood_tracking ADD COLUMN mood_score INT DEFAULT 5',
  'SELECT "mood_score column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

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
