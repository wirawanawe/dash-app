-- Cleanup and Create New Missions (Final - matches actual DB structure)
-- This script removes old data and creates new tracking-integrated missions

USE phc_dashboard;

-- ========================================
-- CLEANUP OLD DATA
-- ========================================

-- Clear old missions (keep only tracking-integrated ones)
DELETE FROM missions WHERE title NOT LIKE '%Tracking%' 
  AND title NOT LIKE '%Jalan%' 
  AND title NOT LIKE '%Air%' 
  AND title NOT LIKE '%Olahraga%' 
  AND title NOT LIKE '%Tidur%' 
  AND title NOT LIKE '%Mood%' 
  AND title NOT LIKE '%Kalori%'
  AND title NOT LIKE '%Minum%'
  AND title NOT LIKE '%Fitness%'
  AND title NOT LIKE '%Sleep%'
  AND title NOT LIKE '%Nutrition%'
  AND title NOT LIKE '%Mental%';

-- Clear old user missions (keep only tracking-integrated ones)
DELETE um FROM user_missions um 
JOIN missions m ON um.mission_id = m.id 
WHERE m.title NOT LIKE '%Tracking%' 
  AND m.title NOT LIKE '%Jalan%' 
  AND m.title NOT LIKE '%Air%' 
  AND m.title NOT LIKE '%Olahraga%' 
  AND m.title NOT LIKE '%Tidur%' 
  AND m.title NOT LIKE '%Mood%' 
  AND m.title NOT LIKE '%Kalori%'
  AND m.title NOT LIKE '%Minum%'
  AND m.title NOT LIKE '%Fitness%'
  AND m.title NOT LIKE '%Sleep%'
  AND m.title NOT LIKE '%Nutrition%'
  AND m.title NOT LIKE '%Mental%';

-- Clear old user wellness activities
DELETE FROM user_wellness_activities WHERE 1=1;

-- ========================================
-- CREATE NEW TRACKING-INTEGRATED MISSIONS
-- ========================================

-- Health Tracking Missions (Water & Sleep)
INSERT INTO missions (title, description, category, type, target_value, unit, points, icon, color, difficulty, is_active) VALUES
-- Water Intake Missions
('Minum Air 2 Liter Sehari', 'Minum minimal 2 liter air putih setiap hari untuk hidrasi optimal dan kesehatan tubuh', 'health_tracking', 'daily', 2000, 'ml', 75, 'water', '#3B82F6', 'easy', TRUE),
('Minum Air 3 Liter Sehari', 'Minum minimal 3 liter air putih setiap hari untuk performa maksimal dan detoksifikasi', 'health_tracking', 'daily', 3000, 'ml', 100, 'water', '#1D4ED8', 'medium', TRUE),
('Minum Air 4 Liter Sehari', 'Minum minimal 4 liter air putih setiap hari untuk atlet dan aktivitas intensif', 'health_tracking', 'daily', 4000, 'ml', 125, 'water', '#1E40AF', 'hard', TRUE),

-- Sleep Missions
('Tidur 8 Jam Sehari', 'Tidur minimal 8 jam setiap malam untuk kesehatan optimal dan pemulihan tubuh', 'health_tracking', 'daily', 8, 'hours', 60, 'sleep', '#8B5CF6', 'medium', TRUE),
('Tidur 7 Jam Sehari', 'Tidur minimal 7 jam setiap malam untuk kesehatan dasar dan fungsi kognitif', 'health_tracking', 'daily', 7, 'hours', 40, 'sleep', '#7C3AED', 'easy', TRUE),
('Tidur 9 Jam Sehari', 'Tidur minimal 9 jam setiap malam untuk pemulihan maksimal dan pertumbuhan', 'health_tracking', 'daily', 9, 'hours', 80, 'sleep', '#6D28D9', 'hard', TRUE);

-- Fitness Missions
INSERT INTO missions (title, description, category, type, target_value, unit, points, icon, color, difficulty, is_active) VALUES
-- Steps Missions
('Jalan 10.000 Langkah', 'Berjalan minimal 10.000 langkah setiap hari untuk kesehatan jantung dan kebugaran', 'fitness', 'daily', 10000, 'steps', 60, 'walking', '#10B981', 'medium', TRUE),
('Jalan 5.000 Langkah', 'Berjalan minimal 5.000 langkah setiap hari untuk aktivitas dasar dan kesehatan', 'fitness', 'daily', 5000, 'steps', 30, 'walking', '#059669', 'easy', TRUE),
('Jalan 15.000 Langkah', 'Berjalan minimal 15.000 langkah setiap hari untuk kebugaran tinggi dan pembakaran kalori', 'fitness', 'daily', 15000, 'steps', 90, 'walking', '#047857', 'hard', TRUE),

-- Exercise Missions
('Olahraga 30 Menit', 'Melakukan aktivitas fisik minimal 30 menit setiap hari untuk kesehatan jantung', 'fitness', 'daily', 30, 'minutes', 50, 'fitness', '#F59E0B', 'medium', TRUE),
('Olahraga 60 Menit', 'Melakukan aktivitas fisik minimal 60 menit setiap hari untuk kebugaran optimal', 'fitness', 'daily', 60, 'minutes', 80, 'fitness', '#D97706', 'hard', TRUE),
('Olahraga 15 Menit', 'Melakukan aktivitas fisik minimal 15 menit setiap hari untuk kesehatan dasar', 'fitness', 'daily', 15, 'minutes', 25, 'fitness', '#FBBF24', 'easy', TRUE);

-- Nutrition Missions
INSERT INTO missions (title, description, category, type, target_value, unit, points, icon, color, difficulty, is_active) VALUES
-- Calorie Missions
('Konsumsi 2000 Kalori', 'Mengkonsumsi 2000 kalori per hari untuk kebutuhan energi harian', 'nutrition', 'daily', 2000, 'calories', 60, 'food-apple', '#EF4444', 'medium', TRUE),
('Konsumsi 1500 Kalori', 'Mengkonsumsi 1500 kalori per hari untuk penurunan berat badan', 'nutrition', 'daily', 1500, 'calories', 40, 'food-apple', '#DC2626', 'easy', TRUE),
('Konsumsi 2500 Kalori', 'Mengkonsumsi 2500 kalori per hari untuk pertambahan berat badan', 'nutrition', 'daily', 2500, 'calories', 80, 'food-apple', '#B91C1C', 'hard', TRUE),

-- Meal Missions
('Makan 3 Kali Sehari', 'Makan 3 kali sehari dengan nutrisi seimbang untuk kesehatan optimal', 'nutrition', 'daily', 3, 'meals', 30, 'food', '#F97316', 'easy', TRUE),
('Makan 4 Kali Sehari', 'Makan 4 kali sehari dengan porsi kecil untuk metabolisme optimal', 'nutrition', 'daily', 4, 'meals', 40, 'food', '#EA580C', 'medium', TRUE),
('Makan 5 Kali Sehari', 'Makan 5 kali sehari dengan porsi kecil untuk atlet dan aktivitas tinggi', 'nutrition', 'daily', 5, 'meals', 50, 'food', '#C2410C', 'hard', TRUE);

-- Mental Health Missions
INSERT INTO missions (title, description, category, type, target_value, unit, points, icon, color, difficulty, is_active) VALUES
-- Mood Missions
('Mood Baik Seharian', 'Menjaga mood baik (skor 7+) sepanjang hari untuk kesehatan mental', 'mental_health', 'daily', 7, 'mood_score', 40, 'heart', '#EC4899', 'medium', TRUE),
('Mood Sangat Baik', 'Menjaga mood sangat baik (skor 8+) sepanjang hari untuk kebahagiaan optimal', 'mental_health', 'daily', 8, 'mood_score', 60, 'heart', '#DB2777', 'hard', TRUE),
('Mood Stabil', 'Menjaga mood stabil (skor 6+) sepanjang hari untuk keseimbangan emosional', 'mental_health', 'daily', 6, 'mood_score', 30, 'heart', '#BE185D', 'easy', TRUE),

-- Stress Management Missions
('Stress Level Rendah', 'Menjaga tingkat stress rendah sepanjang hari untuk kesehatan mental', 'mental_health', 'daily', 2, 'stress_level', 50, 'brain', '#8B5CF6', 'medium', TRUE),
('Stress Level Minimal', 'Menjaga tingkat stress minimal sepanjang hari untuk performa optimal', 'mental_health', 'daily', 1, 'stress_level', 70, 'brain', '#7C3AED', 'hard', TRUE);

-- ========================================
-- CREATE SAMPLE USER MISSIONS
-- ========================================

-- Get existing users and create sample user missions for them
INSERT INTO user_missions (user_id, mission_id, status, progress, current_value, created_at) 
SELECT 
    u.id as user_id,
    m.id as mission_id,
    'active' as status,
    0 as progress,
    0 as current_value,
    NOW() as created_at
FROM mobile_users u 
CROSS JOIN missions m 
WHERE u.is_active = TRUE 
  AND m.is_active = TRUE
  AND m.category IN ('health_tracking', 'fitness', 'nutrition', 'mental_health')
LIMIT 50;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check missions by category
SELECT 
    category,
    COUNT(*) as mission_count,
    SUM(points) as total_points
FROM missions 
WHERE is_active = TRUE 
GROUP BY category 
ORDER BY category;

-- Check user missions by category
SELECT 
    m.category,
    COUNT(*) as user_mission_count,
    SUM(CASE WHEN um.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
    AVG(um.progress) as avg_progress
FROM user_missions um
JOIN missions m ON um.mission_id = m.id
WHERE m.is_active = TRUE
GROUP BY m.category 
ORDER BY m.category;

-- Show sample missions
SELECT 
    id,
    title,
    category,
    target_value,
    unit,
    points,
    difficulty
FROM missions 
WHERE is_active = TRUE 
ORDER BY category, difficulty
LIMIT 10;

-- Show sample user missions
SELECT 
    um.id,
    um.user_id,
    m.title,
    m.category,
    um.status,
    um.progress,
    um.current_value
FROM user_missions um
JOIN missions m ON um.mission_id = m.id
WHERE m.is_active = TRUE
ORDER BY m.category, um.created_at DESC
LIMIT 10;
