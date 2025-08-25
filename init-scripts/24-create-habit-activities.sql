-- Migration: Transform wellness activities to habit activities
-- This script creates habit activities based on Fitrah Dietary Activity

USE phc_dashboard;

-- First, let's rename the existing tables to habit_activities
-- Rename available_wellness_activities to available_habit_activities
RENAME TABLE available_wellness_activities TO available_habit_activities;

-- Rename user_wellness_activities to user_habit_activities
RENAME TABLE user_wellness_activities TO user_habit_activities;

-- Update the available_habit_activities table structure
ALTER TABLE available_habit_activities 
MODIFY COLUMN category ENUM('dietary', 'spiritual', 'physical', 'mental', 'lifestyle') NOT NULL DEFAULT 'dietary',
MODIFY COLUMN difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'easy',
ADD COLUMN habit_type ENUM('daily', 'weekly', 'monthly') DEFAULT 'daily' AFTER category,
ADD COLUMN target_frequency INT DEFAULT 1 COMMENT 'Target frequency per day/week/month',
ADD COLUMN unit VARCHAR(50) DEFAULT 'times' COMMENT 'Unit of measurement (times, minutes, glasses, etc.)';

-- Clear existing data and insert new habit activities based on Fitrah Dietary Activity
TRUNCATE TABLE available_habit_activities;

-- Insert habit activities based on the example
INSERT INTO available_habit_activities (
    title, 
    description, 
    category, 
    habit_type,
    target_frequency,
    unit,
    duration_minutes, 
    difficulty, 
    points, 
    is_active
) VALUES
-- Dietary Habits (Fitrah Dietary Activity)
('Beribadah', 'Melakukan ibadah harian sesuai agama dan kepercayaan', 'spiritual', 'daily', 1, 'times', 30, 'easy', 10, 1),
('Makan Lauk 1 Protein Hewani', 'Mengkonsumsi lauk pauk protein hewani minimal 1 kali sehari', 'dietary', 'daily', 1, 'times', 0, 'easy', 8, 1),
('Tidak Makan Makanan Berbahan Tepung', 'Menghindari makanan yang terbuat dari tepung', 'dietary', 'daily', 1, 'times', 0, 'medium', 12, 1),
('Tidak Makan Makanan Instan', 'Menghindari makanan instan dan kemasan', 'dietary', 'daily', 1, 'times', 0, 'medium', 10, 1),
('Mengunyah Sepenuh Makna', 'Mengunyah makanan dengan perlahan dan penuh kesadaran', 'dietary', 'daily', 3, 'times', 0, 'easy', 5, 1),
('Tidak Makan Buah Bersamaan Makan Berat', 'Menghindari makan buah bersamaan dengan makanan berat', 'dietary', 'daily', 1, 'times', 0, 'easy', 6, 1),
('Tidak Minum Air Saat Makan', 'Menghindari minum air saat sedang makan', 'dietary', 'daily', 3, 'times', 0, 'medium', 8, 1),
('Minum Air di Jeda 1 Jam Setelah Makan', 'Minum air putih 1 jam setelah makan', 'dietary', 'daily', 3, 'times', 0, 'easy', 7, 1),
('Minum Air Tiap Jam', 'Minum air putih setiap jam untuk menjaga hidrasi', 'dietary', 'daily', 8, 'times', 0, 'medium', 15, 1),
('Minum Seteguk Demi Seteguk', 'Minum air dengan perlahan, seteguk demi seteguk', 'dietary', 'daily', 8, 'times', 0, 'easy', 5, 1),
('Tidak Tidur Setelah Makan', 'Menghindari tidur setelah makan', 'lifestyle', 'daily', 3, 'times', 0, 'medium', 10, 1),
('Tidak Begadang (Max Tidur Jam 22.00)', 'Tidur maksimal jam 22.00 untuk kesehatan', 'lifestyle', 'daily', 1, 'times', 0, 'hard', 15, 1),
('Olahraga Setiap Hari', 'Melakukan aktivitas fisik setiap hari', 'physical', 'daily', 1, 'times', 30, 'medium', 20, 1),
('Menjaga Fikiran dan Perasaan agar Tenang', 'Menjaga pikiran dan perasaan tetap tenang', 'mental', 'daily', 1, 'times', 15, 'hard', 12, 1),

-- Additional Lifestyle Habits
('Membaca Al-Quran', 'Membaca Al-Quran minimal 1 halaman sehari', 'spiritual', 'daily', 1, 'pages', 15, 'easy', 10, 1),
('Shalat Tepat Waktu', 'Melakukan shalat tepat pada waktunya', 'spiritual', 'daily', 5, 'times', 10, 'medium', 15, 1),
('Puasa Senin Kamis', 'Melakukan puasa sunnah Senin dan Kamis', 'spiritual', 'weekly', 2, 'times', 0, 'hard', 25, 1),
('Membaca Buku', 'Membaca buku minimal 30 menit sehari', 'mental', 'daily', 1, 'times', 30, 'medium', 12, 1),
('Meditasi', 'Melakukan meditasi untuk ketenangan pikiran', 'mental', 'daily', 1, 'times', 20, 'medium', 15, 1),
('Jalan Kaki', 'Berjalan kaki minimal 10.000 langkah sehari', 'physical', 'daily', 1, 'times', 60, 'medium', 18, 1),
('Stretching', 'Melakukan peregangan otot', 'physical', 'daily', 1, 'times', 15, 'easy', 8, 1),
('Minum Air 8 Gelas', 'Minum air putih minimal 8 gelas sehari', 'dietary', 'daily', 8, 'glasses', 0, 'easy', 12, 1),
('Sarapan Sehat', 'Mengkonsumsi sarapan yang sehat dan bergizi', 'dietary', 'daily', 1, 'times', 0, 'easy', 10, 1),
('Makan Sayur', 'Mengkonsumsi sayuran minimal 3 porsi sehari', 'dietary', 'daily', 3, 'portions', 0, 'medium', 12, 1),
('Tidur 8 Jam', 'Tidur minimal 8 jam sehari', 'lifestyle', 'daily', 1, 'times', 480, 'medium', 15, 1),
('Bangun Pagi', 'Bangun pagi sebelum matahari terbit', 'lifestyle', 'daily', 1, 'times', 0, 'hard', 20, 1),
('Bersyukur', 'Mengucapkan syukur minimal 3 kali sehari', 'spiritual', 'daily', 3, 'times', 0, 'easy', 5, 1),
('Sedekah', 'Memberikan sedekah setiap hari', 'spiritual', 'daily', 1, 'times', 0, 'medium', 15, 1);

-- Update the user_habit_activities table structure
ALTER TABLE user_habit_activities 
MODIFY COLUMN activity_date DATE NOT NULL DEFAULT CURRENT_DATE COMMENT 'Tanggal aktivitas habit dilakukan',
ADD COLUMN habit_type ENUM('daily', 'weekly', 'monthly') DEFAULT 'daily' AFTER activity_date,
ADD COLUMN target_frequency INT DEFAULT 1 COMMENT 'Target frequency for this habit',
ADD COLUMN current_frequency INT DEFAULT 0 COMMENT 'Current frequency achieved',
ADD COLUMN unit VARCHAR(50) DEFAULT 'times' COMMENT 'Unit of measurement';

-- Add indexes for better performance
CREATE INDEX idx_habit_activities_category ON available_habit_activities(category);
CREATE INDEX idx_habit_activities_type ON available_habit_activities(habit_type);
CREATE INDEX idx_user_habit_activities_date ON user_habit_activities(user_id, activity_date);
CREATE INDEX idx_user_habit_activities_type ON user_habit_activities(habit_type);

-- Update table comments
ALTER TABLE available_habit_activities 
COMMENT = 'Tabel untuk menyimpan daftar habit/kegiatan keseharian yang tersedia';

ALTER TABLE user_habit_activities 
COMMENT = 'Tabel untuk melacak habit/kegiatan keseharian pengguna';

-- Show migration results
SELECT 
    'Migration completed' as status,
    COUNT(*) as total_habit_activities,
    COUNT(CASE WHEN category = 'dietary' THEN 1 END) as dietary_habits,
    COUNT(CASE WHEN category = 'spiritual' THEN 1 END) as spiritual_habits,
    COUNT(CASE WHEN category = 'physical' THEN 1 END) as physical_habits,
    COUNT(CASE WHEN category = 'mental' THEN 1 END) as mental_habits,
    COUNT(CASE WHEN category = 'lifestyle' THEN 1 END) as lifestyle_habits
FROM available_habit_activities;

-- Show table structure
DESCRIBE available_habit_activities;
DESCRIBE user_habit_activities;
