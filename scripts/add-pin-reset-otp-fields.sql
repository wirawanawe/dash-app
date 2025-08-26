-- Add PIN reset OTP fields to mobile_users table
-- This script adds fields for PIN reset functionality with WhatsApp OTP

-- Add PIN reset OTP fields
ALTER TABLE mobile_users 
ADD COLUMN pin_reset_otp VARCHAR(10) NULL,
ADD COLUMN pin_reset_otp_expiry DATETIME NULL;

-- Add indexes for better performance
CREATE INDEX idx_mobile_users_pin_reset_otp ON mobile_users(pin_reset_otp);
CREATE INDEX idx_mobile_users_pin_reset_otp_expiry ON mobile_users(pin_reset_otp_expiry);

-- Clean up any existing expired OTPs
UPDATE mobile_users 
SET pin_reset_otp = NULL, 
    pin_reset_otp_expiry = NULL 
WHERE pin_reset_otp_expiry < NOW();

-- Add comment to document the fields
ALTER TABLE mobile_users 
MODIFY COLUMN pin_reset_otp VARCHAR(10) NULL COMMENT 'OTP for PIN reset via WhatsApp',
MODIFY COLUMN pin_reset_otp_expiry DATETIME NULL COMMENT 'Expiry time for PIN reset OTP';

-- Verify the changes
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'phc_dashboard' 
    AND TABLE_NAME = 'mobile_users' 
    AND COLUMN_NAME IN ('pin_reset_otp', 'pin_reset_otp_expiry');
