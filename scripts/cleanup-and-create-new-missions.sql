-- Cleanup and Create New Missions & Wellness Activities
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

-- Clear old wellness activities
DELETE FROM wellness_activities WHERE 1=1;

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
-- CREATE NEW WELLNESS ACTIVITIES
-- ========================================

-- Health Tracking Activities
INSERT INTO wellness_activities (title, description, category, duration_minutes, calories_burn, difficulty_level, instructions, is_active) VALUES
-- Water Tracking Activities
('Minum Air Pagi', 'Mulai hari dengan minum 500ml air putih untuk hidrasi pagi', 'health_tracking', 5, 0, 'easy', 'Minum 500ml air putih segera setelah bangun tidur', TRUE),
('Minum Air Sebelum Makan', 'Minum 250ml air putih 30 menit sebelum makan untuk pencernaan optimal', 'health_tracking', 5, 0, 'easy', 'Minum air putih 30 menit sebelum sarapan, makan siang, dan makan malam', TRUE),
('Minum Air Setelah Olahraga', 'Minum 500ml air putih setelah olahraga untuk rehidrasi', 'health_tracking', 5, 0, 'easy', 'Minum air putih segera setelah selesai olahraga', TRUE),

-- Sleep Tracking Activities
('Rutinitas Tidur Malam', 'Persiapkan tubuh untuk tidur dengan rutinitas yang menenangkan', 'health_tracking', 30, 0, 'easy', 'Matikan gadget, baca buku, dan minum teh chamomile sebelum tidur', TRUE),
('Bangun Pagi Konsisten', 'Bangun pada waktu yang sama setiap hari untuk ritme sirkadian yang sehat', 'health_tracking', 10, 0, 'medium', 'Atur alarm dan bangun pada waktu yang sama setiap hari', TRUE),
('Kualitas Tidur Optimal', 'Ciptakan lingkungan tidur yang nyaman untuk kualitas tidur terbaik', 'health_tracking', 15, 0, 'easy', 'Atur suhu ruangan, matikan lampu, dan gunakan bantal yang nyaman', TRUE);

-- Fitness Activities
INSERT INTO wellness_activities (title, description, category, duration_minutes, calories_burn, difficulty_level, instructions, is_active) VALUES
-- Walking Activities
('Jalan Pagi 30 Menit', 'Jalan santai di pagi hari untuk memulai hari dengan energi positif', 'fitness', 30, 120, 'easy', 'Jalan santai di sekitar rumah atau taman selama 30 menit', TRUE),
('Jalan Siang 20 Menit', 'Jalan kaki saat istirahat makan siang untuk menghilangkan stress kerja', 'fitness', 20, 80, 'easy', 'Jalan kaki di sekitar kantor atau taman saat istirahat makan siang', TRUE),
('Jalan Sore 45 Menit', 'Jalan kaki di sore hari untuk relaksasi dan pembakaran kalori', 'fitness', 45, 180, 'medium', 'Jalan kaki di taman atau area yang nyaman di sore hari', TRUE),

-- Exercise Activities
('Pemanasan Pagi', 'Lakukan pemanasan ringan di pagi hari untuk memulai hari dengan bugar', 'fitness', 15, 50, 'easy', 'Lakukan stretching dan gerakan pemanasan ringan di pagi hari', TRUE),
('Olahraga Kardio', 'Lakukan olahraga kardio untuk kesehatan jantung dan pembakaran kalori', 'fitness', 30, 200, 'medium', 'Lakukan jogging, bersepeda, atau berenang selama 30 menit', TRUE),
('Latihan Kekuatan', 'Lakukan latihan kekuatan untuk membangun otot dan metabolisme', 'fitness', 45, 250, 'hard', 'Lakukan push-up, squat, dan plank untuk membangun kekuatan', TRUE);

-- Nutrition Activities
INSERT INTO wellness_activities (title, description, category, duration_minutes, calories_burn, difficulty_level, instructions, is_active) VALUES
-- Meal Planning Activities
('Rencana Makan Sehari', 'Rencanakan menu makan sehari dengan nutrisi seimbang', 'nutrition', 20, 0, 'easy', 'Buat rencana menu sarapan, makan siang, dan makan malam dengan nutrisi seimbang', TRUE),
('Persiapan Makan Sehat', 'Siapkan bahan makanan sehat untuk minggu ini', 'nutrition', 60, 100, 'medium', 'Belanja dan siapkan bahan makanan sehat untuk konsumsi mingguan', TRUE),
('Memasak Makanan Sehat', 'Masak makanan sehat dengan teknik memasak yang baik', 'nutrition', 45, 150, 'medium', 'Gunakan teknik memasak sehat seperti steaming, grilling, atau baking', TRUE),

-- Healthy Eating Activities
('Sarapan Sehat', 'Konsumsi sarapan sehat dengan protein dan serat yang cukup', 'nutrition', 20, 0, 'easy', 'Konsumsi sarapan dengan protein, serat, dan karbohidrat kompleks', TRUE),
('Snack Sehat', 'Pilih snack sehat sebagai pengganti makanan ringan tidak sehat', 'nutrition', 10, 0, 'easy', 'Pilih buah, kacang, atau yogurt sebagai snack sehat', TRUE),
('Makan Malam Sehat', 'Konsumsi makan malam sehat dengan porsi yang tepat', 'nutrition', 30, 0, 'easy', 'Konsumsi makan malam dengan protein, sayuran, dan karbohidrat seimbang', TRUE);

-- Mental Health Activities
INSERT INTO wellness_activities (title, description, category, duration_minutes, calories_burn, difficulty_level, instructions, is_active) VALUES
-- Mood Management Activities
('Meditasi Pagi', 'Lakukan meditasi pagi untuk memulai hari dengan pikiran jernih', 'mental_health', 15, 0, 'easy', 'Duduk tenang dan fokus pada napas selama 15 menit di pagi hari', TRUE),
('Jurnal Harian', 'Tulis jurnal harian untuk mengekspresikan perasaan dan pikiran', 'mental_health', 10, 0, 'easy', 'Tulis perasaan, pikiran, dan hal yang disyukuri hari ini', TRUE),
('Aktivitas Menyenangkan', 'Lakukan aktivitas yang menyenangkan untuk meningkatkan mood', 'mental_health', 30, 50, 'easy', 'Lakukan hobi atau aktivitas yang membuat bahagia', TRUE),

-- Stress Management Activities
('Teknik Pernapasan', 'Praktikkan teknik pernapasan untuk mengurangi stress', 'mental_health', 10, 0, 'easy', 'Lakukan teknik pernapasan 4-7-8 untuk relaksasi', TRUE),
('Istirahat Mental', 'Ambil istirahat mental dari pekerjaan dan gadget', 'mental_health', 20, 0, 'medium', 'Istirahat dari layar dan lakukan aktivitas yang menenangkan', TRUE),
('Quality Time', 'Habiskan waktu berkualitas dengan keluarga atau teman', 'mental_health', 60, 0, 'easy', 'Habiskan waktu berkualitas dengan orang terdekat tanpa gadget', TRUE);

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

-- Check wellness activities by category
SELECT 
    category,
    COUNT(*) as activity_count,
    AVG(duration_minutes) as avg_duration,
    SUM(calories_burn) as total_calories
FROM wellness_activities 
WHERE is_active = TRUE 
GROUP BY category 
ORDER BY category;

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

-- Show sample wellness activities
SELECT 
    id,
    title,
    category,
    duration_minutes,
    calories_burn,
    difficulty_level
FROM wellness_activities 
WHERE is_active = TRUE 
ORDER BY category, difficulty_level
LIMIT 10;
