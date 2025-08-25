-- Update Missing Mission Progress
-- This script updates any missions that might not have been updated in the previous run

USE phc_dashboard;

-- ========================================
-- UPDATE MISSING FITNESS MISSIONS (Steps & Exercise)
-- ========================================

-- Update Steps Missions that might have been missed
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
  AND um.status = 'active'
  AND um.current_value = 0;

-- Update Exercise Minutes Missions that might have been missed
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
  AND um.status = 'active'
  AND um.current_value = 0;

-- ========================================
-- UPDATE MISSING HEALTH TRACKING MISSIONS (Water & Sleep)
-- ========================================

-- Update Water Missions that might have been missed
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
  AND um.status = 'active'
  AND um.current_value = 0;

-- Update Sleep Missions that might have been missed
UPDATE user_missions um
JOIN missions m ON um.mission_id = m.id
JOIN (
    SELECT 
        user_id,
        sleep_date,
        SUM(sleep_hours) as total_sleep_hours
    FROM sleep_tracking 
    GROUP BY user_id, sleep_date
) st ON um.user_id = st.user_id AND um.mission_date = st.sleep_date
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
  AND um.status = 'active'
  AND um.current_value = 0;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check all missions by category to see if any are still at 0 progress
SELECT 
    m.category,
    m.unit,
    COUNT(*) as total_missions,
    SUM(CASE WHEN um.current_value = 0 THEN 1 ELSE 0 END) as zero_progress_missions,
    SUM(CASE WHEN um.status = 'completed' THEN 1 ELSE 0 END) as completed_missions,
    AVG(um.progress) as avg_progress
FROM user_missions um
JOIN missions m ON um.mission_id = m.id
WHERE m.is_active = TRUE
GROUP BY m.category, m.unit
ORDER BY m.category, m.unit;

-- Show missions that still have 0 progress
SELECT 
    um.id,
    um.user_id,
    m.title,
    m.category,
    m.unit,
    um.status,
    um.progress,
    um.current_value,
    m.target_value,
    um.mission_date
FROM user_missions um
JOIN missions m ON um.mission_id = m.id
WHERE m.is_active = TRUE
  AND um.current_value = 0
  AND um.status = 'active'
ORDER BY m.category, m.unit, um.id;

-- Show summary of all mission progress
SELECT 
    m.category,
    COUNT(*) as total_missions,
    SUM(CASE WHEN um.status = 'completed' THEN 1 ELSE 0 END) as completed_missions,
    SUM(CASE WHEN um.status = 'active' AND um.progress > 0 THEN 1 ELSE 0 END) as active_with_progress,
    SUM(CASE WHEN um.status = 'active' AND um.progress = 0 THEN 1 ELSE 0 END) as active_no_progress,
    AVG(um.progress) as avg_progress
FROM user_missions um
JOIN missions m ON um.mission_id = m.id
WHERE m.is_active = TRUE
GROUP BY m.category
ORDER BY m.category;
