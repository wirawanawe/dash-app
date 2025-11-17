-- Create staging table for fast API data ingestion
-- This table stores raw JSON data from API for fast insertion
-- Data will be transformed to visits table in background

USE phc_dashboard;

CREATE TABLE IF NOT EXISTS visits_staging (
  id INT AUTO_INCREMENT PRIMARY KEY,
  external_id VARCHAR(100) NOT NULL COMMENT 'ID from external API (ID or No_Kunjungan)',
  raw_data JSON NOT NULL COMMENT 'Raw JSON data from API',
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  error_message TEXT NULL,
  processed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  UNIQUE KEY unique_external_id (external_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_processed_at (processed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Staging table for fast API data ingestion before transformation to visits table';

