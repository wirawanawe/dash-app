-- Wellness Data Migration Script
-- Memindahkan data kesehatan dari mobile_users ke health_data
-- dan menghapus kolom kesehatan dari mobile_users

USE phc_dashboard;

-- 1. Migrasi data berat badan dan tinggi badan dari mobile_users ke health_data
INSERT INTO health_data (user_id, data_type, value, unit, measured_at, source, created_at, updated_at)
SELECT 
    id as user_id,
    'weight' as data_type,
    weight as value,
    'kg' as unit,
    NOW() as measured_at,
    'manual' as source,
    NOW() as created_at,
    NOW() as updated_at
FROM mobile_users 
WHERE weight IS NOT NULL AND weight > 0;

INSERT INTO health_data (user_id, data_type, value, unit, measured_at, source, created_at, updated_at)
SELECT 
    id as user_id,
    'height' as data_type,
    height as value,
    'cm' as unit,
    NOW() as measured_at,
    'manual' as source,
    NOW() as created_at,
    NOW() as updated_at
FROM mobile_users 
WHERE height IS NOT NULL AND height > 0;

-- 2. Hapus kolom kesehatan dari mobile_users (dengan pengecekan)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'phc_dashboard' 
     AND TABLE_NAME = 'mobile_users' 
     AND COLUMN_NAME = 'weight') > 0,
    'ALTER TABLE mobile_users DROP COLUMN weight',
    'SELECT "Column weight does not exist"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'phc_dashboard' 
     AND TABLE_NAME = 'mobile_users' 
     AND COLUMN_NAME = 'height') > 0,
    'ALTER TABLE mobile_users DROP COLUMN height',
    'SELECT "Column height does not exist"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'phc_dashboard' 
     AND TABLE_NAME = 'mobile_users' 
     AND COLUMN_NAME = 'age') > 0,
    'ALTER TABLE mobile_users DROP COLUMN age',
    'SELECT "Column age does not exist"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'phc_dashboard' 
     AND TABLE_NAME = 'mobile_users' 
     AND COLUMN_NAME = 'blood_type') > 0,
    'ALTER TABLE mobile_users DROP COLUMN blood_type',
    'SELECT "Column blood_type does not exist"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Pastikan kolom date_of_birth tetap ada untuk perhitungan usia
-- (tidak dihapus karena diperlukan untuk perhitungan usia otomatis)

-- 4. Tambahkan kolom wellness jika belum ada
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'phc_dashboard' 
     AND TABLE_NAME = 'mobile_users' 
     AND COLUMN_NAME = 'wellness_program_joined') = 0,
    'ALTER TABLE mobile_users ADD COLUMN wellness_program_joined BOOLEAN DEFAULT FALSE',
    'SELECT "Column wellness_program_joined already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'phc_dashboard' 
     AND TABLE_NAME = 'mobile_users' 
     AND COLUMN_NAME = 'wellness_join_date') = 0,
    'ALTER TABLE mobile_users ADD COLUMN wellness_join_date DATETIME NULL',
    'SELECT "Column wellness_join_date already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'phc_dashboard' 
     AND TABLE_NAME = 'mobile_users' 
     AND COLUMN_NAME = 'fitness_goal') = 0,
    'ALTER TABLE mobile_users ADD COLUMN fitness_goal ENUM("weight_loss", "muscle_gain", "maintenance", "general_fitness") DEFAULT "general_fitness"',
    'SELECT "Column fitness_goal already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'phc_dashboard' 
     AND TABLE_NAME = 'mobile_users' 
     AND COLUMN_NAME = 'activity_level') = 0,
    'ALTER TABLE mobile_users ADD COLUMN activity_level ENUM("sedentary", "lightly_active", "moderately_active", "very_active", "extremely_active") DEFAULT "moderately_active"',
    'SELECT "Column activity_level already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. Update data type untuk health_data agar mendukung weight dan height
ALTER TABLE health_data 
MODIFY COLUMN data_type ENUM('blood_pressure', 'heart_rate', 'temperature', 'weight', 'height', 'bmi', 'blood_sugar', 'cholesterol') NOT NULL;

-- 6. Buat index untuk optimasi query
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = 'phc_dashboard' 
     AND TABLE_NAME = 'health_data' 
     AND INDEX_NAME = 'idx_health_data_user_type') = 0,
    'CREATE INDEX idx_health_data_user_type ON health_data(user_id, data_type)',
    'SELECT "Index idx_health_data_user_type already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = 'phc_dashboard' 
     AND TABLE_NAME = 'mobile_users' 
     AND INDEX_NAME = 'idx_mobile_users_wellness') = 0,
    'CREATE INDEX idx_mobile_users_wellness ON mobile_users(wellness_program_joined, wellness_join_date)',
    'SELECT "Index idx_mobile_users_wellness already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 7. Verifikasi migrasi
SELECT 
    'Data migration completed' as status,
    COUNT(*) as total_users,
    SUM(CASE WHEN wellness_program_joined = 1 THEN 1 ELSE 0 END) as wellness_users
FROM mobile_users;

SELECT 
    'Health data records' as status,
    data_type,
    COUNT(*) as count
FROM health_data 
GROUP BY data_type;
