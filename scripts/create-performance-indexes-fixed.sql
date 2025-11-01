-- Performance Indexes for High Traffic Optimization (FIXED VERSION)
-- Run this script to create indexes that improve query performance for 1000+ concurrent users
-- Fixed: Removed prefix length syntax that caused errors

USE phc_dashboard;

-- ==========================================
-- VISITS TABLE INDEXES
-- ==========================================

-- Index for date-based queries (most common filter)
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_visits_date_desc ON visits(visit_date DESC);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);

-- Index for patient name searches
CREATE INDEX IF NOT EXISTS idx_visits_patient_name ON visits(patient_name);

-- Index for doctor name searches
CREATE INDEX IF NOT EXISTS idx_visits_doctor_name ON visits(doctor_name);

-- Index for visit number searches
CREATE INDEX IF NOT EXISTS idx_visits_visit_number ON visits(visit_number);

-- Index for clinic searches
CREATE INDEX IF NOT EXISTS idx_visits_clinic ON visits(clinic);

-- Composite index for date + status (common query pattern)
CREATE INDEX IF NOT EXISTS idx_visits_date_status ON visits(visit_date, status);

-- Composite index for common filters
CREATE INDEX IF NOT EXISTS idx_visits_common ON visits(visit_date, status, clinic);

-- ==========================================
-- PATIENTS TABLE INDEXES
-- ==========================================

-- Index for name searches
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);

-- Index for NIK searches (IMPORTANT!)
CREATE INDEX IF NOT EXISTS idx_patients_nik ON patients(nik);

-- Index for MRN searches
CREATE INDEX IF NOT EXISTS idx_patients_mrn ON patients(mrn);

-- Index for external_id
CREATE INDEX IF NOT EXISTS idx_patients_external_id ON patients(external_id);

-- Composite index for common searches
CREATE INDEX IF NOT EXISTS idx_patients_search ON patients(name, nik);

-- ==========================================
-- DOCTORS TABLE INDEXES
-- ==========================================

-- Index for doctor name searches
CREATE INDEX IF NOT EXISTS idx_doctors_name ON doctors(name);

-- Index for availability
CREATE INDEX IF NOT EXISTS idx_doctors_available ON doctors(is_available_for_consultation);

-- Index for external_id
CREATE INDEX IF NOT EXISTS idx_doctors_external_id ON doctors(external_id);

-- ==========================================
-- CLINIC_ROOMS TABLE INDEXES
-- ==========================================

-- Index for room status queries
CREATE INDEX IF NOT EXISTS idx_clinic_rooms_status ON clinic_rooms(room_status);

-- Index for active rooms
CREATE INDEX IF NOT EXISTS idx_clinic_rooms_active ON clinic_rooms(is_active);

-- ==========================================
-- USERS TABLE INDEXES
-- ==========================================

-- Index for email lookups (login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index for role filtering
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Index for active users
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- ==========================================
-- VERIFY INDEXES CREATED
-- ==========================================

SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX,
    CARDINALITY,
    INDEX_TYPE
FROM 
    INFORMATION_SCHEMA.STATISTICS
WHERE 
    TABLE_SCHEMA = 'phc_dashboard'
    AND TABLE_NAME IN ('visits', 'patients', 'doctors', 'clinic_rooms', 'users')
    AND INDEX_NAME LIKE 'idx_%'
ORDER BY 
    TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- Show summary
SELECT 
    TABLE_NAME,
    COUNT(DISTINCT INDEX_NAME) as index_count
FROM 
    INFORMATION_SCHEMA.STATISTICS
WHERE 
    TABLE_SCHEMA = 'phc_dashboard'
    AND TABLE_NAME IN ('visits', 'patients', 'doctors', 'clinic_rooms', 'users')
    AND INDEX_NAME LIKE 'idx_%'
GROUP BY TABLE_NAME;

SELECT '✅ All indexes created successfully!' as status;

