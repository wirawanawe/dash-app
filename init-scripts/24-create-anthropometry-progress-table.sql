USE phc_dashboard;

-- Create anthropometry_progress table for daily tracking
CREATE TABLE IF NOT EXISTS anthropometry_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  weight DECIMAL(5,2) NULL COMMENT 'Berat badan dalam kg',
  height DECIMAL(5,2) NULL COMMENT 'Tinggi badan dalam cm',
  bmi DECIMAL(4,2) NULL COMMENT 'BMI yang dihitung otomatis',
  bmi_category ENUM('Kurus', 'Normal', 'Gemuk', 'Obesitas') NULL COMMENT 'Kategori BMI',
  notes TEXT NULL COMMENT 'Catatan tambahan',
  measured_date DATE NOT NULL COMMENT 'Tanggal pengukuran',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for better performance
  INDEX idx_user_date (user_id, measured_date),
  INDEX idx_user_id (user_id),
  INDEX idx_measured_date (measured_date),
  
  -- Foreign key constraint
  FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE,
  
  -- Unique constraint to prevent duplicate entries for same user and date
  UNIQUE KEY unique_user_date (user_id, measured_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
INSERT INTO anthropometry_progress (user_id, weight, height, bmi, bmi_category, notes, measured_date) VALUES
(1, 100.00, 180.00, 30.86, 'Obesitas', 'Pengukuran awal', '2025-08-20'),
(1, 98.50, 180.00, 30.40, 'Obesitas', 'Setelah olahraga', '2025-08-21'),
(1, 97.00, 180.00, 29.94, 'Gemuk', 'Progress penurunan berat', '2025-08-22');

-- Create view untuk mendapatkan data awal dari health_data
CREATE OR REPLACE VIEW anthropometry_initial_data AS
SELECT 
  hd.user_id,
  MAX(CASE WHEN hd.data_type = 'weight' THEN hd.value END) as initial_weight,
  MAX(CASE WHEN hd.data_type = 'height' THEN hd.value END) as initial_height,
  MAX(CASE WHEN hd.data_type = 'weight' THEN hd.measured_at END) as weight_date,
  MAX(CASE WHEN hd.data_type = 'height' THEN hd.measured_at END) as height_date
FROM health_data hd
WHERE hd.data_type IN ('weight', 'height')
GROUP BY hd.user_id;

-- Create view untuk mendapatkan progress summary
CREATE OR REPLACE VIEW anthropometry_progress_summary AS
SELECT 
  ap.user_id,
  ap.measured_date,
  ap.weight,
  ap.height,
  ap.bmi,
  ap.bmi_category,
  aid.initial_weight,
  aid.initial_height,
  -- Calculate weight change
  CASE 
    WHEN aid.initial_weight IS NOT NULL AND ap.weight IS NOT NULL 
    THEN ap.weight - aid.initial_weight 
    ELSE NULL 
  END as weight_change,
  -- Calculate weight change percentage
  CASE 
    WHEN aid.initial_weight IS NOT NULL AND ap.weight IS NOT NULL AND aid.initial_weight > 0
    THEN ((ap.weight - aid.initial_weight) / aid.initial_weight) * 100
    ELSE NULL 
  END as weight_change_percentage,
  -- Calculate BMI change
  CASE 
    WHEN aid.initial_weight IS NOT NULL AND aid.initial_height IS NOT NULL AND ap.bmi IS NOT NULL
    THEN ap.bmi - (aid.initial_weight / POWER(aid.initial_height / 100, 2))
    ELSE NULL 
  END as bmi_change
FROM anthropometry_progress ap
LEFT JOIN anthropometry_initial_data aid ON ap.user_id = aid.user_id
ORDER BY ap.user_id, ap.measured_date DESC;

-- Show table structure
DESCRIBE anthropometry_progress;

-- Show sample data
SELECT * FROM anthropometry_progress ORDER BY user_id, measured_date DESC;

-- Show initial data view
SELECT * FROM anthropometry_initial_data;

-- Show progress summary
SELECT * FROM anthropometry_progress_summary LIMIT 10;

-- Show table info
SELECT 
  'Anthropometry Progress Table Created' as info,
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users,
  MIN(measured_date) as earliest_date,
  MAX(measured_date) as latest_date
FROM anthropometry_progress;
