-- Add sample mobile users for testing
-- This script adds some sample mobile users to test the dashboard

INSERT INTO phc_dashboard.mobile_users (
    name, email, phone, password, date_of_birth, gender, 
    height, weight, is_active, created_at, updated_at
) VALUES
('John Doe', 'john.doe@example.com', '+6281234567890', 'password123', '1990-05-15', 'male', 175.5, 70.2, 1, NOW(), NOW()),
('Jane Smith', 'jane.smith@example.com', '+6281234567891', 'password123', '1992-08-20', 'female', 162.0, 55.8, 1, NOW(), NOW()),
('Ahmad Rahman', 'ahmad.rahman@example.com', '+6281234567892', 'password123', '1988-12-10', 'male', 170.0, 68.5, 1, NOW(), NOW()),
('Siti Nurhaliza', 'siti.nurhaliza@example.com', '+6281234567893', 'password123', '1995-03-25', 'female', 158.5, 52.3, 1, NOW(), NOW()),
('Budi Santoso', 'budi.santoso@example.com', '+6281234567894', 'password123', '1985-07-08', 'male', 168.0, 72.1, 1, NOW(), NOW()),
('Dewi Sartika', 'dewi.sartika@example.com', '+6281234567895', 'password123', '1993-11-30', 'female', 165.0, 58.7, 1, NOW(), NOW()),
('Rudi Hermawan', 'rudi.hermawan@example.com', '+6281234567896', 'password123', '1991-04-12', 'male', 172.5, 69.8, 1, NOW(), NOW()),
('Maya Indah', 'maya.indah@example.com', '+6281234567897', 'password123', '1994-09-18', 'female', 160.0, 54.2, 1, NOW(), NOW()),
('Agus Setiawan', 'agus.setiawan@example.com', '+6281234567898', 'password123', '1987-06-22', 'male', 169.0, 71.5, 1, NOW(), NOW()),
('Rina Marlina', 'rina.marlina@example.com', '+6281234567899', 'password123', '1996-01-14', 'female', 163.5, 56.9, 1, NOW(), NOW());

-- Add some sample user missions
INSERT INTO phc_dashboard.user_missions (
    user_id, mission_id, status, progress, start_date, created_at, updated_at
) VALUES
(1, 1, 'active', 60, NOW(), NOW(), NOW()),
(1, 2, 'completed', 100, DATE_SUB(NOW(), INTERVAL 7 DAY), NOW(), NOW()),
(2, 1, 'active', 80, NOW(), NOW(), NOW()),
(2, 3, 'active', 45, NOW(), NOW(), NOW()),
(3, 1, 'completed', 100, DATE_SUB(NOW(), INTERVAL 14 DAY), NOW(), NOW()),
(3, 4, 'active', 30, NOW(), NOW(), NOW()),
(4, 2, 'active', 70, NOW(), NOW(), NOW()),
(5, 1, 'active', 90, NOW(), NOW(), NOW()),
(6, 3, 'completed', 100, DATE_SUB(NOW(), INTERVAL 5 DAY), NOW(), NOW()),
(7, 1, 'active', 25, NOW(), NOW(), NOW());

-- Show results
SELECT 'Sample mobile users added successfully!' as status;
SELECT COUNT(*) as total_mobile_users FROM phc_dashboard.mobile_users;
SELECT COUNT(*) as total_user_missions FROM phc_dashboard.user_missions; 