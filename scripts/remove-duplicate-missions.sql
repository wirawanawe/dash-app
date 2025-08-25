-- Remove Duplicate Missions SQL Script
-- This script removes all duplicate missions while keeping the oldest one (lowest ID)

-- 1. Remove user_missions for duplicate missions
DELETE um FROM user_missions um
JOIN (
    SELECT m2.id
    FROM missions m1
    JOIN missions m2 ON m1.title = m2.title 
        AND m1.category = m2.category 
        AND m1.target_value = m2.target_value 
        AND m1.unit = m2.unit
    WHERE m1.id < m2.id
) duplicates ON um.mission_id = duplicates.id;

-- 2. Remove duplicate missions (keep the oldest one)
DELETE m2 FROM missions m1
JOIN missions m2 ON m1.title = m2.title 
    AND m1.category = m2.category 
    AND m1.target_value = m2.target_value 
    AND m1.unit = m2.unit
WHERE m1.id < m2.id;

-- 3. Verify no duplicates remain
SELECT title, category, target_value, unit, COUNT(*) as count
FROM missions 
GROUP BY title, category, target_value, unit 
HAVING COUNT(*) > 1 
ORDER BY count DESC;
