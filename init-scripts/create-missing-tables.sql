-- Create missing tables for mobile app functionality

-- Create services table
CREATE TABLE IF NOT EXISTS phc_dashboard.services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    duration_minutes INT DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS phc_dashboard.bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    clinic_id INT NOT NULL,
    service_id INT,
    doctor_id INT,
    booking_date DATE NOT NULL,
    booking_time TIME,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
);

-- Create consultations table
CREATE TABLE IF NOT EXISTS phc_dashboard.consultations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    doctor_id INT NOT NULL,
    consultation_date DATE NOT NULL,
    consultation_time TIME,
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    diagnosis TEXT,
    prescription TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- Create assessments table
CREATE TABLE IF NOT EXISTS phc_dashboard.assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    assessment_type ENUM('health_risk', 'nutrition', 'fitness', 'mental_health', 'sleep') NOT NULL,
    score DECIMAL(5,2),
    result_category ENUM('low', 'medium', 'high') NOT NULL,
    recommendations TEXT,
    assessment_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE
);

-- Create indexes for better performance (ignore errors if they already exist)
CREATE INDEX idx_bookings_user_date ON phc_dashboard.bookings(user_id, booking_date);
CREATE INDEX idx_consultations_user_date ON phc_dashboard.consultations(user_id, consultation_date);
CREATE INDEX idx_assessments_user_type ON phc_dashboard.assessments(user_id, assessment_type);

-- Insert some sample services
INSERT IGNORE INTO phc_dashboard.services (name, description, price, duration_minutes) VALUES
('General Consultation', 'General health consultation with doctor', 150000.00, 30),
('Specialist Consultation', 'Specialist doctor consultation', 250000.00, 45),
('Laboratory Test', 'Blood test and other laboratory examinations', 300000.00, 60),
('Vaccination', 'Vaccination service', 200000.00, 30),
('Health Check-up', 'Comprehensive health check-up', 500000.00, 90);

-- Insert some sample clinics if they don't exist
INSERT IGNORE INTO phc_dashboard.clinics (name, address, city, phone, rating) VALUES
('Klinik Sehat', 'Jl. Sudirman No. 123', 'Jakarta', '021-555-0123', 4.5),
('Rumah Sakit Umum', 'Jl. Thamrin No. 456', 'Jakarta', '021-555-0456', 4.8),
('Puskesmas Central', 'Jl. Gatot Subroto No. 789', 'Jakarta', '021-555-0789', 4.2);

-- Insert some sample doctors if they don't exist
INSERT IGNORE INTO phc_dashboard.doctors (name, specialist, phone, email, is_active) VALUES
('Dr. Sarah Johnson', 'General Practitioner', '081-234-5678', 'sarah.johnson@clinic.com', 1),
('Dr. Michael Chen', 'Cardiologist', '081-234-5679', 'michael.chen@clinic.com', 1),
('Dr. Lisa Wang', 'Pediatrician', '081-234-5680', 'lisa.wang@clinic.com', 1);

COMMIT; 