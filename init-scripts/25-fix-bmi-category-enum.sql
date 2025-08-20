USE phc_dashboard;

-- Fix bmi_category ENUM to accommodate longer category names
ALTER TABLE anthropometry_progress 
MODIFY COLUMN bmi_category ENUM(
  'Berat Badan Kurang',
  'Berat Badan Normal', 
  'Berat Badan Berlebih',
  'Obesitas'
) NULL COMMENT 'Kategori BMI';

-- Update existing data to use new category names
UPDATE anthropometry_progress 
SET bmi_category = 'Berat Badan Kurang' 
WHERE bmi_category = 'Kurus';

UPDATE anthropometry_progress 
SET bmi_category = 'Berat Badan Normal' 
WHERE bmi_category = 'Normal';

UPDATE anthropometry_progress 
SET bmi_category = 'Berat Badan Berlebih' 
WHERE bmi_category = 'Gemuk';

-- Verify the changes
DESCRIBE anthropometry_progress;

-- Show updated data
SELECT * FROM anthropometry_progress ORDER BY user_id, measured_date DESC;
