-- Update the status ENUM to include 'abandoned'
ALTER TABLE user_missions 
MODIFY COLUMN status ENUM('active', 'completed', 'failed', 'abandoned', 'expired', 'cancelled') DEFAULT 'active'; 