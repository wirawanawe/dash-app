-- Add Wellness Program History Fields
-- This script adds fields to track completed wellness programs and their summaries

USE phc_dashboard;

-- Add fields to track program completion and history
ALTER TABLE mobile_users 
ADD COLUMN wellness_program_completed BOOLEAN DEFAULT FALSE COMMENT 'Status apakah program wellness sudah selesai',
ADD COLUMN wellness_program_end_date DATETIME NULL COMMENT 'Tanggal berakhirnya program wellness',
ADD COLUMN wellness_program_completion_date DATETIME NULL COMMENT 'Tanggal program wellness selesai',
ADD COLUMN wellness_program_cycles INT DEFAULT 1 COMMENT 'Jumlah siklus program wellness yang telah diikuti';

-- Create table for wellness program history/summary
CREATE TABLE IF NOT EXISTS wellness_program_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  program_start_date DATETIME NOT NULL,
  program_end_date DATETIME NOT NULL,
  program_duration INT NOT NULL COMMENT 'Durasi program dalam hari',
  total_activities INT DEFAULT 0 COMMENT 'Total aktivitas yang diselesaikan',
  completed_missions INT DEFAULT 0 COMMENT 'Total misi yang selesai',
  total_points INT DEFAULT 0 COMMENT 'Total poin yang diperoleh',
  wellness_score DECIMAL(5,2) DEFAULT 0 COMMENT 'Skor wellness akhir',
  avg_water_intake DECIMAL(8,2) DEFAULT 0 COMMENT 'Rata-rata konsumsi air (ml)',
  avg_sleep_hours DECIMAL(4,2) DEFAULT 0 COMMENT 'Rata-rata jam tidur',
  avg_mood_score DECIMAL(3,1) DEFAULT 0 COMMENT 'Rata-rata skor mood (1-10)',
  fitness_goal VARCHAR(50) NULL COMMENT 'Tujuan fitness program ini',
  activity_level VARCHAR(50) NULL COMMENT 'Level aktivitas program ini',
  completion_rate DECIMAL(5,2) DEFAULT 0 COMMENT 'Persentase penyelesaian program',
  notes TEXT NULL COMMENT 'Catatan tambahan tentang program',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_program_dates (program_start_date, program_end_date),
  FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX idx_wellness_program_completed ON mobile_users(wellness_program_completed);
CREATE INDEX idx_wellness_program_end_date ON mobile_users(wellness_program_end_date);
CREATE INDEX idx_wellness_program_cycles ON mobile_users(wellness_program_cycles);

-- Update existing users to calculate their program end dates
UPDATE mobile_users 
SET wellness_program_end_date = DATE_ADD(wellness_join_date, INTERVAL wellness_program_duration DAY)
WHERE wellness_program_joined = TRUE 
  AND wellness_join_date IS NOT NULL 
  AND wellness_program_duration IS NOT NULL
  AND wellness_program_end_date IS NULL;

-- Mark programs as completed if they have passed their end date
UPDATE mobile_users 
SET wellness_program_completed = TRUE,
    wellness_program_completion_date = wellness_program_end_date
WHERE wellness_program_joined = TRUE 
  AND wellness_program_end_date IS NOT NULL 
  AND wellness_program_end_date < NOW()
  AND wellness_program_completed = FALSE;

-- Show migration results
SELECT 
    'Migration completed' as status,
    COUNT(*) as total_users,
    SUM(CASE WHEN wellness_program_joined = TRUE THEN 1 ELSE 0 END) as joined_wellness,
    SUM(CASE WHEN wellness_program_completed = TRUE THEN 1 ELSE 0 END) as completed_programs,
    SUM(CASE WHEN wellness_program_cycles > 1 THEN 1 ELSE 0 END) as users_with_multiple_cycles
FROM mobile_users;
