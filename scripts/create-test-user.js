import bcrypt from 'bcryptjs';
import { query } from '../lib/db.js';

async function createTestUser() {
  try {
    const email = 'mobile@test.com';
    const password = 'mobile123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = ?', [email]);
    
    if (existingUser.length > 0) {
      console.log('✅ Test user already exists');
      console.log('Email:', email);
      console.log('Password:', password);
      return;
    }
    
    // Create new test user
    await query(`
      INSERT INTO users (name, email, password, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, ['Mobile Test User', email, hashedPassword, 'staff', 1]);
    
    console.log('✅ Test user created successfully');
    console.log('Email:', email);
    console.log('Password:', password);
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    process.exit(0);
  }
}

createTestUser();
