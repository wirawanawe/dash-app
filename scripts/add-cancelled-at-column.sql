-- Add cancelled_at column to user_missions table
ALTER TABLE user_missions 
ADD COLUMN cancelled_at TIMESTAMP NULL AFTER completed_at;

-- Add notes column for storing abandon reason
ALTER TABLE user_missions 
ADD COLUMN notes TEXT NULL AFTER cancelled_at; 