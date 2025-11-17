-- Alter sync_logs table to change entity_type from ENUM to VARCHAR
-- This allows more flexible entity types like 'visits_staging', 'visits_transform', etc.

USE phc_dashboard;

-- Change entity_type from ENUM to VARCHAR(50)
ALTER TABLE sync_logs 
MODIFY COLUMN entity_type VARCHAR(50) NOT NULL;

-- Update sync_schedules table as well for consistency
ALTER TABLE sync_schedules 
MODIFY COLUMN entity_type VARCHAR(50) NOT NULL;

-- Recreate indexes
ALTER TABLE sync_logs DROP INDEX idx_entity_type;
ALTER TABLE sync_logs ADD INDEX idx_entity_type (entity_type);

ALTER TABLE sync_schedules DROP INDEX unique_entity_type;
ALTER TABLE sync_schedules ADD UNIQUE KEY unique_entity_type (entity_type);

