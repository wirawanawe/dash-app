import bcrypt from 'bcryptjs';
import { query } from '../lib/db.js';

async function createMobileTestUser() {
  try {
    const email = 'mobile@test.com';
    const password = 'mobile123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user already exists
    const existingUser = await query('SELECT id FROM mobile_users WHERE email = ?', [email]);
    
    if (existingUser.length > 0) {
      console.log('✅ Mobile test user already exists');
      console.log('Email:', email);
      console.log('Password:', password);
      return;
    }
    
    // Create new mobile test user
    await query(`
      INSERT INTO mobile_users (name, email, phone, password, date_of_birth, gender, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, ['Mobile Test User', email, '1234567890', hashedPassword, '1990-01-01', 'male', 1]);
    
    console.log('✅ Mobile test user created successfully');
    console.log('Email:', email);
    console.log('Password:', password);
    
  } catch (error) {
    console.error('❌ Error creating mobile test user:', error);
  } finally {
    process.exit(0);
  }
}

createMobileTestUser();
