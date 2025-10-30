-- Script untuk membuat user dokter untuk testing fitur chat
-- Jalankan script ini di database MySQL

-- 1. Buat user dokter di tabel users
INSERT INTO users (name, email, password, role, is_active, created_at, updated_at) 
VALUES (
    'Dr. Sarah Johnson',
    'doctor@phc.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: doctor123
    'doctor',
    true,
    NOW(),
    NOW()
);

-- 2. Buat record dokter di tabel doctors (jika belum ada)
INSERT INTO doctors (name, specialist, license_number, email, phone, created_at, updated_at)
VALUES (
    'Dr. Sarah Johnson',
    'Dokter Umum',
    'SIP.001.2024',
    'doctor@phc.com',
    '+628123456789',
    NOW(),
    NOW()
);

-- 3. Buat beberapa mobile users untuk testing chat
INSERT INTO mobile_users (name, email, phone, password, is_active, created_at, updated_at)
VALUES 
    ('John Doe', 'john@example.com', '+628123456001', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, NOW(), NOW()),
    ('Jane Smith', 'jane@example.com', '+628123456002', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, NOW(), NOW()),
    ('Bob Wilson', 'bob@example.com', '+628123456003', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, NOW(), NOW()),
    ('Alice Brown', 'alice@example.com', '+628123456004', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, NOW(), NOW()),
    ('Charlie Davis', 'charlie@example.com', '+628123456005', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, NOW(), NOW());

-- 4. Verifikasi data yang dibuat
SELECT 'Users table:' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Doctors table:' as table_name, COUNT(*) as count FROM doctors
UNION ALL
SELECT 'Mobile users table:' as table_name, COUNT(*) as count FROM mobile_users;

-- 5. Tampilkan user dokter yang dibuat
SELECT id, name, email, role FROM users WHERE email = 'doctor@phc.com';

-- 6. Tampilkan mobile users yang dibuat
SELECT id, name, email, phone FROM mobile_users LIMIT 5; 