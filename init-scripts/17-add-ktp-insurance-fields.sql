-- Add KTP and Insurance fields to mobile_users table
-- This script adds the necessary fields for KTP number, address, insurance, and insurance card number

USE phc_dashboard;

-- Add KTP and insurance fields to mobile_users table
ALTER TABLE mobile_users 
ADD COLUMN ktp_number VARCHAR(20) NULL COMMENT 'Nomor KTP',
ADD COLUMN address TEXT NULL COMMENT 'Alamat lengkap',
ADD COLUMN insurance VARCHAR(100) NULL COMMENT 'Nama asuransi',
ADD COLUMN insurance_card_number VARCHAR(50) NULL COMMENT 'Nomor kartu asuransi';

-- Add indexes for better performance (optional)
CREATE INDEX idx_ktp_number ON mobile_users(ktp_number);
CREATE INDEX idx_insurance ON mobile_users(insurance);

-- Show migration results
SELECT 
    'Migration completed' as status,
    COUNT(*) as total_users,
    SUM(CASE WHEN ktp_number IS NOT NULL THEN 1 ELSE 0 END) as users_with_ktp,
    SUM(CASE WHEN address IS NOT NULL THEN 1 ELSE 0 END) as users_with_address,
    SUM(CASE WHEN insurance IS NOT NULL THEN 1 ELSE 0 END) as users_with_insurance,
    SUM(CASE WHEN insurance_card_number IS NOT NULL THEN 1 ELSE 0 END) as users_with_insurance_card
FROM mobile_users;
