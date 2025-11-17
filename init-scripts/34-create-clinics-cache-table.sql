-- Create clinics_cache table for caching faskes data from external API
-- This table stores raw data from API before processing to main clinics table

USE phc_dashboard;

-- ========================================
-- CLINICS CACHE TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS clinics_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- External ID
  external_id VARCHAR(100) NOT NULL COMMENT 'UUID or ID from external API',
  
  -- Basic Information
  name VARCHAR(255) NOT NULL COMMENT 'Nama faskes from API',
  code VARCHAR(100) COMMENT 'Kode faskes from API',
  client_id VARCHAR(100) COMMENT 'Client ID from API',
  
  -- Additional fields from API (if available)
  address TEXT,
  city VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(255),
  
  -- Audit Trail from external API
  external_created_at TIMESTAMP NULL,
  external_updated_at TIMESTAMP NULL,
  
  -- Local timestamps
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When data was synced from API',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  UNIQUE KEY unique_external_id (external_id),
  INDEX idx_name (name),
  INDEX idx_code (code),
  INDEX idx_client_id (client_id),
  INDEX idx_synced_at (synced_at),
  INDEX idx_external_created (external_created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Display summary
SELECT '✅ Clinics cache table created successfully!' as status;

