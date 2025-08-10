-- Clean up orphaned quick foods (food_id not in food_database)
DELETE FROM user_quick_foods 
WHERE food_id NOT IN (SELECT id FROM food_database);

-- Show remaining quick foods after cleanup
SELECT 'Remaining Quick Foods' as section, uqf.id, uqf.user_id, uqf.food_id, uqf.custom_name, fd.name as food_name
FROM user_quick_foods uqf
LEFT JOIN food_database fd ON uqf.food_id = fd.id
ORDER BY uqf.user_id, uqf.food_id;
