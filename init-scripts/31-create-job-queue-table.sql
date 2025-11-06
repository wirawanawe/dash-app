-- Create job queue table for background processing
-- This table stores async jobs for sync operations

CREATE TABLE IF NOT EXISTS job_queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_type VARCHAR(50) NOT NULL COMMENT 'Type of job (e.g., visits_incremental_sync, visits_full_sync)',
  job_data JSON COMMENT 'Job parameters and configuration',
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending' COMMENT 'Current job status',
  priority INT DEFAULT 0 COMMENT 'Job priority (higher = more priority)',
  attempts INT DEFAULT 0 COMMENT 'Number of processing attempts',
  max_retries INT DEFAULT 3 COMMENT 'Maximum retry attempts',
  error_message TEXT COMMENT 'Error message if job failed',
  result JSON COMMENT 'Job execution result',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When job was created',
  started_at TIMESTAMP NULL COMMENT 'When job processing started',
  completed_at TIMESTAMP NULL COMMENT 'When job completed/failed',
  next_retry_at TIMESTAMP NULL COMMENT 'When to retry failed job',
  
  -- Indexes for performance
  INDEX idx_status_priority (status, priority DESC, created_at),
  INDEX idx_job_type (job_type),
  INDEX idx_next_retry (next_retry_at),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Job queue for background processing';

-- Sample insert (optional - for testing)
-- INSERT INTO job_queue (job_type, job_data, priority)
-- VALUES ('visits_incremental_sync', '{}', 5);

