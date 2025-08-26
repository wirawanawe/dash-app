-- Add reset password columns to users table
ALTER TABLE users 
ADD COLUMN reset_token VARCHAR(255) NULL,
ADD COLUMN reset_token_expiry DATETIME NULL;

-- Add reset password columns to mobile_users table
ALTER TABLE mobile_users 
ADD COLUMN reset_otp VARCHAR(10) NULL,
ADD COLUMN reset_otp_expiry DATETIME NULL;

-- Add indexes for better performance
CREATE INDEX idx_users_reset_token ON users(reset_token);
CREATE INDEX idx_users_reset_token_expiry ON users(reset_token_expiry);
CREATE INDEX idx_mobile_users_reset_otp ON mobile_users(reset_otp);
CREATE INDEX idx_mobile_users_reset_otp_expiry ON mobile_users(reset_otp_expiry);

-- Clean up any existing expired tokens/OTPs
UPDATE users SET reset_token = NULL, reset_token_expiry = NULL WHERE reset_token_expiry < NOW();
UPDATE mobile_users SET reset_otp = NULL, reset_otp_expiry = NULL WHERE reset_otp_expiry < NOW();
