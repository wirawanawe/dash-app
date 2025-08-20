-- Add Dummy Data for PHC Dashboard and Mobile App
-- This script adds comprehensive dummy data for all tables

USE phc_dashboard;

-- ========================================
-- CLINICS DATA
-- ========================================
INSERT IGNORE INTO clinics (name, address, city, phone, email, rating, total_reviews, latitude, longitude, description) VALUES
('RS PHC Jakarta Pusat', 'Jl. Sudirman No. 123, Jakarta Pusat', 'Jakarta Pusat', '021-5550123', 'jakarta@phc.com', 4.5, 156, -6.2088, 106.8456, 'Rumah Sakit PHC cabang Jakarta Pusat dengan layanan lengkap'),
('RS PHC Bandung', 'Jl. Asia Afrika No. 45, Bandung', 'Bandung', '022-5550456', 'bandung@phc.com', 4.3, 89, -6.9175, 107.6191, 'Rumah Sakit PHC cabang Bandung'),
('RS PHC Surabaya', 'Jl. Pemuda No. 67, Surabaya', 'Surabaya', '031-5550789', 'surabaya@phc.com', 4.7, 234, -7.2575, 112.7521, 'Rumah Sakit PHC cabang Surabaya'),
('RS PHC Medan', 'Jl. Sudirman No. 89, Medan', 'Medan', '061-5550112', 'medan@phc.com', 4.2, 67, 3.5952, 98.6722, 'Rumah Sakit PHC cabang Medan'),
('RS PHC Makassar', 'Jl. Pengayoman No. 12, Makassar', 'Makassar', '0411-5550345', 'makassar@phc.com', 4.4, 123, -5.1477, 119.4327, 'Rumah Sakit PHC cabang Makassar');

-- ========================================
-- DOCTORS DATA
-- ========================================
INSERT IGNORE INTO doctors (name, specialist, license_number, phone, email, address, clinic_id) VALUES
('Dr. Sarah Johnson', 'Kardiologi', 'SP.JP-001', '081234567890', 'sarah.johnson@phc.com', 'Jakarta Pusat', 1),
('Dr. Ahmad Rahman', 'Bedah Umum', 'SP.B-002', '081234567891', 'ahmad.rahman@phc.com', 'Bandung', 2),
('Dr. Maria Garcia', 'Pediatri', 'SP.A-003', '081234567892', 'maria.garcia@phc.com', 'Surabaya', 3),
('Dr. Budi Santoso', 'Neurologi', 'SP.N-004', '081234567893', 'budi.santoso@phc.com', 'Medan', 4),
('Dr. Lisa Chen', 'Dermatologi', 'SP.KK-005', '081234567894', 'lisa.chen@phc.com', 'Makassar', 5),
('Dr. Rudi Hartono', 'Ortopedi', 'SP.OT-006', '081234567895', 'rudi.hartono@phc.com', 'Jakarta Pusat', 1),
('Dr. Siti Aminah', 'Ginekologi', 'SP.OG-007', '081234567896', 'siti.aminah@phc.com', 'Bandung', 2),
('Dr. John Smith', 'Pulmonologi', 'SP.P-008', '081234567897', 'john.smith@phc.com', 'Surabaya', 3);

-- ========================================
-- POLYCLINICS DATA
-- ========================================
INSERT IGNORE INTO polyclinics (name, code, description) VALUES
('Poli Umum', 'POL-001', 'Layanan pemeriksaan umum dan konsultasi kesehatan'),
('Poli Gigi', 'POL-002', 'Layanan kesehatan gigi dan mulut'),
('Poli Anak', 'POL-003', 'Layanan kesehatan khusus anak-anak'),
('Poli Jantung', 'POL-004', 'Layanan spesialis jantung dan pembuluh darah'),
('Poli Bedah', 'POL-005', 'Layanan bedah umum dan spesialis'),
('Poli Kulit', 'POL-006', 'Layanan kesehatan kulit dan kelamin'),
('Poli Saraf', 'POL-007', 'Layanan spesialis saraf dan otak'),
('Poli Orthopedi', 'POL-008', 'Layanan spesialis tulang dan sendi');

-- ========================================
-- INSURANCES DATA
-- ========================================
INSERT IGNORE INTO insurances (name, code, contact_person, phone, email, address) VALUES
('BPJS Kesehatan', 'BPJS-001', 'Ahmad Supriadi', '021-5550001', 'info@bpjs-kesehatan.go.id', 'Jakarta Pusat'),
('Allianz Indonesia', 'ALL-001', 'Budi Santoso', '021-5550002', 'info@allianz.co.id', 'Jakarta Selatan'),
('AIA Indonesia', 'AIA-001', 'Siti Nurhaliza', '021-5550003', 'info@aia.co.id', 'Jakarta Barat'),
('Prudential Indonesia', 'PRU-001', 'Rudi Hartono', '021-5550004', 'info@prudential.co.id', 'Jakarta Timur'),
('Manulife Indonesia', 'MAN-001', 'Lisa Chen', '021-5550005', 'info@manulife.co.id', 'Jakarta Utara');

-- ========================================
-- COMPANIES DATA
-- ========================================
INSERT IGNORE INTO companies (name, code, contact_person, phone, email, address) VALUES
('PT Astra International', 'AST-001', 'Bambang Hartono', '021-5551001', 'hr@astra.co.id', 'Jakarta Selatan'),
('PT Bank Central Asia', 'BCA-001', 'Dewi Sartika', '021-5551002', 'hr@bca.co.id', 'Jakarta Pusat'),
('PT Telkom Indonesia', 'TLK-001', 'Ahmad Rahman', '021-5551003', 'hr@telkom.co.id', 'Bandung'),
('PT Pertamina', 'PERT-001', 'Maria Garcia', '021-5551004', 'hr@pertamina.co.id', 'Jakarta Selatan'),
('PT Bank Mandiri', 'MDR-001', 'John Smith', '021-5551005', 'hr@mandiri.co.id', 'Jakarta Pusat');

-- ========================================
-- TREATMENTS DATA
-- ========================================
INSERT IGNORE INTO treatments (name, code, description, price, is_active) VALUES
('Konsultasi Umum', 'TRT-001', 'Konsultasi kesehatan umum', 150000, TRUE),
('Pemeriksaan Darah', 'TRT-002', 'Pemeriksaan darah lengkap', 250000, TRUE),
('Rontgen Thorax', 'TRT-003', 'Pemeriksaan rontgen dada', 300000, TRUE),
('EKG', 'TRT-004', 'Pemeriksaan jantung dengan EKG', 200000, TRUE),
('USG Abdomen', 'TRT-005', 'Pemeriksaan USG perut', 400000, TRUE),
('Pemeriksaan Gigi', 'TRT-006', 'Pemeriksaan dan perawatan gigi', 180000, TRUE),
('Fisioterapi', 'TRT-007', 'Terapi fisik dan rehabilitasi', 350000, TRUE),
('Pemeriksaan Mata', 'TRT-008', 'Pemeriksaan kesehatan mata', 220000, TRUE);

-- ========================================
-- ICD DATA
-- ========================================
INSERT IGNORE INTO icd (code, name, description) VALUES
('A00-B99', 'Penyakit Infeksi', 'Penyakit yang disebabkan oleh infeksi'),
('C00-D48', 'Neoplasma', 'Penyakit tumor dan kanker'),
('E00-E90', 'Penyakit Endokrin', 'Penyakit kelenjar dan metabolisme'),
('F00-F99', 'Penyakit Mental', 'Gangguan mental dan perilaku'),
('G00-G99', 'Penyakit Saraf', 'Penyakit sistem saraf'),
('I00-I99', 'Penyakit Jantung', 'Penyakit sistem kardiovaskular'),
('J00-J99', 'Penyakit Pernapasan', 'Penyakit sistem pernapasan'),
('K00-K93', 'Penyakit Pencernaan', 'Penyakit sistem pencernaan');

-- ========================================
-- PATIENTS DATA
-- ========================================
INSERT IGNORE INTO patients (name, email, phone, address, date_of_birth, gender, blood_type, emergency_contact, insurance_id, company_id, created_at) VALUES
('Ahmad Fauzi', 'ahmad.fauzi@email.com', '081234567890', 'Jl. Sudirman No. 123, Jakarta', '1990-05-15', 'male', 'O+', 'Siti Aminah (081234567891)', 1, 1, NOW()),
('Sarah Johnson', 'sarah.johnson@email.com', '081234567892', 'Jl. Thamrin No. 45, Jakarta', '1985-08-22', 'female', 'A+', 'John Johnson (081234567893)', 2, 2, NOW()),
('Budi Santoso', 'budi.santoso@email.com', '081234567894', 'Jl. Asia Afrika No. 67, Bandung', '1992-03-10', 'male', 'B+', 'Siti Santoso (081234567895)', 1, 3, NOW()),
('Maria Garcia', 'maria.garcia@email.com', '081234567896', 'Jl. Pemuda No. 89, Surabaya', '1988-12-05', 'female', 'AB+', 'Carlos Garcia (081234567897)', 3, 4, NOW()),
('Rudi Hartono', 'rudi.hartono@email.com', '081234567898', 'Jl. Sudirman No. 12, Medan', '1995-07-18', 'male', 'O-', 'Dewi Hartono (081234567899)', 2, 5, NOW()),
('Lisa Chen', 'lisa.chen@email.com', '081234567800', 'Jl. Pengayoman No. 34, Makassar', '1991-11-30', 'female', 'A-', 'Michael Chen (081234567801)', 1, 1, NOW()),
('Ahmad Rahman', 'ahmad.rahman@email.com', '081234567802', 'Jl. Gatot Subroto No. 56, Jakarta', '1987-04-12', 'male', 'B-', 'Fatimah Rahman (081234567803)', 3, 2, NOW()),
('Siti Nurhaliza', 'siti.nurhaliza@email.com', '081234567804', 'Jl. Hayam Wuruk No. 78, Jakarta', '1993-09-25', 'female', 'O+', 'Ahmad Nurhaliza (081234567805)', 2, 3, NOW());

-- ========================================
-- VISITS DATA
-- ========================================
INSERT IGNORE INTO visits (patient_id, doctor_id, clinic_id, visit_date, symptoms, diagnosis, treatment, notes, status) VALUES
(1, 1, 1, '2024-01-15 09:00:00', 'Nyeri dada, sesak napas', 'Angina pectoris', 'Obat anti-angina, istirahat', 'Pasien perlu kontrol rutin', 'completed'),
(2, 2, 2, '2024-01-16 10:30:00', 'Demam, batuk, pilek', 'ISPA', 'Antibiotik, vitamin C', 'Istirahat yang cukup', 'completed'),
(3, 3, 3, '2024-01-17 14:00:00', 'Sakit kepala, mual', 'Migrain', 'Analgesik, istirahat', 'Hindari stress', 'completed'),
(4, 4, 4, '2024-01-18 11:15:00', 'Nyeri sendi lutut', 'Osteoarthritis', 'Fisioterapi, obat anti-inflamasi', 'Kontrol 2 minggu', 'completed'),
(5, 5, 5, '2024-01-19 16:45:00', 'Ruam kulit, gatal', 'Dermatitis kontak', 'Krim steroid, antihistamin', 'Hindari alergen', 'completed'),
(6, 1, 1, '2024-01-20 08:30:00', 'Palpitasi, lemas', 'Anemia', 'Suplemen zat besi', 'Diet tinggi protein', 'completed'),
(7, 2, 2, '2024-01-21 13:20:00', 'Nyeri perut, mual', 'Gastritis', 'Antasida, diet lambung', 'Makan teratur', 'completed'),
(8, 3, 3, '2024-01-22 15:10:00', 'Insomnia, cemas', 'Gangguan kecemasan', 'Antidepresan, konseling', 'Terapi relaksasi', 'completed');

-- ========================================
-- EXAMINATIONS DATA
-- ========================================
INSERT IGNORE INTO examinations (visit_id, examination_type, result, notes, created_at) VALUES
(1, 'EKG', 'Normal sinus rhythm, HR 72 bpm', 'Hasil EKG normal', NOW()),
(1, 'Blood Pressure', '140/90 mmHg', 'Tekanan darah sedikit tinggi', NOW()),
(2, 'Temperature', '38.5°C', 'Demam sedang', NOW()),
(2, 'Blood Test', 'WBC: 12,000/μL, CRP: 15 mg/L', 'Infeksi bakteri', NOW()),
(3, 'Neurological Exam', 'Normal, no focal deficits', 'Pemeriksaan neurologis normal', NOW()),
(4, 'X-Ray Knee', 'Joint space narrowing, osteophytes', 'Osteoarthritis grade 2', NOW()),
(5, 'Skin Biopsy', 'Spongiotic dermatitis', 'Dermatitis kontak alergi', NOW()),
(6, 'Blood Test', 'Hb: 10.5 g/dL, Ferritin: 15 ng/mL', 'Anemia defisiensi besi', NOW());

-- ========================================
-- ADDITIONAL FOOD DATABASE
-- ========================================
INSERT IGNORE INTO food_database (name, name_indonesian, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, is_verified, source) VALUES
('Tempe', 'Tempe', 'Protein', 192, 20.3, 7.6, 10.8, 1.4, TRUE, 'manual'),
('Tahu', 'Tahu', 'Protein', 76, 8.1, 1.9, 4.8, 0.3, TRUE, 'manual'),
('Kangkung', 'Kangkung', 'Vegetables', 20, 2.6, 3.1, 0.2, 1.0, TRUE, 'manual'),
('Bayam', 'Bayam', 'Vegetables', 23, 2.9, 3.6, 0.4, 2.2, TRUE, 'manual'),
('Wortel', 'Wortel', 'Vegetables', 41, 0.9, 9.6, 0.2, 2.8, TRUE, 'manual'),
('Kentang', 'Kentang', 'Grains', 77, 2.0, 17.0, 0.1, 2.2, TRUE, 'manual'),
('Ubi Jalar', 'Ubi Jalar', 'Grains', 86, 1.6, 20.1, 0.1, 3.0, TRUE, 'manual'),
('Ikan Lele', 'Ikan Lele', 'Protein', 105, 18.0, 0.0, 2.3, 0.0, TRUE, 'manual'),
('Ikan Gurame', 'Ikan Gurame', 'Protein', 125, 19.0, 0.0, 4.5, 0.0, TRUE, 'manual'),
('Ayam Goreng', 'Ayam Goreng', 'Protein', 239, 23.0, 0.0, 14.0, 0.0, TRUE, 'manual');

-- ========================================
-- ADDITIONAL MISSIONS
-- ========================================
INSERT IGNORE INTO missions (title, description, category, type, target_value, unit, points, icon, color, difficulty) VALUES
('Meditate 10 Minutes', 'Meditasi 10 menit per hari untuk kesehatan mental', 'mental_health', 'daily', 10, 'minutes', 15, 'meditation', '#9B59B6', 'easy'),
('Read Health Article', 'Baca artikel kesehatan 1 per hari', 'education', 'daily', 1, 'article', 8, 'book-open', '#3498DB', 'easy'),
('Take Vitamins', 'Minum vitamin sesuai anjuran', 'health_tracking', 'daily', 1, 'time', 5, 'pill', '#E74C3C', 'easy'),
('Stretch Exercise', 'Lakukan peregangan 15 menit per hari', 'fitness', 'daily', 15, 'minutes', 12, 'stretch', '#F39C12', 'medium'),
('Drink Green Tea', 'Minum teh hijau 2 gelas per hari', 'nutrition', 'daily', 2, 'glasses', 8, 'tea', '#27AE60', 'easy'),
('Track Mood', 'Catat mood 3 kali per hari', 'mental_health', 'daily', 3, 'times', 10, 'heart', '#E91E63', 'easy'),
('Take Stairs', 'Gunakan tangga 5 kali per hari', 'fitness', 'daily', 5, 'times', 12, 'stairs', '#FF6B6B', 'medium'),
('Eat Fruits', 'Makan buah 2 porsi per hari', 'nutrition', 'daily', 2, 'servings', 10, 'fruit', '#FFD93D', 'easy');

-- ========================================
-- USER MISSIONS (Sample data for user_id 1)
-- ========================================
INSERT IGNORE INTO user_missions (user_id, mission_id, status, current_value, start_date, points_earned) VALUES
(1, 1, 'completed', 8, '2024-01-15', 10),
(1, 2, 'active', 6500, '2024-01-16', 0),
(1, 3, 'completed', 3, '2024-01-15', 10),
(1, 4, 'active', 6, '2024-01-17', 0),
(1, 5, 'completed', 8, '2024-01-15', 12),
(1, 6, 'active', 15, '2024-01-18', 0),
(1, 7, 'completed', 10, '2024-01-15', 15),
(1, 8, 'active', 2, '2024-01-19', 0);

-- ========================================
-- WELLNESS ACTIVITIES
-- ========================================
INSERT IGNORE INTO wellness_activities (user_id, activity_type, title, description, duration_minutes, calories_burned, completed_at) VALUES
(1, 'exercise', 'Jalan Pagi', 'Jalan santai di pagi hari', 30, 120, '2024-01-15 06:00:00'),
(1, 'meditation', 'Meditasi Pagi', 'Meditasi untuk kesehatan mental', 15, 0, '2024-01-15 07:00:00'),
(1, 'yoga', 'Yoga Pagi', 'Sesi yoga untuk fleksibilitas', 45, 180, '2024-01-16 06:30:00'),
(1, 'swimming', 'Berenang', 'Berenang untuk kesehatan jantung', 60, 400, '2024-01-17 16:00:00'),
(1, 'cycling', 'Bersepeda', 'Bersepeda di taman kota', 45, 250, '2024-01-18 17:00:00');

-- ========================================
-- MOOD TRACKING
-- ========================================
INSERT IGNORE INTO mood_tracking (user_id, mood_score, mood_type, notes, tracking_date) VALUES
(1, 8, 'happy', 'Hari yang menyenangkan, kerjaan lancar', '2024-01-15'),
(1, 6, 'neutral', 'Hari biasa, sedikit lelah', '2024-01-16'),
(1, 9, 'excited', 'Berhasil menyelesaikan project', '2024-01-17'),
(1, 7, 'content', 'Quality time dengan keluarga', '2024-01-18'),
(1, 5, 'tired', 'Kurang tidur, banyak kerjaan', '2024-01-19'),
(1, 8, 'happy', 'Olahraga pagi, badan segar', '2024-01-20'),
(1, 6, 'neutral', 'Hari kerja biasa', '2024-01-21'),
(1, 7, 'content', 'Makan enak, mood bagus', '2024-01-22');

-- ========================================
-- WATER TRACKING
-- ========================================
INSERT IGNORE INTO water_tracking (user_id, glasses_drunk, tracking_date) VALUES
(1, 8, '2024-01-15'),
(1, 6, '2024-01-16'),
(1, 9, '2024-01-17'),
(1, 7, '2024-01-18'),
(1, 8, '2024-01-19'),
(1, 5, '2024-01-20'),
(1, 8, '2024-01-21'),
(1, 7, '2024-01-22');

-- ========================================
-- USER WATER SETTINGS
-- ========================================
INSERT IGNORE INTO user_water_settings (user_id, daily_target_glasses, reminder_enabled, reminder_times) VALUES
(1, 8, TRUE, '["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"]');

-- ========================================
-- SLEEP TRACKING
-- ========================================
INSERT IGNORE INTO sleep_tracking (user_id, sleep_hours, sleep_quality, sleep_date, bedtime, wake_time) VALUES
(1, 7.5, 'good', '2024-01-15', '22:30:00', '06:00:00'),
(1, 6.0, 'fair', '2024-01-16', '23:00:00', '05:00:00'),
(1, 8.0, 'excellent', '2024-01-17', '22:00:00', '06:00:00'),
(1, 7.0, 'good', '2024-01-18', '22:45:00', '05:45:00'),
(1, 6.5, 'fair', '2024-01-19', '23:30:00', '06:00:00'),
(1, 8.5, 'excellent', '2024-01-20', '21:30:00', '06:00:00'),
(1, 7.0, 'good', '2024-01-21', '22:15:00', '05:15:00'),
(1, 6.0, 'poor', '2024-01-22', '00:00:00', '06:00:00');

-- ========================================
-- MEAL LOGGING
-- ========================================
(1, 'breakfast', '2024-01-15', 350, 15, 45, 12),
(1, 'lunch', '2024-01-15', 650, 25, 80, 20),
(1, 'dinner', '2024-01-15', 500, 20, 60, 18),
(1, 'breakfast', '2024-01-16', 320, 12, 40, 10),
(1, 'lunch', '2024-01-16', 700, 30, 85, 25),
(1, 'dinner', '2024-01-16', 480, 18, 55, 16),
(1, 'breakfast', '2024-01-17', 380, 16, 48, 14),
(1, 'lunch', '2024-01-17', 680, 28, 82, 22),
(1, 'dinner', '2024-01-17', 520, 22, 62, 19);

-- ========================================
-- MEAL TRACKING
-- ========================================
INSERT IGNORE INTO meal_tracking (user_id, meal_type, food_name, quantity, calories, protein, carbs, fat, recorded_at) VALUES
(1, 'breakfast', 'Oatmeal', 100, 68, 2.4, 12, 1.4, '2024-01-15 07:00:00'),
(1, 'breakfast', 'Banana', 118, 105, 1.3, 27, 0.4, '2024-01-15 07:00:00'),
(1, 'lunch', 'Chicken Breast', 150, 248, 46, 0, 5.4, '2024-01-15 12:00:00'),
(1, 'lunch', 'Rice', 100, 130, 2.7, 28, 0.3, '2024-01-15 12:00:00'),
(1, 'lunch', 'Broccoli', 100, 34, 2.8, 7, 0.4, '2024-01-15 12:00:00'),
(1, 'dinner', 'Salmon', 150, 312, 38, 0, 18, '2024-01-15 19:00:00'),
(1, 'dinner', 'Sweet Potato', 100, 86, 1.6, 20, 0.1, '2024-01-15 19:00:00');

-- ========================================
-- MEAL FOODS
-- ========================================
INSERT IGNORE INTO meal_foods (meal_id, food_id, quantity_grams, calories, protein, carbs, fat) VALUES
(1, 1, 100, 130, 2.7, 28, 0.3),
(1, 4, 118, 105, 1.3, 27, 0.4),
(2, 2, 150, 248, 46, 0, 5.4),
(2, 1, 100, 130, 2.7, 28, 0.3),
(2, 3, 100, 34, 2.8, 7, 0.4);

-- ========================================
-- FITNESS TRACKING
-- ========================================
INSERT IGNORE INTO fitness_tracking (user_id, activity_type, duration_minutes, calories_burned, distance_km, steps_count, tracking_date) VALUES
(1, 'walking', 45, 180, 3.2, 4000, '2024-01-15'),
(1, 'running', 30, 300, 5.0, 6000, '2024-01-16'),
(1, 'cycling', 60, 400, 15.0, 0, '2024-01-17'),
(1, 'swimming', 45, 350, 1.5, 0, '2024-01-18'),
(1, 'yoga', 60, 150, 0, 0, '2024-01-19'),
(1, 'weight_training', 45, 250, 0, 0, '2024-01-20'),
(1, 'walking', 30, 120, 2.1, 2800, '2024-01-21'),
(1, 'running', 25, 250, 4.2, 5000, '2024-01-22');

-- ========================================
-- USER QUICK FOODS
-- ========================================
INSERT IGNORE INTO user_quick_foods (user_id, food_id, custom_portion_grams, custom_name, order_index) VALUES
(1, 1, 100, 'Nasi Goreng Favorit', 1),
(1, 2, 150, 'Ayam Goreng Spesial', 2),
(1, 3, 120, 'Gado-gado Sehat', 3),
(1, 4, 100, 'Sate Ayam', 4),
(1, 5, 200, 'Soto Ayam', 5),
(1, 6, 150, 'Rendang', 6),
(1, 7, 100, 'Mie Goreng', 7),
(1, 8, 200, 'Bakso', 8),
(1, 11, 100, 'Pisang', 9),
(1, 14, 50, 'Brokoli', 10),
(2, 1, 100, 'Nasi Goreng', 1),
(2, 2, 150, 'Ayam Goreng', 2),
(2, 3, 120, 'Gado-gado', 3),
(2, 4, 100, 'Sate Ayam', 4),
(2, 5, 200, 'Soto Ayam', 5),
(3, 1, 100, 'Nasi Goreng', 1),
(3, 2, 150, 'Ayam Goreng', 2),
(3, 3, 120, 'Gado-gado', 3);

-- ========================================
-- CHATS
-- ========================================
INSERT IGNORE INTO chats (user_id, chat_type, title, status, last_message_at) VALUES
(1, 'ai', 'Konsultasi AI - Kesehatan Umum', 'active', NOW()),
(1, 'doctor', 'Konsultasi dengan Dr. Sarah Johnson', 'active', NOW()),
(1, 'ai', 'Konsultasi AI - Nutrisi', 'completed', DATE_SUB(NOW(), INTERVAL 1 DAY));

-- ========================================
-- CHAT MESSAGES
-- ========================================
INSERT IGNORE INTO chat_messages (chat_id, sender_type, message, created_at) VALUES
(1, 'user', 'Halo, saya ingin bertanya tentang pola makan sehat', NOW()),
(1, 'ai', 'Halo! Saya siap membantu Anda dengan pertanyaan tentang pola makan sehat. Apa yang ingin Anda tanyakan?', NOW()),
(1, 'user', 'Bagaimana cara menurunkan berat badan dengan sehat?', NOW()),
(1, 'ai', 'Untuk menurunkan berat badan dengan sehat, Anda perlu: 1) Defisit kalori 300-500 kalori per hari, 2) Olahraga 150 menit per minggu, 3) Konsumsi protein tinggi, 4) Hindari makanan olahan', NOW()),
(2, 'user', 'Dokter, saya mengalami nyeri dada', NOW()),
(2, 'doctor', 'Halo, kapan mulai merasakan nyeri dada? Apakah disertai gejala lain seperti sesak napas atau keringat dingin?', NOW());

-- ========================================
-- CONSULTATIONS
-- ========================================
INSERT IGNORE INTO consultations (user_id, doctor_id, consultation_type, scheduled_at, duration_minutes, status, notes) VALUES
(1, 1, 'online', '2024-01-25 10:00:00', 30, 'scheduled', 'Konsultasi kesehatan jantung'),
(1, 2, 'offline', '2024-01-26 14:00:00', 45, 'scheduled', 'Pemeriksaan fisik rutin'),
(1, 3, 'online', '2024-01-27 09:00:00', 30, 'scheduled', 'Konsultasi nutrisi'),
(1, 4, 'offline', '2024-01-28 16:00:00', 60, 'scheduled', 'Pemeriksaan neurologis');

-- ========================================
-- HEALTH DATA
-- ========================================
INSERT IGNORE INTO health_data (user_id, data_type, value, unit, measured_at, notes) VALUES
(1, 'weight', 70.5, 'kg', '2024-01-15 08:00:00', 'Berat badan pagi'),
(1, 'blood_pressure', 120, 'mmHg', '2024-01-15 08:00:00', 'Sistolik'),
(1, 'blood_pressure', 80, 'mmHg', '2024-01-15 08:00:00', 'Diastolik'),
(1, 'heart_rate', 72, 'bpm', '2024-01-15 08:00:00', 'Denyut nadi normal'),
(1, 'temperature', 36.8, '°C', '2024-01-15 08:00:00', 'Suhu tubuh normal'),
(1, 'blood_sugar', 95, 'mg/dL', '2024-01-15 08:00:00', 'Gula darah puasa'),
(1, 'height', 170, 'cm', '2024-01-15 08:00:00', 'Tinggi badan'),
(1, 'bmi', 24.4, 'kg/m²', '2024-01-15 08:00:00', 'BMI normal');

-- ========================================
-- ASSESSMENTS
-- ========================================
INSERT IGNORE INTO assessments (user_id, assessment_type, title, description, questions, answers, score, max_score, result_category, recommendations, completed_at) VALUES
(1, 'mental_health', 'Depression Screening', 'Pemeriksaan gejala depresi', 
'[{"question": "Apakah Anda merasa sedih atau kosong?", "options": ["Tidak pernah", "Kadang", "Sering", "Selalu"]}, {"question": "Apakah Anda kehilangan minat pada aktivitas?", "options": ["Tidak pernah", "Kadang", "Sering", "Selalu"]}]',
'[{"question": "Apakah Anda merasa sedih atau kosong?", "answer": "Kadang"}, {"question": "Apakah Anda kehilangan minat pada aktivitas?", "answer": "Tidak pernah"}]',
8, 16, 'good', 'Mood Anda stabil. Lanjutkan aktivitas positif dan olahraga rutin.', '2024-01-15 10:00:00'),
(1, 'nutrition', 'Nutrition Assessment', 'Pemeriksaan pola makan', 
'[{"question": "Berapa kali Anda makan sayur per hari?", "options": ["0-1 kali", "2-3 kali", "4-5 kali", "6+ kali"]}, {"question": "Berapa gelas air yang Anda minum per hari?", "options": ["0-3 gelas", "4-6 gelas", "7-8 gelas", "9+ gelas"]}]',
'[{"question": "Berapa kali Anda makan sayur per hari?", "answer": "2-3 kali"}, {"question": "Berapa gelas air yang Anda minum per hari?", "answer": "7-8 gelas"}]',
12, 16, 'good', 'Pola makan Anda cukup baik. Tingkatkan konsumsi sayur dan buah.', '2024-01-16 11:00:00');

-- ========================================
-- ADDITIONAL USERS (Staff/Admin)
-- ========================================
INSERT IGNORE INTO users (name, email, password, role, clinic_id, is_active) VALUES
('Admin Jakarta', 'admin.jakarta@phc.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1, TRUE),
('Staff Bandung', 'staff.bandung@phc.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff', 2, TRUE),
('Doctor Surabaya', 'doctor.surabaya@phc.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'doctor', 3, TRUE),
('Admin Medan', 'admin.medan@phc.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 4, TRUE),
('Staff Makassar', 'staff.makassar@phc.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff', 5, TRUE);

-- ========================================
-- COMPLETION MESSAGE
-- ========================================
SELECT 'Dummy data has been successfully added to all tables!' as message; 