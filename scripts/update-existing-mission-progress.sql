-- Update Existing Mission Progress Based on Tracking Data
-- This script calculates and updates mission progress for existing tracking data

USE phc_dashboard;

-- ========================================
-- UPDATE FITNESS MISSIONS (Steps & Exercise)
-- ========================================

-- Update Steps Missions based on fitness_tracking data
UPDATE user_missions um
JOIN missions m ON um.mission_id = m.id
JOIN (
    SELECT 
        user_id,
        tracking_date,
        SUM(COALESCE(steps, 0)) as total_steps
    FROM fitness_tracking 
    WHERE steps IS NOT NULL AND steps > 0
    GROUP BY user_id, tracking_date
) ft ON um.user_id = ft.user_id AND um.mission_date = ft.tracking_date
SET 
    um.current_value = ft.total_steps,
    um.progress = CASE 
        WHEN m.target_value > 0 THEN LEAST((ft.total_steps / m.target_value) * 100, 100)
        ELSE 0 
    END,
    um.status = CASE 
        WHEN ft.total_steps >= m.target_value THEN 'completed'
        ELSE 'active'
    END,
    um.updated_at = NOW()
WHERE m.category = 'fitness' 
  AND m.unit IN ('steps', 'langkah')
  AND um.status = 'active';

-- Update Exercise Minutes Missions based on fitness_tracking data
UPDATE user_missions um
JOIN missions m ON um.mission_id = m.id
JOIN (
    SELECT 
        user_id,
        tracking_date,
        SUM(COALESCE(exercise_minutes, duration_minutes, 0)) as total_minutes
    FROM fitness_tracking 
    WHERE (exercise_minutes IS NOT NULL AND exercise_minutes > 0) 
       OR (duration_minutes IS NOT NULL AND duration_minutes > 0)
    GROUP BY user_id, tracking_date
) ft ON um.user_id = ft.user_id AND um.mission_date = ft.tracking_date
SET 
    um.current_value = ft.total_minutes,
    um.progress = CASE 
        WHEN m.target_value > 0 THEN LEAST((ft.total_minutes / m.target_value) * 100, 100)
        ELSE 0 
    END,
    um.status = CASE 
        WHEN ft.total_minutes >= m.target_value THEN 'completed'
        ELSE 'active'
    END,
    um.updated_at = NOW()
WHERE m.category = 'fitness' 
  AND m.unit IN ('minutes', 'menit')
  AND um.status = 'active';

-- ========================================
-- UPDATE HEALTH TRACKING MISSIONS (Water & Sleep)
-- ========================================

-- Update Water Missions based on water_tracking data
UPDATE user_missions um
JOIN missions m ON um.mission_id = m.id
JOIN (
    SELECT 
        user_id,
        tracking_date,
        SUM(amount_ml) as total_water_ml
    FROM water_tracking 
    GROUP BY user_id, tracking_date
) wt ON um.user_id = wt.user_id AND um.mission_date = wt.tracking_date
SET 
    um.current_value = wt.total_water_ml,
    um.progress = CASE 
        WHEN m.target_value > 0 THEN LEAST((wt.total_water_ml / m.target_value) * 100, 100)
        ELSE 0 
    END,
    um.status = CASE 
        WHEN wt.total_water_ml >= m.target_value THEN 'completed'
        ELSE 'active'
    END,
    um.updated_at = NOW()
WHERE m.category = 'health_tracking' 
  AND m.unit = 'ml'
  AND um.status = 'active';

-- Update Sleep Missions based on sleep_tracking data
UPDATE user_missions um
JOIN missions m ON um.mission_id = m.id
JOIN (
    SELECT 
        user_id,
        tracking_date,
        SUM(sleep_hours) as total_sleep_hours
    FROM sleep_tracking 
    GROUP BY user_id, tracking_date
) st ON um.user_id = st.user_id AND um.mission_date = st.tracking_date
SET 
    um.current_value = st.total_sleep_hours,
    um.progress = CASE 
        WHEN m.target_value > 0 THEN LEAST((st.total_sleep_hours / m.target_value) * 100, 100)
        ELSE 0 
    END,
    um.status = CASE 
        WHEN st.total_sleep_hours >= m.target_value THEN 'completed'
        ELSE 'active'
    END,
    um.updated_at = NOW()
WHERE m.category = 'health_tracking' 
  AND m.unit = 'hours'
  AND um.status = 'active';

-- ========================================
-- UPDATE NUTRITION MISSIONS (Calories & Meals)
-- ========================================

-- Update Calorie Missions based on health_data (nutrition)
UPDATE user_missions um
JOIN missions m ON um.mission_id = m.id
JOIN (
    SELECT 
        user_id,
        tracking_date,
        SUM(calories) as total_calories
    FROM health_data 
    WHERE calories IS NOT NULL AND calories > 0
    GROUP BY user_id, tracking_date
) hd ON um.user_id = hd.user_id AND um.mission_date = hd.tracking_date
SET 
    um.current_value = hd.total_calories,
    um.progress = CASE 
        WHEN m.target_value > 0 THEN LEAST((hd.total_calories / m.target_value) * 100, 100)
        ELSE 0 
    END,
    um.status = CASE 
        WHEN hd.total_calories >= m.target_value THEN 'completed'
        ELSE 'active'
    END,
    um.updated_at = NOW()
WHERE m.category = 'nutrition' 
  AND m.unit = 'calories'
  AND um.status = 'active';

-- Update Meal Count Missions based on health_data
UPDATE user_missions um
JOIN missions m ON um.mission_id = m.id
JOIN (
    SELECT 
        user_id,
        tracking_date,
        COUNT(*) as meal_count
    FROM health_data 
    WHERE meal_type IS NOT NULL AND meal_type != ''
    GROUP BY user_id, tracking_date
) hd ON um.user_id = hd.user_id AND um.mission_date = hd.tracking_date
SET 
    um.current_value = hd.meal_count,
    um.progress = CASE 
        WHEN m.target_value > 0 THEN LEAST((hd.meal_count / m.target_value) * 100, 100)
        ELSE 0 
    END,
    um.status = CASE 
        WHEN hd.meal_count >= m.target_value THEN 'completed'
        ELSE 'active'
    END,
    um.updated_at = NOW()
WHERE m.category = 'nutrition' 
  AND m.unit = 'meals'
  AND um.status = 'active';

-- ========================================
-- UPDATE MENTAL HEALTH MISSIONS (Mood & Stress)
-- ========================================

-- Update Mood Missions based on mood_tracking data
UPDATE user_missions um
JOIN missions m ON um.mission_id = m.id
JOIN (
    SELECT 
        user_id,
        tracking_date,
        AVG(mood_score) as avg_mood_score
    FROM mood_tracking 
    WHERE mood_score IS NOT NULL AND mood_score > 0
    GROUP BY user_id, tracking_date
) mt ON um.user_id = mt.user_id AND um.mission_date = mt.tracking_date
SET 
    um.current_value = mt.avg_mood_score,
    um.progress = CASE 
        WHEN m.target_value > 0 THEN LEAST((mt.avg_mood_score / m.target_value) * 100, 100)
        ELSE 0 
    END,
    um.status = CASE 
        WHEN mt.avg_mood_score >= m.target_value THEN 'completed'
        ELSE 'active'
    END,
    um.updated_at = NOW()
WHERE m.category = 'mental_health' 
  AND m.unit = 'mood_score'
  AND um.status = 'active';

-- Update Stress Level Missions based on mood_tracking data
UPDATE user_missions um
JOIN missions m ON um.mission_id = m.id
JOIN (
    SELECT 
        user_id,
        tracking_date,
        AVG(CASE 
            WHEN stress_level = 'low' THEN 1
            WHEN stress_level = 'moderate' THEN 2
            WHEN stress_level = 'high' THEN 3
            WHEN stress_level = 'very_high' THEN 4
            ELSE 2
        END) as avg_stress_level
    FROM mood_tracking 
    WHERE stress_level IS NOT NULL
    GROUP BY user_id, tracking_date
) mt ON um.user_id = mt.user_id AND um.mission_date = mt.tracking_date
SET 
    um.current_value = mt.avg_stress_level,
    um.progress = CASE 
        WHEN m.target_value > 0 THEN LEAST(((5 - mt.avg_stress_level) / (5 - m.target_value)) * 100, 100)
        ELSE 0 
    END,
    um.status = CASE 
        WHEN mt.avg_stress_level <= m.target_value THEN 'completed'
        ELSE 'active'
    END,
    um.updated_at = NOW()
WHERE m.category = 'mental_health' 
  AND m.unit = 'stress_level'
  AND um.status = 'active';

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check updated mission progress by category
SELECT 
    m.category,
    COUNT(*) as total_missions,
    SUM(CASE WHEN um.status = 'completed' THEN 1 ELSE 0 END) as completed_missions,
    AVG(um.progress) as avg_progress,
    SUM(um.current_value) as total_current_value
FROM user_missions um
JOIN missions m ON um.mission_id = m.id
WHERE m.is_active = TRUE
GROUP BY m.category
ORDER BY m.category;

-- Show sample updated missions
SELECT 
    um.id,
    um.user_id,
    m.title,
    m.category,
    um.status,
    um.progress,
    um.current_value,
    m.target_value,
    m.unit
FROM user_missions um
JOIN missions m ON um.mission_id = m.id
WHERE m.is_active = TRUE
  AND um.progress > 0
ORDER BY um.progress DESC, m.category
LIMIT 10;

-- Show completed missions
SELECT 
    um.id,
    um.user_id,
    m.title,
    m.category,
    um.progress,
    um.current_value,
    m.target_value,
    m.unit
FROM user_missions um
JOIN missions m ON um.mission_id = m.id
WHERE m.is_active = TRUE
  AND um.status = 'completed'
ORDER BY m.category, um.updated_at DESC
LIMIT 10;
