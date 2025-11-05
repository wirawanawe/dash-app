-- Fix missing height column in mobile_users table
USE phc_dashboard;

-- Add height column if it doesn't exist
ALTER TABLE mobile_users ADD COLUMN height DECIMAL(5,2) AFTER weight;

-- Verify the column was added
DESCRIBE mobile_users;
