-- Add Mission Sub-Categories and Tracking Mapping
-- This script adds sub_category and tracking_mapping columns to missions table
-- and populates them with appropriate values based on existing mission data

USE phc_dashboard;

-- ========================================
-- STEP 1: ADD NEW COLUMNS TO MISSIONS TABLE
-- ========================================

-- Add sub_category column
ALTER TABLE missions 
ADD COLUMN sub_category VARCHAR(50) COMMENT 'Sub-kategori misi untuk mapping data tracking yang lebih spesifik';

-- Add tracking_mapping column for JSON configuration
ALTER TABLE missions 
ADD COLUMN tracking_mapping JSON COMMENT 'Mapping konfigurasi untuk data tracking yang digunakan';

-- ========================================
-- STEP 2: UPDATE EXISTING MISSIONS WITH SUB-CATEGORIES
-- ========================================

-- Update FITNESS missions with sub-categories
UPDATE missions SET sub_category = 'STEPS' 
WHERE category = 'fitness' AND unit IN ('steps', 'langkah');

UPDATE missions SET sub_category = 'DURATION' 
WHERE category = 'fitness' AND unit IN ('minutes', 'menit');

UPDATE missions SET sub_category = 'DISTANCE' 
WHERE category = 'fitness' AND unit IN ('km', 'kilometer');

UPDATE missions SET sub_category = 'CALORIES' 
WHERE category = 'fitness' AND unit IN ('calories', 'kalori');

-- Update HEALTH_TRACKING missions with sub-categories
UPDATE missions SET sub_category = 'WATER_INTAKE' 
WHERE category = 'health_tracking' AND unit IN ('ml', 'liter');

UPDATE missions SET sub_category = 'SLEEP_DURATION' 
WHERE category = 'health_tracking' AND unit IN ('hours', 'jam', 'minutes', 'menit');

UPDATE missions SET sub_category = 'SLEEP_QUALITY' 
WHERE category = 'health_tracking' AND unit IN ('quality_score');

-- Update NUTRITION missions with sub-categories
UPDATE missions SET sub_category = 'CALORIES_INTAKE' 
WHERE category = 'nutrition' AND unit IN ('calories', 'kalori');

UPDATE missions SET sub_category = 'MEAL_COUNT' 
WHERE category = 'nutrition' AND unit IN ('meals', 'makanan');

UPDATE missions SET sub_category = 'PROTEIN_INTAKE' 
WHERE category = 'nutrition' AND unit IN ('grams', 'gram');

-- Update MENTAL_HEALTH missions with sub-categories
UPDATE missions SET sub_category = 'MOOD_SCORE' 
WHERE category = 'mental_health' AND unit IN ('mood_score');

UPDATE missions SET sub_category = 'STRESS_LEVEL' 
WHERE category = 'mental_health' AND unit IN ('stress_level');

UPDATE missions SET sub_category = 'ENERGY_LEVEL' 
WHERE category = 'mental_health' AND unit IN ('energy_level');

-- ========================================
-- STEP 3: ADD TRACKING MAPPING CONFIGURATION
-- ========================================

-- FITNESS: STEPS missions
UPDATE missions SET tracking_mapping = JSON_OBJECT(
  'table', 'fitness_tracking',
  'column', 'steps',
  'aggregation', 'SUM',
  'date_column', 'tracking_date'
) WHERE sub_category = 'STEPS';

-- FITNESS: DURATION missions
UPDATE missions SET tracking_mapping = JSON_OBJECT(
  'table', 'fitness_tracking',
  'column', 'exercise_minutes',
  'aggregation', 'SUM',
  'date_column', 'tracking_date'
) WHERE sub_category = 'DURATION';

-- FITNESS: DISTANCE missions
UPDATE missions SET tracking_mapping = JSON_OBJECT(
  'table', 'fitness_tracking',
  'column', 'distance_km',
  'aggregation', 'SUM',
  'date_column', 'tracking_date'
) WHERE sub_category = 'DISTANCE';

-- FITNESS: CALORIES missions
UPDATE missions SET tracking_mapping = JSON_OBJECT(
  'table', 'fitness_tracking',
  'column', 'calories_burned',
  'aggregation', 'SUM',
  'date_column', 'tracking_date'
) WHERE sub_category = 'CALORIES';

-- HEALTH_TRACKING: WATER_INTAKE missions
UPDATE missions SET tracking_mapping = JSON_OBJECT(
  'table', 'water_tracking',
  'column', 'amount_ml',
  'aggregation', 'SUM',
  'date_column', 'tracking_date'
) WHERE sub_category = 'WATER_INTAKE';

-- HEALTH_TRACKING: SLEEP_DURATION missions
UPDATE missions SET tracking_mapping = JSON_OBJECT(
  'table', 'sleep_tracking',
  'column', 'sleep_duration_hours',
  'aggregation', 'AVG',
  'date_column', 'sleep_date'
) WHERE sub_category = 'SLEEP_DURATION';

-- HEALTH_TRACKING: SLEEP_QUALITY missions
UPDATE missions SET tracking_mapping = JSON_OBJECT(
  'table', 'sleep_tracking',
  'column', 'sleep_quality',
  'aggregation', 'AVG',
  'date_column', 'sleep_date'
) WHERE sub_category = 'SLEEP_QUALITY';

-- NUTRITION: CALORIES_INTAKE missions
UPDATE missions SET tracking_mapping = JSON_OBJECT(
  'table', 'meal_logging',
  'column', 'calories',
  'aggregation', 'SUM',
  'date_column', 'recorded_at'
) WHERE sub_category = 'CALORIES_INTAKE';

-- NUTRITION: MEAL_COUNT missions
UPDATE missions SET tracking_mapping = JSON_OBJECT(
  'table', 'meal_logging',
  'column', 'meal_type',
  'aggregation', 'COUNT_DISTINCT',
  'date_column', 'recorded_at'
) WHERE sub_category = 'MEAL_COUNT';

-- NUTRITION: PROTEIN_INTAKE missions
UPDATE missions SET tracking_mapping = JSON_OBJECT(
  'table', 'meal_logging',
  'column', 'protein',
  'aggregation', 'SUM',
  'date_column', 'recorded_at'
) WHERE sub_category = 'PROTEIN_INTAKE';

-- MENTAL_HEALTH: MOOD_SCORE missions
UPDATE missions SET tracking_mapping = JSON_OBJECT(
  'table', 'mood_tracking',
  'column', 'mood_score',
  'aggregation', 'AVG',
  'date_column', 'tracking_date'
) WHERE sub_category = 'MOOD_SCORE';

-- MENTAL_HEALTH: STRESS_LEVEL missions
UPDATE missions SET tracking_mapping = JSON_OBJECT(
  'table', 'mood_tracking',
  'column', 'stress_level',
  'aggregation', 'AVG',
  'date_column', 'tracking_date'
) WHERE sub_category = 'STRESS_LEVEL';

-- MENTAL_HEALTH: ENERGY_LEVEL missions
UPDATE missions SET tracking_mapping = JSON_OBJECT(
  'table', 'mood_tracking',
  'column', 'energy_level',
  'aggregation', 'AVG',
  'date_column', 'tracking_date'
) WHERE sub_category = 'ENERGY_LEVEL';

-- ========================================
-- STEP 4: VERIFICATION QUERIES
-- ========================================

-- Check missions by sub-category
SELECT 
    category,
    sub_category,
    COUNT(*) as mission_count,
    GROUP_CONCAT(DISTINCT unit) as units
FROM missions 
WHERE sub_category IS NOT NULL
GROUP BY category, sub_category
ORDER BY category, sub_category;

-- Check missions with tracking mapping
SELECT 
    category,
    sub_category,
    title,
    unit,
    target_value,
    tracking_mapping
FROM missions 
WHERE tracking_mapping IS NOT NULL
ORDER BY category, sub_category, target_value;

-- Check missions without sub-category (should be minimal)
SELECT 
    category,
    title,
    unit,
    target_value
FROM missions 
WHERE sub_category IS NULL
ORDER BY category, title;

-- ========================================
-- STEP 5: CREATE INDEXES FOR BETTER PERFORMANCE
-- ========================================

-- Add index on sub_category for faster filtering
CREATE INDEX idx_missions_sub_category ON missions(sub_category);

-- Add index on tracking_mapping for JSON queries
CREATE INDEX idx_missions_tracking_mapping ON missions((CAST(tracking_mapping AS CHAR(100))));

-- ========================================
-- STEP 6: SUMMARY REPORT
-- ========================================

-- Generate summary report
SELECT 
    'MISSION_SUB_CATEGORY_IMPLEMENTATION' as report_type,
    NOW() as implementation_date,
    COUNT(*) as total_missions,
    COUNT(CASE WHEN sub_category IS NOT NULL THEN 1 END) as missions_with_sub_category,
    COUNT(CASE WHEN tracking_mapping IS NOT NULL THEN 1 END) as missions_with_tracking_mapping,
    COUNT(CASE WHEN sub_category IS NULL THEN 1 END) as missions_without_sub_category
FROM missions;

-- Show sub-category distribution
SELECT 
    category,
    sub_category,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY category), 2) as percentage
FROM missions 
WHERE sub_category IS NOT NULL
GROUP BY category, sub_category
ORDER BY category, count DESC;
