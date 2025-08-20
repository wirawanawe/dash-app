-- Simplify anthropometry to only support BB, TB, and BMI
-- This script updates the health_data table to only support basic anthropometry

USE phc_dashboard;

-- Update the ENUM to only include basic anthropometry data types
ALTER TABLE health_data 
MODIFY COLUMN data_type ENUM(
  'blood_pressure', 'heart_rate', 'temperature', 'weight', 'height', 'bmi', 
  'blood_sugar', 'cholesterol'
) NOT NULL;

-- Verify the changes
SELECT 
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'phc_dashboard' 
  AND TABLE_NAME = 'health_data' 
  AND COLUMN_NAME = 'data_type';

-- Show current data types in use
SELECT 
  data_type,
  COUNT(*) as count
FROM health_data 
GROUP BY data_type 
ORDER BY count DESC;

-- Show summary of anthropometry data (BB, TB, BMI only)
SELECT 
  'Anthropometry Data Summary (BB, TB, BMI only)' as info,
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT data_type) as data_types
FROM health_data 
WHERE data_type IN ('weight', 'height', 'bmi');

-- Show data types breakdown (BB, TB, BMI only)
SELECT 
  data_type,
  COUNT(*) as record_count,
  COUNT(DISTINCT user_id) as user_count,
  MIN(measured_at) as earliest_record,
  MAX(measured_at) as latest_record
FROM health_data 
WHERE data_type IN ('weight', 'height', 'bmi')
GROUP BY data_type
ORDER BY record_count DESC;
