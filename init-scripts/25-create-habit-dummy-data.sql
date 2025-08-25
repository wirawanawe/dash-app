-- Migration: Create dummy data for habit activities
-- This script creates sample user habit activity completions for testing

USE phc_dashboard;

-- First, let's get some user IDs to work with
-- We'll use existing users or create test data

-- Clear any existing dummy data (optional - comment out if you want to keep existing data)
-- DELETE FROM user_habit_activities WHERE user_id IN (1, 2, 3);

-- Insert dummy data for user_id = 1 (assuming this user exists)
-- Today's completions
INSERT INTO user_habit_activities (
    user_id, activity_id, activity_date, habit_type, target_frequency, current_frequency, 
    unit, points_earned, notes, completed_at, created_at, updated_at
) VALUES
-- User 1 - Today's completions (various progress levels)
(1, 1, CURDATE(), 'daily', 1, 1, 'times', 10, 'Beribadah pagi hari', NOW(), NOW(), NOW()),
(1, 2, CURDATE(), 'daily', 1, 1, 'times', 8, 'Makan ikan salmon untuk protein', NOW(), NOW(), NOW()),
(1, 3, CURDATE(), 'daily', 1, 1, 'times', 12, 'Hindari roti dan pasta hari ini', NOW(), NOW(), NOW()),
(1, 4, CURDATE(), 'daily', 1, 1, 'times', 10, 'Tidak makan mie instan', NOW(), NOW(), NOW()),
(1, 5, CURDATE(), 'daily', 3, 2, 'times', 3, 'Mengunyah perlahan saat sarapan dan makan siang', NOW(), NOW(), NOW()),
(1, 6, CURDATE(), 'daily', 1, 1, 'times', 6, 'Tidak makan buah dengan nasi', NOW(), NOW(), NOW()),
(1, 7, CURDATE(), 'daily', 3, 2, 'times', 5, 'Tidak minum air saat sarapan dan makan siang', NOW(), NOW(), NOW()),
(1, 8, CURDATE(), 'daily', 3, 1, 'times', 2, 'Minum air 1 jam setelah sarapan', NOW(), NOW(), NOW()),
(1, 9, CURDATE(), 'daily', 8, 5, 'times', 9, 'Minum air setiap jam (5/8)', NOW(), NOW(), NOW()),
(1, 10, CURDATE(), 'daily', 8, 3, 'times', 2, 'Minum seteguk demi seteguk (3/8)', NOW(), NOW(), NOW()),
(1, 11, CURDATE(), 'daily', 3, 2, 'times', 7, 'Tidak tidur setelah sarapan dan makan siang', NOW(), NOW(), NOW()),
(1, 12, CURDATE(), 'daily', 1, 0, 'times', 0, 'Belum tidur, masih jam 23:00', NOW(), NOW(), NOW()),
(1, 13, CURDATE(), 'daily', 1, 1, 'times', 20, 'Jalan kaki 30 menit pagi hari', NOW(), NOW(), NOW()),
(1, 14, CURDATE(), 'daily', 1, 0, 'times', 0, 'Belum meditasi hari ini', NOW(), NOW(), NOW()),

-- User 1 - Yesterday's completions
(1, 1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'daily', 1, 1, 'times', 10, 'Beribadah pagi hari', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(1, 2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'daily', 1, 1, 'times', 8, 'Makan ayam untuk protein', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(1, 3, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'daily', 1, 1, 'times', 12, 'Hindari roti hari ini', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(1, 9, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'daily', 8, 8, 'times', 15, 'Minum air setiap jam (8/8)', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(1, 13, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'daily', 1, 1, 'times', 20, 'Jalan kaki 45 menit', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(1, 15, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'daily', 1, 1, 'pages', 10, 'Membaca Al-Quran 2 halaman', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),

-- User 1 - 2 days ago completions
(1, 1, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'daily', 1, 1, 'times', 10, 'Beribadah pagi hari', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(1, 2, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'daily', 1, 1, 'times', 8, 'Makan telur untuk protein', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(1, 9, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'daily', 8, 6, 'times', 11, 'Minum air setiap jam (6/8)', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(1, 13, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'daily', 1, 1, 'times', 20, 'Jalan kaki 60 menit', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),

-- User 2 - Today's completions (different user, different habits)
(2, 1, CURDATE(), 'daily', 1, 1, 'times', 10, 'Beribadah pagi hari', NOW(), NOW(), NOW()),
(2, 2, CURDATE(), 'daily', 1, 1, 'times', 8, 'Makan daging sapi untuk protein', NOW(), NOW(), NOW()),
(2, 5, CURDATE(), 'daily', 3, 3, 'times', 5, 'Mengunyah perlahan semua makan', NOW(), NOW(), NOW()),
(2, 9, CURDATE(), 'daily', 8, 8, 'times', 15, 'Minum air setiap jam (8/8)', NOW(), NOW(), NOW()),
(2, 10, CURDATE(), 'daily', 8, 8, 'times', 5, 'Minum seteguk demi seteguk (8/8)', NOW(), NOW(), NOW()),
(2, 11, CURDATE(), 'daily', 3, 3, 'times', 10, 'Tidak tidur setelah semua makan', NOW(), NOW(), NOW()),
(2, 12, CURDATE(), 'daily', 1, 1, 'times', 15, 'Tidur jam 21:30', NOW(), NOW(), NOW()),
(2, 13, CURDATE(), 'daily', 1, 1, 'times', 20, 'Jalan kaki 40 menit', NOW(), NOW(), NOW()),
(2, 14, CURDATE(), 'daily', 1, 1, 'times', 12, 'Meditasi 15 menit', NOW(), NOW(), NOW()),
(2, 15, CURDATE(), 'daily', 1, 1, 'pages', 10, 'Membaca Al-Quran 1 halaman', NOW(), NOW(), NOW()),
(2, 16, CURDATE(), 'daily', 5, 5, 'times', 15, 'Shalat tepat waktu semua', NOW(), NOW(), NOW()),
(2, 18, CURDATE(), 'daily', 1, 1, 'times', 12, 'Membaca buku 30 menit', NOW(), NOW(), NOW()),
(2, 19, CURDATE(), 'daily', 1, 1, 'times', 15, 'Meditasi 20 menit', NOW(), NOW(), NOW()),
(2, 20, CURDATE(), 'daily', 1, 1, 'times', 18, 'Jalan kaki 10.000 langkah', NOW(), NOW(), NOW()),
(2, 21, CURDATE(), 'daily', 1, 1, 'times', 8, 'Stretching 15 menit', NOW(), NOW(), NOW()),
(2, 22, CURDATE(), 'daily', 8, 8, 'glasses', 12, 'Minum air 8 gelas', NOW(), NOW(), NOW()),
(2, 23, CURDATE(), 'daily', 1, 1, 'times', 10, 'Sarapan sehat dengan oatmeal', NOW(), NOW(), NOW()),
(2, 24, CURDATE(), 'daily', 3, 3, 'portions', 12, 'Makan sayur 3 porsi', NOW(), NOW(), NOW()),
(2, 25, CURDATE(), 'daily', 1, 1, 'times', 15, 'Tidur 8 jam', NOW(), NOW(), NOW()),
(2, 26, CURDATE(), 'daily', 1, 1, 'times', 20, 'Bangun pagi jam 05:00', NOW(), NOW(), NOW()),
(2, 27, CURDATE(), 'daily', 3, 3, 'times', 5, 'Bersyukur 3 kali', NOW(), NOW(), NOW()),
(2, 28, CURDATE(), 'daily', 1, 1, 'times', 15, 'Sedekah Rp 10.000', NOW(), NOW(), NOW()),

-- User 3 - Today's completions (partial completion user)
(3, 1, CURDATE(), 'daily', 1, 1, 'times', 10, 'Beribadah pagi hari', NOW(), NOW(), NOW()),
(3, 2, CURDATE(), 'daily', 1, 0, 'times', 0, 'Belum makan protein hewani', NOW(), NOW(), NOW()),
(3, 9, CURDATE(), 'daily', 8, 4, 'times', 8, 'Minum air setiap jam (4/8)', NOW(), NOW(), NOW()),
(3, 13, CURDATE(), 'daily', 1, 0, 'times', 0, 'Belum olahraga hari ini', NOW(), NOW(), NOW()),
(3, 15, CURDATE(), 'daily', 1, 1, 'pages', 10, 'Membaca Al-Quran 1 halaman', NOW(), NOW(), NOW()),
(3, 16, CURDATE(), 'daily', 5, 3, 'times', 9, 'Shalat tepat waktu (3/5)', NOW(), NOW(), NOW()),
(3, 22, CURDATE(), 'daily', 8, 5, 'glasses', 8, 'Minum air 5 gelas', NOW(), NOW(), NOW()),
(3, 24, CURDATE(), 'daily', 3, 1, 'portions', 4, 'Makan sayur 1 porsi', NOW(), NOW(), NOW()),

-- Weekly habit completion (Puasa Senin Kamis)
(1, 17, CURDATE(), 'weekly', 2, 1, 'times', 12, 'Puasa Senin', NOW(), NOW(), NOW()),
(2, 17, CURDATE(), 'weekly', 2, 2, 'times', 25, 'Puasa Senin dan Kamis', NOW(), NOW(), NOW()),
(3, 17, CURDATE(), 'weekly', 2, 0, 'times', 0, 'Belum puasa minggu ini', NOW(), NOW(), NOW());

-- Show dummy data summary
SELECT 
    'Dummy data created' as status,
    COUNT(*) as total_habit_completions,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT activity_date) as unique_dates,
    SUM(points_earned) as total_points_earned
FROM user_habit_activities;

-- Show completion summary by user
SELECT 
    user_id,
    COUNT(*) as total_completions,
    SUM(points_earned) as total_points,
    COUNT(DISTINCT activity_date) as active_days
FROM user_habit_activities 
GROUP BY user_id 
ORDER BY user_id;

-- Show completion summary by category
SELECT 
    ha.category,
    COUNT(uha.id) as total_completions,
    SUM(uha.points_earned) as total_points,
    COUNT(DISTINCT uha.user_id) as unique_users
FROM user_habit_activities uha
JOIN available_habit_activities ha ON uha.activity_id = ha.id
GROUP BY ha.category
ORDER BY total_completions DESC;

-- Show today's completion status
SELECT 
    ha.title,
    ha.category,
    COUNT(uha.id) as completed_users,
    AVG(uha.current_frequency) as avg_frequency,
    AVG(uha.points_earned) as avg_points
FROM available_habit_activities ha
LEFT JOIN user_habit_activities uha ON ha.id = uha.activity_id AND uha.activity_date = CURDATE()
GROUP BY ha.id, ha.title, ha.category
ORDER BY ha.category, ha.title;
