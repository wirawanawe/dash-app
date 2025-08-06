-- Migration: Add current_value column to user_missions table
-- This column is needed for mission progress tracking

-- Check if current_value column exists, if not add it
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'user_missions' 
     AND COLUMN_NAME = 'current_value') = 0,
    'ALTER TABLE user_missions ADD COLUMN current_value DECIMAL(10,2) DEFAULT 0 AFTER progress',
    'SELECT "current_value column already exists" as message'
));

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Also add notes column if it doesn't exist
SET @sql2 = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'user_missions' 
     AND COLUMN_NAME = 'notes') = 0,
    'ALTER TABLE user_missions ADD COLUMN notes TEXT NULL AFTER current_value',
    'SELECT "notes column already exists" as message'
));

PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Update existing records to have current_value based on progress and mission target_value
UPDATE user_missions um
JOIN missions m ON um.mission_id = m.id
SET um.current_value = CASE 
    WHEN m.target_value IS NOT NULL AND m.target_value > 0 THEN (um.progress * m.target_value) / 100
    ELSE 0 
END
WHERE um.current_value IS NULL OR um.current_value = 0;

-- Add index for better performance (check if it exists first)
SET @sql3 = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'user_missions' 
     AND INDEX_NAME = 'idx_user_missions_current_value') = 0,
    'ALTER TABLE user_missions ADD INDEX idx_user_missions_current_value (current_value)',
    'SELECT "index already exists" as message'
));

PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3; 