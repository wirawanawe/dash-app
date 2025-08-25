-- Migration: Create habit activities tables and data
-- This script creates the proper habit activities structure

USE phc_dashboard;

-- Create the available_habit_activities table
CREATE TABLE IF NOT EXISTS available_habit_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category ENUM('dietary', 'spiritual', 'physical', 'mental', 'lifestyle') NOT NULL DEFAULT 'dietary',
    habit_type ENUM('daily', 'weekly', 'monthly') DEFAULT 'daily',
    target_frequency INT DEFAULT 1,
    unit VARCHAR(50) DEFAULT 'times',
    duration_minutes INT DEFAULT 0,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'easy',
    points INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create the user_habit_activities table
CREATE TABLE IF NOT EXISTS user_habit_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_id INT NOT NULL,
    activity_date DATE NOT NULL,
    habit_type ENUM('daily', 'weekly', 'monthly') DEFAULT 'daily',
    target_frequency INT DEFAULT 1,
    current_frequency INT DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'times',
    points_earned INT DEFAULT 0,
    notes TEXT,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES available_habit_activities(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_activity_date (user_id, activity_id, activity_date)
);

-- Insert new habit activities (will ignore duplicates)

-- Insert habit activities based on the Fitrah Dietary Activity example
INSERT IGNORE INTO available_habit_activities (
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
