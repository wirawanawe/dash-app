import { query } from '../lib/db.js';
import bcrypt from 'bcryptjs';

const createDoctorUser = async () => {
  try {
    console.log('👨‍⚕️ Creating doctor user...');

    // Check if doctor user already exists
    const [existingUser] = await query('SELECT id FROM users WHERE email = ?', ['doctor@phc.com']);
    
    if (existingUser.length > 0) {
      console.log('✅ Doctor user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('doctor123', 10);

    // Create doctor user
    const [result] = await query(`
      INSERT INTO users (name, email, password, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      'Dr. Sarah Johnson',
      'doctor@phc.com',
      hashedPassword,
      'doctor',
      true
    ]);

    console.log('✅ Doctor user created successfully!');
    console.log(`📧 Email: doctor@phc.com`);
    console.log(`🔑 Password: doctor123`);
    console.log(`🆔 User ID: ${result.insertId}`);

    // Also create a doctor record in doctors table if not exists
    const [existingDoctor] = await query('SELECT id FROM doctors WHERE email = ?', ['doctor@phc.com']);
    
    if (existingDoctor.length === 0) {
      const [doctorResult] = await query(`
        INSERT INTO doctors (name, specialist, license_number, email, phone, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        'Dr. Sarah Johnson',
        'Dokter Umum',
        'SIP.001.2024',
        'doctor@phc.com',
        '+628123456789'
      ]);

      console.log('✅ Doctor record created in doctors table');
      console.log(`🆔 Doctor ID: ${doctorResult.insertId}`);
    } else {
      console.log('✅ Doctor record already exists in doctors table');
    }

  } catch (error) {
    console.error('❌ Error creating doctor user:', error);
  }
};

// Run the script
createDoctorUser()
  .then(() => {
    console.log('✅ Doctor user creation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Doctor user creation failed:', error);
    process.exit(1);
  }); 