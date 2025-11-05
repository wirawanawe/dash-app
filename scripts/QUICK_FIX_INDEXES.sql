-- QUICK FIX: Essential Indexes Only (No Errors)
-- Run this in production server to fix slow loading

USE phc_dashboard;

-- ==========================================
-- VISITS TABLE (MOST IMPORTANT!)
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_patient_name ON visits(patient_name);
CREATE INDEX IF NOT EXISTS idx_visits_doctor_name ON visits(doctor_name);
CREATE INDEX IF NOT EXISTS idx_visits_visit_number ON visits(visit_number);
CREATE INDEX IF NOT EXISTS idx_visits_date_status ON visits(visit_date, status);

-- ==========================================
-- PATIENTS TABLE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
CREATE INDEX IF NOT EXISTS idx_patients_nik ON patients(nik);

-- ==========================================
-- DOCTORS TABLE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_doctors_name ON doctors(name);

-- ==========================================
-- USERS TABLE (for login speed)
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ==========================================
-- VERIFY
-- ==========================================
SELECT '✅ Essential indexes created!' as status;

-- Show created indexes
SHOW INDEX FROM visits WHERE Key_name LIKE 'idx_%';
SHOW INDEX FROM patients WHERE Key_name LIKE 'idx_%';
SHOW INDEX FROM doctors WHERE Key_name LIKE 'idx_%';
SHOW INDEX FROM users WHERE Key_name LIKE 'idx_%';

