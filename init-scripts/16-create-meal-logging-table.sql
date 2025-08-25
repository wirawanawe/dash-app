-- Meal Logging Table (Consolidated)
-- This script creates a single meal_logging table that consolidates meal_tracking and meal_foods

CREATE TABLE IF NOT EXISTS meal_logging (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    food_id INT,
    food_name VARCHAR(255),
    food_name_indonesian VARCHAR(255),
    quantity DECIMAL(6,2) NOT NULL DEFAULT 1,
    unit VARCHAR(50) NOT NULL DEFAULT 'serving',
    calories DECIMAL(8,2) NOT NULL DEFAULT 0,
    protein DECIMAL(6,2) NOT NULL DEFAULT 0,
    carbs DECIMAL(6,2) NOT NULL DEFAULT 0,
    fat DECIMAL(6,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_meal_type (meal_type),
    INDEX idx_recorded_at (recorded_at),
    INDEX idx_food_id (food_id),
    INDEX idx_user_date (user_id, recorded_at)
);

-- Optional: Add foreign key constraint for food_id if food_database table exists
-- ALTER TABLE meal_logging ADD CONSTRAINT fk_meal_logging_food_id 
-- FOREIGN KEY (food_id) REFERENCES food_database(id) ON DELETE SET NULL;
