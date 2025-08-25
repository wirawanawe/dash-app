-- Migration: Create extended dummy data for habit activities
-- This script creates more diverse sample data for comprehensive testing

USE phc_dashboard;

-- Create additional dummy data for the past week
-- This will help test history views and statistics

-- User 1 - Past week data (showing progress over time)
INSERT INTO user_habit_activities (
    user_id, activity_id, activity_date, habit_type, target_frequency, current_frequency, 
    unit, points_earned, notes, completed_at, created_at, updated_at
) VALUES
-- 3 days ago
(1, 1, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'daily', 1, 1, 'times', 10, 'Beribadah pagi hari', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
(1, 2, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'daily', 1, 1, 'times', 8, 'Makan ikan tuna untuk protein', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
(1, 9, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'daily', 8, 7, 'times', 13, 'Minum air setiap jam (7/8)', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
(1, 13, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'daily', 1, 1, 'times', 20, 'Jalan kaki 35 menit', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
(1, 15, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'daily', 1, 1, 'pages', 10, 'Membaca Al-Quran 1 halaman', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),

-- 4 days ago
(1, 1, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'daily', 1, 1, 'times', 10, 'Beribadah pagi hari', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
(1, 2, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'daily', 1, 0, 'times', 0, 'Lupa makan protein hewani', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
(1, 9, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'daily', 8, 4, 'times', 8, 'Minum air setiap jam (4/8)', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
(1, 13, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'daily', 1, 0, 'times', 0, 'Tidak olahraga hari ini', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),

-- 5 days ago
(1, 1, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'daily', 1, 1, 'times', 10, 'Beribadah pagi hari', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
(1, 2, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'daily', 1, 1, 'times', 8, 'Makan ayam untuk protein', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
(1, 9, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'daily', 8, 6, 'times', 11, 'Minum air setiap jam (6/8)', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
(1, 13, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'daily', 1, 1, 'times', 20, 'Jalan kaki 50 menit', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
(1, 15, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'daily', 1, 1, 'pages', 10, 'Membaca Al-Quran 1 halaman', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),

-- 6 days ago
(1, 1, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'daily', 1, 1, 'times', 10, 'Beribadah pagi hari', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY)),
(1, 2, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'daily', 1, 1, 'times', 8, 'Makan telur untuk protein', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY)),
(1, 9, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'daily', 8, 8, 'times', 15, 'Minum air setiap jam (8/8)', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY)),
(1, 13, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'daily', 1, 1, 'times', 20, 'Jalan kaki 40 menit', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY)),

-- 7 days ago
(1, 1, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'daily', 1, 1, 'times', 10, 'Beribadah pagi hari', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
(1, 2, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'daily', 1, 0, 'times', 0, 'Tidak makan protein hewani', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
(1, 9, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'daily', 8, 3, 'times', 6, 'Minum air setiap jam (3/8)', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
(1, 13, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'daily', 1, 0, 'times', 0, 'Tidak olahraga hari ini', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY));

-- User 4 - New user with minimal data (for testing new user scenarios)
INSERT INTO user_habit_activities (
    user_id, activity_id, activity_date, habit_type, target_frequency, current_frequency, 
    unit, points_earned, notes, completed_at, created_at, updated_at
) VALUES
-- User 4 - Today only (new user)
(4, 1, CURDATE(), 'daily', 1, 1, 'times', 10, 'Beribadah pagi hari', NOW(), NOW(), NOW()),
(4, 9, CURDATE(), 'daily', 8, 2, 'times', 4, 'Minum air setiap jam (2/8)', NOW(), NOW(), NOW()),
(4, 15, CURDATE(), 'daily', 1, 1, 'pages', 10, 'Membaca Al-Quran 1 halaman', NOW(), NOW(), NOW());

-- User 5 - High achiever (for testing leaderboards and statistics)
INSERT INTO user_habit_activities (
    user_id, activity_id, activity_date, habit_type, target_frequency, current_frequency, 
    unit, points_earned, notes, completed_at, created_at, updated_at
) VALUES
-- User 5 - Today (high achiever)
(5, 1, CURDATE(), 'daily', 1, 1, 'times', 10, 'Beribadah pagi hari', NOW(), NOW(), NOW()),
(5, 2, CURDATE(), 'daily', 1, 1, 'times', 8, 'Makan salmon untuk protein', NOW(), NOW(), NOW()),
(5, 3, CURDATE(), 'daily', 1, 1, 'times', 12, 'Hindari roti dan pasta', NOW(), NOW(), NOW()),
(5, 4, CURDATE(), 'daily', 1, 1, 'times', 10, 'Tidak makan mie instan', NOW(), NOW(), NOW()),
(5, 5, CURDATE(), 'daily', 3, 3, 'times', 5, 'Mengunyah perlahan semua makan', NOW(), NOW(), NOW()),
(5, 6, CURDATE(), 'daily', 1, 1, 'times', 6, 'Tidak makan buah dengan nasi', NOW(), NOW(), NOW()),
(5, 7, CURDATE(), 'daily', 3, 3, 'times', 8, 'Tidak minum air saat semua makan', NOW(), NOW(), NOW()),
(5, 8, CURDATE(), 'daily', 3, 3, 'times', 7, 'Minum air 1 jam setelah semua makan', NOW(), NOW(), NOW()),
(5, 9, CURDATE(), 'daily', 8, 8, 'times', 15, 'Minum air setiap jam (8/8)', NOW(), NOW(), NOW()),
(5, 10, CURDATE(), 'daily', 8, 8, 'times', 5, 'Minum seteguk demi seteguk (8/8)', NOW(), NOW(), NOW()),
(5, 11, CURDATE(), 'daily', 3, 3, 'times', 10, 'Tidak tidur setelah semua makan', NOW(), NOW(), NOW()),
(5, 12, CURDATE(), 'daily', 1, 1, 'times', 15, 'Tidur jam 21:00', NOW(), NOW(), NOW()),
(5, 13, CURDATE(), 'daily', 1, 1, 'times', 20, 'Jalan kaki 60 menit', NOW(), NOW(), NOW()),
(5, 14, CURDATE(), 'daily', 1, 1, 'times', 12, 'Meditasi 15 menit', NOW(), NOW(), NOW()),
(5, 15, CURDATE(), 'daily', 1, 1, 'pages', 10, 'Membaca Al-Quran 1 halaman', NOW(), NOW(), NOW()),
(5, 16, CURDATE(), 'daily', 5, 5, 'times', 15, 'Shalat tepat waktu semua', NOW(), NOW(), NOW()),
(5, 17, CURDATE(), 'weekly', 2, 2, 'times', 25, 'Puasa Senin dan Kamis', NOW(), NOW(), NOW()),
(5, 18, CURDATE(), 'daily', 1, 1, 'times', 12, 'Membaca buku 30 menit', NOW(), NOW(), NOW()),
(5, 19, CURDATE(), 'daily', 1, 1, 'times', 15, 'Meditasi 20 menit', NOW(), NOW(), NOW()),
(5, 20, CURDATE(), 'daily', 1, 1, 'times', 18, 'Jalan kaki 10.000 langkah', NOW(), NOW(), NOW()),
(5, 21, CURDATE(), 'daily', 1, 1, 'times', 8, 'Stretching 15 menit', NOW(), NOW(), NOW()),
(5, 22, CURDATE(), 'daily', 8, 8, 'glasses', 12, 'Minum air 8 gelas', NOW(), NOW(), NOW()),
(5, 23, CURDATE(), 'daily', 1, 1, 'times', 10, 'Sarapan sehat dengan oatmeal', NOW(), NOW(), NOW()),
(5, 24, CURDATE(), 'daily', 3, 3, 'portions', 12, 'Makan sayur 3 porsi', NOW(), NOW(), NOW()),
(5, 25, CURDATE(), 'daily', 1, 1, 'times', 15, 'Tidur 8 jam', NOW(), NOW(), NOW()),
(5, 26, CURDATE(), 'daily', 1, 1, 'times', 20, 'Bangun pagi jam 05:00', NOW(), NOW(), NOW()),
(5, 27, CURDATE(), 'daily', 3, 3, 'times', 5, 'Bersyukur 3 kali', NOW(), NOW(), NOW()),
(5, 28, CURDATE(), 'daily', 1, 1, 'times', 15, 'Sedekah Rp 10.000', NOW(), NOW(), NOW());

-- Create some historical data for User 5 (past week)
INSERT INTO user_habit_activities (
    user_id, activity_id, activity_date, habit_type, target_frequency, current_frequency, 
    unit, points_earned, notes, completed_at, created_at, updated_at
) VALUES
-- User 5 - Yesterday
(5, 1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'daily', 1, 1, 'times', 10, 'Beribadah pagi hari', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(5, 2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'daily', 1, 1, 'times', 8, 'Makan ayam untuk protein', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(5, 9, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'daily', 8, 8, 'times', 15, 'Minum air setiap jam (8/8)', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(5, 13, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'daily', 1, 1, 'times', 20, 'Jalan kaki 45 menit', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(5, 15, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'daily', 1, 1, 'pages', 10, 'Membaca Al-Quran 1 halaman', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(5, 16, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'daily', 5, 5, 'times', 15, 'Shalat tepat waktu semua', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(5, 22, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'daily', 8, 8, 'glasses', 12, 'Minum air 8 gelas', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(5, 24, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'daily', 3, 3, 'portions', 12, 'Makan sayur 3 porsi', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(5, 25, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'daily', 1, 1, 'times', 15, 'Tidur 8 jam', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(5, 26, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'daily', 1, 1, 'times', 20, 'Bangun pagi jam 05:30', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Show extended dummy data summary
SELECT 
    'Extended dummy data created' as status,
    COUNT(*) as total_habit_completions,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT activity_date) as unique_dates,
    SUM(points_earned) as total_points_earned
FROM user_habit_activities;

-- Show user ranking by total points
SELECT 
    user_id,
    COUNT(*) as total_completions,
    SUM(points_earned) as total_points,
    COUNT(DISTINCT activity_date) as active_days,
    ROUND(AVG(points_earned), 2) as avg_points_per_completion
FROM user_habit_activities 
GROUP BY user_id 
ORDER BY total_points DESC;

-- Show weekly progress for User 1
SELECT 
    activity_date,
    COUNT(*) as completions,
    SUM(points_earned) as daily_points,
    COUNT(DISTINCT activity_id) as unique_habits
FROM user_habit_activities 
WHERE user_id = 1 
AND activity_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY activity_date
ORDER BY activity_date DESC;

-- Show most popular habits
SELECT 
    ha.title,
    ha.category,
    COUNT(uha.id) as total_completions,
    COUNT(DISTINCT uha.user_id) as unique_users,
    ROUND(AVG(uha.points_earned), 2) as avg_points
FROM available_habit_activities ha
LEFT JOIN user_habit_activities uha ON ha.id = uha.activity_id
GROUP BY ha.id, ha.title, ha.category
ORDER BY total_completions DESC
LIMIT 10;

-- Show completion rate by category
SELECT 
    ha.category,
    COUNT(DISTINCT ha.id) as total_available_habits,
    COUNT(DISTINCT uha.activity_id) as completed_habits,
    COUNT(uha.id) as total_completions,
    ROUND(COUNT(DISTINCT uha.activity_id) * 100.0 / COUNT(DISTINCT ha.id), 2) as completion_rate_percent
FROM available_habit_activities ha
LEFT JOIN user_habit_activities uha ON ha.id = uha.activity_id
GROUP BY ha.category
ORDER BY completion_rate_percent DESC;
