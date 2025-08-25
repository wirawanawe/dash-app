-- Cleanup and Create New Missions & Wellness Activities (Fixed for actual DB structure)
-- This script removes old data and creates new tracking-integrated missions and activities

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
-- CREATE NEW WELLNESS ACTIVITIES (for user_wellness_activities table)
-- Note: This table stores user activities, not available activities
-- We'll create sample user activities for existing users
-- ========================================

-- Get existing users and create sample wellness activities for them
INSERT INTO user_wellness_activities (user_id, activity_id, activity_name, activity_type, activity_category, duration, points_earned, notes, completed_at) 
SELECT 
    u.id as user_id,
    'water_morning' as activity_id,
    'Minum Air Pagi' as activity_name,
    'health_tracking' as activity_type,
    'health_tracking' as activity_category,
    5 as duration,
    10 as points_earned,
    'Minum 500ml air putih segera setelah bangun tidur' as notes,
    NOW() as completed_at
FROM mobile_users u 
WHERE u.is_active = TRUE 
LIMIT 5;

INSERT INTO user_wellness_activities (user_id, activity_id, activity_name, activity_type, activity_category, duration, points_earned, notes, completed_at) 
SELECT 
    u.id as user_id,
    'walking_morning' as activity_id,
    'Jalan Pagi 30 Menit' as activity_name,
    'fitness' as activity_type,
    'fitness' as activity_category,
    30 as duration,
    25 as points_earned,
    'Jalan santai di sekitar rumah atau taman selama 30 menit' as notes,
    NOW() as completed_at
FROM mobile_users u 
WHERE u.is_active = TRUE 
LIMIT 5;

INSERT INTO user_wellness_activities (user_id, activity_id, activity_name, activity_type, activity_category, duration, points_earned, notes, completed_at) 
SELECT 
    u.id as user_id,
    'healthy_breakfast' as activity_id,
    'Sarapan Sehat' as activity_name,
    'nutrition' as activity_type,
    'nutrition' as activity_category,
    20 as duration,
    15 as points_earned,
    'Konsumsi sarapan dengan protein, serat, dan karbohidrat kompleks' as notes,
    NOW() as completed_at
FROM mobile_users u 
WHERE u.is_active = TRUE 
LIMIT 5;

INSERT INTO user_wellness_activities (user_id, activity_id, activity_name, activity_type, activity_category, duration, points_earned, notes, completed_at) 
SELECT 
    u.id as user_id,
    'morning_meditation' as activity_id,
    'Meditasi Pagi' as activity_name,
    'mental_health' as activity_type,
    'mental_health' as activity_category,
    15 as duration,
    20 as points_earned,
    'Duduk tenang dan fokus pada napas selama 15 menit di pagi hari' as notes,
    NOW() as completed_at
FROM mobile_users u 
WHERE u.is_active = TRUE 
LIMIT 5;

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

-- Check user wellness activities by category
SELECT 
    activity_category,
    COUNT(*) as activity_count,
    AVG(duration) as avg_duration,
    SUM(points_earned) as total_points
FROM user_wellness_activities 
GROUP BY activity_category 
ORDER BY activity_category;

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

-- Show sample user wellness activities
SELECT 
    id,
    user_id,
    activity_name,
    activity_category,
    duration,
    points_earned
FROM user_wellness_activities 
ORDER BY activity_category, completed_at DESC
LIMIT 10;
