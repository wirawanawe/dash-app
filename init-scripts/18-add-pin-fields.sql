-- Add PIN fields to mobile_users table
-- This script adds the necessary fields for PIN security feature

USE phc_dashboard;

-- Add PIN fields to mobile_users table
ALTER TABLE mobile_users 
ADD COLUMN pin_enabled BOOLEAN DEFAULT FALSE COMMENT 'Status aktif/nonaktif PIN keamanan',
ADD COLUMN pin_code VARCHAR(255) NULL COMMENT 'PIN keamanan (6 digit) - encrypted',
ADD COLUMN pin_attempts INT DEFAULT 0 COMMENT 'Jumlah percobaan PIN yang salah',
ADD COLUMN pin_locked_until DATETIME NULL COMMENT 'Waktu PIN terkunci sampai',
ADD COLUMN pin_last_attempt DATETIME NULL COMMENT 'Waktu percobaan PIN terakhir';

-- Add indexes for better performance
CREATE INDEX idx_pin_enabled ON mobile_users(pin_enabled);
CREATE INDEX idx_pin_locked_until ON mobile_users(pin_locked_until);

-- Add constraints for PIN validation
ALTER TABLE mobile_users 
ADD CONSTRAINT chk_pin_attempts CHECK (pin_attempts >= 0 AND pin_attempts <= 10),
ADD CONSTRAINT chk_pin_code_length CHECK (LENGTH(pin_code) = 6 OR pin_code IS NULL);

-- Show migration results
SELECT 
    'PIN fields migration completed' as status,
    COUNT(*) as total_users,
    SUM(CASE WHEN pin_enabled = TRUE THEN 1 ELSE 0 END) as users_with_pin_enabled,
    SUM(CASE WHEN pin_enabled = FALSE THEN 1 ELSE 0 END) as users_without_pin,
    SUM(CASE WHEN pin_code IS NOT NULL THEN 1 ELSE 0 END) as users_with_pin_code,
    SUM(CASE WHEN pin_attempts > 0 THEN 1 ELSE 0 END) as users_with_failed_attempts
FROM mobile_users;

-- Show table structure after migration
DESCRIBE mobile_users;
