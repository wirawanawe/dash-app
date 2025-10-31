-- Performance Indexes for High Traffic Optimization
-- Run this script to create indexes that improve query performance for 1000+ concurrent users

USE phc_dashboard;

-- ==========================================
-- VISITS TABLE INDEXES
-- ==========================================

-- Index for date-based queries (most common filter)
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_visits_date_desc ON visits(visit_date DESC);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);

-- Index for patient name searches (case-insensitive searches)
CREATE INDEX IF NOT EXISTS idx_visits_patient_name ON visits(patient_name(255));

-- Index for doctor name searches
CREATE INDEX IF NOT EXISTS idx_visits_doctor_name ON visits(doctor_name(255));

-- Index for visit number searches
CREATE INDEX IF NOT EXISTS idx_visits_visit_number ON visits(visit_number);

-- Composite index for date + status (common query pattern)
CREATE INDEX IF NOT EXISTS idx_visits_date_status ON visits(visit_date, status);

-- Composite index for date range queries
CREATE INDEX IF NOT EXISTS idx_visits_date_range ON visits(visit_date, status, patient_name(255));

-- ==========================================
-- PATIENTS TABLE INDEXES
-- ==========================================

-- Index for name searches
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name(255));

-- Index for NIK searches
CREATE INDEX IF NOT EXISTS idx_patients_nik ON patients(nik);

-- Index for MRN searches
CREATE INDEX IF NOT EXISTS idx_patients_mrn ON patients(mrn);

-- Composite index for common search patterns
CREATE INDEX IF NOT EXISTS idx_patients_search ON patients(name(255), nik, mrn);

-- ==========================================
-- DOCTORS TABLE INDEXES
-- ==========================================

-- Index for doctor name searches
CREATE INDEX IF NOT EXISTS idx_doctors_name ON doctors(name(255));

-- Index for availability
CREATE INDEX IF NOT EXISTS idx_doctors_available ON doctors(is_available_for_consultation);

-- ==========================================
-- CLINIC_ROOMS TABLE INDEXES
-- ==========================================

-- Index for room status queries
CREATE INDEX IF NOT EXISTS idx_clinic_rooms_status ON clinic_rooms(room_status);

-- Index for active rooms
CREATE INDEX IF NOT EXISTS idx_clinic_rooms_active ON clinic_rooms(is_active);

-- ==========================================
-- OPTIMIZATION NOTES
-- ==========================================

-- 1. These indexes will speed up:
--    - Date range queries (visits by date)
--    - Status filtering
--    - Patient/doctor name searches
--    - Visit number lookups
--
-- 2. Monitor index usage with:
--    SHOW INDEX FROM visits;
--    EXPLAIN SELECT * FROM visits WHERE visit_date = '2024-01-01';
--
-- 3. If inserts are slow, consider:
--    - Dropping less critical indexes
--    - Using partial indexes (MySQL 8.0+)
--    - Batch inserts instead of single inserts
--
-- 4. Regular maintenance:
--    ANALYZE TABLE visits;
--    OPTIMIZE TABLE visits; (during low traffic)

-- ==========================================
-- VERIFY INDEXES
-- ==========================================

-- Check if indexes were created successfully
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX,
    CARDINALITY
FROM 
    INFORMATION_SCHEMA.STATISTICS
WHERE 
    TABLE_SCHEMA = 'phc_dashboard'
    AND TABLE_NAME IN ('visits', 'patients', 'doctors', 'clinic_rooms')
ORDER BY 
    TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

