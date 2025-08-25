-- Update Mission Tracking Mapping SQL Script
-- This script updates all missions with proper tracking mappings

-- 1. Update health_tracking missions (Water Intake)
UPDATE missions SET 
  sub_category = 'WATER_INTAKE',
  tracking_mapping = JSON_OBJECT(
    'table', 'water_tracking',
    'column', 'amount_ml',
    'aggregation', 'SUM',
    'date_column', 'tracking_date'
  )
WHERE category = 'health_tracking' AND unit = 'ml';

-- 2. Update health_tracking missions (Sleep Duration)
UPDATE missions SET 
  sub_category = 'SLEEP_DURATION',
  tracking_mapping = JSON_OBJECT(
    'table', 'sleep_tracking',
    'column', 'sleep_hours',
    'aggregation', 'AVG',
    'date_column', 'sleep_date'
  )
WHERE category = 'health_tracking' AND unit = 'hours';

-- 3. Update fitness missions (Steps)
UPDATE missions SET 
  sub_category = 'STEPS',
  tracking_mapping = JSON_OBJECT(
    'table', 'fitness_tracking',
    'column', 'steps',
    'aggregation', 'SUM',
    'date_column', 'tracking_date'
  )
WHERE category = 'fitness' AND unit IN ('steps', 'langkah');

-- 4. Update fitness missions (Duration)
UPDATE missions SET 
  sub_category = 'DURATION',
  tracking_mapping = JSON_OBJECT(
    'table', 'fitness_tracking',
    'column', 'exercise_minutes',
    'aggregation', 'SUM',
    'date_column', 'tracking_date'
  )
WHERE category = 'fitness' AND unit IN ('minutes', 'menit');

-- 5. Update nutrition missions (Calories)
UPDATE missions SET 
  sub_category = 'CALORIES_INTAKE',
  tracking_mapping = JSON_OBJECT(
    'table', 'meal_logging',
    'column', 'calories',
    'aggregation', 'SUM',
    'date_column', 'tracking_date'
  )
WHERE category = 'nutrition' AND unit = 'calories';

-- 6. Update nutrition missions (Meals)
UPDATE missions SET 
  sub_category = 'MEAL_COUNT',
  tracking_mapping = JSON_OBJECT(
    'table', 'meal_logging',
    'column', 'meal_type',
    'aggregation', 'COUNT',
    'date_column', 'tracking_date'
  )
WHERE category = 'nutrition' AND unit = 'meals';

-- 7. Update mental_health missions (Mood)
UPDATE missions SET 
  sub_category = 'MOOD_SCORE',
  tracking_mapping = JSON_OBJECT(
    'table', 'mood_tracking',
    'column', 'mood_score',
    'aggregation', 'AVG',
    'date_column', 'tracking_date'
  )
WHERE category = 'mental_health' AND unit = 'mood_score';

-- 8. Update mental_health missions (Stress)
UPDATE missions SET 
  sub_category = 'STRESS_LEVEL',
  tracking_mapping = JSON_OBJECT(
    'table', 'mood_tracking',
    'column', 'stress_level',
    'aggregation', 'AVG',
    'date_column', 'tracking_date'
  )
WHERE category = 'mental_health' AND unit = 'stress_level';

-- 9. Update daily_habit missions (Water Glasses)
UPDATE missions SET 
  sub_category = 'WATER_GLASSES',
  tracking_mapping = JSON_OBJECT(
    'table', 'water_tracking',
    'column', 'amount_ml',
    'aggregation', 'SUM',
    'date_column', 'tracking_date'
  )
WHERE category = 'daily_habit' AND unit = 'gelas';

-- 10. Update daily_habit missions (Sleep Hours)
UPDATE missions SET 
  sub_category = 'SLEEP_HOURS',
  tracking_mapping = JSON_OBJECT(
    'table', 'sleep_tracking',
    'column', 'sleep_hours',
    'aggregation', 'AVG',
    'date_column', 'sleep_date'
  )
WHERE category = 'daily_habit' AND unit = 'jam';

-- 11. Update mental_health missions (Daily Mood Logging)
UPDATE missions SET 
  sub_category = 'MOOD_LOGGING',
  tracking_mapping = JSON_OBJECT(
    'table', 'mood_tracking',
    'column', 'mood_level',
    'aggregation', 'COUNT',
    'date_column', 'tracking_date'
  )
WHERE category = 'mental_health' AND unit = 'kali';

-- 12. Verify all missions have sub_category and tracking_mapping
SELECT 
  category,
  sub_category,
  COUNT(*) as count,
  COUNT(CASE WHEN tracking_mapping IS NOT NULL THEN 1 END) as with_mapping
FROM missions 
GROUP BY category, sub_category
ORDER BY category, sub_category;

-- 13. Show missions without tracking mapping
SELECT 
  id,
  title,
  category,
  unit,
  sub_category,
  tracking_mapping
FROM missions 
WHERE tracking_mapping IS NULL
ORDER BY category, title;
