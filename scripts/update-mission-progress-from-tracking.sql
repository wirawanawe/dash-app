-- Update Mission Progress from Tracking Data SQL Script
-- This script updates all mission progress based on existing tracking data

-- 1. Update water intake missions
UPDATE user_missions um
JOIN missions m ON um.mission_id = m.id
JOIN (
  SELECT user_id, SUM(amount_ml) as total_water
  FROM water_tracking 
  WHERE tracking_date = CURDATE()
  GROUP BY user_id
) wt ON um.user_id = wt.user_id
SET 
  um.current_value = wt.total_water,
  um.progress = LEAST((wt.total_water / m.target_value) * 100, 100),
  um.status = CASE 
    WHEN wt.total_water >= m.target_value THEN 'completed'
    ELSE 'active'
  END,
  um.updated_at = NOW()
WHERE m.category = 'health_tracking' 
  AND m.sub_category = 'WATER_INTAKE'
  AND um.status = 'active';

-- 2. Update sleep duration missions
UPDATE user_missions um
JOIN missions m ON um.mission_id = m.id
JOIN (
  SELECT user_id, AVG(sleep_hours) as avg_sleep
  FROM sleep_tracking 
  WHERE sleep_date = CURDATE()
  GROUP BY user_id
) st ON um.user_id = st.user_id
SET 
  um.current_value = st.avg_sleep,
  um.progress = LEAST((st.avg_sleep / m.target_value) * 100, 100),
  um.status = CASE 
    WHEN st.avg_sleep >= m.target_value THEN 'completed'
    ELSE 'active'
  END,
  um.updated_at = NOW()
WHERE m.category = 'health_tracking' 
  AND m.sub_category = 'SLEEP_DURATION'
  AND um.status = 'active';

-- 3. Update fitness steps missions
UPDATE user_missions um
JOIN missions m ON um.mission_id = m.id
JOIN (
  SELECT user_id, SUM(steps) as total_steps
  FROM fitness_tracking 
  WHERE tracking_date = CURDATE()
  GROUP BY user_id
) ft ON um.user_id = ft.user_id
SET 
  um.current_value = ft.total_steps,
  um.progress = LEAST((ft.total_steps / m.target_value) * 100, 100),
  um.status = CASE 
    WHEN ft.total_steps >= m.target_value THEN 'completed'
    ELSE 'active'
  END,
  um.updated_at = NOW()
WHERE m.category = 'fitness' 
  AND m.sub_category = 'STEPS'
  AND um.status = 'active';

-- 4. Update fitness duration missions
UPDATE user_missions um
JOIN missions m ON um.mission_id = m.id
JOIN (
  SELECT user_id, SUM(exercise_minutes) as total_minutes
  FROM fitness_tracking 
  WHERE tracking_date = CURDATE()
  GROUP BY user_id
) ft ON um.user_id = ft.user_id
SET 
  um.current_value = ft.total_minutes,
  um.progress = LEAST((ft.total_minutes / m.target_value) * 100, 100),
  um.status = CASE 
    WHEN ft.total_minutes >= m.target_value THEN 'completed'
    ELSE 'active'
  END,
  um.updated_at = NOW()
WHERE m.category = 'fitness' 
  AND m.sub_category = 'DURATION'
  AND um.status = 'active';

-- 5. Update nutrition calories missions
UPDATE user_missions um
JOIN missions m ON um.mission_id = m.id
JOIN (
  SELECT user_id, SUM(calories) as total_calories
  FROM meal_logging 
  WHERE DATE(recorded_at) = CURDATE()
  GROUP BY user_id
) ml ON um.user_id = ml.user_id
SET 
  um.current_value = ml.total_calories,
  um.progress = LEAST((ml.total_calories / m.target_value) * 100, 100),
  um.status = CASE 
    WHEN ml.total_calories >= m.target_value THEN 'completed'
    ELSE 'active'
  END,
  um.updated_at = NOW()
WHERE m.category = 'nutrition' 
  AND m.sub_category = 'CALORIES_INTAKE'
  AND um.status = 'active';

-- 6. Update nutrition meal count missions
UPDATE user_missions um
JOIN missions m ON um.mission_id = m.id
JOIN (
  SELECT user_id, COUNT(DISTINCT meal_type) as meal_count
  FROM meal_logging 
  WHERE DATE(recorded_at) = CURDATE()
  GROUP BY user_id
) ml ON um.user_id = ml.user_id
SET 
  um.current_value = ml.meal_count,
  um.progress = LEAST((ml.meal_count / m.target_value) * 100, 100),
  um.status = CASE 
    WHEN ml.meal_count >= m.target_value THEN 'completed'
    ELSE 'active'
  END,
  um.updated_at = NOW()
WHERE m.category = 'nutrition' 
  AND m.sub_category = 'MEAL_COUNT'
  AND um.status = 'active';

-- 7. Update mental health mood score missions
UPDATE user_missions um
JOIN missions m ON um.mission_id = m.id
JOIN (
  SELECT user_id, AVG(mood_score) as avg_mood
  FROM mood_tracking 
  WHERE tracking_date = CURDATE()
  GROUP BY user_id
) mt ON um.user_id = mt.user_id
SET 
  um.current_value = mt.avg_mood,
  um.progress = LEAST((mt.avg_mood / m.target_value) * 100, 100),
  um.status = CASE 
    WHEN mt.avg_mood >= m.target_value THEN 'completed'
    ELSE 'active'
  END,
  um.updated_at = NOW()
WHERE m.category = 'mental_health' 
  AND m.sub_category = 'MOOD_SCORE'
  AND um.status = 'active';

-- 8. Update mental health stress level missions
UPDATE user_missions um
JOIN missions m ON um.mission_id = m.id
JOIN (
  SELECT user_id, AVG(CASE 
    WHEN stress_level = 'low' THEN 1
    WHEN stress_level = 'moderate' THEN 2
    WHEN stress_level = 'high' THEN 3
    WHEN stress_level = 'very_high' THEN 4
    ELSE 2
  END) as avg_stress
  FROM mood_tracking 
  WHERE tracking_date = CURDATE()
  GROUP BY user_id
) mt ON um.user_id = mt.user_id
SET 
  um.current_value = mt.avg_stress,
  um.progress = LEAST((mt.avg_stress / m.target_value) * 100, 100),
  um.status = CASE 
    WHEN mt.avg_stress <= m.target_value THEN 'completed'
    ELSE 'active'
  END,
  um.updated_at = NOW()
WHERE m.category = 'mental_health' 
  AND m.sub_category = 'STRESS_LEVEL'
  AND um.status = 'active';

-- 9. Update mental health mood logging missions
UPDATE user_missions um
JOIN missions m ON um.mission_id = m.id
JOIN (
  SELECT user_id, COUNT(*) as mood_count
  FROM mood_tracking 
  WHERE tracking_date = CURDATE()
  GROUP BY user_id
) mt ON um.user_id = mt.user_id
SET 
  um.current_value = mt.mood_count,
  um.progress = LEAST((mt.mood_count / m.target_value) * 100, 100),
  um.status = CASE 
    WHEN mt.mood_count >= m.target_value THEN 'completed'
    ELSE 'active'
  END,
  um.updated_at = NOW()
WHERE m.category = 'mental_health' 
  AND m.sub_category = 'MOOD_LOGGING'
  AND um.status = 'active';

-- 10. Show summary of updated missions
SELECT 
  m.category,
  m.sub_category,
  COUNT(*) as total_missions,
  COUNT(CASE WHEN um.status = 'completed' THEN 1 END) as completed_missions,
  COUNT(CASE WHEN um.status = 'active' THEN 1 END) as active_missions
FROM user_missions um
JOIN missions m ON um.mission_id = m.id
WHERE um.updated_at >= CURDATE()
GROUP BY m.category, m.sub_category
ORDER BY m.category, m.sub_category;
