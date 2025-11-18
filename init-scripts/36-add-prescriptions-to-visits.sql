-- Add prescriptions columns to visits table
USE phc_dashboard;

-- Add prescriptions column (JSON) to store prescription data
-- Check if column exists first
SET @dbname = DATABASE();
SET @tablename = 'visits';
SET @columnname = 'prescriptions';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' JSON COMMENT ''Prescription data from API (normalized)''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add prescription_count column to store count of prescriptions
SET @columnname2 = 'prescription_count';
SET @preparedStatement2 = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname2)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname2, ' INT DEFAULT 0 COMMENT ''Number of prescriptions''')
));
PREPARE alterIfNotExists2 FROM @preparedStatement2;
EXECUTE alterIfNotExists2;
DEALLOCATE PREPARE alterIfNotExists2;

SELECT '✅ Prescriptions columns added to visits table!' as status;

