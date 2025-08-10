-- Create medicine/drug table (medicines) with clinic relationships
-- This table stores medicine/drug information for each clinic

USE phc_dashboard;

-- Create medicines table (Medicine/Drug table)
CREATE TABLE IF NOT EXISTS medicines (
    ElementDetailKey INT AUTO_INCREMENT PRIMARY KEY,
    clinic_id INT NOT NULL,
    Detail VARCHAR(50) NULL,
    DetailDescription VARCHAR(100) DEFAULT '' NOT NULL,
    HNA FLOAT(53) DEFAULT 0 NOT NULL,
    HNAJual FLOAT(53) DEFAULT 0 NOT NULL,
    SmallUnit VARCHAR(50) DEFAULT '' NOT NULL,
    MediumUnit CHAR(10) DEFAULT '' NOT NULL,
    LargeUnit CHAR(10) DEFAULT '' NOT NULL,
    factor_3 REAL DEFAULT 1 NOT NULL,
    QtyMin INT DEFAULT 0 NOT NULL,
    UserIDInput VARCHAR(10) NULL,
    UserIDModify VARCHAR(10) NULL,
    Berlaku BIT DEFAULT 1 NOT NULL,
    GCRecord BIT DEFAULT 0 NOT NULL,
    ReffID VARCHAR(30) NULL,
    KFA_Code VARCHAR(20) NULL,
    IsSyncServerPHC BIT DEFAULT 0 NOT NULL,
    APLN_Code VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key relationship with clinics table
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    
    -- Indexes for better performance
    INDEX idx_clinic_id (clinic_id),
    INDEX idx_detail (Detail),
    INDEX idx_kfa_code (KFA_Code),
    INDEX idx_apln_code (APLN_Code),
    INDEX idx_berlaku (Berlaku),
    INDEX idx_created_at (created_at)
);

-- Insert sample medicine data for testing
INSERT INTO medicines (clinic_id, Detail, DetailDescription, HNA, HNAJual, SmallUnit, MediumUnit, LargeUnit, factor_3, QtyMin, KFA_Code, APLN_Code, UserIDInput) VALUES
-- Clinic 1 Medicines
(1, 'PARACETAMOL 500MG', 'Paracetamol 500mg Tablet - Obat pereda nyeri dan demam', 0.50, 0.75, 'Tablet', 'Strip', 'Box', 10, 1, 'PAR001', 'APL001', 'SYSTEM'),
(1, 'AMOXICILLIN 500MG', 'Amoxicillin 500mg Capsule - Antibiotik untuk infeksi bakteri', 1.20, 1.80, 'Capsule', 'Strip', 'Box', 10, 1, 'AMO001', 'APL002', 'SYSTEM'),
(1, 'IBUPROFEN 400MG', 'Ibuprofen 400mg Tablet - Obat anti inflamasi non steroid', 0.80, 1.20, 'Tablet', 'Strip', 'Box', 10, 1, 'IBU001', 'APL003', 'SYSTEM'),
(1, 'CETIRIZINE 10MG', 'Cetirizine 10mg Tablet - Antihistamin untuk alergi', 1.50, 2.25, 'Tablet', 'Strip', 'Box', 10, 1, 'CET001', 'APL004', 'SYSTEM'),
(1, 'OMEPRAZOLE 20MG', 'Omeprazole 20mg Capsule - Obat untuk asam lambung', 2.00, 3.00, 'Capsule', 'Strip', 'Box', 10, 1, 'OME001', 'APL005', 'SYSTEM'),
(1, 'METFORMIN 500MG', 'Metformin 500mg Tablet - Obat diabetes tipe 2', 1.80, 2.70, 'Tablet', 'Strip', 'Box', 10, 1, 'MET001', 'APL006', 'SYSTEM'),
(1, 'LOSARTAN 50MG', 'Losartan 50mg Tablet - Obat tekanan darah tinggi', 2.50, 3.75, 'Tablet', 'Strip', 'Box', 10, 1, 'LOS001', 'APL007', 'SYSTEM'),
(1, 'SIMVASTATIN 20MG', 'Simvastatin 20mg Tablet - Obat kolesterol', 3.00, 4.50, 'Tablet', 'Strip', 'Box', 10, 1, 'SIM001', 'APL008', 'SYSTEM'),
(1, 'AMLODIPINE 5MG', 'Amlodipine 5mg Tablet - Obat tekanan darah tinggi', 1.75, 2.62, 'Tablet', 'Strip', 'Box', 10, 1, 'AML001', 'APL009', 'SYSTEM'),
(1, 'FOLIC ACID 5MG', 'Folic Acid 5mg Tablet - Suplemen asam folat', 0.30, 0.45, 'Tablet', 'Strip', 'Box', 10, 1, 'FOL001', 'APL010', 'SYSTEM'),

-- Clinic 2 Medicines
(2, 'PARACETAMOL 500MG', 'Paracetamol 500mg Tablet - Obat pereda nyeri dan demam', 0.55, 0.80, 'Tablet', 'Strip', 'Box', 10, 1, 'PAR001', 'APL001', 'SYSTEM'),
(2, 'CETIRIZINE 10MG', 'Cetirizine 10mg Tablet - Antihistamin untuk alergi', 1.60, 2.40, 'Tablet', 'Strip', 'Box', 10, 1, 'CET001', 'APL004', 'SYSTEM'),
(2, 'OMEPRAZOLE 20MG', 'Omeprazole 20mg Capsule - Obat untuk asam lambung', 2.10, 3.15, 'Capsule', 'Strip', 'Box', 10, 1, 'OME001', 'APL005', 'SYSTEM'),
(2, 'METFORMIN 500MG', 'Metformin 500mg Tablet - Obat diabetes tipe 2', 1.90, 2.85, 'Tablet', 'Strip', 'Box', 10, 1, 'MET001', 'APL006', 'SYSTEM'),
(2, 'LOSARTAN 50MG', 'Losartan 50mg Tablet - Obat tekanan darah tinggi', 2.60, 3.90, 'Tablet', 'Strip', 'Box', 10, 1, 'LOS001', 'APL007', 'SYSTEM'),
(2, 'SIMVASTATIN 20MG', 'Simvastatin 20mg Tablet - Obat kolesterol', 3.10, 4.65, 'Tablet', 'Strip', 'Box', 10, 1, 'SIM001', 'APL008', 'SYSTEM'),
(2, 'AMLODIPINE 5MG', 'Amlodipine 5mg Tablet - Obat tekanan darah tinggi', 1.85, 2.77, 'Tablet', 'Strip', 'Box', 10, 1, 'AML001', 'APL009', 'SYSTEM'),
(2, 'FOLIC ACID 5MG', 'Folic Acid 5mg Tablet - Suplemen asam folat', 0.35, 0.52, 'Tablet', 'Strip', 'Box', 10, 1, 'FOL001', 'APL010', 'SYSTEM'),
(2, 'VITAMIN C 1000MG', 'Vitamin C 1000mg Tablet - Suplemen vitamin C', 0.75, 1.12, 'Tablet', 'Strip', 'Box', 10, 1, 'VIT001', 'APL011', 'SYSTEM'),
(2, 'CALCIUM 500MG', 'Calcium 500mg Tablet - Suplemen kalsium', 1.25, 1.87, 'Tablet', 'Strip', 'Box', 10, 1, 'CAL001', 'APL012', 'SYSTEM'),

-- Clinic 3 Medicines (if exists)
(3, 'PARACETAMOL 500MG', 'Paracetamol 500mg Tablet - Obat pereda nyeri dan demam', 0.52, 0.78, 'Tablet', 'Strip', 'Box', 10, 1, 'PAR001', 'APL001', 'SYSTEM'),
(3, 'AMOXICILLIN 500MG', 'Amoxicillin 500mg Capsule - Antibiotik untuk infeksi bakteri', 1.25, 1.87, 'Capsule', 'Strip', 'Box', 10, 1, 'AMO001', 'APL002', 'SYSTEM'),
(3, 'IBUPROFEN 400MG', 'Ibuprofen 400mg Tablet - Obat anti inflamasi non steroid', 0.85, 1.27, 'Tablet', 'Strip', 'Box', 10, 1, 'IBU001', 'APL003', 'SYSTEM'),
(3, 'CETIRIZINE 10MG', 'Cetirizine 10mg Tablet - Antihistamin untuk alergi', 1.55, 2.32, 'Tablet', 'Strip', 'Box', 10, 1, 'CET001', 'APL004', 'SYSTEM'),
(3, 'OMEPRAZOLE 20MG', 'Omeprazole 20mg Capsule - Obat untuk asam lambung', 2.05, 3.07, 'Capsule', 'Strip', 'Box', 10, 1, 'OME001', 'APL005', 'SYSTEM');

-- Create view for easier querying of medicine data with clinic information
CREATE OR REPLACE VIEW v_medicine_with_clinic AS
SELECT 
    fp.ElementDetailKey,
    fp.clinic_id,
    c.name as clinic_name,
    fp.Detail,
    fp.DetailDescription,
    fp.HNA,
    fp.HNAJual,
    fp.SmallUnit,
    fp.MediumUnit,
    fp.LargeUnit,
    fp.factor_3,
    fp.QtyMin,
    fp.UserIDInput,
    fp.UserIDModify,
    fp.Berlaku,
    fp.GCRecord,
    fp.ReffID,
    fp.KFA_Code,
    fp.IsSyncServerPHC,
    fp.APLN_Code,
    fp.created_at,
    fp.updated_at
FROM medicines fp
LEFT JOIN clinics c ON fp.clinic_id = c.id
WHERE fp.Berlaku = 1 AND fp.GCRecord = 0;

-- Create stored procedure for adding new medicine
DELIMITER //
CREATE PROCEDURE AddMedicine(
    IN p_clinic_id INT,
    IN p_detail VARCHAR(50),
    IN p_detail_description VARCHAR(100),
    IN p_hna FLOAT,
    IN p_hna_jual FLOAT,
    IN p_small_unit VARCHAR(50),
    IN p_medium_unit CHAR(10),
    IN p_large_unit CHAR(10),
    IN p_factor_3 REAL,
    IN p_qty_min INT,
    IN p_user_id_input VARCHAR(10),
    IN p_kfa_code VARCHAR(20),
    IN p_apln_code VARCHAR(20)
)
BEGIN
    INSERT INTO medicines (
        clinic_id, Detail, DetailDescription, HNA, HNAJual, 
        SmallUnit, MediumUnit, LargeUnit, factor_3, QtyMin, 
        UserIDInput, KFA_Code, APLN_Code
    ) VALUES (
        p_clinic_id, p_detail, p_detail_description, p_hna, p_hna_jual,
        p_small_unit, p_medium_unit, p_large_unit, p_factor_3, p_qty_min,
        p_user_id_input, p_kfa_code, p_apln_code
    );
    
    SELECT LAST_INSERT_ID() as new_medicine_id;
END //
DELIMITER ;

-- Create stored procedure for updating medicine
DELIMITER //
CREATE PROCEDURE UpdateMedicine(
    IN p_element_detail_key INT,
    IN p_detail VARCHAR(50),
    IN p_detail_description VARCHAR(100),
    IN p_hna FLOAT,
    IN p_hna_jual FLOAT,
    IN p_small_unit VARCHAR(50),
    IN p_medium_unit CHAR(10),
    IN p_large_unit CHAR(10),
    IN p_factor_3 REAL,
    IN p_qty_min INT,
    IN p_user_id_modify VARCHAR(10),
    IN p_kfa_code VARCHAR(20),
    IN p_apln_code VARCHAR(20)
)
BEGIN
    UPDATE medicines SET
        Detail = p_detail,
        DetailDescription = p_detail_description,
        HNA = p_hna,
        HNAJual = p_hna_jual,
        SmallUnit = p_small_unit,
        MediumUnit = p_medium_unit,
        LargeUnit = p_large_unit,
        factor_3 = p_factor_3,
        QtyMin = p_qty_min,
        UserIDModify = p_user_id_modify,
        KFA_Code = p_kfa_code,
        APLN_Code = p_apln_code,
        updated_at = CURRENT_TIMESTAMP
    WHERE ElementDetailKey = p_element_detail_key;
END //
DELIMITER ;

-- Create stored procedure for soft delete medicine (set Berlaku = 0)
DELIMITER //
CREATE PROCEDURE DeactivateMedicine(
    IN p_element_detail_key INT,
    IN p_user_id_modify VARCHAR(10)
)
BEGIN
    UPDATE medicines SET
        Berlaku = 0,
        UserIDModify = p_user_id_modify,
        updated_at = CURRENT_TIMESTAMP
    WHERE ElementDetailKey = p_element_detail_key;
END //
DELIMITER ;

-- Create stored procedure for hard delete medicine (set GCRecord = 1)
DELIMITER //
CREATE PROCEDURE DeleteMedicine(
    IN p_element_detail_key INT,
    IN p_user_id_modify VARCHAR(10)
)
BEGIN
    UPDATE medicines SET
        GCRecord = 1,
        UserIDModify = p_user_id_modify,
        updated_at = CURRENT_TIMESTAMP
    WHERE ElementDetailKey = p_element_detail_key;
END //
DELIMITER ; 