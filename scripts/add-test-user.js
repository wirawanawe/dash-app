import { query } from '../lib/db.js';
import bcrypt from 'bcryptjs';

async function addTestUser() {
  try {
    console.log('Checking if test user exists...');
    
    // Check if user with ID 1 exists
    const existingUser = await query('SELECT id, name, email FROM mobile_users WHERE id = ?', [1]);
    
    if (existingUser.length > 0) {
      console.log('✅ Test user already exists:', existingUser[0]);
      return;
    }
    
    // Hash password untuk test user
    const hashedPassword = await bcrypt.hash('hashedpassword123', 10);
    
    // Add test user
    const result = await query(`
      INSERT INTO mobile_users (id, name, email, phone, password, is_active) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      1, 
      'Test User', 
      'test@example.com', 
      '+1234567890', 
      hashedPassword, 
      true
    ]);
    
    console.log('✅ Test user created successfully with ID:', result.insertId);
    
  } catch (error) {
    console.error('❌ Error adding test user:', error);
  }
}

// Run the function
addTestUser().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
