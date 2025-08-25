import { query } from './lib/db.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function createTestUser() {
  try {
    console.log('🧪 Creating test user...\n');
    
    const email = 'test@mobile.com';
    const password = 'password123';
    const name = 'Test User';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('🔐 Hashed password:', hashedPassword.substring(0, 20) + '...');
    
    // Check if user already exists
    const existingUser = await query('SELECT id FROM mobile_users WHERE email = ?', [email]);
    
    if (existingUser.length > 0) {
      console.log('⚠️ User already exists, updating password...');
      
      // Update the password
      await query('UPDATE mobile_users SET password = ? WHERE email = ?', [hashedPassword, email]);
      console.log('✅ Password updated successfully');
    } else {
      console.log('➕ Creating new user...');
      
      // Create new user
      await query(`
        INSERT INTO mobile_users (name, email, password, phone, date_of_birth, gender, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [name, email, hashedPassword, '08123456789', '1990-01-01', 'male', 1]);
      
      console.log('✅ User created successfully');
    }
    
    // Verify the user was created/updated
    const user = await query('SELECT id, name, email FROM mobile_users WHERE email = ?', [email]);
    console.log('👤 User in database:', user[0]);
    
    // Test login with the new user
    console.log('\n🧪 Testing login with new user...');
    const loginUser = await query(`
      SELECT mu.id, mu.name, mu.email, mu.password, mu.phone, mu.date_of_birth, mu.gender, 
             mu.is_active, mu.ktp_number, mu.address, mu.insurance, mu.insurance_card_number,
             MAX(CASE WHEN hd.data_type = 'height' THEN hd.value END) as height,
             MAX(CASE WHEN hd.data_type = 'weight' THEN hd.value END) as weight
      FROM mobile_users mu
      LEFT JOIN health_data hd ON mu.id = hd.user_id AND hd.data_type IN ('height', 'weight')
      WHERE mu.email = ?
      GROUP BY mu.id
    `, [email]);
    
    if (loginUser.length > 0) {
      const user = loginUser[0];
      console.log('✅ User found for login');
      console.log('📋 User data:', {
        id: user.id,
        name: user.name,
        email: user.email,
        is_active: user.is_active
      });
      
      // Test password verification
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('🔐 Password verification:', isPasswordValid ? '✅ SUCCESS' : '❌ FAILED');
      
    } else {
      console.log('❌ User not found for login');
    }
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  }
}

createTestUser();
