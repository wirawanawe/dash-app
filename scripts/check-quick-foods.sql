-- Check food database
SELECT 'Food Database' as section, id, name FROM food_database ORDER BY id;

-- Check all quick foods
SELECT 'All Quick Foods' as section, uqf.id, uqf.user_id, uqf.food_id, uqf.custom_name, fd.name as food_name
FROM user_quick_foods uqf
LEFT JOIN food_database fd ON uqf.food_id = fd.id
ORDER BY uqf.user_id, uqf.food_id;

-- Check for orphaned quick foods
SELECT 'Orphaned Quick Foods' as section, uqf.id, uqf.user_id, uqf.food_id, uqf.custom_name
FROM user_quick_foods uqf
LEFT JOIN food_database fd ON uqf.food_id = fd.id
WHERE fd.id IS NULL;

-- Check specific food ID 25
SELECT 'Food ID 25 Check' as section, id, name FROM food_database WHERE id = 25;

-- Check quick foods with food_id = 25
SELECT 'Quick Foods with Food ID 25' as section, id, user_id, food_id, custom_name FROM user_quick_foods WHERE food_id = 25;
