-- Update health_data table to support anthropometry measurements
-- This script adds new data types for anthropometry tracking

USE phc_dashboard;

-- Update the ENUM to include anthropometry data types (BB, TB, BMI only)
ALTER TABLE health_data 
MODIFY COLUMN data_type ENUM(
  'blood_pressure', 'heart_rate', 'temperature', 'weight', 'height', 'bmi', 
  'blood_sugar', 'cholesterol'
) NOT NULL;

-- Add index for better performance on anthropometry queries (BB, TB, BMI only)
-- Note: Index creation will fail if already exists, but that's okay
CREATE INDEX idx_health_data_anthropometry 
ON health_data(user_id, data_type, measured_at);

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

-- Add some sample anthropometry data for testing (BB, TB, BMI only)
-- Uncomment the following lines if you want to add sample data

/*
INSERT INTO health_data (user_id, data_type, value, unit, notes, measured_at, source, created_at, updated_at) VALUES
(1, 'weight', 70.5, 'kg', 'Pengukuran berat badan pagi', NOW(), 'manual', NOW(), NOW()),
(1, 'height', 170.0, 'cm', 'Pengukuran tinggi badan', NOW(), 'manual', NOW(), NOW());
*/

-- Calculate and insert BMI for existing weight/height data
INSERT IGNORE INTO health_data (user_id, data_type, value, unit, notes, measured_at, source, created_at, updated_at)
SELECT 
  w.user_id,
  'bmi' as data_type,
  ROUND(w.value / POWER(h.value / 100, 2), 2) as value,
  'kg/m²' as unit,
  'Dihitung otomatis dari berat dan tinggi badan' as notes,
  GREATEST(w.measured_at, h.measured_at) as measured_at,
  'manual' as source,
  NOW() as created_at,
  NOW() as updated_at
FROM health_data w
JOIN health_data h ON w.user_id = h.user_id 
  AND w.data_type = 'weight' 
  AND h.data_type = 'height'
  AND w.measured_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  AND h.measured_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
WHERE NOT EXISTS (
  SELECT 1 FROM health_data bmi 
  WHERE bmi.user_id = w.user_id 
    AND bmi.data_type = 'bmi'
    AND DATE(bmi.measured_at) = DATE(GREATEST(w.measured_at, h.measured_at))
);

-- Show summary of anthropometry data (BB, TB, BMI only)
SELECT 
  'Anthropometry Data Summary' as info,
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
