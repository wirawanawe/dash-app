-- Quick create job_queue table
-- Run: mysql -u root -p phc_dashboard < create_job_queue.sql

USE phc_dashboard;

CREATE TABLE IF NOT EXISTS job_queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_type VARCHAR(50) NOT NULL COMMENT 'Type: visits_incremental_sync, visits_full_sync',
  job_data JSON COMMENT 'Job configuration',
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  priority INT DEFAULT 0,
  attempts INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  error_message TEXT,
  result JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  next_retry_at TIMESTAMP NULL,
  INDEX idx_status_priority (status, priority DESC, created_at),
  INDEX idx_job_type (job_type),
  INDEX idx_next_retry (next_retry_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify
SELECT 'Table created successfully!' as status;
SHOW TABLES LIKE 'job_queue';

