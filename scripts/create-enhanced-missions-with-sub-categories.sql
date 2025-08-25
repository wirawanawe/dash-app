-- Create Enhanced Missions with Sub-Categories
-- This script creates new missions with proper sub-categories and tracking mapping
-- Each mission is designed to take data from the correct tracking source

USE phc_dashboard;

-- ========================================
-- STEP 1: CLEAN UP OLD MISSIONS (Optional)
-- ========================================

-- Uncomment the following lines if you want to clean up old missions first
-- DELETE FROM user_missions WHERE mission_id IN (SELECT id FROM missions WHERE sub_category IS NULL);
-- DELETE FROM missions WHERE sub_category IS NULL;

-- ========================================
-- STEP 2: CREATE FITNESS MISSIONS WITH SUB-CATEGORIES
-- ========================================

-- FITNESS: STEPS Missions
INSERT INTO missions (title, description, category, sub_category, type, target_value, unit, points, icon, color, difficulty, is_active, tracking_mapping) VALUES
('Jalan 3.000 Langkah', 'Berjalan minimal 3.000 langkah dalam sehari', 'fitness', 'STEPS', 'daily', 3000, 'steps', 20, 'walking', '#059669', 'easy', TRUE, JSON_OBJECT('table', 'fitness_tracking', 'column', 'steps', 'aggregation', 'SUM', 'date_column', 'tracking_date')),
('Jalan 5.000 Langkah', 'Berjalan minimal 5.000 langkah dalam sehari', 'fitness', 'STEPS', 'daily', 5000, 'steps', 30, 'walking', '#059669', 'easy', TRUE, JSON_OBJECT('table', 'fitness_tracking', 'column', 'steps', 'aggregation', 'SUM', 'date_column', 'tracking_date')),
('Jalan 8.000 Langkah', 'Berjalan minimal 8.000 langkah dalam sehari', 'fitness', 'STEPS', 'daily', 8000, 'steps', 45, 'walking', '#059669', 'medium', TRUE, JSON_OBJECT('table', 'fitness_tracking', 'column', 'steps', 'aggregation', 'SUM', 'date_column', 'tracking_date')),
('Jalan 10.000 Langkah', 'Berjalan minimal 10.000 langkah dalam sehari', 'fitness', 'STEPS', 'daily', 10000, 'steps', 60, 'walking', '#059669', 'medium', TRUE, JSON_OBJECT('table', 'fitness_tracking', 'column', 'steps', 'aggregation', 'SUM', 'date_column', 'tracking_date')),
('Jalan 12.000 Langkah', 'Berjalan minimal 12.000 langkah dalam sehari', 'fitness', 'STEPS', 'daily', 12000, 'steps', 75, 'walking', '#059669', 'hard', TRUE, JSON_OBJECT('table', 'fitness_tracking', 'column', 'steps', 'aggregation', 'SUM', 'date_column', 'tracking_date')),
('Jalan 15.000 Langkah', 'Berjalan minimal 15.000 langkah dalam sehari', 'fitness', 'STEPS', 'daily', 15000, 'steps', 90, 'walking', '#059669', 'hard', TRUE, JSON_OBJECT('table', 'fitness_tracking', 'column', 'steps', 'aggregation', 'SUM', 'date_column', 'tracking_date'));

-- FITNESS: DURATION Missions
INSERT INTO missions (title, description, category, sub_category, type, target_value, unit, points, icon, color, difficulty, is_active, tracking_mapping) VALUES
('Olahraga 10 Menit', 'Melakukan aktivitas fisik minimal 10 menit', 'fitness', 'DURATION', 'daily', 10, 'minutes', 15, 'fitness', '#D97706', 'easy', TRUE, JSON_OBJECT('table', 'fitness_tracking', 'column', 'exercise_minutes', 'aggregation', 'SUM', 'date_column', 'tracking_date')),
('Olahraga 15 Menit', 'Melakukan aktivitas fisik minimal 15 menit', 'fitness', 'DURATION', 'daily', 15, 'minutes', 25, 'fitness', '#D97706', 'easy', TRUE, JSON_OBJECT('table', 'fitness_tracking', 'column', 'exercise_minutes', 'aggregation', 'SUM', 'date_column', 'tracking_date')),
('Olahraga 30 Menit', 'Melakukan aktivitas fisik minimal 30 menit', 'fitness', 'DURATION', 'daily', 30, 'minutes', 50, 'fitness', '#D97706', 'medium', TRUE, JSON_OBJECT('table', 'fitness_tracking', 'column', 'exercise_minutes', 'aggregation', 'SUM', 'date_column', 'tracking_date')),
('Olahraga 45 Menit', 'Melakukan aktivitas fisik minimal 45 menit', 'fitness', 'DURATION', 'daily', 45, 'minutes', 70, 'fitness', '#D97706', 'medium', TRUE, JSON_OBJECT('table', 'fitness_tracking', 'column', 'exercise_minutes', 'aggregation', 'SUM', 'date_column', 'tracking_date')),
('Olahraga 60 Menit', 'Melakukan aktivitas fisik minimal 60 menit', 'fitness', 'DURATION', 'daily', 60, 'minutes', 80, 'fitness', '#D97706', 'hard', TRUE, JSON_OBJECT('table', 'fitness_tracking', 'column', 'exercise_minutes', 'aggregation', 'SUM', 'date_column', 'tracking_date')),
('Olahraga 90 Menit', 'Melakukan aktivitas fisik minimal 90 menit', 'fitness', 'DURATION', 'daily', 90, 'minutes', 100, 'fitness', '#D97706', 'hard', TRUE, JSON_OBJECT('table', 'fitness_tracking', 'column', 'exercise_minutes', 'aggregation', 'SUM', 'date_column', 'tracking_date'));

-- FITNESS: DISTANCE Missions
INSERT INTO missions (title, description, category, sub_category, type, target_value, unit, points, icon, color, difficulty, is_active, tracking_mapping) VALUES
('Jalan 1 KM', 'Berjalan minimal 1 kilometer dalam sehari', 'fitness', 'DISTANCE', 'daily', 1, 'km', 20, 'map-pin', '#7C3AED', 'easy', TRUE, JSON_OBJECT('table', 'fitness_tracking', 'column', 'distance_km', 'aggregation', 'SUM', 'date_column', 'tracking_date')),
('Jalan 2 KM', 'Berjalan minimal 2 kilometer dalam sehari', 'fitness', 'DISTANCE', 'daily', 2, 'km', 35, 'map-pin', '#7C3AED', 'easy', TRUE, JSON_OBJECT('table', 'fitness_tracking', 'column', 'distance_km', 'aggregation', 'SUM', 'date_column', 'tracking_date')),
('Jalan 3 KM', 'Berjalan minimal 3 kilometer dalam sehari', 'fitness', 'DISTANCE', 'daily', 3, 'km', 50, 'map-pin', '#7C3AED', 'medium', TRUE, JSON_OBJECT('table', 'fitness_tracking', 'column', 'distance_km', 'aggregation', 'SUM', 'date_column', 'tracking_date')),
('Jalan 5 KM', 'Berjalan minimal 5 kilometer dalam sehari', 'fitness', 'DISTANCE', 'daily', 5, 'km', 75, 'map-pin', '#7C3AED', 'medium', TRUE, JSON_OBJECT('table', 'fitness_tracking', 'column', 'distance_km', 'aggregation', 'SUM', 'date_column', 'tracking_date')),
('Jalan 8 KM', 'Berjalan minimal 8 kilometer dalam sehari', 'fitness', 'DISTANCE', 'daily', 8, 'km', 100, 'map-pin', '#7C3AED', 'hard', TRUE, JSON_OBJECT('table', 'fitness_tracking', 'column', 'distance_km', 'aggregation', 'SUM', 'date_column', 'tracking_date')),
('Jalan 10 KM', 'Berjalan minimal 10 kilometer dalam sehari', 'fitness', 'DISTANCE', 'daily', 10, 'km', 125, 'map-pin', '#7C3AED', 'hard', TRUE, JSON_OBJECT('table', 'fitness_tracking', 'column', 'distance_km', 'aggregation', 'SUM', 'date_column', 'tracking_date'));

-- FITNESS: CALORIES Missions
INSERT INTO missions (title, description, category, sub_category, type, target_value, unit, points, icon, color, difficulty, is_active, tracking_mapping) VALUES
('Bakar 100 Kalori', 'Membakar minimal 100 kalori melalui aktivitas fisik', 'fitness', 'CALORIES', 'daily', 100, 'calories', 20, 'flame', '#DC2626', 'easy', TRUE, JSON_OBJECT('table', 'fitness_tracking', 'column', 'calories_burned', 'aggregation', 'SUM', 'date_column', 'tracking_date')),
('Bakar 200 Kalori', 'Membakar minimal 200 kalori melalui aktivitas fisik', 'fitness', 'CALORIES', 'daily', 200, 'calories', 35, 'flame', '#DC2626', 'easy', TRUE, JSON_OBJECT('table', 'fitness_tracking', 'column', 'calories_burned', 'aggregation', 'SUM', 'date_column', 'tracking_date')),
('Bakar 300 Kalori', 'Membakar minimal 300 kalori melalui aktivitas fisik', 'fitness', 'CALORIES', 'daily', 300, 'calories', 50, 'flame', '#DC2626', 'medium', TRUE, JSON_OBJECT('table', 'fitness_tracking', 'column', 'calories_burned', 'aggregation', 'SUM', 'date_column', 'tracking_date')),
('Bakar 500 Kalori', 'Membakar minimal 500 kalori melalui aktivitas fisik', 'fitness', 'CALORIES', 'daily', 500, 'calories', 75, 'flame', '#DC2626', 'medium', TRUE, JSON_OBJECT('table', 'fitness_tracking', 'column', 'calories_burned', 'aggregation', 'SUM', 'date_column', 'tracking_date')),
('Bakar 700 Kalori', 'Membakar minimal 700 kalori melalui aktivitas fisik', 'fitness', 'CALORIES', 'daily', 700, 'calories', 100, 'flame', '#DC2626', 'hard', TRUE, JSON_OBJECT('table', 'fitness_tracking', 'column', 'calories_burned', 'aggregation', 'SUM', 'date_column', 'tracking_date')),
('Bakar 1000 Kalori', 'Membakar minimal 1000 kalori melalui aktivitas fisik', 'fitness', 'CALORIES', 'daily', 1000, 'calories', 125, 'flame', '#DC2626', 'hard', TRUE, JSON_OBJECT('table', 'fitness_tracking', 'column', 'calories_burned', 'aggregation', 'SUM', 'date_column', 'tracking_date'));

-- ========================================
-- STEP 3: CREATE HEALTH_TRACKING MISSIONS WITH SUB-CATEGORIES
-- ========================================

-- HEALTH_TRACKING: WATER_INTAKE Missions
INSERT INTO missions (title, description, category, sub_category, type, target_value, unit, points, icon, color, difficulty, is_active, tracking_mapping) VALUES
('Minum 1.5 Liter Air', 'Minum minimal 1.5 liter air putih dalam sehari', 'health_tracking', 'WATER_INTAKE', 'daily', 1500, 'ml', 25, 'droplet', '#1D4ED8', 'easy', TRUE, JSON_OBJECT('table', 'water_tracking', 'column', 'amount_ml', 'aggregation', 'SUM', 'date_column', 'tracking_date')),
('Minum 2 Liter Air', 'Minum minimal 2 liter air putih dalam sehari', 'health_tracking', 'WATER_INTAKE', 'daily', 2000, 'ml', 40, 'droplet', '#1D4ED8', 'easy', TRUE, JSON_OBJECT('table', 'water_tracking', 'column', 'amount_ml', 'aggregation', 'SUM', 'date_column', 'tracking_date')),
('Minum 2.5 Liter Air', 'Minum minimal 2.5 liter air putih dalam sehari', 'health_tracking', 'WATER_INTAKE', 'daily', 2500, 'ml', 55, 'droplet', '#1D4ED8', 'medium', TRUE, JSON_OBJECT('table', 'water_tracking', 'column', 'amount_ml', 'aggregation', 'SUM', 'date_column', 'tracking_date')),
('Minum 3 Liter Air', 'Minum minimal 3 liter air putih dalam sehari', 'health_tracking', 'WATER_INTAKE', 'daily', 3000, 'ml', 70, 'droplet', '#1D4ED8', 'medium', TRUE, JSON_OBJECT('table', 'water_tracking', 'column', 'amount_ml', 'aggregation', 'SUM', 'date_column', 'tracking_date')),
('Minum 3.5 Liter Air', 'Minum minimal 3.5 liter air putih dalam sehari', 'health_tracking', 'WATER_INTAKE', 'daily', 3500, 'ml', 85, 'droplet', '#1D4ED8', 'hard', TRUE, JSON_OBJECT('table', 'water_tracking', 'column', 'amount_ml', 'aggregation', 'SUM', 'date_column', 'tracking_date')),
('Minum 4 Liter Air', 'Minum minimal 4 liter air putih dalam sehari', 'health_tracking', 'WATER_INTAKE', 'daily', 4000, 'ml', 100, 'droplet', '#1D4ED8', 'hard', TRUE, JSON_OBJECT('table', 'water_tracking', 'column', 'amount_ml', 'aggregation', 'SUM', 'date_column', 'tracking_date'));

-- HEALTH_TRACKING: SLEEP_DURATION Missions
INSERT INTO missions (title, description, category, sub_category, type, target_value, unit, points, icon, color, difficulty, is_active, tracking_mapping) VALUES
('Tidur 6 Jam', 'Tidur minimal 6 jam dalam sehari', 'health_tracking', 'SLEEP_DURATION', 'daily', 6, 'hours', 30, 'moon', '#7C3AED', 'easy', TRUE, JSON_OBJECT('table', 'sleep_tracking', 'column', 'sleep_duration_hours', 'aggregation', 'AVG', 'date_column', 'sleep_date')),
('Tidur 7 Jam', 'Tidur minimal 7 jam dalam sehari', 'health_tracking', 'SLEEP_DURATION', 'daily', 7, 'hours', 45, 'moon', '#7C3AED', 'easy', TRUE, JSON_OBJECT('table', 'sleep_tracking', 'column', 'sleep_duration_hours', 'aggregation', 'AVG', 'date_column', 'sleep_date')),
('Tidur 7.5 Jam', 'Tidur minimal 7.5 jam dalam sehari', 'health_tracking', 'SLEEP_DURATION', 'daily', 7.5, 'hours', 55, 'moon', '#7C3AED', 'medium', TRUE, JSON_OBJECT('table', 'sleep_tracking', 'column', 'sleep_duration_hours', 'aggregation', 'AVG', 'date_column', 'sleep_date')),
('Tidur 8 Jam', 'Tidur minimal 8 jam dalam sehari', 'health_tracking', 'SLEEP_DURATION', 'daily', 8, 'hours', 65, 'moon', '#7C3AED', 'medium', TRUE, JSON_OBJECT('table', 'sleep_tracking', 'column', 'sleep_duration_hours', 'aggregation', 'AVG', 'date_column', 'sleep_date')),
('Tidur 8.5 Jam', 'Tidur minimal 8.5 jam dalam sehari', 'health_tracking', 'SLEEP_DURATION', 'daily', 8.5, 'hours', 75, 'moon', '#7C3AED', 'hard', TRUE, JSON_OBJECT('table', 'sleep_tracking', 'column', 'sleep_duration_hours', 'aggregation', 'AVG', 'date_column', 'sleep_date')),
('Tidur 9 Jam', 'Tidur minimal 9 jam dalam sehari', 'health_tracking', 'SLEEP_DURATION', 'daily', 9, 'hours', 85, 'moon', '#7C3AED', 'hard', TRUE, JSON_OBJECT('table', 'sleep_tracking', 'column', 'sleep_duration_hours', 'aggregation', 'AVG', 'date_column', 'sleep_date'));

-- HEALTH_TRACKING: SLEEP_QUALITY Missions
INSERT INTO missions (title, description, category, sub_category, type, target_value, unit, points, icon, color, difficulty, is_active, tracking_mapping) VALUES
('Tidur Berkualitas Baik', 'Mendapatkan kualitas tidur yang baik (skor 7-8)', 'health_tracking', 'SLEEP_QUALITY', 'daily', 7, 'quality_score', 40, 'star', '#F59E0B', 'medium', TRUE, JSON_OBJECT('table', 'sleep_tracking', 'column', 'sleep_quality', 'aggregation', 'AVG', 'date_column', 'sleep_date')),
('Tidur Berkualitas Sangat Baik', 'Mendapatkan kualitas tidur yang sangat baik (skor 8-10)', 'health_tracking', 'SLEEP_QUALITY', 'daily', 8, 'quality_score', 60, 'star', '#F59E0B', 'hard', TRUE, JSON_OBJECT('table', 'sleep_tracking', 'column', 'sleep_quality', 'aggregation', 'AVG', 'date_column', 'sleep_date'));

-- ========================================
-- STEP 4: CREATE NUTRITION MISSIONS WITH SUB-CATEGORIES
-- ========================================

-- NUTRITION: CALORIES_INTAKE Missions
INSERT INTO missions (title, description, category, sub_category, type, target_value, unit, points, icon, color, difficulty, is_active, tracking_mapping) VALUES
('Konsumsi 1200 Kalori', 'Mengkonsumsi minimal 1200 kalori dalam sehari', 'nutrition', 'CALORIES_INTAKE', 'daily', 1200, 'calories', 30, 'utensils', '#16A34A', 'easy', TRUE, JSON_OBJECT('table', 'meal_logging', 'column', 'calories', 'aggregation', 'SUM', 'date_column', 'recorded_at')),
('Konsumsi 1500 Kalori', 'Mengkonsumsi minimal 1500 kalori dalam sehari', 'nutrition', 'CALORIES_INTAKE', 'daily', 1500, 'calories', 40, 'utensils', '#16A34A', 'easy', TRUE, JSON_OBJECT('table', 'meal_logging', 'column', 'calories', 'aggregation', 'SUM', 'date_column', 'recorded_at')),
('Konsumsi 1800 Kalori', 'Mengkonsumsi minimal 1800 kalori dalam sehari', 'nutrition', 'CALORIES_INTAKE', 'daily', 1800, 'calories', 50, 'utensils', '#16A34A', 'medium', TRUE, JSON_OBJECT('table', 'meal_logging', 'column', 'calories', 'aggregation', 'SUM', 'date_column', 'recorded_at')),
('Konsumsi 2000 Kalori', 'Mengkonsumsi minimal 2000 kalori dalam sehari', 'nutrition', 'CALORIES_INTAKE', 'daily', 2000, 'calories', 60, 'utensils', '#16A34A', 'medium', TRUE, JSON_OBJECT('table', 'meal_logging', 'column', 'calories', 'aggregation', 'SUM', 'date_column', 'recorded_at')),
('Konsumsi 2200 Kalori', 'Mengkonsumsi minimal 2200 kalori dalam sehari', 'nutrition', 'CALORIES_INTAKE', 'daily', 2200, 'calories', 70, 'utensils', '#16A34A', 'hard', TRUE, JSON_OBJECT('table', 'meal_logging', 'column', 'calories', 'aggregation', 'SUM', 'date_column', 'recorded_at')),
('Konsumsi 2500 Kalori', 'Mengkonsumsi minimal 2500 kalori dalam sehari', 'nutrition', 'CALORIES_INTAKE', 'daily', 2500, 'calories', 80, 'utensils', '#16A34A', 'hard', TRUE, JSON_OBJECT('table', 'meal_logging', 'column', 'calories', 'aggregation', 'SUM', 'date_column', 'recorded_at'));

-- NUTRITION: MEAL_COUNT Missions
INSERT INTO missions (title, description, category, sub_category, type, target_value, unit, points, icon, color, difficulty, is_active, tracking_mapping) VALUES
('Makan 2 Kali Sehari', 'Makan minimal 2 kali dalam sehari', 'nutrition', 'MEAL_COUNT', 'daily', 2, 'meals', 20, 'clock', '#9333EA', 'easy', TRUE, JSON_OBJECT('table', 'meal_logging', 'column', 'meal_type', 'aggregation', 'COUNT_DISTINCT', 'date_column', 'recorded_at')),
('Makan 3 Kali Sehari', 'Makan minimal 3 kali dalam sehari', 'nutrition', 'MEAL_COUNT', 'daily', 3, 'meals', 30, 'clock', '#9333EA', 'easy', TRUE, JSON_OBJECT('table', 'meal_logging', 'column', 'meal_type', 'aggregation', 'COUNT_DISTINCT', 'date_column', 'recorded_at')),
('Makan 4 Kali Sehari', 'Makan minimal 4 kali dalam sehari', 'nutrition', 'MEAL_COUNT', 'daily', 4, 'meals', 40, 'clock', '#9333EA', 'medium', TRUE, JSON_OBJECT('table', 'meal_logging', 'column', 'meal_type', 'aggregation', 'COUNT_DISTINCT', 'date_column', 'recorded_at')),
('Makan 5 Kali Sehari', 'Makan minimal 5 kali dalam sehari', 'nutrition', 'MEAL_COUNT', 'daily', 5, 'meals', 50, 'clock', '#9333EA', 'hard', TRUE, JSON_OBJECT('table', 'meal_logging', 'column', 'meal_type', 'aggregation', 'COUNT_DISTINCT', 'date_column', 'recorded_at'));

-- NUTRITION: PROTEIN_INTAKE Missions
INSERT INTO missions (title, description, category, sub_category, type, target_value, unit, points, icon, color, difficulty, is_active, tracking_mapping) VALUES
('Konsumsi 40g Protein', 'Mengkonsumsi minimal 40 gram protein dalam sehari', 'nutrition', 'PROTEIN_INTAKE', 'daily', 40, 'grams', 25, 'zap', '#EA580C', 'easy', TRUE, JSON_OBJECT('table', 'meal_logging', 'column', 'protein', 'aggregation', 'SUM', 'date_column', 'recorded_at')),
('Konsumsi 60g Protein', 'Mengkonsumsi minimal 60 gram protein dalam sehari', 'nutrition', 'PROTEIN_INTAKE', 'daily', 60, 'grams', 40, 'zap', '#EA580C', 'medium', TRUE, JSON_OBJECT('table', 'meal_logging', 'column', 'protein', 'aggregation', 'SUM', 'date_column', 'recorded_at')),
('Konsumsi 80g Protein', 'Mengkonsumsi minimal 80 gram protein dalam sehari', 'nutrition', 'PROTEIN_INTAKE', 'daily', 80, 'grams', 55, 'zap', '#EA580C', 'medium', TRUE, JSON_OBJECT('table', 'meal_logging', 'column', 'protein', 'aggregation', 'SUM', 'date_column', 'recorded_at')),
('Konsumsi 100g Protein', 'Mengkonsumsi minimal 100 gram protein dalam sehari', 'nutrition', 'PROTEIN_INTAKE', 'daily', 100, 'grams', 70, 'zap', '#EA580C', 'hard', TRUE, JSON_OBJECT('table', 'meal_logging', 'column', 'protein', 'aggregation', 'SUM', 'date_column', 'recorded_at')),
('Konsumsi 120g Protein', 'Mengkonsumsi minimal 120 gram protein dalam sehari', 'nutrition', 'PROTEIN_INTAKE', 'daily', 120, 'grams', 85, 'zap', '#EA580C', 'hard', TRUE, JSON_OBJECT('table', 'meal_logging', 'column', 'protein', 'aggregation', 'SUM', 'date_column', 'recorded_at'));

-- ========================================
-- STEP 5: CREATE MENTAL_HEALTH MISSIONS WITH SUB-CATEGORIES
-- ========================================

-- MENTAL_HEALTH: MOOD_SCORE Missions
INSERT INTO missions (title, description, category, sub_category, type, target_value, unit, points, icon, color, difficulty, is_active, tracking_mapping) VALUES
('Mood Stabil', 'Menjaga mood stabil (skor 5-6) sepanjang hari', 'mental_health', 'MOOD_SCORE', 'daily', 5, 'mood_score', 25, 'smile', '#F472B6', 'easy', TRUE, JSON_OBJECT('table', 'mood_tracking', 'column', 'mood_score', 'aggregation', 'AVG', 'date_column', 'tracking_date')),
('Mood Baik', 'Menjaga mood baik (skor 6-7) sepanjang hari', 'mental_health', 'MOOD_SCORE', 'daily', 6, 'mood_score', 35, 'smile', '#F472B6', 'easy', TRUE, JSON_OBJECT('table', 'mood_tracking', 'column', 'mood_score', 'aggregation', 'AVG', 'date_column', 'tracking_date')),
('Mood Sangat Baik', 'Menjaga mood sangat baik (skor 7-8) sepanjang hari', 'mental_health', 'MOOD_SCORE', 'daily', 7, 'mood_score', 50, 'smile', '#F472B6', 'medium', TRUE, JSON_OBJECT('table', 'mood_tracking', 'column', 'mood_score', 'aggregation', 'AVG', 'date_column', 'tracking_date')),
('Mood Excellent', 'Menjaga mood excellent (skor 8-9) sepanjang hari', 'mental_health', 'MOOD_SCORE', 'daily', 8, 'mood_score', 65, 'smile', '#F472B6', 'hard', TRUE, JSON_OBJECT('table', 'mood_tracking', 'column', 'mood_score', 'aggregation', 'AVG', 'date_column', 'tracking_date')),
('Mood Perfect', 'Menjaga mood perfect (skor 9-10) sepanjang hari', 'mental_health', 'MOOD_SCORE', 'daily', 9, 'mood_score', 80, 'smile', '#F472B6', 'hard', TRUE, JSON_OBJECT('table', 'mood_tracking', 'column', 'mood_score', 'aggregation', 'AVG', 'date_column', 'tracking_date'));

-- MENTAL_HEALTH: STRESS_LEVEL Missions
INSERT INTO missions (title, description, category, sub_category, type, target_value, unit, points, icon, color, difficulty, is_active, tracking_mapping) VALUES
('Stress Level Minimal', 'Menjaga stress level minimal (skor 1-2)', 'mental_health', 'STRESS_LEVEL', 'daily', 2, 'stress_level', 40, 'heart', '#EF4444', 'medium', TRUE, JSON_OBJECT('table', 'mood_tracking', 'column', 'stress_level', 'aggregation', 'AVG', 'date_column', 'tracking_date')),
('Stress Level Rendah', 'Menjaga stress level rendah (skor 1)', 'mental_health', 'STRESS_LEVEL', 'daily', 1, 'stress_level', 60, 'heart', '#EF4444', 'hard', TRUE, JSON_OBJECT('table', 'mood_tracking', 'column', 'stress_level', 'aggregation', 'AVG', 'date_column', 'tracking_date'));

-- MENTAL_HEALTH: ENERGY_LEVEL Missions
INSERT INTO missions (title, description, category, sub_category, type, target_value, unit, points, icon, color, difficulty, is_active, tracking_mapping) VALUES
('Energi Stabil', 'Menjaga level energi stabil (skor 3-4) sepanjang hari', 'mental_health', 'ENERGY_LEVEL', 'daily', 3, 'energy_level', 30, 'battery', '#10B981', 'easy', TRUE, JSON_OBJECT('table', 'mood_tracking', 'column', 'energy_level', 'aggregation', 'AVG', 'date_column', 'tracking_date')),
('Energi Tinggi', 'Menjaga level energi tinggi (skor 4-5) sepanjang hari', 'mental_health', 'ENERGY_LEVEL', 'daily', 4, 'energy_level', 50, 'battery', '#10B981', 'medium', TRUE, JSON_OBJECT('table', 'mood_tracking', 'column', 'energy_level', 'aggregation', 'AVG', 'date_column', 'tracking_date')),
('Energi Sangat Tinggi', 'Menjaga level energi sangat tinggi (skor 5) sepanjang hari', 'mental_health', 'ENERGY_LEVEL', 'daily', 5, 'energy_level', 70, 'battery', '#10B981', 'hard', TRUE, JSON_OBJECT('table', 'mood_tracking', 'column', 'energy_level', 'aggregation', 'AVG', 'date_column', 'tracking_date'));

-- ========================================
-- STEP 6: VERIFICATION AND SUMMARY
-- ========================================

-- Show all created missions with sub-categories
SELECT 
    id,
    title,
    category,
    sub_category,
    target_value,
    unit,
    points,
    difficulty,
    tracking_mapping
FROM missions 
WHERE sub_category IS NOT NULL
ORDER BY category, sub_category, target_value;

-- Summary by category and sub-category
SELECT 
    category,
    sub_category,
    COUNT(*) as mission_count,
    SUM(points) as total_points,
    AVG(points) as avg_points,
    MIN(points) as min_points,
    MAX(points) as max_points
FROM missions 
WHERE sub_category IS NOT NULL
GROUP BY category, sub_category
ORDER BY category, sub_category;

-- Total summary
SELECT 
    'ENHANCED_MISSIONS_CREATED' as report_type,
    NOW() as creation_date,
    COUNT(*) as total_missions,
    COUNT(DISTINCT category) as total_categories,
    COUNT(DISTINCT sub_category) as total_sub_categories,
    SUM(points) as total_available_points,
    AVG(points) as avg_points_per_mission
FROM missions 
WHERE sub_category IS NOT NULL;
