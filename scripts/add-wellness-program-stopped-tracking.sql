-- Add Wellness Program Stopped Tracking Fields
-- This script adds fields to track manually stopped wellness programs

USE phc_dashboard;

-- Add fields to track manually stopped programs
ALTER TABLE mobile_users 
ADD COLUMN wellness_program_stopped_count INT DEFAULT 0 COMMENT 'Jumlah kali user menghentikan program wellness secara manual',
ADD COLUMN wellness_program_stopped_date DATETIME NULL COMMENT 'Tanggal terakhir user menghentikan program wellness',
ADD COLUMN wellness_program_stop_reason VARCHAR(255) NULL COMMENT 'Alasan user menghentikan program wellness';

-- Add index for better performance
CREATE INDEX idx_wellness_program_stopped_count ON mobile_users(wellness_program_stopped_count);
CREATE INDEX idx_wellness_program_stopped_date ON mobile_users(wellness_program_stopped_date);

-- Show migration results
SELECT 
    'Migration completed' as status,
    COUNT(*) as total_users,
    SUM(CASE WHEN wellness_program_joined = TRUE THEN 1 ELSE 0 END) as joined_wellness,
    SUM(CASE WHEN wellness_program_completed = TRUE THEN 1 ELSE 0 END) as completed_programs,
    SUM(CASE WHEN wellness_program_cycles > 1 THEN 1 ELSE 0 END) as users_with_multiple_cycles,
    SUM(CASE WHEN wellness_program_stopped_count > 0 THEN 1 ELSE 0 END) as users_with_stopped_programs
FROM mobile_users;
