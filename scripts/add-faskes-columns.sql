-- Add columns to clinics table for faskes data
USE phc_dashboard;

-- Add external_id column for UUID from API
ALTER TABLE clinics 
ADD COLUMN IF NOT EXISTS external_id VARCHAR(100) NULL AFTER id,
ADD INDEX idx_external_id (external_id);

-- Add code column for kode_faskes
ALTER TABLE clinics 
ADD COLUMN IF NOT EXISTS code VARCHAR(50) NULL AFTER name,
ADD INDEX idx_code (code);

-- Add client_id column
ALTER TABLE clinics 
ADD COLUMN IF NOT EXISTS client_id VARCHAR(50) NULL AFTER code;

-- Show the updated table structure
DESCRIBE clinics;

